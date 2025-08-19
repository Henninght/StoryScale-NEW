/**
 * Step 3: Research & Enhancement
 * Third step of the LinkedIn post creation wizard
 * Simplified version without long checkbox list
 */

'use client'

import React, { useState } from 'react'
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
    <div className="space-y-4">
      {/* Step Header - More compact */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Research & Enhancement</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure language and research options for your content
        </p>
      </div>

      {/* Horizontal Layout - Language + Research */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Language Selection - Compact */}
          <div>
            <WizardLanguageSelector 
              onLanguageChange={setLanguage}
              showContextHints={false}
              className=""
            />
          </div>

          {/* Research Toggle - Inline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-semibold text-gray-900">
                  AI Research
                </label>
                <p className="text-xs text-gray-600 mt-0.5">
                  Add real-time data & insights
                  <button
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    title="Research adds current trends, statistics, examples, and fact-checked information"
                  >
                    ℹ️
                  </button>
                </p>
              </div>
              <button
                onClick={() => handleResearchToggle(!data.step3.enableResearch)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
                  data.step3.enableResearch ? "bg-blue-600" : "bg-gray-300"
                )}
                role="switch"
                aria-checked={data.step3.enableResearch}
              >
                <span
                  className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    data.step3.enableResearch ? "translate-x-5" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Research Depth Selection - Compact */}
            {data.step3.enableResearch && (
              <div className="mt-2">
                <label className="text-xs font-medium text-gray-700 mb-2 block">
                  Research Depth
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {researchDepthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleDepthSelect(option.value)}
                      className={cn(
                        "p-2 rounded-md border text-center transition-all duration-200",
                        "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                        data.step3.researchDepth === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      <div className="text-sm">{option.icon}</div>
                      <div className={cn(
                        "text-xs font-medium mt-1",
                        data.step3.researchDepth === option.value ? "text-blue-900" : "text-gray-900"
                      )}>
                        {option.label.replace(' Research', '')}
                      </div>
                      <div className={cn(
                        "text-xs mt-0.5",
                        data.step3.researchDepth === option.value ? "text-blue-600" : "text-gray-500"
                      )}>
                        {option.timeEstimate}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Summary - Compact */}
      {(data.step3.language || data.step3.enableResearch) && (
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">Selected:</span>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              🌐 {data.step3.language.toUpperCase()}
            </span>
            {data.step3.enableResearch ? (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                🔍 Research: {data.step3.researchDepth}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                ❌ No Research
              </span>
            )}
          </div>
        </div>
      )}

      {/* Manual navigation notice */}
    </div>
  )
}