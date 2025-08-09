/**
 * Language Settings Component
 * Provides user interface for managing language preferences
 * Integrates with StoryScale design system
 */

'use client'

import React from 'react'
import { useLanguage } from '../../lib/context/language-context'
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../lib/types/language'
import { cn } from '../../lib/utils'

interface LanguageSettingsProps {
  className?: string
}

export function LanguageSettings({ className }: LanguageSettingsProps) {
  const { language, preferences, setLanguage, setPreferences, t, isLoading } = useLanguage()

  const handleLanguageChange = async (newLanguage: SupportedLanguage) => {
    await setLanguage(newLanguage)
  }

  const handlePreferenceChange = async (key: keyof typeof preferences, value: any) => {
    await setPreferences({ [key]: value })
  }

  if (isLoading) {
    return (
      <div className={cn('p-6 border rounded-lg bg-white', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-6 border rounded-lg bg-white', className)}>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {t('language.settings.title', 'Language Settings')}
      </h3>

      {/* Default Language Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('language.settings.default', 'Default Language')}
        </label>
        <div className="space-y-2">
          {Object.values(SUPPORTED_LANGUAGES).map((langOption) => (
            <button
              key={langOption.code}
              onClick={() => handleLanguageChange(langOption.code)}
              className={cn(
                'w-full flex items-center justify-between p-3 border rounded-lg transition-all duration-200',
                'hover:border-blue-300 hover:bg-blue-50',
                preferences.defaultLanguage === langOption.code
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{langOption.flag}</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{langOption.nativeName}</div>
                  <div className="text-sm text-gray-500">{langOption.name}</div>
                </div>
              </div>
              {preferences.defaultLanguage === langOption.code && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-detect Setting */}
      <div className="mb-6">
        <label className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-700">
              {t('language.settings.autoDetect', 'Auto-detect from browser')}
            </div>
            <div className="text-sm text-gray-500">
              Automatically use your browser&apos;s language preference
            </div>
          </div>
          <button
            onClick={() => handlePreferenceChange('autoDetect', !preferences.autoDetect)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              preferences.autoDetect ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                preferences.autoDetect ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </label>
      </div>

      {/* Cultural Context Setting */}
      <div className="mb-6">
        <label className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-700">
              {t('language.settings.culturalContext', 'Show cultural context hints')}
            </div>
            <div className="text-sm text-gray-500">
              Display cultural adaptation indicators for Norwegian content
            </div>
          </div>
          <button
            onClick={() => handlePreferenceChange('showCulturalContext', !preferences.showCulturalContext)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              preferences.showCulturalContext ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                preferences.showCulturalContext ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </label>
      </div>

      {/* Norwegian-specific settings */}
      {preferences.defaultLanguage === 'no' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Norwegian Content Settings</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                Include Norwegian business context
              </div>
              <button
                className="relative inline-flex h-5 w-9 items-center rounded-full bg-blue-600"
              >
                <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
              </button>
            </label>
            <div className="text-xs text-blue-700">
              Content will reference Norwegian companies, business practices, and cultural norms
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div>Active Language: {SUPPORTED_LANGUAGES[language].flag} {SUPPORTED_LANGUAGES[language].nativeName}</div>
          <div>Storage: {'Cloud (Supabase)'}</div>
        </div>
      </div>
    </div>
  )
}