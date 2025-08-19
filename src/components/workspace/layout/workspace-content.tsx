/**
 * Workspace Content - Main content area with header and dynamic view switching
 * Contains the workspace header with tools dropdown and breadcrumb navigation
 */

'use client'

import { ReactNode } from 'react'
import { WorkspaceHeader } from './workspace-header'
import { useWorkspace } from '@/context/workspace-context'

interface WorkspaceContentProps {
  children: ReactNode
}

export function WorkspaceContent({ children }: WorkspaceContentProps) {
  const { state } = useWorkspace()

  return (
    <div className="flex flex-col h-full">
      {/* Header with Breadcrumb and Tools Dropdown */}
      <WorkspaceHeader />
      
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        {state.isLoading ? (
          <WorkspaceContentSkeleton />
        ) : (
          <div className="min-h-full">
            {children}
          </div>
        )}
      </main>
    </div>
  )
}

// Loading skeleton for view transitions
function WorkspaceContentSkeleton() {
  return (
    <div className="h-full p-8 animate-pulse">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
        
        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        
        {/* Card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}