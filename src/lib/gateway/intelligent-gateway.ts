/**
 * Intelligent Gateway for StoryScale
 * Main gateway logic with request classification, routing, and cost tracking
 */

import { EventEmitter } from 'events';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  RequestClassification,
  RouteDecision,
  GatewayConfig,
  SupportedLanguage,
  CulturalContext,
  LanguageSpecificMetrics,
  GatewayError,
  GatewayErrorCode,
  CacheEntry,
} from '../types/language-aware-request';
import { LanguageDetectionService } from '../services/language-detection';
import { CacheKeyGenerator } from '../utils/cache-keys';

// Gateway events
export interface GatewayEvents {
  'request:received': (request: LanguageAwareContentRequest) => void;
  'request:classified': (classification: RequestClassification) => void;
  'request:routed': (decision: RouteDecision) => void;
  'request:completed': (response: LanguageAwareResponse) => void;
  'request:failed': (error: GatewayError) => void;
  'cache:hit': (key: string) => void;
  'cache:miss': (key: string) => void;
  'fallback:triggered': (reason: string) => void;
  'cost:threshold': (cost: number, threshold: number) => void;
}

// Model capabilities
interface ModelCapabilities {
  id: string;
  languages: SupportedLanguage[];
  maxTokens: number;
  costPerToken: number;
  features: string[];
  priority: number;
  endpoint: string;
}

// Processing pipeline stage
interface PipelineStage {
  name: string;
  execute: (context: ProcessingContext) => Promise<ProcessingContext>;
  onError?: (error: Error, context: ProcessingContext) => Promise<ProcessingContext>;
}

// Processing context
interface ProcessingContext {
  request: LanguageAwareContentRequest;
  classification?: RequestClassification;
  route?: RouteDecision;
  response?: LanguageAwareResponse;
  startTime: number;
  costs: {
    tokens: number;
    amount: number;
  };
  metadata: Map<string, any>;
  errors: Error[];
}

export class IntelligentGateway extends EventEmitter {
  private static instance: IntelligentGateway;
  private config: GatewayConfig;
  private languageDetector: LanguageDetectionService;
  private cacheKeyGenerator: CacheKeyGenerator;
  private cache: Map<string, CacheEntry>;
  private metrics: Map<SupportedLanguage, LanguageSpecificMetrics>;
  private models: Map<string, ModelCapabilities>;
  private pipeline: PipelineStage[];
  private requestQueue: Map<string, ProcessingContext>;
  private totalCost: number = 0;

  private constructor(config?: Partial<GatewayConfig>) {
    super();
    this.config = this.initializeConfig(config);
    this.languageDetector = LanguageDetectionService.getInstance();
    this.cacheKeyGenerator = CacheKeyGenerator.getInstance();
    this.cache = new Map();
    this.metrics = this.initializeMetrics();
    this.models = this.initializeModels();
    this.pipeline = this.initializePipeline();
    this.requestQueue = new Map();
  }

  public static getInstance(config?: Partial<GatewayConfig>): IntelligentGateway {
    if (!IntelligentGateway.instance) {
      IntelligentGateway.instance = new IntelligentGateway(config);
    }
    return IntelligentGateway.instance;
  }

  /**
   * Initialize gateway configuration
   */
  private initializeConfig(config?: Partial<GatewayConfig>): GatewayConfig {
    const defaultConfig: GatewayConfig = {
      defaultLanguage: 'en',
      enableAutoDetection: true,
      enableFallback: true,
      cacheEnabled: true,
      cacheTTL: 3600, // 1 hour
      maxRetries: 3,
      timeout: 30000, // 30 seconds
      costThresholds: {
        warning: 1.0,
        critical: 5.0,
      },
      languageModels: {
        en: ['gpt-5', 'gpt-5-mini', 'gpt-4o', 'claude-3'],
        no: ['gpt-5', 'gpt-4o', 'claude-3'], // Norwegian-capable models
      },
      culturalDefaults: {
        no: {
          market: 'norway',
          businessType: 'b2b',
          dialectPreference: 'bokmål',
          formalityLevel: 'neutral',
          localReferences: true,
        },
      },
    };

    return { ...defaultConfig, ...config };
  }

  /**
   * Initialize language-specific metrics
   */
  private initializeMetrics(): Map<SupportedLanguage, LanguageSpecificMetrics> {
    const metrics = new Map<SupportedLanguage, LanguageSpecificMetrics>();
    
    const languages: SupportedLanguage[] = ['en', 'no'];
    languages.forEach(lang => {
      metrics.set(lang, {
        language: lang,
        requestCount: 0,
        totalTokens: 0,
        totalCost: 0,
        averageProcessingTime: 0,
        cacheHitRate: 0,
        translationCount: 0,
        fallbackCount: 0,
        errorRate: 0,
      });
    });

    return metrics;
  }

  /**
   * Initialize available models
   */
  private initializeModels(): Map<string, ModelCapabilities> {
    const models = new Map<string, ModelCapabilities>();

    // GPT-5 (most advanced model)
    models.set('gpt-5', {
      id: 'gpt-5',
      languages: ['en', 'no'],
      maxTokens: 16384,
      costPerToken: 0.00000125, // Input cost, output is 8x
      features: ['advanced-reasoning', 'translation', 'cultural-adaptation', 'code-generation', 'analysis'],
      priority: 1,
      endpoint: 'openai',
    });

    // GPT-5 Mini (balanced performance/cost)
    models.set('gpt-5-mini', {
      id: 'gpt-5-mini',
      languages: ['en', 'no'],
      maxTokens: 8192,
      costPerToken: 0.00000025, // 92% performance at 25% cost
      features: ['complex-reasoning', 'translation', 'cultural-adaptation', 'code-generation'],
      priority: 2,
      endpoint: 'openai',
    });

    // GPT-5 Nano (budget option)
    models.set('gpt-5-nano', {
      id: 'gpt-5-nano',
      languages: ['en', 'no'],
      maxTokens: 4096,
      costPerToken: 0.00000005, // Cheapest option
      features: ['basic-generation', 'simple-translation'],
      priority: 3,
      endpoint: 'openai',
    });

    // GPT-4o (optimized fallback)
    models.set('gpt-4o', {
      id: 'gpt-4o',
      languages: ['en', 'no'],
      maxTokens: 8192,
      costPerToken: 0.0000025,
      features: ['complex-reasoning', 'translation', 'cultural-adaptation'],
      priority: 4,
      endpoint: 'openai',
    });

    // GPT-4 (legacy support)
    models.set('gpt-4', {
      id: 'gpt-4',
      languages: ['en', 'no'],
      maxTokens: 8192,
      costPerToken: 0.00003,
      features: ['complex-reasoning', 'translation', 'cultural-adaptation'],
      priority: 5,
      endpoint: 'openai',
    });

    // Claude 3 (advanced multi-language)
    models.set('claude-3', {
      id: 'claude-3',
      languages: ['en', 'no'],
      maxTokens: 100000,
      costPerToken: 0.000015,
      features: ['complex-reasoning', 'translation', 'cultural-adaptation', 'long-context'],
      priority: 1,
      endpoint: 'anthropic',
    });

    return models;
  }

  /**
   * Initialize processing pipeline
   */
  private initializePipeline(): PipelineStage[] {
    return [
      {
        name: 'validation',
        execute: this.validateRequest.bind(this),
      },
      {
        name: 'language-detection',
        execute: this.detectLanguage.bind(this),
      },
      {
        name: 'cache-check',
        execute: this.checkCache.bind(this),
      },
      {
        name: 'classification',
        execute: this.classifyRequest.bind(this),
      },
      {
        name: 'routing',
        execute: this.routeRequest.bind(this),
      },
      {
        name: 'processing',
        execute: this.processRequest.bind(this),
        onError: this.handleProcessingError.bind(this),
      },
      {
        name: 'post-processing',
        execute: this.postProcessResponse.bind(this),
      },
      {
        name: 'caching',
        execute: this.cacheResponse.bind(this),
      },
      {
        name: 'metrics',
        execute: this.updateMetrics.bind(this),
      },
    ];
  }

  /**
   * Process a content request through the gateway
   */
  public async processContent(
    request: LanguageAwareContentRequest
  ): Promise<LanguageAwareResponse> {
    const context: ProcessingContext = {
      request,
      startTime: Date.now(),
      costs: { tokens: 0, amount: 0 },
      metadata: new Map(),
      errors: [],
    };

    // Store in queue
    this.requestQueue.set(request.id, context);
    this.emit('request:received', request);

    try {
      // Execute pipeline
      let currentContext = context;
      for (const stage of this.pipeline) {
        try {
          currentContext = await stage.execute(currentContext);
          
          // Check if response is ready (cache hit)
          if (currentContext.response && stage.name === 'cache-check') {
            break;
          }
        } catch (error) {
          if (stage.onError) {
            currentContext = await stage.onError(error as Error, currentContext);
          } else {
            throw error;
          }
        }
      }

      if (!currentContext.response) {
        throw new GatewayError(
          GatewayErrorCode.ROUTING_FAILED,
          'No response generated',
          { requestId: request.id }
        );
      }

      this.emit('request:completed', currentContext.response);
      return currentContext.response;

    } catch (error) {
      const gatewayError = error instanceof GatewayError
        ? error
        : new GatewayError(
            GatewayErrorCode.ROUTING_FAILED,
            'Gateway processing failed',
            { originalError: error }
          );

      this.emit('request:failed', gatewayError);
      throw gatewayError;

    } finally {
      this.requestQueue.delete(request.id);
    }
  }

  /**
   * Pipeline stages implementation
   */

  private async validateRequest(context: ProcessingContext): Promise<ProcessingContext> {
    const { request } = context;

    // Validate required fields
    if (!request.id || !request.type || !request.topic || !request.outputLanguage) {
      throw new GatewayError(
        GatewayErrorCode.ROUTING_FAILED,
        'Missing required fields in request',
        { request }
      );
    }

    // Validate language
    if (!['en', 'no'].includes(request.outputLanguage)) {
      throw new GatewayError(
        GatewayErrorCode.UNSUPPORTED_LANGUAGE,
        `Unsupported output language: ${request.outputLanguage}`,
        { language: request.outputLanguage }
      );
    }

    return context;
  }

  private async detectLanguage(context: ProcessingContext): Promise<ProcessingContext> {
    const { request } = context;

    if (this.config.enableAutoDetection && !request.inputLanguage) {
      try {
        const detection = await this.languageDetector.detectLanguage(
          request.topic + ' ' + (request.keywords?.join(' ') || ''),
          request.outputLanguage
        );
        
        request.inputLanguage = detection.detectedLanguage;
        request.requiresTranslation = request.inputLanguage !== request.outputLanguage;
        
        context.metadata.set('languageDetection', detection);
      } catch (error) {
        // Default to output language if detection fails
        request.inputLanguage = request.outputLanguage;
        request.requiresTranslation = false;
      }
    }

    return context;
  }

  private async checkCache(context: ProcessingContext): Promise<ProcessingContext> {
    if (!this.config.cacheEnabled) {
      return context;
    }

    const cacheKey = this.cacheKeyGenerator.generateKey(context.request);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > new Date()) {
      // Cache hit
      cached.hitCount++;
      context.response = {
        ...cached.response,
        metadata: {
          ...cached.response.metadata,
          cacheHit: true,
          processingTime: Date.now() - context.startTime,
        },
      };
      
      this.emit('cache:hit', cacheKey);
      context.metadata.set('cacheKey', cacheKey);
      return context;
    }

    this.emit('cache:miss', cacheKey);
    context.metadata.set('cacheKey', cacheKey);
    return context;
  }

  private async classifyRequest(context: ProcessingContext): Promise<ProcessingContext> {
    const { request } = context;

    // Estimate complexity based on various factors
    const wordCount = request.wordCount || 500;
    const hasTranslation = request.requiresTranslation || false;
    const hasCulturalAdaptation = !!request.culturalContext;
    const hasSEO = !!request.seoRequirements;

    // Calculate complexity score
    let complexityScore = 0;
    complexityScore += wordCount > 1000 ? 2 : wordCount > 500 ? 1 : 0;
    complexityScore += hasTranslation ? 1 : 0;
    complexityScore += hasCulturalAdaptation ? 2 : 0;
    complexityScore += hasSEO ? 1 : 0;
    complexityScore += request.type === 'landing' || request.type === 'article' ? 1 : 0;

    // Determine complexity level
    let complexity: 'simple' | 'moderate' | 'complex';
    if (complexityScore <= 1) complexity = 'simple';
    else if (complexityScore <= 3) complexity = 'moderate';
    else complexity = 'complex';

    // Estimate tokens (rough approximation)
    const estimatedTokens = Math.ceil(wordCount * 1.5 * (hasTranslation ? 2 : 1));

    // Determine required capabilities
    const requiredCapabilities: string[] = ['basic-generation'];
    if (hasTranslation) requiredCapabilities.push('translation');
    if (hasCulturalAdaptation) requiredCapabilities.push('cultural-adaptation');
    if (complexity === 'complex') requiredCapabilities.push('complex-reasoning');

    // Suggest model based on requirements
    let suggestedModel: 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5' | 'gpt-4o' | 'claude' | 'specialized';
    if (complexity === 'simple' && !hasCulturalAdaptation) {
      suggestedModel = 'gpt-5-nano';
    } else if (complexity === 'complex' || hasCulturalAdaptation) {
      suggestedModel = request.outputLanguage === 'no' ? 'gpt-5' : 'gpt-5';
    } else {
      suggestedModel = 'gpt-5-mini';
    }

    const classification: RequestClassification = {
      complexity,
      estimatedTokens,
      requiredCapabilities,
      suggestedModel,
      languageRequirements: {
        inputLang: request.inputLanguage || request.outputLanguage,
        outputLang: request.outputLanguage,
        requiresNativeGeneration: !hasTranslation,
        requiresCulturalAdaptation: hasCulturalAdaptation,
      },
      priority: request.type === 'ad' || request.type === 'email' ? 'high' : 'medium',
      estimatedProcessingTime: estimatedTokens * 10, // Rough estimate
    };

    context.classification = classification;
    this.emit('request:classified', classification);
    return context;
  }

  private async routeRequest(context: ProcessingContext): Promise<ProcessingContext> {
    const { classification } = context;
    if (!classification) {
      throw new GatewayError(
        GatewayErrorCode.ROUTING_FAILED,
        'Request not classified',
        { requestId: context.request.id }
      );
    }

    // Select appropriate model
    const availableModels = Array.from(this.models.values())
      .filter(m => m.languages.includes(context.request.outputLanguage))
      .filter(m => this.hasRequiredCapabilities(m, classification.requiredCapabilities))
      .sort((a, b) => a.priority - b.priority);

    if (availableModels.length === 0) {
      throw new GatewayError(
        GatewayErrorCode.MODEL_UNAVAILABLE,
        'No suitable model available',
        { language: context.request.outputLanguage, capabilities: classification.requiredCapabilities }
      );
    }

    const selectedModel = availableModels[0];
    const estimatedCost = classification.estimatedTokens * selectedModel.costPerToken;

    // Check cost thresholds
    if (estimatedCost > this.config.costThresholds.critical) {
      this.emit('cost:threshold', estimatedCost, this.config.costThresholds.critical);
      throw new GatewayError(
        GatewayErrorCode.COST_THRESHOLD_EXCEEDED,
        'Estimated cost exceeds critical threshold',
        { estimatedCost, threshold: this.config.costThresholds.critical }
      );
    } else if (estimatedCost > this.config.costThresholds.warning) {
      this.emit('cost:threshold', estimatedCost, this.config.costThresholds.warning);
    }

    // Build route decision
    const route: RouteDecision = {
      targetModel: selectedModel.id,
      targetEndpoint: selectedModel.endpoint,
      requiresPreprocessing: context.request.requiresTranslation || false,
      preprocessingSteps: [],
      requiresPostprocessing: !!context.request.culturalContext,
      postprocessingSteps: [],
      estimatedCost,
      estimatedTime: classification.estimatedProcessingTime,
    };

    // Add preprocessing steps if needed
    if (context.request.requiresTranslation) {
      route.preprocessingSteps?.push({
        type: 'translate',
        config: {
          from: context.request.inputLanguage,
          to: context.request.outputLanguage,
        },
      });
    }

    // Add postprocessing steps if needed
    if (context.request.culturalContext) {
      route.postprocessingSteps?.push({
        type: 'format',
        config: context.request.culturalContext,
      });
    }

    // Setup fallback route if enabled
    if (this.config.enableFallback && context.request.outputLanguage === 'no') {
      const fallbackModel = this.models.get('gpt-4o');
      if (fallbackModel) {
        route.fallbackRoute = {
          targetModel: fallbackModel.id,
          targetEndpoint: fallbackModel.endpoint,
          requiresPreprocessing: false,
          requiresPostprocessing: true,
          postprocessingSteps: [
            {
              type: 'translate',
              config: { from: 'en', to: 'no' },
            },
          ],
          estimatedCost: classification.estimatedTokens * fallbackModel.costPerToken,
          estimatedTime: classification.estimatedProcessingTime * 1.5,
        };
      }
    }

    context.route = route;
    context.costs.amount = estimatedCost;
    this.emit('request:routed', route);
    return context;
  }

  private async processRequest(context: ProcessingContext): Promise<ProcessingContext> {
    // Check if we should use mock service
    const useMockService = process.env.MOCK_MODE === 'true' || 
                          (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-mock-development-key');
    
    const processingTime = Date.now() - context.startTime;
    const actualTokens = context.classification?.estimatedTokens || 100;

    let generatedContent: string;
    
    if (useMockService) {
      // Use mock service for development
      const { mockAIService } = await import('../services/mock-ai-service');
      const result = await mockAIService.generateContent({
        contentType: context.request.type,
        topic: context.request.topic,
        audience: context.request.targetAudience,
        tone: context.request.tone,
        language: context.request.outputLanguage,
        culturalContext: context.request.culturalContext
      });
      generatedContent = result.content;
    } else {
      // Use real AI service with OpenAI
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        // Create a proper prompt based on the request
        const systemPrompt = `You are a professional content writer creating high-quality ${context.request.type} content.
Language: ${context.request.outputLanguage}
Tone: ${context.request.tone || 'professional'}
Target Audience: ${context.request.targetAudience || 'general business'}`;

        const userPrompt = `Create a compelling ${context.request.type} about: ${context.request.topic}

Requirements:
- Write in ${context.request.outputLanguage === 'no' ? 'Norwegian' : 'English'}
- Maintain a ${context.request.tone || 'professional'} tone
- Target audience: ${context.request.targetAudience || 'business professionals'}
- Length: ${context.request.wordCount || 500} words
${context.request.keywords ? `- Include keywords: ${context.request.keywords.join(', ')}` : ''}
${context.request.seoRequirements ? `- SEO focus: ${JSON.stringify(context.request.seoRequirements)}` : ''}

Please write engaging, high-quality content that resonates with the target audience.`;

        const completion = await openai.chat.completions.create({
          model: context.route?.targetModel || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });

        generatedContent = completion.choices[0]?.message?.content || 'Content generation failed';
        
        // Update token usage
        if (completion.usage) {
          context.costs.tokens = completion.usage.total_tokens;
          context.costs.amount = (completion.usage.total_tokens * 0.000002); // Approximate cost
        }
      } catch (error) {
        console.error('AI generation error:', error);
        // Fallback to a simple template
        generatedContent = `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    context.response = {
      requestId: context.request.id,
      content: generatedContent,
      metadata: {
        generatedLanguage: context.request.outputLanguage,
        wasTranslated: context.request.requiresTranslation || false,
        translationQuality: context.request.requiresTranslation ? 'translated' : 'native',
        culturalAdaptations: context.request.culturalContext 
          ? ['market-adaptation', 'formality-adjusted'] 
          : undefined,
        processingTime,
        tokenUsage: {
          prompt: Math.floor(actualTokens * 0.3),
          completion: Math.floor(actualTokens * 0.7),
          total: actualTokens,
        },
        model: useMockService ? 'mock-gpt-4' : (context.route?.targetModel || 'unknown'),
        cost: context.costs.amount,
        cacheHit: false,
        fallbackUsed: false,
      },
    };

    context.costs.tokens = actualTokens;
    return context;
  }

  private async handleProcessingError(
    error: Error,
    context: ProcessingContext
  ): Promise<ProcessingContext> {
    context.errors.push(error);

    // Try fallback if available
    if (this.config.enableFallback && context.route?.fallbackRoute) {
      this.emit('fallback:triggered', error.message);
      
      // Switch to fallback route
      context.route = context.route.fallbackRoute;
      context.metadata.set('fallbackReason', error.message);
      
      // Retry with fallback
      return this.processRequest(context);
    }

    throw error;
  }

  private async postProcessResponse(context: ProcessingContext): Promise<ProcessingContext> {
    if (!context.response || !context.route?.requiresPostprocessing) {
      return context;
    }

    // Apply post-processing steps
    for (const step of context.route.postprocessingSteps || []) {
      switch (step.type) {
        case 'translate':
          // Placeholder for translation
          context.response.metadata.wasTranslated = true;
          context.response.metadata.translationQuality = 'translated';
          break;
        case 'format':
          // Placeholder for formatting
          break;
      }
    }

    return context;
  }

  private async cacheResponse(context: ProcessingContext): Promise<ProcessingContext> {
    if (!this.config.cacheEnabled || !context.response || context.response.metadata.cacheHit) {
      return context;
    }

    const cacheKey = context.metadata.get('cacheKey');
    if (!cacheKey) {
      return context;
    }

    // Store in optimizer for multi-layer caching with performance tracking
    const generationTime = Date.now() - context.startTime;
    await this.cacheOptimizer.set(
      context.request,
      context.response,
      generationTime
    );

    // Also store in simple cache for backward compatibility
    const cacheEntry: CacheEntry = {
      key: cacheKey,
      request: context.request,
      response: context.response,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.cacheTTL * 1000),
      hitCount: 0,
      language: context.request.outputLanguage,
      tags: this.cacheKeyGenerator.generateTags(context.request),
    };

    this.cache.set(cacheKey, cacheEntry);
    
    // Cleanup old cache entries
    this.cleanupCache();

    return context;
  }

  private async updateMetrics(context: ProcessingContext): Promise<ProcessingContext> {
    const language = context.request.outputLanguage;
    const metrics = this.metrics.get(language);
    
    if (metrics && context.response) {
      const processingTime = context.response.metadata.processingTime;
      const prevAvg = metrics.averageProcessingTime;
      const count = metrics.requestCount;
      
      metrics.requestCount++;
      metrics.totalTokens += context.response.metadata.tokenUsage.total;
      metrics.totalCost += context.response.metadata.cost;
      metrics.averageProcessingTime = (prevAvg * count + processingTime) / (count + 1);
      
      if (context.response.metadata.wasTranslated) {
        metrics.translationCount++;
      }
      
      if (context.response.metadata.fallbackUsed) {
        metrics.fallbackCount++;
      }
      
      if (context.errors.length > 0) {
        metrics.errorRate = (metrics.errorRate * count + 1) / (count + 1);
      } else {
        metrics.errorRate = (metrics.errorRate * count) / (count + 1);
      }
      
      // Update cache hit rate
      if (context.response.metadata.cacheHit) {
        const cacheHits = Math.floor(metrics.cacheHitRate * count);
        metrics.cacheHitRate = (cacheHits + 1) / (count + 1);
      } else {
        const cacheHits = Math.floor(metrics.cacheHitRate * count);
        metrics.cacheHitRate = cacheHits / (count + 1);
      }
    }

    // Update total cost
    this.totalCost += context.costs.amount;

    return context;
  }

  /**
   * Helper methods
   */

  private hasRequiredCapabilities(
    model: ModelCapabilities,
    required: string[]
  ): boolean {
    return required.every(cap => model.features.includes(cap));
  }

  private cleanupCache(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    // Limit cache size
    if (this.cache.size > 10000) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());
      
      const toRemove = entries.slice(0, entries.length - 10000);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Public API methods
   */

  public getMetrics(language?: SupportedLanguage): LanguageSpecificMetrics | Map<SupportedLanguage, LanguageSpecificMetrics> {
    if (language) {
      const metrics = this.metrics.get(language);
      if (!metrics) {
        throw new Error(`No metrics available for language: ${language}`);
      }
      return metrics;
    }
    return new Map(this.metrics);
  }

  public getTotalCost(): number {
    return this.totalCost;
  }

  public clearCache(language?: SupportedLanguage): void {
    if (language) {
      // Clear cache for specific language
      const pattern = this.cacheKeyGenerator.getInvalidationPattern(language);
      const keysToDelete: string[] = [];
      
      this.cache.forEach((entry, key) => {
        if (entry.language === language) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  public getCacheStats(): {
    size: number;
    languages: Record<SupportedLanguage, number>;
    hitRate: number;
  } {
    const languageStats: Record<SupportedLanguage, number> = { en: 0, no: 0 };
    let totalHits = 0;
    let totalRequests = 0;

    this.cache.forEach(entry => {
      languageStats[entry.language]++;
      totalHits += entry.hitCount;
    });

    this.metrics.forEach(metrics => {
      totalRequests += metrics.requestCount;
    });

    return {
      size: this.cache.size,
      languages: languageStats,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    };
  }

  public updateConfig(config: Partial<GatewayConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getQueueStatus(): {
    size: number;
    requests: string[];
  } {
    return {
      size: this.requestQueue.size,
      requests: Array.from(this.requestQueue.keys()),
    };
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const checks = {
      cache: this.config.cacheEnabled ? this.cache.size < 20000 : true,
      queue: this.requestQueue.size < 100,
      cost: this.totalCost < this.config.costThresholds.critical * 100,
      models: this.models.size > 0,
    };

    const allHealthy = Object.values(checks).every(v => v === true);
    const someHealthy = Object.values(checks).some(v => v === true);

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      details: {
        checks,
        metrics: {
          totalRequests: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.requestCount, 0),
          totalCost: this.totalCost,
          cacheSize: this.cache.size,
          queueSize: this.requestQueue.size,
        },
      },
    };
  }
}