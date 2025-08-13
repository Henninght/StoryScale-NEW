/**
 * Step 4: Summary & Action
 * Final step of the LinkedIn post creation wizard
 */

'use client'

import React, { useState } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import { cn } from '@/lib/utils'

interface Step4Props {
  onGenerate?: () => void
}

export function Step4SummaryAction({ onGenerate }: Step4Props) {
  const {
    data,
    metadata,
    setCallToAction,
    confirmGeneration,
    generateContent,
    isGenerating,
    error,
    generatedContent
  } = useWizardStore()

  const [localCta, setLocalCta] = useState(data.step4.callToAction || '')
  const [ctaEnabled, setCtaEnabled] = useState(!!data.step4.callToAction)

  // Update CTA in store
  const handleCtaChange = (value: string) => {
    setLocalCta(value)
    setCallToAction(value || undefined)
  }

  const handleCtaToggle = (enabled: boolean) => {
    setCtaEnabled(enabled)
    if (!enabled) {
      setCallToAction(undefined)
      setLocalCta('')
    }
  }

  const handleGenerate = async () => {
    confirmGeneration()
    await generateContent()
    if (onGenerate) {
      onGenerate()
    }
  }

  // Format the selections for display
  const formatSelection = (key: string, value: string) => {
    return value.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Get icon for each selection type
  const getIcon = (type: string, value: string) => {
    const icons: Record<string, Record<string, string>> = {
      purpose: {
        'share-insights': '💡',
        'announce-news': '📢',
        'ask-question': '❓',
        'share-story': '📖',
        'promote-content': '🚀'
      },
      goal: {
        'increase-engagement': '💬',
        'generate-leads': '🎯',
        'build-authority': '👑',
        'drive-traffic': '🔗',
        'start-discussion': '💭'
      },
      audience: {
        'professionals': '💼',
        'executives': '👔',
        'entrepreneurs': '🚀',
        'general-business': '🏢'
      },
      tone: {
        'professional': '📊',
        'friendly': '😊',
        'authoritative': '🎓',
        'casual': '💬'
      },
      format: {
        'story': '📖',
        'news': '📰',
        'list': '📝',
        'tips': '💡',
        'insight': '🔍',
        'modern': '✨'
      }
    }
    return icons[type]?.[value] || '📝'
  }

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Summary & Action</h2>
        <p className="mt-1 text-gray-600">
          Review your selections and generate your LinkedIn post
        </p>
      </div>

      {/* Content Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Content Brief</h3>
        
        {/* Description */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="text-sm font-medium text-gray-700">Description:</label>
          <p className="mt-1 text-sm text-gray-900">{data.step1.description}</p>
          {data.step1.url && (
            <div className="mt-2">
              <label className="text-sm font-medium text-gray-700">Related URL:</label>
              <a 
                href={data.step1.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline block"
              >
                {data.step1.url}
              </a>
            </div>
          )}
        </div>

        {/* Selections Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Purpose */}
          <div>
            <label className="text-sm font-medium text-gray-700">Purpose:</label>
            <div className="mt-1 flex items-center space-x-2">
              <span>{getIcon('purpose', data.step1.purpose)}</span>
              <span className="text-sm text-gray-900">
                {formatSelection('purpose', data.step1.purpose)}
              </span>
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="text-sm font-medium text-gray-700">Goal:</label>
            <div className="mt-1 flex items-center space-x-2">
              <span>{getIcon('goal', data.step1.goal)}</span>
              <span className="text-sm text-gray-900">
                {formatSelection('goal', data.step1.goal)}
              </span>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="text-sm font-medium text-gray-700">Audience:</label>
            <div className="mt-1 flex items-center space-x-2">
              <span>{getIcon('audience', data.step2.audience)}</span>
              <span className="text-sm text-gray-900">
                {formatSelection('audience', data.step2.audience)}
              </span>
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-sm font-medium text-gray-700">Tone:</label>
            <div className="mt-1 flex items-center space-x-2">
              <span>{getIcon('tone', data.step2.tone)}</span>
              <span className="text-sm text-gray-900">
                {formatSelection('tone', data.step2.tone)}
              </span>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-sm font-medium text-gray-700">Format:</label>
            <div className="mt-1 flex items-center space-x-2">
              <span>{getIcon('format', data.step2.format)}</span>
              <span className="text-sm text-gray-900">
                {formatSelection('format', data.step2.format)}
              </span>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-sm font-medium text-gray-700">Language:</label>
            <div className="mt-1 flex items-center space-x-2">
              <span>🌐</span>
              <span className="text-sm text-gray-900">
                {data.step3.language.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Research */}
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">Research:</label>
            <div className="mt-1 flex items-center space-x-2">
              <span>{data.step3.enableResearch ? '✅' : '❌'}</span>
              <span className="text-sm text-gray-900">
                {data.step3.enableResearch 
                  ? `Enabled (${formatSelection('depth', data.step3.researchDepth || 'balanced')} depth)`
                  : 'Disabled'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="border rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Call to Action (Optional)</h4>
            <p className="text-xs text-gray-600 mt-1">Add a specific action you want readers to take</p>
          </div>
          <button
            onClick={() => handleCtaToggle(!ctaEnabled)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              ctaEnabled ? "bg-blue-600" : "bg-gray-200"
            )}
            role="switch"
            aria-checked={ctaEnabled}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                ctaEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
        
        {ctaEnabled && (
          <textarea
            value={localCta}
            onChange={(e) => handleCtaChange(e.target.value)}
            placeholder="e.g., Visit our website to learn more, Comment with your thoughts, Share if you found this helpful..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
        )}
      </div>

      {/* Generation Time Estimate */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1 0a1 1 0 000-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Generation Time</h4>
            <p className="text-xs text-blue-800 mt-1">
              Your content will be generated in approximately{' '}
              <span className="font-semibold">
                {data.step3.enableResearch 
                  ? data.step3.researchDepth === 'deep' ? '15 seconds'
                  : data.step3.researchDepth === 'balanced' ? '10 seconds'
                  : '8 seconds'
                  : '5 seconds'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-900">Generation Error</h4>
              <p className="text-xs text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !!generatedContent}
          className={cn(
            "px-8 py-3 rounded-lg font-medium transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            isGenerating || generatedContent
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          )}
        >
          {isGenerating ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Generating Content...</span>
            </span>
          ) : generatedContent ? (
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Content Generated!</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Generate LinkedIn Post</span>
            </span>
          )}
        </button>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Creating your perfect LinkedIn post...
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}