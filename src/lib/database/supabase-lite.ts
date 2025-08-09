import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with realtime disabled to avoid WebSocket warnings
 * Use this if you don't need realtime functionality
 */
export function createSupabaseLiteClient(
  supabaseUrl: string,
  supabaseKey: string,
  options = {}
) {
  return createClient(supabaseUrl, supabaseKey, {
    ...options,
    realtime: {
      // Disable realtime to avoid WebSocket dependency issues
      params: {
        eventsPerSecond: -1,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-lite',
      },
    },
  })
}

// For server-side usage
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createSupabaseLiteClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// For client-side usage
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createSupabaseLiteClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}