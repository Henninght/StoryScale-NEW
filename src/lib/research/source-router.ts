/**
 * Intelligent Source Router
 * Routes research requests to appropriate Norwegian and international sources
 * based on content topic, language, and business context
 */

import {
  LanguageAwareContentRequest,
  SupportedLanguage,
  CulturalContext,
  RequestClassification
} from '../types/language-aware-request';
import {
  NorwegianSource,
  SourceCategory,
  getAllNorwegianSources,
  getSourcesForTopic,
  getSourcesByCategory,
  SOURCE_GROUPS,
  SourceGroup
} from './norwegian-sources';

export interface SourceRoutingDecision {
  primarySources: SourceSelection[];
  secondarySources: SourceSelection[];
  internationalSources: SourceSelection[];
  totalSources: number;
  strategy: RoutingStrategy;
  reasoning: string[];
  estimatedCost: number;
  estimatedTime: number;
  culturalRelevance: number;
}

export interface SourceSelection {
  source: NorwegianSource | InternationalSource;
  priority: number;
  searchQuery: string;
  searchDepth: 'basic' | 'advanced';
  maxResults: number;
  filters?: SourceFilters;
  reason: string;
}

export interface InternationalSource {
  domain: string;
  name: string;
  category: SourceCategory;
  language: SupportedLanguage;
  trustScore: number;
  specializations: string[];
}

export interface SourceFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  mustIncludeKeywords?: string[];
  excludeKeywords?: string[];
  contentType?: string[];
  minTrustScore?: number;
}

export type RoutingStrategy = 
  | 'norwegian_first'    // Prioritize Norwegian sources
  | 'international_first' // Prioritize international sources
  | 'balanced'           // Mix of both
  | 'specialized'        // Focus on domain-specific sources
  | 'comprehensive'      // Maximum coverage
  | 'cost_optimized'     // Minimize API costs
  | 'speed_optimized';   // Fastest sources only

export interface RouterConfig {
  maxPrimarySources: number;
  maxSecondarySources: number;
  maxInternationalSources: number;
  enableParallelSearch: boolean;
  costBudget: number;
  timeBudget: number; // milliseconds
  minTrustScore: number;
  preferNorwegian: boolean;
  requireCulturalContext: boolean;
}

/**
 * International sources for English content
 */
const INTERNATIONAL_SOURCES: InternationalSource[] = [
  {
    domain: 'techcrunch.com',
    name: 'TechCrunch',
    category: 'industry',
    language: 'en',
    trustScore: 8.5,
    specializations: ['technology', 'startups', 'venture-capital', 'innovation']
  },
  {
    domain: 'bloomberg.com',
    name: 'Bloomberg',
    category: 'business',
    language: 'en',
    trustScore: 9.5,
    specializations: ['finance', 'markets', 'economy', 'business-news']
  },
  {
    domain: 'reuters.com',
    name: 'Reuters',
    category: 'news',
    language: 'en',
    trustScore: 9.5,
    specializations: ['international-news', 'business', 'politics', 'markets']
  },
  {
    domain: 'ft.com',
    name: 'Financial Times',
    category: 'business',
    language: 'en',
    trustScore: 9.5,
    specializations: ['finance', 'global-economy', 'analysis', 'markets']
  },
  {
    domain: 'medium.com',
    name: 'Medium',
    category: 'professional',
    language: 'en',
    trustScore: 7,
    specializations: ['thought-leadership', 'technology', 'business', 'culture']
  },
  {
    domain: 'hbr.org',
    name: 'Harvard Business Review',
    category: 'professional',
    language: 'en',
    trustScore: 9,
    specializations: ['management', 'leadership', 'strategy', 'innovation']
  },
  {
    domain: 'economist.com',
    name: 'The Economist',
    category: 'news',
    language: 'en',
    trustScore: 9,
    specializations: ['global-affairs', 'economics', 'politics', 'business']
  },
  {
    domain: 'wsj.com',
    name: 'Wall Street Journal',
    category: 'business',
    language: 'en',
    trustScore: 9.5,
    specializations: ['finance', 'markets', 'business', 'technology']
  }
];

export class SourceRouter {
  private config: RouterConfig;
  private norwegianSources: NorwegianSource[];
  private internationalSources: InternationalSource[];
  private topicKeywords: Map<string, string[]>;

  constructor(config?: Partial<RouterConfig>) {
    this.config = {
      maxPrimarySources: 3,
      maxSecondarySources: 2,
      maxInternationalSources: 2,
      enableParallelSearch: true,
      costBudget: 0.5, // $0.50 per research
      timeBudget: 5000, // 5 seconds
      minTrustScore: 7,
      preferNorwegian: true,
      requireCulturalContext: true,
      ...config
    };

    this.norwegianSources = getAllNorwegianSources();
    this.internationalSources = INTERNATIONAL_SOURCES;
    this.initializeTopicKeywords();
  }

  /**
   * Initialize topic keyword mapping for better routing
   */
  private initializeTopicKeywords(): void {
    this.topicKeywords = new Map([
      ['technology', ['tech', 'IT', 'software', 'digital', 'AI', 'innovation']],
      ['business', ['commerce', 'trade', 'economy', 'market', 'finance', 'corporate']],
      ['startup', ['entrepreneur', 'venture', 'founder', 'innovation', 'scale']],
      ['energy', ['oil', 'gas', 'renewable', 'power', 'electricity', 'green']],
      ['maritime', ['shipping', 'marine', 'offshore', 'vessel', 'port']],
      ['finance', ['banking', 'investment', 'stock', 'market', 'fund', 'capital']],
      ['real-estate', ['property', 'housing', 'construction', 'development']],
      ['government', ['policy', 'regulation', 'public', 'ministry', 'kommune']],
      ['sustainability', ['ESG', 'climate', 'environment', 'green', 'sustainable']]
    ]);
  }

  /**
   * Route research request to appropriate sources
   */
  public async routeRequest(
    request: LanguageAwareContentRequest,
    classification: RequestClassification
  ): Promise<SourceRoutingDecision> {
    // Determine routing strategy
    const strategy = this.determineStrategy(request, classification);
    
    // Extract search queries
    const searchQueries = this.generateSearchQueries(request);
    
    // Select sources based on strategy
    const primarySources = await this.selectPrimarySources(
      request,
      strategy,
      searchQueries
    );
    
    const secondarySources = await this.selectSecondarySources(
      request,
      strategy,
      searchQueries,
      primarySources
    );
    
    const internationalSources = await this.selectInternationalSources(
      request,
      strategy,
      searchQueries
    );
    
    // Calculate estimates
    const estimatedCost = this.calculateEstimatedCost(
      primarySources,
      secondarySources,
      internationalSources
    );
    
    const estimatedTime = this.calculateEstimatedTime(
      primarySources,
      secondarySources,
      internationalSources
    );
    
    const culturalRelevance = this.calculateCulturalRelevance(
      request,
      primarySources,
      secondarySources
    );
    
    return {
      primarySources,
      secondarySources,
      internationalSources,
      totalSources: primarySources.length + secondarySources.length + internationalSources.length,
      strategy,
      reasoning: this.generateRoutingReasoning(request, strategy, primarySources),
      estimatedCost,
      estimatedTime,
      culturalRelevance
    };
  }

  /**
   * Determine routing strategy based on request
   */
  private determineStrategy(
    request: LanguageAwareContentRequest,
    classification: RequestClassification
  ): RoutingStrategy {
    // Norwegian content should prioritize Norwegian sources
    if (request.outputLanguage === 'no') {
      if (request.culturalContext?.market === 'norway') {
        return 'norwegian_first';
      }
      if (request.culturalContext?.market === 'nordic') {
        return 'balanced';
      }
    }
    
    // Check complexity
    if (classification.complexity === 'complex') {
      return 'comprehensive';
    }
    
    // Check for specific industry focus
    if (this.hasSpecializedTopic(request)) {
      return 'specialized';
    }
    
    // Cost optimization for simple requests
    if (classification.complexity === 'simple') {
      return 'cost_optimized';
    }
    
    // Speed optimization for time-sensitive content
    if (request.type === 'social' || request.type === 'ad') {
      return 'speed_optimized';
    }
    
    // Default to balanced approach
    return 'balanced';
  }

  /**
   * Check if request has specialized topic
   */
  private hasSpecializedTopic(request: LanguageAwareContentRequest): boolean {
    const specializedKeywords = [
      'oil', 'gas', 'maritime', 'shipping', 'salmon', 'aquaculture',
      'sovereign wealth', 'hydropower', 'nordic', 'skandinavia'
    ];
    
    const content = request.topic.toLowerCase();
    return specializedKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Generate search queries from request
   */
  private generateSearchQueries(request: LanguageAwareContentRequest): string[] {
    const queries: string[] = [];
    
    // Primary query from topic
    queries.push(request.topic);
    
    // Add keyword-based queries
    if (request.keywords && request.keywords.length > 0) {
      queries.push(request.keywords.join(' '));
    }
    
    // Add SEO-focused query if available
    if (request.seoRequirements) {
      queries.push(request.seoRequirements.primaryKeyword);
    }
    
    // Add Norwegian business context query
    if (request.outputLanguage === 'no' && request.culturalContext) {
      const norwegianQuery = this.createNorwegianContextQuery(request);
      if (norwegianQuery) {
        queries.push(norwegianQuery);
      }
    }
    
    return queries;
  }

  /**
   * Create Norwegian context-specific query
   */
  private createNorwegianContextQuery(request: LanguageAwareContentRequest): string {
    const contextTerms: string[] = [];
    
    if (request.culturalContext?.market === 'norway') {
      contextTerms.push('Norge', 'norsk');
    }
    
    if (request.culturalContext?.businessType === 'b2b') {
      contextTerms.push('bedrift', 'næringsliv');
    }
    
    if (request.culturalContext?.industry) {
      contextTerms.push(request.culturalContext.industry);
    }
    
    return contextTerms.length > 0 
      ? `${request.topic} ${contextTerms.join(' ')}`
      : '';
  }

  /**
   * Select primary sources
   */
  private async selectPrimarySources(
    request: LanguageAwareContentRequest,
    strategy: RoutingStrategy,
    queries: string[]
  ): Promise<SourceSelection[]> {
    const selections: SourceSelection[] = [];
    
    if (strategy === 'norwegian_first' || strategy === 'specialized') {
      // Get Norwegian sources for topic
      const topicSources = getSourcesForTopic(request.topic, this.config.maxPrimarySources * 2);
      
      // Filter by trust score and availability
      const eligibleSources = topicSources.filter(source => 
        source.trustScore >= this.config.minTrustScore &&
        (!source.requiresAuth || this.hasAuthentication(source.domain))
      );
      
      // Select top sources
      for (let i = 0; i < Math.min(eligibleSources.length, this.config.maxPrimarySources); i++) {
        const source = eligibleSources[i];
        selections.push({
          source,
          priority: 1,
          searchQuery: queries[0],
          searchDepth: strategy === 'comprehensive' ? 'advanced' : 'basic',
          maxResults: 3,
          reason: `Primary Norwegian source for ${source.specializations.join(', ')}`
        });
      }
    } else if (strategy === 'international_first') {
      // Select international sources
      const relevantIntl = this.selectRelevantInternational(request, this.config.maxPrimarySources);
      for (const source of relevantIntl) {
        selections.push({
          source,
          priority: 1,
          searchQuery: queries[0],
          searchDepth: 'basic',
          maxResults: 3,
          reason: `International authority on ${source.specializations.join(', ')}`
        });
      }
    } else {
      // Balanced approach - mix both
      const norwegianCount = Math.ceil(this.config.maxPrimarySources / 2);
      const intlCount = this.config.maxPrimarySources - norwegianCount;
      
      // Add Norwegian sources
      const topicSources = getSourcesForTopic(request.topic, norwegianCount);
      for (const source of topicSources) {
        selections.push({
          source,
          priority: 1,
          searchQuery: queries[0],
          searchDepth: 'basic',
          maxResults: 2,
          reason: `Norwegian perspective on ${request.topic}`
        });
      }
      
      // Add international sources
      const intlSources = this.selectRelevantInternational(request, intlCount);
      for (const source of intlSources) {
        selections.push({
          source,
          priority: 1,
          searchQuery: queries[0],
          searchDepth: 'basic',
          maxResults: 2,
          reason: `Global perspective on ${request.topic}`
        });
      }
    }
    
    return selections;
  }

  /**
   * Select secondary sources
   */
  private async selectSecondarySources(
    request: LanguageAwareContentRequest,
    strategy: RoutingStrategy,
    queries: string[],
    primarySources: SourceSelection[]
  ): Promise<SourceSelection[]> {
    const selections: SourceSelection[] = [];
    
    // Get categories already covered by primary sources
    const coveredCategories = new Set(
      primarySources.map(s => 
        'category' in s.source ? s.source.category : 'international'
      )
    );
    
    // Find complementary sources
    const complementaryCategories: SourceCategory[] = [];
    if (!coveredCategories.has('government')) {
      complementaryCategories.push('government');
    }
    if (!coveredCategories.has('professional')) {
      complementaryCategories.push('professional');
    }
    if (!coveredCategories.has('industry')) {
      complementaryCategories.push('industry');
    }
    
    // Select secondary sources from complementary categories
    for (const category of complementaryCategories.slice(0, this.config.maxSecondarySources)) {
      const categorySources = getSourcesByCategory(category);
      const eligible = categorySources.filter(s => 
        s.trustScore >= this.config.minTrustScore - 1 // Slightly lower threshold
      );
      
      if (eligible.length > 0) {
        const source = eligible[0];
        selections.push({
          source,
          priority: 2,
          searchQuery: queries.length > 1 ? queries[1] : queries[0],
          searchDepth: 'basic',
          maxResults: 2,
          reason: `Supplementary ${category} perspective`
        });
      }
    }
    
    return selections;
  }

  /**
   * Select international sources
   */
  private async selectInternationalSources(
    request: LanguageAwareContentRequest,
    strategy: RoutingStrategy,
    queries: string[]
  ): Promise<SourceSelection[]> {
    const selections: SourceSelection[] = [];
    
    // Skip international sources for pure Norwegian content
    if (strategy === 'norwegian_first' && request.outputLanguage === 'no') {
      return selections;
    }
    
    const relevantSources = this.selectRelevantInternational(
      request,
      this.config.maxInternationalSources
    );
    
    for (const source of relevantSources) {
      selections.push({
        source,
        priority: 3,
        searchQuery: queries[0],
        searchDepth: 'basic',
        maxResults: 2,
        filters: {
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            to: new Date()
          }
        },
        reason: `International context from ${source.name}`
      });
    }
    
    return selections;
  }

  /**
   * Select relevant international sources
   */
  private selectRelevantInternational(
    request: LanguageAwareContentRequest,
    count: number
  ): InternationalSource[] {
    const topicLower = request.topic.toLowerCase();
    
    // Score international sources
    const scored = this.internationalSources.map(source => {
      let score = source.trustScore;
      
      // Check specialization match
      source.specializations.forEach(spec => {
        if (topicLower.includes(spec) || spec.includes(topicLower)) {
          score += 2;
        }
      });
      
      // Category bonus
      if (request.type === 'article' && source.category === 'news') score += 1;
      if (request.type === 'blog' && source.category === 'professional') score += 1;
      
      return { source, score };
    });
    
    // Sort and return top sources
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.source);
  }

  /**
   * Check if we have authentication for a source
   */
  private hasAuthentication(domain: string): boolean {
    // Check environment variables for auth tokens
    const authDomains = [
      'dn.no',
      'linkedin.com',
      'ft.com',
      'wsj.com'
    ];
    
    return authDomains.includes(domain) && 
           process.env[`AUTH_${domain.replace('.', '_').toUpperCase()}`] !== undefined;
  }

  /**
   * Calculate estimated cost
   */
  private calculateEstimatedCost(
    primary: SourceSelection[],
    secondary: SourceSelection[],
    international: SourceSelection[]
  ): number {
    let cost = 0;
    
    // Firecrawl costs (estimated)
    const firecrawlSources = [...primary, ...secondary, ...international].filter(s => 
      s.searchDepth === 'advanced'
    );
    cost += firecrawlSources.length * 0.05; // $0.05 per advanced search
    
    // Tavily costs (estimated)
    const tavilySources = [...primary, ...secondary].filter(s => 
      s.searchDepth === 'basic'
    );
    cost += tavilySources.length * 0.02; // $0.02 per basic search
    
    // API rate limit costs for premium sources
    const premiumSources = [...primary, ...secondary].filter(s => 
      'tier' in s.source && s.source.tier === 'premium'
    );
    cost += premiumSources.length * 0.03; // Premium source overhead
    
    return cost;
  }

  /**
   * Calculate estimated time
   */
  private calculateEstimatedTime(
    primary: SourceSelection[],
    secondary: SourceSelection[],
    international: SourceSelection[]
  ): number {
    const baseTime = 500; // Base overhead
    
    // Parallel search reduces time
    if (this.config.enableParallelSearch) {
      const maxGroupTime = Math.max(
        primary.length * 300,
        secondary.length * 250,
        international.length * 200
      );
      return baseTime + maxGroupTime;
    }
    
    // Sequential search
    const totalSources = primary.length + secondary.length + international.length;
    return baseTime + (totalSources * 250);
  }

  /**
   * Calculate cultural relevance score
   */
  private calculateCulturalRelevance(
    request: LanguageAwareContentRequest,
    primary: SourceSelection[],
    secondary: SourceSelection[]
  ): number {
    if (request.outputLanguage !== 'no') {
      return 0.5; // Neutral relevance for non-Norwegian content
    }
    
    let relevanceScore = 0;
    let totalWeight = 0;
    
    [...primary, ...secondary].forEach(selection => {
      if ('culturalAuthenticity' in selection.source) {
        const weight = selection.priority === 1 ? 2 : 1;
        relevanceScore += selection.source.culturalAuthenticity * weight;
        totalWeight += weight * 10; // Max score is 10
      }
    });
    
    return totalWeight > 0 ? relevanceScore / totalWeight : 0;
  }

  /**
   * Generate routing reasoning
   */
  private generateRoutingReasoning(
    request: LanguageAwareContentRequest,
    strategy: RoutingStrategy,
    primarySources: SourceSelection[]
  ): string[] {
    const reasons: string[] = [];
    
    // Strategy reasoning
    reasons.push(`Using ${strategy} strategy for ${request.outputLanguage} content`);
    
    // Language reasoning
    if (request.outputLanguage === 'no') {
      reasons.push('Prioritizing Norwegian sources for cultural authenticity');
    }
    
    // Topic reasoning
    if (this.hasSpecializedTopic(request)) {
      reasons.push('Specialized Norwegian industry focus detected');
    }
    
    // Source selection reasoning
    if (primarySources.length > 0) {
      const sourceNames = primarySources.map(s => s.source.name).join(', ');
      reasons.push(`Selected primary sources: ${sourceNames}`);
    }
    
    // Cultural context reasoning
    if (request.culturalContext) {
      reasons.push(`Adapting for ${request.culturalContext.market} market`);
    }
    
    return reasons;
  }

  /**
   * Optimize source selection for cost
   */
  public optimizeForCost(decision: SourceRoutingDecision): SourceRoutingDecision {
    // Remove sources that exceed budget
    if (decision.estimatedCost > this.config.costBudget) {
      // Keep only highest priority sources
      const optimized = {
        ...decision,
        primarySources: decision.primarySources.slice(0, 2),
        secondarySources: [],
        internationalSources: decision.internationalSources.slice(0, 1)
      };
      
      optimized.estimatedCost = this.calculateEstimatedCost(
        optimized.primarySources,
        optimized.secondarySources,
        optimized.internationalSources
      );
      
      optimized.reasoning.push('Optimized source selection for cost constraints');
      
      return optimized;
    }
    
    return decision;
  }

  /**
   * Get source groups for UI display
   */
  public getSourceGroups(): SourceGroup[] {
    return SOURCE_GROUPS;
  }

  /**
   * Validate source availability
   */
  public async validateSourceAvailability(sources: SourceSelection[]): Promise<SourceSelection[]> {
    // Filter out unavailable sources
    const available: SourceSelection[] = [];
    
    for (const selection of sources) {
      if ('domain' in selection.source) {
        // Check if source is accessible
        const isAvailable = await this.checkSourceHealth(selection.source.domain);
        if (isAvailable) {
          available.push(selection);
        }
      } else {
        // International sources assumed available
        available.push(selection);
      }
    }
    
    return available;
  }

  /**
   * Check source health
   */
  private async checkSourceHealth(domain: string): Promise<boolean> {
    // Simple health check - can be enhanced with actual HTTP checks
    const knownOfflineDomains: string[] = [];
    return !knownOfflineDomains.includes(domain);
  }
}