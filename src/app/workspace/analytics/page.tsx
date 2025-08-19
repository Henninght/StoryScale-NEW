/**
 * Analytics Page - Performance insights and metrics
 * Placeholder implementation to make navigation functional
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics - StoryScale Workspace',
  description: 'View performance analytics and insights for your content',
}

export default function AnalyticsPage() {
  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Track your content performance and engagement metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Engagement Tracking</h3>
            <p className="text-gray-600 mb-4">
              Connect your LinkedIn account to track likes, comments, and shares on your AI-generated posts.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Connect LinkedIn
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Insights</h3>
            <p className="text-gray-600 mb-4">
              See which post types, topics, and styles perform best with your audience.
            </p>
            <button className="px-4 py-2 bg-gray-300 text-gray-600 font-medium rounded-lg cursor-not-allowed">
              Available Soon
            </button>
          </div>
        </div>

        {/* Placeholder Chart Area */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Content Performance</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Charts and insights will appear here once you connect your LinkedIn account</p>
          </div>
        </div>
      </div>
    </div>
  )
}