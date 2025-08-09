/**
 * Usage Analytics - Analytics and insights for cost optimization
 */

import { EventEmitter } from 'events';
import { SupportedLanguage } from '../types/language-aware-request';
import { CostEntry } from './cost-guardian';
import { AIProvider } from './provider-costs';

// Usage pattern types
export interface UsagePattern {
  id: string;
  type: 'temporal' | 'user' | 'content' | 'language' | 'provider';
  pattern: string;
  frequency: number;
  impact: 'low' | 'medium' | 'high';
  details: Record<string, any>;
}

// Cost optimization suggestion
export interface CostOptimizationSuggestion {
  id: string;
  type: 'cache_adjustment' | 'model_switch' | 'batching' | 'rate_limiting' | 'language_optimization';
  priority: 'low' | 'medium' | 'high';
  estimatedSavings: number;
  estimatedSavingsPercentage: number;
  description: string;
  rationale: string;
  actions: string[];
  implementation: {
    complexity: 'simple' | 'moderate' | 'complex';
    timeToImplement: string;
    requiredChanges: string[];
  };
}

// Time period for analysis
export type AnalysisPeriod = 'hour' | 'day' | 'week' | 'month';

// Usage statistics
export interface UsageStatistics {
  period: AnalysisPeriod;
  startDate: Date;
  endDate: Date;
  totalRequests: number;
  totalCost: number;
  averageCostPerRequest: number;
  medianCostPerRequest: number;
  standardDeviation: number;
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  byLanguage: Record<SupportedLanguage, {
    requests: number;
    cost: number;
    averageCost: number;
  }>;
  byProvider: Record<AIProvider, {
    requests: number;
    cost: number;
    averageCost: number;
  }>;
  byContentType: Record<string, {
    requests: number;
    cost: number;
    averageCost: number;
  }>;
  peakHours: Array<{
    hour: number;
    requests: number;
    cost: number;
  }>;
  cacheMetrics: {
    hitRate: number;
    savings: number;
    potentialSavings: number;
  };
}

// Anomaly detection
export interface CostAnomaly {
  id: string;
  timestamp: Date;
  type: 'spike' | 'unusual_pattern' | 'excessive_cost' | 'error_surge';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedMetric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  possibleCauses: string[];
}

// Trend analysis
export interface CostTrend {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // Percentage per period
  projection: {
    nextDay: number;
    nextWeek: number;
    nextMonth: number;
  };
  confidence: number; // 0-1
}

export class UsageAnalytics extends EventEmitter {
  private static instance: UsageAnalytics;
  private costHistory: CostEntry[] = [];
  private patterns: Map<string, UsagePattern>;
  private anomalies: CostAnomaly[] = [];
  private lastAnalysis: Date;
  private analysisInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.patterns = new Map();
    this.lastAnalysis = new Date();
    this.startAnalysisScheduler();
  }

  public static getInstance(): UsageAnalytics {
    if (!UsageAnalytics.instance) {
      UsageAnalytics.instance = new UsageAnalytics();
    }
    return UsageAnalytics.instance;
  }

  /**
   * Start scheduled analysis
   */
  private startAnalysisScheduler(): void {
    // Run analysis every 15 minutes
    this.analysisInterval = setInterval(() => {
      this.runScheduledAnalysis();
    }, 15 * 60 * 1000);
  }

  /**
   * Run scheduled analysis
   */
  private async runScheduledAnalysis(): Promise<void> {
    const patterns = this.analyzePatterns(this.costHistory);
    const anomalies = this.detectAnomalies(this.costHistory);
    const suggestions = this.generateOptimizations(patterns);

    // Emit events for significant findings
    if (anomalies.length > 0) {
      this.emit('anomalies:detected', anomalies);
    }

    if (suggestions.filter(s => s.priority === 'high').length > 0) {
      this.emit('optimization:urgent', suggestions.filter(s => s.priority === 'high'));
    }

    this.lastAnalysis = new Date();
  }

  /**
   * Analyze usage patterns
   */
  public analyzePatterns(entries: CostEntry[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];

    // Temporal patterns
    patterns.push(...this.analyzeTemporalPatterns(entries));

    // User patterns
    patterns.push(...this.analyzeUserPatterns(entries));

    // Content patterns
    patterns.push(...this.analyzeContentPatterns(entries));

    // Language patterns
    patterns.push(...this.analyzeLanguagePatterns(entries));

    // Provider patterns
    patterns.push(...this.analyzeProviderPatterns(entries));

    // Store patterns
    patterns.forEach(p => this.patterns.set(p.id, p));

    return patterns;
  }

  /**
   * Analyze temporal patterns
   */
  private analyzeTemporalPatterns(entries: CostEntry[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    const hourlyUsage = new Map<number, { count: number; cost: number }>();

    entries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      const current = hourlyUsage.get(hour) || { count: 0, cost: 0 };
      hourlyUsage.set(hour, {
        count: current.count + 1,
        cost: current.cost + entry.actualCost,
      });
    });

    // Find peak hours
    const sortedHours = Array.from(hourlyUsage.entries())
      .sort((a, b) => b[1].cost - a[1].cost);

    if (sortedHours.length > 0) {
      const peakHours = sortedHours.slice(0, 3).map(([hour]) => hour);
      patterns.push({
        id: 'temporal_peak_hours',
        type: 'temporal',
        pattern: 'Peak usage hours',
        frequency: peakHours.length,
        impact: 'high',
        details: {
          peakHours,
          totalCost: sortedHours.slice(0, 3).reduce((sum, [, data]) => sum + data.cost, 0),
        },
      });
    }

    // Detect off-hours usage
    const offHoursUsage = Array.from(hourlyUsage.entries())
      .filter(([hour]) => hour < 6 || hour > 22)
      .reduce((sum, [, data]) => sum + data.cost, 0);

    if (offHoursUsage > 0) {
      const totalCost = entries.reduce((sum, e) => sum + e.actualCost, 0);
      const offHoursPercentage = (offHoursUsage / totalCost) * 100;

      if (offHoursPercentage > 20) {
        patterns.push({
          id: 'temporal_off_hours',
          type: 'temporal',
          pattern: 'Significant off-hours usage',
          frequency: 1,
          impact: 'medium',
          details: {
            offHoursCost: offHoursUsage,
            percentage: offHoursPercentage,
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze user patterns
   */
  private analyzeUserPatterns(entries: CostEntry[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    const userUsage = new Map<string, { count: number; cost: number }>();

    entries.forEach(entry => {
      if (entry.userId) {
        const current = userUsage.get(entry.userId) || { count: 0, cost: 0 };
        userUsage.set(entry.userId, {
          count: current.count + 1,
          cost: current.cost + entry.actualCost,
        });
      }
    });

    // Find heavy users
    const totalCost = entries.reduce((sum, e) => sum + e.actualCost, 0);
    const heavyUsers = Array.from(userUsage.entries())
      .filter(([, data]) => (data.cost / totalCost) > 0.2) // Users consuming > 20%
      .map(([userId, data]) => ({
        userId,
        cost: data.cost,
        percentage: (data.cost / totalCost) * 100,
      }));

    if (heavyUsers.length > 0) {
      patterns.push({
        id: 'user_heavy_usage',
        type: 'user',
        pattern: 'Heavy user concentration',
        frequency: heavyUsers.length,
        impact: 'high',
        details: { heavyUsers },
      });
    }

    return patterns;
  }

  /**
   * Analyze content patterns
   */
  private analyzeContentPatterns(entries: CostEntry[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    const contentTypes = new Map<string, { count: number; cost: number }>();

    entries.forEach(entry => {
      // Extract content type from request (would need to be stored in CostEntry)
      const contentType = entry.metadata.researchApiUsed ? 'research-heavy' : 'standard';
      const current = contentTypes.get(contentType) || { count: 0, cost: 0 };
      contentTypes.set(contentType, {
        count: current.count + 1,
        cost: current.cost + entry.actualCost,
      });
    });

    // Identify expensive content types
    const expensiveTypes = Array.from(contentTypes.entries())
      .filter(([, data]) => data.count > 0 && (data.cost / data.count) > 0.1)
      .map(([type, data]) => ({
        type,
        averageCost: data.cost / data.count,
        totalCost: data.cost,
      }));

    if (expensiveTypes.length > 0) {
      patterns.push({
        id: 'content_expensive_types',
        type: 'content',
        pattern: 'Expensive content types',
        frequency: expensiveTypes.length,
        impact: 'medium',
        details: { expensiveTypes },
      });
    }

    return patterns;
  }

  /**
   * Analyze language patterns
   */
  private analyzeLanguagePatterns(entries: CostEntry[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    const languageUsage = new Map<SupportedLanguage, {
      count: number;
      cost: number;
      translated: number;
      culturalAdaptation: number;
    }>();

    entries.forEach(entry => {
      const current = languageUsage.get(entry.language) || {
        count: 0,
        cost: 0,
        translated: 0,
        culturalAdaptation: 0,
      };
      
      languageUsage.set(entry.language, {
        count: current.count + 1,
        cost: current.cost + entry.actualCost,
        translated: current.translated + (entry.metadata.wasTranslated ? 1 : 0),
        culturalAdaptation: current.culturalAdaptation + (entry.metadata.culturalAdaptation ? 1 : 0),
      });
    });

    // Norwegian overhead analysis
    const norwegianData = languageUsage.get('no');
    const englishData = languageUsage.get('en');

    if (norwegianData && englishData) {
      const norwegianAvg = norwegianData.cost / norwegianData.count;
      const englishAvg = englishData.cost / englishData.count;
      const overhead = ((norwegianAvg - englishAvg) / englishAvg) * 100;

      if (overhead > 20) {
        patterns.push({
          id: 'language_norwegian_overhead',
          type: 'language',
          pattern: 'High Norwegian language overhead',
          frequency: 1,
          impact: 'high',
          details: {
            norwegianAverage: norwegianAvg,
            englishAverage: englishAvg,
            overheadPercentage: overhead,
            translationRate: (norwegianData.translated / norwegianData.count) * 100,
            culturalAdaptationRate: (norwegianData.culturalAdaptation / norwegianData.count) * 100,
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze provider patterns
   */
  private analyzeProviderPatterns(entries: CostEntry[]): UsagePattern[] {
    const patterns: UsagePattern[] = [];
    const providerUsage = new Map<AIProvider, {
      count: number;
      cost: number;
      fallbacks: number;
    }>();

    entries.forEach(entry => {
      const current = providerUsage.get(entry.provider) || {
        count: 0,
        cost: 0,
        fallbacks: 0,
      };
      
      providerUsage.set(entry.provider, {
        count: current.count + 1,
        cost: current.cost + entry.actualCost,
        fallbacks: current.fallbacks + (entry.metadata.fallbackUsed ? 1 : 0),
      });
    });

    // Find provider concentration
    const totalCost = entries.reduce((sum, e) => sum + e.actualCost, 0);
    const dominantProviders = Array.from(providerUsage.entries())
      .filter(([, data]) => (data.cost / totalCost) > 0.5)
      .map(([provider, data]) => ({
        provider,
        percentage: (data.cost / totalCost) * 100,
        fallbackRate: (data.fallbacks / data.count) * 100,
      }));

    if (dominantProviders.length > 0) {
      patterns.push({
        id: 'provider_concentration',
        type: 'provider',
        pattern: 'Provider concentration risk',
        frequency: dominantProviders.length,
        impact: 'medium',
        details: { dominantProviders },
      });
    }

    return patterns;
  }

  /**
   * Generate optimization suggestions
   */
  public generateOptimizations(patterns: UsagePattern[]): CostOptimizationSuggestion[] {
    const suggestions: CostOptimizationSuggestion[] = [];

    // Cache optimization
    const cachePattern = patterns.find(p => p.id === 'cache_low_hit_rate');
    if (cachePattern) {
      suggestions.push({
        id: 'opt_improve_cache',
        type: 'cache_adjustment',
        priority: 'high',
        estimatedSavings: this.estimateCacheSavings(),
        estimatedSavingsPercentage: 15,
        description: 'Improve cache hit rate',
        rationale: 'Current cache hit rate is below optimal levels',
        actions: [
          'increase_cache_ttl',
          'implement_semantic_caching',
          'cache_norwegian_templates',
        ],
        implementation: {
          complexity: 'moderate',
          timeToImplement: '2-3 days',
          requiredChanges: [
            'Update cache configuration',
            'Implement semantic similarity matching',
            'Add Norwegian-specific cache keys',
          ],
        },
      });
    }

    // Language optimization
    const norwegianPattern = patterns.find(p => p.id === 'language_norwegian_overhead');
    if (norwegianPattern && norwegianPattern.details.overheadPercentage > 30) {
      suggestions.push({
        id: 'opt_norwegian_batching',
        type: 'language_optimization',
        priority: 'high',
        estimatedSavings: norwegianPattern.details.norwegianAverage * 0.2,
        estimatedSavingsPercentage: 20,
        description: 'Implement Norwegian content batching',
        rationale: 'High overhead detected for Norwegian content generation',
        actions: [
          'batch_translations',
          'cache_cultural_adaptations',
          'preprocess_common_phrases',
        ],
        implementation: {
          complexity: 'complex',
          timeToImplement: '1 week',
          requiredChanges: [
            'Implement translation batching system',
            'Create Norwegian phrase database',
            'Add cultural adaptation cache',
          ],
        },
      });
    }

    // Model optimization
    const expensivePattern = patterns.find(p => p.id === 'content_expensive_types');
    if (expensivePattern) {
      suggestions.push({
        id: 'opt_model_routing',
        type: 'model_switch',
        priority: 'medium',
        estimatedSavings: this.estimateModelSavings(expensivePattern),
        estimatedSavingsPercentage: 30,
        description: 'Optimize model selection for content types',
        rationale: 'Some content types are using unnecessarily expensive models',
        actions: [
          'use_cheaper_model',
          'implement_dynamic_routing',
          'add_quality_thresholds',
        ],
        implementation: {
          complexity: 'simple',
          timeToImplement: '1 day',
          requiredChanges: [
            'Update model routing logic',
            'Add content complexity detection',
            'Configure quality thresholds',
          ],
        },
      });
    }

    // Peak hour optimization
    const peakPattern = patterns.find(p => p.id === 'temporal_peak_hours');
    if (peakPattern) {
      suggestions.push({
        id: 'opt_peak_batching',
        type: 'batching',
        priority: 'low',
        estimatedSavings: peakPattern.details.totalCost * 0.1,
        estimatedSavingsPercentage: 10,
        description: 'Implement request batching during peak hours',
        rationale: 'High concentration of requests during specific hours',
        actions: [
          'enable_request_batching',
          'implement_queue_system',
          'add_priority_routing',
        ],
        implementation: {
          complexity: 'moderate',
          timeToImplement: '3-4 days',
          requiredChanges: [
            'Implement request queue',
            'Add batching logic',
            'Create priority system',
          ],
        },
      });
    }

    // Sort by priority and estimated savings
    return suggestions.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.estimatedSavings - a.estimatedSavings;
    });
  }

  /**
   * Detect anomalies
   */
  public detectAnomalies(entries: CostEntry[]): CostAnomaly[] {
    const anomalies: CostAnomaly[] = [];
    
    if (entries.length < 10) {
      return anomalies; // Not enough data for anomaly detection
    }

    // Calculate statistics
    const costs = entries.map(e => e.actualCost);
    const mean = costs.reduce((a, b) => a + b, 0) / costs.length;
    const stdDev = Math.sqrt(
      costs.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / costs.length
    );

    // Detect cost spikes (> 3 standard deviations)
    entries.forEach(entry => {
      const zScore = (entry.actualCost - mean) / stdDev;
      if (Math.abs(zScore) > 3) {
        anomalies.push({
          id: `anomaly_${entry.id}`,
          timestamp: entry.timestamp,
          type: 'spike',
          severity: Math.abs(zScore) > 4 ? 'high' : 'medium',
          description: `Unusual cost spike detected: $${entry.actualCost.toFixed(4)}`,
          affectedMetric: 'cost',
          expectedValue: mean,
          actualValue: entry.actualCost,
          deviation: zScore,
          possibleCauses: [
            'Large content generation',
            'Multiple retries',
            'Expensive model usage',
            entry.language === 'no' ? 'Norwegian content complexity' : '',
          ].filter(Boolean),
        });
      }
    });

    // Detect error patterns
    const errorEntries = entries.filter(e => e.metadata.fallbackUsed);
    if (errorEntries.length > entries.length * 0.1) {
      anomalies.push({
        id: `anomaly_error_rate_${Date.now()}`,
        timestamp: new Date(),
        type: 'error_surge',
        severity: 'high',
        description: 'High error rate detected',
        affectedMetric: 'error_rate',
        expectedValue: 0.05,
        actualValue: errorEntries.length / entries.length,
        deviation: ((errorEntries.length / entries.length) - 0.05) / 0.05,
        possibleCauses: [
          'Provider issues',
          'Network problems',
          'Model capacity',
        ],
      });
    }

    this.anomalies = anomalies;
    return anomalies;
  }

  /**
   * Calculate usage statistics
   */
  public calculateStatistics(
    entries: CostEntry[],
    period: AnalysisPeriod = 'day'
  ): UsageStatistics {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const periodEntries = entries.filter(e => e.timestamp >= startDate);
    const costs = periodEntries.map(e => e.actualCost).sort((a, b) => a - b);
    const totalCost = costs.reduce((a, b) => a + b, 0);
    const mean = costs.length > 0 ? totalCost / costs.length : 0;

    // Calculate percentiles
    const getPercentile = (p: number) => {
      if (costs.length === 0) return 0;
      const index = Math.ceil((p / 100) * costs.length) - 1;
      return costs[Math.max(0, index)];
    };

    // Group by dimensions
    const byLanguage: Record<SupportedLanguage, any> = { en: null, no: null };
    const byProvider: Record<string, any> = {};
    const byContentType: Record<string, any> = {};
    const hourlyData = new Map<number, { requests: number; cost: number }>();

    periodEntries.forEach(entry => {
      // Language grouping
      if (!byLanguage[entry.language]) {
        byLanguage[entry.language] = { requests: 0, cost: 0, averageCost: 0 };
      }
      byLanguage[entry.language].requests++;
      byLanguage[entry.language].cost += entry.actualCost;

      // Provider grouping
      if (!byProvider[entry.provider]) {
        byProvider[entry.provider] = { requests: 0, cost: 0, averageCost: 0 };
      }
      byProvider[entry.provider].requests++;
      byProvider[entry.provider].cost += entry.actualCost;

      // Hourly grouping
      const hour = entry.timestamp.getHours();
      const hourData = hourlyData.get(hour) || { requests: 0, cost: 0 };
      hourlyData.set(hour, {
        requests: hourData.requests + 1,
        cost: hourData.cost + entry.actualCost,
      });
    });

    // Calculate averages
    Object.keys(byLanguage).forEach(lang => {
      if (byLanguage[lang as SupportedLanguage]) {
        const data = byLanguage[lang as SupportedLanguage];
        data.averageCost = data.requests > 0 ? data.cost / data.requests : 0;
      }
    });

    Object.keys(byProvider).forEach(provider => {
      const data = byProvider[provider];
      data.averageCost = data.requests > 0 ? data.cost / data.requests : 0;
    });

    // Get peak hours
    const peakHours = Array.from(hourlyData.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Calculate cache metrics
    const cacheHits = periodEntries.filter(e => e.cacheSavings > 0).length;
    const totalSavings = periodEntries.reduce((sum, e) => sum + e.cacheSavings, 0);

    return {
      period,
      startDate,
      endDate: now,
      totalRequests: periodEntries.length,
      totalCost,
      averageCostPerRequest: mean,
      medianCostPerRequest: getPercentile(50),
      standardDeviation: Math.sqrt(
        costs.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / Math.max(1, costs.length)
      ),
      percentiles: {
        p50: getPercentile(50),
        p75: getPercentile(75),
        p90: getPercentile(90),
        p95: getPercentile(95),
        p99: getPercentile(99),
      },
      byLanguage: byLanguage as any,
      byProvider: byProvider as any,
      byContentType,
      peakHours,
      cacheMetrics: {
        hitRate: periodEntries.length > 0 ? (cacheHits / periodEntries.length) * 100 : 0,
        savings: totalSavings,
        potentialSavings: totalCost * 0.3, // Estimate 30% potential savings
      },
    };
  }

  /**
   * Analyze cost trends
   */
  public analyzeTrends(entries: CostEntry[]): CostTrend[] {
    const trends: CostTrend[] = [];
    
    if (entries.length < 2) {
      return trends;
    }

    // Sort by timestamp
    const sortedEntries = [...entries].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Calculate daily averages
    const dailyData = new Map<string, { cost: number; count: number }>();
    sortedEntries.forEach(entry => {
      const day = entry.timestamp.toISOString().split('T')[0];
      const current = dailyData.get(day) || { cost: 0, count: 0 };
      dailyData.set(day, {
        cost: current.cost + entry.actualCost,
        count: current.count + 1,
      });
    });

    const dailyAverages = Array.from(dailyData.entries())
      .map(([day, data]) => ({
        day,
        average: data.cost / data.count,
        total: data.cost,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));

    if (dailyAverages.length >= 2) {
      // Calculate trend
      const recentDays = dailyAverages.slice(-7);
      const firstHalf = recentDays.slice(0, Math.floor(recentDays.length / 2));
      const secondHalf = recentDays.slice(Math.floor(recentDays.length / 2));

      const firstAvg = firstHalf.reduce((sum, d) => sum + d.total, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.total, 0) / secondHalf.length;
      const changeRate = ((secondAvg - firstAvg) / firstAvg) * 100;

      let direction: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(changeRate) < 5) direction = 'stable';
      else if (changeRate > 0) direction = 'increasing';
      else direction = 'decreasing';

      trends.push({
        metric: 'daily_cost',
        direction,
        changeRate,
        projection: {
          nextDay: secondAvg * (1 + changeRate / 100),
          nextWeek: secondAvg * 7 * Math.pow(1 + changeRate / 100, 7),
          nextMonth: secondAvg * 30 * Math.pow(1 + changeRate / 100, 30),
        },
        confidence: Math.min(0.9, dailyAverages.length / 30), // More data = higher confidence
      });
    }

    return trends;
  }

  /**
   * Estimate cache savings
   */
  private estimateCacheSavings(): number {
    const recentEntries = this.costHistory.slice(-1000);
    const totalCost = recentEntries.reduce((sum, e) => sum + e.actualCost, 0);
    const currentSavings = recentEntries.reduce((sum, e) => sum + e.cacheSavings, 0);
    const potentialSavings = totalCost * 0.3 - currentSavings;
    return Math.max(0, potentialSavings);
  }

  /**
   * Estimate model savings
   */
  private estimateModelSavings(pattern: UsagePattern): number {
    if (!pattern.details.expensiveTypes) return 0;
    
    const expensiveTypes = pattern.details.expensiveTypes as Array<{
      type: string;
      averageCost: number;
      totalCost: number;
    }>;

    return expensiveTypes.reduce((sum, type) => {
      // Estimate 30% savings by using cheaper models for simple content
      return sum + (type.totalCost * 0.3);
    }, 0);
  }

  /**
   * Add cost entries for analysis
   */
  public addCostEntries(entries: CostEntry[]): void {
    this.costHistory.push(...entries);
    
    // Keep history size manageable (last 10,000 entries)
    if (this.costHistory.length > 10000) {
      this.costHistory = this.costHistory.slice(-10000);
    }
  }

  /**
   * Get patterns
   */
  public getPatterns(): UsagePattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get anomalies
   */
  public getAnomalies(): CostAnomaly[] {
    return this.anomalies;
  }

  /**
   * Clear analytics data
   */
  public clearData(): void {
    this.costHistory = [];
    this.patterns.clear();
    this.anomalies = [];
  }

  /**
   * Stop analysis scheduler
   */
  public stopAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }
}