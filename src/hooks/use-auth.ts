/**
 * useAuth Hook - React hook for authentication state management
 * Provides user data, loading state, and auth methods
 */

'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { AuthService, UserProfile } from '@/lib/auth/auth-service'

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false
  })
  const [isHydrated, setIsHydrated] = useState(false)

  // Try to recover auth state from localStorage/sessionStorage
  const tryAuthRecovery = async (): Promise<User | null> => {
    try {
      if (typeof window === 'undefined') return null
      
      console.log('🔐 useAuth: Attempting auth recovery from storage...')
      
      // Check sessionStorage first (most recent session)
      const sessionAuth = sessionStorage.getItem('sb-auth-token')
      if (sessionAuth) {
        console.log('🔐 useAuth: Found session auth, attempting recovery...')
        try {
          const sessionData = JSON.parse(sessionAuth)
          if (sessionData.expires_at && Date.now() < sessionData.expires_at * 1000) {
            const user = await AuthService.getCurrentUser()
            if (user) {
              console.log('🔐 useAuth: Auth recovery successful from sessionStorage')
              return user
            }
          }
        } catch (error) {
          console.log('🔐 useAuth: Session auth recovery failed:', error)
        }
      }
      
      // Fallback to localStorage
      const localAuth = localStorage.getItem('sb-auth-token')
      if (localAuth) {
        console.log('🔐 useAuth: Found local auth, attempting recovery...')
        try {
          const localData = JSON.parse(localAuth)
          if (localData.expires_at && Date.now() < localData.expires_at * 1000) {
            const user = await AuthService.getCurrentUser()
            if (user) {
              console.log('🔐 useAuth: Auth recovery successful from localStorage')
              return user
            }
          }
        } catch (error) {
          console.log('🔐 useAuth: Local auth recovery failed:', error)
        }
      }
      
      console.log('🔐 useAuth: No valid auth recovery found')
      return null
    } catch (error) {
      console.error('🔐 useAuth: Auth recovery error:', error)
      return null
    }
  }

  // Retry auth with exponential backoff
  const retryAuth = async (maxRetries = 3, baseDelay = 1000): Promise<User | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔐 useAuth: Auth attempt ${attempt}/${maxRetries}`)
        const user = await AuthService.getCurrentUser()
        if (user) {
          console.log('🔐 useAuth: Auth retry successful')
          return user
        }
        return null // No user found, don't retry
      } catch (error) {
        console.error(`🔐 useAuth: Auth attempt ${attempt} failed:`, error)
        if (attempt === maxRetries) {
          console.error('🔐 useAuth: All auth retries exhausted')
          return null
        }
        // Exponential backoff: wait 1s, 2s, 4s...
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`🔐 useAuth: Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    return null
  }

  useEffect(() => {
    // Initial auth check
    setIsHydrated(true)
    initializeAuth()

    // Fallback timeout to ensure loading state doesn't persist indefinitely
    const fallbackTimeout = setTimeout(() => {
      console.log('🔐 useAuth: Fallback timeout triggered, forcing loading to false')
      setState(prev => {
        if (prev.isLoading) {
          return {
            ...prev,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            profile: null
          }
        }
        return prev
      })
    }, 10000) // 10 second fallback

    // Subscribe to auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        clearTimeout(fallbackTimeout) // Clear fallback since auth resolved
        if (event === 'SIGNED_IN' && session?.user) {
          await handleSignIn(session.user)
        } else if (event === 'SIGNED_OUT') {
          handleSignOut()
        }
      }
    )

    return () => {
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🔐 useAuth: Initializing auth...')
      
      // Always clear loading state after initializeAuth completes
      const clearLoadingTimeout = setTimeout(() => {
        console.log('🔐 useAuth: Clearing loading state after init timeout')
        setState(prev => ({ ...prev, isLoading: false }))
      }, 5000) // Clear loading after 5 seconds max
      
      // Check if we have OAuth tokens in URL (e.g., from OAuth callback)
      if (typeof window !== 'undefined' && window.location.hash) {
        console.log('🔐 useAuth: Found URL hash, processing OAuth tokens...')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (accessToken) {
          console.log('🔐 useAuth: Processing OAuth callback tokens...')
          // Let Supabase handle the session from URL
          const { data: { session }, error: sessionError } = await AuthService.getSessionFromUrl()
          
          if (sessionError) {
            console.error('🔐 useAuth: Session from URL error:', sessionError)
          } else if (session?.user) {
            console.log('🔐 useAuth: Successfully established session from OAuth')
            // Clear the hash from URL
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
            
            await handleSignIn(session.user)
            return
          }
        }
      }
      
      // Try auth recovery from localStorage first
      let user = await tryAuthRecovery()
      
      if (!user) {
        // Add timeout to prevent hanging on auth check
        const userPromise = retryAuth(2, 500) // Reduce retries and delay
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => {
            console.log('🔐 useAuth: Auth check timeout, assuming no user')
            resolve(null)
          }, 3000) // Reduce timeout to 3 seconds
        )
        
        user = await Promise.race([userPromise, timeoutPromise])
      }
      
      console.log('🔐 useAuth: Got user:', user?.email || 'none')
      
      if (user) {
        console.log('🔐 useAuth: User exists, getting profile...')
        try {
          const profile = await AuthService.getUserProfile(user.id)
          console.log('🔐 useAuth: Got profile:', profile?.full_name || 'none')
          
          setState({
            user,
            profile,
            isLoading: false,
            isAuthenticated: true
          })
        } catch (profileError) {
          console.error('🔐 useAuth: Profile fetch error, continuing with user only:', profileError)
          setState({
            user,
            profile: null,
            isLoading: false,
            isAuthenticated: true
          })
        }
      } else {
        console.log('🔐 useAuth: No user found, setting unauthenticated state')
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    } catch (error) {
      console.error('🔐 useAuth: Initialize auth error:', error)
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false
      })
    } finally {
      // Clear the timeout since initialization completed (success or failure)
      clearTimeout(clearLoadingTimeout)
    }
  }

  const handleSignIn = async (user: User) => {
    try {
      // Upsert user profile
      const profile = await AuthService.upsertUserProfile(user)
      
      setState({
        user,
        profile,
        isLoading: false,
        isAuthenticated: true
      })
    } catch (error) {
      console.error('Handle sign in error:', error)
      setState({
        user,
        profile: null,
        isLoading: false,
        isAuthenticated: true
      })
    }
  }

  const handleSignOut = () => {
    setState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false
    })
  }

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const { error } = await AuthService.signInWithGoogle()
      
      if (error) {
        console.error('Sign in error:', error)
        setState(prev => ({ ...prev, isLoading: false }))
        return { error }
      }
      
      // Auth state change will handle the rest
      return { error: null }
    } catch (error) {
      console.error('Sign in with Google error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      return { error }
    }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const { error } = await AuthService.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        setState(prev => ({ ...prev, isLoading: false }))
        return { error }
      }
      
      // Auth state change will handle the rest
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      return { error }
    }
  }

  return {
    ...state,
    isHydrated,
    signInWithGoogle,
    signOut,
    refreshProfile: () => initializeAuth()
  }
}