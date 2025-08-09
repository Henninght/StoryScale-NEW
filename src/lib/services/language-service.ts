/**
 * Language Service
 * Handles language detection, cultural adaptations, and localization logic
 * Integrates with the 3-layer architecture
 */

import { 
  SupportedLanguage, 
  ContentLanguageMetadata, 
  CulturalContext,
  NORWEGIAN_BUSINESS_CONTEXT,
  DEFAULT_CULTURAL_CONTEXTS 
} from '../types/language'
import { ContentRequest } from '../gateway/intelligent-gateway'

export class LanguageService {
  /**
   * Detect language from content
   */
  static detectContentLanguage(content: string): SupportedLanguage {
    // Simple heuristic-based detection
    const norwegianIndicators = [
      'og', 'det', 'er', 'ikke', 'på', 'med', 'av', 'til', 'for', 'som',
      'å', 'æ', 'ø', 'norsk', 'norge', 'kroner', 'kr'
    ]
    
    const contentLower = content.toLowerCase()
    const norwegianMatches = norwegianIndicators.filter(indicator => 
      contentLower.includes(indicator)
    ).length
    
    // If more than 20% of indicators match, likely Norwegian
    return norwegianMatches > norwegianIndicators.length * 0.2 ? 'no' : 'en'
  }

  /**
   * Enhance content request with language and cultural context
   */
  static enhanceContentRequest(
    request: ContentRequest, 
    language: SupportedLanguage,
    culturalContext?: CulturalContext
  ): ContentRequest & { 
    language: SupportedLanguage
    culturalContext: CulturalContext
    culturalPrompts?: string[]
  } {
    const context = culturalContext || DEFAULT_CULTURAL_CONTEXTS[language]
    
    const culturalPrompts = language === 'no' ? [
      'Write content appropriate for Norwegian business culture',
      'Use Norwegian business terminology where applicable',
      'Reference Norwegian market conditions and companies when relevant',
      'Apply Norwegian communication style: direct, egalitarian, consensus-oriented',
      'Consider Norwegian work-life balance values',
      'Include seasonal considerations for Nordic climate'
    ] : []

    return {
      ...request,
      language,
      culturalContext: context,
      culturalPrompts
    }
  }

  /**
   * Generate cultural adaptation prompt for AI
   */
  static generateCulturalPrompt(language: SupportedLanguage, businessContext?: boolean): string {
    if (language !== 'no') return ''

    let prompt = `Generate content for Norwegian audience. Consider Norwegian business culture: `
    
    if (businessContext) {
      prompt += `
- Reference Norwegian companies: ${NORWEGIAN_BUSINESS_CONTEXT.commonCompanies.slice(0, 3).join(', ')}
- Use Norwegian business terminology naturally
- Apply flat organizational hierarchy concepts
- Emphasize sustainability and work-life balance
- Use direct, honest communication style
- Consider consensus-driven decision making
`
    }

    prompt += `
Cultural adaptations:
- Use Norwegian examples and case studies when possible
- Consider Nordic seasonal patterns (long winters, bright summers)
- Reference Norwegian market dynamics and regulations
- Apply local time and date formats (24h, DD/MM/YYYY)
- Use Norwegian cultural references appropriately
`

    return prompt
  }

  /**
   * Analyze content for cultural adaptations
   */
  static analyzeCulturalAdaptations(content: string, language: SupportedLanguage): {
    score: number
    adaptations: string[]
    localizedReferences: string[]
  } {
    if (language !== 'no') {
      return { score: 0, adaptations: [], localizedReferences: [] }
    }

    const adaptations: string[] = []
    const localizedReferences: string[] = []
    let score = 0

    // Check for Norwegian company references
    const companyMatches = NORWEGIAN_BUSINESS_CONTEXT.commonCompanies.filter(company =>
      content.toLowerCase().includes(company.toLowerCase())
    )
    if (companyMatches.length > 0) {
      adaptations.push('Norwegian company references')
      localizedReferences.push(...companyMatches)
      score += 0.3
    }

    // Check for Norwegian business terms
    const termMatches = Object.keys(NORWEGIAN_BUSINESS_CONTEXT.businessTerms).filter(term =>
      content.toLowerCase().includes(NORWEGIAN_BUSINESS_CONTEXT.businessTerms[term])
    )
    if (termMatches.length > 0) {
      adaptations.push('Norwegian business terminology')
      localizedReferences.push(...termMatches.map(term => NORWEGIAN_BUSINESS_CONTEXT.businessTerms[term]))
      score += 0.2
    }

    // Check for cultural norm references
    const cultureMatches = NORWEGIAN_BUSINESS_CONTEXT.culturalNorms.filter(norm =>
      content.toLowerCase().includes(norm.toLowerCase().replace(/[^\w\s]/g, ''))
    )
    if (cultureMatches.length > 0) {
      adaptations.push('Norwegian cultural norms')
      score += 0.3
    }

    // Check for time/date format
    if (content.includes('24:') || /\d{2}:\d{2}/.test(content)) {
      adaptations.push('Norwegian time format (24h)')
      score += 0.1
    }

    // Check for Norwegian currency
    if (content.toLowerCase().includes('kroner') || content.includes('kr ') || content.includes('NOK')) {
      adaptations.push('Norwegian currency references')
      localizedReferences.push('Norwegian Kroner')
      score += 0.1
    }

    return {
      score: Math.min(score, 1.0),
      adaptations,
      localizedReferences
    }
  }

  /**
   * Create language metadata for generated content
   */
  static createLanguageMetadata(
    originalLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    content: string
  ): ContentLanguageMetadata {
    const analysis = this.analyzeCulturalAdaptations(content, targetLanguage)
    
    return {
      originalLanguage,
      targetLanguage,
      culturallyAdapted: analysis.score > 0.1,
      adaptationScore: analysis.score,
      localizedReferences: analysis.localizedReferences,
      translations: targetLanguage === 'no' ? this.extractTranslations(content) : undefined
    }
  }

  /**
   * Extract key translation pairs from content
   */
  private static extractTranslations(content: string): Record<string, string> {
    const translations: Record<string, string> = {}
    
    // Look for common business terms that might have been translated
    Object.entries(NORWEGIAN_BUSINESS_CONTEXT.businessTerms).forEach(([en, no]) => {
      if (content.toLowerCase().includes(no.toLowerCase())) {
        translations[en] = no
      }
    })

    return translations
  }

  /**
   * Get language-specific prompt enhancements
   */
  static getPromptEnhancements(language: SupportedLanguage): string[] {
    const enhancements: string[] = []

    if (language === 'no') {
      enhancements.push(
        'Write in Norwegian language with proper grammar and cultural context',
        'Use Norwegian business examples and companies when relevant',
        'Apply Norwegian communication style: direct, egalitarian, and consensus-oriented',
        'Consider Norwegian market dynamics, regulations, and business practices',
        'Use Norwegian date/time formats and cultural references appropriately'
      )
    }

    return enhancements
  }

  /**
   * Validate language support for request
   */
  static validateLanguageSupport(language: SupportedLanguage): boolean {
    return Object.keys(SUPPORTED_LANGUAGES).includes(language)
  }

  /**
   * Get language direction for CSS
   */
  static getLanguageDirection(language: SupportedLanguage): 'ltr' | 'rtl' {
    return SUPPORTED_LANGUAGES[language]?.direction || 'ltr'
  }
}