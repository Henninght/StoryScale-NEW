/**
 * Intelligent Gateway - Layer 1 of the 3-Layer Architecture
 * 
 * Responsibilities:
 * - Request classification and smart routing
 * - Multi-layer caching (L1/L2/L3)
 * - Cost optimization and tracking
 * - Authentication handling
 * - Performance monitoring
 * 
 * Target: <1s response for 50% of requests through intelligent caching
 */

import { MultiLayerCache } from '../cache/multi-layer-cache'
import { CostGuardian } from '../monitoring/cost-guardian'

export interface ContentRequest {
  // User requirements
  content: string
  purpose: 'thought-leadership' | 'question' | 'value' | 'authority'
  format: 'story' | 'insight' | 'list' | 'howto' | 'question'
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative'
  targetAudience: string
  
  // Optional enhancements
  enableResearch?: boolean
  urlReference?: string
  templateId?: string
  
  // Processing context
  userId: string
  sessionId: string
  preferences?: UserPreferences
  patterns?: UserPattern[]
}

export interface ContentResponse {
  content: {
    short: string
    medium: string
    long: string
    selected: string
  }
  sources?: ResearchSource[]
  citations?: Citation[]
  emoji?: string
  qualityScore: number
  metadata: {
    processingTime: number
    tokensUsed: number
    cacheHit: boolean
    provider: string
    confidence: number
  }
}

export interface RouteDecision {
  cached: boolean
  cachedResponse?: ContentResponse
  needsResearch: boolean
  complexity: 'simple' | 'medium' | 'complex'
  estimatedTokens: number
  recommendedProvider: 'openai' | 'anthropic'
  cacheStrategy: 'L1' | 'L2' | 'L3' | 'none'
}

export interface UserPreferences {
  preferredModel?: string
  defaultTone?: string
  defaultFormat?: string
}

export interface UserPattern {
  id: string
  type: string
  pattern: any
}

export interface ResearchSource {
  id: string
  title: string
  url: string
  author?: string
  date?: string
  type: string
  provider: string
  relevanceScore: number
  usedSnippets: string[]
}

export interface Citation {
  text: string
  position: number
  sourceId: string
}

export class IntelligentGateway {
  private cache: MultiLayerCache
  private costGuardian: CostGuardian
  private requestClassifier: RequestClassifier
  private router: SmartRouter
  
  constructor() {
    this.cache = new MultiLayerCache()
    this.costGuardian = new CostGuardian()
    this.requestClassifier = new RequestClassifier()
    this.router = new SmartRouter()
  }

  /**
   * Main entry point for all content generation requests
   */
  async processRequest(request: ContentRequest): Promise<ContentResponse> {
    const startTime = Date.now()
    
    try {
      // Step 1: Classify and route the request
      const route = await this.classifyAndRoute(request)
      
      // Step 2: Check cache first (performance optimization)
      if (route.cached && route.cachedResponse) {
        await this.costGuardian.recordCacheHit(request.userId)
        return {
          ...route.cachedResponse,
          metadata: {
            ...route.cachedResponse.metadata,
            processingTime: Date.now() - startTime,
            cacheHit: true
          }
        }
      }
      
      // Step 3: Route to processing functions
      const response = await this.router.routeToProcessing(request, route)
      
      // Step 4: Cache the response for future requests
      await this.cacheResponse(request, response, route.cacheStrategy)
      
      // Step 5: Record metrics
      await this.costGuardian.recordProcessing({
        userId: request.userId,
        tokensUsed: response.metadata.tokensUsed,
        processingTime: Date.now() - startTime,
        provider: response.metadata.provider
      })
      
      return {
        ...response,
        metadata: {
          ...response.metadata,
          processingTime: Date.now() - startTime,
          cacheHit: false
        }
      }
      
    } catch (error) {
      console.error('Gateway processing error:', error)
      throw new Error(`Gateway processing failed: ${error.message}`)
    }
  }

  /**
   * Classify request and determine optimal routing strategy
   */
  async classifyAndRoute(request: ContentRequest): Promise<RouteDecision> {
    // Generate cache key for this request
    const cacheKey = this.generateCacheKey(request)
    
    // Check multi-layer cache
    const cachedResponse = await this.cache.get(cacheKey)
    if (cachedResponse) {
      return {
        cached: true,
        cachedResponse,
        needsResearch: false,
        complexity: 'simple',
        estimatedTokens: 0,
        recommendedProvider: 'openai',
        cacheStrategy: 'L1'
      }
    }
    
    // Classify request complexity
    const complexity = this.requestClassifier.classifyComplexity(request)
    const needsResearch = request.enableResearch || !!request.urlReference
    const estimatedTokens = this.requestClassifier.estimateTokens(request, complexity)
    
    // Select optimal provider based on request characteristics
    const recommendedProvider = this.selectProvider(request, complexity)
    
    // Determine cache strategy
    const cacheStrategy = this.determineCacheStrategy(request, complexity)
    
    return {
      cached: false,
      needsResearch,
      complexity,
      estimatedTokens,
      recommendedProvider,
      cacheStrategy
    }
  }

  /**
   * Generate unique cache key for request
   */
  private generateCacheKey(request: ContentRequest): string {
    const keyComponents = [
      request.content.toLowerCase().replace(/\s+/g, '-'),
      request.purpose,
      request.format,
      request.tone,
      request.targetAudience.toLowerCase(),
      request.enableResearch ? 'research' : 'no-research',
      request.urlReference ? `url-${btoa(request.urlReference).slice(0, 10)}` : ''
    ].filter(Boolean)
    
    return `content:${keyComponents.join(':')}`
  }

  /**
   * Cache response according to strategy
   */
  private async cacheResponse(
    request: ContentRequest, 
    response: ContentResponse, 
    strategy: 'L1' | 'L2' | 'L3' | 'none'
  ): Promise<void> {
    if (strategy === 'none') return
    
    const cacheKey = this.generateCacheKey(request)
    
    // Determine TTL based on cache layer and content type
    const ttl = this.getCacheTTL(strategy, request)
    
    await this.cache.set(cacheKey, response, ttl, strategy)
  }

  /**
   * Get cache TTL based on strategy and content type
   */
  private getCacheTTL(strategy: 'L1' | 'L2' | 'L3', request: ContentRequest): number {
    const baseTTL = {
      L1: 5 * 60,      // 5 minutes
      L2: 24 * 60 * 60, // 24 hours  
      L3: 7 * 24 * 60 * 60 // 7 days
    }
    
    // Adjust TTL based on content characteristics
    let multiplier = 1
    if (request.enableResearch) multiplier = 0.5 // Research content changes more frequently
    if (request.templateId) multiplier = 2 // Template-based content is more stable
    
    return Math.floor(baseTTL[strategy] * multiplier)
  }

  /**
   * Select optimal AI provider based on request characteristics
   */
  private selectProvider(request: ContentRequest, complexity: 'simple' | 'medium' | 'complex'): 'openai' | 'anthropic' {
    // User preference takes priority
    if (request.preferences?.preferredModel?.includes('gpt')) return 'openai'
    if (request.preferences?.preferredModel?.includes('claude')) return 'anthropic'
    
    // Default selection based on complexity and purpose
    if (complexity === 'complex' || request.purpose === 'thought-leadership') {
      return 'openai' // GPT-4 for complex reasoning
    }
    
    if (request.format === 'story' || request.tone === 'casual') {
      return 'anthropic' // Claude for narrative and conversational content
    }
    
    return 'openai' // Default to OpenAI
  }

  /**
   * Determine optimal cache strategy
   */
  private determineCacheStrategy(request: ContentRequest, complexity: 'simple' | 'medium' | 'complex'): 'L1' | 'L2' | 'L3' | 'none' {
    // Research content - shorter cache duration
    if (request.enableResearch) return 'L2'
    
    // Template-based content - longer cache duration
    if (request.templateId) return 'L3'
    
    // User-specific patterns - medium cache duration
    if (request.patterns?.length > 0) return 'L2'
    
    // Simple requests - short cache duration
    if (complexity === 'simple') return 'L1'
    
    // Complex requests - medium cache duration
    return 'L2'
  }
}

/**
 * Request classifier to analyze complexity and requirements
 */
class RequestClassifier {
  classifyComplexity(request: ContentRequest): 'simple' | 'medium' | 'complex' {
    let score = 0
    
    // Content length
    if (request.content.length > 500) score += 2
    else if (request.content.length > 200) score += 1
    
    // Research requirement
    if (request.enableResearch) score += 2
    if (request.urlReference) score += 1
    
    // Advanced features
    if (request.templateId) score += 1
    if (request.patterns?.length > 0) score += 1
    if (request.purpose === 'thought-leadership') score += 2
    
    if (score >= 5) return 'complex'
    if (score >= 2) return 'medium'
    return 'simple'
  }

  estimateTokens(request: ContentRequest, complexity: 'simple' | 'medium' | 'complex'): number {
    const baseTokens = {
      simple: 300,
      medium: 600,
      complex: 1000
    }
    
    let tokens = baseTokens[complexity]
    
    // Add tokens for research
    if (request.enableResearch) tokens += 500
    
    // Add tokens for multiple variants
    tokens *= 3 // short, medium, long variants
    
    return tokens
  }
}

/**
 * Smart router to direct requests to appropriate processing functions
 */
class SmartRouter {
  private researchFunction: import('../functions/research-function').ResearchFunction
  private generateFunction: import('../functions/generate-function').GenerateFunction
  
  constructor() {
    this.initializeFunctions()
  }
  
  async routeToProcessing(request: ContentRequest, route: RouteDecision): Promise<ContentResponse> {
    const startTime = Date.now()
    
    try {
      // Step 1: Research phase (if needed)
      let researchResult
      if (route.needsResearch) {
        researchResult = await this.researchFunction.research(request)
      }
      
      // Step 2: Content generation with research integration
      const generateResult = await this.generateFunction.generate(request, researchResult)
      
      // Step 3: Quality validation (placeholder for now)
      const qualityScore = this.validateQuality(generateResult.content)
      
      // Step 4: Build final response
      return {
        content: generateResult.content,
        sources: researchResult?.sources || [],
        citations: [], // Will be populated by citation processing
        emoji: '💡', // Placeholder emoji
        qualityScore,
        metadata: {
          processingTime: Date.now() - startTime,
          tokensUsed: generateResult.tokensUsed + (researchResult?.tokensUsed || 0),
          cacheHit: false,
          provider: generateResult.metadata.provider,
          confidence: generateResult.confidence
        }
      }
      
    } catch (error) {
      throw new Error(`Processing pipeline failed: ${error.message}`)
    }
  }
  
  /**
   * Basic quality validation (to be enhanced in Phase 3)
   */
  private validateQuality(content: ContentVariants): number {
    let score = 0.7 // Base score
    
    // Check content length appropriateness
    if (content.short.length >= 300 && content.short.length <= 500) score += 0.1
    if (content.medium.length >= 800 && content.medium.length <= 1200) score += 0.1
    if (content.long.length >= 1500 && content.long.length <= 2500) score += 0.1
    
    return Math.min(score, 1.0)
  }
  
  private async initializeFunctions(): Promise<void> {
    const { ResearchFunction } = await import('../functions/research-function')
    const { GenerateFunction } = await import('../functions/generate-function')
    
    this.researchFunction = new ResearchFunction()
    this.generateFunction = new GenerateFunction()
  }
}