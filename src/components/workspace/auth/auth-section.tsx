/**
 * AuthSection Component - Authentication UI for sidebar footer
 * Shows Google Sign-in or user profile based on auth state
 */

'use client'

import { useState } from 'react'
import { ChevronUp, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface AuthSectionProps {
  collapsed?: boolean
}

export function AuthSection({ collapsed = false }: AuthSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  let authHookResult
  try {
    authHookResult = useAuth()
  } catch (error) {
    console.error('🔐 AuthSection: Error with useAuth hook:', error)
    setAuthError(error instanceof Error ? error.message : 'Auth initialization failed')
  }
  
  const { 
    user, 
    profile, 
    isLoading, 
    isAuthenticated,
    isHydrated,
    signInWithGoogle, 
    signOut 
  } = authHookResult || {
    user: null,
    profile: null,
    isLoading: false,
    isAuthenticated: false,
    isHydrated: false,
    signInWithGoogle: async () => ({ error: new Error('Auth not initialized') }),
    signOut: async () => ({ error: new Error('Auth not initialized') })
  }
  
  // Debug auth state
  console.log('🔐 AuthSection: Auth state:', {
    user: user?.email || 'none',
    isLoading,
    isAuthenticated,
    profile: profile?.full_name || 'none',
    authError
  })
  
  // Don't render anything until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className={cn(
        "border-t border-gray-200",
        collapsed ? "p-2" : "p-4"
      )}>
        <div className={cn(
          "flex items-center",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          {!collapsed && (
            <div className="flex-1 ml-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // If there's an auth error, show a fallback
  if (authError) {
    return (
      <div className={cn(
        "border-t border-gray-200 p-4 bg-red-50 border-red-200",
        collapsed && "p-2"
      )}>
        <div className={cn(
          "text-center",
          collapsed && "px-1"
        )}>
          {collapsed ? (
            <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 text-xs">!</span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-red-600 mb-2">Auth Error</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors duration-150"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  const handleSignInWithGoogle = async () => {
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        console.error('Sign in failed:', error)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }
  
  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Sign out failed:', error)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    console.log('🔐 AuthSection: Rendering loading state')
    return (
      <div className={cn(
        "border-t border-gray-200",
        collapsed ? "p-2" : "p-4"
      )}>
        <div className={cn(
          "flex items-center animate-pulse",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          {!collapsed && (
            <div className="flex-1 ml-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('🔐 AuthSection: Rendering unauthenticated state, collapsed:', collapsed)
    if (collapsed) {
      return (
        <div className="relative group border-t border-gray-200">
          <button
            onClick={handleSignInWithGoogle}
            disabled={isLoading}
            className="w-full p-3 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-full ml-2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Sign in with Google
            <div className="absolute top-full left-4 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )
    }

    return (
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignInWithGoogle}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    )
  }

  // Collapsed mode - show only avatar with hover menu
  if (collapsed) {
    return (
      <div className="relative group border-t border-gray-200">
        <button className="w-full p-3 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150">
          {/* User Avatar */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </button>
        
        {/* Hover Menu */}
        <div className="absolute bottom-full left-full ml-2 mb-2 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-48">
          {/* User Info Header */}
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {profile?.plan || 'Free'} Plan
            </p>
          </div>
          {/* Menu Options */}
          <div className="py-1">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
              Account Settings
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150">
              Upgrade Plan
            </button>
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Normal expanded mode
  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center hover:bg-gray-50 transition-colors duration-150"
      >
        {/* User Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="w-8 h-8 rounded-full mr-3"
          />
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-full mr-3 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        
        {/* User Info */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-gray-900 truncate">
            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {profile?.plan || 'Free'} Plan
          </p>
        </div>

        {/* Expand Icon */}
        <ChevronUp
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isExpanded ? "" : "rotate-180"
          )}
          strokeWidth={1.5}
        />
      </button>

      {/* Expanded Menu */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150">
            Account Settings
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150">
            Upgrade Plan
          </button>
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-150"
          >
            {isLoading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}