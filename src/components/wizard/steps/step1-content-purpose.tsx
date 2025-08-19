/**
 * Step 1: Content & Purpose
 * First step of the LinkedIn post creation wizard
 */

'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import { ContentPurpose, ContentGoal } from '@/types/wizard'
import { cn } from '@/lib/utils'
import { analyzeInput } from '@/lib/utils/input-analysis'
import { InputQualityIndicator } from '../input-quality-indicator'

// Purpose options with icons and descriptions
const purposeOptions: Array<{
  value: ContentPurpose
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'share-insights',
    label: 'Share Insights',
    description: 'Share knowledge or expertise',
    icon: '💡'
  },
  {
    value: 'offer-value',
    label: 'Offer Value Exchange',
    description: 'Share free resources, tools, or exclusive insights',
    icon: '🎁'
  },
  {
    value: 'ask-question',
    label: 'Ask Question',
    description: 'Engage audience with questions',
    icon: '❓'
  },
  {
    value: 'share-story',
    label: 'Share Story',
    description: 'Tell a personal or professional story',
    icon: '📖'
  },
  {
    value: 'provide-solutions',
    label: 'Provide Solutions',
    description: 'Solve common industry problems',
    icon: '🔧'
  },
  {
    value: 'celebrate-success',
    label: 'Celebrate Success',
    description: 'Share wins and achievements',
    icon: '🎉'
  }
]

// Goal options with icons and descriptions
const goalOptions: Array<{
  value: ContentGoal
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'increase-engagement',
    label: 'Increase Engagement',
    description: 'Get more likes, comments, shares',
    icon: '💬'
  },
  {
    value: 'generate-leads',
    label: 'Generate Leads',
    description: 'Capture qualified prospects',
    icon: '🎯'
  },
  {
    value: 'build-authority',
    label: 'Build Authority',
    description: 'Establish thought leadership',
    icon: '👑'
  },
  {
    value: 'drive-traffic',
    label: 'Drive Traffic',
    description: 'Direct people to website/content',
    icon: '🔗'
  },
  {
    value: 'build-network',
    label: 'Build Network',
    description: 'Expand professional connections',
    icon: '🤝'
  },
  {
    value: 'get-feedback',
    label: 'Get Feedback',
    description: 'Gather insights and opinions',
    icon: '💭'
  }
]

export function Step1ContentPurpose() {
  const {
    data,
    setContentDescription,
    setContentPurpose,
    setContentGoal,
    setContentUrl,
    validateCurrentStep
  } = useWizardStore()

  const [localDescription, setLocalDescription] = useState(data.step1.description)
  const [localUrl, setLocalUrl] = useState(data.step1.url || '')
  const [descriptionError, setDescriptionError] = useState('')
  const [showUrlField, setShowUrlField] = useState(!!data.step1.url)

  // Real-time input analysis
  const inputAnalysis = useMemo(() => {
    if (localDescription.trim().length < 5) return null
    return analyzeInput(localDescription)
  }, [localDescription])

  // Auto-advance disabled - users must manually click Next
  // useEffect(() => {
  //   const validation = validateCurrentStep()
  //   if (validation.canAutoAdvance && onAutoAdvance) {
  //     // Delay to show completion state
  //     const timer = setTimeout(() => {
  //       onAutoAdvance()
  //     }, 500)
  //     return () => clearTimeout(timer)
  //   }
  // }, [data.step1, validateCurrentStep, onAutoAdvance])

  // Debounced description update with state isolation
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('📝 Step1: Updating description:', localDescription.substring(0, 50) + '...')
      
      // Store current selections before description update
      const currentPurpose = data.step1.purpose
      const currentGoal = data.step1.goal
      
      setContentDescription(localDescription)
      
      // Validate description
      if (localDescription.trim().length === 0) {
        setDescriptionError('Please describe what you want to write about')
      } else if (localDescription.trim().length < 10) {
        setDescriptionError('Please provide more details (at least 10 characters)')
      } else {
        setDescriptionError('')
      }
      
      // Verify selections weren't affected by description update
      setTimeout(() => {
        const updatedData = useWizardStore.getState().data.step1
        if (updatedData.purpose !== currentPurpose || updatedData.goal !== currentGoal) {
          console.warn('⚠️ Description update affected selections!', {
            before: { purpose: currentPurpose, goal: currentGoal },
            after: { purpose: updatedData.purpose, goal: updatedData.goal }
          })
        }
      }, 50)
    }, 300)

    return () => clearTimeout(timer)
  }, [localDescription, setContentDescription, data.step1.purpose, data.step1.goal])

  // Debounced URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentUrl(localUrl || undefined)
    }, 500)

    return () => clearTimeout(timer)
  }, [localUrl, setContentUrl])

  const handlePurposeSelect = (purpose: ContentPurpose) => {
    console.log('🎯 Step1: Purpose selected:', purpose, 'Current goal:', data.step1.goal)
    setContentPurpose(purpose)
    
    // Validate state integrity after update
    setTimeout(() => {
      const { validateStateIntegrity, debugStateConsistency } = useWizardStore.getState()
      debugStateConsistency()
      if (!validateStateIntegrity()) {
        console.warn('⚠️ State integrity issue detected after purpose selection')
      }
    }, 100)
  }

  const handleGoalSelect = (goal: ContentGoal) => {
    console.log('🎯 Step1: Goal selected:', goal, 'Current purpose:', data.step1.purpose)
    setContentGoal(goal)
    
    // Validate state integrity after update
    setTimeout(() => {
      const { validateStateIntegrity, debugStateConsistency } = useWizardStore.getState()
      debugStateConsistency()
      if (!validateStateIntegrity()) {
        console.warn('⚠️ State integrity issue detected after goal selection')
      }
    }, 100)
  }

  const validation = validateCurrentStep()
  const isComplete = validation.isValid

  return (
    <div className="space-y-4">
      {/* Step Header - More compact */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Content & Purpose</h2>
        <p className="mt-1 text-sm text-gray-600">
          Tell us what you want to write about and why
        </p>
      </div>

      {/* Description Field - More compact */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          What do you want to write about? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="e.g., I want to share insights about the future of AI in healthcare, focusing on recent breakthroughs..."
          className={cn(
            "w-full px-3 py-2 border rounded-md resize-none transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "placeholder:text-gray-400 text-sm",
            descriptionError ? "border-red-300" : "border-gray-300 hover:border-gray-400"
          )}
          rows={3}
        />
        {descriptionError && (
          <p className="mt-1 text-sm text-red-600">{descriptionError}</p>
        )}
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">
            {localDescription.length}/500 characters
          </p>
          {!showUrlField && (
            <button
              onClick={() => setShowUrlField(true)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              + Add link
            </button>
          )}
        </div>
      </div>

      {/* Input Quality Indicator - More compact */}
      {inputAnalysis && (
        <InputQualityIndicator 
          analysis={inputAnalysis} 
          className="mb-2" 
        />
      )}

      {/* Purpose & Goal Selection - Compact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Purpose Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Purpose <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {purposeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePurposeSelect(option.value)}
                className={cn(
                  "relative p-2.5 rounded-md border transition-all duration-200",
                  "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-left",
                  data.step1.purpose === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-medium text-sm",
                      data.step1.purpose === option.value ? "text-blue-900" : "text-gray-900"
                    )}>
                      {option.label}
                    </h4>
                    <p className={cn(
                      "text-xs mt-0.5 line-clamp-1",
                      data.step1.purpose === option.value ? "text-blue-700" : "text-gray-600"
                    )}>
                      {option.description}
                    </p>
                  </div>
                  {data.step1.purpose === option.value && (
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Goal Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Goal <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleGoalSelect(option.value)}
                className={cn(
                  "relative p-2.5 rounded-md border transition-all duration-200",
                  "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-left",
                  data.step1.goal === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-medium text-sm",
                      data.step1.goal === option.value ? "text-blue-900" : "text-gray-900"
                    )}>
                      {option.label}
                    </h4>
                    <p className={cn(
                      "text-xs mt-0.5 line-clamp-1",
                      data.step1.goal === option.value ? "text-blue-700" : "text-gray-600"
                    )}>
                      {option.description}
                    </p>
                  </div>
                  {data.step1.goal === option.value && (
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optional URL Field - Collapsible */}
      {showUrlField && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Related URL (optional)
          </label>
          <div className="flex gap-2">
            <input
              id="url"
              type="url"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
            />
            <button
              onClick={() => {
                setShowUrlField(false)
                setLocalUrl('')
                setContentUrl(undefined)
              }}
              className="px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Remove URL"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Add a link to reference or promote in your post
          </p>
        </div>
      )}

      {/* Completion Indicator - Auto-advance disabled */}
    </div>
  )
}