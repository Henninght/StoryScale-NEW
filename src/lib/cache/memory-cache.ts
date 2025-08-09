/**
 * L1 Memory Cache Implementation
 * In-memory cache for immediate deduplication with 5 minute TTL
 * Target hit rate: 15%
 */

import { EventEmitter } from 'events';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  CacheEntry,
  SupportedLanguage,
} from '../types/language-aware-request';
import { CacheKeyGenerator } from '../utils/cache-keys';

export interface MemoryCacheConfig {
  maxSize: number; // Maximum number of entries
  ttl: number; // Time to live in milliseconds
  checkInterval: number; // Cleanup interval in milliseconds
  enableCompression: boolean; // Enable response compression
  warmupEnabled: boolean; // Enable cache warming
}

export interface MemoryCacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  sizeInBytes: number;
  hitRate: number;
  averageAccessTime: number;
  languageDistribution: Record<SupportedLanguage, number>;
}

interface MemoryCacheEntry extends CacheEntry {
  accessCount: number;
  lastAccessed: Date;
  sizeInBytes: number;
  compressed: boolean;
}

export class MemoryCache extends EventEmitter {
  private cache: Map<string, MemoryCacheEntry>;
  private accessTimes: number[] = [];
  private stats: MemoryCacheStats;
  private config: MemoryCacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private keyGenerator: CacheKeyGenerator;
  private readonly maxAccessTimeSamples = 1000;

  constructor(config?: Partial<MemoryCacheConfig>) {
    super();
    
    this.config = {
      maxSize: 1000,
      ttl: 5 * 60 * 1000, // 5 minutes default
      checkInterval: 60 * 1000, // Check every minute
      enableCompression: false,
      warmupEnabled: true,
      ...config,
    };

    this.cache = new Map();
    this.keyGenerator = CacheKeyGenerator.getInstance();
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      sizeInBytes: 0,
      hitRate: 0,
      averageAccessTime: 0,
      languageDistribution: { en: 0, no: 0 },
    };

    this.startCleanupTimer();
  }

  /**
   * Get a value from the cache
   */
  public async get(
    request: LanguageAwareContentRequest
  ): Promise<LanguageAwareResponse | null> {
    const startTime = performance.now();
    const key = this.keyGenerator.generateKey(request, {
      includeTimestamp: false,
      hashContent: true,
    });

    const entry = this.cache.get(key);
    
    if (entry) {
      // Check if expired
      if (entry.expiresAt < new Date()) {
        this.cache.delete(key);
        this.updateStats('miss', request.outputLanguage);
        this.recordAccessTime(performance.now() - startTime);
        return null;
      }

      // Update access metadata
      entry.hitCount++;
      entry.accessCount++;
      entry.lastAccessed = new Date();
      
      this.updateStats('hit', request.outputLanguage);
      this.recordAccessTime(performance.now() - startTime);
      
      this.emit('cache:hit', {
        key,
        language: request.outputLanguage,
        hitCount: entry.hitCount,
      });

      // Clone response to prevent mutations
      return this.cloneResponse(entry.response);
    }

    this.updateStats('miss', request.outputLanguage);
    this.recordAccessTime(performance.now() - startTime);
    
    this.emit('cache:miss', {
      key,
      language: request.outputLanguage,
    });

    return null;
  }

  /**
   * Set a value in the cache
   */
  public async set(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    ttl?: number
  ): Promise<void> {
    const key = this.keyGenerator.generateKey(request, {
      includeTimestamp: false,
      hashContent: true,
    });

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const sizeInBytes = this.estimateSize(response);
    const finalTTL = ttl || this.config.ttl;

    const entry: MemoryCacheEntry = {
      key,
      request: this.cloneRequest(request),
      response: this.cloneResponse(response),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + finalTTL),
      hitCount: 0,
      accessCount: 0,
      lastAccessed: new Date(),
      language: request.outputLanguage,
      tags: this.keyGenerator.generateTags(request),
      sizeInBytes,
      compressed: false,
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
    this.stats.sizeInBytes += sizeInBytes;
    this.stats.languageDistribution[request.outputLanguage]++;

    this.emit('cache:set', {
      key,
      language: request.outputLanguage,
      sizeInBytes,
      ttl: finalTTL,
    });
  }

  /**
   * Delete a value from the cache
   */
  public async delete(request: LanguageAwareContentRequest): Promise<boolean> {
    const key = this.keyGenerator.generateKey(request, {
      includeTimestamp: false,
      hashContent: true,
    });

    const entry = this.cache.get(key);
    if (entry) {
      this.stats.sizeInBytes -= entry.sizeInBytes;
      this.stats.languageDistribution[entry.language]--;
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      
      this.emit('cache:delete', {
        key,
        language: entry.language,
      });
      
      return true;
    }

    return false;
  }

  /**
   * Clear all cache entries or by language/pattern
   */
  public async clear(options?: {
    language?: SupportedLanguage;
    type?: string;
    tags?: string[];
  }): Promise<number> {
    let cleared = 0;

    if (!options) {
      // Clear everything
      cleared = this.cache.size;
      this.cache.clear();
      this.resetStats();
    } else {
      // Clear selectively
      const keysToDelete: string[] = [];
      
      this.cache.forEach((entry, key) => {
        let shouldDelete = false;

        if (options.language && entry.language === options.language) {
          shouldDelete = true;
        }

        if (options.type && entry.request.type === options.type) {
          shouldDelete = true;
        }

        if (options.tags && options.tags.some(tag => entry.tags.includes(tag))) {
          shouldDelete = true;
        }

        if (shouldDelete) {
          keysToDelete.push(key);
          this.stats.sizeInBytes -= entry.sizeInBytes;
          this.stats.languageDistribution[entry.language]--;
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));
      cleared = keysToDelete.length;
      this.stats.size = this.cache.size;
    }

    this.emit('cache:clear', { cleared, options });
    return cleared;
  }

  /**
   * Check if a key exists in the cache
   */
  public async has(request: LanguageAwareContentRequest): Promise<boolean> {
    const key = this.keyGenerator.generateKey(request, {
      includeTimestamp: false,
      hashContent: true,
    });

    const entry = this.cache.get(key);
    return entry !== undefined && entry.expiresAt > new Date();
  }

  /**
   * Get cache statistics
   */
  public getStats(): MemoryCacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      averageAccessTime: this.calculateAverageAccessTime(),
    };
  }

  /**
   * Warm up cache with common patterns
   */
  public async warmup(entries: Array<{
    request: LanguageAwareContentRequest;
    response: LanguageAwareResponse;
    ttl?: number;
  }>): Promise<void> {
    if (!this.config.warmupEnabled) {
      return;
    }

    for (const entry of entries) {
      await this.set(entry.request, entry.response, entry.ttl);
    }

    this.emit('cache:warmup', {
      count: entries.length,
      languages: [...new Set(entries.map(e => e.request.outputLanguage))],
    });
  }

  /**
   * Get entries by pattern
   */
  public async getByPattern(pattern: {
    language?: SupportedLanguage;
    type?: string;
    tags?: string[];
  }): Promise<MemoryCacheEntry[]> {
    const results: MemoryCacheEntry[] = [];

    this.cache.forEach(entry => {
      let matches = true;

      if (pattern.language && entry.language !== pattern.language) {
        matches = false;
      }

      if (pattern.type && entry.request.type !== pattern.type) {
        matches = false;
      }

      if (pattern.tags && !pattern.tags.some(tag => entry.tags.includes(tag))) {
        matches = false;
      }

      if (matches && entry.expiresAt > new Date()) {
        results.push(entry);
      }
    });

    return results;
  }

  /**
   * Private helper methods
   */

  private evictLRU(): void {
    let oldestEntry: MemoryCacheEntry | null = null;
    let oldestKey: string | null = null;

    // Find least recently used entry
    this.cache.forEach((entry, key) => {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = entry;
        oldestKey = key;
      }
    });

    if (oldestKey && oldestEntry) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.sizeInBytes -= oldestEntry.sizeInBytes;
      this.stats.languageDistribution[oldestEntry.language]--;
      this.stats.size = this.cache.size;

      this.emit('cache:evict', {
        key: oldestKey,
        language: oldestEntry.language,
        reason: 'lru',
      });
    }
  }

  private cleanup(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        keysToDelete.push(key);
        this.stats.sizeInBytes -= entry.sizeInBytes;
        this.stats.languageDistribution[entry.language]--;
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.stats.size = this.cache.size;
      this.emit('cache:cleanup', {
        expired: keysToDelete.length,
      });
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.checkInterval);
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private updateStats(type: 'hit' | 'miss', language: SupportedLanguage): void {
    if (type === 'hit') {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
  }

  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    
    // Keep only recent samples
    if (this.accessTimes.length > this.maxAccessTimeSamples) {
      this.accessTimes.shift();
    }
  }

  private calculateAverageAccessTime(): number {
    if (this.accessTimes.length === 0) {
      return 0;
    }

    const sum = this.accessTimes.reduce((a, b) => a + b, 0);
    return sum / this.accessTimes.length;
  }

  private estimateSize(obj: any): number {
    // Rough estimation of object size in bytes
    const str = JSON.stringify(obj);
    return str.length * 2; // Assuming 2 bytes per character
  }

  private cloneRequest(request: LanguageAwareContentRequest): LanguageAwareContentRequest {
    return JSON.parse(JSON.stringify(request));
  }

  private cloneResponse(response: LanguageAwareResponse): LanguageAwareResponse {
    return JSON.parse(JSON.stringify(response));
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      sizeInBytes: 0,
      hitRate: 0,
      averageAccessTime: 0,
      languageDistribution: { en: 0, no: 0 },
    };
  }

  /**
   * Cleanup on destroy
   */
  public destroy(): void {
    this.stopCleanupTimer();
    this.cache.clear();
    this.removeAllListeners();
  }
}