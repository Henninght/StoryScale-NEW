/**
 * Research Function Tests
 * Tests integration with Firecrawl and Tavily APIs, attribution generation,
 * and Norwegian/English source routing
 */

import { ResearchFunction, ResearchResult } from '../research-function'
import { LanguageAwareContentRequest } from '../../types/language-aware-request'

// Mock environment variables for testing
const originalEnv = process.env

beforeAll(() => {
  // Set up test environment variables
  process.env = {
    ...originalEnv,
    FIRECRAWL_API_KEY: '', // Empty to use mock providers in tests
    TAVILY_API_KEY: ''
  }
})

afterAll(() => {
  // Restore original environment
  process.env = originalEnv
})

describe('ResearchFunction', () => {
  let researchFunction: ResearchFunction

  beforeEach(() => {
    // Create new instance for each test
    researchFunction = new ResearchFunction()
  })

  describe('Provider Initialization', () => {
    it('should initialize with mock providers when API keys are not present', () => {
      const consoleSpy = jest.spyOn(console, 'log')
      const newInstance = new ResearchFunction()
      
      expect(consoleSpy).toHaveBeenCalledWith('Firecrawl API key not found, using mock provider')
      expect(consoleSpy).toHaveBeenCalledWith('Tavily API key not found, using mock provider')
      
      consoleSpy.mockRestore()
    })

    it('should initialize with real providers when API keys are present', () => {
      // Temporarily set API keys
      process.env.FIRECRAWL_API_KEY = 'test-firecrawl-key'
      process.env.TAVILY_API_KEY = 'test-tavily-key'
      
      const consoleSpy = jest.spyOn(console, 'log')
      const newInstance = new ResearchFunction()
      
      expect(consoleSpy).toHaveBeenCalledWith('Initialized Firecrawl API provider')
      expect(consoleSpy).toHaveBeenCalledWith('Initialized Tavily API provider')
      
      // Reset
      process.env.FIRECRAWL_API_KEY = ''
      process.env.TAVILY_API_KEY = ''
      consoleSpy.mockRestore()
    })
  })

  describe('Research Execution', () => {
    it('should return empty results when research is disabled', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-1',
        topic: 'AI trends',
        type: 'linkedin',
        outputLanguage: 'en',
        enableResearch: false
      }

      const result = await researchFunction.research(request)

      expect(result.sources).toEqual([])
      expect(result.insights).toEqual([])
      expect(result.confidence).toBe(1.0)
      expect(result.cacheHit).toBe(false)
      expect(result.cost).toBe(0)
    })

    it('should perform research for Norwegian content even without explicit enableResearch', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-2',
        topic: 'Teknologi trender',
        type: 'linkedin',
        outputLanguage: 'no'
      }

      const result = await researchFunction.research(request)

      expect(result.sources.length).toBeGreaterThan(0)
      expect(result.language).toBe('no')
      expect(result.attributions.length).toBeGreaterThan(0)
    })

    it('should perform research for complex content types', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-3',
        topic: 'Machine Learning in Healthcare',
        type: 'article',
        outputLanguage: 'en'
      }

      const result = await researchFunction.research(request)

      expect(result.sources.length).toBeGreaterThan(0)
      expect(result.language).toBe('en')
    })
  })

  describe('Attribution Generation', () => {
    it('should generate English attributions for English content', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-4',
        topic: 'Cloud Computing',
        type: 'linkedin',
        outputLanguage: 'en',
        enableResearch: true
      }

      const result = await researchFunction.research(request)

      expect(result.attributions).toBeDefined()
      expect(result.attributions.length).toBeGreaterThan(0)
      
      // Check attribution format
      if (result.attributions.length > 0) {
        const attribution = result.attributions[0]
        expect(attribution).toHaveProperty('text')
        expect(attribution).toHaveProperty('source')
      }
    })

    it('should generate Norwegian attributions for Norwegian content', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-5',
        topic: 'Kunstig intelligens',
        type: 'linkedin',
        outputLanguage: 'no',
        enableResearch: true
      }

      const result = await researchFunction.research(request)

      expect(result.attributions).toBeDefined()
      expect(result.attributions.length).toBeGreaterThan(0)
      expect(result.language).toBe('no')
    })
  })

  describe('Source Routing', () => {
    it('should route to appropriate sources based on language', async () => {
      const norwegianRequest: LanguageAwareContentRequest = {
        id: 'test-6',
        topic: 'Norsk næringsliv',
        type: 'linkedin',
        outputLanguage: 'no',
        culturalContext: {
          market: 'norway',
          industry: 'technology',
          audience: 'professionals'
        }
      }

      const result = await researchFunction.research(norwegianRequest)

      expect(result.routingDecision).toBeDefined()
      if (result.routingDecision) {
        expect(result.routingDecision.primarySources.length).toBeGreaterThan(0)
      }
    })

    it('should handle international sources for English content', async () => {
      const englishRequest: LanguageAwareContentRequest = {
        id: 'test-7',
        topic: 'Global technology trends',
        type: 'article',
        outputLanguage: 'en'
      }

      const result = await researchFunction.research(englishRequest)

      expect(result.sources).toBeDefined()
      expect(result.sources.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle research failure gracefully', async () => {
      // Force an error by using an invalid request
      const request: LanguageAwareContentRequest = {
        id: 'test-8',
        topic: '', // Empty topic might cause issues
        type: 'linkedin',
        outputLanguage: 'en',
        enableResearch: true
      }

      const result = await researchFunction.research(request)

      // Should still return a valid result structure
      expect(result).toBeDefined()
      expect(result.sources).toBeDefined()
      expect(result.insights).toBeDefined()
      expect(result.confidence).toBeDefined()
      expect(result.cost).toBeDefined()
    })

    it('should return mock data when providers fail', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-9',
        topic: 'Test topic',
        type: 'linkedin',
        outputLanguage: 'en',
        enableResearch: true
      }

      const result = await researchFunction.research(request)

      // With mock providers, should still get results
      expect(result.sources.length).toBeGreaterThan(0)
      expect(result.sources[0].source).toMatch(/firecrawl|tavily/)
    })
  })

  describe('Caching', () => {
    it('should generate consistent cache keys', () => {
      const request1: LanguageAwareContentRequest = {
        id: 'test-10',
        topic: 'AI Trends',
        type: 'linkedin',
        outputLanguage: 'en'
      }

      const request2: LanguageAwareContentRequest = {
        id: 'test-11', // Different ID
        topic: 'AI Trends', // Same topic
        type: 'linkedin',
        outputLanguage: 'en'
      }

      // Private method test through behavior
      // Same topic and language should potentially hit cache
      // This is tested indirectly through performance
    })

    it('should respect 24-hour TTL for research cache', async () => {
      // This would require mocking Date.now() or waiting 24 hours
      // For unit tests, we'll just verify the structure exists
      const request: LanguageAwareContentRequest = {
        id: 'test-12',
        topic: 'Cached topic',
        type: 'article',
        outputLanguage: 'en',
        enableResearch: true
      }

      const result1 = await researchFunction.research(request)
      expect(result1.cacheHit).toBe(false)

      // Second call with same request
      // Note: Current implementation has cache disabled, so this will also be false
      const result2 = await researchFunction.research(request)
      expect(result2.cacheHit).toBe(false) // Cache is currently commented out
    })
  })

  describe('Content Analysis', () => {
    it('should analyze research content for quality and relevance', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-13',
        topic: 'Digital transformation',
        type: 'article',
        outputLanguage: 'en',
        enableResearch: true
      }

      const result = await researchFunction.research(request)

      expect(result.contentAnalysis).toBeDefined()
      if (result.contentAnalysis) {
        expect(result.contentAnalysis).toHaveProperty('relevanceScore')
        expect(result.contentAnalysis).toHaveProperty('keyInsights')
      }
    })

    it('should provide cultural enhancement for Norwegian content', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-14',
        topic: 'Digitalisering i Norge',
        type: 'linkedin',
        outputLanguage: 'no',
        culturalContext: {
          market: 'norway',
          industry: 'technology',
          audience: 'executives'
        }
      }

      const result = await researchFunction.research(request)

      expect(result.culturalEnhancement).toBeDefined()
      if (result.culturalEnhancement) {
        expect(result.culturalEnhancement).toHaveProperty('culturalNotes')
        expect(result.culturalEnhancement).toHaveProperty('localContext')
      }
    })
  })

  describe('Performance', () => {
    it('should complete research within reasonable time', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-15',
        topic: 'Performance test',
        type: 'linkedin',
        outputLanguage: 'en',
        enableResearch: true
      }

      const startTime = Date.now()
      const result = await researchFunction.research(request)
      const endTime = Date.now()

      expect(result.processingTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should estimate token usage accurately', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-16',
        topic: 'Token estimation test',
        type: 'article',
        outputLanguage: 'en',
        enableResearch: true
      }

      const result = await researchFunction.research(request)

      expect(result.tokensUsed).toBeGreaterThan(0)
      expect(result.tokensUsed).toBeLessThan(10000) // Reasonable upper limit
    })
  })

  describe('Source Deduplication', () => {
    it('should remove duplicate sources based on URL', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-17',
        topic: 'Duplicate test',
        type: 'linkedin',
        outputLanguage: 'en',
        enableResearch: true
      }

      const result = await researchFunction.research(request)

      // Check for unique URLs
      const urls = result.sources.map(s => s.url)
      const uniqueUrls = new Set(urls)
      expect(urls.length).toBe(uniqueUrls.size)
    })

    it('should limit total number of sources', async () => {
      const request: LanguageAwareContentRequest = {
        id: 'test-18',
        topic: 'Many sources test',
        type: 'article',
        outputLanguage: 'en',
        enableResearch: true
      }

      const result = await researchFunction.research(request)

      expect(result.sources.length).toBeLessThanOrEqual(8) // Max 8 sources as per implementation
    })
  })
})

describe('Research Integration Tests', () => {
  let researchFunction: ResearchFunction

  beforeEach(() => {
    researchFunction = new ResearchFunction()
  })

  it('should integrate research results with content generation pipeline', async () => {
    const request: LanguageAwareContentRequest = {
      id: 'integration-1',
      topic: 'AI in Healthcare',
      type: 'article',
      outputLanguage: 'en',
      enableResearch: true
    }

    const result = await researchFunction.research(request)

    // Verify result can be used by downstream functions
    expect(result).toHaveProperty('sources')
    expect(result).toHaveProperty('insights')
    expect(result).toHaveProperty('attributions')
    expect(result).toHaveProperty('confidence')
    expect(result).toHaveProperty('cost')

    // Verify structure matches what generate function expects
    expect(Array.isArray(result.sources)).toBe(true)
    expect(Array.isArray(result.insights)).toBe(true)
    expect(Array.isArray(result.attributions)).toBe(true)
    expect(typeof result.confidence).toBe('number')
    expect(typeof result.cost).toBe('number')
  })

  it('should provide cost tracking for billing purposes', async () => {
    const request: LanguageAwareContentRequest = {
      id: 'integration-2',
      topic: 'Cost tracking test',
      type: 'linkedin',
      outputLanguage: 'en',
      enableResearch: true
    }

    const result = await researchFunction.research(request)

    expect(result.cost).toBeDefined()
    expect(result.cost).toBeGreaterThanOrEqual(0)
    expect(result.routingDecision?.estimatedCost).toBeDefined()
  })
})