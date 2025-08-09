/**
 * Language Context Provider for StoryScale
 * Manages language preferences and state across the application
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  SupportedLanguage, 
  LanguagePreferences, 
  LanguageContext as ILanguageContext,
  SUPPORTED_LANGUAGES,
  DEFAULT_CULTURAL_CONTEXTS
} from '../types/language'
import { GuestSessionManager } from '../auth/guest-session'
import { supabaseClient } from '../database/supabase'

interface LanguageContextValue {
  // Current state
  language: SupportedLanguage
  preferences: LanguagePreferences
  context: ILanguageContext
  isLoading: boolean
  
  // Actions
  setLanguage: (language: SupportedLanguage, temporary?: boolean) => Promise<void>
  setPreferences: (preferences: Partial<LanguagePreferences>) => Promise<void>
  clearTemporaryOverride: () => void
  
  // Utilities
  t: (key: string, fallback?: string) => string // Simple translation function
  isAuthenticated: boolean
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
  initialLanguage?: SupportedLanguage
}

const STORAGE_KEY = 'storyscale_language_preferences'

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage || 'en')
  const [preferences, setPreferencesState] = useState<LanguagePreferences>({
    defaultLanguage: 'en',
    autoDetect: true,
    showCulturalContext: true
  })
  const [temporaryOverride, setTemporaryOverride] = useState<SupportedLanguage | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize language preferences on mount
  useEffect(() => {
    initializeLanguagePreferences()
  }, [])

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
      if (session) {
        // User logged in, sync preferences from Supabase
        syncPreferencesFromSupabase(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const initializeLanguagePreferences = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabaseClient.auth.getSession()
      
      if (session) {
        // Load from Supabase user metadata
        await syncPreferencesFromSupabase(session.user.id)
      } else {
        // Load from localStorage (guest user)
        loadGuestPreferences()
      }
      
      // Auto-detect browser language if enabled
      if (preferences.autoDetect && !temporaryOverride) {
        const browserLang = detectBrowserLanguage()
        if (browserLang !== language) {
          await setLanguage(browserLang)
        }
      }
    } catch (error) {
      console.error('Failed to initialize language preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const syncPreferencesFromSupabase = async (userId: string) => {
    try {
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (profile?.preferences?.language) {
        const langPrefs = profile.preferences.language as LanguagePreferences
        setPreferencesState(langPrefs)
        setLanguageState(langPrefs.defaultLanguage)
      }
    } catch (error) {
      console.error('Failed to sync language preferences from Supabase:', error)
    }
  }

  const loadGuestPreferences = () => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const guestPrefs = JSON.parse(stored) as LanguagePreferences
        setPreferencesState(guestPrefs)
        setLanguageState(guestPrefs.defaultLanguage)
      } catch (error) {
        console.error('Invalid guest language preferences:', error)
      }
    }
  }

  const detectBrowserLanguage = (): SupportedLanguage => {
    if (typeof window === 'undefined') return 'en'
    
    const browserLang = navigator.language.slice(0, 2)
    return browserLang === 'no' ? 'no' : 'en'
  }

  const setLanguage = async (newLanguage: SupportedLanguage, temporary = false) => {
    if (temporary) {
      setTemporaryOverride(newLanguage)
      setLanguageState(newLanguage)
      return
    }

    // Update persistent preferences
    const newPreferences = { ...preferences, defaultLanguage: newLanguage }
    await setPreferences(newPreferences)
    setLanguageState(newLanguage)
    
    // Clear any temporary override
    setTemporaryOverride(undefined)
  }

  const setPreferences = async (newPreferences: Partial<LanguagePreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences }
    setPreferencesState(updatedPreferences)

    try {
      if (isAuthenticated) {
        // Save to Supabase
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (session) {
          await supabaseClient
            .from('user_profiles')
            .upsert({
              id: session.user.id,
              preferences: {
                language: updatedPreferences
              }
            })
        }
      } else {
        // Save to localStorage for guest users
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences))
        }
      }
    } catch (error) {
      console.error('Failed to save language preferences:', error)
    }
  }

  const clearTemporaryOverride = () => {
    setTemporaryOverride(undefined)
    setLanguageState(preferences.defaultLanguage)
  }

  // Simple translation function (could be enhanced with proper i18n later)
  const t = (key: string, fallback?: string): string => {
    const translations: Record<SupportedLanguage, Record<string, string>> = {
      en: {
        'language.settings.title': 'Language Settings',
        'language.settings.default': 'Default Language',
        'language.settings.autoDetect': 'Auto-detect from browser',
        'language.settings.culturalContext': 'Show cultural context hints',
        'language.wizard.title': 'Content Language',
        'language.wizard.description': 'Choose the language for your content generation',
        'language.status.generated_in': 'Generated in',
        'language.status.culturally_adapted': 'Culturally adapted',
        'language.norwegian.context.hint': 'Norwegian business context will be applied'
      },
      no: {
        'language.settings.title': 'Språkinnstillinger',
        'language.settings.default': 'Standardspråk',
        'language.settings.autoDetect': 'Automatisk oppdaging fra nettleser',
        'language.settings.culturalContext': 'Vis kulturelle konteksthint',
        'language.wizard.title': 'Innholdsspråk',
        'language.wizard.description': 'Velg språk for innholdsgenerering',
        'language.status.generated_in': 'Generert på',
        'language.status.culturally_adapted': 'Kulturelt tilpasset',
        'language.norwegian.context.hint': 'Norsk forretningskontekst vil bli anvendt'
      }
    }

    return translations[language]?.[key] || fallback || key
  }

  const contextValue: LanguageContextValue = {
    language: temporaryOverride || language,
    preferences,
    context: {
      currentLanguage: temporaryOverride || language,
      temporaryOverride,
      isOverridden: !!temporaryOverride,
      culturalAdaptations: DEFAULT_CULTURAL_CONTEXTS[temporaryOverride || language]
    },
    isLoading,
    setLanguage,
    setPreferences,
    clearTemporaryOverride,
    t,
    isAuthenticated
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Helper hooks for specific use cases
export function useTranslation() {
  const { t, language } = useLanguage()
  return { t, language }
}

export function useCulturalContext() {
  const { context } = useLanguage()
  return context.culturalAdaptations
}