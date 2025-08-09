/**
 * Content Analyzer for Research Quality Assessment
 * Analyzes research content for relevance, quality, and Norwegian business context
 */

import { SupportedLanguage } from '../types/language-aware-request';
import { NorwegianSource } from './norwegian-sources';

export interface ContentAnalysis {
  relevanceScore: number; // 0-1
  qualityScore: number; // 0-1
  culturalScore: number; // 0-1 for Norwegian content
  factualDensity: number; // Facts per 100 words
  sentimentScore: number; // -1 to 1
  readabilityScore: number; // 0-100
  keyInsights: Insight[];
  extractedFacts: ExtractedFact[];
  norwegianTerms: NorwegianTerm[];
  citableQuotes: CitableQuote[];
  businessMetrics: BusinessMetric[];
  warnings: AnalysisWarning[];
}

export interface Insight {
  text: string;
  confidence: number;
  category: InsightCategory;
  relevanceToTopic: number;
  source?: string;
}

export type InsightCategory = 
  | 'market_trend'
  | 'business_opportunity'
  | 'competitive_insight'
  | 'regulatory_update'
  | 'industry_development'
  | 'cultural_context'
  | 'statistical_finding'
  | 'expert_opinion';

export interface ExtractedFact {
  fact: string;
  confidence: number;
  source: string;
  verifiable: boolean;
  category: FactCategory;
  norwegianContext?: boolean;
}

export type FactCategory = 
  | 'statistic'
  | 'date'
  | 'company'
  | 'person'
  | 'location'
  | 'monetary'
  | 'percentage'
  | 'regulation'
  | 'product';

export interface NorwegianTerm {
  term: string;
  translation: string;
  context: string;
  businessRelevance: boolean;
  frequency: number;
}

export interface CitableQuote {
  quote: string;
  author?: string;
  source: string;
  date?: string;
  relevance: number;
  norwegianSource: boolean;
}

export interface BusinessMetric {
  metric: string;
  value: string | number;
  unit?: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  norwegianMarket: boolean;
  comparison?: string;
}

export interface AnalysisWarning {
  type: 'bias' | 'outdated' | 'unverified' | 'paywall' | 'translation';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalyzerConfig {
  minRelevanceScore: number;
  minQualityScore: number;
  extractNorwegianTerms: boolean;
  detectBusinessMetrics: boolean;
  performSentimentAnalysis: boolean;
  maxInsights: number;
  maxFacts: number;
  maxQuotes: number;
}

/**
 * Norwegian business term dictionary
 */
const NORWEGIAN_BUSINESS_TERMS = new Map<string, string>([
  ['aksjeselskap', 'limited company'],
  ['AS', 'Ltd.'],
  ['virksomhet', 'business'],
  ['næringsliv', 'business sector'],
  ['bedrift', 'company'],
  ['konsern', 'corporation'],
  ['styre', 'board'],
  ['daglig leder', 'CEO'],
  ['regnskap', 'accounting'],
  ['omsetning', 'revenue'],
  ['overskudd', 'profit'],
  ['underskudd', 'loss'],
  ['egenkapital', 'equity'],
  ['gjeld', 'debt'],
  ['investering', 'investment'],
  ['marked', 'market'],
  ['konkurranse', 'competition'],
  ['strategi', 'strategy'],
  ['vekst', 'growth'],
  ['innovasjon', 'innovation'],
  ['bærekraft', 'sustainability'],
  ['digitalisering', 'digitalization'],
  ['eksport', 'export'],
  ['import', 'import'],
  ['moms', 'VAT'],
  ['skatt', 'tax'],
  ['tilsyn', 'supervision/authority'],
  ['forskrift', 'regulation'],
  ['lov', 'law'],
  ['konsesjon', 'license/concession'],
  ['børs', 'stock exchange'],
  ['obligasjon', 'bond'],
  ['utbytte', 'dividend'],
  ['fusjon', 'merger'],
  ['oppkjøp', 'acquisition'],
  ['konkurs', 'bankruptcy'],
  ['restrukturering', 'restructuring']
]);

/**
 * Norwegian company patterns
 */
const NORWEGIAN_COMPANY_PATTERNS = [
  /\b[A-ZÆØÅ][a-zæøå]+\s+(AS|ASA)\b/g,
  /\b(Norsk|Norske|Norge|Norwegian)\s+[A-ZÆØÅ]\w+/g,
  /\b(Stat[a-z]+|Kommune[a-z]+)\b/g,
  /\b(DNB|Telenor|Equinor|Yara|Orkla|Schibsted|Aker|Statkraft)\b/g
];

export class ContentAnalyzer {
  private config: AnalyzerConfig;
  private norwegianTerms: Map<string, string>;

  constructor(config?: Partial<AnalyzerConfig>) {
    this.config = {
      minRelevanceScore: 0.5,
      minQualityScore: 0.6,
      extractNorwegianTerms: true,
      detectBusinessMetrics: true,
      performSentimentAnalysis: true,
      maxInsights: 5,
      maxFacts: 10,
      maxQuotes: 3,
      ...config
    };

    this.norwegianTerms = NORWEGIAN_BUSINESS_TERMS;
  }

  /**
   * Analyze content for quality and relevance
   */
  public async analyzeContent(
    content: string,
    source: NorwegianSource | { domain: string; trustScore: number },
    topic: string,
    language: SupportedLanguage
  ): Promise<ContentAnalysis> {
    // Clean and prepare content
    const cleanedContent = this.cleanContent(content);
    
    // Calculate scores
    const relevanceScore = this.calculateRelevance(cleanedContent, topic);
    const qualityScore = this.calculateQuality(cleanedContent, source.trustScore);
    const culturalScore = language === 'no' 
      ? this.calculateCulturalRelevance(cleanedContent)
      : 0;
    
    // Extract insights
    const keyInsights = await this.extractInsights(cleanedContent, topic);
    
    // Extract facts
    const extractedFacts = this.extractFacts(cleanedContent, source.domain);
    
    // Extract Norwegian terms if applicable
    const norwegianTerms = language === 'no' && this.config.extractNorwegianTerms
      ? this.extractNorwegianTerms(cleanedContent)
      : [];
    
    // Extract quotes
    const citableQuotes = this.extractQuotes(cleanedContent, source.domain, language === 'no');
    
    // Extract business metrics
    const businessMetrics = this.config.detectBusinessMetrics
      ? this.extractBusinessMetrics(cleanedContent, language === 'no')
      : [];
    
    // Calculate additional metrics
    const factualDensity = this.calculateFactualDensity(cleanedContent, extractedFacts);
    const sentimentScore = this.config.performSentimentAnalysis
      ? this.analyzeSentiment(cleanedContent)
      : 0;
    const readabilityScore = this.calculateReadability(cleanedContent);
    
    // Detect warnings
    const warnings = this.detectWarnings(content, source, relevanceScore, qualityScore);
    
    return {
      relevanceScore,
      qualityScore,
      culturalScore,
      factualDensity,
      sentimentScore,
      readabilityScore,
      keyInsights,
      extractedFacts,
      norwegianTerms,
      citableQuotes,
      businessMetrics,
      warnings
    };
  }

  /**
   * Clean content for analysis
   */
  private cleanContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\dæøåÆØÅ.,!?;:\-'"]/gi, '') // Keep only relevant characters
      .trim();
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(content: string, topic: string): number {
    const contentLower = content.toLowerCase();
    const topicLower = topic.toLowerCase();
    const topicWords = topicLower.split(/\s+/);
    
    let score = 0;
    let totalWeight = 0;
    
    // Check topic word presence
    topicWords.forEach(word => {
      if (word.length > 3) { // Skip short words
        const occurrences = (contentLower.match(new RegExp(word, 'gi')) || []).length;
        const weight = word.length / 10; // Longer words are more important
        score += Math.min(occurrences * 0.1, 0.3) * weight;
        totalWeight += weight;
      }
    });
    
    // Check for related terms
    const relatedTerms = this.getRelatedTerms(topic);
    relatedTerms.forEach(term => {
      if (contentLower.includes(term.toLowerCase())) {
        score += 0.1;
      }
    });
    
    // Normalize score
    const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
    return Math.min(normalizedScore, 1);
  }

  /**
   * Calculate quality score
   */
  private calculateQuality(content: string, sourceTrustScore: number): number {
    let score = sourceTrustScore / 10; // Start with source trust
    
    // Check content length
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 300) score += 0.1;
    if (wordCount > 500) score += 0.1;
    
    // Check for structure (paragraphs)
    const paragraphs = content.split(/\n\n+/).length;
    if (paragraphs > 3) score += 0.05;
    
    // Check for data/numbers
    const hasNumbers = /\d+/.test(content);
    if (hasNumbers) score += 0.05;
    
    // Check for quotes
    const hasQuotes = /["'].*["']/.test(content);
    if (hasQuotes) score += 0.05;
    
    // Check for dates
    const hasDates = /\d{4}|\d{1,2}[\/\-]\d{1,2}/.test(content);
    if (hasDates) score += 0.05;
    
    return Math.min(score, 1);
  }

  /**
   * Calculate cultural relevance for Norwegian content
   */
  private calculateCulturalRelevance(content: string): number {
    let score = 0;
    
    // Check for Norwegian companies
    NORWEGIAN_COMPANY_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern) || [];
      score += matches.length * 0.05;
    });
    
    // Check for Norwegian business terms
    let termCount = 0;
    this.norwegianTerms.forEach((translation, term) => {
      if (content.toLowerCase().includes(term)) {
        termCount++;
      }
    });
    score += Math.min(termCount * 0.02, 0.3);
    
    // Check for Norwegian place names
    const norwegianPlaces = ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Norge', 'Norway'];
    norwegianPlaces.forEach(place => {
      if (content.includes(place)) {
        score += 0.05;
      }
    });
    
    // Check for NOK currency
    if (content.match(/NOK|kr\.|kroner/)) {
      score += 0.1;
    }
    
    return Math.min(score, 1);
  }

  /**
   * Extract key insights
   */
  private async extractInsights(content: string, topic: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    
    for (const sentence of sentences) {
      const insight = this.evaluateSentenceAsInsight(sentence, topic);
      if (insight && insights.length < this.config.maxInsights) {
        insights.push(insight);
      }
    }
    
    // Sort by relevance and confidence
    return insights.sort((a, b) => 
      (b.relevanceToTopic * b.confidence) - (a.relevanceToTopic * a.confidence)
    );
  }

  /**
   * Evaluate sentence as potential insight
   */
  private evaluateSentenceAsInsight(sentence: string, topic: string): Insight | null {
    const sentenceLower = sentence.toLowerCase();
    
    // Check for insight indicators
    const insightIndicators = [
      'shows that', 'indicates', 'suggests', 'reveals', 'demonstrates',
      'according to', 'research', 'study', 'survey', 'analysis',
      'trend', 'growth', 'decline', 'increase', 'decrease',
      'viser at', 'indikerer', 'tyder på', 'ifølge', 'undersøkelse'
    ];
    
    const hasIndicator = insightIndicators.some(indicator => 
      sentenceLower.includes(indicator)
    );
    
    if (!hasIndicator) return null;
    
    // Calculate relevance to topic
    const topicWords = topic.toLowerCase().split(/\s+/);
    const relevanceScore = topicWords.reduce((score, word) => {
      return sentenceLower.includes(word) ? score + 0.2 : score;
    }, 0);
    
    if (relevanceScore < 0.2) return null;
    
    // Determine category
    const category = this.categorizeInsight(sentence);
    
    return {
      text: sentence.trim(),
      confidence: 0.7 + (hasIndicator ? 0.1 : 0) + Math.min(relevanceScore * 0.2, 0.2),
      category,
      relevanceToTopic: Math.min(relevanceScore, 1)
    };
  }

  /**
   * Categorize insight
   */
  private categorizeInsight(sentence: string): InsightCategory {
    const lower = sentence.toLowerCase();
    
    if (lower.includes('market') || lower.includes('marked')) return 'market_trend';
    if (lower.includes('opportunity') || lower.includes('mulighet')) return 'business_opportunity';
    if (lower.includes('competitor') || lower.includes('konkurrent')) return 'competitive_insight';
    if (lower.includes('regulation') || lower.includes('forskrift')) return 'regulatory_update';
    if (lower.includes('industry') || lower.includes('bransje')) return 'industry_development';
    if (lower.includes('culture') || lower.includes('kultur')) return 'cultural_context';
    if (/\d+%|\d+\s*prosent/.test(lower)) return 'statistical_finding';
    if (lower.includes('expert') || lower.includes('ekspert')) return 'expert_opinion';
    
    return 'industry_development';
  }

  /**
   * Extract facts from content
   */
  private extractFacts(content: string, source: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    
    for (const sentence of sentences) {
      // Extract statistics
      const stats = sentence.match(/\d+\.?\d*\s*(%|prosent|percent|million|billion|millioner|milliarder)/gi);
      if (stats) {
        stats.forEach(stat => {
          facts.push({
            fact: `${sentence.trim()}`,
            confidence: 0.8,
            source,
            verifiable: true,
            category: 'statistic',
            norwegianContext: /millioner|milliarder|prosent|NOK|kr/.test(stat)
          });
        });
      }
      
      // Extract dates
      const dates = sentence.match(/\b(19|20)\d{2}\b|\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g);
      if (dates && facts.length < this.config.maxFacts) {
        facts.push({
          fact: sentence.trim(),
          confidence: 0.9,
          source,
          verifiable: true,
          category: 'date'
        });
      }
      
      // Extract company mentions
      const companies = sentence.match(/\b[A-ZÆØÅ][a-zæøå]+\s+(AS|ASA|Ltd|Inc|Group|Gruppen)\b/g);
      if (companies && facts.length < this.config.maxFacts) {
        companies.forEach(company => {
          facts.push({
            fact: sentence.trim(),
            confidence: 0.7,
            source,
            verifiable: true,
            category: 'company',
            norwegianContext: /AS|ASA|Gruppen/.test(company)
          });
        });
      }
      
      // Extract monetary values
      const monetary = sentence.match(/[\$€£¥kr]\s*[\d,]+\.?\d*|[\d,]+\.?\d*\s*(USD|EUR|GBP|NOK|kroner|dollar|euro)/gi);
      if (monetary && facts.length < this.config.maxFacts) {
        facts.push({
          fact: sentence.trim(),
          confidence: 0.85,
          source,
          verifiable: true,
          category: 'monetary',
          norwegianContext: /NOK|kr|kroner/.test(sentence)
        });
      }
    }
    
    return facts.slice(0, this.config.maxFacts);
  }

  /**
   * Extract Norwegian business terms
   */
  private extractNorwegianTerms(content: string): NorwegianTerm[] {
    const terms: NorwegianTerm[] = [];
    const contentLower = content.toLowerCase();
    
    this.norwegianTerms.forEach((translation, term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = content.match(regex) || [];
      
      if (matches.length > 0) {
        // Get context around first occurrence
        const index = contentLower.indexOf(term.toLowerCase());
        const contextStart = Math.max(0, index - 30);
        const contextEnd = Math.min(content.length, index + term.length + 30);
        const context = content.substring(contextStart, contextEnd);
        
        terms.push({
          term: matches[0], // Preserve original case
          translation,
          context,
          businessRelevance: true,
          frequency: matches.length
        });
      }
    });
    
    return terms.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Extract quotable content
   */
  private extractQuotes(content: string, source: string, isNorwegian: boolean): CitableQuote[] {
    const quotes: CitableQuote[] = [];
    
    // Find quoted text
    const quotedTexts = content.match(/["']([^"']{20,200})["']/g) || [];
    
    quotedTexts.forEach(quoted => {
      const cleanQuote = quoted.replace(/["']/g, '').trim();
      
      // Look for attribution
      const attributionMatch = content.match(
        new RegExp(`(\\w+\\s+\\w+|\\w+)\\s*(sa|sier|uttalte|said|says|stated).*${quoted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
      );
      
      const author = attributionMatch ? attributionMatch[1] : undefined;
      
      quotes.push({
        quote: cleanQuote,
        author,
        source,
        relevance: this.calculateQuoteRelevance(cleanQuote),
        norwegianSource: isNorwegian
      });
    });
    
    // Also look for notable statements without quotes
    const notableStatements = content.match(/(?:According to|Ifølge|Based on|Basert på).*?[.!?]/gi) || [];
    
    notableStatements.forEach(statement => {
      if (quotes.length < this.config.maxQuotes) {
        quotes.push({
          quote: statement.trim(),
          source,
          relevance: 0.7,
          norwegianSource: isNorwegian
        });
      }
    });
    
    return quotes
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, this.config.maxQuotes);
  }

  /**
   * Calculate quote relevance
   */
  private calculateQuoteRelevance(quote: string): number {
    let relevance = 0.5; // Base relevance
    
    // Boost for business terms
    const businessTerms = ['market', 'growth', 'revenue', 'profit', 'strategy', 'innovation'];
    businessTerms.forEach(term => {
      if (quote.toLowerCase().includes(term)) relevance += 0.1;
    });
    
    // Boost for numbers/data
    if (/\d+/.test(quote)) relevance += 0.1;
    
    // Boost for appropriate length
    const wordCount = quote.split(/\s+/).length;
    if (wordCount >= 10 && wordCount <= 30) relevance += 0.1;
    
    return Math.min(relevance, 1);
  }

  /**
   * Extract business metrics
   */
  private extractBusinessMetrics(content: string, isNorwegian: boolean): BusinessMetric[] {
    const metrics: BusinessMetric[] = [];
    
    // Revenue patterns
    const revenuePatterns = [
      /revenue\s+of\s+([\d,]+\.?\d*)\s*(million|billion|M|B)?\s*(USD|EUR|NOK)?/gi,
      /omsetning\s+på\s+([\d,]+\.?\d*)\s*(millioner|milliarder)?\s*(kroner|NOK)?/gi
    ];
    
    revenuePatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        metrics.push({
          metric: isNorwegian ? 'Omsetning' : 'Revenue',
          value: match[1],
          unit: match[2] || match[3],
          norwegianMarket: isNorwegian || (match[3] === 'NOK')
        });
      }
    });
    
    // Growth patterns
    const growthPatterns = [
      /growth\s+of\s+([\d,]+\.?\d*)\s*%/gi,
      /increased?\s+by\s+([\d,]+\.?\d*)\s*%/gi,
      /vekst\s+på\s+([\d,]+\.?\d*)\s*%/gi,
      /økt\s+med\s+([\d,]+\.?\d*)\s*%/gi
    ];
    
    growthPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        metrics.push({
          metric: isNorwegian ? 'Vekst' : 'Growth',
          value: parseFloat(match[1]),
          unit: '%',
          trend: 'increasing',
          norwegianMarket: isNorwegian
        });
      }
    });
    
    // Market share patterns
    const marketSharePatterns = [
      /market\s+share\s+of\s+([\d,]+\.?\d*)\s*%/gi,
      /markedsandel\s+på\s+([\d,]+\.?\d*)\s*%/gi
    ];
    
    marketSharePatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        metrics.push({
          metric: isNorwegian ? 'Markedsandel' : 'Market Share',
          value: parseFloat(match[1]),
          unit: '%',
          norwegianMarket: isNorwegian
        });
      }
    });
    
    return metrics;
  }

  /**
   * Calculate factual density
   */
  private calculateFactualDensity(content: string, facts: ExtractedFact[]): number {
    const wordCount = content.split(/\s+/).length;
    return (facts.length / wordCount) * 100; // Facts per 100 words
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(content: string): number {
    const positive = [
      'growth', 'increase', 'improve', 'success', 'positive', 'strong',
      'vekst', 'økning', 'forbedring', 'suksess', 'positiv', 'sterk'
    ];
    
    const negative = [
      'decline', 'decrease', 'loss', 'challenge', 'negative', 'weak',
      'nedgang', 'reduksjon', 'tap', 'utfordring', 'negativ', 'svak'
    ];
    
    const contentLower = content.toLowerCase();
    let score = 0;
    
    positive.forEach(word => {
      const count = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += count * 0.1;
    });
    
    negative.forEach(word => {
      const count = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score -= count * 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Calculate readability score
   */
  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    // Flesch Reading Ease formula (adapted)
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (simplified)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    const vowels = 'aeiouyæøå';
    let count = 0;
    let previousWasVowel = false;
    
    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    return Math.max(1, count);
  }

  /**
   * Detect analysis warnings
   */
  private detectWarnings(
    content: string,
    source: { domain: string; trustScore: number },
    relevanceScore: number,
    qualityScore: number
  ): AnalysisWarning[] {
    const warnings: AnalysisWarning[] = [];
    
    // Check for low relevance
    if (relevanceScore < this.config.minRelevanceScore) {
      warnings.push({
        type: 'bias',
        message: 'Content may not be highly relevant to the topic',
        severity: 'medium'
      });
    }
    
    // Check for low quality
    if (qualityScore < this.config.minQualityScore) {
      warnings.push({
        type: 'unverified',
        message: 'Content quality score is below threshold',
        severity: 'medium'
      });
    }
    
    // Check for outdated content
    const currentYear = new Date().getFullYear();
    const oldYearPattern = new RegExp(`\\b(20[0-1]\\d|19\\d{2})\\b`, 'g');
    const yearMatches = content.match(oldYearPattern) || [];
    const hasOldDates = yearMatches.some(year => parseInt(year) < currentYear - 2);
    
    if (hasOldDates) {
      warnings.push({
        type: 'outdated',
        message: 'Content contains references to dates more than 2 years old',
        severity: 'low'
      });
    }
    
    // Check for paywall indicators
    if (content.includes('subscribe') || content.includes('abonner') || content.length < 200) {
      warnings.push({
        type: 'paywall',
        message: 'Content may be behind a paywall or truncated',
        severity: 'high'
      });
    }
    
    // Check for translation issues
    if (content.includes('[translation]') || content.includes('[oversettelse]')) {
      warnings.push({
        type: 'translation',
        message: 'Content appears to be machine translated',
        severity: 'low'
      });
    }
    
    return warnings;
  }

  /**
   * Get related terms for a topic
   */
  private getRelatedTerms(topic: string): string[] {
    const topicLower = topic.toLowerCase();
    const relatedMap = new Map<string, string[]>([
      ['technology', ['digital', 'software', 'IT', 'innovation', 'tech']],
      ['business', ['company', 'market', 'economy', 'trade', 'commerce']],
      ['finance', ['banking', 'investment', 'money', 'capital', 'fund']],
      ['energy', ['oil', 'gas', 'renewable', 'power', 'electricity']],
      ['startup', ['entrepreneur', 'venture', 'innovation', 'founder']]
    ]);
    
    for (const [key, terms] of relatedMap) {
      if (topicLower.includes(key)) {
        return terms;
      }
    }
    
    return [];
  }

  /**
   * Merge multiple content analyses
   */
  public mergeAnalyses(analyses: ContentAnalysis[]): ContentAnalysis {
    if (analyses.length === 0) {
      throw new Error('No analyses to merge');
    }
    
    if (analyses.length === 1) {
      return analyses[0];
    }
    
    // Average scores
    const avgRelevance = analyses.reduce((sum, a) => sum + a.relevanceScore, 0) / analyses.length;
    const avgQuality = analyses.reduce((sum, a) => sum + a.qualityScore, 0) / analyses.length;
    const avgCultural = analyses.reduce((sum, a) => sum + a.culturalScore, 0) / analyses.length;
    const avgFactualDensity = analyses.reduce((sum, a) => sum + a.factualDensity, 0) / analyses.length;
    const avgSentiment = analyses.reduce((sum, a) => sum + a.sentimentScore, 0) / analyses.length;
    const avgReadability = analyses.reduce((sum, a) => sum + a.readabilityScore, 0) / analyses.length;
    
    // Combine and deduplicate insights
    const allInsights = analyses.flatMap(a => a.keyInsights);
    const uniqueInsights = this.deduplicateInsights(allInsights)
      .sort((a, b) => (b.confidence * b.relevanceToTopic) - (a.confidence * a.relevanceToTopic))
      .slice(0, this.config.maxInsights);
    
    // Combine facts
    const allFacts = analyses.flatMap(a => a.extractedFacts);
    const uniqueFacts = this.deduplicateFacts(allFacts)
      .slice(0, this.config.maxFacts);
    
    // Combine Norwegian terms
    const termMap = new Map<string, NorwegianTerm>();
    analyses.forEach(a => {
      a.norwegianTerms.forEach(term => {
        if (!termMap.has(term.term) || termMap.get(term.term)!.frequency < term.frequency) {
          termMap.set(term.term, term);
        }
      });
    });
    const norwegianTerms = Array.from(termMap.values());
    
    // Combine quotes
    const allQuotes = analyses.flatMap(a => a.citableQuotes);
    const uniqueQuotes = this.deduplicateQuotes(allQuotes)
      .slice(0, this.config.maxQuotes);
    
    // Combine business metrics
    const allMetrics = analyses.flatMap(a => a.businessMetrics);
    const uniqueMetrics = this.deduplicateMetrics(allMetrics);
    
    // Combine warnings
    const allWarnings = analyses.flatMap(a => a.warnings);
    const uniqueWarnings = this.deduplicateWarnings(allWarnings);
    
    return {
      relevanceScore: avgRelevance,
      qualityScore: avgQuality,
      culturalScore: avgCultural,
      factualDensity: avgFactualDensity,
      sentimentScore: avgSentiment,
      readabilityScore: avgReadability,
      keyInsights: uniqueInsights,
      extractedFacts: uniqueFacts,
      norwegianTerms,
      citableQuotes: uniqueQuotes,
      businessMetrics: uniqueMetrics,
      warnings: uniqueWarnings
    };
  }

  /**
   * Deduplicate insights
   */
  private deduplicateInsights(insights: Insight[]): Insight[] {
    const seen = new Set<string>();
    return insights.filter(insight => {
      const key = insight.text.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Deduplicate facts
   */
  private deduplicateFacts(facts: ExtractedFact[]): ExtractedFact[] {
    const seen = new Set<string>();
    return facts.filter(fact => {
      const key = fact.fact.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Deduplicate quotes
   */
  private deduplicateQuotes(quotes: CitableQuote[]): CitableQuote[] {
    const seen = new Set<string>();
    return quotes.filter(quote => {
      const key = quote.quote.toLowerCase().substring(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Deduplicate metrics
   */
  private deduplicateMetrics(metrics: BusinessMetric[]): BusinessMetric[] {
    const seen = new Set<string>();
    return metrics.filter(metric => {
      const key = `${metric.metric}-${metric.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Deduplicate warnings
   */
  private deduplicateWarnings(warnings: AnalysisWarning[]): AnalysisWarning[] {
    const seen = new Set<string>();
    return warnings.filter(warning => {
      const key = `${warning.type}-${warning.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}