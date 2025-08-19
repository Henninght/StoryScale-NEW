/**
 * Wizard State Management Test - Purpose/Goal Combinations
 * Tests all combinations to ensure no interference
 */

import { ContentPurpose, ContentGoal } from '@/types/wizard'

// All purpose options
const allPurposes: ContentPurpose[] = [
  'share-insights',
  'offer-value',
  'ask-question',
  'share-story',
  'provide-solutions',
  'celebrate-success'
]

// All goal options
const allGoals: ContentGoal[] = [
  'increase-engagement',
  'generate-leads',
  'build-authority',
  'drive-traffic',
  'build-network',
  'get-feedback'
]

/**
 * Test matrix for all purpose/goal combinations
 */
export const testCombinations = allPurposes.flatMap(purpose =>
  allGoals.map(goal => ({ purpose, goal }))
)

/**
 * Expected behavior for each combination
 * Lead generation gets special treatment based on purpose
 */
export const expectedBehavior = {
  // Lead generation combinations with special mapping
  leadGeneration: {
    'share-insights': 'lead-generation',
    'offer-value': 'lead-magnet',
    'ask-question': 'lead-qualification',
    'share-story': 'lead-nurture',
    'provide-solutions': 'lead-generation',
    'celebrate-success': 'lead-nurture'
  },
  
  // Regular combinations maintain original purpose mapping
  regular: {
    'share-insights': 'thought-leadership',
    'offer-value': 'value',
    'ask-question': 'question',
    'share-story': 'value',
    'provide-solutions': 'thought-leadership',
    'celebrate-success': 'value'
  }
}

/**
 * State integrity test cases
 */
export const stateIntegrityTests = [
  {
    name: 'Purpose selection preserves goal',
    steps: [
      { action: 'setGoal', value: 'generate-leads' },
      { action: 'setPurpose', value: 'share-insights' },
      { verify: 'goal', expected: 'generate-leads' }
    ]
  },
  {
    name: 'Goal selection preserves purpose',
    steps: [
      { action: 'setPurpose', value: 'offer-value' },
      { action: 'setGoal', value: 'build-authority' },
      { verify: 'purpose', expected: 'offer-value' }
    ]
  },
  {
    name: 'Description update preserves selections',
    steps: [
      { action: 'setPurpose', value: 'ask-question' },
      { action: 'setGoal', value: 'get-feedback' },
      { action: 'setDescription', value: 'Test description' },
      { verify: 'purpose', expected: 'ask-question' },
      { verify: 'goal', expected: 'get-feedback' }
    ]
  },
  {
    name: 'URL update preserves selections',
    steps: [
      { action: 'setPurpose', value: 'share-story' },
      { action: 'setGoal', value: 'drive-traffic' },
      { action: 'setUrl', value: 'https://example.com' },
      { verify: 'purpose', expected: 'share-story' },
      { verify: 'goal', expected: 'drive-traffic' }
    ]
  },
  {
    name: 'Rapid state changes maintain consistency',
    steps: [
      { action: 'setPurpose', value: 'provide-solutions' },
      { action: 'setGoal', value: 'build-network' },
      { action: 'setPurpose', value: 'celebrate-success' },
      { action: 'setGoal', value: 'increase-engagement' },
      { verify: 'purpose', expected: 'celebrate-success' },
      { verify: 'goal', expected: 'increase-engagement' }
    ]
  }
]

/**
 * Performance stress tests
 */
export const stressTests = [
  {
    name: 'Multiple rapid purpose changes',
    iterations: 10,
    action: 'setPurpose',
    values: allPurposes
  },
  {
    name: 'Multiple rapid goal changes',
    iterations: 10,
    action: 'setGoal',
    values: allGoals
  },
  {
    name: 'Alternating purpose/goal updates',
    iterations: 20,
    pattern: 'alternate'
  }
]

/**
 * Edge cases to test
 */
export const edgeCases = [
  {
    name: 'Empty string selections',
    purpose: '',
    goal: '',
    shouldBeValid: false
  },
  {
    name: 'Undefined selections',
    purpose: undefined,
    goal: undefined,
    shouldBeValid: false
  },
  {
    name: 'Mixed valid/invalid selections',
    purpose: 'share-insights',
    goal: '',
    shouldBeValid: false
  },
  {
    name: 'Same purpose and goal values (should still work)',
    purpose: 'share-insights',
    goal: 'build-authority',
    shouldBeValid: true
  }
]

/**
 * Test runner utilities
 */
export const testUtils = {
  logTestResult: (testName: string, passed: boolean, details?: any) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${testName}`)
    if (details) {
      console.log('  Details:', details)
    }
  },

  validateStateConsistency: (currentState: any, expectedState: any) => {
    const purposeMatch = currentState.purpose === expectedState.purpose
    const goalMatch = currentState.goal === expectedState.goal
    
    return {
      passed: purposeMatch && goalMatch,
      details: {
        purpose: { current: currentState.purpose, expected: expectedState.purpose, match: purposeMatch },
        goal: { current: currentState.goal, expected: expectedState.goal, match: goalMatch }
      }
    }
  },

  measurePerformance: (testName: string, testFunction: () => void) => {
    const startTime = performance.now()
    testFunction()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.log(`⏱️  ${testName}: ${duration.toFixed(2)}ms`)
    return duration
  }
}

export default {
  testCombinations,
  expectedBehavior,
  stateIntegrityTests,
  stressTests,
  edgeCases,
  testUtils
}