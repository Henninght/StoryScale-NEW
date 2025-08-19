/**
 * Workspace Layout - Main layout wrapper for the StoryScale workspace
 * Provides responsive sidebar navigation and content area switching
 */

'use client'

import { ReactNode } from 'react'
import { WorkspaceProvider } from '@/context/workspace-context'
import { WorkspaceSidebar } from './workspace-sidebar'
import { WorkspaceContent } from './workspace-content'
import { MobileSidebar } from '../mobile/mobile-sidebar'
import { useResponsive } from '@/hooks/use-responsive'
import { useWorkspace } from '@/hooks/use-workspace'

interface WorkspaceLayoutProps {
  children: ReactNode
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutInner>
        {children}
      </WorkspaceLayoutInner>
    </WorkspaceProvider>
  )
}

function WorkspaceLayoutInner({ children }: WorkspaceLayoutProps) {
  const { isMobile, isTablet } = useResponsive()
  const { state } = useWorkspace()
  const { sidebarCollapsed } = state
  const shouldUseMobileSidebar = isMobile || isTablet
  
  // Dynamic sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-60'
  const contentMargin = shouldUseMobileSidebar ? 'ml-0' : sidebarCollapsed ? 'ml-16' : 'ml-60'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar - Dynamic width */}
      {!shouldUseMobileSidebar && (
        <div className={`flex ${sidebarWidth} flex-col fixed inset-y-0 z-20 transition-all duration-300`}>
          <WorkspaceSidebar />
        </div>
      )}

      {/* Content Area - Responsive margin with transition */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${contentMargin}`}>
        <WorkspaceContent>
          {children}
        </WorkspaceContent>
      </div>

      {/* Mobile Sidebar Overlay */}
      {shouldUseMobileSidebar && <MobileSidebar />}
    </div>
  )
}