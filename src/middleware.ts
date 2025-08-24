import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  // Skip authentication checks if Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Allow all requests when Supabase is not configured
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check for guest session in localStorage (handled client-side)
    const guestSessionId = request.headers.get('x-guest-session')

    // Allow both authenticated and guest users - workspace is accessible without auth
    if (!session && !guestSessionId) {
      // For API routes, return 401 if no auth for protected endpoints
      if (request.nextUrl.pathname.startsWith('/api/')) {
        // Allow public API routes
        const publicRoutes = [
          '/api/health', 
          '/api/config', 
          '/api/auth/test', 
          '/api/auth/callback', 
          '/api/test/guest-session',
          '/api/test',  
          '/api/test-research', 
          '/api/test-anthropic', 
          '/api/test-db-connection', 
          '/api/test-auth-timeout',
          '/api/generate', // Allow generate endpoint for guest users
          '/api/architecture',
          '/api/debug-session',  // Debug endpoints for troubleshooting
          '/api/debug-user'
        ]
        
        // Check if the route is public or starts with a public prefix
        const isPublicRoute = publicRoutes.some(route => 
          request.nextUrl.pathname === route || 
          request.nextUrl.pathname.startsWith(`${route}/`)
        )
        
        if (!isPublicRoute) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
      
      // Allow guest access to workspace - users can work without authentication
      // Authentication is only required for cloud features like saving to database
    }

    return res
  } catch (error) {
    // If Supabase middleware fails, continue without authentication
    console.error('Middleware auth error:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}