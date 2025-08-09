/**
 * Comprehensive Test Suite for Health Check API Route
 * Tests system health monitoring and service status
 */

import { GET } from '@/app/api/health/route'
import { NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/database/supabase'

// Mock Supabase client
jest.mock('@/lib/database/supabase', () => ({
  supabaseClient: {
    from: jest.fn(),
  },
}))

// Save original environment
const originalEnv = process.env

describe('Health Check API Route', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'test-openai-key',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      FIRECRAWL_API_KEY: 'test-firecrawl-key',
      TAVILY_API_KEY: 'test-tavily-key',
      STRIPE_SECRET_KEY: 'test-stripe-key',
    }

    // Reset mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('GET /api/health', () => {
    describe('Healthy Status', () => {
      it('should return healthy status when all services are operational', async () => {
        // Mock successful database query
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('healthy')
        expect(data.timestamp).toBeDefined()
        expect(new Date(data.timestamp)).toBeInstanceOf(Date)
        expect(data.architecture).toBe('3-layer-function-based')
        expect(data.version).toBe('2.0.0')
      })

      it('should check database connectivity', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(mockFrom).toHaveBeenCalledWith('users')
        expect(data.services.database).toBe('healthy')
      })

      it('should report configured services', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.services).toEqual({
          database: 'healthy',
          openai: 'configured',
          anthropic: 'configured',
          firecrawl: 'configured',
          tavily: 'configured',
          stripe: 'configured',
        })
      })

      it('should include architecture layers information', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.layers).toBeDefined()
        expect(data.layers.gateway).toBe('Intelligent Gateway (routing, caching, cost tracking)')
        expect(data.layers.functions).toBe('Processing Functions (research, generate, optimize, validate)')
        expect(data.layers.intelligence).toBe('Intelligence Services (patterns, quality, metrics)')
      })
    })

    describe('Degraded Status', () => {
      it('should return degraded status when database is unhealthy', async () => {
        // Mock database error
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ 
            error: { message: 'Database connection failed' } 
          }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('degraded')
        expect(data.services.database).toBe('unhealthy')
      })

      it('should return degraded when some services are not configured', async () => {
        // Remove some API keys
        delete process.env.OPENAI_API_KEY
        delete process.env.STRIPE_SECRET_KEY

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('degraded')
        expect(data.services.openai).toBe('not-configured')
        expect(data.services.stripe).toBe('not-configured')
        expect(data.services.anthropic).toBe('configured')
      })

      it('should handle partial service failures gracefully', async () => {
        // Database fails but other services are configured
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ 
            error: { message: 'Connection timeout' } 
          }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('degraded')
        expect(data.services.database).toBe('unhealthy')
        // Other services should still be reported
        expect(data.services.openai).toBe('configured')
        expect(data.services.anthropic).toBe('configured')
      })
    })

    describe('Unhealthy Status', () => {
      it('should return unhealthy status when health check throws an error', async () => {
        // Mock an exception during health check
        const mockFrom = jest.fn().mockImplementation(() => {
          throw new Error('Critical system failure')
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(503) // Service Unavailable
        expect(data.status).toBe('unhealthy')
        expect(data.error).toBe('Health check failed')
        expect(data.timestamp).toBeDefined()
        expect(data.version).toBe('2.0.0')
      })

      it('should handle database connection errors', async () => {
        // Mock a rejected promise
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockRejectedValue(new Error('Connection refused')),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(503)
        expect(data.status).toBe('unhealthy')
        expect(data.error).toBe('Health check failed')
      })
    })

    describe('Service Status Checks', () => {
      it('should detect missing OpenAI configuration', async () => {
        delete process.env.OPENAI_API_KEY

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.services.openai).toBe('not-configured')
      })

      it('should detect missing Anthropic configuration', async () => {
        delete process.env.ANTHROPIC_API_KEY

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.services.anthropic).toBe('not-configured')
      })

      it('should detect missing Firecrawl configuration', async () => {
        delete process.env.FIRECRAWL_API_KEY

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.services.firecrawl).toBe('not-configured')
      })

      it('should detect missing Tavily configuration', async () => {
        delete process.env.TAVILY_API_KEY

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.services.tavily).toBe('not-configured')
      })

      it('should detect missing Stripe configuration', async () => {
        delete process.env.STRIPE_SECRET_KEY

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.services.stripe).toBe('not-configured')
      })

      it('should handle all services being unconfigured', async () => {
        // Remove all API keys
        delete process.env.OPENAI_API_KEY
        delete process.env.ANTHROPIC_API_KEY
        delete process.env.FIRECRAWL_API_KEY
        delete process.env.TAVILY_API_KEY
        delete process.env.STRIPE_SECRET_KEY

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.status).toBe('degraded')
        expect(data.services).toEqual({
          database: 'healthy',
          openai: 'not-configured',
          anthropic: 'not-configured',
          firecrawl: 'not-configured',
          tavily: 'not-configured',
          stripe: 'not-configured',
        })
      })
    })

    describe('Response Format', () => {
      it('should include ISO timestamp', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.timestamp).toBeDefined()
        // Check if it's a valid ISO string
        expect(() => new Date(data.timestamp)).not.toThrow()
        const timestamp = new Date(data.timestamp)
        expect(timestamp.toISOString()).toBe(data.timestamp)
      })

      it('should include version information', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.version).toBe('2.0.0')
      })

      it('should include architecture type', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(data.architecture).toBe('3-layer-function-based')
      })

      it('should have consistent response structure', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        // Check all expected fields exist
        expect(data).toHaveProperty('status')
        expect(data).toHaveProperty('timestamp')
        expect(data).toHaveProperty('architecture')
        expect(data).toHaveProperty('services')
        expect(data).toHaveProperty('version')
        expect(data).toHaveProperty('layers')

        // Check services object structure
        expect(data.services).toHaveProperty('database')
        expect(data.services).toHaveProperty('openai')
        expect(data.services).toHaveProperty('anthropic')
        expect(data.services).toHaveProperty('firecrawl')
        expect(data.services).toHaveProperty('tavily')
        expect(data.services).toHaveProperty('stripe')

        // Check layers object structure
        expect(data.layers).toHaveProperty('gateway')
        expect(data.layers).toHaveProperty('functions')
        expect(data.layers).toHaveProperty('intelligence')
      })
    })

    describe('Performance', () => {
      it('should respond quickly', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const startTime = Date.now()
        const response = await GET()
        const endTime = Date.now()

        expect(response.status).toBe(200)
        // Health check should be fast (< 1 second)
        expect(endTime - startTime).toBeLessThan(1000)
      })

      it('should handle database timeout gracefully', async () => {
        // Simulate a slow database query
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockImplementation(() => 
            new Promise((resolve) => 
              setTimeout(() => resolve({ error: { message: 'Query timeout' } }), 100)
            )
          ),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const startTime = Date.now()
        const response = await GET()
        const endTime = Date.now()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.status).toBe('degraded')
        expect(data.services.database).toBe('unhealthy')
        // Should still respond within reasonable time
        expect(endTime - startTime).toBeLessThan(2000)
      })
    })

    describe('Error Logging', () => {
      it('should log errors to console', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

        // Mock an error
        const mockFrom = jest.fn().mockImplementation(() => {
          throw new Error('Test error for logging')
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        await GET()

        expect(consoleSpy).toHaveBeenCalledWith(
          'Health check failed:',
          expect.any(Error)
        )

        consoleSpy.mockRestore()
      })

      it('should not expose sensitive error details in response', async () => {
        // Mock an error with sensitive information
        const mockFrom = jest.fn().mockImplementation(() => {
          const error = new Error('Database password: secret123')
          throw error
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(503)
        expect(data.error).toBe('Health check failed')
        // Should not include the actual error message with sensitive data
        expect(JSON.stringify(data)).not.toContain('secret123')
        expect(JSON.stringify(data)).not.toContain('password')
      })
    })

    describe('Database Query Optimization', () => {
      it('should use count query with head:true for efficiency', async () => {
        const mockSelect = jest.fn().mockResolvedValue({ error: null })
        const mockFrom = jest.fn().mockReturnValue({
          select: mockSelect,
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        await GET()

        expect(mockFrom).toHaveBeenCalledWith('users')
        expect(mockSelect).toHaveBeenCalledWith('count(*)', { 
          count: 'exact', 
          head: true 
        })
      })

      it('should not fetch actual user data', async () => {
        const mockSelect = jest.fn().mockResolvedValue({ error: null })
        const mockFrom = jest.fn().mockReturnValue({
          select: mockSelect,
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        await GET()

        // Should only call select once for count
        expect(mockSelect).toHaveBeenCalledTimes(1)
        // Should not select any user fields
        expect(mockSelect).not.toHaveBeenCalledWith('*')
        expect(mockSelect).not.toHaveBeenCalledWith(expect.stringContaining('id'))
        expect(mockSelect).not.toHaveBeenCalledWith(expect.stringContaining('email'))
      })
    })

    describe('HTTP Status Codes', () => {
      it('should return 200 for healthy status', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()

        expect(response.status).toBe(200)
      })

      it('should return 200 for degraded status', async () => {
        // Database error but system is still operational
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ 
            error: { message: 'Database unavailable' } 
          }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()

        expect(response.status).toBe(200)
      })

      it('should return 503 for unhealthy status', async () => {
        // Complete system failure
        const mockFrom = jest.fn().mockImplementation(() => {
          throw new Error('System failure')
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()

        expect(response.status).toBe(503)
      })
    })

    describe('Monitoring Integration', () => {
      it('should be suitable for monitoring tools', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        // Should have all fields needed for monitoring
        expect(data.status).toBeDefined()
        expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status)
        expect(data.timestamp).toBeDefined()
        expect(data.services).toBeDefined()
        
        // Services should have predictable values
        Object.values(data.services).forEach(value => {
          expect(['healthy', 'unhealthy', 'configured', 'not-configured']).toContain(value)
        })
      })

      it('should provide actionable service status', async () => {
        delete process.env.OPENAI_API_KEY
        
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ 
            error: { message: 'Connection failed' } 
          }),
        })
        ;(supabaseClient.from as jest.Mock) = mockFrom

        const response = await GET()
        const data = await response.json()

        // Status should clearly indicate what's wrong
        expect(data.services.database).toBe('unhealthy')
        expect(data.services.openai).toBe('not-configured')
        
        // Overall status should reflect the issues
        expect(data.status).toBe('degraded')
      })
    })
  })
})