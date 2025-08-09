/**
 * L3 CDN Cache Implementation
 * CDN cache wrapper for common templates and responses with 7 day TTL
 * Target hit rate: 10%
 */

import { EventEmitter } from 'events';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  SupportedLanguage,
} from '../types/language-aware-request';
import { CacheKeyGenerator } from '../utils/cache-keys';

export interface CDNCacheConfig {
  provider: 'cloudflare' | 'fastly' | 'aws-cloudfront' | 'local';
  ttl: number; // TTL in seconds
  zones: Record<string, string>; // Zone mapping for different regions
  purgeApiKey?: string;
  purgeApiUrl?: string;
  enableSmartPurge: boolean;
  enableStaleWhileRevalidate: boolean;
  staleWhileRevalidateTTL: number;
  enableGeoRouting: boolean;
}

export interface CDNCacheStats {
  hits: number;
  misses: number;
  purges: number;
  bandwidthSaved: number; // in bytes
  hitRate: number;
  languageDistribution: Record<SupportedLanguage, number>;
  zoneDistribution: Record<string, number>;
}

interface CDNResponse {
  cached: boolean;
  age?: number;
  ttl?: number;
  zone?: string;
  data: LanguageAwareResponse | null;
}

export class CDNCache extends EventEmitter {
  private config: CDNCacheConfig;
  private stats: CDNCacheStats;
  private keyGenerator: CacheKeyGenerator;
  private localCache: Map<string, { data: LanguageAwareResponse; expires: Date }>;

  constructor(config?: Partial<CDNCacheConfig>) {
    super();
    
    this.config = {
      provider: process.env.CDN_PROVIDER as any || 'local',
      ttl: 7 * 24 * 60 * 60, // 7 days in seconds
      zones: {
        'norway': 'no-cdn.storyscale.com',
        'nordic': 'nordic-cdn.storyscale.com',
        'global': 'cdn.storyscale.com',
      },
      purgeApiKey: process.env.CDN_PURGE_API_KEY,
      purgeApiUrl: process.env.CDN_PURGE_API_URL,
      enableSmartPurge: true,
      enableStaleWhileRevalidate: true,
      staleWhileRevalidateTTL: 60 * 60, // 1 hour
      enableGeoRouting: true,
      ...config,
    };

    this.keyGenerator = CacheKeyGenerator.getInstance();
    this.localCache = new Map(); // Fallback for local testing
    
    this.stats = {
      hits: 0,
      misses: 0,
      purges: 0,
      bandwidthSaved: 0,
      hitRate: 0,
      languageDistribution: { en: 0, no: 0 },
      zoneDistribution: Object.keys(this.config.zones).reduce((acc, zone) => {
        acc[zone] = 0;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get a value from CDN cache
   */
  public async get(
    request: LanguageAwareContentRequest
  ): Promise<LanguageAwareResponse | null> {
    const key = this.generateCDNKey(request);
    const zone = this.selectZone(request);

    try {
      const response = await this.fetchFromCDN(key, zone);
      
      if (response.cached && response.data) {
        this.updateStats('hit', request.outputLanguage, zone);
        
        // Check if stale and needs revalidation
        if (this.config.enableStaleWhileRevalidate && response.age && response.ttl) {
          const isStale = response.age > response.ttl;
          const withinSWR = response.age < (response.ttl + this.config.staleWhileRevalidateTTL);
          
          if (isStale && withinSWR) {
            // Serve stale content and trigger background revalidation
            this.triggerRevalidation(request, key, zone);
          }
        }

        this.emit('cache:hit', {
          key,
          language: request.outputLanguage,
          zone,
          age: response.age,
        });

        return response.data;
      }

      this.updateStats('miss', request.outputLanguage, zone);
      
      this.emit('cache:miss', {
        key,
        language: request.outputLanguage,
        zone,
      });

      return null;
    } catch (error) {
      this.emit('cache:error', { key, zone, error });
      return null;
    }
  }

  /**
   * Set a value in CDN cache
   */
  public async set(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    ttl?: number
  ): Promise<void> {
    const key = this.generateCDNKey(request);
    const zone = this.selectZone(request);
    const finalTTL = ttl || this.config.ttl;

    try {
      await this.pushToCDN(key, zone, response, finalTTL);
      
      const sizeInBytes = this.estimateSize(response);
      
      this.emit('cache:set', {
        key,
        language: request.outputLanguage,
        zone,
        ttl: finalTTL,
        sizeInBytes,
      });
    } catch (error) {
      this.emit('cache:error', { key, zone, error });
      throw error;
    }
  }

  /**
   * Purge CDN cache
   */
  public async purge(options?: {
    language?: SupportedLanguage;
    type?: string;
    zone?: string;
    tags?: string[];
  }): Promise<number> {
    try {
      let purgeCount = 0;

      if (!options) {
        // Purge everything
        purgeCount = await this.purgeAll();
      } else if (options.tags && this.config.enableSmartPurge) {
        // Smart purge by tags
        purgeCount = await this.purgeByTags(options.tags);
      } else {
        // Pattern-based purge
        const pattern = this.buildPurgePattern(options);
        purgeCount = await this.purgeByPattern(pattern);
      }

      this.stats.purges += purgeCount;
      
      this.emit('cache:purge', {
        count: purgeCount,
        options,
      });

      return purgeCount;
    } catch (error) {
      this.emit('cache:error', { action: 'purge', error });
      return 0;
    }
  }

  /**
   * Preload templates into CDN
   */
  public async preloadTemplates(templates: Array<{
    request: LanguageAwareContentRequest;
    response: LanguageAwareResponse;
    zones?: string[];
  }>): Promise<void> {
    for (const template of templates) {
      const zones = template.zones || [this.selectZone(template.request)];
      
      for (const zone of zones) {
        const key = this.generateCDNKey(template.request);
        await this.pushToCDN(key, zone, template.response, this.config.ttl);
      }
    }

    this.emit('cache:preload', {
      count: templates.length,
      languages: [...new Set(templates.map(t => t.request.outputLanguage))],
    });
  }

  /**
   * Get cache statistics
   */
  public getStats(): CDNCacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Private helper methods
   */

  private async fetchFromCDN(key: string, zone: string): Promise<CDNResponse> {
    if (this.config.provider === 'local') {
      // Local cache simulation
      const cached = this.localCache.get(`${zone}:${key}`);
      
      if (cached && cached.expires > new Date()) {
        const age = Math.floor((Date.now() - cached.expires.getTime() + this.config.ttl * 1000) / 1000);
        return {
          cached: true,
          age,
          ttl: this.config.ttl,
          zone,
          data: cached.data,
        };
      }
      
      return { cached: false, data: null };
    }

    // Real CDN implementation would go here
    // This would make HTTP requests to CDN edge servers
    // For now, returning mock response
    return { cached: false, data: null };
  }

  private async pushToCDN(
    key: string,
    zone: string,
    response: LanguageAwareResponse,
    ttl: number
  ): Promise<void> {
    if (this.config.provider === 'local') {
      // Local cache simulation
      this.localCache.set(`${zone}:${key}`, {
        data: response,
        expires: new Date(Date.now() + ttl * 1000),
      });
      return;
    }

    // Real CDN push implementation would go here
    // This would make HTTP PUT requests to CDN origin
  }

  private async purgeAll(): Promise<number> {
    if (this.config.provider === 'local') {
      const size = this.localCache.size;
      this.localCache.clear();
      return size;
    }

    // Real CDN purge implementation
    // Would make API call to CDN provider
    return 0;
  }

  private async purgeByTags(tags: string[]): Promise<number> {
    if (this.config.provider === 'local') {
      // Simple implementation for local cache
      let purged = 0;
      const keysToDelete: string[] = [];
      
      this.localCache.forEach((value, key) => {
        // In real implementation, we'd check tags
        if (tags.some(tag => key.includes(tag))) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.localCache.delete(key);
        purged++;
      });
      
      return purged;
    }

    // Real CDN tag-based purge
    return 0;
  }

  private async purgeByPattern(pattern: string): Promise<number> {
    if (this.config.provider === 'local') {
      let purged = 0;
      const keysToDelete: string[] = [];
      
      this.localCache.forEach((value, key) => {
        if (this.matchesPattern(key, pattern)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.localCache.delete(key);
        purged++;
      });
      
      return purged;
    }

    // Real CDN pattern-based purge
    return 0;
  }

  private buildPurgePattern(options: {
    language?: SupportedLanguage;
    type?: string;
    zone?: string;
  }): string {
    const parts: string[] = [];
    
    if (options.zone) {
      parts.push(options.zone);
    } else {
      parts.push('*');
    }
    
    if (options.language) {
      parts.push(`lang_${options.language}`);
    } else {
      parts.push('*');
    }
    
    if (options.type) {
      parts.push(`type_${options.type}`);
    } else {
      parts.push('*');
    }
    
    return parts.join(':');
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(key);
  }

  private triggerRevalidation(
    request: LanguageAwareContentRequest,
    key: string,
    zone: string
  ): void {
    // Trigger background revalidation
    // In production, this would be an async job
    setImmediate(async () => {
      this.emit('cache:revalidate', {
        key,
        zone,
        language: request.outputLanguage,
      });
    });
  }

  private generateCDNKey(request: LanguageAwareContentRequest): string {
    // CDN keys need to be URL-safe and shorter
    const baseKey = this.keyGenerator.generateKey(request, {
      includeTimestamp: false,
      hashContent: true,
      maxKeyLength: 200,
    });
    
    // Make URL-safe
    return baseKey.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  private selectZone(request: LanguageAwareContentRequest): string {
    if (!this.config.enableGeoRouting) {
      return 'global';
    }

    // Select zone based on language and cultural context
    if (request.outputLanguage === 'no') {
      if (request.culturalContext?.market === 'norway') {
        return 'norway';
      } else if (request.culturalContext?.market === 'nordic') {
        return 'nordic';
      }
    }
    
    return 'global';
  }

  private updateStats(
    type: 'hit' | 'miss',
    language: SupportedLanguage,
    zone: string
  ): void {
    if (type === 'hit') {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    this.stats.zoneDistribution[zone]++;
  }

  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return str.length * 2; // Assuming 2 bytes per character
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    provider: string;
    zones: string[];
    details: any;
  }> {
    const zones = Object.keys(this.config.zones);
    
    if (this.config.provider === 'local') {
      return {
        healthy: true,
        provider: 'local',
        zones,
        details: {
          cacheSize: this.localCache.size,
        },
      };
    }

    // Real CDN health check would test edge servers
    return {
      healthy: true,
      provider: this.config.provider,
      zones,
      details: {},
    };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.localCache.clear();
    this.removeAllListeners();
  }
}