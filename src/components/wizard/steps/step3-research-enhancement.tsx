/**
 * Step 3: Research & Enhancement
 * Third step of the LinkedIn post creation wizard
 * Simplified version without long checkbox list
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import { WizardLanguageSelector } from '../language-selector'
import { cn } from '@/lib/utils'

// Research depth options
const researchDepthOptions: Array<{
  value: 'light' | 'balanced' | 'deep'
  label: string
  description: string
  icon: string
  timeEstimate: string
}> = [
  {
    value: 'light',
    label: 'Light Research',
    description: 'Quick insights and basic facts',
    icon: '⚡',
    timeEstimate: '~5 seconds'
  },
  {
    value: 'balanced',
    label: 'Balanced Research',
    description: 'Moderate depth with relevant data',
    icon: '⚖️',
    timeEstimate: '~10 seconds'
  },
  {
    value: 'deep',
    label: 'Deep Research',
    description: 'Comprehensive analysis and sources',
    icon: '🔬',
    timeEstimate: '~15 seconds'
  }
]

export function Step3ResearchEnhancement() {
  const {
    data,
    setLanguage,
    setEnableResearch,
    setResearchDepth,
    validateCurrentStep
  } = useWizardStore()

  const [showResearchOptions, setShowResearchOptions] = useState(data.step3.enableResearch)

  // Auto-advance disabled - users must manually click Next
  // useEffect(() => {
  //   const validation = validateCurrentStep()
  //   if (validation.canAutoAdvance && onAutoAdvance) {
  //     // Delay to show any changes
  //     const timer = setTimeout(() => {
  //       onAutoAdvance()
  //     }, 800)
  //     return () => clearTimeout(timer)
  //   }
  // }, [data.step3, validateCurrentStep, onAutoAdvance])

  const handleResearchToggle = (enabled: boolean) => {
    setEnableResearch(enabled)
    setShowResearchOptions(enabled)
    
    // If disabling research, reset to balanced depth
    if (!enabled) {
      setResearchDepth('balanced')
    }
  }

  const handleDepthSelect = (depth: 'light' | 'balanced' | 'deep') => {
    setResearchDepth(depth)
  }

  const validation = validateCurrentStep()
  const isComplete = validation.isValid // Always true for Step 3

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Research & Enhancement</h2>
        <p className="mt-1 text-gray-600">
          Configure language and research options for your content
        </p>
      </div>

      {/* Language Selection */}
      <WizardLanguageSelector 
        onLanguageChange={setLanguage}
        showContextHints={true}
        className="mb-6"
      />

      {/* Research Toggle */}
      <div className="border-t pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              AI-Powered Research
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Enhance your content with real-time data and insights
            </p>
          </div>
          <button
            onClick={() => handleResearchToggle(!data.step3.enableResearch)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              data.step3.enableResearch ? "bg-blue-600" : "bg-gray-200"
            )}
            role="switch"
            aria-checked={data.step3.enableResearch}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                data.step3.enableResearch ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Research Benefits */}
        {!data.step3.enableResearch && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              What research adds to your content:
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Current industry trends and statistics</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Relevant examples and case studies</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Fact-checked information and sources</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Competitive insights and market analysis</span>
              </li>
            </ul>
          </div>
        )}

        {/* Research Depth Selection */}
        {showResearchOptions && data.step3.enableResearch && (
          <div className="mt-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-sm font-medium text-gray-700">
              Research Depth
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {researchDepthOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDepthSelect(option.value)}
                  className={cn(
                    "relative p-4 rounded-lg border-2 transition-all duration-200",
                    "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "text-center",
                    data.step3.researchDepth === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <span className="text-2xl block mb-2">{option.icon}</span>
                  <h5 className={cn(
                    "font-medium",
                    data.step3.researchDepth === option.value ? "text-blue-900" : "text-gray-900"
                  )}>
                    {option.label}
                  </h5>
                  <p className={cn(
                    "text-xs mt-1",
                    data.step3.researchDepth === option.value ? "text-blue-700" : "text-gray-600"
                  )}>
                    {option.description}
                  </p>
                  <p className={cn(
                    "text-xs mt-2 font-medium",
                    data.step3.researchDepth === option.value ? "text-blue-600" : "text-gray-500"
                  )}>
                    {option.timeEstimate}
                  </p>
                  {data.step3.researchDepth === option.value && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Research Providers Info */}
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h5 className="font-medium text-blue-900 text-sm">
                    Powered by Advanced Research
                  </h5>
                  <p className="text-xs text-blue-800 mt-1">
                    We use Firecrawl for LinkedIn insights and Tavily for real-time web data to enhance your content with the most relevant and up-to-date information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Configuration:</h4>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            🌐 Language: {data.step3.language.toUpperCase()}
          </span>
          {data.step3.enableResearch ? (
            <>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Research Enabled
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {researchDepthOptions.find(d => d.value === data.step3.researchDepth)?.icon} {data.step3.researchDepth} depth
              </span>
            </>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              ❌ Research Disabled
            </span>
          )}
        </div>
      </div>

      {/* Manual navigation notice */}
    </div>
  )
}