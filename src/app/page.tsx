'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">StoryScale</h1>
        <p className="text-gray-600 mb-8">AI-powered content creation for LinkedIn</p>
        <Link 
          href="/workspace"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-150"
        >
          Go to Workspace
        </Link>
      </div>
    </div>
  );
}