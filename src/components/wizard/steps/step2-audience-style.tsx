/**
 * Step 2: Audience & Style
 * Second step of the LinkedIn post creation wizard
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useWizardStore } from '@/stores/wizard-store'
import { TargetAudience, ContentTone, ContentFormat, PostLength } from '@/types/wizard'
import { cn } from '@/lib/utils'

// Audience options with icons and descriptions
const audienceOptions: Array<{
  value: TargetAudience
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'professionals',
    label: 'Professionals',
    description: 'Industry professionals and practitioners',
    icon: '💼'
  },
  {
    value: 'executives',
    label: 'Executives',
    description: 'C-suite and senior leadership',
    icon: '👔'
  },
  {
    value: 'entrepreneurs',
    label: 'Entrepreneurs',
    description: 'Founders and business owners',
    icon: '🚀'
  },
  {
    value: 'general-business',
    label: 'General Business',
    description: 'Broad business audience',
    icon: '🏢'
  }
]

// Tone options with icons and descriptions
const toneOptions: Array<{
  value: ContentTone
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal and authoritative',
    icon: '📊'
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and approachable',
    icon: '😊'
  },
  {
    value: 'authoritative',
    label: 'Authoritative',
    description: 'Expert and confident',
    icon: '🎓'
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and conversational',
    icon: '💬'
  }
]

// Format options with icons and descriptions
const formatOptions: Array<{
  value: ContentFormat
  label: string
  description: string
  icon: string
  example: string
}> = [
  {
    value: 'story',
    label: 'Story',
    description: 'Narrative with beginning, middle, end',
    icon: '📖',
    example: 'Last week, I learned something profound...'
  },
  {
    value: 'news',
    label: 'News',
    description: 'Announcement or update',
    icon: '📰',
    example: 'Breaking: Major industry shift announced...'
  },
  {
    value: 'list',
    label: 'List',
    description: 'Numbered or bulleted points',
    icon: '📝',
    example: '5 Ways to improve your...'
  },
  {
    value: 'tips',
    label: 'Tips',
    description: 'Actionable advice',
    icon: '💡',
    example: 'Pro tip: Always remember to...'
  },
  {
    value: 'insight',
    label: 'Insight',
    description: 'Analysis or observation',
    icon: '🔍',
    example: 'After analyzing 100 companies, I discovered...'
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Trending format with emojis',
    icon: '✨',
    example: '🔥 Hot take: The future of work is...'
  }
]

// Post length options with character counts and usage guidance
const postLengthOptions: Array<{
  value: PostLength
  label: string
  description: string
  characterRange: string
  icon: string
  usage: string
  example: string
}> = [
  {
    value: 'short',
    label: 'Short Post',
    description: '300-800 characters',
    characterRange: '300-800',
    icon: '⚡',
    usage: 'Quick insights, announcements, or simple updates',
    example: 'Perfect for daily tips, quick thoughts, or breaking news'
  },
  {
    value: 'medium',
    label: 'Medium Post',
    description: '800-1,500 characters',
    characterRange: '800-1,500',
    icon: '📝',
    usage: 'Detailed stories, case studies, or comprehensive tips',
    example: 'Ideal for sharing experiences, lessons learned, or step-by-step guides'
  },
  {
    value: 'long',
    label: 'Long Post',
    description: '1,500-3,000 characters',
    characterRange: '1,500-3,000',
    icon: '📚',
    usage: 'In-depth analysis, thought leadership, or comprehensive guides',
    example: 'Best for detailed insights, industry analysis, or comprehensive tutorials'
  }
]

export function Step2AudienceStyle() {
  const {
    data,
    setTargetAudience,
    setContentTone,
    setContentFormat,
    setPostLength,
    validateCurrentStep
  } = useWizardStore()

  // Show all options directly - no expand/collapse functionality
  const visibleFormatOptions = formatOptions
  const visibleLengthOptions = postLengthOptions

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
  // }, [data.step2, validateCurrentStep, onAutoAdvance])

  const handleAudienceSelect = (audience: TargetAudience) => {
    setTargetAudience(audience)
  }

  const handleToneSelect = (tone: ContentTone) => {
    setContentTone(tone)
  }

  const handleFormatSelect = (format: ContentFormat) => {
    setContentFormat(format)
  }

  const handlePostLengthSelect = (postLength: PostLength) => {
    setPostLength(postLength)
  }

  const validation = validateCurrentStep()
  const isComplete = validation.isValid

  return (
    <div className="space-y-4">
      {/* Step Header - More compact */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Audience & Style</h2>
        <p className="mt-1 text-sm text-gray-600">
          Define who you're writing for and how you want to sound
        </p>
      </div>

      {/* Audience Selection - Compact */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Target Audience <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {audienceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAudienceSelect(option.value)}
              className={cn(
                "relative p-2.5 rounded-md border transition-all duration-200",
                "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-left",
                data.step2.audience === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "font-medium text-sm",
                    data.step2.audience === option.value ? "text-blue-900" : "text-gray-900"
                  )}>
                    {option.label}
                  </h4>
                  <p className={cn(
                    "text-xs mt-0.5 line-clamp-1",
                    data.step2.audience === option.value ? "text-blue-700" : "text-gray-600"
                  )}>
                    {option.description}
                  </p>
                </div>
                {data.step2.audience === option.value && (
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Unified Style Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Content Style</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleToneSelect(option.value)}
                  className={cn(
                    "w-full p-2 rounded-md border transition-all duration-200 text-left",
                    "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                    data.step2.tone === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{option.icon}</span>
                    <span className={cn(
                      "font-medium text-sm",
                      data.step2.tone === option.value ? "text-blue-900" : "text-gray-900"
                    )}>
                      {option.label}
                    </span>
                    {data.step2.tone === option.value && (
                      <svg className="w-3 h-3 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {visibleFormatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFormatSelect(option.value)}
                  className={cn(
                    "w-full p-2 rounded-md border transition-all duration-200 text-left",
                    "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                    data.step2.format === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{option.icon}</span>
                    <span className={cn(
                      "font-medium text-sm",
                      data.step2.format === option.value ? "text-blue-900" : "text-gray-900"
                    )}>
                      {option.label}
                    </span>
                    {data.step2.format === option.value && (
                      <svg className="w-3 h-3 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Length Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {visibleLengthOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePostLengthSelect(option.value)}
                  className={cn(
                    "w-full p-2 rounded-md border transition-all duration-200 text-left",
                    "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                    data.step2.postLength === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{option.icon}</span>
                    <div className="flex-1">
                      <span className={cn(
                        "font-medium text-sm",
                        data.step2.postLength === option.value ? "text-blue-900" : "text-gray-900"
                      )}>
                        {option.label}
                      </span>
                      <div className={cn(
                        "text-xs mt-0.5",
                        data.step2.postLength === option.value ? "text-blue-700" : "text-gray-600"
                      )}>
                        {option.characterRange} chars
                      </div>
                    </div>
                    {data.step2.postLength === option.value && (
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Indicator - Auto-advance disabled */}
    </div>
  )
}