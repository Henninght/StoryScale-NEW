/**
 * Language Detection Service for StoryScale
 * Provides automatic language detection and validation
 */

import { SupportedLanguage, GatewayError, GatewayErrorCode } from '../types/language-aware-request';

// Language detection result
export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  alternativeLanguages?: Array<{
    language: SupportedLanguage;
    confidence: number;
  }>;
  isReliable: boolean;
  method: 'pattern' | 'statistical' | 'dictionary' | 'fallback';
}

// Language patterns for detection
const LANGUAGE_PATTERNS = {
  no: {
    // Norwegian-specific characters and words
    characters: /[æøåÆØÅ]/,
    commonWords: /\b(og|i|er|det|som|på|til|av|for|med|har|om|ikke|var|de|vi|kan|jeg|men|ett?|han|hun|skal|vil|ble|eller|når|være|ha|få|gjøre|si|komme|måtte|kunne|ville|skulle)\b/gi,
    articles: /\b(en|et|ei|den|det|dei)\b/gi,
    pronouns: /\b(jeg|du|han|hun|vi|dere|de|meg|deg|seg|oss|min|din|sin|vår|deres)\b/gi,
    prepositions: /\b(på|i|til|fra|med|om|for|av|over|under|etter|før|mellom|gjennom|hos|mot|ved|blant)\b/gi,
    // Business/professional Norwegian terms
    businessTerms: /\b(bedrift|selskap|virksomhet|kunde|marked|løsning|tjeneste|produkt|strategi|analyse|rapport|møte|avtale|kontrakt|faktura|budsjett|regnskap|årsrapport|styret?|ledelse|ansatt|prosjekt)\b/gi,
  },
  en: {
    // English-specific patterns
    characters: /[a-zA-Z]/, // Basic Latin alphabet
    commonWords: /\b(the|be|to|of|and|a|in|that|have|I|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|work|first|well|way|even|new|want|because|any|these|give|day|most|us)\b/gi,
    articles: /\b(a|an|the)\b/gi,
    pronouns: /\b(I|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|its|our|their)\b/gi,
    prepositions: /\b(in|on|at|to|from|with|by|for|of|about|under|over|between|through|during|before|after|above|below|among)\b/gi,
    businessTerms: /\b(business|company|enterprise|customer|market|solution|service|product|strategy|analysis|report|meeting|contract|invoice|budget|accounting|annual report|board|management|employee|project)\b/gi,
  }
};

// Statistical analysis weights
const DETECTION_WEIGHTS = {
  characters: 0.2,
  commonWords: 0.3,
  articles: 0.15,
  pronouns: 0.15,
  businessTerms: 0.1,
  prepositions: 0.1,
};

export class LanguageDetectionService {
  private static instance: LanguageDetectionService;
  private cache: Map<string, LanguageDetectionResult> = new Map();
  private readonly maxCacheSize = 1000;

  private constructor() {}

  public static getInstance(): LanguageDetectionService {
    if (!LanguageDetectionService.instance) {
      LanguageDetectionService.instance = new LanguageDetectionService();
    }
    return LanguageDetectionService.instance;
  }

  /**
   * Detect language of input text
   */
  public async detectLanguage(
    text: string,
    hint?: SupportedLanguage
  ): Promise<LanguageDetectionResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Validate input
    if (!text || text.trim().length < 10) {
      throw new GatewayError(
        GatewayErrorCode.LANGUAGE_DETECTION_FAILED,
        'Text too short for reliable language detection',
        { textLength: text?.length || 0 }
      );
    }

    try {
      // If hint provided, validate it first
      if (hint) {
        const hintConfidence = this.calculateLanguageConfidence(text, hint);
        if (hintConfidence > 0.7) {
          const result: LanguageDetectionResult = {
            detectedLanguage: hint,
            confidence: hintConfidence,
            isReliable: true,
            method: 'pattern',
          };
          this.cacheResult(cacheKey, result);
          return result;
        }
      }

      // Perform detection
      const scores = await this.analyzeText(text);
      const result = this.determineLanguage(scores);
      
      this.cacheResult(cacheKey, result);
      return result;
    } catch (error) {
      // Fallback to English if detection fails
      if (hint) {
        return {
          detectedLanguage: hint,
          confidence: 0.5,
          isReliable: false,
          method: 'fallback',
        };
      }
      
      return {
        detectedLanguage: 'en',
        confidence: 0.3,
        isReliable: false,
        method: 'fallback',
      };
    }
  }

  /**
   * Analyze text and calculate scores for each language
   */
  private async analyzeText(text: string): Promise<Map<SupportedLanguage, number>> {
    const scores = new Map<SupportedLanguage, number>();
    const normalizedText = text.toLowerCase();

    // Calculate scores for each language
    for (const lang of ['en', 'no'] as SupportedLanguage[]) {
      const patterns = LANGUAGE_PATTERNS[lang];
      let score = 0;

      // Character analysis
      const charMatches = (text.match(patterns.characters) || []).length;
      const charScore = Math.min(charMatches / text.length, 1) * DETECTION_WEIGHTS.characters;
      score += charScore;

      // Common words analysis
      const wordMatches = (normalizedText.match(patterns.commonWords) || []).length;
      const words = normalizedText.split(/\s+/).length;
      const wordScore = Math.min(wordMatches / words, 1) * DETECTION_WEIGHTS.commonWords;
      score += wordScore;

      // Articles analysis
      const articleMatches = (normalizedText.match(patterns.articles) || []).length;
      const articleScore = Math.min(articleMatches / words * 10, 1) * DETECTION_WEIGHTS.articles;
      score += articleScore;

      // Pronouns analysis
      const pronounMatches = (normalizedText.match(patterns.pronouns) || []).length;
      const pronounScore = Math.min(pronounMatches / words * 10, 1) * DETECTION_WEIGHTS.pronouns;
      score += pronounScore;

      // Prepositions analysis
      const prepMatches = (normalizedText.match(patterns.prepositions) || []).length;
      const prepScore = Math.min(prepMatches / words * 10, 1) * DETECTION_WEIGHTS.prepositions;
      score += prepScore;

      // Business terms (optional boost)
      const bizMatches = (normalizedText.match(patterns.businessTerms) || []).length;
      if (bizMatches > 0) {
        const bizScore = Math.min(bizMatches / words * 20, 1) * DETECTION_WEIGHTS.businessTerms;
        score += bizScore;
      }

      scores.set(lang, score);
    }

    return scores;
  }

  /**
   * Determine language based on scores
   */
  private determineLanguage(scores: Map<SupportedLanguage, number>): LanguageDetectionResult {
    const sortedScores = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    const [topLang, topScore] = sortedScores[0];
    const [secondLang, secondScore] = sortedScores[1] || ['en', 0];

    // Calculate relative confidence
    const confidence = topScore > 0 ? Math.min(topScore / 0.6, 1) : 0; // Normalize to max expected score
    const scoreDifference = topScore - secondScore;
    const isReliable = confidence > 0.6 && scoreDifference > 0.1;

    const result: LanguageDetectionResult = {
      detectedLanguage: topLang,
      confidence,
      isReliable,
      method: confidence > 0.7 ? 'statistical' : 'pattern',
    };

    // Add alternative if close
    if (scoreDifference < 0.2 && secondScore > 0.3) {
      result.alternativeLanguages = [{
        language: secondLang,
        confidence: secondScore / 0.6,
      }];
    }

    return result;
  }

  /**
   * Calculate confidence for a specific language
   */
  private calculateLanguageConfidence(text: string, language: SupportedLanguage): number {
    const patterns = LANGUAGE_PATTERNS[language];
    const normalizedText = text.toLowerCase();
    let totalScore = 0;

    // Quick character check for Norwegian
    if (language === 'no' && patterns.characters.test(text)) {
      totalScore += 0.3; // Boost for Norwegian characters
    }

    // Word matching
    const wordMatches = (normalizedText.match(patterns.commonWords) || []).length;
    const words = normalizedText.split(/\s+/).length;
    totalScore += Math.min(wordMatches / words, 1) * 0.7;

    return Math.min(totalScore, 1);
  }

  /**
   * Validate if text is in expected language
   */
  public validateLanguage(text: string, expectedLanguage: SupportedLanguage): boolean {
    const confidence = this.calculateLanguageConfidence(text, expectedLanguage);
    return confidence > 0.5;
  }

  /**
   * Get language-specific metadata
   */
  public getLanguageMetadata(language: SupportedLanguage): {
    name: string;
    nativeName: string;
    code: string;
    direction: 'ltr' | 'rtl';
    complexityMultiplier: number; // For token estimation
  } {
    const metadata = {
      en: {
        name: 'English',
        nativeName: 'English',
        code: 'en',
        direction: 'ltr' as const,
        complexityMultiplier: 1.0,
      },
      no: {
        name: 'Norwegian',
        nativeName: 'Norsk',
        code: 'no',
        direction: 'ltr' as const,
        complexityMultiplier: 1.1, // Norwegian typically uses slightly more tokens
      },
    };

    return metadata[language];
  }

  /**
   * Cache management
   */
  private generateCacheKey(text: string): string {
    // Use first 100 chars and length for cache key
    const preview = text.substring(0, 100);
    return `${preview.length}_${this.hashString(preview)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private cacheResult(key: string, result: LanguageDetectionResult): void {
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, result);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }
}