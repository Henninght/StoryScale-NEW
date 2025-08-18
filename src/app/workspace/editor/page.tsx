/**
 * Editor Page - Edit & Refine tool
 * Supports loading drafts via URL parameters
 */

'use client'

import { Metadata } from 'next'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { validateFunction, QualityScore } from '@/lib/functions/validate-function'
import { LanguageAwareContentRequest, SupportedLanguage } from '@/lib/types/language-aware-request'
import { SaveService } from '@/lib/dashboard/save-service'

// Fallback function for old draft format
function getDraftContent(draftId: string, title: string): string {
  return `# ${decodeURIComponent(title)}\n\nStart editing your draft here...`
}

export default function EditorPage() {
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draft')
  const title = searchParams.get('title')
  const [content, setContent] = useState('')
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationId, setValidationId] = useState(0)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [versionHistory, setVersionHistory] = useState<Array<{id: string, content: string, timestamp: Date, qualityScore?: number}>>([])  
  const [currentPost, setCurrentPost] = useState<any>(null)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const postId = searchParams.get('postId')
    
    if (postId) {
      // Load saved post from SaveService
      const savedPost = SaveService.getSavedPost(postId)
      if (savedPost) {
        setCurrentPost(savedPost)
        setContent(savedPost.content)
        // Add initial version to history
        setVersionHistory([{
          id: `v1-${Date.now()}`,
          content: savedPost.content,
          timestamp: new Date(),
          qualityScore: savedPost.metadata.qualityScore
        }])
        // Initial quality validation
        validateContent(savedPost.content)
      }
    } else if (draftId && title) {
      // Fallback for old URL format
      const draftContent = getDraftContent(draftId, title)
      setContent(draftContent)
      // Add initial version to history
      setVersionHistory([{
        id: `v1-${Date.now()}`,
        content: draftContent,
        timestamp: new Date(),
      }])
      // Initial quality validation
      validateContent(draftContent)
    }
  }, [draftId, title, searchParams])

  // Debounced validation function
  const validateContent = useCallback(async (text: string) => {
    if (!text.trim()) {
      setQualityScore(null)
      return
    }

    setIsValidating(true)
    const currentValidationId = Date.now()
    setValidationId(currentValidationId)

    try {
      // Create mock validation context
      const mockRequest: LanguageAwareContentRequest = {
        description: 'Content validation',
        type: 'linkedin-post',
        outputLanguage: 'en' as SupportedLanguage,
        purpose: 'share-insights',
        audience: 'professionals',
        tone: 'professional',
        format: 'insight',
      }

      const mockContext = {
        request: mockRequest,
        response: { content: text, language: 'en' as SupportedLanguage }
      }

      const result = await validateFunction.validate(text, mockContext)
      
      // Only update if this is still the latest validation
      if (currentValidationId === validationId || currentValidationId > validationId) {
        setQualityScore(result)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setIsValidating(false)
    }
  }, [validationId])

  // Handle content changes with debounced validation
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    
    // Set new timeout for validation (debounce 1 second)
    validationTimeoutRef.current = setTimeout(() => {
      validateContent(newContent)
    }, 1000)
  }, [validateContent])

  // Save version to history
  const saveVersion = useCallback(() => {
    const newVersion = {
      id: `v${versionHistory.length + 1}-${Date.now()}`,
      content,
      timestamp: new Date(),
      qualityScore: qualityScore?.overall
    }
    setVersionHistory(prev => [...prev, newVersion])
  }, [content, qualityScore, versionHistory.length])

  // Save changes to SaveService
  const saveChanges = useCallback(async () => {
    if (currentPost) {
      const result = await SaveService.updatePost(currentPost.id, {
        content,
        metadata: {
          ...currentPost.metadata,
          characterCount: content.length,
          wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
        }
      })
      
      if (result.success) {
        // Update current post state
        setCurrentPost(prev => ({
          ...prev,
          content,
          lastEdited: new Date(),
          metadata: {
            ...prev.metadata,
            characterCount: content.length,
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
          }
        }))
      }
      
      return result
    }
    return { success: false, error: 'No post to save' }
  }, [currentPost, content])

  // Enhance content function
  const enhanceContent = useCallback(async () => {
    setIsEnhancing(true)
    try {
      // Save current version before enhancement
      saveVersion()
      
      // Mock enhancement - in real implementation, this would call the AI enhancement API
      const enhancedContent = content + '\n\n✨ Enhanced with AI suggestions for better engagement and clarity.'
      setContent(enhancedContent)
      await validateContent(enhancedContent)
    } catch (error) {
      console.error('Enhancement failed:', error)
    } finally {
      setIsEnhancing(false)
    }
  }, [content, saveVersion, validateContent])

  // Quality indicator component
  const QualityIndicator = ({ score }: { score: number | undefined }) => {
    if (score === undefined) return null
    
    const getQualityColor = (score: number) => {
      if (score >= 0.8) return 'bg-green-500'
      if (score >= 0.6) return 'bg-yellow-500'
      return 'bg-red-500'
    }
    
    const getQualityLabel = (score: number) => {
      if (score >= 0.8) return 'Excellent'
      if (score >= 0.7) return 'Good'
      if (score >= 0.6) return 'Fair'
      return 'Needs Improvement'
    }
    
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${getQualityColor(score)}`}></div>
        <span className="text-sm text-gray-600">
          Quality: {getQualityLabel(score)} ({(score * 100).toFixed(0)}%)
        </span>
      </div>
    )
  }
  return (
    <div className="h-full flex">
      {/* Configuration Sidebar - 380px as per design reference */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Configuration</h2>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button className="border-b-2 border-blue-600 text-blue-600 py-2 px-1 text-sm font-medium">
                Essentials
              </button>
              <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-2 px-1 text-sm font-medium">
                Required
              </button>
            </nav>
          </div>

          {/* Content Type */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Content Type
            </label>
            <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option>LinkedIn Post</option>
              <option>Blog Article</option>
              <option>Marketing Copy</option>
            </select>
          </div>

          {/* Tone Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Tone
            </label>
            <div className="space-y-2">
              {['Professional', 'Friendly', 'Authoritative', 'Casual'].map((tone) => (
                <label key={tone} className="flex items-center">
                  <input
                    type="radio"
                    name="tone"
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    defaultChecked={tone === 'Professional'}
                  />
                  <span className="ml-2 text-sm text-gray-700">{tone}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Enhancement Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Enhancement Options
            </label>
            <div className="space-y-2">
              {[
                { name: 'Add emojis', badge: 'New' },
                { name: 'Improve readability', badge: '' },
                { name: 'Add call-to-action', badge: '' },
                { name: 'Research insights', badge: 'Pro' }
              ].map((option) => (
                <label key={option.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.name}</span>
                  </div>
                  {option.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {option.badge}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Details */}
        {qualityScore && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quality Analysis</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Content:</span>
                <span>{(qualityScore.breakdown.content_quality * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Language:</span>
                <span>{(qualityScore.breakdown.language_quality * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Structure:</span>
                <span>{(qualityScore.breakdown.structure_quality * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Engagement:</span>
                <span>{(qualityScore.breakdown.engagement_potential * 100).toFixed(0)}%</span>
              </div>
            </div>
            {qualityScore.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-600 mb-2">Suggestions</h4>
                <div className="space-y-1">
                  {qualityScore.suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      • {suggestion.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Version History */}
        {versionHistory.length > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Version History</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {versionHistory.slice().reverse().map((version, index) => (
                <div 
                  key={version.id}
                  className="flex items-center justify-between p-2 bg-white rounded text-xs cursor-pointer hover:bg-gray-50"
                  onClick={() => setContent(version.content)}
                >
                  <span className="font-medium">
                    {version.id.startsWith('v1') ? 'Original' : `Version ${versionHistory.length - index}`}
                  </span>
                  <div className="flex items-center space-x-2">
                    {version.qualityScore && (
                      <span className="text-gray-500">
                        {(version.qualityScore * 100).toFixed(0)}%
                      </span>
                    )}
                    <span className="text-gray-400">
                      {version.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhance Button */}
        <div className="p-6 border-t border-gray-200">
          <button 
            onClick={enhanceContent}
            disabled={isEnhancing || !content.trim()}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors duration-150 flex items-center justify-center"
          >
            {isEnhancing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Enhancing...
              </>
            ) : (
              '✨ Enhance Draft'
            )}
          </button>
        </div>
      </div>

      {/* Content Editor Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Editor Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                {currentPost ? `Editing: ${currentPost.title}` : 
                 title ? `Editing: ${decodeURIComponent(title)}` : 'Content Editor'}
              </h1>
              {currentPost && (
                <p className="text-sm text-gray-500 mt-1">
                  {currentPost.purpose} • {currentPost.target} • {currentPost.metadata.characterCount} characters
                </p>
              )}
              {draftId && !currentPost && (
                <p className="text-sm text-gray-500 mt-1">Draft ID: {draftId}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{content.length}/2200 characters</span>
              {isValidating ? (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm text-gray-600">Analyzing quality...</span>
                </div>
              ) : (
                <QualityIndicator score={qualityScore?.overall} />
              )}
              <button
                onClick={currentPost ? async () => {
                  saveVersion()
                  await saveChanges()
                } : saveVersion}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                {currentPost ? 'Save Changes' : 'Save Version'}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <textarea
              className="w-full h-full p-6 resize-none border-none focus:ring-0 focus:outline-none"
              placeholder="Paste your content here to start editing and refining..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}