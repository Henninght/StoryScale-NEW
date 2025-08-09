# StoryScale E2E Tests

This directory contains end-to-end tests for StoryScale using Playwright.

## Setup

1. **Install Playwright browsers**:
   ```bash
   npm run playwright:install
   ```

2. **Install system dependencies** (Linux only):
   ```bash
   npm run playwright:install-deps
   ```

## Running Tests

### Basic Commands

- **Run all E2E tests**: `npm run test:e2e`
- **Run tests with UI**: `npm run test:e2e:ui`
- **Run tests in headed mode**: `npm run test:e2e:headed`
- **Debug tests**: `npm run test:e2e:debug`

### Browser-specific Tests

- **Chrome**: `npm run test:e2e:chrome`
- **Firefox**: `npm run test:e2e:firefox`
- **Safari**: `npm run test:e2e:webkit`
- **Mobile**: `npm run test:e2e:mobile`

### CI/CD

- **CI mode**: `npm run test:e2e:ci`

## Test Structure

### Test Files

- `homepage.spec.ts` - Basic homepage functionality
- `content-wizard.spec.ts` - Content creation wizard flow
- `auth.spec.ts` - Authentication and guest mode
- `helpers/test-utils.ts` - Shared utilities and page objects

### Page Object Pattern

Tests use the Page Object Model pattern with helper classes:

```typescript
import { NavigationHelpers, WizardHelpers } from './helpers/test-utils';

// Navigate to wizard
await NavigationHelpers.goToWizard(page);

// Use wizard functionality
await WizardHelpers.selectLanguage(page, 'no');
await WizardHelpers.generateContent(page);
```

## Test Categories

### Homepage Tests
- Basic page loading
- Navigation functionality
- Responsive design
- API endpoint availability

### Content Wizard Tests
- Wizard step navigation
- Language selection
- Research options
- Content generation
- Form interactions
- Mobile compatibility

### Authentication Tests
- Guest mode functionality
- Session management
- Storage handling
- Progressive enhancement
- Future auth preparation

## Configuration

Configuration is in `/playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Screenshots**: On failure
- **Videos**: On retry
- **Traces**: On first retry

## Development Server

Tests automatically start the Next.js development server on `localhost:3000`. Make sure no other service is running on port 3000.

## Test Data and Selectors

### Data Test IDs

For reliable tests, add `data-testid` attributes to components:

```jsx
<button data-testid="generate-content-button">Generate Content</button>
```

Use in tests:
```typescript
await page.click('[data-testid="generate-content-button"]');
```

### Language Selection

Tests handle multiple possible selectors for language selectors:

```typescript
await LanguageHelpers.selectLanguage(page, 'no'); // Norwegian
await LanguageHelpers.selectLanguage(page, 'en'); // English
```

## Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```

This opens Playwright Inspector for step-by-step debugging.

### UI Mode
```bash
npm run test:e2e:ui
```

Interactive mode with test runner UI.

### Screenshots and Videos

- Screenshots saved to `test-results/`
- Videos saved on test failure
- Traces available for failed tests

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { NavigationHelpers, CommonAssertions } from './helpers/test-utils';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await NavigationHelpers.goHome(page);
    await CommonAssertions.expectPageTitle(page, 'Expected Title');
    
    // Test actions
    await page.click('button');
    
    // Assertions
    await expect(page.locator('result')).toBeVisible();
  });
});
```

### Using Page Objects

```typescript
class MyFeaturePage {
  constructor(private page: Page) {}
  
  async doSomething() {
    await this.page.click('[data-testid="action-button"]');
  }
  
  async expectResult() {
    await expect(this.page.locator('[data-testid="result"]')).toBeVisible();
  }
}
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** when navigating between pages
3. **Use Page Object Model** for reusable functionality
4. **Test across different viewports** (mobile, tablet, desktop)
5. **Handle async operations** with proper waits
6. **Clean up state** between tests
7. **Use descriptive test names** and group related tests

## Troubleshooting

### Common Issues

1. **Port 3000 in use**: Stop other services using port 3000
2. **Browsers not installed**: Run `npm run playwright:install`
3. **Tests timeout**: Increase timeout in config or use `waitForLoadState`
4. **Element not found**: Check selector or add proper waits

### Debugging Failed Tests

1. Check screenshots in `test-results/`
2. View video recordings
3. Use trace viewer for detailed analysis
4. Run single test with `--debug` flag

## Integration with CI/CD

Tests are configured for GitHub Actions:

```yaml
- name: Run E2E tests
  run: npm run test:e2e:ci
```

Uses specific reporter and optimized settings for CI environment.