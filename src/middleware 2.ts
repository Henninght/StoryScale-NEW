import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check for guest session in localStorage (handled client-side)
  const guestSessionId = request.headers.get('x-guest-session')

  // Allow both authenticated and guest users
  if (!session && !guestSessionId) {
    // For API routes, return 401 if no auth
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Allow public API routes
      const publicRoutes = [
        '/api/health', 
        '/api/config', 
        '/api/auth/test', 
        '/api/auth/callback', 
        '/api/test/guest-session',
        '/api/test',  // Add test endpoint
        '/api/test-research', // Add research test endpoint
        '/api/test-anthropic', // Add anthropic test endpoint
        '/api/generate', // Add generate endpoint for testing
        '/api/architecture' // Add architecture info endpoint
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
    
    // For workspace routes, redirect to home for unauthenticated users
    // TEMPORARILY DISABLED FOR TESTING
    // if (request.nextUrl.pathname.startsWith('/workspace')) {
    //   return NextResponse.redirect(new URL('/', request.url))
    // }
  }

  return res
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