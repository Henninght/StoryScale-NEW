/**
 * Debug Session API - Check Supabase session
 */

import { supabaseClient } from '@/lib/database/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    
    return NextResponse.json({
      hasSession: !!session,
      sessionError: sessionError?.message || null,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email
      } : null,
      accessToken: session?.access_token ? 'present' : 'missing',
      refreshToken: session?.refresh_token ? 'present' : 'missing'
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Session check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}