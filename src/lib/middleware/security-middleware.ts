/**
 * Security Middleware - API endpoint protection
 * 
 * Features:
 * - Request validation and sanitization
 * - Rate limiting per user/IP
 * - Content security policy
 * - CORS protection
 * - Security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiSecurityManager } from '../security/api-security';

export interface SecurityConfig {
  enableRateLimit: boolean;
  enableCORS: boolean;
  enableCSP: boolean;
  enableRequestValidation: boolean;
  maxRequestSize: number; // bytes
  allowedOrigins: string[];
  blockedIPs: string[];
}

const defaultConfig: SecurityConfig = {
  enableRateLimit: true,
  enableCORS: true,
  enableCSP: true,
  enableRequestValidation: true,
  maxRequestSize: 1024 * 1024, // 1MB
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://storyscale.app',
    'https://*.vercel.app'
  ],
  blockedIPs: []
};

class SecurityMiddleware {
  private config: SecurityConfig;
  private requestCounts: Map<string, { count: number; resetTime: number }>;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.requestCounts = new Map();
    this.setupCleanupInterval();
  }

  /**
   * Main middleware handler
   */
  public async handle(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // 1. Basic security headers
      const securityHeaders = this.getSecurityHeaders(request);

      // 2. IP and origin validation
      const ipCheck = this.validateIP(request);
      if (!ipCheck.allowed) {
        return this.createErrorResponse(403, 'Forbidden', securityHeaders);
      }

      // 3. CORS validation
      if (this.config.enableCORS) {
        const corsCheck = this.validateCORS(request);
        if (!corsCheck.allowed) {
          return this.createErrorResponse(403, 'CORS policy violation', securityHeaders);
        }
        // Add CORS headers
        Object.assign(securityHeaders, corsCheck.headers);
      }

      // 4. Rate limiting
      if (this.config.enableRateLimit) {
        const rateLimitCheck = this.checkRateLimit(request);
        if (!rateLimitCheck.allowed) {
          return this.createErrorResponse(429, 'Too Many Requests', {
            ...securityHeaders,
            'Retry-After': '60'
          });
        }
      }

      // 5. Request size validation
      const sizeCheck = await this.validateRequestSize(request);
      if (!sizeCheck.allowed) {
        return this.createErrorResponse(413, 'Payload Too Large', securityHeaders);
      }

      // 6. Content validation and body parsing
      let parsedBody: any = null;
      if (this.config.enableRequestValidation && request.method !== 'GET' && request.method !== 'HEAD') {
        const contentCheck = await this.validateRequestContent(request);
        if (!contentCheck.allowed) {
          return this.createErrorResponse(400, `Invalid request: ${contentCheck.reason}`, securityHeaders);
        }
        parsedBody = contentCheck.body;
      }

      // 7. Execute the handler with parsed body if available
      // Clone request with body if it was parsed
      let requestToPass = request;
      if (parsedBody) {
        // Create a new request with the parsed body
        requestToPass = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(parsedBody),
        });
      }
      const response = await handler(requestToPass);

      // 8. Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;

    } catch (error) {
      console.error('Security middleware error:', error);
      return this.createErrorResponse(500, 'Internal Server Error');
    }
  }

  /**
   * Security validation methods
   */

  private validateIP(request: NextRequest): { allowed: boolean; reason?: string } {
    const clientIP = this.getClientIP(request);
    
    if (!clientIP) {
      return { allowed: true }; // Allow if IP cannot be determined
    }

    // Check against blocked IPs
    for (const blockedIP of this.config.blockedIPs) {
      if (clientIP.includes(blockedIP)) {
        console.warn(`Blocked IP attempted access: ${clientIP}`);
        return { allowed: false, reason: 'IP blocked' };
      }
    }

    return { allowed: true };
  }

  private validateCORS(request: NextRequest): { 
    allowed: boolean; 
    headers?: Record<string, string>;
    reason?: string;
  } {
    const origin = request.headers.get('origin');
    const requestUrl = new URL(request.url);
    
    // For same-origin requests (including when origin header is present)
    if (!origin || origin === `${requestUrl.protocol}//${requestUrl.host}`) {
      return { 
        allowed: true,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400'
        }
      };
    }

    // Check against allowed origins for cross-origin requests
    const isAllowed = this.config.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard patterns
        const pattern = allowedOrigin.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return origin === allowedOrigin;
    });

    if (!isAllowed) {
      console.warn(`CORS violation from origin: ${origin}, request URL: ${requestUrl.origin}`);
      return { allowed: false, reason: `Origin ${origin} not allowed` };
    }

    return {
      allowed: true,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    };
  }

  private checkRateLimit(request: NextRequest): { allowed: boolean; reason?: string } {
    const clientId = this.getClientIdentifier(request);
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute
    const maxRequests = 60; // 60 requests per minute

    const current = this.requestCounts.get(clientId);
    
    if (!current) {
      this.requestCounts.set(clientId, { count: 1, resetTime: now + windowSize });
      return { allowed: true };
    }

    // Reset if window has passed
    if (now > current.resetTime) {
      this.requestCounts.set(clientId, { count: 1, resetTime: now + windowSize });
      return { allowed: true };
    }

    // Check if under limit
    if (current.count < maxRequests) {
      current.count++;
      return { allowed: true };
    }

    console.warn(`Rate limit exceeded for client: ${clientId}`);
    return { allowed: false, reason: `Exceeded ${maxRequests} requests per minute` };
  }

  private async validateRequestSize(request: NextRequest): Promise<{ 
    allowed: boolean; 
    reason?: string;
  }> {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return { allowed: true };
    }

    try {
      const contentLength = request.headers.get('content-length');
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (size > this.config.maxRequestSize) {
          return { 
            allowed: false, 
            reason: `Request size ${size} exceeds limit ${this.config.maxRequestSize}` 
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: 'Invalid content-length header' };
    }
  }

  private async validateRequestContent(request: NextRequest): Promise<{ 
    allowed: boolean; 
    reason?: string;
    body?: any;
  }> {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return { allowed: true };
    }

    try {
      const contentType = request.headers.get('content-type') || '';
      
      // Only allow JSON content for API requests
      if (!contentType.includes('application/json')) {
        return { 
          allowed: false, 
          reason: 'Only JSON content-type allowed' 
        };
      }

      // Basic JSON validation and parse the body
      const bodyText = await request.text();
      if (bodyText.trim() && !bodyText.trim().startsWith('{') && !bodyText.trim().startsWith('[')) {
        return { 
          allowed: false, 
          reason: 'Invalid JSON format' 
        };
      }

      // Parse JSON
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (e) {
        return {
          allowed: false,
          reason: 'Invalid JSON syntax'
        };
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /function\s*\(/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(bodyText)) {
          console.warn(`Suspicious content detected in request from ${this.getClientIP(request)}`);
          return { 
            allowed: false, 
            reason: 'Suspicious content detected' 
          };
        }
      }

      return { allowed: true, body: parsedBody };

    } catch (error) {
      return { 
        allowed: false, 
        reason: 'Request content validation failed' 
      };
    }
  }

  /**
   * Helper methods
   */

  private getSecurityHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {
      // Basic security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    // Content Security Policy
    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
        "style-src 'self' 'unsafe-inline'", // Allow inline styles
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.firecrawl.dev https://api.tavily.com",
        "frame-ancestors 'none'",
      ].join('; ');
    }

    // HSTS for HTTPS requests
    if (request.url.startsWith('https://')) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    return headers;
  }

  private getClientIP(request: NextRequest): string | null {
    // Try different headers for IP detection
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'x-forwarded',
      'forwarded-for',
      'forwarded'
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // Take the first IP if comma-separated
        return value.split(',')[0].trim();
      }
    }

    return null;
  }

  private getClientIdentifier(request: NextRequest): string {
    // Create a client identifier for rate limiting
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // In production, you might want to include user ID if authenticated
    return `${ip || 'unknown'}_${this.hashString(userAgent)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private createErrorResponse(
    status: number,
    message: string,
    headers?: Record<string, string>
  ): NextResponse {
    const response = NextResponse.json(
      {
        error: message,
        status,
        timestamp: new Date().toISOString()
      },
      { status }
    );

    // Add security headers
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }

  private setupCleanupInterval(): void {
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requestCounts.entries()) {
        if (now > data.resetTime) {
          this.requestCounts.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }
}

/**
 * Create security middleware wrapper
 */
export function withSecurity(config?: Partial<SecurityConfig>) {
  const middleware = new SecurityMiddleware(config);

  return function securityWrapper(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function securedHandler(request: NextRequest): Promise<NextResponse> {
      return middleware.handle(request, handler);
    };
  };
}

/**
 * Validate research request specifically
 */
export async function validateResearchRequest(
  content: string,
  enableResearch: boolean,
  userId?: string
): Promise<{
  allowed: boolean;
  sanitizedContent?: string;
  reason?: string;
}> {
  if (!enableResearch) {
    return { allowed: true, sanitizedContent: content };
  }

  // Validate content length
  if (content.length > 2000) {
    return { 
      allowed: false, 
      reason: 'Content too long for research request' 
    };
  }

  // Validate content for research
  const validation = await apiSecurityManager.validateRequest(
    'firecrawl', // Use firecrawl as default validator
    'https://research.validate.com', // Mock URL
    content,
    userId
  );

  if (!validation.allowed) {
    return {
      allowed: false,
      reason: validation.reason
    };
  }

  return {
    allowed: true,
    sanitizedContent: validation.sanitizedQuery || content
  };
}

export default SecurityMiddleware;