/**
 * Provider Cost Models - AI provider pricing and configuration
 */

import { SupportedLanguage } from '../types/language-aware-request';

export type AIProvider = 'openai' | 'anthropic' | 'firecrawl' | 'tavily';

// Model configuration
export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  inputPricing: number; // Per 1K tokens
  outputPricing: number; // Per 1K tokens
  contextWindow: number;
  maxOutput: number;
  capabilities: ModelCapability[];
  languageSupport: Record<SupportedLanguage, LanguageSupportLevel>;
  qualityScore: number; // 0-1
  speedScore: number; // 0-1
  costEfficiency: number; // 0-1
}

// Model capabilities
export type ModelCapability = 
  | 'text-generation'
  | 'translation'
  | 'summarization'
  | 'code-generation'
  | 'reasoning'
  | 'cultural-adaptation'
  | 'long-context'
  | 'function-calling'
  | 'vision'
  | 'json-mode';

// Language support levels
export type LanguageSupportLevel = 'native' | 'good' | 'basic' | 'limited';

// Provider configuration
export interface ProviderCostModel {
  provider: AIProvider;
  models: ModelConfig[];
  apiCosts: {
    baseRate: number; // Per request
    rateLimits: {
      requestsPerMinute: number;
      tokensPerMinute: number;
      requestsPerDay: number;
    };
  };
  norwegianPremium: number; // Multiplier for Norwegian content
  volumeDiscounts: Array<{
    threshold: number; // Monthly spend
    discount: number; // Percentage
  }>;
  reliability: number; // 0-1
  averageLatency: number; // Milliseconds
}

// Research API pricing
export interface ResearchAPICost {
  provider: 'firecrawl' | 'tavily';
  operations: {
    search: number;
    scrape: number;
    crawl: number;
    extract: number;
  };
  norwegianMultiplier: number;
  rateLimit: number; // Requests per minute
}

// Usage tier pricing
export interface UsageTier {
  name: string;
  minUsage: number; // Monthly tokens
  maxUsage: number;
  discount: number; // Percentage
  features: string[];
}

export class ProviderCostManager {
  private static instance: ProviderCostManager;
  private providers: Map<AIProvider, ProviderCostModel>;
  private models: Map<string, ModelConfig>;
  private researchAPIs: Map<string, ResearchAPICost>;
  private usageTiers: UsageTier[];

  private constructor() {
    this.providers = this.initializeProviders();
    this.models = this.initializeModels();
    this.researchAPIs = this.initializeResearchAPIs();
    this.usageTiers = this.initializeUsageTiers();
  }

  public static getInstance(): ProviderCostManager {
    if (!ProviderCostManager.instance) {
      ProviderCostManager.instance = new ProviderCostManager();
    }
    return ProviderCostManager.instance;
  }

  /**
   * Initialize provider models
   */
  private initializeProviders(): Map<AIProvider, ProviderCostModel> {
    const providers = new Map<AIProvider, ProviderCostModel>();

    // OpenAI
    providers.set('openai', {
      provider: 'openai',
      models: [], // Will be populated from initializeModels
      apiCosts: {
        baseRate: 0,
        rateLimits: {
          requestsPerMinute: 3500,
          tokensPerMinute: 90000,
          requestsPerDay: 10000,
        },
      },
      norwegianPremium: 1.2,
      volumeDiscounts: [
        { threshold: 100, discount: 5 },
        { threshold: 500, discount: 10 },
        { threshold: 1000, discount: 15 },
      ],
      reliability: 0.95,
      averageLatency: 800,
    });

    // Anthropic
    providers.set('anthropic', {
      provider: 'anthropic',
      models: [],
      apiCosts: {
        baseRate: 0,
        rateLimits: {
          requestsPerMinute: 1000,
          tokensPerMinute: 100000,
          requestsPerDay: 50000,
        },
      },
      norwegianPremium: 1.15,
      volumeDiscounts: [
        { threshold: 200, discount: 8 },
        { threshold: 1000, discount: 12 },
      ],
      reliability: 0.93,
      averageLatency: 1000,
    });

    return providers;
  }

  /**
   * Initialize model configurations
   */
  private initializeModels(): Map<string, ModelConfig> {
    const models = new Map<string, ModelConfig>();

    // OpenAI GPT-5 Models (Latest Generation - August 2025)
    models.set('gpt-5', {
      id: 'gpt-5',
      name: 'GPT-5',
      provider: 'openai',
      inputPricing: 0.00125,
      outputPricing: 0.01,
      contextWindow: 16384,
      maxOutput: 8192,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'code-generation',
        'reasoning',
        'cultural-adaptation',
        'long-context',
        'function-calling',
        'vision',
        'json-mode',
      ],
      languageSupport: {
        en: 'native',
        no: 'native',
      },
      qualityScore: 0.98,
      speedScore: 0.90,
      costEfficiency: 0.85,
    });

    models.set('gpt-5-mini', {
      id: 'gpt-5-mini',
      name: 'GPT-5 Mini',
      provider: 'openai',
      inputPricing: 0.00025,
      outputPricing: 0.002,
      contextWindow: 8192,
      maxOutput: 4096,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'code-generation',
        'reasoning',
        'cultural-adaptation',
        'function-calling',
        'json-mode',
      ],
      languageSupport: {
        en: 'native',
        no: 'native',
      },
      qualityScore: 0.92,
      speedScore: 0.95,
      costEfficiency: 0.95,
    });

    models.set('gpt-5-nano', {
      id: 'gpt-5-nano',
      name: 'GPT-5 Nano',
      provider: 'openai',
      inputPricing: 0.00005,
      outputPricing: 0.0004,
      contextWindow: 4096,
      maxOutput: 2048,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'function-calling',
        'json-mode',
      ],
      languageSupport: {
        en: 'native',
        no: 'good',
      },
      qualityScore: 0.85,
      speedScore: 0.98,
      costEfficiency: 0.99,
    });

    // OpenAI GPT-4 Models (Previous Generation)
    models.set('gpt-4o', {
      id: 'gpt-4o',
      name: 'GPT-4 Optimized',
      provider: 'openai',
      inputPricing: 0.0025,
      outputPricing: 0.01,
      contextWindow: 8192,
      maxOutput: 4096,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'code-generation',
        'reasoning',
        'cultural-adaptation',
        'function-calling',
        'json-mode',
      ],
      languageSupport: {
        en: 'native',
        no: 'good',
      },
      qualityScore: 0.94,
      speedScore: 0.88,
      costEfficiency: 0.80,
    });

    models.set('gpt-4-turbo', {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      inputPricing: 0.01,
      outputPricing: 0.03,
      contextWindow: 128000,
      maxOutput: 4096,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'code-generation',
        'reasoning',
        'cultural-adaptation',
        'long-context',
        'function-calling',
        'vision',
        'json-mode',
      ],
      languageSupport: {
        en: 'native',
        no: 'good',
      },
      qualityScore: 0.95,
      speedScore: 0.85,
      costEfficiency: 0.7,
    });

    models.set('gpt-4', {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      inputPricing: 0.03,
      outputPricing: 0.06,
      contextWindow: 8192,
      maxOutput: 4096,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'code-generation',
        'reasoning',
        'cultural-adaptation',
        'function-calling',
      ],
      languageSupport: {
        en: 'native',
        no: 'good',
      },
      qualityScore: 0.96,
      speedScore: 0.7,
      costEfficiency: 0.5,
    });

    // GPT-3.5 removed - replaced by GPT-5-nano which is cheaper and better

    // Anthropic Models
    models.set('claude-3-opus', {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      inputPricing: 0.015,
      outputPricing: 0.075,
      contextWindow: 200000,
      maxOutput: 4096,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'code-generation',
        'reasoning',
        'cultural-adaptation',
        'long-context',
        'vision',
      ],
      languageSupport: {
        en: 'native',
        no: 'good',
      },
      qualityScore: 0.97,
      speedScore: 0.6,
      costEfficiency: 0.4,
    });

    models.set('claude-3-sonnet', {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      inputPricing: 0.003,
      outputPricing: 0.015,
      contextWindow: 200000,
      maxOutput: 4096,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'code-generation',
        'reasoning',
        'cultural-adaptation',
        'long-context',
      ],
      languageSupport: {
        en: 'native',
        no: 'good',
      },
      qualityScore: 0.90,
      speedScore: 0.8,
      costEfficiency: 0.75,
    });

    models.set('claude-3-haiku', {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      inputPricing: 0.00025,
      outputPricing: 0.00125,
      contextWindow: 200000,
      maxOutput: 4096,
      capabilities: [
        'text-generation',
        'translation',
        'summarization',
        'long-context',
      ],
      languageSupport: {
        en: 'native',
        no: 'basic',
      },
      qualityScore: 0.70,
      speedScore: 0.98,
      costEfficiency: 0.98,
    });

    // Update provider models
    const openaiModels = Array.from(models.values()).filter(m => m.provider === 'openai');
    const anthropicModels = Array.from(models.values()).filter(m => m.provider === 'anthropic');
    
    const providers = this.providers || new Map();
    const openaiProvider = providers.get('openai');
    if (openaiProvider) {
      openaiProvider.models = openaiModels;
    }
    
    const anthropicProvider = providers.get('anthropic');
    if (anthropicProvider) {
      anthropicProvider.models = anthropicModels;
    }

    return models;
  }

  /**
   * Initialize research API costs
   */
  private initializeResearchAPIs(): Map<string, ResearchAPICost> {
    const apis = new Map<string, ResearchAPICost>();

    apis.set('firecrawl', {
      provider: 'firecrawl',
      operations: {
        search: 0.001,
        scrape: 0.002,
        crawl: 0.005,
        extract: 0.003,
      },
      norwegianMultiplier: 1.5,
      rateLimit: 100,
    });

    apis.set('tavily', {
      provider: 'tavily',
      operations: {
        search: 0.0008,
        scrape: 0.0015,
        crawl: 0.004,
        extract: 0.002,
      },
      norwegianMultiplier: 1.3,
      rateLimit: 60,
    });

    return apis;
  }

  /**
   * Initialize usage tiers
   */
  private initializeUsageTiers(): UsageTier[] {
    return [
      {
        name: 'Starter',
        minUsage: 0,
        maxUsage: 100000,
        discount: 0,
        features: ['Basic models', 'Standard support'],
      },
      {
        name: 'Growth',
        minUsage: 100000,
        maxUsage: 1000000,
        discount: 10,
        features: ['All models', 'Priority support', 'Usage analytics'],
      },
      {
        name: 'Scale',
        minUsage: 1000000,
        maxUsage: 10000000,
        discount: 20,
        features: ['All models', 'Dedicated support', 'Advanced analytics', 'Custom limits'],
      },
      {
        name: 'Enterprise',
        minUsage: 10000000,
        maxUsage: Infinity,
        discount: 30,
        features: ['All models', 'White-glove support', 'Custom pricing', 'SLA'],
      },
    ];
  }

  /**
   * Get optimal model for request
   */
  public getOptimalModel(requirements: {
    capabilities: ModelCapability[];
    language: SupportedLanguage;
    maxCost?: number;
    minQuality?: number;
    preferredProvider?: AIProvider;
  }): ModelConfig | null {
    let candidates = Array.from(this.models.values());

    // Filter by required capabilities
    candidates = candidates.filter(model => 
      requirements.capabilities.every(cap => model.capabilities.includes(cap))
    );

    // Filter by language support
    candidates = candidates.filter(model => {
      const support = model.languageSupport[requirements.language];
      return support === 'native' || support === 'good';
    });

    // Filter by quality threshold
    if (requirements.minQuality !== undefined) {
      const minQuality = requirements.minQuality;
      candidates = candidates.filter(m => m.qualityScore >= minQuality);
    }

    // Filter by cost threshold
    if (requirements.maxCost !== undefined) {
      const maxCost = requirements.maxCost;
      candidates = candidates.filter(m => 
        (m.inputPricing + m.outputPricing) / 2 <= maxCost
      );
    }

    // Filter by preferred provider
    if (requirements.preferredProvider) {
      const providerModels = candidates.filter(m => m.provider === requirements.preferredProvider);
      if (providerModels.length > 0) {
        candidates = providerModels;
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by cost efficiency and quality balance
    candidates.sort((a, b) => {
      const aScore = (a.costEfficiency * 0.5) + (a.qualityScore * 0.5);
      const bScore = (b.costEfficiency * 0.5) + (b.qualityScore * 0.5);
      return bScore - aScore;
    });

    return candidates[0];
  }

  /**
   * Calculate cost for tokens
   */
  public calculateTokenCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    language: SupportedLanguage = 'en'
  ): {
    baseCost: number;
    languageMultiplier: number;
    finalCost: number;
    breakdown: {
      inputCost: number;
      outputCost: number;
    };
  } {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const inputCost = (inputTokens / 1000) * model.inputPricing;
    const outputCost = (outputTokens / 1000) * model.outputPricing;
    const baseCost = inputCost + outputCost;

    // Apply language multiplier
    let languageMultiplier = 1.0;
    if (language === 'no') {
      const provider = this.providers.get(model.provider);
      if (provider) {
        languageMultiplier = provider.norwegianPremium;
      }

      // Additional multiplier based on support level
      const supportLevel = model.languageSupport[language];
      switch (supportLevel) {
        case 'basic':
          languageMultiplier *= 1.2;
          break;
        case 'limited':
          languageMultiplier *= 1.5;
          break;
      }
    }

    return {
      baseCost,
      languageMultiplier,
      finalCost: baseCost * languageMultiplier,
      breakdown: {
        inputCost,
        outputCost,
      },
    };
  }

  /**
   * Get volume discount
   */
  public getVolumeDiscount(
    provider: AIProvider,
    monthlySpend: number
  ): number {
    const providerModel = this.providers.get(provider);
    if (!providerModel) {
      return 0;
    }

    let discount = 0;
    for (const tier of providerModel.volumeDiscounts) {
      if (monthlySpend >= tier.threshold) {
        discount = tier.discount;
      }
    }

    return discount;
  }

  /**
   * Get usage tier
   */
  public getUsageTier(monthlyTokens: number): UsageTier {
    for (const tier of this.usageTiers) {
      if (monthlyTokens >= tier.minUsage && monthlyTokens < tier.maxUsage) {
        return tier;
      }
    }
    return this.usageTiers[0];
  }

  /**
   * Compare providers
   */
  public compareProviders(
    inputTokens: number,
    outputTokens: number,
    language: SupportedLanguage = 'en'
  ): Array<{
    provider: AIProvider;
    model: string;
    cost: number;
    quality: number;
    speed: number;
    recommendation: string;
  }> {
    const comparisons: Array<{
      provider: AIProvider;
      model: string;
      cost: number;
      quality: number;
      speed: number;
      recommendation: string;
    }> = [];

    for (const model of this.models.values()) {
      const costData = this.calculateTokenCost(
        model.id,
        inputTokens,
        outputTokens,
        language
      );

      let recommendation = '';
      if (model.costEfficiency > 0.8) {
        recommendation = 'Best value';
      } else if (model.qualityScore > 0.9) {
        recommendation = 'Highest quality';
      } else if (model.speedScore > 0.9) {
        recommendation = 'Fastest';
      }

      comparisons.push({
        provider: model.provider,
        model: model.name,
        cost: costData.finalCost,
        quality: model.qualityScore,
        speed: model.speedScore,
        recommendation,
      });
    }

    return comparisons.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Estimate research API cost
   */
  public estimateResearchCost(
    provider: 'firecrawl' | 'tavily',
    operation: 'search' | 'scrape' | 'crawl' | 'extract',
    count: number = 1,
    language: SupportedLanguage = 'en'
  ): number {
    const api = this.researchAPIs.get(provider);
    if (!api) {
      throw new Error(`Research API ${provider} not found`);
    }

    const baseCost = api.operations[operation] * count;
    const multiplier = language === 'no' ? api.norwegianMultiplier : 1.0;

    return baseCost * multiplier;
  }

  /**
   * Get rate limits
   */
  public getRateLimits(provider: AIProvider): {
    requestsPerMinute: number;
    tokensPerMinute: number;
    requestsPerDay: number;
  } {
    const providerModel = this.providers.get(provider);
    if (!providerModel) {
      throw new Error(`Provider ${provider} not found`);
    }

    return providerModel.apiCosts.rateLimits;
  }

  /**
   * Get provider reliability
   */
  public getProviderReliability(provider: AIProvider): {
    reliability: number;
    averageLatency: number;
  } {
    const providerModel = this.providers.get(provider);
    if (!providerModel) {
      throw new Error(`Provider ${provider} not found`);
    }

    return {
      reliability: providerModel.reliability,
      averageLatency: providerModel.averageLatency,
    };
  }

  /**
   * Get all models
   */
  public getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by provider
   */
  public getModelsByProvider(provider: AIProvider): ModelConfig[] {
    return Array.from(this.models.values()).filter(m => m.provider === provider);
  }

  /**
   * Get models by capability
   */
  public getModelsByCapability(capability: ModelCapability): ModelConfig[] {
    return Array.from(this.models.values()).filter(m => 
      m.capabilities.includes(capability)
    );
  }

  /**
   * Get cost optimization recommendations
   */
  public getCostOptimizationRecommendations(
    currentUsage: {
      provider: AIProvider;
      model: string;
      monthlyTokens: number;
      averageRequestSize: number;
    }
  ): string[] {
    const recommendations: string[] = [];
    const currentModel = this.models.get(currentUsage.model);

    if (!currentModel) {
      return ['Current model not found in configuration'];
    }

    // Check for more cost-effective models
    const alternatives = this.getAllModels()
      .filter(m => m.id !== currentUsage.model)
      .filter(m => m.costEfficiency > currentModel.costEfficiency)
      .filter(m => m.qualityScore >= currentModel.qualityScore * 0.9);

    if (alternatives.length > 0) {
      const best = alternatives[0];
      const savings = ((currentModel.inputPricing - best.inputPricing) / currentModel.inputPricing) * 100;
      recommendations.push(
        `Consider switching to ${best.name} for ${savings.toFixed(1)}% cost savings`
      );
    }

    // Check for volume discounts
    const monthlySpend = (currentUsage.monthlyTokens / 1000) * 
      ((currentModel.inputPricing + currentModel.outputPricing) / 2);
    
    const discount = this.getVolumeDiscount(currentUsage.provider, monthlySpend);
    if (discount === 0) {
      const provider = this.providers.get(currentUsage.provider);
      if (provider && provider.volumeDiscounts.length > 0) {
        const nextTier = provider.volumeDiscounts[0];
        const needed = nextTier.threshold - monthlySpend;
        if (needed < monthlySpend * 0.2) {
          recommendations.push(
            `Increase usage by $${needed.toFixed(2)} to qualify for ${nextTier.discount}% volume discount`
          );
        }
      }
    }

    // Check for usage tier benefits
    const currentTier = this.getUsageTier(currentUsage.monthlyTokens);
    const nextTierIndex = this.usageTiers.indexOf(currentTier) + 1;
    if (nextTierIndex < this.usageTiers.length) {
      const nextTier = this.usageTiers[nextTierIndex];
      const tokensNeeded = nextTier.minUsage - currentUsage.monthlyTokens;
      if (tokensNeeded < currentUsage.monthlyTokens * 0.3) {
        recommendations.push(
          `Increase usage by ${tokensNeeded.toLocaleString()} tokens to reach ${nextTier.name} tier (${nextTier.discount}% discount)`
        );
      }
    }

    // Check for batching opportunities
    if (currentUsage.averageRequestSize < 500) {
      recommendations.push(
        'Consider batching requests to reduce per-request overhead'
      );
    }

    return recommendations;
  }
}