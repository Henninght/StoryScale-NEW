/**
 * Bulk Generator Page - Create multiple posts at once
 * Placeholder implementation to make navigation functional
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bulk Generator - StoryScale Workspace',
  description: 'Generate multiple LinkedIn posts at once',
}

export default function BulkGeneratorPage() {
  return (
    <div className="h-full p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="py-16">
          <div className="w-16 h-16 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Bulk Generator</h1>
          <p className="text-xl text-gray-600 mb-8">
            Create multiple LinkedIn posts at once with AI-powered batch processing
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Coming Soon</h3>
            <p className="text-blue-700">
              This feature is currently in development. You'll be able to generate up to 10 posts simultaneously 
              with consistent brand voice and targeting.
            </p>
          </div>
          
          <button className="px-6 py-3 bg-gray-300 text-gray-600 font-medium rounded-lg cursor-not-allowed">
            Available in Pro Plan
          </button>
        </div>
      </div>
    </div>
  )
}