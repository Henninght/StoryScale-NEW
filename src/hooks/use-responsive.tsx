/**
 * Responsive Hook - Provides responsive breakpoint detection and window size tracking
 * Follows mobile-first design principles with StoryScale breakpoints
 */

'use client'

import { useEffect, useState } from 'react'

// StoryScale responsive breakpoints (matches Tailwind CSS)
export const BREAKPOINTS = {
  mobile: 768,    // < 768px
  tablet: 1024,   // 768px - 1023px  
  desktop: 1280,  // 1024px - 1279px
  wide: 1536      // >= 1280px
} as const

export interface WindowSize {
  width: number
  height: number
}

export interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean  
  isDesktop: boolean
  isWide: boolean
  windowSize: WindowSize
  breakpoint: keyof typeof BREAKPOINTS
}

export function useResponsive(): ResponsiveState {
  const [windowSize, setWindowSize] = useState<WindowSize>({ 
    width: 0, 
    height: 0 
  })
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    // Set initial window size
    handleResize()
    setIsHydrated(true)

    // Add event listener with passive option for better performance
    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate responsive states - assume desktop until hydrated to prevent layout shifts
  const isMobile = isHydrated && windowSize.width > 0 && windowSize.width < BREAKPOINTS.mobile
  const isTablet = isHydrated && windowSize.width >= BREAKPOINTS.mobile && windowSize.width < BREAKPOINTS.desktop
  const isDesktop = !isHydrated || (isHydrated && windowSize.width >= BREAKPOINTS.desktop && windowSize.width < BREAKPOINTS.wide)
  const isWide = isHydrated && windowSize.width >= BREAKPOINTS.wide

  // Determine current breakpoint
  const breakpoint: keyof typeof BREAKPOINTS = 
    isMobile ? 'mobile' :
    isTablet ? 'tablet' :
    isWide ? 'wide' : 'desktop'

  return {
    isMobile,
    isTablet, 
    isDesktop,
    isWide,
    windowSize,
    breakpoint
  }
}

// Hook for media query-like functionality
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

// Hook for specific StoryScale breakpoint detection
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const { windowSize } = useResponsive()
  
  switch (breakpoint) {
    case 'mobile':
      return windowSize.width < BREAKPOINTS.mobile
    case 'tablet':
      return windowSize.width >= BREAKPOINTS.mobile && windowSize.width < BREAKPOINTS.desktop
    case 'desktop':
      return windowSize.width >= BREAKPOINTS.desktop && windowSize.width < BREAKPOINTS.wide
    case 'wide':
      return windowSize.width >= BREAKPOINTS.wide
    default:
      return false
  }
}

// Hook for sidebar visibility logic
export function useSidebarVisibility(): {
  shouldShowSidebar: boolean
  shouldUseOverlay: boolean
  sidebarWidth: number
} {
  const { isMobile, isTablet, isDesktop, isWide } = useResponsive()
  
  return {
    // Show sidebar by default on desktop and wider
    shouldShowSidebar: isDesktop || isWide,
    // Use overlay on mobile and tablet
    shouldUseOverlay: isMobile || isTablet,
    // Sidebar width (240px as per design specs)
    sidebarWidth: 240
  }
}

// Hook for responsive content area margins
export function useContentAreaLayout(): {
  marginLeft: string
  paddingX: string
  maxWidth: string
} {
  const { isMobile, isTablet } = useResponsive()
  const { shouldShowSidebar } = useSidebarVisibility()
  
  return {
    // Left margin for fixed sidebar on desktop
    marginLeft: shouldShowSidebar ? 'ml-60' : 'ml-0', // 240px = w-60
    // Responsive horizontal padding
    paddingX: isMobile ? 'px-4' : isTablet ? 'px-6' : 'px-8',
    // Max width for content readability
    maxWidth: 'max-w-7xl'
  }
}