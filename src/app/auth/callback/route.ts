import { createSupabaseServerClient } from '@/lib/database/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createSupabaseServerClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/error', request.url))
    }

    if (data.user) {
      // Check if user needs to be created in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingUser) {
        // Create user record
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            provider: 'google'
          })
      }
    }
  }

  // Redirect to workspace after successful authentication
  return NextResponse.redirect(new URL('/workspace', request.url))
}