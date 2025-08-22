/**
 * Authentication Service - Supabase auth integration
 * Handles Google OAuth, user sessions, and profile management
 */

import { supabaseClient } from '@/lib/database/supabase'
import { AuthError, User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  plan: 'free' | 'pro' | 'enterprise'
  quota_usage: number
  created_at: string
}

export class AuthService {
  
  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<{ error?: AuthError }> {
    try {
      // Force localhost redirect in development to prevent redirect to production
      const redirectUrl = process.env.NODE_ENV === 'development' 
        ? `${window.location.origin}/workspace` // Use actual port instead of hardcoded 3008
        : `${window.location.origin}/workspace`
      
      console.log('🔐 Signing in with Google, redirect to:', redirectUrl)
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })
      
      return { error: error || undefined }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { error: error as AuthError }
    }
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<{ error?: AuthError }> {
    try {
      const { error } = await supabaseClient.auth.signOut()
      return { error: error || undefined }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: error as AuthError }
    }
  }

  /**
   * Get current user - optimized to prevent session invalidation
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      // Use getSession instead of getUser to avoid unnecessary network calls
      // that might invalidate the current session
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      
      if (error) {
        console.error('Get session error:', error)
        return null
      }
      
      return session?.user || null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  /**
   * Get user profile with plan information
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Get user profile error:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  }

  /**
   * Create or update user profile after OAuth
   */
  static async upsertUserProfile(user: User): Promise<UserProfile | null> {
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        plan: 'free' as const,
        quota_usage: 0,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseClient
        .from('users')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        console.error('Upsert user profile error:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Upsert user profile error:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession()
      return !!session
    } catch (error) {
      console.error('Check authentication error:', error)
      return false
    }
  }

  /**
   * Get auth session
   */
  static async getSession() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      
      if (error) {
        console.error('Get session error:', error)
        return null
      }
      
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Get session from URL (OAuth callback)
   */
  static async getSessionFromUrl() {
    try {
      // Use setSession to properly handle the OAuth callback tokens
      const { data, error } = await supabaseClient.auth.setSession({
        access_token: new URLSearchParams(window.location.hash.substring(1)).get('access_token') || '',
        refresh_token: new URLSearchParams(window.location.hash.substring(1)).get('refresh_token') || ''
      })
      
      if (error) {
        console.error('Set session from URL error:', error)
        return { data: { session: null }, error }
      }
      
      return { data: { session: data.session }, error: null }
    } catch (error) {
      console.error('Get session from URL error:', error)
      return { data: { session: null }, error: error as AuthError }
    }
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabaseClient.auth.onAuthStateChange(callback)
  }
}