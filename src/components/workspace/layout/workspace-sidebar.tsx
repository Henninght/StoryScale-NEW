/**
 * Workspace Sidebar - Responsive sidebar with navigation
 * Supports collapsed/expanded states with brand header, navigation, and auth
 */

'use client'

import { SidebarNavigation } from '../navigation/sidebar-navigation'
import { AuthSection } from '../auth/auth-section'
import { useWorkspace } from '@/hooks/use-workspace'
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WorkspaceSidebar() {
  const { state, toggleSidebarCollapse } = useWorkspace()
  const { sidebarCollapsed } = state

  return (
    <div className={cn(
      "flex flex-col h-full bg-gray-50 border-r border-gray-200 transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-60"
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className={cn(
          "flex items-center transition-opacity duration-200",
          sidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}>
          {/* StoryScale Logo */}
          <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-orange-600">StoryScale</h1>
            <p className="text-xs text-gray-500">AI Content Studio</p>
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebarCollapse}
          className={cn(
            "p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200",
            sidebarCollapsed && "mx-auto"
          )}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <SidebarNavigation collapsed={sidebarCollapsed} />
      </nav>

      {/* Authentication Section */}
      <AuthSection collapsed={sidebarCollapsed} />
    </div>
  )
}