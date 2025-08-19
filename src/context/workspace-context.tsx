/**
 * Workspace Context - Global state management for workspace navigation and layout
 * Manages view switching, sidebar state, and responsive behavior
 */

'use client'

import { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// Types
export type ViewType = 'dashboard' | 'linkedin-wizard' | 'content-editor' | 'settings'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

export interface WorkspaceState {
  currentView: ViewType
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  isMobile: boolean
  toolsDropdownOpen: boolean
  breadcrumb: BreadcrumbItem[]
  isLoading: boolean
}

export type WorkspaceAction = 
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR_COLLAPSE' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_MOBILE'; payload: boolean }
  | { type: 'TOGGLE_TOOLS_DROPDOWN' }
  | { type: 'SET_TOOLS_DROPDOWN_OPEN'; payload: boolean }
  | { type: 'SET_BREADCRUMB'; payload: BreadcrumbItem[] }
  | { type: 'SET_LOADING'; payload: boolean }

// Initial state
const initialState: WorkspaceState = {
  currentView: 'dashboard',
  sidebarOpen: false, // Closed by default on mobile
  sidebarCollapsed: false, // Expanded by default
  isMobile: false,
  toolsDropdownOpen: false,
  breadcrumb: [{ label: 'Dashboard', current: true }],
  isLoading: false
}

// Reducer
function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload,
        breadcrumb: getBreadcrumbForView(action.payload)
      }
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      }
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload
      }
    case 'TOGGLE_SIDEBAR_COLLAPSE':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      }
    case 'SET_SIDEBAR_COLLAPSED':
      return {
        ...state,
        sidebarCollapsed: action.payload
      }
    case 'SET_MOBILE':
      return {
        ...state,
        isMobile: action.payload,
        // Auto-close sidebar on mobile when switching to desktop
        sidebarOpen: action.payload ? state.sidebarOpen : false
      }
    case 'TOGGLE_TOOLS_DROPDOWN':
      return {
        ...state,
        toolsDropdownOpen: !state.toolsDropdownOpen
      }
    case 'SET_TOOLS_DROPDOWN_OPEN':
      return {
        ...state,
        toolsDropdownOpen: action.payload
      }
    case 'SET_BREADCRUMB':
      return {
        ...state,
        breadcrumb: action.payload
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    default:
      return state
  }
}

// Helper function to get breadcrumb for each view
function getBreadcrumbForView(view: ViewType): BreadcrumbItem[] {
  switch (view) {
    case 'dashboard':
      return [{ label: 'Dashboard', current: true }]
    case 'linkedin-wizard':
      return [
        { label: 'LinkedIn Tools', href: '/workspace/linkedin' },
        { label: 'Post Wizard', current: true }
      ]
    case 'content-editor':
      return [
        { label: 'Tools', href: '/workspace' },
        { label: 'Content Editor', current: true }
      ]
    case 'settings':
      return [{ label: 'Settings', current: true }]
    default:
      return [{ label: 'Dashboard', current: true }]
  }
}

// Helper function to determine view from pathname
function getViewFromPath(pathname: string): ViewType {
  if (pathname.includes('/workspace/linkedin')) {
    return 'linkedin-wizard'
  }
  if (pathname.includes('/workspace/editor')) {
    return 'content-editor'
  }
  if (pathname.includes('/workspace/settings')) {
    return 'settings'
  }
  return 'dashboard'
}

// Context
interface WorkspaceContextValue {
  state: WorkspaceState
  dispatch: React.Dispatch<WorkspaceAction>
  // Helper functions
  setView: (view: ViewType) => void
  toggleSidebar: () => void
  closeSidebar: () => void
  toggleSidebarCollapse: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleToolsDropdown: () => void
  closeToolsDropdown: () => void
  navigate: (path: string) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

// Provider component
interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  // Initialize state with default values first to prevent hydration mismatch
  const [state, dispatch] = useReducer(workspaceReducer, initialState)
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Hydrate localStorage values after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('sidebar-collapsed') === 'true'
      if (savedCollapsed !== state.sidebarCollapsed) {
        dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: savedCollapsed })
      }
      setIsHydrated(true)
    }
  }, [])

  // Sync URL with workspace state
  useEffect(() => {
    const view = getViewFromPath(pathname)
    if (view !== state.currentView) {
      dispatch({ type: 'SET_VIEW', payload: view })
    }
  }, [pathname, state.currentView])

  // Handle window resize for mobile detection
  useEffect(() => {
    function handleResize() {
      const isMobile = window.innerWidth < 768
      dispatch({ type: 'SET_MOBILE', payload: isMobile })
    }

    // Only set initial mobile state after hydration
    if (typeof window !== 'undefined') {
      handleResize()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close dropdowns when clicking outside or navigating
  useEffect(() => {
    function handleClickOutside() {
      if (state.toolsDropdownOpen) {
        dispatch({ type: 'SET_TOOLS_DROPDOWN_OPEN', payload: false })
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [state.toolsDropdownOpen])

  // Helper functions
  const setView = (view: ViewType) => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  const closeSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })
  }

  const toggleToolsDropdown = () => {
    dispatch({ type: 'TOGGLE_TOOLS_DROPDOWN' })
  }

  const closeToolsDropdown = () => {
    dispatch({ type: 'SET_TOOLS_DROPDOWN_OPEN', payload: false })
  }

  const toggleSidebarCollapse = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR_COLLAPSE' })
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed })
  }

  const navigate = (path: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    router.push(path)
    // Loading will be set to false when new route loads
    setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 100)
  }

  // Persist sidebar collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', state.sidebarCollapsed.toString())
    }
  }, [state.sidebarCollapsed])

  const value: WorkspaceContextValue = {
    state,
    dispatch,
    setView,
    toggleSidebar,
    closeSidebar,
    toggleSidebarCollapse,
    setSidebarCollapsed,
    toggleToolsDropdown,
    closeToolsDropdown,
    navigate
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// Hook to use workspace context
export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return context
}

// Additional hooks for specific workspace functionality
export function useWorkspaceNavigation() {
  const { navigate, setView, state } = useWorkspace()
  
  return {
    currentView: state.currentView,
    navigateTo: navigate,
    setCurrentView: setView,
    breadcrumb: state.breadcrumb
  }
}

export function useWorkspaceMobile() {
  const { state, toggleSidebar, closeSidebar } = useWorkspace()
  
  return {
    isMobile: state.isMobile,
    sidebarOpen: state.sidebarOpen,
    toggleSidebar,
    closeSidebar
  }
}