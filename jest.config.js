const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup files to run after the test framework is installed
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    
    // Handle image imports
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
    
    // Handle module aliases (matches tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/lib/utils/$1',
    
    // Mock external dependencies
    '@supabase/supabase-js': '<rootDir>/__mocks__/@supabase/supabase-js.ts',
    'openai': '<rootDir>/__mocks__/openai.ts',
    '@anthropic-ai/sdk': '<rootDir>/__mocks__/@anthropic-ai/sdk.ts',
  },
  
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage configuration
  collectCoverage: false, // Set to true when running coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/app/**/layout.{js,jsx,ts,tsx}',
    '!src/app/**/page.{js,jsx,ts,tsx}',
    '!src/app/**/loading.{js,jsx,ts,tsx}',
    '!src/app/**/error.{js,jsx,ts,tsx}',
    '!src/app/**/not-found.{js,jsx,ts,tsx}',
    '!src/types/**/*',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    // API routes - higher coverage requirement
    'src/app/api/**/*.{ts,tsx}': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Gateway - moderate coverage requirement
    'src/lib/gateway/**/*.{ts,tsx}': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Core libraries - high coverage requirement
    'src/lib/agents/**/*.{ts,tsx}': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    'src/lib/cache/**/*.{ts,tsx}': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    'src/lib/monitoring/**/*.{ts,tsx}': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Coverage reporters
  coverageReporters: ['json', 'lcov', 'text', 'text-summary', 'html'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/out/',
  ],
  
  // Module paths for absolute imports
  modulePaths: ['<rootDir>'],
  
  // Roots for test files
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  
  // Verbose output
  verbose: true,
  
  // Bail on first test failure (useful in CI)
  bail: false,
  
  // Maximum worker threads
  maxWorkers: '50%',
  
  // Clear mocks automatically between tests
  clearMocks: true,
  
  // Restore mocks automatically between tests
  restoreMocks: true,
  
  // Reset mocks automatically between tests
  resetMocks: false,
  
  // Reset modules for each test
  resetModules: false,
  
  // Timers
  fakeTimers: {
    enableGlobally: false,
  },
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'preserve',
        allowJs: true,
      },
    },
  },
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Snapshot serializers
  snapshotSerializers: [],
  
  // Test timeout
  testTimeout: 10000,
  
  // Setup timeout (removed setupFilesAfterEnvTimeout - not valid in Jest 29)
  // setupFilesAfterEnvTimeout: 10000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)