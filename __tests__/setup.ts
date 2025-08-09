/**
 * Test Setup Utilities
 * Central location for test helpers, mocks, and utilities
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Create a mock Supabase user
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    app_metadata: {},
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    aud: 'authenticated',
    confirmation_sent_at: undefined,
    recovery_sent_at: undefined,
    email_change_sent_at: undefined,
    new_email: undefined,
    new_phone: undefined,
    invited_at: undefined,
    action_link: undefined,
    email: 'test@example.com',
    phone: undefined,
    created_at: '2024-01-01T00:00:00.000Z',
    confirmed_at: '2024-01-01T00:00:00.000Z',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    phone_confirmed_at: undefined,
    last_sign_in_at: '2024-01-01T00:00:00.000Z',
    role: 'authenticated',
    updated_at: '2024-01-01T00:00:00.000Z',
    identities: [],
    is_anonymous: false,
    factors: [],
    ...overrides,
  }
}

/**
 * Create mock content generation data
 */
export function createMockContentData(overrides?: any) {
  return {
    id: 'test-content-id',
    title: 'Test Content',
    content: 'This is test content',
    type: 'linkedin',
    status: 'draft',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    user_id: 'test-user-id',
    metadata: {
      tone: 'professional',
      length: 'medium',
      keywords: ['test', 'content'],
    },
    ...overrides,
  }
}

/**
 * Create mock wizard data
 */
export function createMockWizardData(overrides?: any) {
  return {
    step: 1,
    totalSteps: 5,
    data: {
      contentType: 'linkedin',
      description: 'Test description',
      tone: 'professional',
      length: 'medium',
      keywords: ['test'],
      enableResearch: false,
      model: 'gpt-4',
    },
    ...overrides,
  }
}

/**
 * Create mock API response
 */
export function createMockApiResponse<T = any>(data: T, overrides?: any) {
  return {
    data,
    error: null,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'content-type': 'application/json',
    }),
    ...overrides,
  }
}

/**
 * Create mock API error
 */
export function createMockApiError(message: string, code?: string) {
  return {
    data: null,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
      details: null,
      hint: null,
    },
    status: 400,
    statusText: 'Bad Request',
  }
}

// ============================================================================
// MOCK PROVIDERS
// ============================================================================

/**
 * Mock Supabase client
 */
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: createMockUser() }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    execute: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
    })),
  },
  realtime: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    })),
  },
}

/**
 * Mock OpenAI client
 */
export const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        id: 'test-completion-id',
        choices: [
          {
            message: {
              content: 'Test AI response',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }),
    },
  },
  embeddings: {
    create: jest.fn().mockResolvedValue({
      data: [
        {
          embedding: new Array(1536).fill(0.1),
          index: 0,
        },
      ],
      usage: {
        prompt_tokens: 10,
        total_tokens: 10,
      },
    }),
  },
}

/**
 * Mock Anthropic client
 */
export const mockAnthropicClient = {
  messages: {
    create: jest.fn().mockResolvedValue({
      id: 'test-message-id',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Test Claude response',
        },
      ],
      model: 'claude-3-opus-20240229',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    }),
  },
}

// ============================================================================
// CUSTOM RENDER FUNCTIONS
// ============================================================================

interface AllTheProvidersProps {
  children: ReactNode
}

/**
 * All providers wrapper for testing
 */
function AllTheProviders({ children }: AllTheProvidersProps) {
  // Add your providers here (Context, Theme, etc.)
  return children
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Flush all promises
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve))
}

// ============================================================================
// MOCK TIMERS UTILITIES
// ============================================================================

/**
 * Setup fake timers with common configuration
 */
export function setupFakeTimers() {
  jest.useFakeTimers()
  return {
    advance: (ms: number) => jest.advanceTimersByTime(ms),
    runAll: () => jest.runAllTimers(),
    runPending: () => jest.runOnlyPendingTimers(),
    clear: () => jest.clearAllTimers(),
    restore: () => jest.useRealTimers(),
  }
}

// ============================================================================
// API MOCKING UTILITIES
// ============================================================================

/**
 * Mock fetch for API calls
 */
export function mockFetch(response: any, status = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      headers: new Headers({
        'content-type': 'application/json',
      }),
    } as Response)
  )
  return global.fetch as jest.Mock
}

/**
 * Mock API endpoint
 */
export function mockApiEndpoint(endpoint: string, response: any, method = 'GET') {
  const fetchMock = mockFetch(response)
  fetchMock.mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes(endpoint) && (!options?.method || options.method === method)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
        headers: new Headers({
          'content-type': 'application/json',
        }),
      } as Response)
    }
    return Promise.reject(new Error('Not found'))
  })
  return fetchMock
}

/**
 * Mock the Intelligent Gateway for testing
 */
export function mockIntelligentGateway() {
  return {
    processRequest: jest.fn().mockResolvedValue({
      content: 'Mocked generated content',
      metadata: {
        model: 'gpt-4',
        tokens: 100,
        cost: 0.01,
        processingTime: 1500,
        cacheHit: false,
      },
    }),
    // Add other methods as needed
    getMetrics: jest.fn().mockResolvedValue({
      totalRequests: 100,
      cacheHitRate: 0.5,
      averageLatency: 1500,
      totalCost: 10.50,
    }),
    clearCache: jest.fn(),
    updateConfig: jest.fn(),
  }
}

/**
 * Create mock content request for testing
 */
export function createMockContentRequest(overrides?: any) {
  return {
    content: 'Create a LinkedIn post about AI innovation',
    purpose: 'value',
    format: 'insight',
    tone: 'professional',
    targetAudience: 'business professionals',
    enableResearch: false,
    urlReference: undefined,
    templateId: undefined,
    language: 'en',
    culturalContext: undefined,
    requireCulturalAdaptation: false,
    userId: 'anonymous',
    sessionId: `session_${Date.now()}`,
    preferences: undefined,
    patterns: [],
    ...overrides,
  }
}

/**
 * Create mock gateway response
 */
export function createMockGatewayResponse(overrides?: any) {
  return {
    content: 'Generated content response',
    metadata: {
      model: 'gpt-4',
      tokens: 150,
      promptTokens: 100,
      completionTokens: 50,
      cost: 0.015,
      processingTime: 2000,
      cacheHit: false,
      language: 'en',
      fallbackUsed: false,
      researchSources: [],
      culturalAdaptations: [],
      costBreakdown: {
        modelCost: 0.015,
        researchCost: 0,
      },
    },
    ...overrides,
  }
}

/**
 * Mock rate limiting scenario
 */
export function mockRateLimitError() {
  return new Error('Rate limit exceeded. Please retry after 60 seconds.')
}

/**
 * Mock budget exceeded error
 */
export function mockBudgetExceededError(userId: string) {
  return new Error(`Budget exceeded for user ${userId}. Please upgrade your plan.`)
}

/**
 * Mock API timeout
 */
export function mockTimeout(ms: number = 30000) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), ms)
  )
}

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
  fn: () => T | Promise<T>,
  name: string = 'Operation'
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  console.log(`${name} took ${duration.toFixed(2)}ms`)
  return { result, duration }
}

// ============================================================================
// SNAPSHOT UTILITIES
// ============================================================================

/**
 * Clean object for snapshot testing (removes dynamic values)
 */
export function cleanForSnapshot(obj: any): any {
  const cleaned = { ...obj }
  
  // Remove dynamic fields
  const dynamicFields = ['id', 'created_at', 'updated_at', 'timestamp']
  dynamicFields.forEach(field => {
    if (field in cleaned) {
      cleaned[field] = '[DYNAMIC]'
    }
  })
  
  // Recursively clean nested objects
  Object.keys(cleaned).forEach(key => {
    if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
      cleaned[key] = cleanForSnapshot(cleaned[key])
    }
  })
  
  return cleaned
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert API response structure
 */
export function assertApiResponse(response: any, expectedKeys: string[]) {
  expect(response).toBeDefined()
  expect(response).toHaveProperty('data')
  expect(response).toHaveProperty('error')
  
  if (response.data) {
    expectedKeys.forEach(key => {
      expect(response.data).toHaveProperty(key)
    })
  }
}

/**
 * Assert error structure
 */
export function assertError(error: any, expectedMessage?: string) {
  expect(error).toBeDefined()
  expect(error).toHaveProperty('message')
  
  if (expectedMessage) {
    expect(error.message).toContain(expectedMessage)
  }
}

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Cleanup function to run after tests
 */
export function cleanupAfterTest() {
  // Clear all mocks
  jest.clearAllMocks()
  
  // Clear timers
  jest.clearAllTimers()
  
  // Restore real timers if fake ones were used
  jest.useRealTimers()
  
  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
  
  // Clear sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  mockSupabaseClient,
  mockOpenAIClient,
  mockAnthropicClient,
  mockIntelligentGateway,
  createMockContentRequest,
  createMockGatewayResponse,
  mockRateLimitError,
  mockBudgetExceededError,
  mockTimeout,
}