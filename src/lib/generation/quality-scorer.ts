/**
 * Norwegian Content Quality Assessment
 * Evaluates generated content for Norwegian business appropriateness and quality
 */

import { NORWEGIAN_VALIDATION_RULES } from './norwegian-prompts';
import { ContentVariant } from './content-variants';
import { CulturalAdaptationResult } from './cultural-adapter';

/**
 * Quality assessment result
 */
export interface QualityAssessment {
  overallScore: number; // 0-100
  dimensions: {
    linguistic: LinguisticQuality;
    cultural: CulturalQuality;
    business: BusinessQuality;
    technical: TechnicalQuality;
    engagement: EngagementQuality;
  };
  strengths: string[];
  weaknesses: string[];
  improvements: QualityImprovement[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  readinessLevel: 'ready' | 'needs_review' | 'needs_revision' | 'rejected';
}

/**
 * Linguistic quality metrics
 */
export interface LinguisticQuality {
  score: number;
  grammar: number;
  spelling: number;
  punctuation: number;
  flowAndRhythm: number;
  sentenceVariation: number;
  wordChoice: number;
  issues: string[];
}

/**
 * Cultural quality metrics
 */
export interface CulturalQuality {
  score: number;
  jantelovCompliance: number;
  consensusLanguage: number;
  culturalReferences: number;
  appropriateness: number;
  issues: string[];
}

/**
 * Business quality metrics
 */
export interface BusinessQuality {
  score: number;
  professionalism: number;
  terminology: number;
  credibility: number;
  persuasiveness: number;
  actionability: number;
  issues: string[];
}

/**
 * Technical quality metrics
 */
export interface TechnicalQuality {
  score: number;
  accuracy: number;
  completeness: number;
  structure: number;
  seoOptimization: number;
  accessibility: number;
  issues: string[];
}

/**
 * Engagement quality metrics
 */
export interface EngagementQuality {
  score: number;
  hookStrength: number;
  readability: number;
  emotionalConnection: number;
  callToAction: number;
  shareability: number;
  issues: string[];
}

/**
 * Quality improvement suggestion
 */
export interface QualityImprovement {
  dimension: keyof QualityAssessment['dimensions'];
  priority: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
  example?: string;
}

/**
 * Norwegian Content Quality Scorer
 */
export class NorwegianQualityScorer {
  // Quality thresholds
  private readonly THRESHOLDS = {
    ready: 85,
    needsReview: 70,
    needsRevision: 50
  };

  // Common Norwegian spelling errors to check
  private readonly COMMON_ERRORS = new Map<RegExp, string>([
    [/\bog så videre\b/g, 'osv.'],
    [/\bfor eksempel\b/g, 'f.eks.'],
    [/\bdet vil si\b/g, 'dvs.'],
    [/\bblant annet\b/g, 'bl.a.'],
    [/\bi forhold til\b/g, 'i forhold til / ifht.']
  ]);

  // Norwegian readability factors
  private readonly READABILITY_FACTORS = {
    optimalSentenceLength: 15,
    optimalWordLength: 6,
    optimalParagraphLength: 4, // sentences
    complexWordThreshold: 10 // characters
  };

  /**
   * Perform comprehensive quality assessment
   */
  async assessQuality(
    content: string,
    metadata: {
      contentType: string;
      audience: string;
      purpose: string;
      culturalAdaptation?: CulturalAdaptationResult;
      variant?: ContentVariant;
    }
  ): Promise<QualityAssessment> {
    // Assess each dimension
    const linguistic = this.assessLinguisticQuality(content);
    const cultural = this.assessCulturalQuality(content, metadata.culturalAdaptation);
    const business = this.assessBusinessQuality(content, metadata);
    const technical = this.assessTechnicalQuality(content, metadata);
    const engagement = this.assessEngagementQuality(content, metadata);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      linguistic,
      cultural,
      business,
      technical,
      engagement
    });

    // Identify strengths and weaknesses
    const { strengths, weaknesses } = this.identifyStrengthsWeaknesses({
      linguistic,
      cultural,
      business,
      technical,
      engagement
    });

    // Generate improvement suggestions
    const improvements = this.generateImprovements({
      linguistic,
      cultural,
      business,
      technical,
      engagement
    });

    // Determine grade and readiness
    const grade = this.calculateGrade(overallScore);
    const readinessLevel = this.determineReadiness(overallScore);

    return {
      overallScore,
      dimensions: {
        linguistic,
        cultural,
        business,
        technical,
        engagement
      },
      strengths,
      weaknesses,
      improvements,
      grade,
      readinessLevel
    };
  }

  /**
   * Assess linguistic quality
   */
  private assessLinguisticQuality(content: string): LinguisticQuality {
    const issues: string[] = [];
    let score = 100;

    // Check grammar (simplified - real implementation would use NLP)
    const grammarScore = this.checkGrammar(content);
    score -= (100 - grammarScore) * 0.2;
    if (grammarScore < 80) {
      issues.push('Grammatiske feil oppdaget');
    }

    // Check spelling
    const spellingScore = this.checkSpelling(content);
    score -= (100 - spellingScore) * 0.2;
    if (spellingScore < 90) {
      issues.push('Mulige stavefeil funnet');
    }

    // Check punctuation
    const punctuationScore = this.checkPunctuation(content);
    score -= (100 - punctuationScore) * 0.1;
    if (punctuationScore < 85) {
      issues.push('Tegnsettingsproblemer');
    }

    // Assess flow and rhythm
    const flowScore = this.assessFlowAndRhythm(content);
    score -= (100 - flowScore) * 0.2;
    if (flowScore < 70) {
      issues.push('Teksten flyter ikke naturlig');
    }

    // Check sentence variation
    const variationScore = this.assessSentenceVariation(content);
    score -= (100 - variationScore) * 0.15;
    if (variationScore < 75) {
      issues.push('Lite variasjon i setningsstruktur');
    }

    // Assess word choice
    const wordChoiceScore = this.assessWordChoice(content);
    score -= (100 - wordChoiceScore) * 0.15;
    if (wordChoiceScore < 80) {
      issues.push('Ordvalg kan forbedres');
    }

    return {
      score: Math.max(0, score),
      grammar: grammarScore,
      spelling: spellingScore,
      punctuation: punctuationScore,
      flowAndRhythm: flowScore,
      sentenceVariation: variationScore,
      wordChoice: wordChoiceScore,
      issues
    };
  }

  /**
   * Assess cultural quality
   */
  private assessCulturalQuality(
    content: string,
    culturalAdaptation?: CulturalAdaptationResult
  ): CulturalQuality {
    const issues: string[] = [];
    let score = 100;

    // Check Jantelov compliance
    const jantelovCheck = NORWEGIAN_VALIDATION_RULES.checkJantelovCompliance(content);
    const jantelovScore = jantelovCheck.compliant ? 100 : 
      Math.max(0, 100 - (jantelovCheck.issues.length * 20));
    score -= (100 - jantelovScore) * 0.3;
    if (!jantelovCheck.compliant) {
      issues.push(...jantelovCheck.issues);
    }

    // Check consensus language
    const consensusCheck = NORWEGIAN_VALIDATION_RULES.checkConsensusLanguage(content);
    score -= (100 - consensusCheck.score) * 0.25;
    if (consensusCheck.score < 70) {
      issues.push('Mangler konsensusbyggende språk');
    }

    // Check cultural references
    const culturalReferencesScore = this.assessCulturalReferences(content);
    score -= (100 - culturalReferencesScore) * 0.2;
    if (culturalReferencesScore < 60) {
      issues.push('Få eller ingen norske kulturelle referanser');
    }

    // Overall appropriateness
    const appropriatenessScore = culturalAdaptation?.culturalScore || 
      this.assessCulturalAppropriateness(content);
    score -= (100 - appropriatenessScore) * 0.25;
    if (appropriatenessScore < 75) {
      issues.push('Kulturell tilpasning kan forbedres');
    }

    return {
      score: Math.max(0, score),
      jantelovCompliance: jantelovScore,
      consensusLanguage: consensusCheck.score,
      culturalReferences: culturalReferencesScore,
      appropriateness: appropriatenessScore,
      issues
    };
  }

  /**
   * Assess business quality
   */
  private assessBusinessQuality(
    content: string,
    metadata: any
  ): BusinessQuality {
    const issues: string[] = [];
    let score = 100;

    // Check professionalism
    const professionalismScore = this.assessProfessionalism(content);
    score -= (100 - professionalismScore) * 0.25;
    if (professionalismScore < 80) {
      issues.push('Profesjonalitetsnivået bør økes');
    }

    // Check terminology
    const terminologyCheck = NORWEGIAN_VALIDATION_RULES.checkBusinessTerminology(content);
    score -= (100 - terminologyCheck.score) * 0.2;
    if (terminologyCheck.suggestions.length > 0) {
      issues.push(...terminologyCheck.suggestions);
    }

    // Assess credibility
    const credibilityScore = this.assessCredibility(content);
    score -= (100 - credibilityScore) * 0.2;
    if (credibilityScore < 75) {
      issues.push('Mangler troverdighetsbyggende elementer');
    }

    // Assess persuasiveness
    const persuasivenessScore = this.assessPersuasiveness(content, metadata.purpose);
    score -= (100 - persuasivenessScore) * 0.2;
    if (persuasivenessScore < 70) {
      issues.push('Overbevisningskraften kan styrkes');
    }

    // Check actionability
    const actionabilityScore = this.assessActionability(content);
    score -= (100 - actionabilityScore) * 0.15;
    if (actionabilityScore < 60) {
      issues.push('Mangler klare handlingsoppfordringer');
    }

    return {
      score: Math.max(0, score),
      professionalism: professionalismScore,
      terminology: terminologyCheck.score,
      credibility: credibilityScore,
      persuasiveness: persuasivenessScore,
      actionability: actionabilityScore,
      issues
    };
  }

  /**
   * Assess technical quality
   */
  private assessTechnicalQuality(
    content: string,
    metadata: any
  ): TechnicalQuality {
    const issues: string[] = [];
    let score = 100;

    // Check accuracy (simplified - would need fact-checking in production)
    const accuracyScore = this.assessAccuracy(content);
    score -= (100 - accuracyScore) * 0.25;
    if (accuracyScore < 90) {
      issues.push('Verifiser faktapåstander');
    }

    // Check completeness
    const completenessScore = this.assessCompleteness(content, metadata);
    score -= (100 - completenessScore) * 0.2;
    if (completenessScore < 80) {
      issues.push('Innholdet virker ufullstendig');
    }

    // Assess structure
    const structureScore = this.assessStructure(content);
    score -= (100 - structureScore) * 0.2;
    if (structureScore < 75) {
      issues.push('Strukturen kan forbedres');
    }

    // Check SEO optimization
    const seoScore = this.assessSEO(content, metadata);
    score -= (100 - seoScore) * 0.2;
    if (seoScore < 70) {
      issues.push('SEO-optimalisering mangler');
    }

    // Assess accessibility
    const accessibilityScore = this.assessAccessibility(content);
    score -= (100 - accessibilityScore) * 0.15;
    if (accessibilityScore < 80) {
      issues.push('Tilgjengelighetshensyn bør vurderes');
    }

    return {
      score: Math.max(0, score),
      accuracy: accuracyScore,
      completeness: completenessScore,
      structure: structureScore,
      seoOptimization: seoScore,
      accessibility: accessibilityScore,
      issues
    };
  }

  /**
   * Assess engagement quality
   */
  private assessEngagementQuality(
    content: string,
    metadata: any
  ): EngagementQuality {
    const issues: string[] = [];
    let score = 100;

    // Check hook strength
    const hookScore = this.assessHookStrength(content);
    score -= (100 - hookScore) * 0.25;
    if (hookScore < 70) {
      issues.push('Åpningen kunne vært sterkere');
    }

    // Assess readability
    const readabilityScore = this.assessReadability(content);
    score -= (100 - readabilityScore) * 0.2;
    if (readabilityScore < 75) {
      issues.push('Lesbarheten kan forbedres');
    }

    // Check emotional connection
    const emotionalScore = this.assessEmotionalConnection(content);
    score -= (100 - emotionalScore) * 0.2;
    if (emotionalScore < 60) {
      issues.push('Mangler emosjonell appell');
    }

    // Assess call to action
    const ctaScore = this.assessCallToAction(content);
    score -= (100 - ctaScore) * 0.2;
    if (ctaScore < 70) {
      issues.push('Handlingsoppfordring kan styrkes');
    }

    // Check shareability
    const shareabilityScore = this.assessShareability(content, metadata);
    score -= (100 - shareabilityScore) * 0.15;
    if (shareabilityScore < 65) {
      issues.push('Innholdet er mindre egnet for deling');
    }

    return {
      score: Math.max(0, score),
      hookStrength: hookScore,
      readability: readabilityScore,
      emotionalConnection: emotionalScore,
      callToAction: ctaScore,
      shareability: shareabilityScore,
      issues
    };
  }

  /**
   * Individual assessment methods
   */
  private checkGrammar(content: string): number {
    // Simplified grammar check
    let score = 100;
    
    // Check for common Norwegian grammar errors
    const errors = [
      /\bhar fått gjort\b/g, // Should be "har gjort"
      /\bville ha\b/g, // Often misused
      /\bkun bare\b/g, // Redundant
      /\bbegge to\b/g // Redundant
    ];
    
    for (const error of errors) {
      const matches = content.match(error);
      if (matches) {
        score -= matches.length * 5;
      }
    }
    
    return Math.max(0, score);
  }

  private checkSpelling(content: string): number {
    let score = 100;
    
    // Check for common misspellings
    for (const [error, correction] of this.COMMON_ERRORS) {
      if (error.test(content)) {
        score -= 5;
      }
    }
    
    return Math.max(0, score);
  }

  private checkPunctuation(content: string): number {
    let score = 100;
    
    // Check for missing periods
    const sentences = content.split(/[.!?]/);
    const lastSentence = sentences[sentences.length - 1].trim();
    if (lastSentence.length > 10) {
      score -= 10; // Missing final punctuation
    }
    
    // Check for proper comma usage (simplified)
    const longSentences = sentences.filter(s => s.split(' ').length > 20);
    for (const sentence of longSentences) {
      if (!sentence.includes(',')) {
        score -= 5; // Long sentence without commas
      }
    }
    
    return Math.max(0, score);
  }

  private assessFlowAndRhythm(content: string): number {
    const sentences = content.split(/[.!?]/).filter(s => s.trim());
    if (sentences.length < 2) return 50;
    
    // Check for rhythm variation
    const lengths = sentences.map(s => s.split(' ').length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variation = Math.sqrt(
      lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length
    );
    
    // Good rhythm has moderate variation
    const idealVariation = avgLength * 0.3;
    const variationScore = 100 - Math.abs(variation - idealVariation) * 2;
    
    return Math.max(0, Math.min(100, variationScore));
  }

  private assessSentenceVariation(content: string): number {
    const sentences = content.split(/[.!?]/).filter(s => s.trim());
    
    // Check for varied sentence beginnings
    const beginnings = sentences.map(s => s.trim().split(' ')[0]?.toLowerCase());
    const uniqueBeginnings = new Set(beginnings);
    
    const variationRatio = uniqueBeginnings.size / beginnings.length;
    return Math.round(variationRatio * 100);
  }

  private assessWordChoice(content: string): number {
    let score = 100;
    const words = content.toLowerCase().split(/\s+/);
    
    // Check for word repetition
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      if (word.length > 4) { // Only check meaningful words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    // Penalize excessive repetition
    for (const [word, count] of wordCounts) {
      if (count > 3 && !this.isCommonWord(word)) {
        score -= (count - 3) * 2;
      }
    }
    
    return Math.max(0, score);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = ['være', 'har', 'kan', 'skal', 'vil', 'med', 'for', 'som'];
    return commonWords.includes(word);
  }

  private assessCulturalReferences(content: string): number {
    let score = 50; // Base score
    
    // Check for Norwegian cultural markers
    const culturalMarkers = [
      'norsk', 'norge', 'nordisk', 'skandinavisk',
      'bærekraft', 'dugnad', 'koselig', 'friluftsliv'
    ];
    
    for (const marker of culturalMarkers) {
      if (content.toLowerCase().includes(marker)) {
        score += 10;
      }
    }
    
    return Math.min(100, score);
  }

  private assessCulturalAppropriateness(content: string): number {
    // Simplified assessment
    const jantelovCheck = NORWEGIAN_VALIDATION_RULES.checkJantelovCompliance(content);
    const consensusCheck = NORWEGIAN_VALIDATION_RULES.checkConsensusLanguage(content);
    
    return (jantelovCheck.compliant ? 50 : 0) + (consensusCheck.score / 2);
  }

  private assessProfessionalism(content: string): number {
    let score = 100;
    
    // Check for unprofessional elements
    const unprofessional = ['lol', 'haha', 'wtf', 'omg'];
    for (const term of unprofessional) {
      if (content.toLowerCase().includes(term)) {
        score -= 20;
      }
    }
    
    // Check for professional language markers
    const professional = ['følgelig', 'videre', 'således', 'henhold'];
    let professionalCount = 0;
    for (const term of professional) {
      if (content.toLowerCase().includes(term)) {
        professionalCount++;
      }
    }
    
    if (professionalCount === 0) {
      score -= 10; // No professional markers
    }
    
    return Math.max(0, score);
  }

  private assessCredibility(content: string): number {
    let score = 70; // Base score
    
    // Check for credibility indicators
    if (/\d+\s*%/.test(content)) score += 10; // Contains percentages
    if (/ifølge|viser|indikerer/.test(content)) score += 10; // References
    if (/forskning|studie|undersøkelse/.test(content)) score += 10; // Research mentions
    
    // Penalize vague claims
    if (/mange mener|noen sier|kanskje/.test(content)) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private assessPersuasiveness(content: string, purpose: string): number {
    let score = 60; // Base score
    
    // Check for persuasive elements
    if (/fordel|nytte|verdi|gevinst/.test(content)) score += 10;
    if (/løsning|forbedring|effektiv/.test(content)) score += 10;
    if (/resultat|suksess|oppnå/.test(content)) score += 10;
    
    // Check for action-oriented language
    if (/kan du|vil du|la oss/.test(content)) score += 10;
    
    return Math.min(100, score);
  }

  private assessActionability(content: string): number {
    let score = 50; // Base score
    
    // Check for action words
    const actionWords = [
      'bestill', 'kjøp', 'prøv', 'start', 'registrer',
      'last ned', 'kontakt', 'les mer', 'finn ut'
    ];
    
    for (const action of actionWords) {
      if (content.toLowerCase().includes(action)) {
        score += 15;
        break; // Only count once
      }
    }
    
    // Check for clear next steps
    if (/neste steg|gjør følgende|slik gjør du/.test(content)) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private assessAccuracy(content: string): number {
    // Simplified - would need fact-checking in production
    let score = 90; // Assume mostly accurate
    
    // Penalize absolute claims without evidence
    if (/alltid|aldri|garantert|100%/.test(content)) {
      score -= 10;
    }
    
    return score;
  }

  private assessCompleteness(content: string, metadata: any): number {
    const wordCount = content.split(/\s+/).length;
    
    // Expected lengths by content type
    const expectedLengths: Record<string, number> = {
      blogPost: 500,
      email: 200,
      socialMedia: 100,
      websiteCopy: 300,
      caseStudy: 800
    };
    
    const expected = expectedLengths[metadata.contentType] || 300;
    const completenessRatio = Math.min(wordCount / expected, 1);
    
    return Math.round(completenessRatio * 100);
  }

  private assessStructure(content: string): number {
    let score = 100;
    
    // Check for paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    if (paragraphs.length < 2 && content.length > 500) {
      score -= 20; // Long text without paragraphs
    }
    
    // Check for logical flow (simplified)
    const hasIntro = /^[A-ZÆØÅ]/.test(content);
    const hasConclusion = /[.!?]$/.test(content);
    
    if (!hasIntro) score -= 10;
    if (!hasConclusion) score -= 10;
    
    return Math.max(0, score);
  }

  private assessSEO(content: string, metadata: any): number {
    let score = 50; // Base score
    
    // Check for SEO elements (simplified)
    const wordCount = content.split(/\s+/).length;
    
    // Good length for SEO
    if (wordCount >= 300 && wordCount <= 1500) score += 20;
    
    // Check for potential keywords (would need actual keywords in production)
    if (metadata.contentType === 'blogPost') {
      // Check for title-like structure
      if (/^[A-ZÆØÅ].{10,60}$/.test(content.split('\n')[0])) {
        score += 15;
      }
      
      // Check for subheadings (lines that are shorter and capitalized)
      const lines = content.split('\n');
      const potentialHeadings = lines.filter(line => 
        line.length < 60 && /^[A-ZÆØÅ]/.test(line)
      );
      if (potentialHeadings.length > 2) score += 15;
    }
    
    return Math.min(100, score);
  }

  private assessAccessibility(content: string): number {
    let score = 100;
    
    // Check for accessibility issues
    const sentences = content.split(/[.!?]/);
    const veryLongSentences = sentences.filter(s => s.split(' ').length > 30);
    
    // Penalize very long sentences (hard to read)
    score -= veryLongSentences.length * 5;
    
    // Check for complex words
    const words = content.split(/\s+/);
    const complexWords = words.filter(w => w.length > 15);
    const complexityRatio = complexWords.length / words.length;
    
    if (complexityRatio > 0.1) {
      score -= 20; // Too many complex words
    }
    
    return Math.max(0, score);
  }

  private assessHookStrength(content: string): number {
    const firstSentence = content.split(/[.!?]/)[0];
    if (!firstSentence) return 0;
    
    let score = 50; // Base score
    
    // Check for engaging elements
    if (firstSentence.includes('?')) score += 20; // Question hook
    if (/du|deg|din|ditt/.test(firstSentence)) score += 15; // Direct address
    if (firstSentence.length < 100) score += 15; // Concise
    if (/visste du|forestill deg|tenk/.test(firstSentence.toLowerCase())) score += 20;
    
    return Math.min(100, score);
  }

  private assessReadability(content: string): number {
    const sentences = content.split(/[.!?]/).filter(s => s.trim());
    const words = content.split(/\s+/);
    
    if (sentences.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = content.replace(/\s+/g, '').length / words.length;
    
    // Norwegian readability index (simplified)
    let score = 100;
    
    // Penalize long sentences
    if (avgSentenceLength > this.READABILITY_FACTORS.optimalSentenceLength) {
      score -= (avgSentenceLength - this.READABILITY_FACTORS.optimalSentenceLength) * 2;
    }
    
    // Penalize long words
    if (avgWordLength > this.READABILITY_FACTORS.optimalWordLength) {
      score -= (avgWordLength - this.READABILITY_FACTORS.optimalWordLength) * 5;
    }
    
    return Math.max(0, score);
  }

  private assessEmotionalConnection(content: string): number {
    let score = 40; // Base score
    
    // Check for emotional language
    const emotionalWords = [
      'glede', 'bekymring', 'håp', 'frykt', 'stolt',
      'trygg', 'utfordring', 'mulighet', 'drøm', 'visjon'
    ];
    
    for (const word of emotionalWords) {
      if (content.toLowerCase().includes(word)) {
        score += 10;
      }
    }
    
    // Check for storytelling elements
    if (/en gang|forestill deg|la meg fortelle/.test(content.toLowerCase())) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  private assessCallToAction(content: string): number {
    let score = 0;
    
    // Check for CTA elements
    const ctaPhrases = [
      'kontakt oss', 'les mer', 'bestill', 'registrer',
      'last ned', 'finn ut', 'kom i gang', 'prøv gratis'
    ];
    
    for (const phrase of ctaPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        score = 70; // Has basic CTA
        break;
      }
    }
    
    // Check for urgency
    if (/nå|i dag|begrenset|tilbud/.test(content.toLowerCase())) {
      score += 15;
    }
    
    // Check for clarity
    if (/klikk her|trykk på/.test(content.toLowerCase())) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  private assessShareability(content: string, metadata: any): number {
    let score = 50; // Base score
    
    // Check for shareable elements
    if (/visste du|utrolig|fantastisk/.test(content.toLowerCase())) {
      score += 10; // Surprising elements
    }
    
    if (/tips|råd|guide|slik/.test(content.toLowerCase())) {
      score += 15; // Practical value
    }
    
    if (content.includes('?')) {
      score += 10; // Questions encourage engagement
    }
    
    // Length consideration for social sharing
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 100 && wordCount <= 500) {
      score += 15; // Optimal sharing length
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(dimensions: QualityAssessment['dimensions']): number {
    const weights = {
      linguistic: 0.25,
      cultural: 0.25,
      business: 0.20,
      technical: 0.15,
      engagement: 0.15
    };
    
    let weightedSum = 0;
    for (const [dimension, weight] of Object.entries(weights)) {
      weightedSum += dimensions[dimension as keyof typeof dimensions].score * weight;
    }
    
    return Math.round(weightedSum);
  }

  /**
   * Identify strengths and weaknesses
   */
  private identifyStrengthsWeaknesses(
    dimensions: QualityAssessment['dimensions']
  ): { strengths: string[]; weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Check each dimension
    for (const [name, dimension] of Object.entries(dimensions)) {
      if (dimension.score >= 85) {
        strengths.push(`Sterk ${this.translateDimension(name)}`);
      } else if (dimension.score < 60) {
        weaknesses.push(`Svak ${this.translateDimension(name)}`);
      }
    }
    
    // Add specific strengths
    if (dimensions.cultural.jantelovCompliance >= 90) {
      strengths.push('Utmerket Jantelov-tilpasning');
    }
    if (dimensions.engagement.readability >= 85) {
      strengths.push('Svært god lesbarhet');
    }
    
    // Add specific weaknesses
    if (dimensions.linguistic.grammar < 70) {
      weaknesses.push('Grammatiske problemer');
    }
    if (dimensions.business.actionability < 50) {
      weaknesses.push('Mangler klare handlingsoppfordringer');
    }
    
    return { strengths, weaknesses };
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovements(
    dimensions: QualityAssessment['dimensions']
  ): QualityImprovement[] {
    const improvements: QualityImprovement[] = [];
    
    // Check each dimension for issues
    for (const [dimName, dimension] of Object.entries(dimensions)) {
      if (dimension.issues.length > 0) {
        for (const issue of dimension.issues) {
          improvements.push({
            dimension: dimName as keyof QualityAssessment['dimensions'],
            priority: this.determinePriority(dimension.score),
            issue,
            suggestion: this.generateSuggestion(issue),
            example: this.generateExample(issue)
          });
        }
      }
    }
    
    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    improvements.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    
    return improvements.slice(0, 10); // Limit to top 10
  }

  /**
   * Helper methods
   */
  private translateDimension(dimension: string): string {
    const translations: Record<string, string> = {
      linguistic: 'språklig kvalitet',
      cultural: 'kulturell tilpasning',
      business: 'forretningskvalitet',
      technical: 'teknisk kvalitet',
      engagement: 'engasjementskvalitet'
    };
    return translations[dimension] || dimension;
  }

  private determinePriority(score: number): QualityImprovement['priority'] {
    if (score < 40) return 'critical';
    if (score < 60) return 'high';
    if (score < 80) return 'medium';
    return 'low';
  }

  private generateSuggestion(issue: string): string {
    const suggestions: Record<string, string> = {
      'Grammatiske feil oppdaget': 'Gjennomgå teksten for grammatiske feil og rett opp',
      'Mangler konsensusbyggende språk': 'Legg til mer inkluderende språk som "vi", "sammen", "felles"',
      'Mangler klare handlingsoppfordringer': 'Avslutt med en tydelig oppfordring til handling'
    };
    
    return suggestions[issue] || 'Vurder å forbedre dette aspektet';
  }

  private generateExample(issue: string): string | undefined {
    const examples: Record<string, string> = {
      'Mangler konsensusbyggende språk': 'Endre "Jeg mener..." til "Vi kan sammen..."',
      'Mangler klare handlingsoppfordringer': 'Legg til: "Kontakt oss i dag for å komme i gang"'
    };
    
    return examples[issue];
  }

  private calculateGrade(score: number): QualityAssessment['grade'] {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private determineReadiness(score: number): QualityAssessment['readinessLevel'] {
    if (score >= this.THRESHOLDS.ready) return 'ready';
    if (score >= this.THRESHOLDS.needsReview) return 'needs_review';
    if (score >= this.THRESHOLDS.needsRevision) return 'needs_revision';
    return 'rejected';
  }

  /**
   * Quick quality check for real-time feedback
   */
  quickQualityCheck(content: string): {
    score: number;
    majorIssues: string[];
    canPublish: boolean;
  } {
    // Quick Jantelov check
    const jantelovCheck = NORWEGIAN_VALIDATION_RULES.checkJantelovCompliance(content);
    
    // Quick readability check
    const avgSentenceLength = content.split(/[.!?]/).filter(s => s.trim()).map(s => 
      s.split(' ').length
    ).reduce((a, b, i, arr) => a + b / arr.length, 0);
    
    const majorIssues: string[] = [];
    let score = 100;
    
    if (!jantelovCheck.compliant) {
      majorIssues.push(...jantelovCheck.issues);
      score -= 30;
    }
    
    if (avgSentenceLength > 25) {
      majorIssues.push('Setningene er for lange');
      score -= 20;
    }
    
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 50) {
      majorIssues.push('Innholdet er for kort');
      score -= 25;
    }
    
    return {
      score: Math.max(0, score),
      majorIssues,
      canPublish: score >= 70 && majorIssues.length === 0
    };
  }
}