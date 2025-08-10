/**
 * AI Provider Integration with Norwegian Support
 * Multi-provider orchestration with fallback strategies and Norwegian-specific optimizations
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { CostGuardian } from '../monitoring/cost-guardian';
import { MultiLayerCache } from '../cache/multi-layer-cache';
import { 
  NORWEGIAN_SYSTEM_PROMPTS,
  NORWEGIAN_CONTENT_PROMPTS,
  generateNorwegianPrompt,
  enhanceWithNorwegianContext 
} from './norwegian-prompts';
import { ResearchResult } from '../functions/research-function';

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  norwegianOptimized: boolean;
}

/**
 * Generation request with Norwegian context
 */
export interface NorwegianGenerationRequest {
  contentType: 'blogPost' | 'socialMedia' | 'email' | 'websiteCopy' | 'caseStudy' | 'pressRelease';
  topic: string;
  audience: string;
  company?: string;
  industry?: string;
  tone?: 'professional' | 'casual' | 'authoritative' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  research?: ResearchResult[];
  variables?: Record<string, any>;
  preferredProvider?: 'openai' | 'anthropic';
  culturalStrictness?: 'strict' | 'moderate' | 'relaxed';
}

/**
 * Generation response with metadata
 */
export interface GenerationResponse {
  content: string;
  provider: string;
  model: string;
  cost: number;
  latency: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  culturalScore?: number;
  qualityScore?: number;
  cacheHit: boolean;
}

/**
 * Provider-specific configurations for Norwegian content
 */
const NORWEGIAN_PROVIDER_CONFIGS: Record<string, AIProviderConfig> = {
  'gpt-5-norwegian': {
    provider: 'openai',
    model: 'gpt-5',
    temperature: 0.7,
    maxTokens: 8000,
    topP: 0.9,
    frequencyPenalty: 0.3, // Reduce repetition
    presencePenalty: 0.3,  // Encourage variety
    norwegianOptimized: true
  },
  'gpt-5-mini-norwegian': {
    provider: 'openai',
    model: 'gpt-5-mini',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
    frequencyPenalty: 0.3,
    presencePenalty: 0.3,
    norwegianOptimized: true
  },
  'gpt-4o-norwegian': {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
    frequencyPenalty: 0.3,
    presencePenalty: 0.3,
    norwegianOptimized: true
  },
  'gpt-4-norwegian': {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
    frequencyPenalty: 0.3, // Reduce repetition
    presencePenalty: 0.3,  // Encourage variety
    norwegianOptimized: true
  },
  'claude-3-norwegian': {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
    norwegianOptimized: true
  },
  'claude-3-sonnet-norwegian': {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 3000,
    topP: 0.9,
    norwegianOptimized: true
  }
};

/**
 * Norwegian AI Provider Manager
 */
export class NorwegianAIProvider {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private costGuardian: CostGuardian;
  private cache: MultiLayerCache;
  private fallbackChain: string[] = [
    'gpt-5-norwegian',
    'gpt-5-mini-norwegian',
    'gpt-4o-norwegian',
    'gpt-4-norwegian',
    'claude-3-norwegian',
    'claude-3-sonnet-norwegian'
  ];

  constructor(
    costGuardian: CostGuardian,
    cache: MultiLayerCache
  ) {
    this.costGuardian = costGuardian;
    this.cache = cache;
    this.initializeProviders();
  }

  /**
   * Initialize AI providers
   */
  private initializeProviders(): void {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Generate Norwegian content with fallback strategy
   */
  async generateContent(
    request: NorwegianGenerationRequest
  ): Promise<GenerationResponse> {
    const startTime = Date.now();
    
    // Create cache key
    const cacheKey = this.createCacheKey(request);
    
    // Check cache first
    // TODO: Cache interface needs refactoring
    // const cached = await this.cache.get(cacheKey);
    // if (cached && this.isValidCachedResponse(cached)) {
    //   return {
    //     ...cached,
    //     cacheHit: true,
    //     latency: Date.now() - startTime
    //   };
    // }

    // Determine provider order based on preference
    const providerOrder = this.determineProviderOrder(request);
    
    // Try each provider in order
    for (const configName of providerOrder) {
      const config = NORWEGIAN_PROVIDER_CONFIGS[configName];
      
      try {
        // Check cost limits
        const estimatedCost = this.estimateCost(config, request);
        // TODO: CostGuardian interface needs refactoring
        // const canProceed = await this.costGuardian.checkLimit(
        //   'generation',
        //   estimatedCost * 1.3 // 30% Norwegian premium
        // );
        const canProceed = true; // Skip cost check for now
        
        if (!canProceed) {
          console.log(`Cost limit exceeded for ${configName}, trying next provider`);
          continue;
        }

        // Generate content
        const response = await this.callProvider(config, request);
        
        // Track actual cost
        // TODO: CostGuardian interface needs refactoring
        // await this.costGuardian.trackUsage(
        //   'generation',
        //   response.cost,
        //   {
        //     provider: config.provider,
        //     model: config.model,
        //     norwegian: true,
        //     contentType: request.contentType
        //   }
        // );

        // Cache successful response
        // TODO: Cache interface needs refactoring
        // await this.cache.set(cacheKey, response, {
        //   ttl: this.determineCacheTTL(request.contentType)
        // });

        return {
          ...response,
          cacheHit: false,
          latency: Date.now() - startTime
        };

      } catch (error) {
        console.error(`Provider ${configName} failed:`, error);
        continue; // Try next provider
      }
    }

    throw new Error('All AI providers failed to generate content');
  }

  /**
   * Call specific AI provider
   */
  private async callProvider(
    config: AIProviderConfig,
    request: NorwegianGenerationRequest
  ): Promise<GenerationResponse> {
    // Generate prompts with Norwegian context
    const { system, user } = this.preparePrompts(config, request);
    
    if (config.provider === 'openai') {
      return this.callOpenAI(config, system, user, request);
    } else if (config.provider === 'anthropic') {
      return this.callAnthropic(config, system, user, request);
    }
    
    throw new Error(`Unknown provider: ${config.provider}`);
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    config: AIProviderConfig,
    systemPrompt: string,
    userPrompt: string,
    request: NorwegianGenerationRequest
  ): Promise<GenerationResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const completion = await this.openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty
    });

    const response = completion.choices[0];
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      content: response.message?.content || '',
      provider: 'openai',
      model: config.model,
      cost: this.calculateOpenAICost(config.model, usage),
      latency: 0, // Will be set by caller
      tokenUsage: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      },
      cacheHit: false
    };
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    config: AIProviderConfig,
    systemPrompt: string,
    userPrompt: string,
    request: NorwegianGenerationRequest
  ): Promise<GenerationResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const message = await this.anthropic.messages.create({
      model: config.model,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      top_p: config.topP
    });

    // Extract content from response
    const content = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    const usage = {
      prompt: message.usage?.input_tokens || 0,
      completion: message.usage?.output_tokens || 0,
      total: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)
    };

    return {
      content,
      provider: 'anthropic',
      model: config.model,
      cost: this.calculateAnthropicCost(config.model, usage),
      latency: 0, // Will be set by caller
      tokenUsage: usage,
      cacheHit: false
    };
  }

  /**
   * Prepare prompts with Norwegian enhancements
   */
  private preparePrompts(
    config: AIProviderConfig,
    request: NorwegianGenerationRequest
  ): { system: string; user: string } {
    // Get base prompts - map email to emailCampaign
    const contentTypeForPrompt = request.contentType === 'email' ? 'emailCampaign' : request.contentType;
    const prompts = generateNorwegianPrompt(
      contentTypeForPrompt as keyof typeof NORWEGIAN_CONTENT_PROMPTS,
      {
        topic: request.topic,
        audience: request.audience,
        company: request.company || 'Ikke spesifisert',
        industry: request.industry || 'Generell',
        tone: request.tone || 'professional',
        length: this.getTargetLength(request.contentType, request.length),
        ...request.variables
      },
      request.research
    );

    // Enhance with additional context
    let enhancedSystem = prompts.system;
    let enhancedUser = prompts.user;

    // Add cultural strictness
    if (request.culturalStrictness === 'strict') {
      enhancedSystem += '\n\nKULTURELL STRENGHET: Følg Janteloven og norske normer strengt. Ingen unntak.';
    } else if (request.culturalStrictness === 'relaxed') {
      enhancedSystem += '\n\nKULTURELL FLEKSIBILITET: Balanser norske normer med internasjonale standarder der passende.';
    }

    // Add industry context
    if (request.industry) {
      enhancedUser = enhanceWithNorwegianContext(
        enhancedUser,
        request.industry,
        this.inferCompanySize(request.company)
      );
    }

    // Add provider-specific optimizations
    if (config.provider === 'openai') {
      enhancedSystem += '\n\nOPTIMALISERING: Generer naturlig, flytende norsk tekst med variasjon i setningsstruktur.';
    } else if (config.provider === 'anthropic') {
      enhancedSystem += '\n\nFOKUS: Dybde og nyanse i norsk kulturforståelse. Vis empati og innsikt.';
    }

    return {
      system: enhancedSystem,
      user: enhancedUser
    };
  }

  /**
   * Determine provider order based on request
   */
  private determineProviderOrder(request: NorwegianGenerationRequest): string[] {
    const order = [...this.fallbackChain];
    
    // Prioritize preferred provider
    if (request.preferredProvider) {
      const preferred = order.filter(p => 
        p.includes(request.preferredProvider!)
      );
      const others = order.filter(p => 
        !p.includes(request.preferredProvider!)
      );
      return [...preferred, ...others];
    }
    
    // Prioritize based on content type
    if (request.contentType === 'blogPost' || request.contentType === 'caseStudy') {
      // Prefer Claude for longer, nuanced content
      return [
        'claude-3-norwegian',
        'gpt-4-norwegian',
        'claude-3-sonnet-norwegian',
        'gpt-5-mini-norwegian'
      ];
    } else if (request.contentType === 'socialMedia' || request.contentType === 'email') {
      // Prefer GPT for shorter, punchier content
      return [
        'gpt-4-norwegian',
        'gpt-5-mini-norwegian',
        'claude-3-sonnet-norwegian',
        'claude-3-norwegian'
      ];
    }
    
    return order;
  }

  /**
   * Estimate generation cost
   */
  private estimateCost(
    config: AIProviderConfig,
    request: NorwegianGenerationRequest
  ): number {
    const estimatedTokens = this.estimateTokenCount(request);
    
    if (config.provider === 'openai') {
      return this.calculateOpenAICost(
        config.model,
        {
          prompt_tokens: estimatedTokens.prompt,
          completion_tokens: estimatedTokens.completion
        }
      );
    } else {
      return this.calculateAnthropicCost(
        config.model,
        {
          prompt: estimatedTokens.prompt,
          completion: estimatedTokens.completion
        }
      );
    }
  }

  /**
   * Estimate token count for request
   */
  private estimateTokenCount(
    request: NorwegianGenerationRequest
  ): { prompt: number; completion: number; total: number } {
    // Base estimates
    let promptTokens = 500; // System prompt
    promptTokens += 200; // User prompt template
    
    // Add research context
    if (request.research) {
      promptTokens += request.research.length * 150;
    }
    
    // Estimate completion based on content type and length
    const completionTokens = this.getTargetTokens(
      request.contentType,
      request.length
    );
    
    return {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens
    };
  }

  /**
   * Calculate OpenAI cost
   */
  private calculateOpenAICost(
    model: string,
    usage: { prompt_tokens: number; completion_tokens: number }
  ): number {
    const rates: Record<string, { prompt: number; completion: number }> = {
      'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-5': { prompt: 0.00125, completion: 0.01 },
      'gpt-5-mini': { prompt: 0.00025, completion: 0.002 },
      'gpt-5-nano': { prompt: 0.00005, completion: 0.0004 },
      'gpt-4o': { prompt: 0.0025, completion: 0.01 }
    };
    
    const rate = rates[model] || rates['gpt-5-nano'];
    return (usage.prompt_tokens * rate.prompt + 
            usage.completion_tokens * rate.completion) / 1000;
  }

  /**
   * Calculate Anthropic cost
   */
  private calculateAnthropicCost(
    model: string,
    usage: { prompt: number; completion: number }
  ): number {
    const rates: Record<string, { prompt: number; completion: number }> = {
      'claude-3-opus-20240229': { prompt: 0.015, completion: 0.075 },
      'claude-3-sonnet-20240229': { prompt: 0.003, completion: 0.015 },
      'claude-3-haiku-20240307': { prompt: 0.00025, completion: 0.00125 }
    };
    
    const rate = rates[model] || rates['claude-3-haiku-20240307'];
    return (usage.prompt * rate.prompt + 
            usage.completion * rate.completion) / 1000;
  }

  /**
   * Get target length in words
   */
  private getTargetLength(
    contentType: string,
    length?: 'short' | 'medium' | 'long'
  ): number {
    const lengths: Record<string, Record<string, number>> = {
      blogPost: { short: 400, medium: 750, long: 1200 },
      socialMedia: { short: 50, medium: 150, long: 280 },
      email: { short: 150, medium: 250, long: 400 },
      websiteCopy: { short: 100, medium: 200, long: 350 },
      caseStudy: { short: 500, medium: 800, long: 1200 },
      pressRelease: { short: 300, medium: 500, long: 700 }
    };
    
    return lengths[contentType]?.[length || 'medium'] || 300;
  }

  /**
   * Get target tokens for content
   */
  private getTargetTokens(
    contentType: string,
    length?: 'short' | 'medium' | 'long'
  ): number {
    // Rough estimate: 1 word ≈ 1.3 tokens for Norwegian
    return Math.ceil(this.getTargetLength(contentType, length) * 1.3);
  }

  /**
   * Infer company size from name/context
   */
  private inferCompanySize(company?: string): 'startup' | 'SMB' | 'enterprise' {
    if (!company) return 'SMB';
    
    const lower = company.toLowerCase();
    if (lower.includes('startup') || lower.includes('gründer')) {
      return 'startup';
    } else if (lower.includes('as') || lower.includes('asa')) {
      return 'enterprise';
    }
    
    return 'SMB';
  }

  /**
   * Create cache key for request
   */
  private createCacheKey(request: NorwegianGenerationRequest): string {
    const key = {
      type: request.contentType,
      topic: request.topic,
      audience: request.audience,
      company: request.company,
      industry: request.industry,
      tone: request.tone,
      length: request.length,
      researchCount: request.research?.length || 0
    };
    
    return `norwegian_content:${JSON.stringify(key)}`;
  }

  /**
   * Determine cache TTL based on content type
   */
  private determineCacheTTL(contentType: string): number {
    const ttls: Record<string, number> = {
      blogPost: 7 * 24 * 60 * 60,      // 7 days
      caseStudy: 14 * 24 * 60 * 60,    // 14 days
      websiteCopy: 30 * 24 * 60 * 60,  // 30 days
      pressRelease: 24 * 60 * 60,      // 1 day
      socialMedia: 4 * 60 * 60,        // 4 hours
      email: 12 * 60 * 60              // 12 hours
    };
    
    return ttls[contentType] || 24 * 60 * 60; // Default 1 day
  }

  /**
   * Validate cached response
   */
  private isValidCachedResponse(cached: any): boolean {
    return cached &&
           cached.content &&
           cached.provider &&
           cached.model &&
           typeof cached.cost === 'number';
  }

  /**
   * Batch generate multiple content pieces
   */
  async batchGenerate(
    requests: NorwegianGenerationRequest[]
  ): Promise<GenerationResponse[]> {
    // Process in parallel with concurrency limit
    const concurrency = 3;
    const results: GenerationResponse[] = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(req => this.generateContent(req))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Stream generation for real-time output
   */
  async *streamGenerate(
    request: NorwegianGenerationRequest
  ): AsyncGenerator<string, void, unknown> {
    // Note: Simplified streaming - real implementation would use provider streaming APIs
    const response = await this.generateContent(request);
    const words = response.content.split(' ');
    
    for (const word of words) {
      yield word + ' ';
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming
    }
  }
}