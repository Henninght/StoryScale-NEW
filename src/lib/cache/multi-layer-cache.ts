/**
 * Multi-Layer Cache Orchestrator
 * Coordinates L1 (Memory), L2 (Redis), and L3 (CDN) cache layers
 * with intelligent routing and fallback mechanisms
 */

import { EventEmitter } from 'events';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  SupportedLanguage,
  CacheEntry,
} from '../types/language-aware-request';
import { MemoryCache, MemoryCacheConfig } from './memory-cache';
import { RedisCache, RedisCacheConfig } from './redis-cache';
import { CDNCache, CDNCacheConfig } from './cdn-cache';
import { CacheMetrics } from './cache-metrics';
import { NorwegianTemplates } from './norwegian-templates';

export interface MultiLayerCacheConfig {
  l1: Partial<MemoryCacheConfig>;
  l2: Partial<RedisCacheConfig>;
  l3: Partial<CDNCacheConfig>;
  enableWaterfall: boolean; // Check caches in order
  enableParallel: boolean; // Check all caches simultaneously
  enableWriteThrough: boolean; // Write to all layers
  enableWriteBehind: boolean; // Async write to lower layers
  warmupOnStart: boolean;
  metricsEnabled: boolean;
}

export interface CacheLayerResult {
  layer: 'L1' | 'L2' | 'L3';
  hit: boolean;
  latency: number;
  response?: LanguageAwareResponse;
}

export interface MultiLayerCacheStats {
  l1: any;
  l2: any;
  l3: any;
  overall: {
    totalHits: number;
    totalMisses: number;
    totalRequests: number;
    hitRate: number;
    averageLatency: number;
    layerHitRates: {
      L1: number;
      L2: number;
      L3: number;
    };
    languageDistribution: Record<SupportedLanguage, number>;
  };
}

export class MultiLayerCache extends EventEmitter {
  private static instance: MultiLayerCache;
  
  private l1Cache: MemoryCache;
  private l2Cache: RedisCache;
  private l3Cache: CDNCache;
  private metrics: CacheMetrics;
  private norwegianTemplates: NorwegianTemplates;
  private config: MultiLayerCacheConfig;
  
  private stats = {
    totalHits: 0,
    totalMisses: 0,
    totalRequests: 0,
    layerHits: { L1: 0, L2: 0, L3: 0 },
    layerMisses: { L1: 0, L2: 0, L3: 0 },
    languageRequests: { en: 0, no: 0 } as Record<SupportedLanguage, number>,
  };

  private constructor(config?: Partial<MultiLayerCacheConfig>) {
    super();
    
    this.config = {
      l1: {
        maxSize: 1000,
        ttl: 5 * 60 * 1000, // 5 minutes
        checkInterval: 60 * 1000,
        enableCompression: false,
        warmupEnabled: true,
      },
      l2: {
        ttl: 24 * 60 * 60, // 24 hours
        keyPrefix: 'storyscale:l2:',
        enablePipelining: true,
        enableCompression: true,
      },
      l3: {
        provider: 'local',
        ttl: 7 * 24 * 60 * 60, // 7 days
        enableSmartPurge: true,
        enableStaleWhileRevalidate: true,
        enableGeoRouting: true,
      },
      enableWaterfall: true,
      enableParallel: false,
      enableWriteThrough: true,
      enableWriteBehind: false,
      warmupOnStart: true,
      metricsEnabled: true,
      ...config,
    };

    // Initialize cache layers
    this.l1Cache = new MemoryCache(this.config.l1);
    this.l2Cache = new RedisCache(this.config.l2);
    this.l3Cache = new CDNCache(this.config.l3);
    
    // Initialize metrics and templates
    this.metrics = new CacheMetrics({
      layers: ['L1', 'L2', 'L3'],
      targetHitRates: {
        L1: 0.15,
        L2: 0.25,
        L3: 0.10,
      },
    });
    
    this.norwegianTemplates = new NorwegianTemplates();

    this.setupEventListeners();
    
    if (this.config.warmupOnStart) {
      this.warmupCaches();
    }
  }

  public static getInstance(config?: Partial<MultiLayerCacheConfig>): MultiLayerCache {
    if (!MultiLayerCache.instance) {
      MultiLayerCache.instance = new MultiLayerCache(config);
    }
    return MultiLayerCache.instance;
  }

  /**
   * Get content from cache layers
   */
  public async get(
    request: LanguageAwareContentRequest
  ): Promise<LanguageAwareResponse | null> {
    const startTime = performance.now();
    this.stats.totalRequests++;
    this.stats.languageRequests[request.outputLanguage]++;

    let response: LanguageAwareResponse | null = null;
    const results: CacheLayerResult[] = [];

    if (this.config.enableParallel) {
      // Check all layers in parallel
      const [l1Result, l2Result, l3Result] = await Promise.all([
        this.checkLayer('L1', request),
        this.checkLayer('L2', request),
        this.checkLayer('L3', request),
      ]);

      results.push(l1Result, l2Result, l3Result);
      
      // Use the first hit
      const hit = results.find(r => r.hit);
      if (hit) {
        response = hit.response!;
      }
    } else {
      // Waterfall approach - check layers in order
      const l1Result = await this.checkLayer('L1', request);
      results.push(l1Result);

      if (l1Result.hit) {
        response = l1Result.response!;
      } else {
        const l2Result = await this.checkLayer('L2', request);
        results.push(l2Result);

        if (l2Result.hit) {
          response = l2Result.response!;
          // Backfill L1
          if (this.config.enableWriteBehind) {
            this.backfillLayer('L1', request, response);
          }
        } else {
          const l3Result = await this.checkLayer('L3', request);
          results.push(l3Result);

          if (l3Result.hit) {
            response = l3Result.response!;
            // Backfill L1 and L2
            if (this.config.enableWriteBehind) {
              this.backfillLayer('L1', request, response);
              this.backfillLayer('L2', request, response);
            }
          }
        }
      }
    }

    const totalLatency = performance.now() - startTime;

    // Update metrics
    if (response) {
      this.stats.totalHits++;
      this.metrics.recordHit(request.outputLanguage, results, totalLatency);
    } else {
      this.stats.totalMisses++;
      this.metrics.recordMiss(request.outputLanguage, totalLatency);
    }

    this.emit('cache:access', {
      hit: !!response,
      layers: results,
      totalLatency,
      language: request.outputLanguage,
    });

    return response;
  }

  /**
   * Set content in cache layers
   */
  public async set(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    options?: {
      layers?: Array<'L1' | 'L2' | 'L3'>;
      ttl?: { L1?: number; L2?: number; L3?: number };
    }
  ): Promise<void> {
    const layers = options?.layers || ['L1', 'L2', 'L3'];

    if (this.config.enableWriteThrough) {
      // Write to all specified layers simultaneously
      const writes = [];

      if (layers.includes('L1')) {
        writes.push(this.l1Cache.set(request, response, options?.ttl?.L1));
      }

      if (layers.includes('L2')) {
        writes.push(this.l2Cache.set(request, response, options?.ttl?.L2));
      }

      if (layers.includes('L3')) {
        writes.push(this.l3Cache.set(request, response, options?.ttl?.L3));
      }

      await Promise.all(writes);
    } else {
      // Write to layers sequentially
      for (const layer of layers) {
        await this.writeToLayer(layer, request, response, options?.ttl?.[layer]);
      }
    }

    this.metrics.recordWrite(request.outputLanguage, layers);

    this.emit('cache:write', {
      layers,
      language: request.outputLanguage,
    });
  }

  /**
   * Invalidate cache entries
   */
  public async invalidate(options?: {
    language?: SupportedLanguage;
    type?: string;
    tags?: string[];
    layers?: Array<'L1' | 'L2' | 'L3'>;
  }): Promise<number> {
    const layers = options?.layers || ['L1', 'L2', 'L3'];
    let totalInvalidated = 0;

    const invalidations = [];

    if (layers.includes('L1')) {
      invalidations.push(
        this.l1Cache.clear(options).then(count => {
          totalInvalidated += count;
          return count;
        })
      );
    }

    if (layers.includes('L2')) {
      invalidations.push(
        this.l2Cache.clear(options).then(count => {
          totalInvalidated += count;
          return count;
        })
      );
    }

    if (layers.includes('L3')) {
      invalidations.push(
        this.l3Cache.purge(options).then(count => {
          totalInvalidated += count;
          return count;
        })
      );
    }

    await Promise.all(invalidations);

    this.emit('cache:invalidate', {
      options,
      layers,
      totalInvalidated,
    });

    return totalInvalidated;
  }

  /**
   * Warm up caches with templates
   */
  public async warmupCaches(): Promise<void> {
    const templates = this.norwegianTemplates.getAllTemplates();
    
    // Separate templates by priority
    const highPriority = templates.filter(t => t.priority === 'high');
    const mediumPriority = templates.filter(t => t.priority === 'medium');
    const lowPriority = templates.filter(t => t.priority === 'low');

    // Warm L1 with high priority templates
    await this.l1Cache.warmup(
      highPriority.map(t => ({
        request: t.request,
        response: t.response,
        ttl: 10 * 60 * 1000, // 10 minutes for high priority
      }))
    );

    // Warm L2 with high and medium priority templates
    await this.l2Cache.warmup(
      [...highPriority, ...mediumPriority].map(t => ({
        request: t.request,
        response: t.response,
        ttl: t.priority === 'high' ? 48 * 60 * 60 : 24 * 60 * 60, // 48h for high, 24h for medium
      }))
    );

    // Warm L3 with all templates
    await this.l3Cache.preloadTemplates(
      templates.map(t => ({
        request: t.request,
        response: t.response,
        zones: t.request.outputLanguage === 'no' ? ['norway', 'nordic'] : ['global'],
      }))
    );

    this.emit('cache:warmup', {
      templateCount: templates.length,
      layers: ['L1', 'L2', 'L3'],
      languages: ['no', 'en'],
    });
  }

  /**
   * Get comprehensive statistics
   */
  public async getStats(): Promise<MultiLayerCacheStats> {
    const [l1Stats, l2Stats, l3Stats] = await Promise.all([
      Promise.resolve(this.l1Cache.getStats()),
      this.l2Cache.getStats(),
      Promise.resolve(this.l3Cache.getStats()),
    ]);

    const totalRequests = this.stats.totalRequests || 1; // Prevent division by zero

    return {
      l1: l1Stats,
      l2: l2Stats,
      l3: l3Stats,
      overall: {
        totalHits: this.stats.totalHits,
        totalMisses: this.stats.totalMisses,
        totalRequests: this.stats.totalRequests,
        hitRate: this.stats.totalHits / totalRequests,
        averageLatency: this.metrics.getAverageLatency(),
        layerHitRates: {
          L1: this.stats.layerHits.L1 / totalRequests,
          L2: this.stats.layerHits.L2 / totalRequests,
          L3: this.stats.layerHits.L3 / totalRequests,
        },
        languageDistribution: this.stats.languageRequests,
      },
    };
  }

  /**
   * Private helper methods
   */

  private async checkLayer(
    layer: 'L1' | 'L2' | 'L3',
    request: LanguageAwareContentRequest
  ): Promise<CacheLayerResult> {
    const startTime = performance.now();
    let response: LanguageAwareResponse | null = null;

    try {
      switch (layer) {
        case 'L1':
          response = await this.l1Cache.get(request);
          break;
        case 'L2':
          response = await this.l2Cache.get(request);
          break;
        case 'L3':
          response = await this.l3Cache.get(request);
          break;
      }
    } catch (error) {
      this.emit('cache:error', { layer, error });
    }

    const latency = performance.now() - startTime;
    const hit = !!response;

    if (hit) {
      this.stats.layerHits[layer]++;
    } else {
      this.stats.layerMisses[layer]++;
    }

    return {
      layer,
      hit,
      latency,
      response: response || undefined,
    };
  }

  private async writeToLayer(
    layer: 'L1' | 'L2' | 'L3',
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    ttl?: number
  ): Promise<void> {
    try {
      switch (layer) {
        case 'L1':
          await this.l1Cache.set(request, response, ttl);
          break;
        case 'L2':
          await this.l2Cache.set(request, response, ttl);
          break;
        case 'L3':
          await this.l3Cache.set(request, response, ttl);
          break;
      }
    } catch (error) {
      this.emit('cache:error', { layer, action: 'write', error });
    }
  }

  private async backfillLayer(
    layer: 'L1' | 'L2',
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse
  ): Promise<void> {
    // Async backfill to higher layers
    setImmediate(async () => {
      try {
        await this.writeToLayer(layer, request, response);
        this.emit('cache:backfill', { layer, language: request.outputLanguage });
      } catch (error) {
        this.emit('cache:error', { layer, action: 'backfill', error });
      }
    });
  }

  private setupEventListeners(): void {
    // Forward events from individual caches
    this.l1Cache.on('cache:hit', data => this.emit('l1:hit', data));
    this.l1Cache.on('cache:miss', data => this.emit('l1:miss', data));
    
    this.l2Cache.on('cache:hit', data => this.emit('l2:hit', data));
    this.l2Cache.on('cache:miss', data => this.emit('l2:miss', data));
    
    this.l3Cache.on('cache:hit', data => this.emit('l3:hit', data));
    this.l3Cache.on('cache:miss', data => this.emit('l3:miss', data));

    // Monitor errors
    this.l1Cache.on('cache:error', error => this.handleCacheError('L1', error));
    this.l2Cache.on('cache:error', error => this.handleCacheError('L2', error));
    this.l3Cache.on('cache:error', error => this.handleCacheError('L3', error));
  }

  private handleCacheError(layer: string, error: any): void {
    this.emit('cache:layer:error', { layer, error });
    
    // Log to metrics
    if (this.config.metricsEnabled) {
      this.metrics.recordError(layer, error);
    }
  }

  /**
   * Health check for all layers
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    layers: {
      L1: { healthy: boolean; details: any };
      L2: { healthy: boolean; details: any };
      L3: { healthy: boolean; details: any };
    };
  }> {
    const [l2Health, l3Health] = await Promise.all([
      this.l2Cache.healthCheck(),
      this.l3Cache.healthCheck(),
    ]);

    const l1Health = {
      healthy: true,
      details: this.l1Cache.getStats(),
    };

    const allHealthy = l1Health.healthy && l2Health.healthy && l3Health.healthy;

    return {
      healthy: allHealthy,
      layers: {
        L1: l1Health,
        L2: l2Health,
        L3: l3Health,
      },
    };
  }

  /**
   * Optimize cache distribution based on metrics
   */
  public async optimizeCacheDistribution(): Promise<void> {
    const metrics = this.metrics.getMetrics();
    
    // Analyze hit rates and adjust TTLs
    for (const layer of ['L1', 'L2', 'L3'] as const) {
      const hitRate = metrics.layers[layer].hitRate;
      const targetHitRate = metrics.layers[layer].targetHitRate;
      
      if (hitRate < targetHitRate * 0.8) {
        // Increase TTL if hit rate is too low
        this.emit('cache:optimize', {
          layer,
          action: 'increase-ttl',
          reason: 'low-hit-rate',
          currentHitRate: hitRate,
          targetHitRate,
        });
      }
    }

    // Rebalance based on language distribution
    const norwegianRatio = metrics.languages.no.requests / 
      (metrics.languages.no.requests + metrics.languages.en.requests);
    
    if (norwegianRatio > 0.5) {
      // Increase Norwegian template priority
      await this.warmupNorwegianTemplates();
    }
  }

  private async warmupNorwegianTemplates(): Promise<void> {
    const norwegianTemplates = this.norwegianTemplates.getTemplatesByLanguage('no');
    
    await this.l1Cache.warmup(
      norwegianTemplates.slice(0, 20).map(t => ({
        request: t.request,
        response: t.response,
        ttl: 15 * 60 * 1000, // 15 minutes
      }))
    );
  }

  /**
   * Cleanup
   */
  public async destroy(): Promise<void> {
    this.l1Cache.destroy();
    await this.l2Cache.destroy();
    this.l3Cache.destroy();
    this.removeAllListeners();
  }
}