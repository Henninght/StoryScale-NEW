/**
 * Wizard Language Selector Component
 * In-wizard language selection for Step 3: Research & Enhancement
 * Provides temporary language override for content generation
 */

'use client'

import React, { useState } from 'react'
import { useLanguage } from '../../lib/context/language-context'
import { SUPPORTED_LANGUAGES, SupportedLanguage, NORWEGIAN_BUSINESS_CONTEXT } from '../../lib/types/language'
import { cn } from '../../lib/utils'

interface LanguageSelectorProps {
  onLanguageChange?: (language: SupportedLanguage) => void
  showContextHints?: boolean
  className?: string
}

export function WizardLanguageSelector({ 
  onLanguageChange, 
  showContextHints = true,
  className 
}: LanguageSelectorProps) {
  const { language, context, setLanguage, preferences, t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleLanguageSelect = async (selectedLanguage: SupportedLanguage) => {
    // Set as temporary override for this wizard session
    await setLanguage(selectedLanguage, true)
    onLanguageChange?.(selectedLanguage)
    setIsExpanded(false)
  }

  const currentLangOption = SUPPORTED_LANGUAGES[language]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {t('language.wizard.title', 'Content Language')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('language.wizard.description', 'Choose the language for your content generation')}
        </p>
      </div>

      {/* Language Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all duration-200',
            'hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            isExpanded ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{currentLangOption.flag}</span>
            <div className="text-left">
              <div className="font-medium text-gray-900">{currentLangOption.nativeName}</div>
              <div className="text-sm text-gray-500">
                {context.isOverridden && (
                  <span className="text-amber-600">Session override • </span>
                )}
                {currentLangOption.name}
              </div>
            </div>
          </div>
          <svg 
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            )}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Options */}
        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {Object.values(SUPPORTED_LANGUAGES).map((langOption) => (
              <button
                key={langOption.code}
                onClick={() => handleLanguageSelect(langOption.code)}
                className={cn(
                  'w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150',
                  'first:rounded-t-lg last:rounded-b-lg',
                  language === langOption.code ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{langOption.flag}</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{langOption.nativeName}</div>
                    <div className="text-sm text-gray-500">{langOption.name}</div>
                  </div>
                </div>
                {language === langOption.code && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context Hints */}
      {showContextHints && language === 'no' && preferences.showCulturalContext && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-900 text-sm">
                {t('language.norwegian.context.hint', 'Norwegian business context will be applied')}
              </h4>
              <ul className="text-xs text-green-800 mt-2 space-y-1">
                <li>• References to Norwegian companies and market dynamics</li>
                <li>• Cultural norms: direct communication, flat hierarchy</li>
                <li>• Business terminology in Norwegian context</li>
                <li>• Seasonal and geographic considerations</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Override Warning */}
      {context.isOverridden && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-amber-800">
              This language selection is temporary for this content creation session only.
            </span>
          </div>
        </div>
      )}

      {/* Reset to Default */}
      {context.isOverridden && (
        <button
          onClick={() => setLanguage(preferences.defaultLanguage)}
          className="w-full mt-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          Reset to default ({SUPPORTED_LANGUAGES[preferences.defaultLanguage].nativeName})
        </button>
      )}
    </div>
  )
}

// Compact version for inline use in wizard steps
export function CompactLanguageSelector({ 
  onLanguageChange, 
  className 
}: Pick<LanguageSelectorProps, 'onLanguageChange' | 'className'>) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = async (selectedLanguage: SupportedLanguage) => {
    await setLanguage(selectedLanguage, true)
    onLanguageChange?.(selectedLanguage)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
      >
        <span>{SUPPORTED_LANGUAGES[language].flag}</span>
        <span className="font-medium">{SUPPORTED_LANGUAGES[language].nativeName}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          {Object.values(SUPPORTED_LANGUAGES).map((langOption) => (
            <button
              key={langOption.code}
              onClick={() => handleSelect(langOption.code)}
              className={cn(
                'w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-150',
                'first:rounded-t-lg last:rounded-b-lg',
                language === langOption.code ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
              )}
            >
              <span>{langOption.flag}</span>
              <span className="font-medium whitespace-nowrap">{langOption.nativeName}</span>
              {language === langOption.code && (
                <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}