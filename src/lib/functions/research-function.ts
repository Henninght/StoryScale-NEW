/**
 * Research Function - Smart research with 24h caching
 * 
 * Part of Layer 2: Processing Functions
 * 
 * Responsibilities:
 * - Gather relevant insights from external sources
 * - Integrate with Firecrawl and Tavily APIs  
 * - Intelligent caching (24h TTL, 25% hit rate target)
 * - Prepare attribution data for citations
 * - Handle research failures gracefully
 */

import { ContentRequest, ResearchSource } from '../gateway/intelligent-gateway'

export interface ResearchResult {
  sources: ResearchSource[]
  insights: string[]
  confidence: number
  processingTime: number
  tokensUsed: number
  cacheHit: boolean
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
  private cacheManager: ResearchCacheManager
  
  constructor() {
    this.initializeProviders()
    this.cacheManager = new ResearchCacheManager()
  }

  /**
   * Main research function - gather insights for content enrichment
   */
  async research(request: ContentRequest): Promise<ResearchResult> {
    const startTime = Date.now()
    
    // Skip research if not enabled
    if (!request.enableResearch) {
      return {
        sources: [],
        insights: [],
        confidence: 1.0,
        processingTime: 0,
        tokensUsed: 0,
        cacheHit: false
      }
    }

    try {
      // Check cache first (24h TTL for research results)
      const cacheKey = this.generateCacheKey(request.content, request.urlReference)
      const cachedResults = await this.cacheManager.get(cacheKey)
      
      if (cachedResults) {
        return {
          ...cachedResults,
          processingTime: Date.now() - startTime,
          cacheHit: true
        }
      }

      // Gather research from multiple providers in parallel
      const [firecrawlResults, tavilyResults] = await Promise.allSettled([
        this.gatherFirecrawlInsights(request),
        this.gatherTavilyInsights(request)
      ])

      // Process and combine results
      const sources = this.processResearchResults(firecrawlResults, tavilyResults)
      const insights = await this.synthesizeInsights(sources, request.content)
      const confidence = this.calculateConfidence(sources)

      const result: ResearchResult = {
        sources,
        insights,
        confidence,
        processingTime: Date.now() - startTime,
        tokensUsed: insights.length * 10, // Rough estimate
        cacheHit: false
      }

      // Cache results for 24 hours
      await this.cacheManager.set(cacheKey, result, 24 * 60 * 60)

      return result

    } catch (error) {
      // Research failure should not block content generation
      console.warn('Research failed:', error.message)
      
      return {
        sources: [],
        insights: [`Research temporarily unavailable: ${error.message}`],
        confidence: 0.5,
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        cacheHit: false
      }
    }
  }

  /**
   * Gather insights from Firecrawl (web scraping and search)
   */
  private async gatherFirecrawlInsights(request: ContentRequest): Promise<ResearchSource[]> {
    if (!this.firecrawlProvider) {
      throw new Error('Firecrawl provider not available')
    }

    if (request.urlReference) {
      // Scrape specific URL
      const scraped = await this.firecrawlProvider.scrape(request.urlReference)
      return [{
        id: this.generateId(),
        title: scraped.title,
        url: request.urlReference,
        author: scraped.author,
        date: scraped.date,
        type: 'article',
        provider: 'firecrawl',
        relevanceScore: 1.0, // User-provided URL is highly relevant
        usedSnippets: []
      }]
    } else {
      // Search for relevant content
      const searchResults = await this.firecrawlProvider.search({
        query: request.content,
        limit: 3,
        includeLinkedIn: true
      })
      
      return searchResults.map(result => ({
        id: this.generateId(),
        title: result.title,
        url: result.url,
        author: result.author,
        date: result.date,
        type: this.classifySourceType(result.url),
        provider: 'firecrawl',
        relevanceScore: result.relevanceScore,
        usedSnippets: []
      }))
    }
  }

  /**
   * Gather insights from Tavily (search engine for AI)
   */
  private async gatherTavilyInsights(request: ContentRequest): Promise<ResearchSource[]> {
    if (!this.tavilyProvider) {
      throw new Error('Tavily provider not available')
    }

    const searchResults = await this.tavilyProvider.search({
      query: request.content,
      search_depth: 'basic',
      max_results: 5,
      include_domains: ['techcrunch.com', 'medium.com', 'linkedin.com'],
      exclude_domains: ['wikipedia.org'] // Exclude generic sources
    })
    
    return searchResults.map(result => ({
      id: this.generateId(),
      title: result.title,
      url: result.url,
      author: result.author,
      date: result.published_date,
      type: this.classifySourceType(result.url),
      provider: 'tavily',
      relevanceScore: result.score || 0.5,
      usedSnippets: []
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
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
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
    const articleSources = sources.filter(s => s.type === 'article')
    const socialSources = sources.filter(s => s.type === 'social')
    
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
      if (source.type === 'article') weight = 1.5
      if (source.author) weight += 0.5
      if (source.date) weight += 0.3
      
      totalScore += source.relevanceScore * weight
      weightedSources += weight
    }
    
    return Math.min(totalScore / weightedSources, 1.0)
  }

  /**
   * Generate cache key for research request
   */
  private generateCacheKey(content: string, urlReference?: string): string {
    const contentHash = content.toLowerCase().replace(/\s+/g, '-').slice(0, 50)
    const urlHash = urlReference ? btoa(urlReference).slice(0, 10) : 'no-url'
    return `research:${contentHash}:${urlHash}`
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
      this.firecrawlProvider = new MockFirecrawlProvider() // Replace with real implementation
      this.tavilyProvider = new MockTavilyProvider() // Replace with real implementation
    } catch (error) {
      console.warn('Failed to initialize research providers:', error)
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
 * Mock Firecrawl provider for development
 * Replace with actual Firecrawl implementation
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
 * Replace with actual Tavily implementation
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