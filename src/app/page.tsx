'use client'

import { CompactLanguageSelector } from '../components/wizard/language-selector'
import { CompactDocumentList } from '../components/demo/document-list'
import { useLanguage } from '../lib/context/language-context'

export default function Home() {
  const { language, t } = useLanguage()
  
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-7xl mx-auto">
        {/* Header with Language Selector */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">StoryScale</h1>
            <p className="text-xl text-gray-600">AI-Powered Content Studio - 3-Layer Architecture</p>
          </div>
          <div className="flex items-center space-x-4">
            <CompactLanguageSelector />
            <a 
              href="/settings"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Settings
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Architecture Overview */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 border rounded-lg bg-white">
                <h2 className="text-2xl font-semibold mb-2">Layer 1: Gateway</h2>
                <p className="text-gray-600">Intelligent routing, caching, and cost optimization</p>
                <div className="mt-4 text-sm text-blue-600">
                  + Language detection & cultural routing
                </div>
              </div>
              
              <div className="p-6 border rounded-lg bg-white">
                <h2 className="text-2xl font-semibold mb-2">Layer 2: Functions</h2>
                <p className="text-gray-600">Research, Generate, Optimize, Validate</p>
                <div className="mt-4 text-sm text-blue-600">
                  + Cultural adaptation & localization
                </div>
              </div>
              
              <div className="p-6 border rounded-lg bg-white">
                <h2 className="text-2xl font-semibold mb-2">Layer 3: Intelligence</h2>
                <p className="text-gray-600">Pattern learning, quality scoring, metrics</p>
                <div className="mt-4 text-sm text-blue-600">
                  + Cultural context scoring
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="/wizard"
                className="p-6 border-2 border-blue-200 rounded-lg bg-white hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
              >
                <h3 className="text-xl font-semibold text-blue-600 mb-2">🪄 Content Wizard</h3>
                <p className="text-gray-600">Create content with language selection and cultural adaptation</p>
              </a>
              
              <a 
                href="/settings"
                className="p-6 border-2 border-gray-200 rounded-lg bg-white hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                <h3 className="text-xl font-semibold text-gray-700 mb-2">⚙️ Settings</h3>
                <p className="text-gray-600">Configure language preferences and cultural adaptations</p>
              </a>
            </div>
          </div>
          
          {/* Sidebar with Document List */}
          <div className="lg:col-span-1">
            <CompactDocumentList />
          </div>
        </div>
        
        {/* API Endpoints */}
        <div className="mt-12 p-6 bg-white border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">API Endpoints:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <a href="/api/health" className="text-blue-600 hover:underline">
              /api/health - System health check
            </a>
            <a href="/api/architecture" className="text-blue-600 hover:underline">
              /api/architecture - Architecture info
            </a>
            <a href="/api/test" className="text-blue-600 hover:underline">
              /api/test - Test endpoint
            </a>
          </div>
        </div>

        {/* Language Feature Showcase */}
        {language === 'no' && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🇳🇴</span>
              <h3 className="text-lg font-semibold text-green-900">Norsk språkstøtte aktiv</h3>
            </div>
            <p className="text-green-800 text-sm">
              StoryScale er nå konfigurert for norsk innhold med kulturell tilpasning og lokale forretningsreferanser.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}