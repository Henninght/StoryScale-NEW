/**
 * Multi-Layer Cache System - Core caching infrastructure
 * 
 * 3-Layer Caching Strategy:
 * - L1 Memory: 5 min TTL, 15% hit rate target (request deduplication)
 * - L2 Redis: 24 hour TTL, 25% hit rate target (research results & patterns)
 * - L3 CDN: 7 day TTL, 10% hit rate target (common templates & responses)
 * 
 * Total target cache hit rate: 50%
 */

import { ContentResponse } from '../gateway/intelligent-gateway'

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  layer: 'L1' | 'L2' | 'L3'
}

export class MultiLayerCache {
  private l1Cache: Map<string, CacheEntry> = new Map()
  private l2Cache: RedisCache | null = null
  private l3Cache: CDNCache | null = null
  private metrics: Map<string, CacheMetrics> = new Map()
  
  constructor() {
    this.initializeMetrics()
    this.initializeL2Cache()
    this.initializeL3Cache()
    this.startCleanupTimer()
  }

  /**
   * Get cached content from any layer (L1 -> L2 -> L3)
   */
  async get(key: string): Promise<ContentResponse | null> {
    // Try L1 (Memory) first - fastest
    const l1Result = this.getFromL1(key)
    if (l1Result) {
      this.recordHit('L1')
      return l1Result
    }
    this.recordMiss('L1')

    // Try L2 (Redis) - medium speed
    const l2Result = await this.getFromL2(key)
    if (l2Result) {
      this.recordHit('L2')
      // Promote to L1 for faster access
      this.setInL1(key, l2Result, 5 * 60) // 5 min
      return l2Result
    }
    this.recordMiss('L2')

    // Try L3 (CDN) - slowest but largest
    const l3Result = await this.getFromL3(key)
    if (l3Result) {
      this.recordHit('L3')
      // Promote to L2 and L1
      await this.setInL2(key, l3Result, 24 * 60 * 60) // 24 hours
      this.setInL1(key, l3Result, 5 * 60) // 5 min
      return l3Result
    }
    this.recordMiss('L3')

    return null
  }

  /**
   * Set content in specified cache layer
   */
  async set(
    key: string, 
    value: ContentResponse, 
    ttl: number, 
    layer: 'L1' | 'L2' | 'L3' = 'L2'
  ): Promise<void> {
    switch (layer) {
      case 'L1':
        this.setInL1(key, value, ttl)
        break
      case 'L2':
        await this.setInL2(key, value, ttl)
        // Also cache in L1 for immediate access
        this.setInL1(key, value, Math.min(ttl, 5 * 60))
        break
      case 'L3':
        await this.setInL3(key, value, ttl)
        // Also cache in L2 and L1
        await this.setInL2(key, value, Math.min(ttl, 24 * 60 * 60))
        this.setInL1(key, value, 5 * 60)
        break
    }
  }

  /**
   * L1 Cache Operations (In-Memory)
   */
  private getFromL1(key: string): ContentResponse | null {
    const entry = this.l1Cache.get(key)
    if (!entry) return null
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.l1Cache.delete(key)
      return null
    }
    
    return entry.value
  }

  private setInL1(key: string, value: ContentResponse, ttl: number): void {
    const expiresAt = Date.now() + (ttl * 1000)
    this.l1Cache.set(key, { value, expiresAt })
  }

  /**
   * L2 Cache Operations (Redis)
   */
  private async getFromL2(key: string): Promise<ContentResponse | null> {
    if (!this.l2Cache) return null
    return await this.l2Cache.get(key)
  }

  private async setInL2(key: string, value: ContentResponse, ttl: number): Promise<void> {
    if (!this.l2Cache) return
    await this.l2Cache.set(key, value, ttl)
  }

  /**
   * L3 Cache Operations (CDN/Edge Cache)
   */
  private async getFromL3(key: string): Promise<ContentResponse | null> {
    if (!this.l3Cache) return null
    return await this.l3Cache.get(key)
  }

  private async setInL3(key: string, value: ContentResponse, ttl: number): Promise<void> {
    if (!this.l3Cache) return
    await this.l3Cache.set(key, value, ttl)
  }

  /**
   * Cache warming - preload common requests
   */
  async warmCache(commonRequests: Array<{key: string, value: ContentResponse}>): Promise<void> {
    for (const { key, value } of commonRequests) {
      // Set in all layers for maximum hit rate
      await this.set(key, value, 7 * 24 * 60 * 60, 'L3') // 7 days
    }
  }

  /**
   * Cache invalidation for pattern updates
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // L1 - check all keys
    for (const [key] of this.l1Cache) {
      if (key.includes(pattern)) {
        this.l1Cache.delete(key)
      }
    }
    
    // L2 - Redis pattern deletion
    if (this.l2Cache) {
      await this.l2Cache.deletePattern(pattern)
    }
    
    // L3 - CDN invalidation
    if (this.l3Cache) {
      await this.l3Cache.invalidatePattern(pattern)
    }
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): Map<string, CacheMetrics> {
    return new Map(this.metrics)
  }

  /**
   * Initialize cache layers
   */
  private initializeMetrics(): void {
    this.metrics.set('L1', { hits: 0, misses: 0, hitRate: 0, layer: 'L1' })
    this.metrics.set('L2', { hits: 0, misses: 0, hitRate: 0, layer: 'L2' })
    this.metrics.set('L3', { hits: 0, misses: 0, hitRate: 0, layer: 'L3' })
  }

  private initializeL2Cache(): void {
    try {
      this.l2Cache = new RedisCache()
    } catch (error) {
      console.warn('Redis cache not available:', error.message)
    }
  }

  private initializeL3Cache(): void {
    try {
      this.l3Cache = new CDNCache()
    } catch (error) {
      console.warn('CDN cache not available:', error.message)
    }
  }

  private recordHit(layer: 'L1' | 'L2' | 'L3'): void {
    const metrics = this.metrics.get(layer)!
    metrics.hits++
    metrics.hitRate = metrics.hits / (metrics.hits + metrics.misses)
    this.metrics.set(layer, metrics)
  }

  private recordMiss(layer: 'L1' | 'L2' | 'L3'): void {
    const metrics = this.metrics.get(layer)!
    metrics.misses++
    metrics.hitRate = metrics.hits / (metrics.hits + metrics.misses)
    this.metrics.set(layer, metrics)
  }

  /**
   * Cleanup expired L1 entries
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.l1Cache) {
        if (now > entry.expiresAt) {
          this.l1Cache.delete(key)
        }
      }
    }, 5 * 60 * 1000) // Clean up every 5 minutes
  }
}

interface CacheEntry {
  value: ContentResponse
  expiresAt: number
}

/**
 * Redis Cache Implementation (L2)
 */
class RedisCache {
  private client: unknown = null

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    if (typeof window !== 'undefined') return // Client-side, skip Redis

    try {
      const redis = await import('redis')
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      })
      
      (this.client as any).on('error', (err: unknown) => {
        console.warn('Redis Client Error:', err)
      })
      
      await (this.client as any).connect()
    } catch (error) {
      console.warn('Failed to initialize Redis:', error)
    }
  }

  async get(key: string): Promise<ContentResponse | null> {
    if (!this.client) return null
    
    try {
      const result = await (this.client as any).get(`storyscale:${key}`)
      return result ? JSON.parse(result) : null
    } catch (error) {
      console.warn('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: ContentResponse, ttl: number): Promise<void> {
    if (!this.client) return
    
    try {
      await (this.client as any).setEx(
        `storyscale:${key}`, 
        ttl, 
        JSON.stringify(value)
      )
    } catch (error) {
      console.warn('Redis set error:', error)
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.client) return
    
    try {
      const keys = await (this.client as any).keys(`storyscale:*${pattern}*`)
      if (keys.length > 0) {
        await (this.client as any).del(keys)
      }
    } catch (error) {
      console.warn('Redis delete pattern error:', error)
    }
  }
}

/**
 * CDN Cache Implementation (L3)
 * This is a placeholder for edge cache integration
 */
class CDNCache {
  async get(_key: string): Promise<ContentResponse | null> {
    // In production, this would integrate with Vercel Edge Cache or CloudFlare
    // For now, return null (no L3 cache)
    return null
  }

  async set(_key: string, _value: ContentResponse, _ttl: number): Promise<void> {
    // In production, this would set edge cache headers
    // For now, this is a no-op
  }

  async invalidatePattern(_pattern: string): Promise<void> {
    // In production, this would invalidate CDN cache
    // For now, this is a no-op
  }
}