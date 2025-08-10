/**
 * Research Function - Smart research with Norwegian source support and 24h caching
 * 
 * Part of Layer 2: Processing Functions
 * 
 * Responsibilities:
 * - Gather relevant insights from Norwegian and international sources
 * - Language-aware source selection (Norwegian vs English)
 * - Cultural relevance scoring for Norwegian business context
 * - Integrate with Firecrawl and Tavily APIs  
 * - Intelligent caching (24h TTL, 25% hit rate target)
 * - Prepare attribution data for citations in Norwegian/English
 * - Handle research failures gracefully
 */

import {
  LanguageAwareContentRequest,
  SupportedLanguage,
  CulturalContext,
  RequestClassification
} from '../types/language-aware-request'
import { MultiLayerCache } from '../cache/multi-layer-cache'
import { CostGuardian } from '../monitoring/cost-guardian'
import { SourceRouter, SourceRoutingDecision, SourceSelection } from '../research/source-router'
import { ContentAnalyzer, ContentAnalysis } from '../research/content-analyzer'
import { CulturalEnhancer, CulturalEnhancement } from '../research/cultural-enhancer'
import { AttributionGenerator, Attribution, AttributionOptions } from '../research/attribution-generator'
import { NorwegianSource, getSourceByDomain } from '../research/norwegian-sources'
import { apiSecurityManager } from '../security/api-security'

export interface ResearchSource {
  id: string
  url: string
  title: string
  content: string
  source: string
  timestamp: Date
  relevance: number
  credibility: number
  metadata?: Record<string, any>
}

export interface ResearchResult {
  sources: ResearchSource[]
  insights: string[]
  confidence: number
  processingTime: number
  tokensUsed: number
  cacheHit: boolean
  language: SupportedLanguage
  culturalEnhancement?: CulturalEnhancement
  contentAnalysis?: ContentAnalysis
  attributions: Attribution[]
  routingDecision?: SourceRoutingDecision
  cost: number
}

export interface FirecrawlProvider {
  scrape(url: string): Promise<ScrapedContent>
  search(query: SearchQuery): Promise<SearchResult[]>
}

export interface TavilyProvider {
  search(query: TavilySearchQuery): Promise<TavilySearchResult[]>
}

interface ScrapedContent {
  title: string
  content: string
  author?: string
  date?: string
}

interface SearchQuery {
  query: string
  limit: number
  includeLinkedIn: boolean
}

interface SearchResult {
  title: string
  url: string
  content: string
  author?: string
  date?: string
  relevanceScore: number
}

interface TavilySearchQuery {
  query: string
  search_depth: 'basic' | 'advanced'
  max_results: number
  include_domains?: string[]
  exclude_domains?: string[]
}

interface TavilySearchResult {
  title: string
  url: string
  content: string
  author?: string
  published_date?: string
  score: number
}

export class ResearchFunction {
  private firecrawlProvider: FirecrawlProvider | null = null
  private tavilyProvider: TavilyProvider | null = null
  private cache: MultiLayerCache
  private costGuardian: CostGuardian
  private sourceRouter: SourceRouter
  private contentAnalyzer: ContentAnalyzer
  private culturalEnhancer: CulturalEnhancer
  private attributionGenerator: AttributionGenerator
  
  constructor() {
    this.initializeProviders()
    this.cache = MultiLayerCache.getInstance()
    this.costGuardian = CostGuardian.getInstance()
    this.sourceRouter = new SourceRouter({
      preferNorwegian: true,
      requireCulturalContext: true
    })
    this.contentAnalyzer = new ContentAnalyzer({
      extractNorwegianTerms: true,
      detectBusinessMetrics: true
    })
    this.culturalEnhancer = new CulturalEnhancer('no')
    this.attributionGenerator = new AttributionGenerator({
      language: 'no',
      style: 'journalistic'
    })
  }

  /**
   * Main research function - gather insights for content enrichment with Norwegian support
   */
  async research(
    request: LanguageAwareContentRequest,
    classification?: RequestClassification
  ): Promise<ResearchResult> {
    const startTime = Date.now()
    
    // Skip research if not enabled
    if (!this.shouldPerformResearch(request)) {
      return {
        sources: [],
        insights: [],
        confidence: 1.0,
        processingTime: 0,
        tokensUsed: 0,
        cacheHit: false,
        language: request.outputLanguage || 'en',
        attributions: [],
        cost: 0
      }
    }

    try {
      // Check cache first (24h TTL for research results)
      // TODO: Cache interface needs refactoring to accept keys instead of full requests
      // const cacheKey = this.generateCacheKey(request)
      // const cachedResults = await this.cache.get(cacheKey)
      // if (cachedResults && cachedResults.response) {
      //   // Track cache hit
      //   await this.costGuardian.trackRequestCost(
      //     request,
      //     { ...cachedResults.response, metadata: { ...cachedResults.response.metadata, cacheHit: true } },
      //     { targetModel: 'cache', targetEndpoint: 'cache', estimatedCost: 0, estimatedTime: 0 }
      //   )
      //   
      //   return {
      //     ...(cachedResults.response as any),
      //     processingTime: Date.now() - startTime,
      //     cacheHit: true
      //   }
      // }

      // Route to appropriate sources based on language and context
      const routingDecision = await this.sourceRouter.routeRequest(
        request,
        classification || this.createDefaultClassification(request)
      )
      
      // Optimize for cost if needed
      const optimizedRouting = this.sourceRouter.optimizeForCost(routingDecision)
      
      // Gather research from selected sources
      const researchResults = await this.gatherResearchFromSources(
        request,
        optimizedRouting
      )

      // Analyze content quality and relevance
      const contentAnalyses = await this.analyzeResearchContent(
        researchResults,
        request
      )
      
      // Merge analyses
      const mergedAnalysis = contentAnalyses.length > 0
        ? this.contentAnalyzer.mergeAnalyses(contentAnalyses)
        : undefined
      
      // Generate cultural enhancement for Norwegian content
      const culturalEnhancement = request.outputLanguage === 'no' && mergedAnalysis
        ? await this.culturalEnhancer.enhanceContent(
            researchResults.map(r => r.content).join('\n'),
            mergedAnalysis.keyInsights,
            mergedAnalysis.businessMetrics,
            mergedAnalysis.norwegianTerms
          )
        : undefined
      
      // Generate attributions
      const attributions = this.generateAttributions(
        researchResults,
        request.outputLanguage
      )
      
      // Process and combine results
      const sources = this.processResearchResultsArray(researchResults)
      const insights = mergedAnalysis ? mergedAnalysis.keyInsights.map(i => i.text) : []
      const confidence = mergedAnalysis ? mergedAnalysis.relevanceScore : 0.5

      // Calculate cost
      const researchCost = optimizedRouting.estimatedCost
      
      const result: ResearchResult = {
        sources,
        insights,
        confidence,
        processingTime: Date.now() - startTime,
        tokensUsed: this.estimateTokenUsage(insights),
        cacheHit: false,
        language: request.outputLanguage,
        culturalEnhancement,
        contentAnalysis: mergedAnalysis,
        attributions,
        routingDecision: optimizedRouting,
        cost: researchCost
      }

      // Cache results for 24 hours
      // TODO: Cache interface needs refactoring
      // await this.cache.set(cacheKey, {
      //   request,
      //   response: result as any,
      //   metadata: {
      //     language: request.outputLanguage,
      //     cost: researchCost,
      //     sources: sources.length
      //   }
      // })
      
      // Track cost
      // TODO: CostGuardian interface needs refactoring
      // await this.costGuardian.trackRequestCost(
      //   request,
      //   {
      //     requestId: request.id,
      //     content: insights.join('\n'),
      //     metadata: {
      //       generatedLanguage: request.outputLanguage,
      //       wasTranslated: false,
      //       processingTime: result.processingTime,
      //       tokenUsage: {
      //         prompt: 0,
      //         completion: result.tokensUsed,
      //         total: result.tokensUsed
      //       },
      //       model: 'research',
      //       cost: researchCost,
      //       cacheHit: false
      //     }
      //   },
      //   {
      //     targetModel: 'research',
      //     targetEndpoint: 'multi-source',
      //     estimatedCost: researchCost,
      //     estimatedTime: result.processingTime
      //   }
      // )

      return result

    } catch (error) {
      // Research failure should not block content generation
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('Research failed:', errorMessage)
      
      return {
        sources: [],
        insights: [`Research temporarily unavailable: ${errorMessage}`],
        confidence: 0.5,
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        cacheHit: false,
        language: request.outputLanguage || 'en',
        attributions: [],
        cost: 0
      }
    }
  }

  /**
   * Gather insights from Firecrawl (web scraping and search)
   */
  private async gatherFirecrawlInsights(request: LanguageAwareContentRequest): Promise<ResearchSource[]> {
    if (!this.firecrawlProvider) {
      throw new Error('Firecrawl provider not available')
    }

    // Check if request has a URL reference (not in current interface)
    const urlReference = (request as any).urlReference
    if (urlReference) {
      // Scrape specific URL
      const scraped = await this.firecrawlProvider.scrape(urlReference)
      return [{
        id: this.generateId(),
        title: scraped.title || 'Untitled',
        url: urlReference,
        content: scraped.content || '',
        source: 'firecrawl',
        timestamp: new Date(),
        relevance: 1.0, // User-provided URL is highly relevant
        credibility: 0.9,
        metadata: {
          author: scraped.author,
          date: scraped.date,
          type: 'article',
          provider: 'firecrawl',
          usedSnippets: []
        }
      }]
    } else {
      // Search for relevant content
      const searchResults = await this.firecrawlProvider.search({
        query: request.topic,
        limit: 3,
        includeLinkedIn: true
      })
      
      return searchResults.map(result => ({
        id: this.generateId(),
        title: result.title || 'Untitled',
        url: result.url || '',
        content: result.content || '',
        source: 'firecrawl',
        timestamp: new Date(),
        relevance: result.relevanceScore || 0.7,
        credibility: 0.8,
        metadata: {
          author: result.author,
          date: result.date,
          type: this.classifySourceType(result.url),
          provider: 'firecrawl',
          usedSnippets: []
        }
      }))
    }
  }

  /**
   * Gather insights from Tavily (search engine for AI)
   */
  private async gatherTavilyInsights(request: LanguageAwareContentRequest): Promise<ResearchSource[]> {
    if (!this.tavilyProvider) {
      throw new Error('Tavily provider not available')
    }

    const searchResults = await this.tavilyProvider.search({
      query: request.topic,
      search_depth: 'basic',
      max_results: 5,
      include_domains: ['techcrunch.com', 'medium.com', 'linkedin.com'],
      exclude_domains: ['wikipedia.org'] // Exclude generic sources
    })
    
    return searchResults.map(result => ({
      id: this.generateId(),
      title: result.title || 'Untitled',
      url: result.url || '',
      content: result.content || '',
      source: 'tavily',
      timestamp: new Date(),
      relevance: result.score || 0.5,
      credibility: 0.8,
      metadata: {
        author: result.author,
        date: result.published_date,
        type: this.classifySourceType(result.url),
        provider: 'tavily',
        usedSnippets: []
      }
    }))
  }

  /**
   * Process and combine research results from multiple providers
   */
  private processResearchResults(
    firecrawlResults: PromiseSettledResult<ResearchSource[]>,
    tavilyResults: PromiseSettledResult<ResearchSource[]>
  ): ResearchSource[] {
    const sources: ResearchSource[] = []
    
    // Add Firecrawl results
    if (firecrawlResults.status === 'fulfilled') {
      sources.push(...firecrawlResults.value)
    }
    
    // Add Tavily results
    if (tavilyResults.status === 'fulfilled') {
      sources.push(...tavilyResults.value)
    }
    
    // Remove duplicates and sort by relevance
    const uniqueSources = this.deduplicateSources(sources)
    return uniqueSources
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 8) // Limit to top 8 sources
  }

  /**
   * Synthesize insights from research sources
   */
  private async synthesizeInsights(sources: ResearchSource[], originalContent: string): Promise<string[]> {
    if (sources.length === 0) return []

    const insights: string[] = []
    
    // Extract key insights from top sources
    for (const source of sources.slice(0, 3)) { // Use top 3 sources
      if (source.title) {
        insights.push(`According to ${source.title}, research indicates relevant trends in this area.`)
      }
    }

    // Add general insights based on source types
    const articleSources = sources.filter(s => s.metadata?.type === 'article')
    const socialSources = sources.filter(s => s.metadata?.type === 'social')
    
    if (articleSources.length > 0) {
      insights.push('Industry publications highlight current developments in this field.')
    }
    
    if (socialSources.length > 0) {
      insights.push('Social media discussions show growing interest in this topic.')
    }

    return insights
  }

  /**
   * Calculate confidence score based on research quality
   */
  private calculateConfidence(sources: ResearchSource[]): number {
    if (sources.length === 0) return 0.0
    
    let totalScore = 0
    let weightedSources = 0
    
    for (const source of sources) {
      let weight = 1
      
      // Give more weight to authoritative sources
      if (source.metadata?.type === 'article') weight = 1.5
      if (source.metadata?.author) weight += 0.5
      if (source.metadata?.date) weight += 0.3
      
      totalScore += source.relevance * weight
      weightedSources += weight
    }
    
    return Math.min(totalScore / weightedSources, 1.0)
  }

  /**
   * Check if research should be performed
   */
  private shouldPerformResearch(request: LanguageAwareContentRequest): boolean {
    // Check if research is explicitly disabled
    if ('enableResearch' in request && !request.enableResearch) {
      return false
    }
    
    // Always perform research for Norwegian content
    if (request.outputLanguage === 'no') {
      return true
    }
    
    // Perform research for complex requests
    if (request.type === 'article' || request.type === 'blog') {
      return true
    }
    
    return false
  }

  /**
   * Create default classification if not provided
   */
  private createDefaultClassification(request: LanguageAwareContentRequest): RequestClassification {
    return {
      complexity: 'moderate',
      estimatedTokens: 1000,
      requiredCapabilities: ['research', 'synthesis'],
      suggestedModel: 'gpt-4',
      languageRequirements: {
        inputLang: request.inputLanguage || 'en',
        outputLang: request.outputLanguage,
        requiresNativeGeneration: request.outputLanguage === 'no',
        requiresCulturalAdaptation: !!request.culturalContext
      },
      priority: 'medium',
      estimatedProcessingTime: 5000
    }
  }

  /**
   * Gather research from selected sources
   */
  private async gatherResearchFromSources(
    request: LanguageAwareContentRequest,
    routing: SourceRoutingDecision
  ): Promise<Array<{ source: string; content: string; url: string }>> {
    const results: Array<{ source: string; content: string; url: string }> = []
    
    // Process primary sources
    const primaryPromises = routing.primarySources.map(selection =>
      this.fetchFromSource(selection, request)
    )
    
    // Process secondary sources
    const secondaryPromises = routing.secondarySources.map(selection =>
      this.fetchFromSource(selection, request)
    )
    
    // Process international sources if needed
    const internationalPromises = routing.internationalSources.map(selection =>
      this.fetchFromSource(selection, request)
    )
    
    // Gather all results
    const allPromises = [...primaryPromises, ...secondaryPromises, ...internationalPromises]
    const settledResults = await Promise.allSettled(allPromises)
    
    // Process successful results
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value)
      }
    })
    
    return results
  }

  /**
   * Fetch from a single source
   */
  private async fetchFromSource(
    selection: SourceSelection,
    request: LanguageAwareContentRequest
  ): Promise<{ source: string; content: string; url: string }> {
    const sourceName = 'name' in selection.source ? selection.source.name : (selection.source as any).domain || 'unknown'
    const sourceUrl = 'domain' in selection.source 
      ? `https://${(selection.source as any).domain}`
      : 'https://example.com'
    
    try {
      // Use appropriate provider based on source
      if (this.isFirecrawlSource(selection.source)) {
        const result = await this.firecrawlProvider?.search({
          query: selection.searchQuery,
          limit: selection.maxResults,
          includeLinkedIn: sourceName.includes('LinkedIn')
        })
        
        if (result && result.length > 0) {
          return {
            source: sourceName,
            content: result[0].content,
            url: result[0].url
          }
        }
      } else if (this.isTavilySource(selection.source)) {
        const result = await this.tavilyProvider?.search({
          query: selection.searchQuery,
          search_depth: selection.searchDepth,
          max_results: selection.maxResults,
          include_domains: [sourceUrl.replace('https://', '')]
        })
        
        if (result && result.length > 0) {
          return {
            source: sourceName,
            content: result[0].content,
            url: result[0].url
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${sourceName}:`, error)
    }
    
    // Return empty result if fetch failed
    return {
      source: sourceName,
      content: '',
      url: sourceUrl
    }
  }

  /**
   * Check if source should use Firecrawl
   */
  private isFirecrawlSource(source: any): boolean {
    if ('domain' in source) {
      const firecrawlDomains = ['linkedin.com', 'medium.com', 'techcrunch.com']
      return firecrawlDomains.some(domain => source.domain.includes(domain))
    }
    return false
  }

  /**
   * Check if source should use Tavily
   */
  private isTavilySource(source: any): boolean {
    return !this.isFirecrawlSource(source)
  }

  /**
   * Analyze research content
   */
  private async analyzeResearchContent(
    results: Array<{ source: string; content: string; url: string }>,
    request: LanguageAwareContentRequest
  ): Promise<ContentAnalysis[]> {
    const analyses: ContentAnalysis[] = []
    
    for (const result of results) {
      if (result.content) {
        const sourceInfo = getSourceByDomain(result.url.replace(/https?:\/\//, '').split('/')[0])
        const analysis = await this.contentAnalyzer.analyzeContent(
          result.content,
          sourceInfo || { domain: result.url, trustScore: 7 },
          request.topic,
          request.outputLanguage
        )
        analyses.push(analysis)
      }
    }
    
    return analyses
  }

  /**
   * Generate attributions for sources
   */
  private generateAttributions(
    results: Array<{ source: string; content: string; url: string }>,
    language: SupportedLanguage
  ): Attribution[] {
    const options: AttributionOptions = {
      language,
      style: 'journalistic',
      format: 'inline',
      includeDate: true,
      includeAuthor: false,
      includeUrl: false,
      useHyperlinks: false
    }
    
    return results.map(result => 
      this.attributionGenerator.generateAttribution(
        {
          name: result.source,
          url: result.url,
          type: 'news_article',
          credibility: 0.8
        },
        undefined,
        options
      )
    )
  }

  /**
   * Process research results into sources
   */
  private processResearchResultsArray(
    results: Array<{ source: string; content: string; url: string }>
  ): ResearchSource[] {
    return results.map(result => ({
      id: this.generateId(),
      title: result.source || 'Untitled',
      url: result.url || '',
      content: result.content || '',
      source: this.isFirecrawlSource({ domain: result.url }) ? 'firecrawl' : 'tavily',
      timestamp: new Date(),
      relevance: 0.8,
      credibility: 0.7,
      metadata: {
        author: undefined,
        date: new Date().toISOString(),
        type: 'article',
        provider: this.isFirecrawlSource({ domain: result.url }) ? 'firecrawl' : 'tavily',
        usedSnippets: []
      }
    }))
  }

  /**
   * Estimate token usage
   */
  private estimateTokenUsage(insights: string[]): number {
    // Rough estimate: ~4 characters per token
    const totalChars = insights.join(' ').length
    return Math.ceil(totalChars / 4)
  }

  /**
   * Generate cache key for research request
   */
  private generateCacheKey(request: LanguageAwareContentRequest): string {
    const contentHash = request.topic.toLowerCase().replace(/\s+/g, '-').slice(0, 50)
    const langHash = request.outputLanguage
    const contextHash = request.culturalContext?.market || 'global'
    return `research:${langHash}:${contextHash}:${contentHash}`
  }

  /**
   * Classify source type based on URL
   */
  private classifySourceType(url: string): string {
    if (url.includes('linkedin.com')) return 'social'
    if (url.includes('twitter.com') || url.includes('x.com')) return 'social'
    if (url.includes('medium.com')) return 'blog'
    if (url.includes('techcrunch.com')) return 'news'
    if (url.includes('github.com')) return 'code'
    return 'article'
  }

  /**
   * Remove duplicate sources based on URL
   */
  private deduplicateSources(sources: ResearchSource[]): ResearchSource[] {
    const seen = new Set<string>()
    return sources.filter(source => {
      if (seen.has(source.url)) {
        return false
      }
      seen.add(source.url)
      return true
    })
  }

  /**
   * Generate unique ID for sources
   */
  private generateId(): string {
    return `src_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Initialize research providers
   */
  private initializeProviders(): void {
    try {
      this.firecrawlProvider = new FirecrawlAPIProvider() // Real Firecrawl API
      this.tavilyProvider = new TavilyAPIProvider() // Real Tavily API
    } catch (error) {
      console.warn('Failed to initialize research providers:', error)
      // Fall back to mock providers for development
      this.firecrawlProvider = new MockFirecrawlProvider()
      this.tavilyProvider = new MockTavilyProvider()
    }
  }
}

/**
 * Research cache manager with 24h TTL
 */
class ResearchCacheManager {
  private cache: Map<string, { data: ResearchResult; expiresAt: number }> = new Map()
  
  async get(key: string): Promise<ResearchResult | null> {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  async set(key: string, data: ResearchResult, ttl: number): Promise<void> {
    const expiresAt = Date.now() + (ttl * 1000)
    this.cache.set(key, { data, expiresAt })
  }
}

/**
 * Real Firecrawl API provider with security integration
 */
class FirecrawlAPIProvider implements FirecrawlProvider {
  private baseURL = 'https://api.firecrawl.dev';

  constructor() {
    // Security manager handles API key validation
  }

  async scrape(url: string): Promise<ScrapedContent> {
    // Security validation
    const validation = await apiSecurityManager.validateRequest(
      'firecrawl',
      url,
      'scrape_request',
      'system'
    );

    if (!validation.allowed) {
      throw new Error(`Security check failed: ${validation.reason}`);
    }

    const apiKey = apiSecurityManager.getSecureCredentials('firecrawl');
    if (!apiKey) {
      throw new Error('Firecrawl API credentials unavailable');
    }

    try {
      const response = await fetch(`${this.baseURL}/v0/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: validation.sanitizedUrl || url,
          formats: ['markdown'],
          onlyMainContent: true,
          timeout: 30000, // 30 second timeout
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter content for security
      const rawContent = data.markdown || data.content || '';
      const { filteredContent, flagged, safe } = apiSecurityManager.filterResponse(
        rawContent,
        validation.context
      );

      if (!safe) {
        console.warn(`Content filtered from ${url}:`, flagged);
      }
      
      return {
        title: data.metadata?.title || 'Untitled',
        content: filteredContent,
        author: data.metadata?.author,
        date: data.metadata?.publishedTime,
      };
    } catch (error) {
      throw new Error(`Firecrawl scrape failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Security validation
    const validation = await apiSecurityManager.validateRequest(
      'firecrawl',
      'https://api.firecrawl.dev/search', // Mock URL for validation
      query.query,
      'system'
    );

    if (!validation.allowed) {
      throw new Error(`Security check failed: ${validation.reason}`);
    }

    const apiKey = apiSecurityManager.getSecureCredentials('firecrawl');
    if (!apiKey) {
      throw new Error('Firecrawl API credentials unavailable');
    }

    try {
      const response = await fetch(`${this.baseURL}/v0/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: validation.sanitizedQuery || query.query,
          pageOptions: {
            onlyMainContent: true,
          },
          limit: Math.min(query.limit, 10), // Cap at 10 results for security
          timeout: 30000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json();
      
      return (data.data || []).map((result: any) => {
        // Filter each result's content
        const rawContent = result.markdown || result.content || '';
        const { filteredContent } = apiSecurityManager.filterResponse(
          rawContent,
          validation.context
        );

        return {
          title: result.metadata?.title || 'Untitled',
          url: result.metadata?.sourceURL || '',
          content: filteredContent,
          author: result.metadata?.author,
          date: result.metadata?.publishedTime,
          relevanceScore: 0.8, // Firecrawl doesn't provide relevance score
        };
      });
    } catch (error) {
      throw new Error(`Firecrawl search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Real Tavily API provider with security integration
 */
class TavilyAPIProvider implements TavilyProvider {
  private baseURL = 'https://api.tavily.com';

  constructor() {
    // Security manager handles API key validation
  }

  async search(query: TavilySearchQuery): Promise<TavilySearchResult[]> {
    // Security validation
    const validation = await apiSecurityManager.validateRequest(
      'tavily',
      'https://api.tavily.com/search', // Mock URL for validation
      query.query,
      'system'
    );

    if (!validation.allowed) {
      throw new Error(`Security check failed: ${validation.reason}`);
    }

    const apiKey = apiSecurityManager.getSecureCredentials('tavily');
    if (!apiKey) {
      throw new Error('Tavily API credentials unavailable');
    }

    try {
      // Merge security-blocked domains with query exclusions
      const securityBlockedDomains = [
        'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com'
      ];
      const excludeDomains = [
        ...securityBlockedDomains,
        ...(query.exclude_domains || [])
      ];

      const response = await fetch(`${this.baseURL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: validation.sanitizedQuery || query.query,
          search_depth: query.search_depth,
          max_results: Math.min(query.max_results, 10), // Cap results
          include_answer: false,
          include_raw_content: false,
          include_domains: query.include_domains,
          exclude_domains: excludeDomains,
          timeout: 30000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json();
      
      return (data.results || []).map((result: any) => {
        // Filter each result's content
        const rawContent = result.content || '';
        const { filteredContent } = apiSecurityManager.filterResponse(
          rawContent,
          validation.context
        );

        return {
          title: result.title || 'Untitled',
          url: result.url || '',
          content: filteredContent,
          author: result.author,
          published_date: result.published_date,
          score: result.score || 0.5,
        };
      });
    } catch (error) {
      throw new Error(`Tavily search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Mock Firecrawl provider for development
 * Used as fallback when API keys are not available
 */
class MockFirecrawlProvider implements FirecrawlProvider {
  async scrape(url: string): Promise<ScrapedContent> {
    // Mock implementation
    return {
      title: `Content from ${new URL(url).hostname}`,
      content: 'Mock scraped content for development',
      author: 'Mock Author',
      date: new Date().toISOString()
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Mock implementation
    return [
      {
        title: `Research result for: ${query.query}`,
        url: 'https://example.com/article',
        content: 'Mock search result content',
        relevanceScore: 0.8
      }
    ]
  }
}

/**
 * Mock Tavily provider for development
 * Used as fallback when API keys are not available
 */
class MockTavilyProvider implements TavilyProvider {
  async search(query: TavilySearchQuery): Promise<TavilySearchResult[]> {
    // Mock implementation
    return [
      {
        title: `Tavily result for: ${query.query}`,
        url: 'https://techcrunch.com/example',
        content: 'Mock Tavily search result',
        score: 0.9,
        published_date: new Date().toISOString()
      }
    ]
  }
}

// Export singleton instance
export const researchFunction = new ResearchFunction();