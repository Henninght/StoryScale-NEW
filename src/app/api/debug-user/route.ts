/**
 * Debug User API - Check current user and their documents
 */

import { supabaseClient } from '@/lib/database/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: userError.message 
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ 
        message: 'No authenticated user',
        user: null 
      })
    }

    // Get documents for this user - with timeout and error handling
    let documents = null
    let docsError = null
    
    try {
      const queryPromise = supabaseClient
        .from('documents')
        .select('id, title, type, status, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 3000)
      )
      
      const result = await Promise.race([queryPromise, timeoutPromise])
      documents = result.data
      docsError = result.error
    } catch (error) {
      docsError = error
    }

    // Also check if user exists in users table
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      userProfile: userProfile || null,
      profileError: profileError?.message || null,
      documents: documents || [],
      documentsError: docsError?.message || null,
      documentCount: documents?.length || 0
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}