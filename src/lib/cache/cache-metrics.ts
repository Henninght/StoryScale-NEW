/**
 * Cache Metrics Tracking System
 * Monitors performance, hit rates, and language distribution across cache layers
 */

import { EventEmitter } from 'events';
import { SupportedLanguage } from '../types/language-aware-request';

export interface CacheMetricsConfig {
  layers: string[];
  targetHitRates: Record<string, number>;
  windowSize?: number; // Number of requests to keep in sliding window
  reportingInterval?: number; // Milliseconds between metric reports
  enableAlerts?: boolean;
  alertThresholds?: {
    hitRateDropPercent: number;
    latencyIncreasePercent: number;
    errorRatePercent: number;
  };
}

export interface LayerMetrics {
  layer: string;
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
  hitRate: number;
  targetHitRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  lastHour: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export interface LanguageMetrics {
  language: SupportedLanguage;
  requests: number;
  hits: number;
  misses: number;
  hitRate: number;
  averageLatency: number;
  cacheUtilization: number;
  topPatterns: Array<{
    pattern: string;
    count: number;
    hitRate: number;
  }>;
}

export interface MetricsSnapshot {
  timestamp: Date;
  layers: Record<string, LayerMetrics>;
  languages: Record<SupportedLanguage, LanguageMetrics>;
  overall: {
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    averageLatency: number;
    requestsPerSecond: number;
    bandwidthSaved: number;
    costSavings: number;
  };
  alerts: Array<{
    type: 'hit-rate-drop' | 'latency-spike' | 'error-rate-high';
    layer?: string;
    language?: SupportedLanguage;
    message: string;
    severity: 'warning' | 'critical';
    timestamp: Date;
  }>;
}

interface RequestRecord {
  timestamp: number;
  layer: string;
  language: SupportedLanguage;
  hit: boolean;
  latency: number;
  error?: boolean;
}

interface PatternTracker {
  pattern: string;
  hits: number;
  misses: number;
  lastAccessed: Date;
}

export class CacheMetrics extends EventEmitter {
  private config: CacheMetricsConfig;
  private requests: RequestRecord[] = [];
  private layerMetrics: Map<string, LayerMetrics>;
  private languageMetrics: Map<SupportedLanguage, LanguageMetrics>;
  private patternTrackers: Map<string, PatternTracker>;
  private reportingTimer?: NodeJS.Timeout;
  private startTime: number;
  private lastReportTime: number;
  private alerts: Array<MetricsSnapshot['alerts'][0]> = [];

  constructor(config: CacheMetricsConfig) {
    super();
    
    this.config = {
      windowSize: 10000,
      reportingInterval: 60000, // 1 minute
      enableAlerts: true,
      alertThresholds: {
        hitRateDropPercent: 20,
        latencyIncreasePercent: 50,
        errorRatePercent: 5,
      },
      ...config,
    };

    this.startTime = Date.now();
    this.lastReportTime = Date.now();
    this.layerMetrics = new Map();
    this.languageMetrics = new Map();
    this.patternTrackers = new Map();

    this.initializeMetrics();
    this.startReporting();
  }

  /**
   * Initialize metrics for layers and languages
   */
  private initializeMetrics(): void {
    // Initialize layer metrics
    for (const layer of this.config.layers) {
      this.layerMetrics.set(layer, {
        layer,
        hits: 0,
        misses: 0,
        errors: 0,
        totalRequests: 0,
        hitRate: 0,
        targetHitRate: this.config.targetHitRates[layer] || 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        lastHour: {
          hits: 0,
          misses: 0,
          hitRate: 0,
        },
      });
    }

    // Initialize language metrics
    const languages: SupportedLanguage[] = ['en', 'no'];
    for (const language of languages) {
      this.languageMetrics.set(language, {
        language,
        requests: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageLatency: 0,
        cacheUtilization: 0,
        topPatterns: [],
      });
    }
  }

  /**
   * Record a cache hit
   */
  public recordHit(
    language: SupportedLanguage,
    layerResults: Array<{ layer: string; hit: boolean; latency: number }>,
    totalLatency: number
  ): void {
    const hitLayer = layerResults.find(r => r.hit)?.layer;
    
    if (hitLayer) {
      const record: RequestRecord = {
        timestamp: Date.now(),
        layer: hitLayer,
        language,
        hit: true,
        latency: totalLatency,
      };

      this.addRequest(record);
      this.updateLayerMetrics(hitLayer, true, totalLatency);
      this.updateLanguageMetrics(language, true, totalLatency);
    }
  }

  /**
   * Record a cache miss
   */
  public recordMiss(
    language: SupportedLanguage,
    totalLatency: number
  ): void {
    const record: RequestRecord = {
      timestamp: Date.now(),
      layer: 'none',
      language,
      hit: false,
      latency: totalLatency,
    };

    this.addRequest(record);
    
    // Update all layer miss counts
    for (const layer of this.config.layers) {
      this.updateLayerMetrics(layer, false, 0);
    }
    
    this.updateLanguageMetrics(language, false, totalLatency);
  }

  /**
   * Record a write operation
   */
  public recordWrite(
    language: SupportedLanguage,
    layers: string[]
  ): void {
    // Track write patterns for optimization
    const pattern = `write:${language}:${layers.join(',')}`;
    this.trackPattern(pattern, true);
  }

  /**
   * Record an error
   */
  public recordError(layer: string, error: any): void {
    const metrics = this.layerMetrics.get(layer);
    if (metrics) {
      metrics.errors++;
      
      // Check error rate threshold
      if (this.config.enableAlerts) {
        const errorRate = metrics.errors / Math.max(metrics.totalRequests, 1);
        if (errorRate > this.config.alertThresholds!.errorRatePercent / 100) {
          this.createAlert('error-rate-high', {
            layer,
            message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold`,
            severity: 'critical',
          });
        }
      }
    }

    this.emit('metrics:error', { layer, error });
  }

  /**
   * Get current metrics snapshot
   */
  public getMetrics(): MetricsSnapshot {
    const now = Date.now();
    const duration = now - this.startTime;
    
    // Calculate overall metrics
    let totalRequests = 0;
    let totalHits = 0;
    let totalMisses = 0;
    let totalLatency = 0;

    this.layerMetrics.forEach(metrics => {
      totalRequests += metrics.totalRequests;
      totalHits += metrics.hits;
      totalMisses += metrics.misses;
      totalLatency += metrics.averageLatency * metrics.totalRequests;
    });

    const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    const averageLatency = totalRequests > 0 ? totalLatency / totalRequests : 0;
    const requestsPerSecond = totalRequests / (duration / 1000);

    // Estimate bandwidth and cost savings
    const avgResponseSize = 5000; // 5KB average
    const bandwidthSaved = totalHits * avgResponseSize;
    const costPerRequest = 0.001; // $0.001 per API call
    const costSavings = totalHits * costPerRequest;

    return {
      timestamp: new Date(),
      layers: Object.fromEntries(this.layerMetrics),
      languages: Object.fromEntries(this.languageMetrics),
      overall: {
        totalRequests,
        totalHits,
        totalMisses,
        overallHitRate,
        averageLatency,
        requestsPerSecond,
        bandwidthSaved,
        costSavings,
      },
      alerts: [...this.alerts],
    };
  }

  /**
   * Get average latency across all layers
   */
  public getAverageLatency(): number {
    if (this.requests.length === 0) return 0;
    
    const sum = this.requests.reduce((acc, req) => acc + req.latency, 0);
    return sum / this.requests.length;
  }

  /**
   * Get hit rate for a specific layer
   */
  public getLayerHitRate(layer: string): number {
    const metrics = this.layerMetrics.get(layer);
    return metrics?.hitRate || 0;
  }

  /**
   * Get hit rate for a specific language
   */
  public getLanguageHitRate(language: SupportedLanguage): number {
    const metrics = this.languageMetrics.get(language);
    return metrics?.hitRate || 0;
  }

  /**
   * Private helper methods
   */

  private addRequest(record: RequestRecord): void {
    this.requests.push(record);
    
    // Maintain sliding window
    if (this.requests.length > this.config.windowSize!) {
      this.requests.shift();
    }

    // Clean up old requests (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.requests = this.requests.filter(r => r.timestamp > oneHourAgo);
  }

  private updateLayerMetrics(layer: string, hit: boolean, latency: number): void {
    const metrics = this.layerMetrics.get(layer);
    if (!metrics) return;

    metrics.totalRequests++;
    
    if (hit) {
      metrics.hits++;
    } else {
      metrics.misses++;
    }

    // Update hit rate
    metrics.hitRate = metrics.hits / metrics.totalRequests;

    // Update latency metrics
    if (latency > 0) {
      const prevAvg = metrics.averageLatency;
      const count = metrics.totalRequests - 1;
      metrics.averageLatency = (prevAvg * count + latency) / metrics.totalRequests;

      // Update percentiles (simplified)
      this.updatePercentiles(layer, latency);
    }

    // Update last hour metrics
    this.updateLastHourMetrics(layer);

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkHitRateAlert(metrics);
      this.checkLatencyAlert(metrics);
    }
  }

  private updateLanguageMetrics(
    language: SupportedLanguage,
    hit: boolean,
    latency: number
  ): void {
    const metrics = this.languageMetrics.get(language);
    if (!metrics) return;

    metrics.requests++;
    
    if (hit) {
      metrics.hits++;
    } else {
      metrics.misses++;
    }

    // Update hit rate
    metrics.hitRate = metrics.hits / metrics.requests;

    // Update average latency
    const prevAvg = metrics.averageLatency;
    const count = metrics.requests - 1;
    metrics.averageLatency = (prevAvg * count + latency) / metrics.requests;

    // Update top patterns
    this.updateTopPatterns(language);
  }

  private updatePercentiles(layer: string, latency: number): void {
    // Get recent latencies for this layer
    const recentLatencies = this.requests
      .filter(r => r.layer === layer)
      .map(r => r.latency)
      .sort((a, b) => a - b);

    if (recentLatencies.length > 0) {
      const metrics = this.layerMetrics.get(layer)!;
      
      // Calculate percentiles
      const p95Index = Math.floor(recentLatencies.length * 0.95);
      const p99Index = Math.floor(recentLatencies.length * 0.99);
      
      metrics.p95Latency = recentLatencies[p95Index] || latency;
      metrics.p99Latency = recentLatencies[p99Index] || latency;
    }
  }

  private updateLastHourMetrics(layer: string): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const lastHourRequests = this.requests.filter(
      r => r.layer === layer && r.timestamp > oneHourAgo
    );

    const metrics = this.layerMetrics.get(layer)!;
    metrics.lastHour.hits = lastHourRequests.filter(r => r.hit).length;
    metrics.lastHour.misses = lastHourRequests.filter(r => !r.hit).length;
    
    const total = metrics.lastHour.hits + metrics.lastHour.misses;
    metrics.lastHour.hitRate = total > 0 ? metrics.lastHour.hits / total : 0;
  }

  private trackPattern(pattern: string, hit: boolean): void {
    let tracker = this.patternTrackers.get(pattern);
    
    if (!tracker) {
      tracker = {
        pattern,
        hits: 0,
        misses: 0,
        lastAccessed: new Date(),
      };
      this.patternTrackers.set(pattern, tracker);
    }

    if (hit) {
      tracker.hits++;
    } else {
      tracker.misses++;
    }
    
    tracker.lastAccessed = new Date();
  }

  private updateTopPatterns(language: SupportedLanguage): void {
    const languagePatterns = Array.from(this.patternTrackers.values())
      .filter(p => p.pattern.includes(language))
      .map(p => ({
        pattern: p.pattern,
        count: p.hits + p.misses,
        hitRate: (p.hits + p.misses) > 0 ? p.hits / (p.hits + p.misses) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const metrics = this.languageMetrics.get(language)!;
    metrics.topPatterns = languagePatterns;
  }

  private checkHitRateAlert(metrics: LayerMetrics): void {
    const dropThreshold = this.config.alertThresholds!.hitRateDropPercent / 100;
    const expectedHitRate = metrics.targetHitRate;
    
    if (metrics.hitRate < expectedHitRate * (1 - dropThreshold)) {
      this.createAlert('hit-rate-drop', {
        layer: metrics.layer,
        message: `Hit rate ${(metrics.hitRate * 100).toFixed(1)}% is below target ${(expectedHitRate * 100).toFixed(1)}%`,
        severity: 'warning',
      });
    }
  }

  private checkLatencyAlert(metrics: LayerMetrics): void {
    if (metrics.lastHour.hits + metrics.lastHour.misses < 100) {
      return; // Not enough data
    }

    const increaseThreshold = this.config.alertThresholds!.latencyIncreasePercent / 100;
    
    // Compare with historical average
    const historicalAvg = this.getHistoricalAverageLatency(metrics.layer);
    
    if (historicalAvg > 0 && metrics.averageLatency > historicalAvg * (1 + increaseThreshold)) {
      this.createAlert('latency-spike', {
        layer: metrics.layer,
        message: `Latency ${metrics.averageLatency.toFixed(0)}ms is ${((metrics.averageLatency / historicalAvg - 1) * 100).toFixed(0)}% above normal`,
        severity: 'warning',
      });
    }
  }

  private getHistoricalAverageLatency(layer: string): number {
    const historicalRequests = this.requests.filter(r => r.layer === layer);
    
    if (historicalRequests.length === 0) return 0;
    
    const sum = historicalRequests.reduce((acc, r) => acc + r.latency, 0);
    return sum / historicalRequests.length;
  }

  private createAlert(
    type: 'hit-rate-drop' | 'latency-spike' | 'error-rate-high',
    details: {
      layer?: string;
      language?: SupportedLanguage;
      message: string;
      severity: 'warning' | 'critical';
    }
  ): void {
    const alert = {
      type,
      ...details,
      timestamp: new Date(),
    };

    this.alerts.push(alert);
    
    // Keep only recent alerts (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp > oneHourAgo);

    this.emit('metrics:alert', alert);
  }

  private startReporting(): void {
    if (this.config.reportingInterval && this.config.reportingInterval > 0) {
      this.reportingTimer = setInterval(() => {
        this.generateReport();
      }, this.config.reportingInterval);
    }
  }

  private generateReport(): void {
    const metrics = this.getMetrics();
    
    this.emit('metrics:report', metrics);
    
    // Log summary
    console.log(`Cache Metrics Report - ${new Date().toISOString()}`);
    console.log(`Overall Hit Rate: ${(metrics.overall.overallHitRate * 100).toFixed(1)}%`);
    console.log(`Requests/sec: ${metrics.overall.requestsPerSecond.toFixed(1)}`);
    console.log(`Avg Latency: ${metrics.overall.averageLatency.toFixed(0)}ms`);
    console.log(`Cost Savings: $${metrics.overall.costSavings.toFixed(2)}`);
    
    // Check for critical alerts
    const criticalAlerts = metrics.alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      console.warn(`Critical Alerts: ${criticalAlerts.length}`);
      criticalAlerts.forEach(alert => {
        console.warn(`  - ${alert.type}: ${alert.message}`);
      });
    }
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.requests = [];
    this.alerts = [];
    this.patternTrackers.clear();
    this.initializeMetrics();
    this.startTime = Date.now();
    this.lastReportTime = Date.now();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    this.removeAllListeners();
  }
}