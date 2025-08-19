/**
 * Step 2: Audience & Style
 * Second step of the LinkedIn post creation wizard
 */

'use client'

import React, { useEffect } from 'react'
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
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audience & Style</h2>
        <p className="mt-1 text-gray-600">
          Define who you're writing for and how you want to sound
        </p>
      </div>

      {/* Audience Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Who's your target audience? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {audienceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAudienceSelect(option.value)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-center",
                data.step2.audience === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <span className="text-2xl block mb-2">{option.icon}</span>
              <h4 className={cn(
                "font-medium",
                data.step2.audience === option.value ? "text-blue-900" : "text-gray-900"
              )}>
                {option.label}
              </h4>
              <p className={cn(
                "text-xs mt-1",
                data.step2.audience === option.value ? "text-blue-700" : "text-gray-600"
              )}>
                {option.description}
              </p>
              {data.step2.audience === option.value && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tone Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What tone should we use? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {toneOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleToneSelect(option.value)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-center",
                data.step2.tone === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <span className="text-2xl block mb-2">{option.icon}</span>
              <h4 className={cn(
                "font-medium",
                data.step2.tone === option.value ? "text-blue-900" : "text-gray-900"
              )}>
                {option.label}
              </h4>
              <p className={cn(
                "text-xs mt-1",
                data.step2.tone === option.value ? "text-blue-700" : "text-gray-600"
              )}>
                {option.description}
              </p>
              {data.step2.tone === option.value && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose a content format <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {formatOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFormatSelect(option.value)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-left",
                data.step2.format === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1">
                  <h4 className={cn(
                    "font-medium",
                    data.step2.format === option.value ? "text-blue-900" : "text-gray-900"
                  )}>
                    {option.label}
                  </h4>
                  <p className={cn(
                    "text-xs mt-1",
                    data.step2.format === option.value ? "text-blue-700" : "text-gray-600"
                  )}>
                    {option.description}
                  </p>
                  <p className={cn(
                    "text-xs mt-2 italic",
                    data.step2.format === option.value ? "text-blue-600" : "text-gray-500"
                  )}>
                    "{option.example}"
                  </p>
                </div>
              </div>
              {data.step2.format === option.value && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Post Length Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose post length <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {postLengthOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePostLengthSelect(option.value)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-left h-full",
                data.step2.postLength === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <h4 className={cn(
                      "font-medium",
                      data.step2.postLength === option.value ? "text-blue-900" : "text-gray-900"
                    )}>
                      {option.label}
                    </h4>
                    <p className={cn(
                      "text-sm font-medium",
                      data.step2.postLength === option.value ? "text-blue-700" : "text-gray-600"
                    )}>
                      {option.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className={cn(
                    "text-xs",
                    data.step2.postLength === option.value ? "text-blue-600" : "text-gray-500"
                  )}>
                    <strong>Best for:</strong> {option.usage}
                  </p>
                  <p className={cn(
                    "text-xs italic",
                    data.step2.postLength === option.value ? "text-blue-600" : "text-gray-500"
                  )}>
                    {option.example}
                  </p>
                </div>
              </div>
              
              {data.step2.postLength === option.value && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {data.step2.audience && data.step2.tone && data.step2.format && data.step2.postLength && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your selections:</h4>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {audienceOptions.find(a => a.value === data.step2.audience)?.icon} {data.step2.audience}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {toneOptions.find(t => t.value === data.step2.tone)?.icon} {data.step2.tone}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {formatOptions.find(f => f.value === data.step2.format)?.icon} {data.step2.format}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {postLengthOptions.find(l => l.value === data.step2.postLength)?.icon} {data.step2.postLength} ({postLengthOptions.find(l => l.value === data.step2.postLength)?.characterRange} chars)
            </span>
          </div>
        </div>
      )}

      {/* Completion Indicator - Auto-advance disabled */}
    </div>
  )
}