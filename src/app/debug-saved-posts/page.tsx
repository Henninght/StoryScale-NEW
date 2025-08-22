'use client'

import { useState, useEffect } from 'react'
import { SaveService } from '@/lib/dashboard/save-service'
import { useAuth } from '@/hooks/use-auth'

export default function DebugSavedPosts() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const loadPosts = async () => {
      try {
        console.log('🐛 DEBUG: Loading saved posts...')
        const savedPosts = await SaveService.getSavedPosts()
        console.log('🐛 DEBUG: Retrieved posts:', savedPosts)
        setPosts(savedPosts)
      } catch (error) {
        console.error('🐛 DEBUG: Error loading posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  const handleCreateMockPosts = async () => {
    console.log('🐛 DEBUG: Creating mock posts...')
    SaveService.createMockSavedPosts()
    
    // Test immediately after creation
    const post1 = await SaveService.getSavedPost('1')
    const post2 = await SaveService.getSavedPost('2')
    
    console.log('🐛 DEBUG: Post 1:', post1)
    console.log('🐛 DEBUG: Post 2:', post2)
    
    window.location.reload()
  }

  const handleClearPosts = () => {
    localStorage.removeItem('storyscale_saved_posts')
    window.location.reload()
  }

  if (loading) {
    return <div className="p-8">Loading saved posts...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug: Saved Posts</h1>
      
      <div className="mb-4 space-x-4">
        <button 
          onClick={handleCreateMockPosts}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Mock Posts
        </button>
        <button 
          onClick={handleClearPosts}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Clear All Posts
        </button>
      </div>

      <div className="mb-4">
        <p><strong>User:</strong> {user?.email || 'Not authenticated'}</p>
        <p><strong>Total Posts:</strong> {posts.length}</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-gray-500">No saved posts found</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div key={post.id} className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Post {index + 1}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>ID:</strong> {post.id}</p>
                  <p><strong>Title:</strong> {post.title}</p>
                  <p><strong>Purpose:</strong> {post.purpose}</p>
                  <p><strong>Target:</strong> {post.target}</p>
                  <p><strong>Status:</strong> {post.status}</p>
                </div>
                <div>
                  <p><strong>Character Count:</strong> {post.metadata?.characterCount || 'N/A'}</p>
                  <p><strong>Word Count:</strong> {post.metadata?.wordCount || 'N/A'}</p>
                  <p><strong>Model Used:</strong> {post.metadata?.modelUsed || 'N/A'}</p>
                  <p><strong>Quality Score:</strong> {post.metadata?.qualityScore || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p><strong>Content:</strong></p>
                <div className="bg-gray-100 p-3 rounded text-sm max-h-40 overflow-y-auto">
                  {post.content || 'No content'}
                </div>
              </div>

              <div className="mt-4">
                <p><strong>Wizard Settings:</strong></p>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  {post.wizardSettings ? JSON.stringify(post.wizardSettings, null, 2) : 'No wizard settings'}
                </div>
              </div>

              <div className="mt-4 space-x-2">
                <button 
                  onClick={() => window.open(`/workspace/editor?postId=${post.id}`, '_blank')}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm"
                >
                  Test Edit & Refine
                </button>
                <button 
                  onClick={() => {
                    if (post.wizardSettings) {
                      sessionStorage.setItem('wizardSettings', JSON.stringify(post.wizardSettings))
                      window.open('/workspace/linkedin', '_blank')
                    } else {
                      alert('No wizard settings found for this post')
                    }
                  }}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
                >
                  Test Back to Wizard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}