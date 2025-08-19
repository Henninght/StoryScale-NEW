/**
 * Wizard State Management Test Page
 * Interactive test page to verify state management fixes
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import { ContentPurpose, ContentGoal } from '@/types/wizard'
import { testCombinations, stateIntegrityTests, testUtils } from '@/test/wizard-state-combinations'

export default function WizardStateTestPage() {
  const {
    data,
    setContentPurpose,
    setContentGoal,
    setContentDescription,
    setContentUrl,
    validateStateIntegrity,
    debugStateConsistency,
    initializeWizard
  } = useWizardStore()

  const [testResults, setTestResults] = useState<any[]>([])
  const [currentTest, setCurrentTest] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)

  const addTestResult = (name: string, passed: boolean, details?: any) => {
    setTestResults(prev => [...prev, { name, passed, details, timestamp: Date.now() }])
  }

  const clearResults = () => {
    setTestResults([])
    initializeWizard()
  }

  const runBasicStateTest = async () => {
    setIsRunning(true)
    setCurrentTest('Basic State Isolation Test')
    
    // Initialize clean state
    initializeWizard()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Test 1: Purpose selection doesn't affect goal
    setContentGoal('generate-leads')
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const goalBeforePurpose = useWizardStore.getState().data.step1.goal
    
    setContentPurpose('share-insights')
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const goalAfterPurpose = useWizardStore.getState().data.step1.goal
    const purposeAfter = useWizardStore.getState().data.step1.purpose
    
    addTestResult(
      'Purpose selection preserves goal',
      goalBeforePurpose === goalAfterPurpose && goalAfterPurpose === 'generate-leads',
      { goalBefore: goalBeforePurpose, goalAfter: goalAfterPurpose, purpose: purposeAfter }
    )
    
    // Test 2: Goal selection doesn't affect purpose
    const purposeBeforeGoal = useWizardStore.getState().data.step1.purpose
    
    setContentGoal('build-authority')
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const purposeAfterGoal = useWizardStore.getState().data.step1.purpose
    const goalAfter = useWizardStore.getState().data.step1.goal
    
    addTestResult(
      'Goal selection preserves purpose',
      purposeBeforeGoal === purposeAfterGoal && purposeAfterGoal === 'share-insights',
      { purposeBefore: purposeBeforeGoal, purposeAfter: purposeAfterGoal, goal: goalAfter }
    )
    
    setIsRunning(false)
    setCurrentTest('')
  }

  const runAllCombinationsTest = async () => {
    setIsRunning(true)
    setCurrentTest('All Purpose/Goal Combinations Test')
    
    let passedCombinations = 0
    
    for (const { purpose, goal } of testCombinations) {
      initializeWizard()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Set purpose first
      setContentPurpose(purpose)
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Set goal second
      setContentGoal(goal)
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Verify both selections persisted
      const finalState = useWizardStore.getState().data.step1
      const passed = finalState.purpose === purpose && finalState.goal === goal
      
      if (passed) {
        passedCombinations++
      } else {
        addTestResult(
          `Combination: ${purpose} + ${goal}`,
          false,
          { expected: { purpose, goal }, actual: finalState }
        )
      }
    }
    
    addTestResult(
      `All Combinations Test (${testCombinations.length} total)`,
      passedCombinations === testCombinations.length,
      { passed: passedCombinations, total: testCombinations.length }
    )
    
    setIsRunning(false)
    setCurrentTest('')
  }

  const runStressTest = async () => {
    setIsRunning(true)
    setCurrentTest('Stress Test - Rapid State Changes')
    
    initializeWizard()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const startTime = performance.now()
    
    // Rapid alternating changes
    for (let i = 0; i < 20; i++) {
      const purpose = testCombinations[i % testCombinations.length].purpose
      const goal = testCombinations[i % testCombinations.length].goal
      
      setContentPurpose(purpose)
      setContentGoal(goal)
      
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const endTime = performance.now()
    const finalState = useWizardStore.getState().data.step1
    const hasValidState = finalState.purpose !== '' && finalState.goal !== ''
    
    addTestResult(
      'Stress Test - Rapid Changes',
      hasValidState,
      { 
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        finalState,
        stateIntegrityPassed: validateStateIntegrity()
      }
    )
    
    setIsRunning(false)
    setCurrentTest('')
  }

  const runDescriptionInterferenceTest = async () => {
    setIsRunning(true)
    setCurrentTest('Description Interference Test')
    
    initializeWizard()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Set selections first
    setContentPurpose('offer-value')
    setContentGoal('generate-leads')
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const selectionsBeforeDescription = {
      purpose: useWizardStore.getState().data.step1.purpose,
      goal: useWizardStore.getState().data.step1.goal
    }
    
    // Update description multiple times
    for (let i = 0; i < 5; i++) {
      setContentDescription(`Test description ${i} - testing interference`)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    const selectionsAfterDescription = {
      purpose: useWizardStore.getState().data.step1.purpose,
      goal: useWizardStore.getState().data.step1.goal
    }
    
    const selectionsPreserved = 
      selectionsBeforeDescription.purpose === selectionsAfterDescription.purpose &&
      selectionsBeforeDescription.goal === selectionsAfterDescription.goal
    
    addTestResult(
      'Description updates preserve selections',
      selectionsPreserved,
      { before: selectionsBeforeDescription, after: selectionsAfterDescription }
    )
    
    setIsRunning(false)
    setCurrentTest('')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Wizard State Management Test Suite
        </h1>
        
        {/* Current State Display */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Wizard State</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Purpose:</label>
              <p className="text-lg font-mono">{data.step1.purpose || 'none'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Goal:</label>
              <p className="text-lg font-mono">{data.step1.goal || 'none'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description Length:</label>
              <p className="text-lg font-mono">{data.step1.description.length} chars</p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={runBasicStateTest}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Basic State Isolation Test
            </button>
            
            <button
              onClick={runAllCombinationsTest}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              All Combinations Test
            </button>
            
            <button
              onClick={runStressTest}
              disabled={isRunning}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Stress Test
            </button>
            
            <button
              onClick={runDescriptionInterferenceTest}
              disabled={isRunning}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Description Interference Test
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={clearResults}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Clear Results
            </button>
            
            <button
              onClick={debugStateConsistency}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Debug State (Check Console)
            </button>
          </div>

          {currentTest && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">
                Running: <strong>{currentTest}</strong>
                <span className="ml-2 animate-pulse">...</span>
              </p>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a test button to begin.</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border-l-4 ${
                    result.passed
                      ? 'bg-green-50 border-green-400'
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {result.passed ? '✅' : '❌'} {result.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}