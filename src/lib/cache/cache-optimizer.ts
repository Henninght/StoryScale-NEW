/**
 * Cache Optimizer
 * Advanced caching strategies, performance optimization, and cache warming procedures
 * Targets: <1 second response time, 45% cache hit rate
 */

import { EventEmitter } from 'events';
import { MultiLayerCache } from './multi-layer-cache';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  SupportedLanguage,
} from '../types/language-aware-request';

export interface CachePattern {
  id: string;
  pattern: Partial<LanguageAwareContentRequest>;
  frequency: number;
  lastUsed: Date;
  avgGenerationTime: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface CacheWarmingConfig {
  enabled: boolean;
  interval: number; // ms
  maxPatterns: number;
  priorityThresholds: {
    critical: number; // frequency threshold
    high: number;
    medium: number;
  };
}

export interface PerformanceTarget {
  maxResponseTime: number; // ms
  targetHitRate: number; // percentage
  maxCacheSizeGB: number;
  maxMemoryUsageMB: number;
}

export interface CacheOptimizationStats {
  currentHitRate: number;
  avgResponseTime: number;
  cacheSizeGB: number;
  memoryUsageMB: number;
  patternsWarmed: number;
  optimizationScore: number; // 0-100
  recommendations: string[];
}

export class CacheOptimizer extends EventEmitter {
  private static instance: CacheOptimizer;
  private multiLayerCache: MultiLayerCache;
  private patterns: Map<string, CachePattern> = new Map();
  private warmingInterval?: NodeJS.Timeout;
  private performanceHistory: Array<{
    timestamp: Date;
    hitRate: number;
    responseTime: number;
  }> = [];
  
  private config: CacheWarmingConfig = {
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    maxPatterns: 100,
    priorityThresholds: {
      critical: 100, // Used 100+ times
      high: 50,
      medium: 20,
    },
  };

  private performanceTargets: PerformanceTarget = {
    maxResponseTime: 1000, // 1 second target
    targetHitRate: 0.45, // 45% hit rate target
    maxCacheSizeGB: 5,
    maxMemoryUsageMB: 500,
  };

  private constructor() {
    super();
    this.multiLayerCache = MultiLayerCache.getInstance({
      l1: {
        maxSize: 2000, // Increased for better hit rate
        ttl: 10 * 60 * 1000, // 10 minutes
        enableCompression: true,
      },
      l2: {
        ttl: 48 * 60 * 60, // 48 hours
        enablePipelining: true,
        enableCompression: true,
      },
      l3: {
        ttl: 14 * 24 * 60 * 60, // 14 days
        enableSmartPurge: true,
        enableStaleWhileRevalidate: true,
      },
      enableParallel: true, // Check all layers simultaneously for speed
      enableWriteThrough: true,
      enableWriteBehind: true,
      warmupOnStart: true,
      metricsEnabled: true,
    });

    this.setupEventListeners();
    this.startWarmingCycle();
  }

  public static getInstance(): CacheOptimizer {
    if (!CacheOptimizer.instance) {
      CacheOptimizer.instance = new CacheOptimizer();
    }
    return CacheOptimizer.instance;
  }

  /**
   * Get optimized cached response or null
   */
  public async get(
    request: LanguageAwareContentRequest
  ): Promise<LanguageAwareResponse | null> {
    const startTime = performance.now();
    
    // Track pattern for warming
    this.trackPattern(request);
    
    // Try multi-layer cache
    const response = await this.multiLayerCache.get(request);
    
    const responseTime = performance.now() - startTime;
    
    // Record performance
    this.recordPerformance(!!response, responseTime);
    
    // Emit performance event
    this.emit('cache:access', {
      hit: !!response,
      responseTime,
      withinTarget: responseTime < this.performanceTargets.maxResponseTime,
    });
    
    return response;
  }

  /**
   * Set response in optimized cache
   */
  public async set(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    generationTime?: number
  ): Promise<void> {
    // Update pattern generation time if provided
    if (generationTime) {
      const patternKey = this.getPatternKey(request);
      const pattern = this.patterns.get(patternKey);
      if (pattern) {
        pattern.avgGenerationTime = 
          (pattern.avgGenerationTime + generationTime) / 2;
      }
    }
    
    // Determine cache layers based on pattern priority
    const priority = this.getPatternPriority(request);
    const layers = this.getCacheLayersForPriority(priority);
    
    // Set with optimized TTLs
    await this.multiLayerCache.set(request, response, {
      layers,
      ttl: this.getOptimizedTTLs(priority),
    });
  }

  /**
   * Warm cache with high-frequency patterns
   */
  public async warmCache(): Promise<void> {
    const startTime = performance.now();
    const patterns = this.getTopPatterns();
    let warmedCount = 0;
    
    this.emit('warming:start', { patternCount: patterns.length });
    
    for (const pattern of patterns) {
      try {
        // Generate content for pattern if not cached
        const cachedResponse = await this.multiLayerCache.get(
          pattern.pattern as LanguageAwareContentRequest
        );
        
        if (!cachedResponse) {
          // Generate new content (this would call your generation service)
          const response = await this.generateForPattern(pattern);
          if (response) {
            await this.set(
              pattern.pattern as LanguageAwareContentRequest,
              response
            );
            warmedCount++;
          }
        }
      } catch (error) {
        this.emit('warming:error', { pattern: pattern.id, error });
      }
    }
    
    const warmingTime = performance.now() - startTime;
    
    this.emit('warming:complete', {
      warmedCount,
      totalPatterns: patterns.length,
      timeMs: warmingTime,
    });
  }

  /**
   * Invalidate cache based on pattern updates
   */
  public async invalidatePattern(
    pattern: Partial<LanguageAwareContentRequest>
  ): Promise<number> {
    // Invalidate across all layers
    const invalidated = await this.multiLayerCache.invalidate({
      language: pattern.outputLanguage,
      type: pattern.type,
      tags: pattern.keywords,
    });
    
    // Remove from patterns
    const patternKey = this.getPatternKey(pattern as LanguageAwareContentRequest);
    this.patterns.delete(patternKey);
    
    this.emit('cache:invalidated', { pattern, count: invalidated });
    
    return invalidated;
  }

  /**
   * Get cache optimization statistics
   */
  public async getStats(): Promise<CacheOptimizationStats> {
    const cacheStats = await this.multiLayerCache.getStats();
    const currentHitRate = cacheStats.overall.hitRate;
    const avgResponseTime = this.getAverageResponseTime();
    
    // Calculate optimization score (0-100)
    const hitRateScore = Math.min(100, (currentHitRate / this.performanceTargets.targetHitRate) * 50);
    const responseTimeScore = Math.min(50, 
      (this.performanceTargets.maxResponseTime / Math.max(1, avgResponseTime)) * 50
    );
    const optimizationScore = Math.round(hitRateScore + responseTimeScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      currentHitRate,
      avgResponseTime,
      cacheStats
    );
    
    return {
      currentHitRate,
      avgResponseTime,
      cacheSizeGB: this.estimateCacheSize(cacheStats),
      memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      patternsWarmed: this.patterns.size,
      optimizationScore,
      recommendations,
    };
  }

  /**
   * Optimize cache distribution based on usage patterns
   */
  public async optimizeDistribution(): Promise<void> {
    const stats = await this.getStats();
    
    if (stats.currentHitRate < this.performanceTargets.targetHitRate) {
      // Increase cache sizes and TTLs
      await this.multiLayerCache.optimizeCacheDistribution();
      
      // Warm more patterns
      if (this.patterns.size < this.config.maxPatterns) {
        this.config.maxPatterns = Math.min(200, this.config.maxPatterns * 1.5);
      }
      
      // Decrease warming interval for more frequent updates
      if (this.config.interval > 2 * 60 * 1000) {
        this.config.interval = Math.max(2 * 60 * 1000, this.config.interval * 0.8);
        this.restartWarmingCycle();
      }
    }
    
    if (stats.avgResponseTime > this.performanceTargets.maxResponseTime) {
      // Enable parallel cache checking
      await this.adjustCacheStrategy('parallel');
    }
    
    this.emit('optimization:complete', stats);
  }

  /**
   * Private helper methods
   */
  
  private trackPattern(request: LanguageAwareContentRequest): void {
    const patternKey = this.getPatternKey(request);
    const existing = this.patterns.get(patternKey);
    
    if (existing) {
      existing.frequency++;
      existing.lastUsed = new Date();
      existing.priority = this.calculatePriority(existing.frequency);
    } else {
      this.patterns.set(patternKey, {
        id: patternKey,
        pattern: this.extractPattern(request),
        frequency: 1,
        lastUsed: new Date(),
        avgGenerationTime: 0,
        priority: 'low',
      });
    }
    
    // Limit pattern storage
    if (this.patterns.size > this.config.maxPatterns * 2) {
      this.prunePatterns();
    }
  }

  private getPatternKey(request: LanguageAwareContentRequest): string {
    return `${request.type}_${request.outputLanguage}_${request.tone}_${request.targetAudience}`;
  }

  private extractPattern(request: LanguageAwareContentRequest): Partial<LanguageAwareContentRequest> {
    return {
      type: request.type,
      outputLanguage: request.outputLanguage,
      tone: request.tone,
      targetAudience: request.targetAudience,
      style: request.style,
    };
  }

  private calculatePriority(frequency: number): CachePattern['priority'] {
    if (frequency >= this.config.priorityThresholds.critical) return 'critical';
    if (frequency >= this.config.priorityThresholds.high) return 'high';
    if (frequency >= this.config.priorityThresholds.medium) return 'medium';
    return 'low';
  }

  private getPatternPriority(request: LanguageAwareContentRequest): CachePattern['priority'] {
    const patternKey = this.getPatternKey(request);
    const pattern = this.patterns.get(patternKey);
    return pattern?.priority || 'low';
  }

  private getCacheLayersForPriority(
    priority: CachePattern['priority']
  ): Array<'L1' | 'L2' | 'L3'> {
    switch (priority) {
      case 'critical':
        return ['L1', 'L2', 'L3'];
      case 'high':
        return ['L1', 'L2'];
      case 'medium':
        return ['L2', 'L3'];
      default:
        return ['L3'];
    }
  }

  private getOptimizedTTLs(priority: CachePattern['priority']): {
    L1?: number;
    L2?: number;
    L3?: number;
  } {
    switch (priority) {
      case 'critical':
        return {
          L1: 30 * 60 * 1000, // 30 minutes
          L2: 7 * 24 * 60 * 60, // 7 days
          L3: 30 * 24 * 60 * 60, // 30 days
        };
      case 'high':
        return {
          L1: 15 * 60 * 1000, // 15 minutes
          L2: 3 * 24 * 60 * 60, // 3 days
          L3: 14 * 24 * 60 * 60, // 14 days
        };
      case 'medium':
        return {
          L2: 24 * 60 * 60, // 1 day
          L3: 7 * 24 * 60 * 60, // 7 days
        };
      default:
        return {
          L3: 3 * 24 * 60 * 60, // 3 days
        };
    }
  }

  private getTopPatterns(): CachePattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.priority !== 'low')
      .sort((a, b) => {
        // Sort by priority then frequency
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.frequency - a.frequency;
      })
      .slice(0, this.config.maxPatterns);
  }

  private async generateForPattern(
    pattern: CachePattern
  ): Promise<LanguageAwareResponse | null> {
    // This would integrate with your generation service
    // For now, returning null as placeholder
    // In production, this would call your AI generation pipeline
    return null;
  }

  private prunePatterns(): void {
    const sorted = Array.from(this.patterns.entries())
      .sort((a, b) => b[1].frequency - a[1].frequency);
    
    const toKeep = sorted.slice(0, this.config.maxPatterns);
    
    this.patterns.clear();
    for (const [key, pattern] of toKeep) {
      this.patterns.set(key, pattern);
    }
  }

  private recordPerformance(hit: boolean, responseTime: number): void {
    // Keep last 1000 records
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.shift();
    }
    
    this.performanceHistory.push({
      timestamp: new Date(),
      hitRate: hit ? 1 : 0,
      responseTime,
    });
  }

  private getAverageResponseTime(): number {
    if (this.performanceHistory.length === 0) return 0;
    
    const sum = this.performanceHistory.reduce(
      (acc, record) => acc + record.responseTime,
      0
    );
    
    return sum / this.performanceHistory.length;
  }

  private estimateCacheSize(stats: any): number {
    // Rough estimation based on entry counts and average size
    const avgEntrySize = 5 * 1024; // 5KB average per entry
    const totalEntries = 
      (stats.l1?.entryCount || 0) +
      (stats.l2?.entryCount || 0) +
      (stats.l3?.entryCount || 0);
    
    return (totalEntries * avgEntrySize) / (1024 * 1024 * 1024); // Convert to GB
  }

  private generateRecommendations(
    hitRate: number,
    avgResponseTime: number,
    cacheStats: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (hitRate < this.performanceTargets.targetHitRate * 0.8) {
      recommendations.push('Increase cache TTLs to improve hit rate');
      recommendations.push('Enable more aggressive cache warming');
    }
    
    if (avgResponseTime > this.performanceTargets.maxResponseTime) {
      recommendations.push('Enable parallel cache checking');
      recommendations.push('Increase L1 cache size for faster access');
    }
    
    if (cacheStats.overall.layerHitRates.L1 < 0.1) {
      recommendations.push('Optimize L1 cache warming for frequent patterns');
    }
    
    if (cacheStats.overall.layerHitRates.L3 > 0.3) {
      recommendations.push('Consider promoting L3 hits to L2 for better performance');
    }
    
    return recommendations;
  }

  private async adjustCacheStrategy(strategy: 'parallel' | 'waterfall'): Promise<void> {
    // This would reconfigure the multi-layer cache strategy
    // For now, just emit an event
    this.emit('strategy:adjusted', { strategy });
  }

  private setupEventListeners(): void {
    // Listen to cache events
    this.multiLayerCache.on('cache:hit', (data) => {
      this.emit('mlc:hit', data);
    });
    
    this.multiLayerCache.on('cache:miss', (data) => {
      this.emit('mlc:miss', data);
    });
    
    // Auto-optimize every hour
    setInterval(() => {
      this.optimizeDistribution();
    }, 60 * 60 * 1000);
  }

  private startWarmingCycle(): void {
    if (!this.config.enabled) return;
    
    this.warmingInterval = setInterval(() => {
      this.warmCache();
    }, this.config.interval);
  }

  private restartWarmingCycle(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }
    this.startWarmingCycle();
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    hitRate: number;
    avgResponseTime: number;
    withinTargets: boolean;
  }> {
    const stats = await this.getStats();
    const withinTargets = 
      stats.currentHitRate >= this.performanceTargets.targetHitRate * 0.9 &&
      stats.avgResponseTime <= this.performanceTargets.maxResponseTime * 1.1;
    
    return {
      healthy: withinTargets,
      hitRate: stats.currentHitRate,
      avgResponseTime: stats.avgResponseTime,
      withinTargets,
    };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }
    this.removeAllListeners();
  }
}