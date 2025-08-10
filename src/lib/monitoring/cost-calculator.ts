/**
 * Cost Calculator - Utilities for calculating costs with Norwegian language support
 */

import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  RouteDecision,
  SupportedLanguage,
} from '../types/language-aware-request';

export type AIProvider = 'openai' | 'anthropic' | 'firecrawl' | 'tavily';

// Cost breakdown structure
export interface CostBreakdown {
  aiProviderCost: number;
  researchCost?: number;
  translationCost?: number;
  culturalAdaptationCost?: number;
  processingOverhead: number;
  languageMultiplier: number;
  cacheDiscount: number;
  total: number;
  currency: 'USD';
  breakdown: {
    tokens: {
      prompt: number;
      completion: number;
      total: number;
      costPerToken: number;
    };
    research?: {
      apiCalls: number;
      costPerCall: number;
      total: number;
    };
    translation?: {
      characters: number;
      costPerCharacter: number;
      total: number;
    };
  };
}

// Language cost multipliers
export interface LanguageCostMultiplier {
  language: SupportedLanguage;
  baseMultiplier: number;
  complexityMultiplier: number;
  researchMultiplier: number;
  factors: {
    linguisticComplexity: number;
    marketSize: number;
    dataAvailability: number;
    culturalAdaptation: number;
  };
}

// Provider cost estimation
export interface ProviderCostEstimation {
  provider: AIProvider;
  cost: number;
  time: number;
  confidence: number;
  breakdown: Partial<CostBreakdown>;
}

// Model pricing configuration
interface ModelPricing {
  provider: AIProvider;
  model: string;
  inputCostPer1K: number;
  outputCostPer1K: number;
  contextWindow: number;
  norwegianSupport: 'native' | 'translated' | 'limited';
  qualityScore: number; // 0-1
}

// Research API pricing
interface ResearchAPIPricing {
  provider: 'firecrawl' | 'tavily';
  costPerRequest: number;
  costPerPage?: number;
  costPerSearch?: number;
  norwegianDomainMultiplier: number;
}

export class CostCalculator {
  private static instance: CostCalculator;
  private modelPricing: Map<string, ModelPricing>;
  private researchPricing: Map<string, ResearchAPIPricing>;
  private languageMultipliers: Map<SupportedLanguage, LanguageCostMultiplier>;
  private exchangeRates: Map<string, number>;

  private constructor() {
    this.modelPricing = this.initializeModelPricing();
    this.researchPricing = this.initializeResearchPricing();
    this.languageMultipliers = this.initializeLanguageMultipliers();
    this.exchangeRates = new Map([
      ['USD', 1.0],
      ['NOK', 10.5], // Norwegian Krone
      ['EUR', 0.92],
    ]);
  }

  public static getInstance(): CostCalculator {
    if (!CostCalculator.instance) {
      CostCalculator.instance = new CostCalculator();
    }
    return CostCalculator.instance;
  }

  /**
   * Initialize model pricing data
   */
  private initializeModelPricing(): Map<string, ModelPricing> {
    const pricing = new Map<string, ModelPricing>();

    // OpenAI GPT-5 Models (Latest)
    pricing.set('gpt-5', {
      provider: 'openai',
      model: 'gpt-5',
      inputCostPer1K: 0.00125,
      outputCostPer1K: 0.01,
      contextWindow: 16384,
      norwegianSupport: 'native',
      qualityScore: 0.98,
    });

    pricing.set('gpt-5-mini', {
      provider: 'openai',
      model: 'gpt-5-mini',
      inputCostPer1K: 0.00025,
      outputCostPer1K: 0.002,
      contextWindow: 8192,
      norwegianSupport: 'native',
      qualityScore: 0.92,
    });

    pricing.set('gpt-5-nano', {
      provider: 'openai',
      model: 'gpt-5-nano',
      inputCostPer1K: 0.00005,
      outputCostPer1K: 0.0004,
      contextWindow: 4096,
      norwegianSupport: 'native',
      qualityScore: 0.85,
    });

    // OpenAI GPT-4 Models (Legacy)
    pricing.set('gpt-4o', {
      provider: 'openai',
      model: 'gpt-4o',
      inputCostPer1K: 0.0025,
      outputCostPer1K: 0.01,
      contextWindow: 8192,
      norwegianSupport: 'native',
      qualityScore: 0.94,
    });

    pricing.set('gpt-4', {
      provider: 'openai',
      model: 'gpt-4',
      inputCostPer1K: 0.03,
      outputCostPer1K: 0.06,
      contextWindow: 8192,
      norwegianSupport: 'native',
      qualityScore: 0.93,
    });

    pricing.set('gpt-4-turbo', {
      provider: 'openai',
      model: 'gpt-4-turbo',
      inputCostPer1K: 0.01,
      outputCostPer1K: 0.03,
      contextWindow: 128000,
      norwegianSupport: 'native',
      qualityScore: 0.92,
    });

    // Anthropic Models
    pricing.set('claude-3-opus', {
      provider: 'anthropic',
      model: 'claude-3-opus',
      inputCostPer1K: 0.015,
      outputCostPer1K: 0.075,
      contextWindow: 200000,
      norwegianSupport: 'native',
      qualityScore: 0.96,
    });

    pricing.set('claude-3-sonnet', {
      provider: 'anthropic',
      model: 'claude-3-sonnet',
      inputCostPer1K: 0.003,
      outputCostPer1K: 0.015,
      contextWindow: 200000,
      norwegianSupport: 'native',
      qualityScore: 0.90,
    });

    pricing.set('claude-3-haiku', {
      provider: 'anthropic',
      model: 'claude-3-haiku',
      inputCostPer1K: 0.00025,
      outputCostPer1K: 0.00125,
      contextWindow: 200000,
      norwegianSupport: 'translated',
      qualityScore: 0.70,
    });

    // Simplified naming and aliases
    pricing.set('gpt-5-norwegian', pricing.get('gpt-5')!);
    pricing.set('gpt-5-mini-norwegian', pricing.get('gpt-5-mini')!);
    pricing.set('gpt-4o-norwegian', pricing.get('gpt-4o')!);
    pricing.set('claude-3', pricing.get('claude-3-sonnet')!);
    pricing.set('claude', pricing.get('claude-3-sonnet')!);

    return pricing;
  }

  /**
   * Initialize research API pricing
   */
  private initializeResearchPricing(): Map<string, ResearchAPIPricing> {
    const pricing = new Map<string, ResearchAPIPricing>();

    pricing.set('firecrawl', {
      provider: 'firecrawl',
      costPerRequest: 0.002,
      costPerPage: 0.001,
      norwegianDomainMultiplier: 1.5, // Norwegian sites may be slower/harder to crawl
    });

    pricing.set('tavily', {
      provider: 'tavily',
      costPerRequest: 0.001,
      costPerSearch: 0.0005,
      norwegianDomainMultiplier: 1.3, // Norwegian search results may be limited
    });

    return pricing;
  }

  /**
   * Initialize language multipliers
   */
  private initializeLanguageMultipliers(): Map<SupportedLanguage, LanguageCostMultiplier> {
    const multipliers = new Map<SupportedLanguage, LanguageCostMultiplier>();

    // English (baseline)
    multipliers.set('en', {
      language: 'en',
      baseMultiplier: 1.0,
      complexityMultiplier: 1.0,
      researchMultiplier: 1.0,
      factors: {
        linguisticComplexity: 1.0,
        marketSize: 1.0,
        dataAvailability: 1.0,
        culturalAdaptation: 1.0,
      },
    });

    // Norwegian (higher complexity)
    multipliers.set('no', {
      language: 'no',
      baseMultiplier: 1.3,
      complexityMultiplier: 1.25,
      researchMultiplier: 1.4,
      factors: {
        linguisticComplexity: 1.3, // More complex grammar, dialects
        marketSize: 0.8, // Smaller market, less optimization
        dataAvailability: 0.7, // Less training data available
        culturalAdaptation: 1.5, // Requires specific cultural knowledge
      },
    });

    return multipliers;
  }

  /**
   * Calculate total cost for a request
   */
  public async calculateCost(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    route: RouteDecision
  ): Promise<CostBreakdown> {
    const modelPricing = this.getModelPricing(route.targetModel);
    const languageMultiplier = this.languageMultipliers.get(request.outputLanguage)!;

    // Calculate token costs
    const tokenCost = this.calculateTokenCost(
      response.metadata.tokenUsage,
      modelPricing
    );

    // Apply language multiplier
    const adjustedTokenCost = tokenCost * languageMultiplier.baseMultiplier;

    // Calculate additional costs
    const researchCost = await this.calculateResearchCost(request);
    const translationCost = this.calculateTranslationCost(request, response);
    const culturalAdaptationCost = this.calculateCulturalAdaptationCost(request);
    const processingOverhead = this.calculateProcessingOverhead(response);

    // Apply cache discount
    const cacheDiscount = response.metadata.cacheHit ? adjustedTokenCost * 0.95 : 0;

    // Calculate total
    const total = 
      adjustedTokenCost +
      (researchCost || 0) +
      (translationCost || 0) +
      (culturalAdaptationCost || 0) +
      processingOverhead -
      cacheDiscount;

    return {
      aiProviderCost: adjustedTokenCost,
      researchCost,
      translationCost,
      culturalAdaptationCost,
      processingOverhead,
      languageMultiplier: languageMultiplier.baseMultiplier,
      cacheDiscount,
      total,
      currency: 'USD',
      breakdown: {
        tokens: {
          prompt: response.metadata.tokenUsage.prompt,
          completion: response.metadata.tokenUsage.completion,
          total: response.metadata.tokenUsage.total,
          costPerToken: modelPricing.inputCostPer1K / 1000,
        },
        research: researchCost ? {
          apiCalls: Math.ceil(researchCost / 0.001),
          costPerCall: 0.001,
          total: researchCost,
        } : undefined,
        translation: translationCost ? {
          characters: request.topic.length + (request.keywords?.join(' ').length || 0),
          costPerCharacter: 0.00001,
          total: translationCost,
        } : undefined,
      },
    };
  }

  /**
   * Calculate token cost
   */
  private calculateTokenCost(
    tokenUsage: { prompt: number; completion: number; total: number },
    pricing: ModelPricing
  ): number {
    const inputCost = (tokenUsage.prompt / 1000) * pricing.inputCostPer1K;
    const outputCost = (tokenUsage.completion / 1000) * pricing.outputCostPer1K;
    return inputCost + outputCost;
  }

  /**
   * Calculate research API cost
   */
  private async calculateResearchCost(
    request: LanguageAwareContentRequest
  ): Promise<number | undefined> {
    // Check if research is needed based on content type
    const needsResearch = 
      request.type === 'article' ||
      request.type === 'blog' ||
      (request.type === 'landing' && request.wordCount && request.wordCount > 1000);

    if (!needsResearch) {
      return undefined;
    }

    // Default to Firecrawl pricing
    const pricing = this.researchPricing.get('firecrawl')!;
    const baseCost = pricing.costPerRequest + (pricing.costPerPage || 0) * 3; // Assume 3 pages

    // Apply Norwegian multiplier if applicable
    const multiplier = request.outputLanguage === 'no' 
      ? pricing.norwegianDomainMultiplier 
      : 1.0;

    return baseCost * multiplier;
  }

  /**
   * Calculate translation cost
   */
  private calculateTranslationCost(
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse
  ): number | undefined {
    if (!response.metadata.wasTranslated) {
      return undefined;
    }

    // Estimate character count
    const characterCount = response.content.length;
    const costPerCharacter = 0.00001; // $0.01 per 1000 characters

    // Apply Norwegian translation complexity
    const complexityMultiplier = request.outputLanguage === 'no' ? 1.5 : 1.0;

    return characterCount * costPerCharacter * complexityMultiplier;
  }

  /**
   * Calculate cultural adaptation cost
   */
  private calculateCulturalAdaptationCost(
    request: LanguageAwareContentRequest
  ): number | undefined {
    if (!request.culturalContext) {
      return undefined;
    }

    // Base cost for cultural adaptation
    let baseCost = 0.01;

    // Adjust based on complexity
    if (request.culturalContext.businessType === 'government') {
      baseCost *= 2; // Government content requires more precision
    }

    if (request.culturalContext.localReferences) {
      baseCost *= 1.5; // Local references require more research
    }

    if (request.culturalContext.dialectPreference === 'nynorsk') {
      baseCost *= 1.3; // Nynorsk is less common, may require more processing
    }

    return baseCost;
  }

  /**
   * Calculate processing overhead
   */
  private calculateProcessingOverhead(
    response: LanguageAwareResponse
  ): number {
    // Base overhead
    let overhead = 0.0001;

    // Add time-based overhead (longer processing = more resources)
    const processingSeconds = response.metadata.processingTime / 1000;
    overhead += processingSeconds * 0.00001;

    // Add complexity overhead
    if (response.metadata.fallbackUsed) {
      overhead += 0.0005; // Fallback adds overhead
    }

    return overhead;
  }

  /**
   * Get model pricing
   */
  private getModelPricing(model: string): ModelPricing {
    // Try exact match first
    let pricing = this.modelPricing.get(model);
    
    if (!pricing) {
      // Try to match by partial name
      for (const [key, value] of this.modelPricing) {
        if (model.includes(key) || key.includes(model)) {
          pricing = value;
          break;
        }
      }
    }

    // Default to GPT-5-nano pricing if not found (cheapest option)
    return pricing || this.modelPricing.get('gpt-5-nano')!;
  }

  /**
   * Estimate cost for a provider
   */
  public async estimateProviderCost(
    provider: AIProvider,
    request: LanguageAwareContentRequest
  ): Promise<ProviderCostEstimation> {
    // Find best model for provider
    let bestModel: ModelPricing | undefined;
    for (const pricing of this.modelPricing.values()) {
      if (pricing.provider === provider) {
        if (!bestModel || pricing.qualityScore > bestModel.qualityScore) {
          bestModel = pricing;
        }
      }
    }

    if (!bestModel) {
      throw new Error(`No models found for provider: ${provider}`);
    }

    // Estimate tokens
    const estimatedTokens = this.estimateTokens(request);
    const languageMultiplier = this.languageMultipliers.get(request.outputLanguage)!;

    // Calculate base cost
    const tokenCost = this.calculateTokenCost(
      {
        prompt: Math.floor(estimatedTokens * 0.3),
        completion: Math.floor(estimatedTokens * 0.7),
        total: estimatedTokens,
      },
      bestModel
    );

    // Apply language multiplier
    const adjustedCost = tokenCost * languageMultiplier.baseMultiplier;

    // Add estimated additional costs
    const researchCost = request.type === 'article' || request.type === 'blog' ? 0.003 : 0;
    const culturalCost = request.culturalContext ? 0.01 : 0;

    // Calculate confidence based on Norwegian support
    let confidence = bestModel.qualityScore;
    if (request.outputLanguage === 'no') {
      switch (bestModel.norwegianSupport) {
        case 'native':
          confidence *= 1.0;
          break;
        case 'translated':
          confidence *= 0.8;
          break;
        case 'limited':
          confidence *= 0.6;
          break;
      }
    }

    return {
      provider,
      cost: adjustedCost + researchCost + culturalCost,
      time: estimatedTokens * 10, // Rough estimate: 10ms per token
      confidence,
      breakdown: {
        aiProviderCost: adjustedCost,
        researchCost,
        culturalAdaptationCost: culturalCost,
        languageMultiplier: languageMultiplier.baseMultiplier,
        total: adjustedCost + researchCost + culturalCost,
        currency: 'USD',
      },
    };
  }

  /**
   * Estimate tokens for a request
   */
  private estimateTokens(request: LanguageAwareContentRequest): number {
    const wordCount = request.wordCount || 500;
    
    // Rough estimation: 1.5 tokens per word
    let tokens = wordCount * 1.5;

    // Add overhead for prompts and formatting
    tokens += 200;

    // Add complexity multipliers
    if (request.requiresTranslation) {
      tokens *= 1.5;
    }

    if (request.culturalContext) {
      tokens *= 1.3;
    }

    if (request.seoRequirements) {
      tokens *= 1.2;
    }

    // Norwegian text tends to be slightly longer
    if (request.outputLanguage === 'no') {
      tokens *= 1.1;
    }

    return Math.ceil(tokens);
  }

  /**
   * Compare language costs
   */
  public compareLanguageCosts(
    request: LanguageAwareContentRequest
  ): {
    english: number;
    norwegian: number;
    difference: number;
    percentageIncrease: number;
    factors: string[];
  } {
    // Calculate English cost
    const englishRequest = { ...request, outputLanguage: 'en' as SupportedLanguage };
    const englishTokens = this.estimateTokens(englishRequest);
    const englishMultiplier = this.languageMultipliers.get('en')!;
    const englishCost = (englishTokens / 1000) * 0.002 * englishMultiplier.baseMultiplier;

    // Calculate Norwegian cost
    const norwegianRequest = { ...request, outputLanguage: 'no' as SupportedLanguage };
    const norwegianTokens = this.estimateTokens(norwegianRequest);
    const norwegianMultiplier = this.languageMultipliers.get('no')!;
    const norwegianCost = (norwegianTokens / 1000) * 0.002 * norwegianMultiplier.baseMultiplier;

    // Identify factors
    const factors: string[] = [];
    if (norwegianMultiplier.factors.linguisticComplexity > 1) {
      factors.push('Linguistic complexity');
    }
    if (norwegianMultiplier.factors.dataAvailability < 1) {
      factors.push('Limited training data');
    }
    if (norwegianMultiplier.factors.culturalAdaptation > 1) {
      factors.push('Cultural adaptation required');
    }
    if (request.culturalContext) {
      factors.push('Business localization');
    }

    return {
      english: englishCost,
      norwegian: norwegianCost,
      difference: norwegianCost - englishCost,
      percentageIncrease: ((norwegianCost - englishCost) / englishCost) * 100,
      factors,
    };
  }

  /**
   * Calculate cache efficiency
   */
  public calculateCacheEfficiency(
    totalCost: number,
    cacheSavings: number,
    cacheHits: number,
    totalRequests: number
  ): {
    hitRate: number;
    savingsRate: number;
    averageSavingPerHit: number;
    projectedMonthlySavings: number;
    efficiency: 'poor' | 'fair' | 'good' | 'excellent';
  } {
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    const savingsRate = totalCost > 0 ? (cacheSavings / (totalCost + cacheSavings)) * 100 : 0;
    const averageSavingPerHit = cacheHits > 0 ? cacheSavings / cacheHits : 0;
    
    // Project monthly savings based on current rate
    const dailyRequests = totalRequests; // Assume this is daily data
    const projectedMonthlySavings = averageSavingPerHit * hitRate * dailyRequests * 30 / 100;

    // Determine efficiency rating
    let efficiency: 'poor' | 'fair' | 'good' | 'excellent';
    if (hitRate < 10) efficiency = 'poor';
    else if (hitRate < 30) efficiency = 'fair';
    else if (hitRate < 50) efficiency = 'good';
    else efficiency = 'excellent';

    return {
      hitRate,
      savingsRate,
      averageSavingPerHit,
      projectedMonthlySavings,
      efficiency,
    };
  }

  /**
   * Get cost optimization recommendations
   */
  public getCostOptimizationRecommendations(
    metrics: {
      averageTokensPerRequest: number;
      norwegianRequestPercentage: number;
      cacheHitRate: number;
      primaryModel: string;
      averageCostPerRequest: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Token optimization
    if (metrics.averageTokensPerRequest > 2000) {
      recommendations.push(
        'Consider implementing content summarization to reduce token usage'
      );
    }

    // Norwegian optimization
    if (metrics.norwegianRequestPercentage > 50) {
      recommendations.push(
        'High Norwegian content volume detected. Consider batch processing for better rates'
      );
      recommendations.push(
        'Implement Norwegian-specific caching strategies for common phrases'
      );
    }

    // Cache optimization
    if (metrics.cacheHitRate < 30) {
      recommendations.push(
        'Low cache hit rate. Increase cache TTL for frequently requested content'
      );
      recommendations.push(
        'Implement semantic caching to match similar requests'
      );
    }

    // Model optimization
    const modelPricing = this.getModelPricing(metrics.primaryModel);
    if (modelPricing.inputCostPer1K > 0.01) {
      recommendations.push(
        'Using expensive model. Consider GPT-3.5-Turbo for simpler requests'
      );
    }

    // Cost threshold
    if (metrics.averageCostPerRequest > 0.05) {
      recommendations.push(
        'High average cost per request. Review content generation strategy'
      );
      recommendations.push(
        'Consider implementing request batching to reduce overhead'
      );
    }

    return recommendations;
  }

  /**
   * Convert cost to different currency
   */
  public convertCurrency(
    amount: number,
    from: string = 'USD',
    to: string = 'NOK'
  ): number {
    const fromRate = this.exchangeRates.get(from) || 1;
    const toRate = this.exchangeRates.get(to) || 1;
    return (amount / fromRate) * toRate;
  }

  /**
   * Format cost for display
   */
  public formatCost(
    amount: number,
    currency: string = 'USD',
    includeNOK: boolean = false
  ): string {
    const formatted = `$${amount.toFixed(4)} ${currency}`;
    
    if (includeNOK && currency === 'USD') {
      const nok = this.convertCurrency(amount, 'USD', 'NOK');
      return `${formatted} (${nok.toFixed(2)} NOK)`;
    }
    
    return formatted;
  }
}