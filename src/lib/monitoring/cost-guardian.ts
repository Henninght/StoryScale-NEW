/**
 * Cost Guardian - Cost tracking and optimization system
 * 
 * Responsibilities:
 * - Track token usage and costs across AI providers
 * - Implement cost controls and budget limits
 * - Monitor cache hit rates for cost optimization
 * - Alert on unusual spending patterns
 * - Generate cost reports and analytics
 * 
 * Target: 60% cost reduction through intelligent optimization
 */

export interface CostMetrics {
  userId: string
  totalTokens: number
  totalCost: number
  requestCount: number
  cacheHitRate: number
  averageCostPerRequest: number
  providerBreakdown: ProviderCosts
  period: {
    start: Date
    end: Date
  }
}

export interface ProviderCosts {
  openai: {
    tokens: number
    cost: number
    requests: number
  }
  anthropic: {
    tokens: number
    cost: number
    requests: number
  }
}

export interface ProcessingRecord {
  userId: string
  tokensUsed: number
  processingTime: number
  provider: 'openai' | 'anthropic'
  model?: string
  requestType?: 'simple' | 'medium' | 'complex'
}

export interface BudgetAlert {
  userId: string
  type: 'approaching_limit' | 'limit_exceeded' | 'unusual_activity'
  message: string
  currentCost: number
  budgetLimit: number
  timestamp: Date
}

export class CostGuardian {
  private costDatabase: Map<string, CostMetrics> = new Map()
  private budgetLimits: Map<string, number> = new Map()
  private alertThresholds = {
    budgetWarning: 0.8, // Alert at 80% of budget
    unusualActivityMultiplier: 3 // Alert if usage is 3x normal
  }

  // Token pricing (per 1k tokens) - updated March 2024
  private tokenPricing = {
    openai: {
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    },
    anthropic: {
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 }
    }
  }

  constructor() {
    this.initializeCostTracking()
  }

  /**
   * Record processing costs and usage
   */
  async recordProcessing(record: ProcessingRecord): Promise<void> {
    const cost = this.calculateCost(record)
    const userId = record.userId
    
    // Get or create user metrics
    let metrics = this.costDatabase.get(userId) || this.createEmptyMetrics(userId)
    
    // Update metrics
    metrics.totalTokens += record.tokensUsed
    metrics.totalCost += cost
    metrics.requestCount += 1
    metrics.averageCostPerRequest = metrics.totalCost / metrics.requestCount
    
    // Update provider breakdown
    const provider = record.provider
    metrics.providerBreakdown[provider].tokens += record.tokensUsed
    metrics.providerBreakdown[provider].cost += cost
    metrics.providerBreakdown[provider].requests += 1
    
    // Store updated metrics
    this.costDatabase.set(userId, metrics)
    
    // Check for budget alerts
    await this.checkBudgetAlerts(userId, metrics)
    
    // Store in database for persistence
    await this.persistMetrics(userId, metrics)
  }

  /**
   * Record cache hit for cost savings tracking
   */
  async recordCacheHit(userId: string): Promise<void> {
    const metrics = this.costDatabase.get(userId)
    if (!metrics) return
    
    // Cache hits save money - update hit rate
    const totalRequests = metrics.requestCount + 1 // Include this cache hit
    const cacheHits = Math.round(metrics.cacheHitRate * metrics.requestCount) + 1
    metrics.cacheHitRate = cacheHits / totalRequests
    
    this.costDatabase.set(userId, metrics)
  }

  /**
   * Set budget limit for user
   */
  async setBudgetLimit(userId: string, monthlyLimit: number): Promise<void> {
    this.budgetLimits.set(userId, monthlyLimit)
    
    // Persist to database
    await this.persistBudgetLimit(userId, monthlyLimit)
  }

  /**
   * Get cost metrics for user
   */
  async getCostMetrics(userId: string, period?: { start: Date, end: Date }): Promise<CostMetrics | null> {
    // If period specified, fetch from database with date filter
    if (period) {
      return await this.fetchMetricsFromDatabase(userId, period)
    }
    
    // Return current period metrics
    return this.costDatabase.get(userId) || null
  }

  /**
   * Get cost optimization recommendations
   */
  async getCostOptimizations(userId: string): Promise<CostOptimization[]> {
    const metrics = this.costDatabase.get(userId)
    if (!metrics) return []
    
    const recommendations: CostOptimization[] = []
    
    // Check cache hit rate
    if (metrics.cacheHitRate < 0.4) { // Target is 50%
      recommendations.push({
        type: 'cache_optimization',
        priority: 'high',
        message: `Cache hit rate is ${(metrics.cacheHitRate * 100).toFixed(1)}%. Enabling research caching could save 25% on costs.`,
        potentialSavings: metrics.totalCost * 0.25
      })
    }
    
    // Check provider efficiency
    const { openai, anthropic } = metrics.providerBreakdown
    if (openai.cost > anthropic.cost * 2) {
      recommendations.push({
        type: 'provider_optimization',
        priority: 'medium',
        message: 'Consider using Claude for narrative content to reduce costs by ~40%.',
        potentialSavings: openai.cost * 0.4
      })
    }
    
    // Check request patterns
    if (metrics.averageCostPerRequest > 0.05) { // Target is $0.02
      recommendations.push({
        type: 'request_optimization',
        priority: 'medium',
        message: 'Average request cost is high. Consider using templates and patterns to reduce complexity.',
        potentialSavings: metrics.requestCount * (metrics.averageCostPerRequest - 0.02)
      })
    }
    
    return recommendations
  }

  /**
   * Calculate cost for processing record
   */
  private calculateCost(record: ProcessingRecord): number {
    const provider = record.provider
    const model = record.model || (provider === 'openai' ? 'gpt-4-turbo' : 'claude-3-sonnet')
    
    const pricing = this.tokenPricing[provider][model as keyof typeof this.tokenPricing[typeof provider]]
    if (!pricing) {
      console.warn(`No pricing found for ${provider}:${model}`)
      return 0
    }
    
    // Estimate input/output tokens (rough 60/40 split)
    const inputTokens = Math.round(record.tokensUsed * 0.6)
    const outputTokens = Math.round(record.tokensUsed * 0.4)
    
    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    
    return inputCost + outputCost
  }

  /**
   * Create empty metrics for new user
   */
  private createEmptyMetrics(userId: string): CostMetrics {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    return {
      userId,
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      cacheHitRate: 0,
      averageCostPerRequest: 0,
      providerBreakdown: {
        openai: { tokens: 0, cost: 0, requests: 0 },
        anthropic: { tokens: 0, cost: 0, requests: 0 }
      },
      period: {
        start: startOfMonth,
        end: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)
      }
    }
  }

  /**
   * Check for budget alerts
   */
  private async checkBudgetAlerts(userId: string, metrics: CostMetrics): Promise<void> {
    const budgetLimit = this.budgetLimits.get(userId)
    if (!budgetLimit) return
    
    const alerts: BudgetAlert[] = []
    
    // Check if approaching budget limit
    if (metrics.totalCost >= budgetLimit * this.alertThresholds.budgetWarning) {
      alerts.push({
        userId,
        type: 'approaching_limit',
        message: `You've used ${((metrics.totalCost / budgetLimit) * 100).toFixed(1)}% of your monthly budget.`,
        currentCost: metrics.totalCost,
        budgetLimit,
        timestamp: new Date()
      })
    }
    
    // Check if budget limit exceeded
    if (metrics.totalCost >= budgetLimit) {
      alerts.push({
        userId,
        type: 'limit_exceeded',
        message: `Budget limit of $${budgetLimit} has been exceeded. Current usage: $${metrics.totalCost.toFixed(2)}.`,
        currentCost: metrics.totalCost,
        budgetLimit,
        timestamp: new Date()
      })
    }
    
    // Send alerts if any
    for (const alert of alerts) {
      await this.sendAlert(alert)
    }
  }

  /**
   * Send budget alert
   */
  private async sendAlert(alert: BudgetAlert): Promise<void> {
    // In production, this would send email/webhook notification
    console.warn('Budget Alert:', alert)
    
    // Store alert in database
    await this.persistAlert(alert)
  }

  /**
   * Persist metrics to database
   */
  private async persistMetrics(userId: string, metrics: CostMetrics): Promise<void> {
    // This would integrate with Supabase to store metrics
    // For now, just keep in memory
  }

  /**
   * Persist budget limit to database
   */
  private async persistBudgetLimit(userId: string, limit: number): Promise<void> {
    // This would integrate with Supabase to store budget limits
    // For now, just keep in memory
  }

  /**
   * Persist alert to database
   */
  private async persistAlert(alert: BudgetAlert): Promise<void> {
    // This would integrate with Supabase to store alerts
    // For now, just keep in memory
  }

  /**
   * Fetch metrics from database with date filter
   */
  private async fetchMetricsFromDatabase(userId: string, period: { start: Date, end: Date }): Promise<CostMetrics | null> {
    // This would fetch from Supabase with date filtering
    // For now, return current metrics if they fall within period
    const current = this.costDatabase.get(userId)
    if (!current) return null
    
    // Check if current metrics overlap with requested period
    if (current.period.start <= period.end && current.period.end >= period.start) {
      return { ...current, period }
    }
    
    return null
  }

  /**
   * Initialize cost tracking
   */
  private initializeCostTracking(): void {
    // Set up periodic cleanup and reporting
    setInterval(() => {
      this.generateCostReports()
    }, 24 * 60 * 60 * 1000) // Daily
  }

  /**
   * Generate cost reports
   */
  private async generateCostReports(): Promise<void> {
    // Generate daily cost reports for analysis
    console.log('Generating daily cost reports...')
    
    for (const [userId, metrics] of this.costDatabase) {
      if (metrics.requestCount > 0) {
        console.log(`User ${userId}: $${metrics.totalCost.toFixed(2)} (${metrics.requestCount} requests, ${(metrics.cacheHitRate * 100).toFixed(1)}% cache hit rate)`)
      }
    }
  }
}

export interface CostOptimization {
  type: 'cache_optimization' | 'provider_optimization' | 'request_optimization'
  priority: 'high' | 'medium' | 'low'
  message: string
  potentialSavings: number
}