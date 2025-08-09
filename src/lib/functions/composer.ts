/**
 * Function Composer - Orchestrates parallel execution and result composition
 * Coordinates Research, Generate, Optimize, and Validate functions
 * Implements the 3-layer architecture with intelligent function composition
 */

import { EventEmitter } from 'events';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  SupportedLanguage,
} from '../types/language-aware-request';
import { researchFunction } from './research-function';
import { generateFunction } from './generate-function';
import { optimizeFunction } from './optimize-function';
import { validateFunction } from './validate-function';

export interface CompositionPlan {
  id: string;
  request: LanguageAwareContentRequest;
  functions: FunctionStep[];
  parallelGroups: ParallelGroup[];
  dependencies: FunctionDependency[];
  estimatedDuration: number;
  fallbackStrategy: FallbackStrategy;
}

export interface FunctionStep {
  id: string;
  name: string;
  function: 'research' | 'generate' | 'optimize' | 'validate';
  required: boolean;
  timeout: number;
  retries: number;
  config?: Record<string, any>;
}

export interface ParallelGroup {
  id: string;
  steps: string[]; // Step IDs that can run in parallel
  priority: number;
}

export interface FunctionDependency {
  stepId: string;
  dependsOn: string[];
  condition?: (results: Map<string, any>) => boolean;
}

export interface CompositionResult {
  requestId: string;
  success: boolean;
  content?: string;
  metadata: {
    executionTime: number;
    functionsExecuted: string[];
    parallelExecutions: number;
    fallbacksUsed: string[];
    qualityScore: number;
    errors: ExecutionError[];
    performance: PerformanceMetrics;
  };
  research?: any;
  validation?: any;
  optimization?: any;
}

export interface ExecutionError {
  stepId: string;
  function: string;
  error: string;
  timestamp: number;
  recoverable: boolean;
}

export interface PerformanceMetrics {
  totalTime: number;
  parallelEfficiency: number; // 0-1 scale
  cacheHitRate: number;
  functionTimes: Record<string, number>;
  memoryUsage: number;
  throughput: number; // requests per second
}

export interface FallbackStrategy {
  enableFallbacks: boolean;
  fallbackTimeout: number;
  maxFallbackChain: number;
  fallbackRules: FallbackRule[];
}

export interface FallbackRule {
  condition: 'timeout' | 'error' | 'quality_low' | 'all_functions_failed';
  action: 'skip' | 'retry' | 'alternative' | 'degraded';
  target?: string;
  config?: Record<string, any>;
}

export interface ComposerConfig {
  enableParallelExecution: boolean;
  maxConcurrency: number;
  defaultTimeout: number;
  enableFallbacks: boolean;
  qualityThreshold: number;
  enablePerformanceTracking: boolean;
  enableCaching: boolean;
}

export class FunctionComposer extends EventEmitter {
  private static instance: FunctionComposer;
  private config: ComposerConfig;
  private executionQueue: Map<string, CompositionPlan>;
  private activeExecutions: Map<string, Promise<CompositionResult>>;
  private performanceHistory: PerformanceMetrics[];
  private fallbackStrategies: Map<string, FallbackStrategy>;

  private constructor(config?: Partial<ComposerConfig>) {
    super();
    
    this.config = {
      enableParallelExecution: true,
      maxConcurrency: 5,
      defaultTimeout: 30000, // 30 seconds
      enableFallbacks: true,
      qualityThreshold: 0.7,
      enablePerformanceTracking: true,
      enableCaching: true,
      ...config,
    };

    this.executionQueue = new Map();
    this.activeExecutions = new Map();
    this.performanceHistory = [];
    this.fallbackStrategies = new Map();

    this.initializeFallbackStrategies();
    this.setupPerformanceMonitoring();
  }

  public static getInstance(config?: Partial<ComposerConfig>): FunctionComposer {
    if (!FunctionComposer.instance) {
      FunctionComposer.instance = new FunctionComposer(config);
    }
    return FunctionComposer.instance;
  }

  /**
   * Main composition entry point
   */
  public async compose(
    request: LanguageAwareContentRequest,
    options?: {
      skipFunctions?: string[];
      enableParallel?: boolean;
      customTimeout?: number;
      customFallbackStrategy?: string;
    }
  ): Promise<CompositionResult> {
    const startTime = performance.now();
    const plan = this.createCompositionPlan(request, options);
    
    this.emit('composition:started', { 
      requestId: request.id, 
      plan: plan.id,
      functionsPlanned: plan.functions.length 
    });

    try {
      // Store plan in queue
      this.executionQueue.set(plan.id, plan);

      // Execute the composition plan
      const result = await this.executePlan(plan);
      
      // Record performance metrics
      if (this.config.enablePerformanceTracking) {
        this.recordPerformance(result.metadata.performance);
      }

      const totalTime = performance.now() - startTime;
      
      this.emit('composition:completed', {
        requestId: request.id,
        success: result.success,
        totalTime,
        qualityScore: result.metadata.qualityScore,
        functionsExecuted: result.metadata.functionsExecuted,
      });

      return result;

    } catch (error) {
      this.emit('composition:error', { requestId: request.id, error });
      
      // Return failed result
      return {
        requestId: request.id,
        success: false,
        metadata: {
          executionTime: performance.now() - startTime,
          functionsExecuted: [],
          parallelExecutions: 0,
          fallbacksUsed: [],
          qualityScore: 0,
          errors: [{
            stepId: 'composition',
            function: 'composer',
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
            recoverable: false,
          }],
          performance: this.createEmptyPerformanceMetrics(),
        },
      };

    } finally {
      // Clean up
      this.executionQueue.delete(plan.id);
      this.activeExecutions.delete(request.id);
    }
  }

  /**
   * Create composition plan based on request
   */
  private createCompositionPlan(
    request: LanguageAwareContentRequest,
    options?: any
  ): CompositionPlan {
    const planId = `plan_${request.id}_${Date.now()}`;
    const skipFunctions = options?.skipFunctions || [];
    
    // Define available functions
    const allFunctions: FunctionStep[] = [
      {
        id: 'research',
        name: 'Research Function',
        function: 'research',
        required: false,
        timeout: 10000,
        retries: 2,
      },
      {
        id: 'generate',
        name: 'Generate Function',
        function: 'generate',
        required: true,
        timeout: 15000,
        retries: 3,
      },
      {
        id: 'optimize',
        name: 'Optimize Function',
        function: 'optimize',
        required: false,
        timeout: 5000,
        retries: 1,
      },
      {
        id: 'validate',
        name: 'Validate Function',
        function: 'validate',
        required: true,
        timeout: 3000,
        retries: 1,
      },
    ];

    // Filter out skipped functions
    const functions = allFunctions.filter(fn => !skipFunctions.includes(fn.function));

    // Define parallel groups
    const parallelGroups: ParallelGroup[] = [];
    
    if (this.config.enableParallelExecution && options?.enableParallel !== false) {
      // Research can run in parallel with other preparations
      if (functions.some(f => f.id === 'research')) {
        parallelGroups.push({
          id: 'research_group',
          steps: ['research'],
          priority: 1,
        });
      }

      // Optimize and validate can run in parallel after generate
      const postGenSteps = functions
        .filter(f => ['optimize', 'validate'].includes(f.id))
        .map(f => f.id);
      
      if (postGenSteps.length > 0) {
        parallelGroups.push({
          id: 'post_generate_group',
          steps: postGenSteps,
          priority: 3,
        });
      }
    }

    // Define dependencies
    const dependencies: FunctionDependency[] = [
      {
        stepId: 'generate',
        dependsOn: [], // Can use research if available, but not required
      },
      {
        stepId: 'optimize',
        dependsOn: ['generate'],
      },
      {
        stepId: 'validate',
        dependsOn: ['generate'],
        condition: (results) => results.has('generate') && results.get('generate')?.content,
      },
    ];

    // Estimate duration
    const estimatedDuration = functions.reduce((total, fn) => total + fn.timeout, 0) * 0.7; // 70% due to parallelization

    // Get fallback strategy
    const fallbackStrategy = this.fallbackStrategies.get(options?.customFallbackStrategy || 'default') ||
      this.getDefaultFallbackStrategy();

    return {
      id: planId,
      request,
      functions,
      parallelGroups,
      dependencies,
      estimatedDuration,
      fallbackStrategy,
    };
  }

  /**
   * Execute the composition plan
   */
  private async executePlan(plan: CompositionPlan): Promise<CompositionResult> {
    const startTime = performance.now();
    const results = new Map<string, any>();
    const errors: ExecutionError[] = [];
    const functionsExecuted: string[] = [];
    const fallbacksUsed: string[] = [];
    let parallelExecutions = 0;

    try {
      // Phase 1: Execute research in parallel if enabled
      if (this.shouldExecuteResearch(plan)) {
        try {
          const researchResult = await this.executeWithTimeout(
            'research',
            () => this.executeResearch(plan.request),
            plan.functions.find(f => f.id === 'research')?.timeout || this.config.defaultTimeout
          );
          
          results.set('research', researchResult);
          functionsExecuted.push('research');
          parallelExecutions++;

        } catch (error) {
          errors.push(this.createExecutionError('research', error));
          // Research failure is non-critical, continue
        }
      }

      // Phase 2: Execute generation (required)
      try {
        const generateResult = await this.executeWithTimeout(
          'generate',
          () => this.executeGeneration(plan.request, results.get('research')),
          plan.functions.find(f => f.id === 'generate')?.timeout || this.config.defaultTimeout
        );

        results.set('generate', generateResult);
        functionsExecuted.push('generate');

      } catch (error) {
        errors.push(this.createExecutionError('generate', error));
        
        // Generation failure is critical - try fallback
        if (plan.fallbackStrategy.enableFallbacks) {
          try {
            const fallbackResult = await this.executeFallbackGeneration(plan.request);
            results.set('generate', fallbackResult);
            functionsExecuted.push('generate-fallback');
            fallbacksUsed.push('generate');
          } catch (fallbackError) {
            throw new Error(`Generation failed and fallback failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          throw error;
        }
      }

      // Phase 3: Execute optimization and validation in parallel
      if (results.has('generate')) {
        const postGeneratePromises: Promise<any>[] = [];
        
        // Optimization
        if (plan.functions.some(f => f.id === 'optimize')) {
          postGeneratePromises.push(
            this.executeWithTimeout(
              'optimize',
              () => this.executeOptimization(results.get('generate').content, plan.request),
              plan.functions.find(f => f.id === 'optimize')?.timeout || this.config.defaultTimeout
            ).then(result => {
              results.set('optimize', result);
              functionsExecuted.push('optimize');
              return result;
            }).catch(error => {
              errors.push(this.createExecutionError('optimize', error));
              return null;
            })
          );
        }

        // Validation
        if (plan.functions.some(f => f.id === 'validate')) {
          postGeneratePromises.push(
            this.executeWithTimeout(
              'validate',
              () => this.executeValidation(results.get('generate').content, plan.request),
              plan.functions.find(f => f.id === 'validate')?.timeout || this.config.defaultTimeout
            ).then(result => {
              results.set('validate', result);
              functionsExecuted.push('validate');
              return result;
            }).catch(error => {
              errors.push(this.createExecutionError('validate', error));
              return null;
            })
          );
        }

        // Wait for parallel execution
        if (postGeneratePromises.length > 0) {
          await Promise.all(postGeneratePromises);
          parallelExecutions += postGeneratePromises.length;
        }
      }

      // Phase 4: Compose final result
      const finalContent = await this.composeFinalResult(results, plan);
      const qualityScore = this.extractQualityScore(results);

      // Check quality threshold
      if (qualityScore < this.config.qualityThreshold) {
        if (plan.fallbackStrategy.enableFallbacks) {
          // Try to regenerate with quality feedback
          const improvedResult = await this.tryQualityImprovement(plan.request, results);
          if (improvedResult) {
            fallbacksUsed.push('quality-improvement');
            return improvedResult;
          }
        }
        
        // Log quality warning but don't fail
        this.emit('composition:quality-warning', {
          requestId: plan.request.id,
          qualityScore,
          threshold: this.config.qualityThreshold,
        });
      }

      const executionTime = performance.now() - startTime;
      const performanceMetrics = this.calculatePerformanceMetrics(
        executionTime,
        functionsExecuted,
        parallelExecutions,
        results
      );

      return {
        requestId: plan.request.id,
        success: true,
        content: finalContent,
        metadata: {
          executionTime,
          functionsExecuted,
          parallelExecutions,
          fallbacksUsed,
          qualityScore,
          errors,
          performance: performanceMetrics,
        },
        research: results.get('research'),
        validation: results.get('validate'),
        optimization: results.get('optimize'),
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      throw new Error(`Plan execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Function execution methods
   */

  private async executeResearch(request: LanguageAwareContentRequest): Promise<any> {
    // Check if research is needed based on request settings
    if (!request.enableResearch) {
      return { sources: [], enrichedContent: null };
    }

    return await researchFunction.research(request);
  }

  private async executeGeneration(
    request: LanguageAwareContentRequest,
    researchData?: any
  ): Promise<any> {
    // Map LanguageAwareContentRequest to GenerateRequest
    const generateRequest = {
      ...request,
      contentType: this.mapContentTypeFromRequest(request.type) as 'blogPost' | 'socialMedia' | 'email' | 'websiteCopy' | 'caseStudy' | 'pressRelease',
      topic: request.topic,
      audience: request.targetAudience || 'business professionals',
      tone: this.mapToneFromRequest(request.tone),
      keywords: request.keywords,
      researchContext: researchData,
    };

    return await generateFunction.generate(generateRequest);
  }

  private async executeOptimization(
    content: string,
    request: LanguageAwareContentRequest
  ): Promise<any> {
    return await optimizeFunction.optimize(content, request);
  }

  private async executeValidation(
    content: string,
    request: LanguageAwareContentRequest
  ): Promise<any> {
    const context = {
      request,
      response: { 
        content, 
        requestId: request.id,
        metadata: {
          generatedLanguage: request.outputLanguage,
          wasTranslated: false,
          processingTime: 0,
          tokenUsage: { prompt: 0, completion: 0, total: 0 },
          model: 'validation',
          cost: 0,
          cacheHit: false
        }
      },
    };
    
    return await validateFunction.validate(content, context);
  }

  private async executeFallbackGeneration(
    request: LanguageAwareContentRequest
  ): Promise<any> {
    // Simplified generation without research
    const fallbackRequest = {
      ...request,
      enableResearch: false,
      fallbackMode: true,
      contentType: (request as any).contentType || 'blogPost',
      audience: (request as any).audience || 'General',
    };

    return await generateFunction.generate(fallbackRequest);
  }

  /**
   * Helper methods
   */

  private shouldExecuteResearch(plan: CompositionPlan): boolean {
    return plan.functions.some(f => f.id === 'research') &&
           !!plan.request.enableResearch &&
           this.config.enableParallelExecution;
  }

  private async executeWithTimeout<T>(
    stepId: string,
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${stepId} timeout after ${timeout}ms`)), timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  private createExecutionError(stepId: string, error: any): ExecutionError {
    return {
      stepId,
      function: stepId,
      error: error.message || String(error),
      timestamp: Date.now(),
      recoverable: stepId !== 'generate', // Generate is critical
    };
  }

  private async composeFinalResult(
    results: Map<string, any>,
    plan: CompositionPlan
  ): Promise<string> {
    const generateResult = results.get('generate');
    if (!generateResult) {
      throw new Error('No generation result available');
    }

    let finalContent = generateResult.content || generateResult;

    // Apply optimization if available
    const optimizeResult = results.get('optimize');
    if (optimizeResult && optimizeResult.optimizedContent) {
      finalContent = optimizeResult.optimizedContent;
    }

    return finalContent;
  }

  /**
   * Helper methods to map interface properties
   */
  private mapContentTypeFromRequest(type: string): string {
    const mapping = {
      'social': 'socialMedia',
      'article': 'blogPost',
      'blog': 'blogPost',
      'email': 'email',
      'landing': 'websiteCopy',
      'ad': 'websiteCopy'
    };
    return mapping[type as keyof typeof mapping] || 'blogPost';
  }

  private mapToneFromRequest(tone?: string): 'professional' | 'casual' | 'authoritative' | 'friendly' | undefined {
    const mapping = {
      'professional': 'professional',
      'casual': 'casual',
      'persuasive': 'authoritative',
      'informative': 'professional',
      'friendly': 'friendly',
      'authoritative': 'authoritative'
    } as const;
    return tone ? mapping[tone as keyof typeof mapping] || 'professional' : undefined;
  }

  private extractQualityScore(results: Map<string, any>): number {
    const validationResult = results.get('validate');
    if (validationResult && validationResult.overall !== undefined) {
      return validationResult.overall;
    }
    
    // Fallback quality estimation
    return 0.8; // Assume decent quality if no validation
  }

  private async tryQualityImprovement(
    request: LanguageAwareContentRequest,
    results: Map<string, any>
  ): Promise<CompositionResult | null> {
    try {
      // Attempt regeneration with quality feedback
      const qualityFeedback = results.get('validate');
      const improvedRequest = {
        ...request,
        qualityFeedback,
        improvementMode: true,
      };

      const improvedGeneration = await this.executeGeneration(improvedRequest);
      const improvedValidation = await this.executeValidation(
        improvedGeneration.content,
        request
      );

      if (improvedValidation.overall >= this.config.qualityThreshold) {
        // Success! Return improved result
        return {
          requestId: request.id,
          success: true,
          content: improvedGeneration.content,
          metadata: {
            executionTime: 0, // Will be updated by caller
            functionsExecuted: ['generate-improved', 'validate-improved'],
            parallelExecutions: 0,
            fallbacksUsed: ['quality-improvement'],
            qualityScore: improvedValidation.overall,
            errors: [],
            performance: this.createEmptyPerformanceMetrics(),
          },
          validation: improvedValidation,
        };
      }

      return null;

    } catch (error) {
      return null;
    }
  }

  private calculatePerformanceMetrics(
    executionTime: number,
    functionsExecuted: string[],
    parallelExecutions: number,
    results: Map<string, any>
  ): PerformanceMetrics {
    const totalFunctions = functionsExecuted.length;
    const parallelEfficiency = totalFunctions > 0 ? parallelExecutions / totalFunctions : 0;
    
    return {
      totalTime: executionTime,
      parallelEfficiency,
      cacheHitRate: this.calculateCacheHitRate(results),
      functionTimes: this.extractFunctionTimes(results),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      throughput: 1000 / executionTime, // requests per second
    };
  }

  private calculateCacheHitRate(results: Map<string, any>): number {
    // Extract cache hit information from results
    let hits = 0;
    let total = 0;

    results.forEach((result) => {
      if (result && result.metadata && result.metadata.cacheHit !== undefined) {
        total++;
        if (result.metadata.cacheHit) hits++;
      }
    });

    return total > 0 ? hits / total : 0;
  }

  private extractFunctionTimes(results: Map<string, any>): Record<string, number> {
    const times: Record<string, number> = {};

    results.forEach((result, key) => {
      if (result && result.metadata && result.metadata.processingTime) {
        times[key] = result.metadata.processingTime;
      }
    });

    return times;
  }

  private createEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      totalTime: 0,
      parallelEfficiency: 0,
      cacheHitRate: 0,
      functionTimes: {},
      memoryUsage: 0,
      throughput: 0,
    };
  }

  private initializeFallbackStrategies(): void {
    // Default fallback strategy
    this.fallbackStrategies.set('default', {
      enableFallbacks: true,
      fallbackTimeout: 10000,
      maxFallbackChain: 2,
      fallbackRules: [
        {
          condition: 'timeout',
          action: 'retry',
        },
        {
          condition: 'quality_low',
          action: 'alternative',
        },
        {
          condition: 'error',
          action: 'degraded',
        },
      ],
    });

    // Fast strategy (minimal fallbacks)
    this.fallbackStrategies.set('fast', {
      enableFallbacks: false,
      fallbackTimeout: 5000,
      maxFallbackChain: 1,
      fallbackRules: [],
    });
  }

  private getDefaultFallbackStrategy(): FallbackStrategy {
    return this.fallbackStrategies.get('default')!;
  }

  private setupPerformanceMonitoring(): void {
    // Monitor performance every 5 minutes
    setInterval(() => {
      this.cleanupPerformanceHistory();
      this.emit('performance:update', this.getPerformanceStats());
    }, 5 * 60 * 1000);
  }

  private recordPerformance(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    
    // Keep only last 100 records
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }

  private cleanupPerformanceHistory(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    // Keep performance history cleanup simple for now
  }

  /**
   * Public utility methods
   */

  public updateConfig(newConfig: Partial<ComposerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getPerformanceStats(): {
    averageExecutionTime: number;
    averageParallelEfficiency: number;
    averageCacheHitRate: number;
    throughput: number;
  } {
    if (this.performanceHistory.length === 0) {
      return {
        averageExecutionTime: 0,
        averageParallelEfficiency: 0,
        averageCacheHitRate: 0,
        throughput: 0,
      };
    }

    const sum = this.performanceHistory.reduce((acc, metrics) => ({
      totalTime: acc.totalTime + metrics.totalTime,
      parallelEfficiency: acc.parallelEfficiency + metrics.parallelEfficiency,
      cacheHitRate: acc.cacheHitRate + metrics.cacheHitRate,
      throughput: acc.throughput + metrics.throughput,
    }), { totalTime: 0, parallelEfficiency: 0, cacheHitRate: 0, throughput: 0 });

    const count = this.performanceHistory.length;

    return {
      averageExecutionTime: sum.totalTime / count,
      averageParallelEfficiency: sum.parallelEfficiency / count,
      averageCacheHitRate: sum.cacheHitRate / count,
      throughput: sum.throughput / count,
    };
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = this.getPerformanceStats();
    const activeExecutions = this.activeExecutions.size;
    const queueSize = this.executionQueue.size;

    const isHealthy = activeExecutions < this.config.maxConcurrency &&
                     queueSize < 10 &&
                     stats.averageExecutionTime < 30000; // 30s threshold

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      details: {
        activeExecutions,
        queueSize,
        performance: stats,
        config: this.config,
      },
    };
  }

  public getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }
}

// Export singleton instance
export const functionComposer = FunctionComposer.getInstance();