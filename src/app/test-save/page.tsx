'use client'

import { useState } from 'react'
import { SaveService } from '@/lib/dashboard/save-service'

export default function TestSavePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testSave = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const saveResult = await SaveService.savePost(
        'This is a test post content generated for testing the save functionality.',
        {
          characterCount: 75,
          wordCount: 13,
          hashtagCount: 0,
          modelUsed: 'test-model',
          processingTime: 1000,
          qualityScore: 0.9
        },
        {
          purpose: 'Test Purpose',
          target: 'Test Audience'
        }
      )
      
      setResult(JSON.stringify(saveResult, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testLoad = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const posts = await SaveService.getSavedPosts()
      setResult(JSON.stringify(posts, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Save Functionality</h1>
      
      <div className="space-y-4">
        <button
          onClick={testSave}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Save'}
        </button>
        
        <button
          onClick={testLoad}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Load'}
        </button>
      </div>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-sm">
          {result}
        </pre>
      )}
    </div>
  )
}