# API Test Documentation

## Overview
Comprehensive test suites for StoryScale API endpoints with 80%+ code coverage.

## Test Files

### 1. Generate Endpoint Tests
**File:** `__tests__/app/api/generate/route.test.ts`

**Coverage Areas:**
- ✅ Request validation (missing fields, invalid data types)
- ✅ Content generation with various parameters
- ✅ Language routing (English and Norwegian)
- ✅ Research integration
- ✅ Cache behavior (hit/miss scenarios)
- ✅ Error handling (gateway errors, rate limiting, budget limits)
- ✅ Performance metrics
- ✅ Cost tracking
- ✅ Model fallback scenarios
- ✅ Gateway singleton pattern

### 2. Health Check Endpoint Tests
**File:** `__tests__/app/api/health/route.test.ts`

**Coverage Areas:**
- ✅ Healthy status reporting
- ✅ Degraded status detection
- ✅ Unhealthy status handling
- ✅ Service status checks (database, AI providers, payment)
- ✅ Response format validation
- ✅ Performance monitoring
- ✅ Error logging
- ✅ Database query optimization
- ✅ HTTP status codes
- ✅ Monitoring tool integration

## Running Tests

### Run All API Tests
```bash
npm run test:api
```

### Run with Coverage
```bash
npm run test:api -- --coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/app/api/generate/route.test.ts
```

### Run with Watch Mode
```bash
npm test -- --watch __tests__/app/api/
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Utilities

### Mock Factories (`__tests__/setup.ts`)

**Available Mocks:**
- `mockIntelligentGateway()` - Mock the gateway for testing
- `createMockContentRequest()` - Create test content requests
- `createMockGatewayResponse()` - Create gateway responses
- `mockSupabaseClient` - Mock Supabase operations
- `mockOpenAIClient` - Mock OpenAI API calls
- `mockAnthropicClient` - Mock Anthropic API calls

**Error Simulators:**
- `mockRateLimitError()` - Simulate rate limiting
- `mockBudgetExceededError()` - Simulate budget exceeded
- `mockTimeout()` - Simulate request timeout

### Usage Example
```typescript
import { 
  mockIntelligentGateway,
  createMockContentRequest 
} from '../../../setup'

describe('API Test', () => {
  let gateway = mockIntelligentGateway()
  
  it('should handle request', async () => {
    const request = createMockContentRequest({
      content: 'Test content',
      language: 'no'
    })
    
    gateway.processRequest.mockResolvedValueOnce({
      content: 'Generated content',
      metadata: { /* ... */ }
    })
    
    // Test implementation
  })
})
```

## Coverage Requirements

### Target Coverage: 80%
- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

### Current Coverage Status
Run `npm run test:coverage` to see current coverage metrics.

## Test Patterns

### 1. Request Validation Testing
```typescript
it('should reject invalid requests', async () => {
  const request = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify({ /* invalid data */ })
  })
  
  const response = await POST(request)
  expect(response.status).toBe(400)
})
```

### 2. Mock External Services
```typescript
beforeEach(() => {
  mockGateway.processRequest.mockResolvedValue({
    content: 'Mock content',
    metadata: { /* ... */ }
  })
})
```

### 3. Error Scenario Testing
```typescript
it('should handle rate limiting', async () => {
  mockGateway.processRequest.mockRejectedValueOnce(
    new Error('Rate limit exceeded')
  )
  
  const response = await POST(request)
  expect(response.status).toBe(500)
})
```

### 4. Performance Testing
```typescript
it('should complete within time limit', async () => {
  const startTime = Date.now()
  const response = await POST(request)
  const duration = Date.now() - startTime
  
  expect(duration).toBeLessThan(15000) // 15 seconds
})
```

## CI/CD Integration

### GitHub Actions Configuration
```yaml
- name: Run API Tests
  run: npm run test:api -- --ci --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: api-tests
```

## Troubleshooting

### Common Issues

1. **Mock Not Working**
   - Ensure mocks are imported before the module under test
   - Clear mocks between tests: `jest.clearAllMocks()`

2. **Async Test Failures**
   - Use `async/await` properly
   - Increase timeout if needed: `jest.setTimeout(10000)`

3. **Coverage Not Meeting Target**
   - Check for untested error paths
   - Add tests for edge cases
   - Test all conditional branches

## Best Practices

1. **Test Organization**
   - Group related tests with `describe` blocks
   - Use descriptive test names
   - Follow AAA pattern: Arrange, Act, Assert

2. **Mock Management**
   - Reset mocks in `beforeEach`
   - Use specific mock values for each test
   - Avoid mock pollution between tests

3. **Assertion Quality**
   - Test both success and failure cases
   - Verify specific error messages
   - Check response structure, not just status

4. **Performance**
   - Keep tests fast (< 5 seconds each)
   - Use minimal test data
   - Avoid unnecessary async operations

## Future Improvements

- [ ] Add integration tests with real services
- [ ] Implement contract testing
- [ ] Add load testing for API endpoints
- [ ] Create visual regression tests for responses
- [ ] Add mutation testing for better coverage quality