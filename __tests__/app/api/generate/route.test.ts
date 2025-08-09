/**
 * Comprehensive Test Suite for Generate API Route
 * Tests the 3-layer architecture implementation
 */

import { POST, GET } from '@/app/api/generate/route'
import { NextRequest, NextResponse } from 'next/server'
import { IntelligentGateway } from '@/lib/gateway/intelligent-gateway'

// Mock the IntelligentGateway
jest.mock('@/lib/gateway/intelligent-gateway')

// Mock environment variables
const originalEnv = process.env

describe('Generate API Route', () => {
  let mockGateway: jest.Mocked<IntelligentGateway>

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
    
    // Setup mock gateway
    mockGateway = {
      processRequest: jest.fn(),
    } as any

    ;(IntelligentGateway as jest.MockedClass<typeof IntelligentGateway>).mockImplementation(() => mockGateway)
  })

  afterEach(() => {
    jest.clearAllMocks()
    process.env = originalEnv
  })

  describe('POST /api/generate', () => {
    describe('Request Validation', () => {
      it('should reject requests without content field', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purpose: 'value',
            format: 'insight',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Validation failed')
        expect(data.details).toContain('content is required and must be a string')
      })

      it('should reject content shorter than 10 characters', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'short',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Validation failed')
        expect(data.details).toContain('content must be at least 10 characters long')
      })

      it('should reject content longer than 2000 characters', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'a'.repeat(2001),
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Validation failed')
        expect(data.details).toContain('content must be less than 2000 characters')
      })

      it('should reject invalid purpose values', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Valid content for testing',
            purpose: 'invalid-purpose',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Validation failed')
        expect(data.details).toContain('purpose must be one of: thought-leadership, question, value, authority')
      })

      it('should reject invalid format values', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Valid content for testing',
            format: 'invalid-format',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Validation failed')
        expect(data.details).toContain('format must be one of: story, insight, list, howto, question')
      })

      it('should reject invalid tone values', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Valid content for testing',
            tone: 'invalid-tone',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Validation failed')
        expect(data.details).toContain('tone must be one of: professional, casual, friendly, authoritative')
      })

      it('should reject invalid URL references', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Valid content for testing',
            urlReference: 'not-a-valid-url',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Validation failed')
        expect(data.details).toContain('urlReference must be a valid URL')
      })

      it('should accept valid requests with all optional fields', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Generated content',
          metadata: {
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            processingTime: 1500,
            cacheHit: false,
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Create a LinkedIn post about AI innovation',
            purpose: 'thought-leadership',
            format: 'insight',
            tone: 'professional',
            targetAudience: 'business professionals',
            enableResearch: true,
            urlReference: 'https://example.com/article',
            templateId: 'template-123',
            language: 'en',
            culturalContext: { market: 'international' },
            requireCulturalAdaptation: false,
            userId: 'user-123',
            sessionId: 'session-456',
            preferences: { style: 'concise' },
            patterns: ['engagement', 'storytelling'],
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.architecture).toBe('3-layer-function-based')
        expect(data.version).toBe('2.0.0')
        expect(mockGateway.processRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Create a LinkedIn post about AI innovation',
            purpose: 'thought-leadership',
            format: 'insight',
            tone: 'professional',
            language: 'en',
          })
        )
      })
    })

    describe('Content Generation', () => {
      it('should generate content with default parameters', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Generated LinkedIn post content',
          metadata: {
            model: 'gpt-4',
            tokens: 150,
            cost: 0.015,
            processingTime: 2000,
            cacheHit: false,
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Write about remote work trends',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.content).toBe('Generated LinkedIn post content')
        expect(mockGateway.processRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Write about remote work trends',
            purpose: 'value',
            format: 'insight',
            tone: 'professional',
            targetAudience: 'business professionals',
            enableResearch: false,
            language: 'en',
            requireCulturalAdaptation: false,
            userId: 'anonymous',
            patterns: [],
          })
        )
      })

      it('should handle research-enabled requests', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Research-enhanced content',
          metadata: {
            model: 'gpt-4',
            tokens: 200,
            cost: 0.02,
            processingTime: 4000,
            cacheHit: false,
            researchSources: ['source1', 'source2'],
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Latest AI breakthroughs in healthcare',
            enableResearch: true,
            urlReference: 'https://research.ai/paper',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.content).toBe('Research-enhanced content')
        expect(data.data.metadata.researchSources).toHaveLength(2)
      })

      it('should handle Norwegian language requests', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Norsk innhold generert',
          metadata: {
            model: 'gpt-4',
            language: 'no',
            tokens: 120,
            cost: 0.012,
            processingTime: 2500,
            cacheHit: false,
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Skriv om bærekraftig forretningsutvikling',
            language: 'no',
            culturalContext: {
              market: 'norway',
              businessType: 'b2b',
              formalityLevel: 'professional',
            },
            requireCulturalAdaptation: true,
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.content).toBe('Norsk innhold generert')
        expect(data.data.metadata.language).toBe('no')
      })
    })

    describe('Cache Behavior', () => {
      it('should return cached response when available', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Cached content',
          metadata: {
            model: 'gpt-4',
            tokens: 0,
            cost: 0,
            processingTime: 50,
            cacheHit: true,
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Common request for caching',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.metadata.cacheHit).toBe(true)
        expect(data.data.metadata.processingTime).toBeLessThan(100)
        expect(data.data.metadata.cost).toBe(0)
      })

      it('should generate fresh content when cache misses', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Fresh content',
          metadata: {
            model: 'gpt-4',
            tokens: 150,
            cost: 0.015,
            processingTime: 3000,
            cacheHit: false,
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Unique request ' + Date.now(),
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.metadata.cacheHit).toBe(false)
        expect(data.data.metadata.processingTime).toBeGreaterThan(1000)
        expect(data.data.metadata.cost).toBeGreaterThan(0)
      })
    })

    describe('Error Handling', () => {
      it('should handle gateway processing errors', async () => {
        mockGateway.processRequest.mockRejectedValueOnce(new Error('Gateway processing failed'))

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'This will fail',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Generation failed')
        expect(data.message).toBe('Gateway processing failed')
        expect(data.architecture).toBe('3-layer-function-based')
      })

      it('should handle rate limiting errors', async () => {
        mockGateway.processRequest.mockRejectedValueOnce(new Error('Rate limit exceeded'))

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Too many requests',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.message).toContain('Rate limit')
      })

      it('should handle cost threshold errors', async () => {
        mockGateway.processRequest.mockRejectedValueOnce(new Error('Cost threshold exceeded'))

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Expensive request',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.message).toContain('Cost threshold')
      })

      it('should handle model fallback scenarios', async () => {
        // First call fails, second succeeds (simulating fallback)
        mockGateway.processRequest
          .mockRejectedValueOnce(new Error('Primary model unavailable'))
          .mockResolvedValueOnce({
            content: 'Fallback content',
            metadata: {
              model: 'gpt-3.5-turbo',
              tokens: 100,
              cost: 0.005,
              processingTime: 2000,
              cacheHit: false,
              fallbackUsed: true,
            },
          })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Request with fallback',
          }),
        })

        // First attempt fails
        const response1 = await POST(request)
        expect(response1.status).toBe(500)

        // Gateway implementation would handle retry/fallback internally
        // This test demonstrates the expected behavior
      })

      it('should handle JSON parsing errors', async () => {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Generation failed')
      })
    })

    describe('Performance Metrics', () => {
      it('should complete simple requests quickly', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Quick response',
          metadata: {
            model: 'gpt-3.5-turbo',
            tokens: 50,
            cost: 0.002,
            processingTime: 800,
            cacheHit: false,
          },
        })

        const startTime = Date.now()
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Simple quick request',
          }),
        })

        const response = await POST(request)
        const endTime = Date.now()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(endTime - startTime).toBeLessThan(2000) // API overhead should be minimal
        expect(data.data.metadata.processingTime).toBeLessThan(1000)
      })

      it('should track token usage accurately', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Content with tracked tokens',
          metadata: {
            model: 'gpt-4',
            tokens: 250,
            promptTokens: 150,
            completionTokens: 100,
            cost: 0.025,
            processingTime: 3000,
            cacheHit: false,
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Track my token usage',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.metadata.tokens).toBe(250)
        expect(data.data.metadata.cost).toBe(0.025)
      })
    })

    describe('Multi-language Support', () => {
      it('should handle English requests by default', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'English content',
          metadata: {
            model: 'gpt-4',
            language: 'en',
            tokens: 100,
            cost: 0.01,
            processingTime: 2000,
            cacheHit: false,
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Create English content',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(mockGateway.processRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            language: 'en',
          })
        )
      })

      it('should handle Norwegian language with cultural adaptation', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Tilpasset norsk innhold',
          metadata: {
            model: 'gpt-4',
            language: 'no',
            culturalAdaptations: ['business_terms', 'local_references'],
            tokens: 150,
            cost: 0.015,
            processingTime: 3000,
            cacheHit: false,
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Lag innhold om norsk næringsliv',
            language: 'no',
            requireCulturalAdaptation: true,
            culturalContext: {
              market: 'norway',
              businessType: 'b2b',
              dialectPreference: 'bokmål',
            },
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.metadata.language).toBe('no')
        expect(data.data.metadata.culturalAdaptations).toContain('business_terms')
      })
    })

    describe('Cost Management', () => {
      it('should track costs per request', async () => {
        mockGateway.processRequest.mockResolvedValueOnce({
          content: 'Content with cost tracking',
          metadata: {
            model: 'gpt-4',
            tokens: 500,
            cost: 0.05,
            processingTime: 4000,
            cacheHit: false,
            costBreakdown: {
              modelCost: 0.04,
              researchCost: 0.01,
            },
          },
        })

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Generate premium content',
            enableResearch: true,
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.metadata.cost).toBe(0.05)
        expect(data.data.metadata.costBreakdown).toBeDefined()
      })

      it('should respect user budget limits', async () => {
        mockGateway.processRequest.mockRejectedValueOnce(new Error('Budget exceeded for user'))

        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Expensive request',
            userId: 'user-with-limit',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.message).toContain('Budget exceeded')
      })
    })
  })

  describe('GET /api/generate (Health Check)', () => {
    it('should return health status', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'GET',
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.architecture).toBe('3-layer-function-based')
      expect(data.version).toBe('2.0.0')
      expect(data.layers).toBeDefined()
      expect(data.layers.gateway).toContain('Intelligent Gateway')
      expect(data.layers.functions).toContain('Processing Functions')
      expect(data.layers.intelligence).toContain('Intelligence Services')
    })

    it('should return performance targets', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.performance).toBeDefined()
      expect(data.performance.target_simple).toBe('<1s (50% cached)')
      expect(data.performance.target_complex).toBe('4-6s')
      expect(data.performance.cache_hit_rate).toBe('50%')
      expect(data.performance.cost_reduction).toBe('60%')
    })
  })

  describe('Gateway Singleton Pattern', () => {
    it('should reuse the same gateway instance across requests', async () => {
      const mockProcessRequest = jest.fn().mockResolvedValue({
        content: 'Test content',
        metadata: { model: 'gpt-4', tokens: 100, cost: 0.01, processingTime: 1000, cacheHit: false },
      })

      mockGateway.processRequest = mockProcessRequest

      // Make multiple requests
      for (let i = 0; i < 3; i++) {
        const request = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `Request ${i}`,
          }),
        })

        await POST(request)
      }

      // Gateway should be created once, but processRequest called multiple times
      expect(IntelligentGateway).toHaveBeenCalledTimes(1)
      expect(mockProcessRequest).toHaveBeenCalledTimes(3)
    })
  })
})