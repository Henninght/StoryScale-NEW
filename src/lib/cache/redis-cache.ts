/**
 * L2 Redis Cache Implementation
 * Redis cache for research results and patterns with 24 hour TTL
 * Target hit rate: 25%
 */

import { EventEmitter } from 'events';
import { Redis, RedisOptions } from 'ioredis';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  CacheEntry,
  SupportedLanguage,
} from '../types/language-aware-request';
import { CacheKeyGenerator } from '../utils/cache-keys';

export interface RedisCacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl: number; // Default TTL in seconds
  keyPrefix: string;
  enablePipelining: boolean;
  enableCompression: boolean;
  maxRetriesPerRequest?: number;
  retryStrategy?: (times: number) => number | null;
}

export interface RedisCacheStats {
  hits: number;
  misses: number;
  errors: number;
  size: number;
  hitRate: number;
  averageLatency: number;
  languageDistribution: Record<SupportedLanguage, number>;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

interface RedisMetadata {
  language: SupportedLanguage;
  type: string;
  tags: string[];
  createdAt: string;
  expiresAt: string;
  hitCount: number;
  sizeInBytes: number;
}

export class RedisCache extends EventEmitter {
  private client: Redis;
  private stats: RedisCacheStats;
  private config: RedisCacheConfig;
  private keyGenerator: CacheKeyGenerator;
  private latencies: number[] = [];
  private readonly maxLatencySamples = 1000;
  private isConnected: boolean = false;
  private pipeline?: any;

  constructor(config?: Partial<RedisCacheConfig>) {
    super();
    
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      ttl: 24 * 60 * 60, // 24 hours in seconds
      keyPrefix: 'storyscale:l2:',
      enablePipelining: true,
      enableCompression: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      ...config,
    };

    this.keyGenerator = CacheKeyGenerator.getInstance();
    
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      size: 0,
      hitRate: 0,
      averageLatency: 0,
      languageDistribution: { en: 0, no: 0 },
      connectionStatus: 'disconnected',
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    const redisOptions: RedisOptions = {
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      retryStrategy: this.config.retryStrategy,
      enableReadyCheck: true,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      lazyConnect: false,
    };

    this.client = new Redis(redisOptions);

    // Set up event handlers
    this.client.on('connect', () => {
      this.isConnected = true;
      this.stats.connectionStatus = 'connected';
      this.emit('redis:connected');
    });

    this.client.on('ready', () => {
      this.emit('redis:ready');
    });

    this.client.on('error', (error) => {
      this.stats.connectionStatus = 'error';
      this.stats.errors++;
      this.emit('redis:error', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.stats.connectionStatus = 'disconnected';
      this.emit('redis:disconnected');
    });

    this.client.on('reconnecting', () => {
      this.stats.connectionStatus = 'connecting';
      this.emit('redis:reconnecting');
    });
  }

  /**
   * Get a value from the cache
   */
  public async get(
    request: LanguageAwareContentRequest
  ): Promise<LanguageAwareResponse | null> {
    if (!this.isConnected) {
      this.emit('cache:error', { error: 'Redis not connected' });
      return null;
    }

    const startTime = Date.now();
    const key = this.generateRedisKey(request);

    try {
      const [dataStr, metadataStr] = await this.client.mget(
        key,
        `${key}:meta`
      );

      if (dataStr && metadataStr) {
        const response = this.deserialize(dataStr);
        const metadata = JSON.parse(metadataStr) as RedisMetadata;

        // Update hit count
        await this.client.hincrby(`${key}:meta`, 'hitCount', 1);

        this.updateStats('hit', request.outputLanguage);
        this.recordLatency(Date.now() - startTime);

        this.emit('cache:hit', {
          key,
          language: request.outputLanguage,
          hitCount: metadata.hitCount + 1,
        });

        return response;
      }

      this.updateStats('miss', request.outputLanguage);
      this.recordLatency(Date.now() - startTime);

      this.emit('cache:miss', {
        key,
        language: request.outputLanguage,
      });

      return null;
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { key, error });
      return null;
    }
  }

  /**
   * Set a value in the cache
   */
  public async set(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    ttl?: number
  ): Promise<void> {
    if (!this.isConnected) {
      this.emit('cache:error', { error: 'Redis not connected' });
      return;
    }

    const key = this.generateRedisKey(request);
    const finalTTL = ttl || this.config.ttl;

    try {
      const serialized = this.serialize(response);
      const sizeInBytes = Buffer.byteLength(serialized);

      const metadata: RedisMetadata = {
        language: request.outputLanguage,
        type: request.type,
        tags: this.keyGenerator.generateTags(request),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + finalTTL * 1000).toISOString(),
        hitCount: 0,
        sizeInBytes,
      };

      // Use pipeline for atomic operations
      if (this.config.enablePipelining) {
        const pipeline = this.client.pipeline();
        
        pipeline.setex(key, finalTTL, serialized);
        pipeline.setex(
          `${key}:meta`,
          finalTTL,
          JSON.stringify(metadata)
        );
        
        // Add to language-specific sets for tracking
        pipeline.sadd(`lang:${request.outputLanguage}`, key);
        pipeline.expire(`lang:${request.outputLanguage}`, finalTTL);
        
        // Add to type-specific sets
        pipeline.sadd(`type:${request.type}`, key);
        pipeline.expire(`type:${request.type}`, finalTTL);
        
        // Add tags
        for (const tag of metadata.tags) {
          pipeline.sadd(`tag:${tag}`, key);
          pipeline.expire(`tag:${tag}`, finalTTL);
        }

        await pipeline.exec();
      } else {
        // Non-pipelined version
        await this.client.setex(key, finalTTL, serialized);
        await this.client.setex(
          `${key}:meta`,
          finalTTL,
          JSON.stringify(metadata)
        );
      }

      this.stats.languageDistribution[request.outputLanguage]++;

      this.emit('cache:set', {
        key,
        language: request.outputLanguage,
        sizeInBytes,
        ttl: finalTTL,
      });
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { key, error });
      throw error;
    }
  }

  /**
   * Delete a value from the cache
   */
  public async delete(request: LanguageAwareContentRequest): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const key = this.generateRedisKey(request);

    try {
      const result = await this.client.del(key, `${key}:meta`);
      
      if (result > 0) {
        this.emit('cache:delete', {
          key,
          language: request.outputLanguage,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { key, error });
      return false;
    }
  }

  /**
   * Clear cache entries by pattern
   */
  public async clear(options?: {
    language?: SupportedLanguage;
    type?: string;
    tags?: string[];
  }): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      let keys: string[] = [];

      if (!options) {
        // Clear all L2 cache
        const scanStream = this.client.scanStream({
          match: `${this.config.keyPrefix}*`,
          count: 100,
        });

        for await (const chunk of scanStream) {
          keys.push(...chunk);
        }
      } else {
        // Clear selectively
        if (options.language) {
          const langKeys = await this.client.smembers(`lang:${options.language}`);
          keys.push(...langKeys);
        }

        if (options.type) {
          const typeKeys = await this.client.smembers(`type:${options.type}`);
          keys.push(...typeKeys);
        }

        if (options.tags) {
          for (const tag of options.tags) {
            const tagKeys = await this.client.smembers(`tag:${tag}`);
            keys.push(...tagKeys);
          }
        }

        // Remove duplicates
        keys = [...new Set(keys)];
      }

      if (keys.length > 0) {
        // Delete keys and their metadata
        const deleteKeys: string[] = [];
        keys.forEach(key => {
          deleteKeys.push(key, `${key}:meta`);
        });

        const deleted = await this.client.del(...deleteKeys);
        
        this.emit('cache:clear', { cleared: deleted / 2, options });
        return deleted / 2;
      }

      return 0;
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { error });
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  public async has(request: LanguageAwareContentRequest): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const key = this.generateRedisKey(request);

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<RedisCacheStats> {
    const total = this.stats.hits + this.stats.misses;
    const stats = {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      averageLatency: this.calculateAverageLatency(),
    };

    // Try to get cache size from Redis
    if (this.isConnected) {
      try {
        const info = await this.client.info('memory');
        const match = info.match(/used_memory:(\d+)/);
        if (match) {
          stats.size = parseInt(match[1]);
        }
      } catch (error) {
        // Ignore error, size will remain as is
      }
    }

    return stats;
  }

  /**
   * Warm up cache with entries
   */
  public async warmup(entries: Array<{
    request: LanguageAwareContentRequest;
    response: LanguageAwareResponse;
    ttl?: number;
  }>): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    const pipeline = this.config.enablePipelining ? this.client.pipeline() : null;

    for (const entry of entries) {
      if (pipeline) {
        const key = this.generateRedisKey(entry.request);
        const serialized = this.serialize(entry.response);
        const ttl = entry.ttl || this.config.ttl;
        
        pipeline.setex(key, ttl, serialized);
      } else {
        await this.set(entry.request, entry.response, entry.ttl);
      }
    }

    if (pipeline) {
      await pipeline.exec();
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
    limit?: number;
  }): Promise<Array<{ request: LanguageAwareContentRequest; response: LanguageAwareResponse }>> {
    if (!this.isConnected) {
      return [];
    }

    try {
      let keys: string[] = [];

      if (pattern.language) {
        const langKeys = await this.client.smembers(`lang:${pattern.language}`);
        keys.push(...langKeys);
      } else if (pattern.type) {
        const typeKeys = await this.client.smembers(`type:${pattern.type}`);
        keys.push(...typeKeys);
      } else if (pattern.tags) {
        for (const tag of pattern.tags) {
          const tagKeys = await this.client.smembers(`tag:${tag}`);
          keys.push(...tagKeys);
        }
      }

      // Remove duplicates and limit
      keys = [...new Set(keys)];
      if (pattern.limit) {
        keys = keys.slice(0, pattern.limit);
      }

      const results: Array<{ request: LanguageAwareContentRequest; response: LanguageAwareResponse }> = [];
      
      for (const key of keys) {
        const dataStr = await this.client.get(key);
        if (dataStr) {
          // Parse the key to reconstruct basic request info
          const response = this.deserialize(dataStr);
          // Note: In production, you'd want to store the full request
          // For now, we'll create a minimal request object
          const request: LanguageAwareContentRequest = {
            id: key,
            type: 'article', // This should be parsed from metadata
            topic: 'cached',
            outputLanguage: pattern.language || 'en',
            timestamp: new Date(),
          };
          
          results.push({ request, response });
        }
      }

      return results;
    } catch (error) {
      this.stats.errors++;
      this.emit('cache:error', { error });
      return [];
    }
  }

  /**
   * Private helper methods
   */

  private generateRedisKey(request: LanguageAwareContentRequest): string {
    return this.keyGenerator.generateKey(request, {
      includeTimestamp: false,
      hashContent: true,
    });
  }

  private serialize(response: LanguageAwareResponse): string {
    if (this.config.enableCompression) {
      // In production, you'd use a compression library like zlib
      // For now, we'll just stringify
      return JSON.stringify(response);
    }
    return JSON.stringify(response);
  }

  private deserialize(data: string): LanguageAwareResponse {
    if (this.config.enableCompression) {
      // In production, you'd decompress here
      return JSON.parse(data);
    }
    return JSON.parse(data);
  }

  private updateStats(type: 'hit' | 'miss', language: SupportedLanguage): void {
    if (type === 'hit') {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
  }

  private recordLatency(latency: number): void {
    this.latencies.push(latency);
    
    if (this.latencies.length > this.maxLatencySamples) {
      this.latencies.shift();
    }
  }

  private calculateAverageLatency(): number {
    if (this.latencies.length === 0) {
      return 0;
    }

    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return sum / this.latencies.length;
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    details: any;
  }> {
    if (!this.isConnected) {
      return {
        healthy: false,
        latency: -1,
        details: { error: 'Not connected' },
      };
    }

    const startTime = Date.now();
    
    try {
      await this.client.ping();
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        latency,
        details: {
          connectionStatus: this.stats.connectionStatus,
          host: this.config.host,
          port: this.config.port,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        details: { error: error.message },
      };
    }
  }

  /**
   * Cleanup on destroy
   */
  public async destroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
    this.removeAllListeners();
  }
}