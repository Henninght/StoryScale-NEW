/**
 * Document List Demo Component
 * Shows how language status indicators appear in document listings
 * Demonstrates the language metadata integration
 */

'use client'

import React from 'react'
import { LanguageBadge, InlineLanguageIndicator } from '../ui/language-status'
import { ContentLanguageMetadata, SupportedLanguage } from '../../lib/types/language'
import { cn } from '../../lib/utils'

interface Document {
  id: string
  title: string
  content: string
  createdAt: Date
  languageMetadata: ContentLanguageMetadata
  purpose: string
  format: string
}

// Mock documents for demonstration
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Digital Transformation in Norwegian Finance',
    content: 'Hvordan norske banker som DNB kan utnytte AI-teknologi...',
    createdAt: new Date('2024-01-15'),
    languageMetadata: {
      originalLanguage: 'en',
      targetLanguage: 'no',
      culturallyAdapted: true,
      adaptationScore: 0.92,
      localizedReferences: ['DNB', 'Norges Bank', 'norsk fintech'],
      translations: { 'banking': 'bankvirksomhet', 'customer': 'kunde' }
    },
    purpose: 'thought-leadership',
    format: 'insight'
  },
  {
    id: '2',
    title: 'Global Marketing Strategies for SaaS',
    content: 'How to scale your SaaS product internationally...',
    createdAt: new Date('2024-01-14'),
    languageMetadata: {
      originalLanguage: 'en',
      targetLanguage: 'en',
      culturallyAdapted: false,
      adaptationScore: 0,
      localizedReferences: []
    },
    purpose: 'value',
    format: 'howto'
  },
  {
    id: '3',
    title: 'Sustainable Business Practices in Scandinavia',
    content: 'Nordiske bedrifter som Equinor og Yara leder an i bærekraft...',
    createdAt: new Date('2024-01-13'),
    languageMetadata: {
      originalLanguage: 'en',
      targetLanguage: 'no',
      culturallyAdapted: true,
      adaptationScore: 0.78,
      localizedReferences: ['Equinor', 'Yara', 'bærekraft', 'nordisk'],
      translations: { 'sustainability': 'bærekraft', 'practices': 'praksis' }
    },
    purpose: 'authority',
    format: 'story'
  }
]

interface DocumentListProps {
  className?: string
}

export function DocumentList({ className }: DocumentListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Recent Documents</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Filter by language:</span>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="all">All Languages</option>
            <option value="en">🇺🇸 English</option>
            <option value="no">🇳🇴 Norsk</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {mockDocuments.map((doc) => (
          <div
            key={doc.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-150"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {doc.title}
                  </h3>
                  <LanguageBadge 
                    language={doc.languageMetadata.targetLanguage}
                    culturallyAdapted={doc.languageMetadata.culturallyAdapted}
                  />
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {doc.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{doc.format}</span>
                    <span>•</span>
                    <span>{doc.purpose}</span>
                    <span>•</span>
                    <span>{doc.createdAt.toLocaleDateString('en-US')}</span>
                  </div>
                  
                  <InlineLanguageIndicator 
                    metadata={doc.languageMetadata}
                    showDetails={false}
                  />
                </div>
              </div>
              
              <div className="ml-4 flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-150">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-150">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Language Statistics */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-3">Language Usage Statistics</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2</div>
            <div className="text-blue-800">🇳🇴 Norwegian</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">1</div>
            <div className="text-blue-800">🇺🇸 English</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">67%</div>
            <div className="text-blue-800">Culturally Adapted</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact version for sidebar or dashboard
export function CompactDocumentList({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="font-medium text-gray-900 mb-3">Recent Content</h3>
      {mockDocuments.slice(0, 3).map((doc) => (
        <div
          key={doc.id}
          className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium text-sm text-gray-900 truncate flex-1">
              {doc.title}
            </div>
            <LanguageBadge 
              language={doc.languageMetadata.targetLanguage}
              culturallyAdapted={doc.languageMetadata.culturallyAdapted}
              className="ml-2"
            />
          </div>
          <div className="text-xs text-gray-500">
            {doc.createdAt.toLocaleDateString('en-US')} • {doc.format}
          </div>
        </div>
      ))}
    </div>
  )
}