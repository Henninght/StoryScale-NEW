/**
 * LinkedIn Post Creation Wizard Container
 * Main component that orchestrates the 4-step wizard flow
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import { Step1ContentPurpose } from './steps/step1-content-purpose'
import { Step2AudienceStyle } from './steps/step2-audience-style'
import { Step3ResearchEnhancement } from './steps/step3-research-enhancement'
import { Step4SummaryAction } from './steps/step4-summary-action'
import { GeneratedContentDisplay } from './generated-content-display'
import { cn } from '@/lib/utils'

interface LinkedInPostWizardProps {
  onComplete?: (content: any) => void
  onCancel?: () => void
}

const stepTitles = [
  'Content & Purpose',
  'Audience & Style',
  'Research & Enhancement',
  'Summary & Action'
]

export function LinkedInPostWizard({ onComplete, onCancel }: LinkedInPostWizardProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const {
    metadata,
    generatedContent,
    initializeWizard,
    resetWizard,
    goToStep,
    nextStep,
    previousStep,
    canAdvanceToStep,
    validateStep,
    getCompletionPercentage,
    isStepCompleted,
    applySmartDefaults
  } = useWizardStore()

  // Handle hydration and initialize wizard on mount
  useEffect(() => {
    setIsHydrated(true)
    initializeWizard()
    // Don't apply smart defaults on mount - let user make their own selections
  }, [initializeWizard])

  // Handle content generation completion
  useEffect(() => {
    if (generatedContent && onComplete) {
      onComplete(generatedContent)
    }
  }, [generatedContent, onComplete])

  // Manual navigation handlers
  const handleStepClick = (step: 1 | 2 | 3 | 4) => {
    if (canAdvanceToStep(step)) {
      goToStep(step)
    }
  }

  const handleNext = () => {
    const validation = validateStep(metadata.currentStep)
    if (validation.isValid) {
      nextStep()
    }
  }

  const handlePrevious = () => {
    previousStep()
  }

  const handleCancel = () => {
    resetWizard()
    if (onCancel) {
      onCancel()
    }
  }

  const completionPercentage = isHydrated ? getCompletionPercentage() : 0

  // Render current step component (auto-advance disabled)
  const renderStep = () => {
    // Show generated content if it exists
    if (generatedContent) {
      return <GeneratedContentDisplay />
    }

    switch (metadata.currentStep) {
      case 1:
        return <Step1ContentPurpose />
      case 2:
        return <Step2AudienceStyle />
      case 3:
        return <Step3ResearchEnhancement />
      case 4:
        return <Step4SummaryAction onGenerate={() => {}} />
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create LinkedIn Post</h1>
        <p className="mt-2 text-gray-600">
          Follow our guided wizard to create engaging LinkedIn content in under 15 seconds
        </p>
      </div>

      {/* Progress Bar - Hide when content is generated */}
      {!generatedContent && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {metadata.currentStep} of 4
            </span>
            <span className="text-sm font-medium text-gray-700">
              {completionPercentage}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Indicators - Hide when content is generated */}
      {!generatedContent && (
        <div className="flex items-center justify-between mb-8">
          {stepTitles.map((title, index) => {
          const stepNumber = index + 1 as 1 | 2 | 3 | 4
          const isActive = metadata.currentStep === stepNumber
          const isCompleted = isStepCompleted(stepNumber)
          const canNavigate = canAdvanceToStep(stepNumber)

          return (
            <div key={stepNumber} className="flex-1">
              <button
                onClick={() => handleStepClick(stepNumber)}
                disabled={!canNavigate}
                className={cn(
                  "w-full flex flex-col items-center group",
                  canNavigate ? "cursor-pointer" : "cursor-not-allowed"
                )}
              >
                {/* Step Circle */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : canNavigate
                        ? "bg-white border-2 border-gray-300 text-gray-500 group-hover:border-blue-400"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  
                  {/* Connection Line */}
                  {index < stepTitles.length - 1 && (
                    <div 
                      className={cn(
                        "absolute top-5 left-10 w-full h-0.5 -z-10",
                        isCompleted ? "bg-green-500" : "bg-gray-300"
                      )}
                      style={{ width: 'calc(100vw / 4 - 2.5rem)' }}
                    />
                  )}
                </div>

                {/* Step Title */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center",
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                      ? "text-green-600"
                      : canNavigate
                      ? "text-gray-700 group-hover:text-blue-600"
                      : "text-gray-400"
                  )}
                >
                  {title}
                </span>
              </button>
            </div>
          )
        })}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6 min-h-96">
        {renderStep()}
      </div>

      {/* Navigation Buttons - Hide when content is generated */}
      {!generatedContent && (
        <div className="flex items-center justify-between">
          {/* Cancel/Back */}
          <div>
          {metadata.currentStep === 1 ? (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handlePrevious}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>
          )}
        </div>

        {/* Next/Skip */}
        {metadata.currentStep < 4 && (
          <div className="flex items-center space-x-4">
            {metadata.currentStep === 3 && (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={metadata.currentStep !== 3 && !validateStep(metadata.currentStep).isValid}
              className={cn(
                "flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                metadata.currentStep === 3 || validateStep(metadata.currentStep).isValid
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <span>Next</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        </div>
      )}

    </div>
  )
}