# StoryScale Testing Strategy

## 🧪 Testing Overview

StoryScale employs a comprehensive testing strategy covering unit tests, integration tests, end-to-end testing, AI agent testing, and visual regression testing. The testing approach ensures reliability across the document identification system, AI agent pipeline, and user workflows.

**Testing Pyramid:**
- **Unit Tests (70%)**: Individual functions and components
- **Integration Tests (20%)**: API endpoints and database operations
- **E2E Tests (10%)**: Critical user journeys and workflows

**Key Testing Areas:**
- Document identification and classification
- AI agent pipeline reliability
- Research attribution accuracy
- Pattern learning effectiveness
- Authentication flows (guest → authenticated)
- Payment processing integration

## 🏗️ Testing Architecture

### Testing Stack
```typescript
// Core testing framework
const testingStack = {
  unitTesting: {
    framework: 'Jest',
    assertions: '@testing-library/jest-dom',
    mocking: 'jest.mock()',
    coverage: 'jest --coverage'
  },
  
  componentTesting: {
    framework: '@testing-library/react',
    utilities: '@testing-library/user-event',
    rendering: 'render, screen, fireEvent',
    queries: 'getByRole, getByTestId, findBy*'
  },
  
  e2eTesting: {
    framework: 'Playwright',
    browsers: ['chromium', 'firefox', 'webkit'],
    devices: 'Desktop, Mobile, Tablet',
    visual: 'Screenshot comparison'
  },
  
  apiTesting: {
    framework: 'Supertest + Jest',
    mocking: 'MSW (Mock Service Worker)',
    database: 'Test database with fixtures'
  },
  
  performanceTesting: {
    framework: 'Lighthouse CI',
    metrics: 'Core Web Vitals',
    thresholds: 'Performance budgets'
  }
}
```

### Test Configuration

#### jest.config.js
```javascript
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**'
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{ts,tsx}'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  // Mock external dependencies
  moduleNameMapping: {
    '^@supabase/supabase-js$': '<rootDir>/tests/__mocks__/supabase.ts',
    '^stripe$': '<rootDir>/tests/__mocks__/stripe.ts',
    '^openai$': '<rootDir>/tests/__mocks__/openai.ts'
  }
}

module.exports = config
```

#### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }
})
```

## 🧩 Unit Testing

### Component Testing Patterns

#### Document Classification Component Tests
```typescript
// components/wizard/StepOne.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepOne } from './StepOne'

describe('StepOne - Content & Purpose', () => {
  const mockOnNext = jest.fn()
  const mockOnSaveDraft = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should render all required form fields', () => {
    render(<StepOne onNext={mockOnNext} onSaveDraft={mockOnSaveDraft} />)
    
    expect(screen.getByLabelText(/describe your post/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/goal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/url reference/i)).toBeInTheDocument()
  })
  
  it('should generate AI suggestions on content input', async () => {
    const user = userEvent.setup()
    
    render(<StepOne onNext={mockOnNext} onSaveDraft={mockOnSaveDraft} />)
    
    const contentInput = screen.getByLabelText(/describe your post/i)
    await user.type(contentInput, 'AI is transforming the workplace')
    
    // Wait for AI suggestions to load
    await waitFor(() => {
      expect(screen.getByText(/ai: \d+%/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
  
  it('should validate required fields before proceeding', async () => {
    const user = userEvent.setup()
    
    render(<StepOne onNext={mockOnNext} onSaveDraft={mockOnSaveDraft} />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument()
    expect(mockOnNext).not.toHaveBeenCalled()
  })
  
  it('should save draft with partial data', async () => {
    const user = userEvent.setup()
    
    render(<StepOne onNext={mockOnNext} onSaveDraft={mockOnSaveDraft} />)
    
    const contentInput = screen.getByLabelText(/describe your post/i)
    await user.type(contentInput, 'Partial content')
    
    const saveDraftButton = screen.getByRole('button', { name: /save draft/i })
    await user.click(saveDraftButton)
    
    expect(mockOnSaveDraft).toHaveBeenCalledWith({
      content: 'Partial content',
      purpose: null,
      goal: null,
      urlReference: ''
    })
  })
})
```

#### AI Agent Testing
```typescript
// lib/agents/InputAgent.test.ts
import { InputAgent } from './InputAgent'
import { mockAIProvider } from '../../tests/__mocks__/ai-provider'

describe('InputAgent', () => {
  let agent: InputAgent
  
  beforeEach(() => {
    agent = new InputAgent(mockAIProvider)
  })
  
  it('should validate input successfully', async () => {
    const input = {
      content: 'AI is transforming the workplace',
      purpose: 'thought-leadership',
      format: 'story',
      tone: 'professional',
      targetAudience: 'business professionals',
      userId: 'user-123',
      sessionId: 'session-456',
      preferences: {},
      patterns: []
    }
    
    const result = await agent.process(input)
    
    expect(result.success).toBe(true)
    expect(result.data.suggestions).toBeDefined()
    expect(result.data.contentAnalysis).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0.5)
  })
  
  it('should handle validation errors gracefully', async () => {
    const invalidInput = {
      content: '', // Empty content should fail
      purpose: 'invalid-purpose',
      userId: 'user-123'
    } as any
    
    const result = await agent.process(invalidInput)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Validation failed')
  })
  
  it('should generate confidence scores for suggestions', async () => {
    const input = {
      content: 'Leadership lessons from my startup journey',
      userId: 'user-123'
    } as any
    
    const result = await agent.process(input)
    
    expect(result.success).toBe(true)
    expect(result.data.suggestions.purpose).toHaveLength(4)
    expect(result.data.suggestions.purpose[0].confidence).toBeGreaterThan(0)
  })
  
  it('should handle AI provider failures', async () => {
    // Mock AI provider to fail
    mockAIProvider.generate.mockRejectedValue(new Error('API timeout'))
    
    const input = {
      content: 'Test content',
      userId: 'user-123'
    } as any
    
    const result = await agent.process(input)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('API timeout')
  })
})
```

### Database Testing
```typescript
// lib/database/documents.test.ts
import { createDocument, getDocument, searchDocuments } from './documents'
import { createTestUser, cleanupTestData } from '../../tests/helpers/database'

describe('Document Database Operations', () => {
  let testUserId: string
  
  beforeAll(async () => {
    testUserId = await createTestUser()
  })
  
  afterAll(async () => {
    await cleanupTestData(testUserId)
  })
  
  it('should create document with proper classification', async () => {
    const documentData = {
      userId: testUserId,
      type: 'linkedin',
      mediaType: 'text-only',
      purpose: 'thought-leadership',
      format: 'story',
      content: {
        short: 'Short version...',
        medium: 'Medium version...',
        long: 'Long version...',
        selected: 'Medium version...'
      },
      selectedLength: 'medium'
    }
    
    const document = await createDocument(documentData)
    
    expect(document.id).toBeDefined()
    expect(document.type).toBe('linkedin')
    expect(document.purpose).toBe('thought-leadership')
    expect(document.characterCount).toBeGreaterThan(0)
  })
  
  it('should enforce document classification constraints', async () => {
    const invalidData = {
      userId: testUserId,
      type: 'invalid-type', // Should fail validation
      mediaType: 'text-only',
      purpose: 'thought-leadership',
      format: 'story',
      content: { selected: 'Test content' }
    }
    
    await expect(createDocument(invalidData)).rejects.toThrow()
  })
  
  it('should search documents with full-text search', async () => {
    // Create test documents
    await createDocument({
      userId: testUserId,
      type: 'linkedin',
      mediaType: 'text-only',
      purpose: 'thought-leadership',
      format: 'story',
      content: { selected: 'AI artificial intelligence machine learning' }
    })
    
    const results = await searchDocuments(testUserId, 'artificial intelligence')
    
    expect(results.documents).toHaveLength(1)
    expect(results.documents[0].content.selected).toContain('artificial intelligence')
  })
})
```

## 🔗 Integration Testing

### API Integration Tests
```typescript
// tests/api/documents.test.ts
import request from 'supertest'
import { createTestApp } from '../helpers/test-app'
import { createAuthToken } from '../helpers/auth'

describe('/api/documents', () => {
  let app: any
  let authToken: string
  
  beforeAll(async () => {
    app = await createTestApp()
    authToken = await createAuthToken('test-user-id')
  })
  
  describe('POST /api/documents', () => {
    it('should create document with valid data', async () => {
      const documentData = {
        content: 'AI is transforming how we work',
        purpose: 'thought-leadership',
        format: 'story',
        tone: 'professional',
        targetAudience: 'business professionals',
        enableResearch: false
      }
      
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData)
        .expect(201)
      
      expect(response.body.id).toBeDefined()
      expect(response.body.status).toBe('processing')
    })
    
    it('should reject invalid document data', async () => {
      const invalidData = {
        content: '', // Empty content
        purpose: 'invalid-purpose'
      }
      
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)
      
      expect(response.body.error).toContain('Validation failed')
    })
    
    it('should enforce authentication', async () => {
      const documentData = {
        content: 'Test content',
        purpose: 'thought-leadership'
      }
      
      await request(app)
        .post('/api/documents')
        .send(documentData)
        .expect(401)
    })
    
    it('should handle rate limiting', async () => {
      // Make multiple requests rapidly
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Test', purpose: 'value' })
      )
      
      const responses = await Promise.all(promises)
      const rateLimited = responses.some(res => res.status === 429)
      
      expect(rateLimited).toBe(true)
    })
  })
  
  describe('GET /api/documents/{id}/status', () => {
    it('should return document processing status', async () => {
      // Create document first
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Status test content',
          purpose: 'thought-leadership',
          format: 'story',
          tone: 'professional',
          targetAudience: 'professionals'
        })
      
      const documentId = createResponse.body.id
      
      const response = await request(app)
        .get(`/api/documents/${documentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
      
      expect(response.body.id).toBe(documentId)
      expect(['processing', 'completed', 'failed']).toContain(response.body.status)
    })
  })
})
```

### Research Integration Tests
```typescript
// tests/api/research.test.ts
import { ResearchAgent } from '../../lib/agents/ResearchAgent'
import { mockFirecrawlProvider, mockTavilyProvider } from '../__mocks__/research-providers'

describe('Research Integration', () => {
  let researchAgent: ResearchAgent
  
  beforeEach(() => {
    researchAgent = new ResearchAgent(mockFirecrawlProvider, mockTavilyProvider)
  })
  
  it('should gather research from multiple providers', async () => {
    const input = {
      content: 'Future of remote work',
      enableResearch: true,
      userId: 'test-user'
    } as any
    
    const result = await researchAgent.process(input)
    
    expect(result.success).toBe(true)
    expect(result.data.sources).toHaveLength(2) // Firecrawl + Tavily
    expect(result.data.insights).toBeDefined()
  })
  
  it('should handle provider failures gracefully', async () => {
    // Mock one provider to fail
    mockFirecrawlProvider.search.mockRejectedValue(new Error('Service unavailable'))
    
    const input = {
      content: 'Test topic',
      enableResearch: true,
      userId: 'test-user'
    } as any
    
    const result = await researchAgent.process(input)
    
    expect(result.success).toBe(true) // Should still succeed with one provider
    expect(result.data.sources).toHaveLength(1) // Only Tavily results
  })
  
  it('should properly attribute sources', async () => {
    const input = {
      content: 'AI in healthcare',
      enableResearch: true,
      userId: 'test-user'
    } as any
    
    const result = await researchAgent.process(input)
    
    result.data.sources.forEach(source => {
      expect(source.title).toBeDefined()
      expect(source.url).toBeDefined()
      expect(source.fullContext).toBeDefined()
      expect(source.provider).toMatch(/firecrawl|tavily/)
      expect(source.relevanceScore).toBeGreaterThan(0)
    })
  })
})
```

## 🎭 End-to-End Testing

### Critical User Journeys
```typescript
// tests/e2e/content-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Content Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })
  
  test('should complete full document creation as guest user', async ({ page }) => {
    // Start as guest user
    await page.click('[data-testid=start-creating]')
    
    // Step 1: Content & Purpose
    await page.fill('[data-testid=content-input]', 'AI is transforming the workplace with new automation tools')
    
    // Wait for AI suggestions to load
    await expect(page.locator('[data-testid=purpose-suggestions]')).toBeVisible()
    
    // Select AI-suggested purpose
    await page.click('[data-testid=purpose-dropdown]')
    await page.click('[data-testid=purpose-thought-leadership]')
    
    // Select goal
    await page.click('[data-testid=goal-dropdown]')
    await page.click('[data-testid=goal-authority]')
    
    await page.click('[data-testid=next-button]')
    
    // Step 2: Audience & Style
    await expect(page.locator('[data-testid=step-2]')).toBeVisible()
    
    await page.click('[data-testid=audience-dropdown]')
    await page.click('[data-testid=audience-professionals]')
    
    // Select tone
    await page.click('[data-testid=tone-professional]')
    
    // Select format
    await page.click('[data-testid=format-story]')
    
    await page.click('[data-testid=next-button]')
    
    // Step 3: Research & Enhancement
    await expect(page.locator('[data-testid=step-3]')).toBeVisible()
    
    // Enable research
    await page.click('[data-testid=enable-research]')
    
    await page.click('[data-testid=next-button]')
    
    // Step 4: Summary & Generation
    await expect(page.locator('[data-testid=step-4]')).toBeVisible()
    
    // Generate content
    await page.click('[data-testid=generate-post]')
    
    // Wait for generation to complete (up to 30 seconds)
    await expect(page.locator('[data-testid=generation-complete]')).toBeVisible({
      timeout: 30000
    })
    
    // Verify content was generated
    await expect(page.locator('[data-testid=generated-content]')).toContainText('AI')
    
    // Check sources tab
    await page.click('[data-testid=sources-tab]')
    await expect(page.locator('[data-testid=source-card]')).toBeVisible()
    
    // Verify source attribution
    const sourceCard = page.locator('[data-testid=source-card]').first()
    await expect(sourceCard.locator('[data-testid=source-title]')).toBeVisible()
    await expect(sourceCard.locator('[data-testid=source-context]')).toBeVisible()
    await expect(sourceCard.locator('[data-testid=used-snippets]')).toBeVisible()
  })
  
  test('should save draft and resume later', async ({ page }) => {
    // Start content creation
    await page.click('[data-testid=start-creating]')
    
    // Fill partial data
    await page.fill('[data-testid=content-input]', 'Draft content about productivity')
    
    // Save draft
    await page.click('[data-testid=save-draft]')
    
    // Verify draft saved message
    await expect(page.locator('[data-testid=draft-saved]')).toBeVisible()
    
    // Go to dashboard
    await page.click('[data-testid=dashboard-link]')
    
    // Find draft in list
    const draftRow = page.locator('[data-testid=document-row]').first()
    await expect(draftRow.locator('[data-testid=status-badge]')).toContainText('Draft')
    
    // Resume editing
    await draftRow.click()
    
    // Verify content is restored
    await expect(page.locator('[data-testid=content-input]')).toHaveValue('Draft content about productivity')
  })
  
  test('should upgrade from guest to authenticated user', async ({ page }) => {
    // Create content as guest
    await page.click('[data-testid=start-creating]')
    await page.fill('[data-testid=content-input]', 'Test content for migration')
    await page.click('[data-testid=save-draft]')
    
    // Sign up
    await page.click('[data-testid=sign-up-button]')
    
    // Mock Google OAuth (in test environment)
    await page.click('[data-testid=google-sign-in]')
    
    // Should redirect back with migrated data
    await expect(page.locator('[data-testid=welcome-message]')).toBeVisible()
    
    // Verify data was migrated
    await page.goto('/workspace')
    await expect(page.locator('[data-testid=document-row]')).toContainText('Test content for migration')
  })
})
```

### Performance Testing
```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    // Navigate to homepage
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    
    // Measure LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        setTimeout(() => resolve(null), 5000)
      })
    })
    
    expect(lcp).toBeLessThan(2500) // LCP should be under 2.5s
    
    // Measure FID (First Input Delay) by simulating click
    const fidPromise = page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const firstInput = list.getEntries()[0]
          resolve(firstInput.processingStart - firstInput.startTime)
        }).observe({ entryTypes: ['first-input'] })
      })
    })
    
    await page.click('[data-testid=start-creating]')
    const fid = await fidPromise
    
    expect(fid).toBeLessThan(100) // FID should be under 100ms
  })
  
  test('should handle concurrent users', async ({ browser }) => {
    // Simulate multiple users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ])
    
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()))
    
    // All users start content creation simultaneously
    const startTime = Date.now()
    
    await Promise.all(pages.map(async (page, i) => {
      await page.goto('/')
      await page.click('[data-testid=start-creating]')
      await page.fill('[data-testid=content-input]', `Content from user ${i}`)
      await page.click('[data-testid=save-draft]')
      await expect(page.locator('[data-testid=draft-saved]')).toBeVisible()
    }))
    
    const totalTime = Date.now() - startTime
    expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
    
    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()))
  })
})
```

## 🤖 AI Agent Testing

### Agent Pipeline Testing
```typescript
// tests/agents/pipeline.test.ts
import { AgentPipelineManager } from '../../lib/agents/pipeline'
import { createMockAgents } from '../__mocks__/agents'

describe('Agent Pipeline', () => {
  let pipelineManager: AgentPipelineManager
  
  beforeEach(() => {
    pipelineManager = new AgentPipelineManager(createMockAgents())
  })
  
  test('should execute full pipeline successfully', async () => {
    const input = {
      content: 'The future of AI in healthcare',
      purpose: 'thought-leadership',
      format: 'story',
      tone: 'professional',
      targetAudience: 'healthcare professionals',
      enableResearch: true,
      userId: 'test-user',
      sessionId: 'test-session',
      preferences: {},
      patterns: []
    }
    
    const pipeline = {
      sequence: ['input', 'research', 'content', 'optimize', 'enhance']
    }
    
    const result = await pipelineManager.execute(pipeline, input)
    
    expect(result.success).toBe(true)
    expect(result.results).toHaveLength(5)
    expect(result.totalTime).toBeGreaterThan(0)
    expect(result.totalTokens).toBeGreaterThan(0)
    
    // Verify each agent executed
    const agentNames = result.results.map(r => r.agent)
    expect(agentNames).toEqual(['input', 'research', 'content', 'optimize', 'enhance'])
  })
  
  test('should handle agent failures with fallbacks', async () => {
    // Mock research agent to fail
    const mockAgents = createMockAgents()
    mockAgents.get('research')!.process = jest.fn().mockRejectedValue(new Error('API timeout'))
    
    pipelineManager = new AgentPipelineManager(mockAgents)
    
    const input = {
      content: 'Test content',
      enableResearch: true,
      userId: 'test-user'
    } as any
    
    const result = await pipelineManager.execute(
      { sequence: ['input', 'research', 'content'] },
      input
    )
    
    // Pipeline should continue despite research failure
    expect(result.success).toBe(true)
    expect(result.results.find(r => r.agent === 'research')?.success).toBe(false)
    expect(result.results.find(r => r.agent === 'content')?.success).toBe(true)
  })
  
  test('should respect timeout limits', async () => {
    // Mock slow agent
    const mockAgents = createMockAgents()
    mockAgents.get('content')!.process = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 35000)) // 35 seconds
    )
    
    pipelineManager = new AgentPipelineManager(mockAgents)
    
    const input = { content: 'Test', userId: 'test-user' } as any
    
    const result = await pipelineManager.execute(
      { sequence: ['content'] },
      input
    )
    
    expect(result.success).toBe(false)
    expect(result.results[0].error).toContain('timeout')
  })
})
```

### Research Attribution Testing
```typescript
// tests/agents/research-attribution.test.ts
import { EnhanceAgent } from '../../lib/agents/EnhanceAgent'

describe('Research Attribution', () => {
  let enhanceAgent: EnhanceAgent
  
  beforeEach(() => {
    enhanceAgent = new EnhanceAgent()
  })
  
  test('should add proper citations to content', async () => {
    const input = {
      optimizedContent: {
        selected: 'Artificial intelligence is transforming healthcare with new diagnostic tools and treatment methods.',
        short: 'AI is transforming healthcare.',
        medium: 'AI is transforming healthcare with new tools.',
        long: 'Artificial intelligence is transforming healthcare...'
      },
      researchData: {
        sources: [
          {
            id: 'source-1',
            title: 'AI in Healthcare: Revolutionary Changes',
            url: 'https://example.com/ai-healthcare',
            fullContext: 'AI diagnostic tools are achieving 95% accuracy in early disease detection...',
            usedSnippets: [],
            provider: 'firecrawl',
            relevanceScore: 0.9
          }
        ]
      }
    } as any
    
    const result = await enhanceAgent.process(input)
    
    expect(result.success).toBe(true)
    expect(result.data.content.selected).toContain('According to')
    expect(result.data.citations).toHaveLength(1)
    expect(result.data.sources[0].usedSnippets).not.toHaveLength(0)
  })
  
  test('should handle content without research sources', async () => {
    const input = {
      optimizedContent: {
        selected: 'Personal thoughts on leadership'
      },
      researchData: { sources: [] }
    } as any
    
    const result = await enhanceAgent.process(input)
    
    expect(result.success).toBe(true)
    expect(result.data.citations).toHaveLength(0)
    expect(result.data.content.selected).toBe('Personal thoughts on leadership')
  })
})
```

## 👁️ Visual Regression Testing

### Screenshot Testing
```typescript
// tests/visual/components.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('should match wizard step designs', async ({ page }) => {
    await page.goto('/wizard')
    
    // Step 1 screenshot
    await expect(page.locator('[data-testid=step-1]')).toBeVisible()
    await expect(page).toHaveScreenshot('wizard-step-1.png')
    
    // Fill form and go to step 2
    await page.fill('[data-testid=content-input]', 'Sample content for visual test')
    await page.click('[data-testid=purpose-dropdown]')
    await page.click('[data-testid=purpose-thought-leadership]')
    await page.click('[data-testid=next-button]')
    
    // Step 2 screenshot
    await expect(page.locator('[data-testid=step-2]')).toBeVisible()
    await expect(page).toHaveScreenshot('wizard-step-2.png')
  })
  
  test('should match dashboard design', async ({ page }) => {
    // Mock data for consistent screenshots
    await page.route('/api/documents', route => {
      route.fulfill({
        json: {
          documents: [
            {
              id: '1',
              title: '🚀 When OpenAI\'s CEO Sam Altman says...',
              type: 'linkedin',
              purpose: 'thought-leadership',
              status: 'published',
              characterCount: 1049,
              createdAt: '2024-08-06T10:30:00Z'
            }
          ]
        }
      })
    })
    
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid=dashboard-content]')).toBeVisible()
    await expect(page).toHaveScreenshot('dashboard-with-content.png')
  })
  
  test('should match responsive designs', async ({ page }) => {
    await page.goto('/')
    
    // Desktop screenshot
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page).toHaveScreenshot('homepage-desktop.png')
    
    // Tablet screenshot
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page).toHaveScreenshot('homepage-tablet.png')
    
    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page).toHaveScreenshot('homepage-mobile.png')
  })
})
```

## 📊 Test Reporting & Analytics

### Test Results Dashboard
```typescript
// tests/reporters/custom-reporter.ts
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter'

class CustomReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    const testData = {
      name: test.title,
      status: result.status,
      duration: result.duration,
      error: result.error?.message,
      timestamp: new Date().toISOString()
    }
    
    // Send to analytics service
    this.sendMetrics(testData)
  }
  
  private async sendMetrics(data: any) {
    try {
      await fetch(`${process.env.TEST_METRICS_ENDPOINT}/test-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.warn('Failed to send test metrics:', error)
    }
  }
}

export default CustomReporter
```

### Coverage Analysis
```bash
# Generate coverage report
npm run test:coverage

# Coverage thresholds in jest.config.js
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  './lib/agents/': {
    branches: 90,
    functions: 95,
    lines: 90,
    statements: 90
  }
}
```

## 🚀 Test Automation & CI/CD

### GitHub Actions Test Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
```

## 📋 Testing Checklist

### Pre-deployment Testing
- [ ] All unit tests pass (>80% coverage)
- [ ] Integration tests validate API endpoints
- [ ] E2E tests cover critical user journeys
- [ ] Visual regression tests confirm UI consistency
- [ ] Performance tests meet Core Web Vitals
- [ ] Security tests validate authentication/authorization
- [ ] AI agent tests confirm pipeline reliability
- [ ] Research attribution tests verify source tracking

### Continuous Testing
- [ ] Automated test runs on every PR
- [ ] Nightly comprehensive test suite
- [ ] Performance regression monitoring
- [ ] Visual change detection
- [ ] Test coverage reporting
- [ ] Flaky test identification and fixes

### Production Monitoring
- [ ] Real user monitoring (RUM)
- [ ] Error tracking and alerting
- [ ] Performance monitoring
- [ ] User journey analytics
- [ ] A/B testing framework
- [ ] Feature flag testing

---

*This testing documentation is connected to:*
- *[architecture.md](./architecture.md) - System architecture for test design*
- *[api.md](./api.md) - API endpoints for integration testing*
- *[agents.md](./agents.md) - AI agent testing strategies*
- *[security.md](./security.md) - Security testing approaches*
- *[deployment.md](./deployment.md) - CI/CD integration*