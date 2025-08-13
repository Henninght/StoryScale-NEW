'use client'

import { supabaseClient } from '@/lib/database/supabase'
import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'

export function GoogleAuthTest() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get initial user
    supabaseClient.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      console.log('Auth event:', event, session?.user?.email)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Google Auth Error:', error)
        alert('Error: ' + error.message)
      } else {
        console.log('Google Auth Success:', data)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    }
  }

  if (user) {
    return (
      <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-800 font-medium">✅ Signed in as:</p>
            <p className="text-green-700">{user.email}</p>
            <p className="text-xs text-green-600 mt-1">Provider: {user.app_metadata?.provider || 'Unknown'}</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">🔐 Google Auth Test</h3>
      <p className="text-blue-700 text-sm mb-3">Test the Google OAuth integration</p>
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className={`px-4 py-2 text-white rounded transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  )
}