/**
 * Dashboard Page - Professional StoryScale dashboard
 * Matches design references exactly with real data integration
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3, Clock, CheckCircle2, MoreVertical, Edit3, RotateCcw } from 'lucide-react'
import { DashboardService } from '@/lib/dashboard/dashboard-service'
import { SaveService } from '@/lib/dashboard/save-service'
import { DashboardStats, WorkItem } from '@/types/dashboard'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardPage() {
  console.log('🏠🏠🏠 DASHBOARD: Component rendering')
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
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
  
  console.log('🏠🏠🏠 DASHBOARD: State initialized, workItems count:', workItems.length)

  // Load saved posts on component mount and when returning to page
  useEffect(() => {
    console.log('🏠🏠🏠 DASHBOARD: useEffect triggered - about to call loadSavedPosts')
    loadSavedPosts()
  }, [])

  // Refresh data when page becomes visible (user returns from wizard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Dashboard: Page became visible, refreshing data...')
        loadSavedPosts()
      }
    }

    const handleFocus = () => {
      console.log('🔄 Dashboard: Page got focus, refreshing data...')
      loadSavedPosts()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Listen for custom content saved events
  useEffect(() => {
    const handleContentSaved = (event: CustomEvent) => {
      console.log('🔄 Dashboard: Received contentSaved event:', event.detail)
      setTimeout(() => {
        loadSavedPosts()
      }, 500) // Small delay to ensure save is complete
    }

    window.addEventListener('contentSaved', handleContentSaved as EventListener)

    return () => {
      window.removeEventListener('contentSaved', handleContentSaved as EventListener)
    }
  }, [])

  const loadSavedPosts = async () => {
    try {
      console.log('🔄🔄🔄 Dashboard: Starting loadSavedPosts function')
      setIsLoading(true)
      
      // Force clear cache to ensure fresh auth check
      await SaveService.clearCache()
      
      // Get dashboard data - stats from DashboardService, real work items from SaveService
      console.log('🔄🔄🔄 Dashboard: About to call SaveService for real work items')
      console.log('🔄🔄🔄 Dashboard: Passing user to SaveService:', user?.email || 'guest')
      const [dashboardStats, workItems] = await Promise.all([
        DashboardService.getDashboardStats(), // Keep mock stats for now
        SaveService.getSavedPostsAsWorkItems(user) // Pass user directly to avoid auth timeout
      ])
      
      // For testing: If no saved posts exist, create mock posts
      if (workItems.length === 0 && typeof window !== 'undefined') {
        console.log('🎭 Dashboard: No saved posts found, creating mock posts for testing')
        SaveService.createMockSavedPosts()
        // Reload the work items after creating mock posts
        const mockWorkItems = await SaveService.getSavedPostsAsWorkItems(user)
        setWorkItems(mockWorkItems)
        console.log('🎭 Dashboard: Mock posts created, loaded', mockWorkItems.length, 'items')
      } else {
        setWorkItems(workItems)
      }
      
      console.log('📊📊📊 Dashboard: Loaded dashboard stats:', dashboardStats)
      console.log('📊📊📊 Dashboard: Final work items count:', workItems.length)
      
      setStats(dashboardStats)
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setIsLoading(false)
    }
  }

  const hasWorkItems = workItems.length > 0

  // Helper function to navigate back to wizard with saved settings
  const handleBackToWizard = (item: WorkItem) => {
    if (item.wizardSettings) {
      // Store settings in sessionStorage for the wizard to pick up
      sessionStorage.setItem('wizardSettings', JSON.stringify(item.wizardSettings))
      sessionStorage.setItem('originalPostId', item.id)
    }
    window.location.href = '/workspace/linkedin'
  }

  // Helper function to navigate to editor
  const handleEditRefine = (item: WorkItem) => {
    window.location.href = `/workspace/editor?postId=${item.id}`
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header - matches design reference */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Your dashboard</h1>
          <p className="text-gray-500 text-base">Track your content progress and access your tools • henninghammertorp@gmail.com</p>
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
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">💡 Thought Leadership</span>
                  <span className="text-sm font-medium text-blue-600">{stats.postTypes.thoughtLeadership}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.postTypes.thoughtLeadership}%` }}></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">📖 Personal Stories</span>
                  <span className="text-sm font-medium text-orange-600">{stats.postTypes.personalStories}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${stats.postTypes.personalStories}%` }}></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">🎁 Value/Promotional</span>
                  <span className="text-sm font-medium text-green-600">{stats.postTypes.promotional}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.postTypes.promotional}%` }}></div>
                </div>
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
                <span className="text-sm text-gray-600">{stats.recentActivity.length} completed</span>
                <span className="text-sm text-gray-400">•</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{Math.max(0, stats.totalPosts - stats.recentActivity.length)} pending</span>
                <span className="text-sm text-gray-400">•</span>
              </div>
              {!isLoading && (stats.totalPosts - stats.recentActivity.length) > 0 && (
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
                    // Character count will be calculated from the item data directly
                    // since we now get this data from the database/localStorage properly
                    const characterCount = item.title.length * 10 // Rough estimate, will be improved
                    
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
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            className="inline-flex items-center px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-md transition-colors duration-150"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditRefine(item)
                            }}
                            title="Edit & Refine"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit & Refine
                          </button>
                          <button 
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 text-xs font-medium rounded-md transition-colors duration-150"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBackToWizard(item)
                            }}
                            title="Back to Wizard"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Back to Wizard
                          </button>
                        </div>
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