/**
 * Language Status Indicators
 * Shows language information for generated content
 * Displays cultural adaptation indicators
 */

'use client'

import React, { useState } from 'react'
import { SupportedLanguage, ContentLanguageMetadata, SUPPORTED_LANGUAGES } from '../../lib/types/language'
import { useLanguage } from '../../lib/context/language-context'
import { cn } from '../../lib/utils'

interface LanguageStatusProps {
  metadata: ContentLanguageMetadata
  compact?: boolean
  className?: string
}

export function LanguageStatus({ metadata, compact = false, className }: LanguageStatusProps) {
  const { t } = useLanguage()
  const langOption = SUPPORTED_LANGUAGES[metadata.targetLanguage]

  if (compact) {
    return (
      <div className={cn('inline-flex items-center space-x-1', className)}>
        <span className="text-sm">{langOption.flag}</span>
        <span className="text-xs text-gray-600 font-medium">
          {langOption.code.toUpperCase()}
        </span>
        {metadata.culturallyAdapted && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Adapted
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('p-3 bg-gray-50 border border-gray-200 rounded-lg', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl">{langOption.flag}</span>
          <div>
            <div className="font-medium text-gray-900">
              {t('language.status.generated_in', 'Generated in')} {langOption.nativeName}
            </div>
            {metadata.originalLanguage !== metadata.targetLanguage && (
              <div className="text-sm text-gray-500">
                Translated from {SUPPORTED_LANGUAGES[metadata.originalLanguage].nativeName}
              </div>
            )}
          </div>
        </div>

        {/* Adaptation Score */}
        {metadata.culturallyAdapted && (
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-xs font-medium text-green-700">
                {t('language.status.culturally_adapted', 'Culturally adapted')}
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(metadata.adaptationScore * 100)}% adaptation
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Localized References */}
      {metadata.localizedReferences && metadata.localizedReferences.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Local References:</div>
          <div className="flex flex-wrap gap-1">
            {metadata.localizedReferences.slice(0, 5).map((ref, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {ref}
              </span>
            ))}
            {metadata.localizedReferences.length > 5 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{metadata.localizedReferences.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Badge component for document lists
interface LanguageBadgeProps {
  language: SupportedLanguage
  culturallyAdapted?: boolean
  className?: string
}

export function LanguageBadge({ language, culturallyAdapted, className }: LanguageBadgeProps) {
  const langOption = SUPPORTED_LANGUAGES[language]
  
  return (
    <div className={cn('inline-flex items-center space-x-1', className)}>
      <span className="text-sm">{langOption.flag}</span>
      <span className="text-xs font-medium text-gray-600">
        {langOption.code.toUpperCase()}
      </span>
      {culturallyAdapted && (
        <span className="w-2 h-2 bg-green-500 rounded-full" title="Culturally adapted content" />
      )}
    </div>
  )
}

// Inline indicator for document cards
export function InlineLanguageIndicator({ 
  metadata, 
  showDetails = false,
  className 
}: { 
  metadata: ContentLanguageMetadata
  showDetails?: boolean
  className?: string 
}) {
  const langOption = SUPPORTED_LANGUAGES[metadata.targetLanguage]
  
  return (
    <div className={cn('inline-flex items-center space-x-2 text-sm text-gray-500', className)}>
      <span>{langOption.flag}</span>
      <span>{langOption.nativeName}</span>
      
      {metadata.culturallyAdapted && (
        <span className="inline-flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          {showDetails && (
            <span className="text-xs">Culturally adapted</span>
          )}
        </span>
      )}
    </div>
  )
}

// Cultural context tooltip
interface CulturalContextTooltipProps {
  adaptations: string[]
  score: number
  children: React.ReactNode
}

export function CulturalContextTooltip({ adaptations, score, children }: CulturalContextTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && adaptations.length > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
          <div className="font-medium mb-2">Cultural Adaptations ({Math.round(score * 100)}%)</div>
          <ul className="space-y-1">
            {adaptations.map((adaptation, index) => (
              <li key={index} className="text-gray-300">• {adaptation}</li>
            ))}
          </ul>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}