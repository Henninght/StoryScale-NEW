/**
 * Content Creation Wizard
 * Demonstrates integration of language selector in Step 3
 * Shows how language selection affects content generation
 */

'use client'

import React, { useState } from 'react'
import { WizardLanguageSelector, CompactLanguageSelector } from '../../components/wizard/language-selector'
import { LanguageStatus, LanguageBadge, InlineLanguageIndicator } from '../../components/ui/language-status'
import { useLanguage } from '../../lib/context/language-context'
import { SupportedLanguage, ContentLanguageMetadata } from '../../lib/types/language'
import { cn } from '../../lib/utils'

type WizardStep = 1 | 2 | 3 | 4

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(3) // Start at language selection step
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en')
  const { language, t } = useLanguage()

  // Mock content metadata for demo
  const mockLanguageMetadata: ContentLanguageMetadata = {
    originalLanguage: 'en',
    targetLanguage: selectedLanguage,
    culturallyAdapted: selectedLanguage === 'no',
    adaptationScore: selectedLanguage === 'no' ? 0.85 : 0,
    localizedReferences: selectedLanguage === 'no' ? ['Equinor', 'DNB', 'norsk marked'] : [],
    translations: selectedLanguage === 'no' ? { 'revenue': 'omsetning', 'market': 'marked' } : undefined
  }

  const steps = [
    { number: 1, title: 'Content Brief', description: 'Define your content requirements' },
    { number: 2, title: 'Audience & Purpose', description: 'Specify target audience and goals' },
    { number: 3, title: 'Research & Enhancement', description: 'Language and research options' },
    { number: 4, title: 'Generate & Review', description: 'Create and refine content' }
  ]

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setSelectedLanguage(newLanguage)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Creation Wizard</h1>
          <p className="text-gray-600 mt-2">Create professional content in under 15 seconds</p>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border-2 font-medium text-sm',
                      currentStep === step.number
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : currentStep > step.number
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-300 bg-white text-gray-500'
                    )}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="ml-3 text-left">
                    <div className={cn(
                      'text-sm font-medium',
                      currentStep === step.number ? 'text-blue-600' : 'text-gray-900'
                    )}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="ml-8 flex-1 h-0.5 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Research & Enhancement</h2>
                <CompactLanguageSelector 
                  onLanguageChange={handleLanguageChange}
                  className="ml-4"
                />
              </div>

              {/* Language Selection Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <WizardLanguageSelector 
                    onLanguageChange={handleLanguageChange}
                    showContextHints={true}
                  />
                </div>

                {/* Research Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Research Options</h3>
                  
                  <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable web research</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      defaultChecked={selectedLanguage === 'no'}
                    />
                    <span className="text-sm text-gray-700">
                      Apply cultural adaptations
                    </span>
                  </label>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Content will be generated in:</strong> {selectedLanguage === 'no' ? 'Norwegian' : 'English'}
                    </div>
                    {selectedLanguage === 'no' && (
                      <div className="text-xs text-blue-700 mt-1">
                        Norwegian business context and cultural norms will be automatically applied
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Generate Content
                </button>
              </div>
            </div>
          )}

          {/* Demo Results Step */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Generated Content</h2>
              
              {/* Content Preview with Language Status */}
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Content Preview</h3>
                    <LanguageBadge 
                      language={selectedLanguage} 
                      culturallyAdapted={selectedLanguage === 'no'}
                    />
                  </div>
                  
                  <div className="prose text-gray-700">
                    {selectedLanguage === 'no' ? (
                      <>
                        <p><strong>Overskrift:</strong> Hvordan norske bedrifter kan øke lønnsomheten gjennom digitalisering</p>
                        <p>I dagens konkurransedyktige marked må norske bedrifter som Equinor og DNB omfavne digitale løsninger for å opprettholde sin markedsposisjon. Gjennom strategisk implementering av teknologi kan bedrifter øke sin omsetning betydelig...</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Headline:</strong> How Modern Businesses Can Increase Profitability Through Digital Transformation</p>
                        <p>In today&apos;s competitive marketplace, companies must embrace digital solutions to maintain their market position. Through strategic technology implementation, businesses can significantly increase their revenue...</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Language Status Display */}
                <LanguageStatus metadata={mockLanguageMetadata} />
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Back to Settings
                </button>
                <div className="space-x-3">
                  <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    Regenerate
                  </button>
                  <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                    Save Content
                  </button>
                </div>
              </div>
            </div>
          )}
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