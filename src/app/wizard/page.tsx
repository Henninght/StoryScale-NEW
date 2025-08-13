/**
 * LinkedIn Post Creation Wizard Page
 * Uses the new 4-step wizard implementation
 */

'use client'

import React, { useState } from 'react'
import { LinkedInPostWizard } from '@/components/wizard/linkedin-post-wizard'
import { useRouter } from 'next/navigation'

export default function WizardPage() {
  const router = useRouter()
  const [generatedContent, setGeneratedContent] = useState<any>(null)

  const handleWizardComplete = (content: any) => {
    setGeneratedContent(content)
    // Could redirect to a content preview/edit page
    console.log('Generated content:', content)
  }

  const handleWizardCancel = () => {
    router.push('/')
  }

  if (generatedContent) {
    // Show generated content result
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Generated!</h2>
            
            <div className="prose max-w-none">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {generatedContent.content}
              </pre>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setGeneratedContent(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Create Another
              </button>
              
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Edit
                </button>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Save & Use
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <a 
              href="/"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <LinkedInPostWizard 
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </div>
    </div>
  )
}