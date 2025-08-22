/**
 * Generated Content Display Component
 * Shows the generated LinkedIn post with actions
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/stores/wizard-store'
import { SaveService } from '@/lib/dashboard/save-service'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function GeneratedContentDisplay() {
  const router = useRouter()
  const { generatedContent, resetWizard, data } = useWizardStore()
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Always log these to see if component is rendering
  console.log('🎯🎯🎯 GeneratedContentDisplay: Component rendered')
  console.log('🎯🎯🎯 GeneratedContentDisplay: Generated content exists:', !!generatedContent)
  console.log('🎯🎯🎯 GeneratedContentDisplay: User:', user?.email || 'not authenticated')
  console.log('🎯🎯🎯 GeneratedContentDisplay: Saving state:', saving)
  console.log('🎯🎯🎯 GeneratedContentDisplay: Saved state:', saved)
  console.log('🎯🎯🎯 GeneratedContentDisplay: Is hydrated:', isHydrated)

  if (!generatedContent || !isHydrated) {
    return null
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }

  const handleEdit = () => {
    router.push(`/workspace/editor?content=${encodeURIComponent(generatedContent.content)}`)
  }

  const handleNewPost = () => {
    resetWizard()
  }

  const handleSave = async () => {
    console.log('🔥🔥🔥 SAVE CLICKED: Starting save process')
    console.log('🔥🔥🔥 SAVE CLICKED: User:', user)
    console.log('🔥🔥🔥 SAVE CLICKED: User ID:', user?.id)
    console.log('🔥🔥🔥 SAVE CLICKED: Generated content:', generatedContent)
    console.log('🔥🔥🔥 SAVE CLICKED: Wizard data:', data)
    
    setSaving(true)
    
    try {
      console.log('🔥 SAVE: About to call SaveService.savePost')
      const result = await SaveService.savePost(
        generatedContent.content,
        {
          characterCount: generatedContent.metadata.characterCount,
          wordCount: generatedContent.metadata.wordCount,
          hashtagCount: generatedContent.metadata.hashtagCount || 0,
          modelUsed: generatedContent.metadata.modelUsed,
          processingTime: generatedContent.metadata.processingTime,
          qualityScore: generatedContent.metadata.qualityScore
        },
        {
          purpose: data.step1.purpose || 'General',
          target: data.step2.audience || 'Professionals',
          userId: user?.id,
          wizardSettings: {
            purpose: data.step1.purpose,
            description: data.step1.description,
            audience: data.step2.audience,
            tone: data.step2.tone,
            format: data.step2.format,
            length: data.step2.postLength,
            outputLanguage: data.step3.language,
            enableResearch: data.step3.enableResearch
          }
        }
      )

      console.log('🔥 SAVE: SaveService.savePost completed with result:', result)

      if (result.success) {
        console.log('🔥 SAVE: Save successful! Setting saved state to true')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        
        // Trigger a custom event to notify dashboard to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('contentSaved', { 
            detail: { postId: result.postId } 
          }))
          console.log('🔥 SAVE: Dispatched contentSaved event')
        }
      } else {
        console.error('❌ Save failed:', result.error)
        alert(`Save failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Save error:', error)
      alert(`Save error: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatProcessingTime = (ms: number) => {
    return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Content Generated!</h2>
        <p className="mt-1 text-gray-600">
          Your LinkedIn post is ready to use
        </p>
      </div>

      {/* Generated Content */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">LinkedIn Post</h3>
            <span className="text-xs text-gray-500">
              {generatedContent.metadata.characterCount} characters
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 leading-relaxed">
              {generatedContent.content}
            </pre>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Generation Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Generated:</span>
            <span className="ml-2 text-gray-900">
              {formatDate(generatedContent.metadata.generatedAt)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Processing Time:</span>
            <span className="ml-2 text-gray-900">
              {formatProcessingTime(generatedContent.metadata.processingTime)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Word Count:</span>
            <span className="ml-2 text-gray-900">
              {generatedContent.metadata.wordCount}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Model:</span>
            <span className="ml-2 text-gray-900">
              {generatedContent.metadata.modelUsed.replace('claude-3-5-sonnet-20241022', 'Claude Sonnet 3.5')}
            </span>
          </div>
          {generatedContent.metadata.hashtagCount > 0 && (
            <div>
              <span className="text-gray-600">Hashtags:</span>
              <span className="ml-2 text-gray-900">
                {generatedContent.metadata.hashtagCount}
              </span>
            </div>
          )}
          {generatedContent.metadata.qualityScore && (
            <div>
              <span className="text-gray-600">Quality Score:</span>
              <span className="ml-2 text-gray-900">
                {(generatedContent.metadata.qualityScore * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopy}
          className={cn(
            "flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors duration-200",
            copied
              ? "bg-green-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </>
          )}
        </button>

        <button
          onClick={() => {
            console.log('🔴🔴🔴 BUTTON CLICKED - handleSave will be called')
            handleSave()
          }}
          disabled={saving}
          className={cn(
            "flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors duration-200",
            saved
              ? "bg-green-600 text-white"
              : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Saved!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save to Dashboard
            </>
          )}
        </button>

        <button
          onClick={handleEdit}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit & Refine
        </button>

        <button
          onClick={handleNewPost}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Post
        </button>
      </div>
    </div>
  )
}