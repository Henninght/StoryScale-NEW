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

  useEffect(() => {
    // Initial auth check
    setIsHydrated(true)
    initializeAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleSignIn(session.user)
        } else if (event === 'SIGNED_OUT') {
          handleSignOut()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🔐 useAuth: Initializing auth...')
      
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
      
      // Add timeout to prevent hanging on auth check
      const userPromise = AuthService.getCurrentUser()
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => {
          console.log('🔐 useAuth: Auth check timeout, assuming no user')
          resolve(null)
        }, 2000) // 2 second timeout
      )
      
      const user = await Promise.race([userPromise, timeoutPromise])
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