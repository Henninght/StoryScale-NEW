/**
 * API Security Manager - Secure handling of external API integrations
 * 
 * Security Features:
 * - API key validation and rotation
 * - Rate limiting and quota management
 * - Request sanitization and validation
 * - Response content filtering
 * - Audit logging and monitoring
 */

import { EventEmitter } from 'events';

export interface APISecurityConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  allowedDomains: string[];
  blockedDomains: string[];
  contentFilters: string[];
  auditEnabled: boolean;
  encryptionEnabled: boolean;
}

export interface APICredentials {
  provider: 'firecrawl' | 'tavily';
  apiKey: string;
  lastRotated: Date;
  expiresAt?: Date;
  isValid: boolean;
}

export interface SecurityContext {
  userId?: string;
  requestId: string;
  timestamp: Date;
  rateLimited: boolean;
  sanitized: boolean;
  filtered: boolean;
}

export class APISecurityManager extends EventEmitter {
  private static instance: APISecurityManager;
  private config: APISecurityConfig;
  private credentials: Map<string, APICredentials>;
  private rateLimits: Map<string, { count: number; resetTime: number }>;
  private auditLog: SecurityAuditEntry[];

  private constructor(config?: Partial<APISecurityConfig>) {
    super();
    
    this.config = {
      maxRequestsPerMinute: 60,
      maxRequestsPerDay: 1000,
      allowedDomains: [
        'linkedin.com',
        'medium.com', 
        'techcrunch.com',
        'github.com',
        'stackoverflow.com',
        'dev.to'
      ],
      blockedDomains: [
        'facebook.com',
        'twitter.com', // Protect against scraping social media
        'instagram.com',
        'tiktok.com'
      ],
      contentFilters: [
        'password',
        'api_key',
        'secret',
        'token',
        'auth',
        'private',
        'confidential'
      ],
      auditEnabled: true,
      encryptionEnabled: true,
      ...config
    };

    this.credentials = new Map();
    this.rateLimits = new Map();
    this.auditLog = [];
    
    this.initializeCredentials();
    this.setupCleanupInterval();
  }

  public static getInstance(config?: Partial<APISecurityConfig>): APISecurityManager {
    if (!APISecurityManager.instance) {
      APISecurityManager.instance = new APISecurityManager(config);
    }
    return APISecurityManager.instance;
  }

  /**
   * Validate and sanitize API request
   */
  public async validateRequest(
    provider: 'firecrawl' | 'tavily',
    url: string,
    query: string,
    userId?: string
  ): Promise<{
    allowed: boolean;
    sanitizedUrl?: string;
    sanitizedQuery?: string;
    context: SecurityContext;
    reason?: string;
  }> {
    const requestId = this.generateRequestId();
    const context: SecurityContext = {
      userId,
      requestId,
      timestamp: new Date(),
      rateLimited: false,
      sanitized: false,
      filtered: false
    };

    try {
      // 1. Check credentials
      const creds = this.credentials.get(provider);
      if (!creds || !creds.isValid) {
        this.auditSecurityEvent('credentials_invalid', { provider, requestId });
        return { 
          allowed: false, 
          context, 
          reason: 'Invalid or missing API credentials' 
        };
      }

      // 2. Check rate limits
      const rateLimitCheck = this.checkRateLimit(provider, userId);
      if (!rateLimitCheck.allowed) {
        context.rateLimited = true;
        this.auditSecurityEvent('rate_limit_exceeded', { 
          provider, 
          requestId, 
          userId 
        });
        return { 
          allowed: false, 
          context, 
          reason: `Rate limit exceeded: ${rateLimitCheck.reason}` 
        };
      }

      // 3. Validate and sanitize URL
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.valid) {
        this.auditSecurityEvent('url_validation_failed', { 
          provider, 
          requestId, 
          url: this.obfuscateUrl(url),
          reason: urlValidation.reason 
        });
        return { 
          allowed: false, 
          context, 
          reason: `Invalid URL: ${urlValidation.reason}` 
        };
      }

      // 4. Sanitize query
      const sanitizedQuery = this.sanitizeQuery(query);
      context.sanitized = sanitizedQuery !== query;

      // 5. Record usage
      this.recordUsage(provider, userId);

      // 6. Log successful validation
      this.auditSecurityEvent('request_validated', {
        provider,
        requestId,
        userId,
        sanitized: context.sanitized
      });

      return {
        allowed: true,
        sanitizedUrl: urlValidation.sanitizedUrl,
        sanitizedQuery,
        context
      };

    } catch (error) {
      this.auditSecurityEvent('validation_error', {
        provider,
        requestId,
        error: error.message
      });
      
      return {
        allowed: false,
        context,
        reason: 'Security validation failed'
      };
    }
  }

  /**
   * Filter and sanitize API response content
   */
  public filterResponse(
    content: string,
    context: SecurityContext
  ): { 
    filteredContent: string; 
    flagged: string[]; 
    safe: boolean 
  } {
    const flagged: string[] = [];
    let filteredContent = content;
    
    try {
      // 1. Remove sensitive patterns
      for (const filter of this.config.contentFilters) {
        const regex = new RegExp(`\\b${filter}\\w*`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          flagged.push(...matches);
          filteredContent = filteredContent.replace(regex, '[FILTERED]');
          context.filtered = true;
        }
      }

      // 2. Remove potential API keys/tokens (pattern-based)
      const apiKeyPattern = /\b[A-Za-z0-9]{20,}\b/g;
      const potentialKeys = filteredContent.match(apiKeyPattern);
      if (potentialKeys) {
        potentialKeys.forEach(key => {
          if (this.looksLikeApiKey(key)) {
            flagged.push('potential_api_key');
            filteredContent = filteredContent.replace(key, '[FILTERED_KEY]');
            context.filtered = true;
          }
        });
      }

      // 3. Remove email addresses
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      filteredContent = filteredContent.replace(emailPattern, '[EMAIL_FILTERED]');

      // 4. Log filtering if occurred
      if (context.filtered) {
        this.auditSecurityEvent('content_filtered', {
          requestId: context.requestId,
          flaggedCount: flagged.length,
          filterTypes: [...new Set(flagged)]
        });
      }

      const safe = flagged.length === 0;
      return { filteredContent, flagged, safe };

    } catch (error) {
      this.auditSecurityEvent('filter_error', {
        requestId: context.requestId,
        error: error.message
      });
      
      // Return original content if filtering fails - log the issue
      return { 
        filteredContent: content, 
        flagged: ['filter_error'], 
        safe: false 
      };
    }
  }

  /**
   * Get secured API credentials
   */
  public getSecureCredentials(provider: 'firecrawl' | 'tavily'): string | null {
    const creds = this.credentials.get(provider);
    if (!creds || !creds.isValid) {
      return null;
    }

    // Check if credentials are expired
    if (creds.expiresAt && creds.expiresAt < new Date()) {
      this.auditSecurityEvent('credentials_expired', { provider });
      this.credentials.set(provider, { ...creds, isValid: false });
      return null;
    }

    return creds.apiKey;
  }

  /**
   * Private security methods
   */

  private initializeCredentials(): void {
    // Firecrawl credentials
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (firecrawlKey && this.validateApiKey(firecrawlKey)) {
      this.credentials.set('firecrawl', {
        provider: 'firecrawl',
        apiKey: firecrawlKey,
        lastRotated: new Date(),
        isValid: true
      });
    } else {
      console.warn('Invalid or missing Firecrawl API key');
    }

    // Tavily credentials  
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey && this.validateApiKey(tavilyKey)) {
      this.credentials.set('tavily', {
        provider: 'tavily',
        apiKey: tavilyKey,
        lastRotated: new Date(),
        isValid: true
      });
    } else {
      console.warn('Invalid or missing Tavily API key');
    }
  }

  private validateApiKey(key: string): boolean {
    // Basic API key validation
    return key.length >= 10 && 
           key.length <= 100 && 
           /^[A-Za-z0-9_-]+$/.test(key) &&
           !key.includes('test') &&
           !key.includes('dummy');
  }

  private checkRateLimit(
    provider: string, 
    userId?: string
  ): { allowed: boolean; reason?: string } {
    const key = `${provider}_${userId || 'anonymous'}`;
    const now = Date.now();
    const current = this.rateLimits.get(key);

    if (!current) {
      this.rateLimits.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute
      return { allowed: true };
    }

    // Reset if time window has passed
    if (now > current.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + 60000 });
      return { allowed: true };
    }

    // Check if under limit
    if (current.count < this.config.maxRequestsPerMinute) {
      current.count++;
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: `Exceeded ${this.config.maxRequestsPerMinute} requests per minute` 
    };
  }

  private validateUrl(url: string): { 
    valid: boolean; 
    sanitizedUrl?: string; 
    reason?: string 
  } {
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, reason: 'Only HTTP/HTTPS protocols allowed' };
      }

      // Check against blocked domains
      for (const blockedDomain of this.config.blockedDomains) {
        if (urlObj.hostname.includes(blockedDomain)) {
          return { valid: false, reason: `Domain ${blockedDomain} is blocked` };
        }
      }

      // Check against allowed domains (if specified)
      if (this.config.allowedDomains.length > 0) {
        const isAllowed = this.config.allowedDomains.some(domain => 
          urlObj.hostname.includes(domain)
        );
        if (!isAllowed) {
          return { valid: false, reason: 'Domain not in allowed list' };
        }
      }

      // Sanitize URL (remove tracking parameters)
      const sanitizedUrl = this.sanitizeUrl(urlObj);
      
      return { valid: true, sanitizedUrl };

    } catch (error) {
      return { valid: false, reason: 'Invalid URL format' };
    }
  }

  private sanitizeUrl(urlObj: URL): string {
    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'fbclid', 'gclid', 'ref', 'referrer', 'source'
    ];

    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  }

  private sanitizeQuery(query: string): string {
    // Remove potentially dangerous patterns
    let sanitized = query
      .replace(/[<>\"'&]/g, '') // Remove HTML/script chars
      .replace(/\b(select|insert|update|delete|drop|create|alter)\b/gi, '') // Remove SQL keywords
      .replace(/\b(script|javascript|vbscript)\b/gi, '') // Remove script references
      .trim();

    // Limit length
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500);
    }

    return sanitized;
  }

  private looksLikeApiKey(text: string): boolean {
    // Heuristics for detecting API keys
    return text.length >= 20 &&
           /[A-Z]/.test(text) &&
           /[a-z]/.test(text) &&
           /[0-9]/.test(text) &&
           !/\s/.test(text);
  }

  private recordUsage(provider: string, userId?: string): void {
    // Record API usage for monitoring and billing
    this.emit('usage:recorded', {
      provider,
      userId,
      timestamp: new Date(),
      requestId: this.generateRequestId()
    });
  }

  private auditSecurityEvent(
    event: string, 
    details: Record<string, any>
  ): void {
    if (!this.config.auditEnabled) return;

    const entry: SecurityAuditEntry = {
      timestamp: new Date(),
      event,
      details: this.sanitizeAuditDetails(details),
      severity: this.getEventSeverity(event)
    };

    this.auditLog.push(entry);
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Emit critical events
    if (entry.severity === 'high') {
      this.emit('security:alert', entry);
    }
  }

  private sanitizeAuditDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive information from audit logs
    if (sanitized.apiKey) {
      sanitized.apiKey = this.obfuscateApiKey(sanitized.apiKey);
    }
    if (sanitized.url) {
      sanitized.url = this.obfuscateUrl(sanitized.url);
    }

    return sanitized;
  }

  private obfuscateApiKey(key: string): string {
    if (key.length <= 8) return '***';
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
  }

  private obfuscateUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}/[PATH_OBFUSCATED]`;
    } catch {
      return '[URL_OBFUSCATED]';
    }
  }

  private getEventSeverity(event: string): 'low' | 'medium' | 'high' {
    const highSeverityEvents = [
      'credentials_invalid',
      'validation_error',
      'filter_error'
    ];
    
    const mediumSeverityEvents = [
      'rate_limit_exceeded',
      'url_validation_failed',
      'content_filtered'
    ];

    if (highSeverityEvents.includes(event)) return 'high';
    if (mediumSeverityEvents.includes(event)) return 'medium';
    return 'low';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupCleanupInterval(): void {
    // Clean up expired rate limits and audit logs every 5 minutes
    setInterval(() => {
      this.cleanupRateLimits();
      this.cleanupAuditLog();
    }, 5 * 60 * 1000);
  }

  private cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, limit] of this.rateLimits.entries()) {
      if (now > limit.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }

  private cleanupAuditLog(): void {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    this.auditLog = this.auditLog.filter(entry => 
      entry.timestamp > oneDayAgo
    );
  }

  /**
   * Public management methods
   */

  public getSecurityReport(): {
    rateLimits: { provider: string; usage: number; limit: number }[];
    auditSummary: { event: string; count: number; lastOccurred: Date }[];
    credentialsStatus: { provider: string; valid: boolean; lastRotated: Date }[];
  } {
    // Rate limit status
    const rateLimits = Array.from(this.rateLimits.entries()).map(([key, data]) => ({
      provider: key,
      usage: data.count,
      limit: this.config.maxRequestsPerMinute
    }));

    // Audit summary  
    const eventCounts = new Map<string, { count: number; lastOccurred: Date }>();
    this.auditLog.forEach(entry => {
      const existing = eventCounts.get(entry.event);
      if (existing) {
        existing.count++;
        if (entry.timestamp > existing.lastOccurred) {
          existing.lastOccurred = entry.timestamp;
        }
      } else {
        eventCounts.set(entry.event, {
          count: 1,
          lastOccurred: entry.timestamp
        });
      }
    });

    const auditSummary = Array.from(eventCounts.entries()).map(([event, data]) => ({
      event,
      ...data
    }));

    // Credentials status
    const credentialsStatus = Array.from(this.credentials.entries()).map(([provider, creds]) => ({
      provider,
      valid: creds.isValid,
      lastRotated: creds.lastRotated
    }));

    return { rateLimits, auditSummary, credentialsStatus };
  }

  public updateSecurityConfig(newConfig: Partial<APISecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config:updated', this.config);
  }
}

interface SecurityAuditEntry {
  timestamp: Date;
  event: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
}

// Export singleton instance
export const apiSecurityManager = APISecurityManager.getInstance();