/**
 * Settings Page
 * Provides user interface for managing StoryScale preferences
 * Includes language settings integration
 */

'use client'

import React from 'react'
import { LanguageSettings } from '../../components/settings/language-settings'
import { useLanguage } from '../../lib/context/language-context'

export default function SettingsPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your StoryScale preferences and account settings</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Language Settings */}
          <div className="lg:col-span-1">
            <LanguageSettings />
          </div>

          {/* Account Settings Placeholder */}
          <div className="p-6 border rounded-lg bg-white">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Authentication, billing, and subscription settings will be available here.
              </div>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                disabled
              >
                Manage Account (Coming Soon)
              </button>
            </div>
          </div>

          {/* Content Preferences Placeholder */}
          <div className="p-6 border rounded-lg bg-white">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Preferences</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Default tone, format, and style preferences for content generation.
              </div>
              <button 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                disabled
              >
                Configure Defaults (Coming Soon)
              </button>
            </div>
          </div>

          {/* Performance Settings Placeholder */}
          <div className="p-6 border rounded-lg bg-white">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Cache settings, preferred AI providers, and performance optimizations.
              </div>
              <button 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                disabled
              >
                Optimize Performance (Coming Soon)
              </button>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8">
          <a 
            href="/"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to StoryScale</span>
          </a>
        </div>
      </div>
    </div>
  )
}