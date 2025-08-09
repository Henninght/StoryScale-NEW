# 🧪 StoryScale Testing Guide

## Understanding Our Test Strategy

This guide explains the different types of tests in StoryScale, when to use each type, and how they work together to ensure code quality and reliability.

---

## 📊 Testing Pyramid Overview

```
         /\
        /E2E\        ← Slowest, Most Expensive (5%)
       /------\
      /Security\     ← Critical Security Checks (10%)
     /----------\
    /Integration \   ← Service Integration (25%)
   /--------------\
  /   Unit Tests   \ ← Fastest, Most Numerous (60%)
 /------------------\
```

---

## 🎯 Test Types Explained

### 1. Unit Tests (`npm run test:unit`)

**What They Test:**
- Individual functions and methods in isolation
- Pure business logic without external dependencies
- React components without API calls
- Utility functions and helpers
- Data transformations and calculations

**When to Use:**
- Testing a single function or class method
- Validating business logic rules
- Testing React component rendering
- Checking data transformation logic
- Verifying error handling in isolated code

**Example Scenarios:**
```typescript
// Testing a utility function
describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })
})

// Testing a React component
describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

**Key Characteristics:**
- ✅ Run in milliseconds
- ✅ No network calls or database access
- ✅ Use mocked dependencies
- ✅ Easy to debug and maintain
- ✅ Should make up 60% of tests

**Files:** `__tests__/**/*.test.ts` (excluding api/, integration/, security/)

---

### 2. Integration Tests (`npm run test:integration`)

**What They Test:**
- Multiple components working together
- Database operations with mocked database
- API client interactions
- Service layer integrations
- Cache layer functionality
- Message queue interactions

**When to Use:**
- Testing data flow between services
- Verifying database queries work correctly
- Testing cache hit/miss scenarios
- Validating API client behavior
- Testing middleware chains

**Example Scenarios:**
```typescript
// Testing database operations
describe('UserService', () => {
  it('should create and retrieve a user', async () => {
    const user = await userService.create({ email: 'test@example.com' })
    const retrieved = await userService.findById(user.id)
    expect(retrieved.email).toBe('test@example.com')
  })
})

// Testing cache integration
describe('CacheService', () => {
  it('should return cached data on second request', async () => {
    const data1 = await fetchWithCache('key', expensiveOperation)
    const data2 = await fetchWithCache('key', expensiveOperation)
    expect(expensiveOperation).toHaveBeenCalledTimes(1)
  })
})
```

**Key Characteristics:**
- ✅ Test multiple components together
- ✅ May use test databases or in-memory stores
- ✅ Mock external APIs but test internal integrations
- ✅ Run in seconds
- ✅ Should make up 25% of tests

**Files:** `__tests__/integration/**/*.test.ts`

---

### 3. API Tests (`npm run test:api`)

**What They Test:**
- HTTP endpoint behavior
- Request/response validation
- API authentication and authorization
- Rate limiting and throttling
- Error response formats
- Content negotiation
- CORS and headers

**When to Use:**
- Testing new API endpoints
- Validating request body schemas
- Testing authentication flows
- Verifying error handling
- Testing pagination and filtering
- Validating API versioning

**Example Scenarios:**
```typescript
// Testing API endpoint
describe('POST /api/generate', () => {
  it('should generate content with valid request', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ content: 'Test', type: 'linkedin' })
      .expect(200)
    
    expect(response.body).toHaveProperty('content')
    expect(response.body).toHaveProperty('metadata')
  })

  it('should return 400 for invalid request', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ invalid: 'data' })
      .expect(400)
    
    expect(response.body.error).toBe('Invalid request')
  })
})
```

**Key Characteristics:**
- ✅ Test full HTTP request/response cycle
- ✅ Validate status codes and headers
- ✅ Test authentication and authorization
- ✅ Mock external services
- ✅ Focus on API contract testing

**Files:** `__tests__/app/api/**/*.test.ts`

---

### 4. End-to-End Tests (`npm run test:e2e`)

**What They Test:**
- Complete user workflows
- Multi-page interactions
- Browser compatibility
- JavaScript execution in browser
- Form submissions and validations
- File uploads and downloads
- Real browser behavior

**When to Use:**
- Testing critical user journeys
- Validating multi-step processes
- Testing browser-specific features
- Regression testing before releases
- Testing responsive design
- Validating third-party integrations

**Example Scenarios:**
```typescript
// Testing content creation workflow
test('should create LinkedIn post', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Create Content')
  await page.selectOption('#contentType', 'linkedin')
  await page.fill('#description', 'AI startup announcement')
  await page.click('text=Generate')
  await expect(page.locator('.generated-content')).toBeVisible()
  await expect(page.locator('.generated-content')).toContainText('AI')
})
```

**Key Characteristics:**
- ✅ Test in real browsers
- ✅ Simulate actual user behavior
- ✅ Test JavaScript-heavy interactions
- ✅ Catch visual regressions
- ❌ Slowest tests (minutes)
- ❌ Can be flaky
- ✅ Should make up 5% of tests

**Files:** `tests/e2e/**/*.spec.ts`

---

### 5. Security Tests (`npm run test:security`)

**What They Test:**
- SQL injection vulnerabilities
- XSS attack vectors
- CSRF protection
- Authentication bypass attempts
- Authorization vulnerabilities
- Rate limiting enforcement
- Input sanitization
- Session security
- API key exposure
- OWASP Top 10 compliance

**When to Use:**
- Before deploying to production
- After adding new input fields
- When implementing authentication
- After API changes
- During security audits
- When handling sensitive data

**Example Scenarios:**
```typescript
// Testing SQL injection prevention
describe('SQL Injection Prevention', () => {
  it('should sanitize malicious input', async () => {
    const maliciousInput = "'; DROP TABLE users; --"
    const response = await request(app)
      .post('/api/search')
      .send({ query: maliciousInput })
      .expect(200)
    
    // Should return results, not execute SQL
    expect(response.body.error).toBeUndefined()
  })
})

// Testing XSS prevention
describe('XSS Prevention', () => {
  it('should escape HTML in user content', async () => {
    const xssPayload = '<script>alert("XSS")</script>'
    const response = await request(app)
      .post('/api/content')
      .send({ text: xssPayload })
      .expect(200)
    
    expect(response.body.text).not.toContain('<script>')
    expect(response.body.text).toContain('&lt;script&gt;')
  })
})
```

**Key Characteristics:**
- ✅ Test security vulnerabilities
- ✅ Validate input sanitization
- ✅ Check authentication/authorization
- ✅ Test rate limiting
- ✅ Critical for production safety
- ✅ Should make up 10% of tests

**Files:** `__tests__/security/**/*.test.ts`

---

## 🎮 When to Run Each Test Type

### During Development

```bash
# While coding a feature
npm run test:watch          # Runs related tests automatically

# Before committing
npm run test:unit          # Quick validation (< 10 seconds)

# After completing a feature
npm run test:integration   # Verify integrations work (< 30 seconds)
```

### Before Pull Request

```bash
# Run full test suite
npm test                   # All unit and integration tests

# Check your API changes
npm run test:api          # Verify API contracts

# If you modified authentication or inputs
npm run test:security     # Security validation
```

### Before Deployment

```bash
# Complete validation
npm run test:coverage     # Ensure coverage targets met
npm run test:e2e         # Test critical user paths
npm run test:security    # Final security check
```

---

## 🔄 Test Execution Order

### Local Development Flow
```
1. Unit Tests (instant feedback)
   ↓
2. Integration Tests (service validation)
   ↓
3. API Tests (endpoint verification)
   ↓
4. Manual Testing (developer verification)
```

### CI/CD Pipeline Flow
```
1. Linting & Type Checking
   ↓
2. Unit Tests (parallel)
   ↓
3. Integration Tests (parallel)
   ↓
4. API Tests
   ↓
5. Security Tests
   ↓
6. E2E Tests (critical paths only)
   ↓
7. Performance Tests (main branch only)
```

---

## 📈 Coverage Guidelines

### What Coverage Means

- **Line Coverage**: Percentage of code lines executed
- **Branch Coverage**: Percentage of if/else branches tested
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

### Coverage Targets by Type

| Test Type | Line | Branch | Function | Statement |
|-----------|------|---------|----------|-----------|
| API Routes | 80% | 80% | 80% | 80% |
| Gateway Logic | 70% | 70% | 70% | 70% |
| Core Libraries | 75% | 75% | 75% | 75% |
| UI Components | 60% | 50% | 60% | 60% |
| Utilities | 90% | 85% | 90% | 90% |

### When Coverage Doesn't Matter

- Generated code (migrations, configs)
- Third-party integrations
- Development tools
- Test files themselves
- Type definitions

---

## 🏃 Performance Expectations

### Test Execution Times

| Test Type | Single Test | Full Suite | Timeout |
|-----------|------------|------------|---------|
| Unit | < 50ms | < 10s | 5s |
| Integration | < 500ms | < 30s | 10s |
| API | < 200ms | < 20s | 10s |
| E2E | < 10s | < 5m | 30s |
| Security | < 1s | < 1m | 15s |

---

## 🐛 Debugging Tests

### When Tests Fail

1. **Check the error message** - Often indicates the exact issue
2. **Run single test** - `npm test -- --testNamePattern="specific test"`
3. **Add console.logs** - Temporary debugging
4. **Use debugger** - `npm run test:debug`
5. **Check mocks** - Ensure mocks match reality
6. **Verify environment** - Check `.env.test` variables

### Common Issues and Solutions

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run `npm install` |
| "Timeout exceeded" | Increase timeout or check async code |
| "Mock not working" | Clear jest cache: `npm run test:clear` |
| "Snapshot failed" | Update with `npm test -- -u` |
| "Port already in use" | Kill process or change port |
| "Database connection failed" | Check test database is running |

---

## 📚 Best Practices

### DO ✅

- Write tests before or with code (TDD/BDD)
- Keep tests simple and focused
- Use descriptive test names
- Test behavior, not implementation
- Mock external dependencies
- Clean up after tests
- Use beforeEach/afterEach for setup
- Group related tests with describe blocks

### DON'T ❌

- Test third-party libraries
- Write brittle tests that break with refactoring
- Use real API keys or production data
- Leave console.logs in tests
- Skip tests without fixing them
- Test private methods directly
- Make tests dependent on each other
- Use arbitrary timeouts

---

## 🎯 Quick Decision Tree

```
Need to test something?
         │
         ├─ Is it a single function/component?
         │   └─ Write a UNIT TEST
         │
         ├─ Does it involve multiple services?
         │   └─ Write an INTEGRATION TEST
         │
         ├─ Is it an HTTP endpoint?
         │   └─ Write an API TEST
         │
         ├─ Is it a user workflow?
         │   └─ Write an E2E TEST
         │
         └─ Is it a security concern?
             └─ Write a SECURITY TEST
```

---

## 💡 Testing Philosophy

> "Test the behavior users care about, not the implementation details"

Our tests should:
1. **Give confidence** that the code works
2. **Catch bugs** before users do
3. **Document** how the system works
4. **Enable refactoring** without fear
5. **Run fast** enough to not slow development

Remember: The goal isn't 100% coverage, it's confidence in shipping quality code.

---

## 📞 Getting Help

- **Test Failures**: Check error messages, then ask team
- **Writing Tests**: Look for similar existing tests
- **Mocking**: See `__mocks__/` directory for examples
- **Coverage**: Run `npm run test:coverage` for reports
- **CI/CD Issues**: Check GitHub Actions logs

---

*Last updated: 2024 | StoryScale Testing Guide v1.0*