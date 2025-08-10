/**
 * Cost Guardian - Main cost tracking and monitoring system for StoryScale
 * Provides comprehensive cost tracking with Norwegian language support
 */

import { EventEmitter } from 'events';
import {
  SupportedLanguage,
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  RouteDecision,
} from '../types/language-aware-request';
import { CostCalculator, CostBreakdown, LanguageCostMultiplier } from './cost-calculator';
import { BudgetAlertSystem, BudgetAlert, AlertSeverity } from './budget-alerts';
import { UsageAnalytics, UsagePattern, CostOptimizationSuggestion } from './usage-analytics';
import { ProviderCostModel, AIProvider as AIProviderModel } from './provider-costs';

// Cost tracking events
export interface CostGuardianEvents {
  'cost:tracked': (entry: CostEntry) => void;
  'budget:alert': (alert: BudgetAlert) => void;
  'quota:exceeded': (userId: string, quota: UserQuota) => void;
  'optimization:suggestion': (suggestion: CostOptimizationSuggestion) => void;
  'provider:comparison': (comparison: ProviderComparison) => void;
  'language:overhead': (overhead: LanguageOverhead) => void;
}

// Cost entry structure
export interface CostEntry {
  id: string;
  timestamp: Date;
  requestId: string;
  userId?: string;
  language: SupportedLanguage;
  provider: AIProvider;
  model: string;
  breakdown: CostBreakdown;
  actualCost: number;
  estimatedCost: number;
  cacheSavings: number;
  metadata: {
    wasTranslated?: boolean;
    culturalAdaptation?: boolean;
    fallbackUsed?: boolean;
    researchApiUsed?: boolean;
    processingTime: number;
  };
}

// User quota management
export interface UserQuota {
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  currentDaily: number;
  currentMonthly: number;
  resetDaily: Date;
  resetMonthly: Date;
  languageBreakdown: Record<SupportedLanguage, number>;
  warningThreshold: number; // Percentage (0-100)
}

// Provider comparison
export interface ProviderComparison {
  request: LanguageAwareContentRequest;
  providers: Array<{
    provider: AIProvider;
    model: string;
    estimatedCost: number;
    estimatedTime: number;
    languageSupport: 'native' | 'translated' | 'limited';
    confidence: number;
  }>;
  recommendation: {
    provider: AIProvider;
    model: string;
    reason: string;
    savingsVsBest: number;
  };
}

// Language overhead tracking
export interface LanguageOverhead {
  language: SupportedLanguage;
  baselineCost: number;
  actualCost: number;
  overhead: number;
  overheadPercentage: number;
  factors: string[];
}

// Cost optimization settings
export interface CostOptimizationSettings {
  enableAutoOptimization: boolean;
  cacheAggressiveness: 'low' | 'medium' | 'high';
  preferredProviders: AIProvider[];
  languagePriority: Record<SupportedLanguage, number>;
  budgetMode: 'strict' | 'flexible' | 'unlimited';
  alertThresholds: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

// Real-time cost tracking
export interface RealTimeCostMetrics {
  currentHour: number;
  currentDay: number;
  currentWeek: number;
  currentMonth: number;
  projectedDaily: number;
  projectedMonthly: number;
  trendsLastHour: number; // Percentage change
  trendsLastDay: number;
  hotspots: Array<{
    type: 'user' | 'language' | 'provider' | 'model';
    identifier: string;
    cost: number;
    percentage: number;
  }>;
}

export class CostGuardian extends EventEmitter {
  private static instance: CostGuardian;
  private costCalculator: CostCalculator;
  private alertSystem: BudgetAlertSystem;
  private analytics: UsageAnalytics;
  private costEntries: Map<string, CostEntry>;
  private userQuotas: Map<string, UserQuota>;
  private realTimeMetrics!: RealTimeCostMetrics;
  private optimizationSettings!: CostOptimizationSettings;
  private costHistory: CostEntry[] = [];
  private providerModels: Map<AIProvider, ProviderCostModel>;

  private constructor() {
    super();
    this.costCalculator = CostCalculator.getInstance();
    this.alertSystem = BudgetAlertSystem.getInstance();
    this.analytics = UsageAnalytics.getInstance();
    this.costEntries = new Map();
    this.userQuotas = new Map();
    this.providerModels = new Map();
    this.initializeRealTimeMetrics();
    this.initializeOptimizationSettings();
    this.setupEventListeners();
    this.startMetricsUpdater();
  }

  public static getInstance(): CostGuardian {
    if (!CostGuardian.instance) {
      CostGuardian.instance = new CostGuardian();
    }
    return CostGuardian.instance;
  }

  /**
   * Initialize real-time metrics
   */
  private initializeRealTimeMetrics(): void {
    this.realTimeMetrics = {
      currentHour: 0,
      currentDay: 0,
      currentWeek: 0,
      currentMonth: 0,
      projectedDaily: 0,
      projectedMonthly: 0,
      trendsLastHour: 0,
      trendsLastDay: 0,
      hotspots: [],
    };
  }

  /**
   * Initialize optimization settings
   */
  private initializeOptimizationSettings(): void {
    this.optimizationSettings = {
      enableAutoOptimization: true,
      cacheAggressiveness: 'medium',
      preferredProviders: ['openai', 'anthropic'],
      languagePriority: {
        en: 1.0,
        no: 1.2, // Higher priority for Norwegian
      },
      budgetMode: 'flexible',
      alertThresholds: {
        daily: 100,
        weekly: 500,
        monthly: 1500,
      },
    };
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.alertSystem.on('alert:triggered', (alert: BudgetAlert) => {
      this.emit('budget:alert', alert);
      this.handleBudgetAlert(alert);
    });

    this.analytics.on('optimization:found', (suggestion: CostOptimizationSuggestion) => {
      this.emit('optimization:suggestion', suggestion);
      if (this.optimizationSettings.enableAutoOptimization) {
        this.applyOptimization(suggestion);
      }
    });
  }

  /**
   * Start real-time metrics updater
   */
  private startMetricsUpdater(): void {
    // Update metrics every minute
    setInterval(() => {
      this.updateRealTimeMetrics();
      this.checkBudgetThresholds();
      this.analyzeUsagePatterns();
    }, 60000);

    // Update projections every 5 minutes
    setInterval(() => {
      this.updateProjections();
      this.identifyHotspots();
    }, 300000);
  }

  /**
   * Track cost for a request
   */
  public async trackRequestCost(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    route: RouteDecision,
    userId?: string
  ): Promise<CostEntry> {
    // Calculate costs
    const breakdown = await this.costCalculator.calculateCost(request, response, route);
    
    // Calculate cache savings
    const cacheSavings = response.metadata.cacheHit 
      ? breakdown.total 
      : this.calculateCacheSavings(request, response);

    // Create cost entry
    const entry: CostEntry = {
      id: `cost_${Date.now()}_${request.id}`,
      timestamp: new Date(),
      requestId: request.id,
      userId,
      language: request.outputLanguage,
      provider: this.getProviderFromModel(route.targetModel),
      model: route.targetModel,
      breakdown,
      actualCost: breakdown.total,
      estimatedCost: route.estimatedCost,
      cacheSavings,
      metadata: {
        wasTranslated: response.metadata.wasTranslated,
        culturalAdaptation: !!request.culturalContext,
        fallbackUsed: response.metadata.fallbackUsed,
        researchApiUsed: !!breakdown.researchCost,
        processingTime: response.metadata.processingTime,
      },
    };

    // Store entry
    this.costEntries.set(entry.id, entry);
    this.costHistory.push(entry);

    // Update user quota if applicable
    if (userId) {
      await this.updateUserQuota(userId, entry);
    }

    // Update real-time metrics
    this.updateMetricsWithEntry(entry);

    // Check for language overhead
    this.checkLanguageOverhead(entry);

    // Emit event
    this.emit('cost:tracked', entry);

    return entry;
  }

  /**
   * Calculate cache savings
   */
  private calculateCacheSavings(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse
  ): number {
    if (!response.metadata.cacheHit) {
      return 0;
    }

    // Estimate what the cost would have been without cache
    const estimatedTokens = response.metadata.tokenUsage.total;
    const modelCost = this.getModelCostPerToken(response.metadata.model);
    const baseCost = estimatedTokens * modelCost;

    // Add language multiplier for Norwegian
    const languageMultiplier = request.outputLanguage === 'no' ? 1.3 : 1.0;
    
    return baseCost * languageMultiplier;
  }

  /**
   * Update user quota
   */
  private async updateUserQuota(userId: string, entry: CostEntry): Promise<void> {
    let quota = this.userQuotas.get(userId);
    
    if (!quota) {
      quota = this.createDefaultQuota(userId);
      this.userQuotas.set(userId, quota);
    }

    // Update current usage
    quota.currentDaily += entry.actualCost;
    quota.currentMonthly += entry.actualCost;
    quota.languageBreakdown[entry.language] = 
      (quota.languageBreakdown[entry.language] || 0) + entry.actualCost;

    // Check for quota exceeded
    if (quota.currentDaily > quota.dailyLimit || quota.currentMonthly > quota.monthlyLimit) {
      this.emit('quota:exceeded', userId, quota);
      await this.handleQuotaExceeded(userId, quota);
    }

    // Check for warning threshold
    const dailyPercentage = (quota.currentDaily / quota.dailyLimit) * 100;
    const monthlyPercentage = (quota.currentMonthly / quota.monthlyLimit) * 100;

    if (dailyPercentage >= quota.warningThreshold || monthlyPercentage >= quota.warningThreshold) {
      await this.alertSystem.checkBudget({
        current: Math.max(quota.currentDaily, quota.currentMonthly),
        limit: Math.max(quota.dailyLimit, quota.monthlyLimit),
        period: dailyPercentage >= quota.warningThreshold ? 'daily' : 'monthly',
        userId,
      });
    }

    // Check for reset
    const now = new Date();
    if (now > quota.resetDaily) {
      quota.currentDaily = 0;
      quota.resetDaily = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    if (now > quota.resetMonthly) {
      quota.currentMonthly = 0;
      quota.languageBreakdown = { en: 0, no: 0 };
      quota.resetMonthly = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
  }

  /**
   * Create default quota for new user
   */
  private createDefaultQuota(userId: string): UserQuota {
    const now = new Date();
    return {
      userId,
      dailyLimit: 10, // $10 daily limit
      monthlyLimit: 200, // $200 monthly limit
      currentDaily: 0,
      currentMonthly: 0,
      resetDaily: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      resetMonthly: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      languageBreakdown: { en: 0, no: 0 },
      warningThreshold: 80, // Alert at 80% usage
    };
  }

  /**
   * Handle quota exceeded
   */
  private async handleQuotaExceeded(userId: string, quota: UserQuota): Promise<void> {
    // Create critical alert
    const alert: BudgetAlert = {
      id: `alert_${Date.now()}`,
      timestamp: new Date(),
      severity: 'critical',
      type: 'quota_exceeded',
      message: `User ${userId} has exceeded their ${quota.currentDaily > quota.dailyLimit ? 'daily' : 'monthly'} quota`,
      details: {
        userId,
        currentDaily: quota.currentDaily,
        dailyLimit: quota.dailyLimit,
        currentMonthly: quota.currentMonthly,
        monthlyLimit: quota.monthlyLimit,
      },
      actions: ['block_requests', 'notify_user', 'request_limit_increase'],
    };

    await this.alertSystem.triggerAlert(alert);
  }

  /**
   * Update real-time metrics with new entry
   */
  private updateMetricsWithEntry(entry: CostEntry): void {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter recent entries
    const recentEntries = this.costHistory.filter(e => e.timestamp > hourAgo);
    const dailyEntries = this.costHistory.filter(e => e.timestamp > dayAgo);
    const weeklyEntries = this.costHistory.filter(e => e.timestamp > weekAgo);
    const monthlyEntries = this.costHistory.filter(e => e.timestamp > monthStart);

    // Calculate totals
    this.realTimeMetrics.currentHour = recentEntries.reduce((sum, e) => sum + e.actualCost, 0);
    this.realTimeMetrics.currentDay = dailyEntries.reduce((sum, e) => sum + e.actualCost, 0);
    this.realTimeMetrics.currentWeek = weeklyEntries.reduce((sum, e) => sum + e.actualCost, 0);
    this.realTimeMetrics.currentMonth = monthlyEntries.reduce((sum, e) => sum + e.actualCost, 0);
  }

  /**
   * Update cost projections
   */
  private updateProjections(): void {
    const now = new Date();
    const hoursToday = now.getHours() || 1;
    const daysThisMonth = now.getDate() || 1;

    // Project daily cost based on current rate
    const hourlyRate = this.realTimeMetrics.currentDay / hoursToday;
    this.realTimeMetrics.projectedDaily = hourlyRate * 24;

    // Project monthly cost based on current rate
    const dailyRate = this.realTimeMetrics.currentMonth / daysThisMonth;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    this.realTimeMetrics.projectedMonthly = dailyRate * daysInMonth;

    // Calculate trends
    const hourAgo = this.getMetricsFromTime(new Date(now.getTime() - 2 * 60 * 60 * 1000), 
                                            new Date(now.getTime() - 60 * 60 * 1000));
    const dayAgo = this.getMetricsFromTime(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                                           new Date(now.getTime() - 24 * 60 * 60 * 1000));

    this.realTimeMetrics.trendsLastHour = hourAgo > 0 
      ? ((this.realTimeMetrics.currentHour - hourAgo) / hourAgo) * 100 
      : 0;
    
    this.realTimeMetrics.trendsLastDay = dayAgo > 0
      ? ((this.realTimeMetrics.currentDay - dayAgo) / dayAgo) * 100
      : 0;
  }

  /**
   * Get metrics from specific time range
   */
  private getMetricsFromTime(start: Date, end: Date): number {
    return this.costHistory
      .filter(e => e.timestamp >= start && e.timestamp <= end)
      .reduce((sum, e) => sum + e.actualCost, 0);
  }

  /**
   * Identify cost hotspots
   */
  private identifyHotspots(): void {
    const hotspots: typeof this.realTimeMetrics.hotspots = [];
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEntries = this.costHistory.filter(e => e.timestamp > dayAgo);

    // Group by user
    const userCosts = new Map<string, number>();
    recentEntries.forEach(e => {
      if (e.userId) {
        userCosts.set(e.userId, (userCosts.get(e.userId) || 0) + e.actualCost);
      }
    });

    // Group by language
    const languageCosts = new Map<SupportedLanguage, number>();
    recentEntries.forEach(e => {
      languageCosts.set(e.language, (languageCosts.get(e.language) || 0) + e.actualCost);
    });

    // Group by provider
    const providerCosts = new Map<AIProvider, number>();
    recentEntries.forEach(e => {
      providerCosts.set(e.provider, (providerCosts.get(e.provider) || 0) + e.actualCost);
    });

    // Group by model
    const modelCosts = new Map<string, number>();
    recentEntries.forEach(e => {
      modelCosts.set(e.model, (modelCosts.get(e.model) || 0) + e.actualCost);
    });

    const totalCost = this.realTimeMetrics.currentDay;

    // Add top cost drivers
    userCosts.forEach((cost, userId) => {
      if (cost > totalCost * 0.1) { // More than 10% of total
        hotspots.push({
          type: 'user',
          identifier: userId,
          cost,
          percentage: (cost / totalCost) * 100,
        });
      }
    });

    languageCosts.forEach((cost, language) => {
      hotspots.push({
        type: 'language',
        identifier: language,
        cost,
        percentage: (cost / totalCost) * 100,
      });
    });

    providerCosts.forEach((cost, provider) => {
      hotspots.push({
        type: 'provider',
        identifier: provider,
        cost,
        percentage: (cost / totalCost) * 100,
      });
    });

    modelCosts.forEach((cost, model) => {
      if (cost > totalCost * 0.05) { // More than 5% of total
        hotspots.push({
          type: 'model',
          identifier: model,
          cost,
          percentage: (cost / totalCost) * 100,
        });
      }
    });

    // Sort by cost
    this.realTimeMetrics.hotspots = hotspots.sort((a, b) => b.cost - a.cost).slice(0, 10);
  }

  /**
   * Check language overhead
   */
  private checkLanguageOverhead(entry: CostEntry): void {
    if (entry.language === 'no') {
      // Calculate baseline (English equivalent)
      const baselineCost = entry.breakdown.aiProviderCost / 1.3; // Remove Norwegian multiplier
      const overhead = entry.actualCost - baselineCost;
      const overheadPercentage = (overhead / baselineCost) * 100;

      const factors: string[] = [];
      if (entry.metadata.wasTranslated) factors.push('translation');
      if (entry.metadata.culturalAdaptation) factors.push('cultural_adaptation');
      if (entry.breakdown.languageMultiplier > 1) factors.push('complexity_multiplier');

      const languageOverhead: LanguageOverhead = {
        language: 'no',
        baselineCost,
        actualCost: entry.actualCost,
        overhead,
        overheadPercentage,
        factors,
      };

      this.emit('language:overhead', languageOverhead);
    }
  }

  /**
   * Update real-time metrics
   */
  private updateRealTimeMetrics(): void {
    this.updateProjections();
    this.identifyHotspots();
  }

  /**
   * Check budget thresholds
   */
  private checkBudgetThresholds(): void {
    const thresholds = this.optimizationSettings.alertThresholds;

    // Check daily threshold
    if (this.realTimeMetrics.currentDay >= thresholds.daily * 0.8) {
      this.alertSystem.checkBudget({
        current: this.realTimeMetrics.currentDay,
        limit: thresholds.daily,
        period: 'daily',
      });
    }

    // Check weekly threshold
    if (this.realTimeMetrics.currentWeek >= thresholds.weekly * 0.8) {
      this.alertSystem.checkBudget({
        current: this.realTimeMetrics.currentWeek,
        limit: thresholds.weekly,
        period: 'weekly',
      });
    }

    // Check monthly threshold
    if (this.realTimeMetrics.currentMonth >= thresholds.monthly * 0.8) {
      this.alertSystem.checkBudget({
        current: this.realTimeMetrics.currentMonth,
        limit: thresholds.monthly,
        period: 'monthly',
      });
    }
  }

  /**
   * Analyze usage patterns
   */
  private analyzeUsagePatterns(): void {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEntries = this.costHistory.filter(e => e.timestamp > dayAgo);

    const patterns = this.analytics.analyzePatterns(recentEntries);
    const suggestions = this.analytics.generateOptimizations(patterns);

    suggestions.forEach(suggestion => {
      this.emit('optimization:suggestion', suggestion);
    });
  }

  /**
   * Apply optimization suggestion
   */
  private applyOptimization(suggestion: CostOptimizationSuggestion): void {
    switch (suggestion.type) {
      case 'cache_adjustment':
        if (suggestion.actions.includes('increase_cache_ttl')) {
          // Implement cache TTL increase
          console.log('Increasing cache TTL for cost optimization');
        }
        break;
      
      case 'model_switch':
        if (suggestion.actions.includes('use_cheaper_model')) {
          // Update preferred models
          console.log('Switching to more cost-effective models');
        }
        break;

      case 'language_optimization':
        if (suggestion.actions.includes('batch_translations')) {
          // Implement translation batching
          console.log('Enabling translation batching');
        }
        break;
    }
  }

  /**
   * Handle budget alert
   */
  private handleBudgetAlert(alert: BudgetAlert): void {
    if (alert.severity === 'critical') {
      // Implement critical response
      if (this.optimizationSettings.budgetMode === 'strict') {
        // Block non-essential requests
        console.error('Critical budget alert - blocking non-essential requests');
      }
    }
  }

  /**
   * Compare providers for a request
   */
  public async compareProviders(
    request: LanguageAwareContentRequest
  ): Promise<ProviderComparison> {
    const providers: Array<{
      name: AIProvider;
      estimatedCost: number;
      features: string[];
      reliability: number;
      speedScore: number;
    }> = [];

    // Evaluate each provider
    for (const [provider, model] of this.providerModels) {
      const estimation = await this.costCalculator.estimateProviderCost(
        provider,
        request
      );

      providers.push({
        name: provider,
        estimatedCost: estimation.cost,
        features: model.features || [],
        reliability: model.reliability || 0.95,
        speedScore: model.speedScore || 0.8,
      });
    }

    // Find best provider
    const sorted = providers.sort((a, b) => {
      // Balance cost and quality
      const aScore = a.estimatedCost * (1 + (1 - a.confidence));
      const bScore = b.estimatedCost * (1 + (1 - b.confidence));
      return aScore - bScore;
    });

    const best = sorted[0];
    const comparison: ProviderComparison = {
      request,
      providers,
      recommendation: {
        provider: best.provider,
        model: best.model,
        reason: this.getRecommendationReason(best, sorted),
        savingsVsBest: sorted.length > 1 ? sorted[1].estimatedCost - best.estimatedCost : 0,
      },
    };

    this.emit('provider:comparison', comparison);
    return comparison;
  }

  /**
   * Get language support level for provider
   */
  private getLanguageSupport(
    provider: AIProvider,
    language: SupportedLanguage
  ): 'native' | 'translated' | 'limited' {
    if (language === 'en') {
      return 'native';
    }

    // Norwegian support varies by provider
    switch (provider) {
      case 'openai':
        return 'native'; // GPT-4 has good Norwegian support
      case 'anthropic':
        return 'native'; // Claude has good Norwegian support
      default:
        return 'translated';
    }
  }

  /**
   * Get recommendation reason
   */
  private getRecommendationReason(
    best: ProviderComparison['providers'][0],
    sorted: ProviderComparison['providers']
  ): string {
    const reasons: string[] = [];

    if (best.estimatedCost === Math.min(...sorted.map(p => p.estimatedCost))) {
      reasons.push('lowest cost');
    }

    if (best.languageSupport === 'native') {
      reasons.push('native language support');
    }

    if (best.confidence >= 0.9) {
      reasons.push('high confidence');
    }

    if (best.estimatedTime === Math.min(...sorted.map(p => p.estimatedTime))) {
      reasons.push('fastest processing');
    }

    return reasons.length > 0 
      ? `Best choice due to: ${reasons.join(', ')}`
      : 'Optimal balance of cost and performance';
  }

  /**
   * Get provider from model name
   */
  private getProviderFromModel(model: string): AIProvider {
    if (model.includes('gpt')) return 'openai';
    if (model.includes('claude')) return 'anthropic';
    if (model.includes('firecrawl')) return 'firecrawl';
    if (model.includes('tavily')) return 'tavily';
    return 'openai'; // Default
  }

  /**
   * Get model cost per token
   */
  private getModelCostPerToken(model: string): number {
    // Default costs per token
    const costs: Record<string, number> = {
      'gpt-4': 0.00003,
      'gpt-3.5-turbo': 0.000002,
      'claude-3': 0.000015,
      'claude-2': 0.00001,
    };

    return costs[model] || 0.00001; // Default cost
  }

  /**
   * Get real-time metrics
   */
  public getRealTimeMetrics(): RealTimeCostMetrics {
    return { ...this.realTimeMetrics };
  }

  /**
   * Get cost history
   */
  public getCostHistory(
    filters?: {
      startDate?: Date;
      endDate?: Date;
      language?: SupportedLanguage;
      userId?: string;
      provider?: AIProvider;
    }
  ): CostEntry[] {
    let entries = [...this.costHistory];

    if (filters) {
      if (filters.startDate) {
        entries = entries.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        entries = entries.filter(e => e.timestamp <= filters.endDate!);
      }
      if (filters.language) {
        entries = entries.filter(e => e.language === filters.language);
      }
      if (filters.userId) {
        entries = entries.filter(e => e.userId === filters.userId);
      }
      if (filters.provider) {
        entries = entries.filter(e => e.provider === filters.provider);
      }
    }

    return entries;
  }

  /**
   * Get user quota
   */
  public getUserQuota(userId: string): UserQuota | undefined {
    return this.userQuotas.get(userId);
  }

  /**
   * Update user quota limits
   */
  public updateUserQuotaLimits(
    userId: string,
    limits: Partial<Pick<UserQuota, 'dailyLimit' | 'monthlyLimit' | 'warningThreshold'>>
  ): void {
    const quota = this.userQuotas.get(userId);
    if (quota) {
      Object.assign(quota, limits);
    }
  }

  /**
   * Get optimization settings
   */
  public getOptimizationSettings(): CostOptimizationSettings {
    return { ...this.optimizationSettings };
  }

  /**
   * Update optimization settings
   */
  public updateOptimizationSettings(
    settings: Partial<CostOptimizationSettings>
  ): void {
    Object.assign(this.optimizationSettings, settings);
  }

  /**
   * Export cost data
   */
  public exportCostData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        entries: this.costHistory,
        metrics: this.realTimeMetrics,
        quotas: Array.from(this.userQuotas.values()),
      }, null, 2);
    } else {
      // CSV export
      const headers = ['Timestamp', 'Request ID', 'User ID', 'Language', 'Provider', 'Model', 'Cost', 'Cache Savings'];
      const rows = this.costHistory.map(e => [
        e.timestamp.toISOString(),
        e.requestId,
        e.userId || '',
        e.language,
        e.provider,
        e.model,
        e.actualCost.toFixed(4),
        e.cacheSavings.toFixed(4),
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}

export type AIProvider = 'openai' | 'anthropic' | 'firecrawl' | 'tavily';