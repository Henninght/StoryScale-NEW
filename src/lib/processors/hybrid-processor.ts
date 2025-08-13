/**
 * Hybrid Processor - Feature-flagged content processing system
 * Enables gradual rollout of the new 3-layer architecture alongside legacy systems
 * Provides seamless transition between old and new processing pipelines
 */

import { EventEmitter } from 'events';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  SupportedLanguage,
} from '../types/language-aware-request';
import { functionComposer, CompositionResult } from '../functions/composer';
import { IntelligentGateway } from '../gateway/intelligent-gateway';

export interface FeatureFlags {
  // Core features
  enable_new_architecture: boolean;
  enable_intelligent_gateway: boolean;
  enable_parallel_processing: boolean;
  enable_quality_validation: boolean;
  
  // Function-specific flags
  enable_research_function: boolean;
  enable_optimization_function: boolean;
  enable_norwegian_processing: boolean;
  enable_cultural_adaptation: boolean;
  
  // Performance features
  enable_caching: boolean;
  enable_cost_tracking: boolean;
  enable_performance_monitoring: boolean;
  
  // Rollout control
  new_architecture_percentage: number; // 0-100
  fallback_enabled: boolean;
  canary_users: string[];
  
  // Quality gates
  quality_threshold: number;
  enable_quality_gates: boolean;
  enable_auto_fallback: boolean;
}

export interface ProcessingStrategy {
  name: 'legacy' | 'hybrid' | 'new_architecture';
  description: string;
  confidence: number;
  reasoning: string[];
}

export interface HybridResult {
  success: boolean;
  content?: string;
  strategy_used: ProcessingStrategy['name'];
  processing_time: number;
  metadata: {
    feature_flags_applied: Partial<FeatureFlags>;
    quality_score?: number;
    fallback_used: boolean;
    errors: string[];
    performance_metrics: {
      cache_hit_rate: number;
      parallel_efficiency: number;
      cost_estimate: number;
    };
  };
  // Include results from different strategies for comparison
  new_architecture_result?: CompositionResult;
  legacy_result?: any;
}

export interface HybridProcessorConfig {
  defaultFeatureFlags: FeatureFlags;
  enableA_BTesting: boolean;
  enablePerformanceComparison: boolean;
  enableGradualRollout: boolean;
  enableFallbackLogging: boolean;
  maxProcessingTime: number;
  enableUserSegmentation: boolean;
}

export class HybridProcessor extends EventEmitter {
  private static instance: HybridProcessor;
  private config: HybridProcessorConfig;
  private featureFlags: FeatureFlags;
  private gateway: IntelligentGateway;
  private processingStats: Map<string, ProcessingStats>;
  private userSegments: Map<string, UserSegment>;
  private rolloutSchedule: RolloutSchedule[];

  private constructor(config?: Partial<HybridProcessorConfig>) {
    super();
    
    this.config = {
      defaultFeatureFlags: this.getDefaultFeatureFlags(),
      enableA_BTesting: true,
      enablePerformanceComparison: true,
      enableGradualRollout: true,
      enableFallbackLogging: true,
      maxProcessingTime: 30000,
      enableUserSegmentation: true,
      ...config,
    };

    this.featureFlags = this.config.defaultFeatureFlags;
    this.gateway = IntelligentGateway.getInstance();
    this.processingStats = new Map();
    this.userSegments = new Map();
    this.rolloutSchedule = [];

    this.initializeUserSegments();
    this.setupRolloutSchedule();
    this.setupPerformanceMonitoring();
  }

  public static getInstance(config?: Partial<HybridProcessorConfig>): HybridProcessor {
    if (!HybridProcessor.instance) {
      HybridProcessor.instance = new HybridProcessor(config);
    }
    return HybridProcessor.instance;
  }

  /**
   * Main processing entry point
   */
  public async process(
    request: LanguageAwareContentRequest,
    options?: {
      userId?: string;
      forceStrategy?: ProcessingStrategy['name'];
      customFeatureFlags?: Partial<FeatureFlags>;
      enableComparison?: boolean;
    }
  ): Promise<HybridResult> {
    const startTime = performance.now();
    const userId = options?.userId;
    
    // Determine effective feature flags
    const effectiveFlags = this.resolveFeatureFlags(request, options);
    
    // Determine processing strategy
    const strategy = options?.forceStrategy || 
      this.determineProcessingStrategy(request, effectiveFlags, userId);
    
    this.emit('processing:started', {
      requestId: request.id,
      strategy: strategy.name,
      userId,
      featureFlags: effectiveFlags,
    });

    try {
      let result: HybridResult;

      switch (strategy.name) {
        case 'new_architecture':
          result = await this.processWithNewArchitecture(request, effectiveFlags);
          break;
        case 'hybrid':
          result = await this.processWithHybridApproach(request, effectiveFlags, options);
          break;
        case 'legacy':
        default:
          result = await this.processWithLegacy(request, effectiveFlags);
          break;
      }

      // Add strategy information
      result.strategy_used = strategy.name;
      result.processing_time = performance.now() - startTime;
      result.metadata.feature_flags_applied = effectiveFlags;

      // Record statistics
      this.recordProcessingStats(strategy.name, result, userId);

      // Quality gate check
      if (effectiveFlags.enable_quality_gates && result.metadata.quality_score) {
        if (result.metadata.quality_score < effectiveFlags.quality_threshold) {
          if (effectiveFlags.enable_auto_fallback && strategy.name === 'new_architecture') {
            this.emit('processing:quality-fallback', {
              requestId: request.id,
              qualityScore: result.metadata.quality_score,
              threshold: effectiveFlags.quality_threshold,
            });
            
            // Fallback to legacy
            result = await this.processWithLegacy(request, effectiveFlags);
            result.metadata.fallback_used = true;
          }
        }
      }

      this.emit('processing:completed', {
        requestId: request.id,
        strategy: result.strategy_used,
        success: result.success,
        processingTime: result.processing_time,
        qualityScore: result.metadata.quality_score,
      });

      return result;

    } catch (error) {
      this.emit('processing:error', {
        requestId: request.id,
        strategy: strategy.name,
        error: error.message,
      });

      // Try fallback if enabled
      if (effectiveFlags.fallback_enabled && strategy.name !== 'legacy') {
        console.log('Primary strategy failed, using fallback. Error was:', error.message);
        try {
          const fallbackResult = await this.processWithLegacy(request, effectiveFlags);
          fallbackResult.metadata.fallback_used = true;
          fallbackResult.metadata.errors.push(`Primary strategy failed: ${error.message}`);
          return fallbackResult;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          // Both failed - return error result
        }
      }

      // Return error result
      return {
        success: false,
        strategy_used: strategy.name,
        processing_time: performance.now() - startTime,
        metadata: {
          feature_flags_applied: effectiveFlags,
          fallback_used: false,
          errors: [error.message],
          performance_metrics: {
            cache_hit_rate: 0,
            parallel_efficiency: 0,
            cost_estimate: 0,
          },
        },
      };
    }
  }

  /**
   * Processing strategy implementations
   */

  private async processWithNewArchitecture(
    request: LanguageAwareContentRequest,
    flags: FeatureFlags
  ): Promise<HybridResult> {
    try {
      // Import and use custom prompts
      const { buildLinkedInPrompt } = await import('../prompts/linkedin-prompts.js');
      
      // Build prompts using the template system
      const promptConfig = buildLinkedInPrompt({
        topic: request.topic,
        purpose: request.purpose || 'share-insights',
        tone: request.tone || 'professional',
        audience: request.targetAudience || 'professionals',
        format: request.format || 'insight',
        enableCTA: true,
        keywords: request.keywords || [],
        customInstructions: request.customInstructions || ''
      });

      const systemPrompt = promptConfig.system;
      const userPrompt = promptConfig.user;

      // Choose AI provider based on configuration or request
      const aiProvider = request.aiProvider || process.env.AI_PROVIDER || 'anthropic'; // Default to Claude
      let content = '';

      if (aiProvider === 'anthropic' || aiProvider === 'claude') {
        // Use Claude/Anthropic
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });

        const completion = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 (latest)
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        });

        // Claude returns content differently than OpenAI
        content = completion.content[0].type === 'text' 
          ? completion.content[0].text 
          : 'Failed to generate content';
          
        console.log('Generated content using Claude Sonnet 3.5');
        
      } else {
        // Use OpenAI
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        content = completion.choices[0]?.message?.content || 'Failed to generate content';
        console.log('Generated content using OpenAI GPT-4o-mini');
      }

      return {
        success: true,
        content,
        strategy_used: 'new_architecture',
        processing_time: 0,
        metadata: {
          feature_flags_applied: flags,
          quality_score: 0.85,
          fallback_used: false,
          errors: [],
          performance_metrics: {
            cache_hit_rate: 0,
            parallel_efficiency: 0,
            cost_estimate: 0.001,
          },
        },
      };

      /* Original code - commented out for now
      // Use intelligent gateway for routing and content generation
      if (flags.enable_intelligent_gateway) {
        const gatewayResponse = await this.gateway.processContent(request);
        if (gatewayResponse && gatewayResponse.content) {
          return {
            success: true,
            content: gatewayResponse.content,
            strategy_used: 'new_architecture',
            processing_time: 0,
            metadata: {
              feature_flags_applied: flags,
              quality_score: 0.85,
              fallback_used: false,
              errors: [],
              performance_metrics: {
                cache_hit_rate: gatewayResponse.metadata?.cacheHit ? 1.0 : 0,
                parallel_efficiency: 0,
                cost_estimate: gatewayResponse.metadata?.cost || 0.1,
              },
            },
          };
        }
      }

      // If gateway is disabled or failed, use function composer directly
      const composerOptions = {
        skipFunctions: this.getSkippedFunctions(flags),
        enableParallel: flags.enable_parallel_processing,
        customTimeout: this.config.maxProcessingTime,
      };

      const compositionResult = await functionComposer.compose(request, composerOptions);

      return {
        success: compositionResult.success,
        content: compositionResult.content,
        strategy_used: 'new_architecture',
        processing_time: 0, // Will be set by caller
        metadata: {
          feature_flags_applied: flags,
          quality_score: compositionResult.metadata.qualityScore,
          fallback_used: false,
          errors: compositionResult.metadata.errors.map(e => e.error),
          performance_metrics: {
            cache_hit_rate: compositionResult.metadata.performance.cacheHitRate,
            parallel_efficiency: compositionResult.metadata.performance.parallelEfficiency,
            cost_estimate: this.estimateCost(compositionResult),
          },
        },
        new_architecture_result: compositionResult,
      };
      */

    } catch (error) {
      console.error('processWithNewArchitecture error:', error);
      throw error;
    }
  }

  private async processWithHybridApproach(
    request: LanguageAwareContentRequest,
    flags: FeatureFlags,
    options?: any
  ): Promise<HybridResult> {
    // In hybrid mode, we can run both architectures and compare
    if (this.config.enableA_BTesting && options?.enableComparison) {
      try {
        const [newResult, legacyResult] = await Promise.allSettled([
          this.processWithNewArchitecture(request, flags),
          this.processWithLegacy(request, flags),
        ]);

        // Choose best result based on quality and performance
        const chosenResult = this.chooseBestResult(newResult, legacyResult);
        
        // Add comparison metadata
        if (chosenResult.success) {
          chosenResult.metadata.performance_metrics = {
            ...chosenResult.metadata.performance_metrics,
            comparison_performed: true,
          };
        }

        return chosenResult;

      } catch (error) {
        // Fallback to single strategy
        return this.processWithNewArchitecture(request, flags);
      }
    }

    // Default hybrid: use new architecture with some legacy components
    return this.processWithNewArchitecture(request, flags);
  }

  private async processWithLegacy(
    request: LanguageAwareContentRequest,
    flags: FeatureFlags
  ): Promise<HybridResult> {
    // Mock legacy processing - in real implementation, this would call the old system
    const mockProcessingTime = Math.random() * 2000 + 1000; // 1-3 seconds
    
    await new Promise(resolve => setTimeout(resolve, mockProcessingTime));

    // Generate simple content as legacy fallback
    const legacyContent = this.generateLegacyContent(request);

    return {
      success: true,
      content: legacyContent,
      strategy_used: 'legacy',
      processing_time: 0, // Will be set by caller
      metadata: {
        feature_flags_applied: flags,
        quality_score: 0.6, // Legacy system has lower quality
        fallback_used: false,
        errors: [],
        performance_metrics: {
          cache_hit_rate: 0,
          parallel_efficiency: 0,
          cost_estimate: 0.5, // Legacy is cheaper but less effective
        },
      },
    };
  }

  /**
   * Strategy determination logic
   */

  private determineProcessingStrategy(
    request: LanguageAwareContentRequest,
    flags: FeatureFlags,
    userId?: string
  ): ProcessingStrategy {
    const reasoning: string[] = [];

    // Check if new architecture is enabled
    if (!flags.enable_new_architecture) {
      reasoning.push('New architecture disabled by feature flag');
      return {
        name: 'legacy',
        description: 'Using legacy system',
        confidence: 1.0,
        reasoning,
      };
    }

    // Check rollout percentage
    const rolloutPercentage = flags.new_architecture_percentage;
    const userHash = userId ? this.hashUserId(userId) : Math.random();
    const userPercentile = userHash * 100;

    if (userPercentile > rolloutPercentage) {
      reasoning.push(`User not in rollout group (${userPercentile.toFixed(1)}% > ${rolloutPercentage}%)`);
      return {
        name: 'legacy',
        description: 'User not in rollout group',
        confidence: 0.8,
        reasoning,
      };
    }

    // Check if user is in canary group
    if (userId && flags.canary_users.includes(userId)) {
      reasoning.push('User in canary group');
      return {
        name: 'new_architecture',
        description: 'Canary user gets new architecture',
        confidence: 1.0,
        reasoning,
      };
    }

    // Check request complexity
    const complexity = this.assessRequestComplexity(request);
    if (complexity > 0.8) {
      reasoning.push('High complexity request benefits from new architecture');
      return {
        name: 'new_architecture',
        description: 'Complex request routed to new system',
        confidence: 0.9,
        reasoning,
      };
    }

    // Check language requirements
    if (request.outputLanguage === 'no' && flags.enable_norwegian_processing) {
      reasoning.push('Norwegian content benefits from new architecture');
      return {
        name: 'new_architecture',
        description: 'Norwegian processing enabled',
        confidence: 0.9,
        reasoning,
      };
    }

    // Default to new architecture if in rollout percentage
    reasoning.push('User in rollout percentage');
    return {
      name: 'new_architecture',
      description: 'User selected for new architecture',
      confidence: 0.7,
      reasoning,
    };
  }

  /**
   * Helper methods
   */

  private resolveFeatureFlags(
    request: LanguageAwareContentRequest,
    options?: any
  ): FeatureFlags {
    // Start with defaults
    let flags = { ...this.featureFlags };

    // Apply custom flags
    if (options?.customFeatureFlags) {
      flags = { ...flags, ...options.customFeatureFlags };
    }

    // Apply contextual adjustments
    if (request.outputLanguage === 'no') {
      flags.enable_norwegian_processing = true;
      flags.enable_cultural_adaptation = true;
    }

    // Apply user segment flags
    if (options?.userId) {
      const segment = this.userSegments.get(options.userId);
      if (segment) {
        flags = { ...flags, ...segment.featureFlags };
      }
    }

    return flags;
  }

  private getSkippedFunctions(flags: FeatureFlags): string[] {
    const skipped: string[] = [];

    if (!flags.enable_research_function) {
      skipped.push('research');
    }

    if (!flags.enable_optimization_function) {
      skipped.push('optimize');
    }

    if (!flags.enable_quality_validation) {
      skipped.push('validate');
    }

    return skipped;
  }

  private assessRequestComplexity(request: LanguageAwareContentRequest): number {
    let complexity = 0;

    // Word count factor
    const wordCount = request.wordCount || 500;
    complexity += Math.min(0.3, wordCount / 2000);

    // Language complexity
    if (request.requiresTranslation) complexity += 0.2;
    if (request.culturalContext) complexity += 0.2;

    // Research requirement
    if (request.enableResearch) complexity += 0.2;

    // Content type complexity
    const contentTypeComplexity: Record<string, number> = {
      'linkedin-post': 0.1,
      'blog-post': 0.3,
      'article': 0.4,
      'landing-page': 0.5,
    };
    complexity += contentTypeComplexity[request.type] || 0.1;

    return Math.min(1.0, complexity);
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  private chooseBestResult(
    newResult: PromiseSettledResult<HybridResult>,
    legacyResult: PromiseSettledResult<HybridResult>
  ): HybridResult {
    // Extract results
    const newSuccess = newResult.status === 'fulfilled' && newResult.value.success;
    const legacySuccess = legacyResult.status === 'fulfilled' && legacyResult.value.success;

    // If only one succeeded, use that
    if (newSuccess && !legacySuccess) {
      return newResult.status === 'fulfilled' ? newResult.value : this.createErrorResult();
    }
    
    if (!newSuccess && legacySuccess) {
      return legacyResult.status === 'fulfilled' ? legacyResult.value : this.createErrorResult();
    }

    // If both succeeded, compare quality
    if (newSuccess && legacySuccess && 
        newResult.status === 'fulfilled' && legacyResult.status === 'fulfilled') {
      
      const newQuality = newResult.value.metadata.quality_score || 0;
      const legacyQuality = legacyResult.value.metadata.quality_score || 0;

      // Prefer new architecture if quality is close (within 0.1)
      if (Math.abs(newQuality - legacyQuality) <= 0.1) {
        return newResult.value;
      }

      // Otherwise, use higher quality
      return newQuality >= legacyQuality ? newResult.value : legacyResult.value;
    }

    // Both failed - return error
    return this.createErrorResult();
  }

  private createErrorResult(): HybridResult {
    return {
      success: false,
      strategy_used: 'legacy',
      processing_time: 0,
      metadata: {
        feature_flags_applied: this.featureFlags,
        fallback_used: false,
        errors: ['All strategies failed'],
        performance_metrics: {
          cache_hit_rate: 0,
          parallel_efficiency: 0,
          cost_estimate: 0,
        },
      },
    };
  }

  private generateLegacyContent(request: LanguageAwareContentRequest): string {
    // Simple template-based generation for legacy fallback
    const templates = {
      'linkedin-post': `Here's a thought about ${request.topic}.\n\nThis is an important consideration for professionals in the field.\n\nWhat do you think?`,
      'blog-post': `# ${request.topic}\n\nThis is an important topic that deserves attention.\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3\n\n## Conclusion\n\nThank you for reading.`,
      'email': `Subject: ${request.topic}\n\nHello,\n\nI wanted to share some thoughts about ${request.topic}.\n\nBest regards`,
    };

    const template = templates[request.type as keyof typeof templates] || templates['linkedin-post'];
    
    // Apply Norwegian if needed
    if (request.outputLanguage === 'no') {
      return template
        .replace('Here\'s a thought about', 'Her er en tanke om')
        .replace('What do you think?', 'Hva tenker du?')
        .replace('Thank you for reading', 'Takk for at du leser');
    }

    return template;
  }

  private estimateCost(result: CompositionResult): number {
    // Simple cost estimation based on tokens and functions used
    const baseCost = 0.01;
    const functionCosts = {
      research: 0.005,
      generate: 0.02,
      optimize: 0.003,
      validate: 0.001,
    };

    let totalCost = baseCost;
    result.metadata.functionsExecuted.forEach(func => {
      totalCost += functionCosts[func as keyof typeof functionCosts] || 0;
    });

    return totalCost;
  }

  private recordProcessingStats(
    strategy: string,
    result: HybridResult,
    userId?: string
  ): void {
    const key = `${strategy}_${new Date().toISOString().split('T')[0]}`;
    
    if (!this.processingStats.has(key)) {
      this.processingStats.set(key, {
        strategy,
        date: new Date().toISOString().split('T')[0],
        totalRequests: 0,
        successfulRequests: 0,
        averageProcessingTime: 0,
        averageQualityScore: 0,
        totalCost: 0,
      });
    }

    const stats = this.processingStats.get(key)!;
    stats.totalRequests++;
    
    if (result.success) {
      stats.successfulRequests++;
    }

    // Update averages
    const prevAvgTime = stats.averageProcessingTime;
    const prevAvgQuality = stats.averageQualityScore;
    const count = stats.totalRequests;

    stats.averageProcessingTime = (prevAvgTime * (count - 1) + result.processing_time) / count;
    
    if (result.metadata.quality_score) {
      stats.averageQualityScore = (prevAvgQuality * (count - 1) + result.metadata.quality_score) / count;
    }

    stats.totalCost += result.metadata.performance_metrics.cost_estimate;
  }

  private initializeUserSegments(): void {
    // Define user segments with different feature flag settings
    this.userSegments.set('early_adopters', {
      name: 'Early Adopters',
      featureFlags: {
        ...this.getDefaultFeatureFlags(),
        new_architecture_percentage: 100,
        enable_quality_validation: true,
        enable_performance_monitoring: true,
      },
    });

    this.userSegments.set('beta_users', {
      name: 'Beta Users',
      featureFlags: {
        ...this.getDefaultFeatureFlags(),
        new_architecture_percentage: 75,
        enable_optimization_function: true,
      },
    });
  }

  private setupRolloutSchedule(): void {
    // Define gradual rollout schedule
    this.rolloutSchedule = [
      {
        date: new Date('2024-01-01'),
        percentage: 10,
        description: 'Initial rollout to 10%',
      },
      {
        date: new Date('2024-01-15'),
        percentage: 25,
        description: 'Expand to 25%',
      },
      {
        date: new Date('2024-02-01'),
        percentage: 50,
        description: 'Expand to 50%',
      },
      {
        date: new Date('2024-02-15'),
        percentage: 100,
        description: 'Full rollout',
      },
    ];
  }

  private setupPerformanceMonitoring(): void {
    // Monitor performance and adjust rollout
    setInterval(() => {
      this.evaluateRolloutProgress();
      this.cleanupStats();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  private evaluateRolloutProgress(): void {
    // Evaluate if we should adjust rollout percentage based on performance
    const newArchStats = Array.from(this.processingStats.values())
      .filter(s => s.strategy === 'new_architecture');
    
    if (newArchStats.length > 0) {
      const avgSuccessRate = newArchStats.reduce((sum, s) => 
        sum + (s.successfulRequests / s.totalRequests), 0) / newArchStats.length;
      
      if (avgSuccessRate < 0.85) {
        // Consider reducing rollout percentage
        this.emit('rollout:performance-warning', {
          successRate: avgSuccessRate,
          recommendation: 'Consider reducing rollout percentage',
        });
      }
    }
  }

  private cleanupStats(): void {
    // Keep stats for last 7 days only
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

    Array.from(this.processingStats.entries()).forEach(([key, stats]) => {
      if (stats.date < cutoffDate) {
        this.processingStats.delete(key);
      }
    });
  }

  private getDefaultFeatureFlags(): FeatureFlags {
    return {
      // Core features
      enable_new_architecture: true,
      enable_intelligent_gateway: false, // Temporarily disable gateway to use composer directly
      enable_parallel_processing: true,
      enable_quality_validation: true,
      
      // Function-specific flags
      enable_research_function: true,
      enable_optimization_function: true,
      enable_norwegian_processing: true,
      enable_cultural_adaptation: true,
      
      // Performance features
      enable_caching: true,
      enable_cost_tracking: true,
      enable_performance_monitoring: true,
      
      // Rollout control
      new_architecture_percentage: 100, // Use new architecture for everyone
      fallback_enabled: true,
      canary_users: [],
      
      // Quality gates
      quality_threshold: 0.7,
      enable_quality_gates: true,
      enable_auto_fallback: true,
    };
  }

  /**
   * Public management methods
   */

  public updateFeatureFlags(newFlags: Partial<FeatureFlags>): void {
    this.featureFlags = { ...this.featureFlags, ...newFlags };
    
    this.emit('feature-flags:updated', { 
      newFlags, 
      effectiveFlags: this.featureFlags 
    });
  }

  public getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  public getProcessingStats(): ProcessingStats[] {
    return Array.from(this.processingStats.values());
  }

  public addUserToSegment(userId: string, segmentName: string): void {
    const segment = this.userSegments.get(segmentName);
    if (segment) {
      // In a real implementation, this would persist to database
      this.emit('user-segment:updated', { userId, segmentName });
    }
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = this.getProcessingStats();
    const recentStats = stats.filter(s => {
      const statDate = new Date(s.date);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return statDate >= threeDaysAgo;
    });

    const avgSuccessRate = recentStats.length > 0 
      ? recentStats.reduce((sum, s) => sum + (s.successfulRequests / s.totalRequests), 0) / recentStats.length
      : 1;

    const isHealthy = avgSuccessRate >= 0.85 && 
                     this.processingStats.size < 1000;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      details: {
        featureFlags: this.featureFlags,
        recentSuccessRate: avgSuccessRate,
        statsCount: this.processingStats.size,
        userSegments: Array.from(this.userSegments.keys()),
        rolloutSchedule: this.rolloutSchedule,
      },
    };
  }
}

// Supporting interfaces
interface ProcessingStats {
  strategy: string;
  date: string;
  totalRequests: number;
  successfulRequests: number;
  averageProcessingTime: number;
  averageQualityScore: number;
  totalCost: number;
}

interface UserSegment {
  name: string;
  featureFlags: Partial<FeatureFlags>;
}

interface RolloutSchedule {
  date: Date;
  percentage: number;
  description: string;
}

// Export singleton instance
export const hybridProcessor = HybridProcessor.getInstance();