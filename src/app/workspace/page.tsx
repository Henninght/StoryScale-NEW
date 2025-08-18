/**
 * Dashboard Page - Professional StoryScale dashboard
 * Matches design references exactly with real data integration
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3, Clock, CheckCircle2, MoreVertical } from 'lucide-react'
import { SaveService } from '@/lib/dashboard/save-service'

// Inline types to avoid import issues
interface DashboardStats {
  totalPosts: number
  timeSaved: { hours: number; minutes: number }
  completionRate: number
  postTypes: {
    thoughtLeadership: number
    personalStories: number
    promotional: number
  }
  recentActivity: Array<{
    id: string
    title: string
    action: 'created' | 'edited' | 'published'
    timestamp: string
  }>
}

interface WorkItem {
  id: string
  title: string
  target: string
  purpose: string
  status: 'Draft' | 'Published' | 'Archived'
  lastEdited: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    timeSaved: { hours: 0, minutes: 0 },
    completionRate: 0,
    postTypes: {
      thoughtLeadership: 0,
      personalStories: 0,
      promotional: 0
    },
    recentActivity: []
  })
  
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load saved posts on component mount
  useEffect(() => {
    loadSavedPosts()
  }, [])

  const loadSavedPosts = () => {
    try {
      // Get saved posts from SaveService
      const savedPosts = SaveService.getSavedPostsAsWorkItems()
      const saveStats = SaveService.getStats()
      
      setWorkItems(savedPosts)
      
      // Calculate stats from saved posts
      const timeSaved = SaveService.calculateTimeSaved(saveStats.totalPosts)
      const completionRate = saveStats.totalPosts > 0 
        ? Math.round((saveStats.publishedCount / saveStats.totalPosts) * 100)
        : 0

      // Calculate post type distribution
      const purposeCounts = savedPosts.reduce((acc, item) => {
        const purpose = item.purpose.toLowerCase()
        if (purpose.includes('insights') || purpose.includes('thought') || purpose.includes('authority')) {
          acc.thoughtLeadership++
        } else if (purpose.includes('story') || purpose.includes('share') || purpose.includes('personal')) {
          acc.personalStories++
        } else if (purpose.includes('value') || purpose.includes('lead') || purpose.includes('promotional')) {
          acc.promotional++
        } else {
          acc.thoughtLeadership++ // Default
        }
        return acc
      }, { thoughtLeadership: 0, personalStories: 0, promotional: 0 })

      const total = saveStats.totalPosts || 1
      const postTypes = {
        thoughtLeadership: Math.round((purposeCounts.thoughtLeadership / total) * 100),
        personalStories: Math.round((purposeCounts.personalStories / total) * 100),
        promotional: Math.round((purposeCounts.promotional / total) * 100)
      }

      setStats({
        totalPosts: saveStats.totalPosts,
        timeSaved,
        completionRate,
        postTypes,
        recentActivity: savedPosts.slice(0, 3).map(item => ({
          id: item.id,
          title: item.title,
          action: item.status === 'Published' ? 'published' as const : 'created' as const,
          timestamp: item.lastEdited
        }))
      })
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading saved posts:', error)
      setIsLoading(false)
    }
  }

  const hasWorkItems = workItems.length > 0

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header - matches design reference */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Your dashboard</h1>
            <p className="text-gray-500 text-base">Track your content progress and access your tools • henninghammertorp@gmail.com</p>
          </div>
          
          {/* Tools Dropdown - matches design reference orange button */}
          <div className="relative">
            <button className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-150">
              <span className="mr-2">🔧</span>
              Tools
              <ChevronDown className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Post Types Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-purple-600 bg-purple-100">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Post Types</h3>
                <p className="text-xs text-gray-500">Content Type Breakdown</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">💡 Thought Leadership</span>
                <span className="text-sm font-medium text-blue-600">{stats.postTypes.thoughtLeadership}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">📖 Personal Stories</span>
                <span className="text-sm font-medium text-orange-600">{stats.postTypes.personalStories}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">🎁 Value/Promotional</span>
                <span className="text-sm font-medium text-green-600">{stats.postTypes.promotional}%</span>
              </div>
            </div>
          </div>

          {/* Draft Completion Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-green-600 bg-green-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Draft Completion</h3>
                <p className="text-xs text-gray-500">Draft Completion Rate</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{stats.totalPosts} drafts started</span>
                <span className="text-sm text-gray-400">•</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{SaveService.getStats().publishedCount} completed</span>
                <span className="text-sm text-gray-400">•</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{SaveService.getStats().draftCount} pending</span>
                <span className="text-sm text-gray-400">•</span>
              </div>
              {SaveService.getStats().draftCount > 0 && (
                <div className="mt-2 text-xs text-red-600">⚠️ Finish your drafts to stay consistent!</div>
              )}
            </div>
          </div>

          {/* Time Saved Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-blue-600 bg-blue-100">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Time Saved</h3>
                <p className="text-xs text-gray-500">AI Productivity Impact</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Time Saved:</span>
                <span className="text-sm font-semibold text-green-600">{stats.timeSaved.hours}h {stats.timeSaved.minutes}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Time Saved per Post:</span>
                <span className="text-sm text-gray-500">51min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Posts Created:</span>
                <span className="text-sm text-gray-500">{stats.totalPosts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Work Section */}
        {hasWorkItems ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your work</h2>
                  <p className="text-sm text-gray-500 mt-1">Showing {workItems.length} of {workItems.length} drafts</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center">
                    Show: All
                    <ChevronDown className="ml-1 w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TITLE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TARGET
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PURPOSE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LAST EDITED
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {workItems.map((item, index) => {
                    // Get the full saved post data for character count
                    const savedPost = SaveService.getSavedPost(item.id)
                    const characterCount = savedPost?.metadata?.characterCount || savedPost?.content?.length || 0
                    
                    return (
                    <tr 
                      key={item.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      onClick={() => window.location.href = `/workspace/editor?postId=${item.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="max-w-sm">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-400">
                            {characterCount} characters
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {item.target}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {item.purpose}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 
                          item.status === 'Published' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.lastEdited}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Your work</h2>
              <p className="text-sm text-gray-500">Showing 0 of 0 drafts</p>
            </div>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No saved posts yet
              </h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Create your first LinkedIn post to see it here
              </p>
              <button 
                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-150"
                onClick={() => window.location.href = '/workspace/linkedin'}
              >
                Create First Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}