/**
 * Language Support Types for StoryScale
 * Extends the 3-layer architecture with internationalization
 */

export type SupportedLanguage = 'en' | 'no'

export interface LanguageOption {
  code: SupportedLanguage
  name: string
  nativeName: string
  flag: string
  direction: 'ltr' | 'rtl'
}

export interface LanguagePreferences {
  defaultLanguage: SupportedLanguage
  autoDetect: boolean
  showCulturalContext: boolean
  preferredRegion?: string // For Norwegian: 'nb' (Bokmål) or 'nn' (Nynorsk)
}

export interface LanguageContext {
  currentLanguage: SupportedLanguage
  temporaryOverride?: SupportedLanguage
  isOverridden: boolean
  culturalAdaptations: CulturalContext
}

export interface CulturalContext {
  timeFormat: '12h' | '24h'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  numberFormat: 'US' | 'EU' | 'NO'
  businessContext: 'US' | 'NO' | 'EU'
  seasonalContext?: 'northern' | 'southern'
}

export interface ContentLanguageMetadata {
  originalLanguage: SupportedLanguage
  targetLanguage: SupportedLanguage
  culturallyAdapted: boolean
  adaptationScore: number // 0-1 scale of cultural adaptation
  localizedReferences: string[] // Norwegian-specific terms, companies, etc.
  translations?: Record<string, string> // Key translation pairs
}

// Define base types locally to avoid inline imports
interface ContentRequest {
  content: string
  metadata?: Record<string, any>
}

interface ContentResponse {
  content: string
  metadata?: Record<string, any>
  tokens?: number
  model?: string
}

export interface LocalizedContentRequest extends Omit<ContentRequest, 'content'> {
  content: string
  language: SupportedLanguage
  culturalContext?: CulturalContext
  requireCulturalAdaptation?: boolean
  localReferences?: string[] // Norwegian companies, terms, etc.
}

export interface LocalizedContentResponse extends ContentResponse {
  languageMetadata: ContentLanguageMetadata
  culturalAdaptations?: string[]
}

// Constants for language support
export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageOption> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  no: {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    flag: '🇳🇴',
    direction: 'ltr'
  }
}

export const DEFAULT_CULTURAL_CONTEXTS: Record<SupportedLanguage, CulturalContext> = {
  en: {
    timeFormat: '12h',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'US',
    businessContext: 'US',
    seasonalContext: 'northern'
  },
  no: {
    timeFormat: '24h',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'NO',
    businessContext: 'NO',
    seasonalContext: 'northern'
  }
}

// Norwegian business context hints
export const NORWEGIAN_BUSINESS_CONTEXT = {
  commonCompanies: ['Equinor', 'Telenor', 'DNB', 'Norsk Hydro', 'Orkla', 'Yara'],
  businessTerms: {
    'quarter': 'kvartal',
    'revenue': 'omsetning',
    'profit': 'fortjeneste',
    'market': 'marked',
    'customer': 'kunde',
    'employee': 'ansatt'
  },
  culturalNorms: [
    'Direct communication style',
    'Flat organizational structure',
    'Work-life balance emphasis',
    'Sustainability focus',
    'Consensus-driven decisions'
  ]
}