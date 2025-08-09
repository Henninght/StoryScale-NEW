import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for StoryScale
 * Configured for Next.js 14 with comprehensive E2E testing
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    // Show summary in terminal
    ['line']
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global test timeout */
    actionTimeout: 10000,
    
    /* Expect timeout for assertions */
    expect: {
      timeout: 5000,
    },
  },

  /* Global timeout for each test */
  timeout: 30000,

  /* Global timeout for the whole test run */
  globalTimeout: 600000, // 10 minutes

  /* Configure projects for major browsers and devices */
  projects: [
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

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start the server
  },

  /* Global setup and teardown */
  globalSetup: undefined,
  globalTeardown: undefined,

  /* Expect configuration */
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000,
    
    // Configuration for visual comparisons
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'pixel'
    },
    
    toMatchSnapshot: {
      threshold: 0.2
    }
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Directory for test fixtures */
  testDir: './tests/e2e',

  /* Maximum failures before stopping the test run */
  maxFailures: process.env.CI ? 10 : undefined,
});