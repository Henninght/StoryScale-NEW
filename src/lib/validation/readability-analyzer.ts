/**
 * Norwegian Readability Analyzer
 * Analyzes text readability for Norwegian content
 */

/**
 * Readability analysis request
 */
export interface ReadabilityRequest {
  content: string;
  audience: string;
  contentType: string;
  dialect?: 'bokmål' | 'nynorsk';
}

/**
 * Readability analysis result
 */
export interface ReadabilityResult {
  score: number; // 0-100
  level: 'very-easy' | 'easy' | 'moderate' | 'difficult' | 'very-difficult';
  metrics: {
    averageSentenceLength: number;
    averageWordLength: number;
    syllablesPerWord: number;
    complexWordPercentage: number;
    passiveSentencePercentage: number;
    averageParagraphLength: number;
  };
  audienceMatch: {
    appropriate: boolean;
    recommendation?: string;
  };
  improvements: ReadabilityImprovement[];
  statistics: {
    totalWords: number;
    totalSentences: number;
    totalParagraphs: number;
    totalSyllables: number;
    readingTimeSeconds: number;
  };
}

/**
 * Readability improvement suggestion
 */
export interface ReadabilityImprovement {
  issue: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
  example?: string;
}

/**
 * Norwegian Readability Analyzer
 */
export class ReadabilityAnalyzer {
  // Norwegian readability constants (LIX formula adapted)
  private readonly READABILITY_CONSTANTS = {
    optimalSentenceLength: 15, // words
    optimalWordLength: 5.5, // characters
    optimalParagraphLength: 4, // sentences
    complexWordThreshold: 7, // characters
    norwegianReadingSpeed: 200 // words per minute
  };

  // Audience readability expectations
  private readonly AUDIENCE_LEVELS: Record<string, {
    maxSentenceLength: number;
    maxWordLength: number;
    maxComplexWords: number; // percentage
    expectedLevel: ReadabilityResult['level'];
  }> = {
    'general': {
      maxSentenceLength: 20,
      maxWordLength: 6,
      maxComplexWords: 15,
      expectedLevel: 'easy'
    },
    'professional': {
      maxSentenceLength: 25,
      maxWordLength: 7,
      maxComplexWords: 25,
      expectedLevel: 'moderate'
    },
    'academic': {
      maxSentenceLength: 30,
      maxWordLength: 8,
      maxComplexWords: 35,
      expectedLevel: 'difficult'
    },
    'youth': {
      maxSentenceLength: 15,
      maxWordLength: 5,
      maxComplexWords: 10,
      expectedLevel: 'very-easy'
    },
    'elderly': {
      maxSentenceLength: 18,
      maxWordLength: 5.5,
      maxComplexWords: 12,
      expectedLevel: 'easy'
    },
    'technical': {
      maxSentenceLength: 25,
      maxWordLength: 8,
      maxComplexWords: 30,
      expectedLevel: 'difficult'
    }
  };

  // Common complex Norwegian words that are actually simple
  private readonly SIMPLE_LONG_WORDS = new Set([
    'arbeidsplasser', 'barnehage', 'bibliotek', 'demokratisk',
    'ettermiddag', 'fellesskap', 'gjennomført', 'helsetjeneste',
    'informasjon', 'kjøpesenter', 'lokalsamfunn', 'menneskerettigheter',
    'naturvitenskap', 'organisasjon', 'programmer', 'regjeringen',
    'samfunnsfag', 'teknologi', 'universitet', 'virksomhet'
  ]);

  // Passive voice indicators in Norwegian
  private readonly PASSIVE_INDICATORS = [
    /\bblir?\s+\w+t\b/gi, // blir/ble + past participle
    /\ber\s+blitt\s+\w+t\b/gi, // er blitt + past participle
    /\bhar\s+blitt\s+\w+t\b/gi, // har blitt + past participle
    /\b\w+es\b/gi, // s-passive (handles, skrives, etc.)
    /\bdet\s+\w+es\b/gi // det + s-passive
  ];

  /**
   * Analyze readability
   */
  async analyze(request: ReadabilityRequest): Promise<ReadabilityResult> {
    // Calculate basic metrics
    const metrics = this.calculateMetrics(request.content);
    
    // Calculate readability score (Norwegian LIX formula)
    const score = this.calculateReadabilityScore(metrics);
    
    // Determine readability level
    const level = this.determineReadabilityLevel(score);
    
    // Check audience appropriateness
    const audienceMatch = this.checkAudienceMatch(
      level,
      metrics,
      request.audience
    );
    
    // Generate improvements
    const improvements = this.generateImprovements(
      metrics,
      level,
      request.audience,
      request.contentType
    );
    
    // Calculate statistics
    const statistics = this.calculateStatistics(request.content, metrics);

    return {
      score,
      level,
      metrics,
      audienceMatch,
      improvements,
      statistics
    };
  }

  /**
   * Calculate readability metrics
   */
  private calculateMetrics(content: string): ReadabilityResult['metrics'] {
    // Split into components
    const sentences = this.splitIntoSentences(content);
    const words = this.splitIntoWords(content);
    const paragraphs = this.splitIntoParagraphs(content);

    // Calculate sentence metrics
    const averageSentenceLength = sentences.length > 0
      ? words.length / sentences.length
      : 0;

    // Calculate word metrics
    const totalCharacters = words.join('').length;
    const averageWordLength = words.length > 0
      ? totalCharacters / words.length
      : 0;

    // Calculate syllables
    const totalSyllables = words.reduce((sum, word) => 
      sum + this.countSyllables(word), 0
    );
    const syllablesPerWord = words.length > 0
      ? totalSyllables / words.length
      : 0;

    // Calculate complex word percentage
    const complexWords = words.filter(word => 
      word.length >= this.READABILITY_CONSTANTS.complexWordThreshold &&
      !this.SIMPLE_LONG_WORDS.has(word.toLowerCase())
    );
    const complexWordPercentage = words.length > 0
      ? (complexWords.length / words.length) * 100
      : 0;

    // Calculate passive voice percentage
    const passiveSentences = sentences.filter(sentence => 
      this.hasPassiveVoice(sentence)
    );
    const passiveSentencePercentage = sentences.length > 0
      ? (passiveSentences.length / sentences.length) * 100
      : 0;

    // Calculate paragraph metrics
    const averageParagraphLength = paragraphs.length > 0
      ? sentences.length / paragraphs.length
      : 0;

    return {
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
      averageWordLength: Math.round(averageWordLength * 10) / 10,
      syllablesPerWord: Math.round(syllablesPerWord * 10) / 10,
      complexWordPercentage: Math.round(complexWordPercentage * 10) / 10,
      passiveSentencePercentage: Math.round(passiveSentencePercentage * 10) / 10,
      averageParagraphLength: Math.round(averageParagraphLength * 10) / 10
    };
  }

  /**
   * Calculate readability score using Norwegian LIX formula
   */
  private calculateReadabilityScore(metrics: ReadabilityResult['metrics']): number {
    // LIX formula: (words/sentences) + (long words * 100 / words)
    // Adapted for Norwegian with additional factors
    
    const lix = metrics.averageSentenceLength + metrics.complexWordPercentage;
    
    // Convert LIX to 0-100 scale (inverted - higher is better)
    // LIX ranges: <25 very easy, 25-35 easy, 35-45 moderate, 45-55 difficult, >55 very difficult
    let score = 100;
    
    if (lix < 25) {
      score = 100 - (25 - lix) * 0.5; // Very easy, slight penalty for being too simple
    } else if (lix < 35) {
      score = 90 - ((lix - 25) * 2); // Easy
    } else if (lix < 45) {
      score = 70 - ((lix - 35) * 2); // Moderate
    } else if (lix < 55) {
      score = 50 - ((lix - 45) * 3); // Difficult
    } else {
      score = Math.max(0, 20 - ((lix - 55) * 2)); // Very difficult
    }

    // Apply additional penalties
    if (metrics.passiveSentencePercentage > 30) {
      score -= 10;
    } else if (metrics.passiveSentencePercentage > 20) {
      score -= 5;
    }

    if (metrics.syllablesPerWord > 2.5) {
      score -= 5;
    }

    if (metrics.averageParagraphLength > 8) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine readability level based on score
   */
  private determineReadabilityLevel(score: number): ReadabilityResult['level'] {
    if (score >= 90) return 'very-easy';
    if (score >= 70) return 'easy';
    if (score >= 50) return 'moderate';
    if (score >= 30) return 'difficult';
    return 'very-difficult';
  }

  /**
   * Check if readability matches audience expectations
   */
  private checkAudienceMatch(
    level: ReadabilityResult['level'],
    metrics: ReadabilityResult['metrics'],
    audience: string
  ): ReadabilityResult['audienceMatch'] {
    // Get audience expectations
    const audienceKey = this.normalizeAudience(audience);
    const expectations = this.AUDIENCE_LEVELS[audienceKey] || this.AUDIENCE_LEVELS.general;

    // Check if metrics match expectations
    const sentenceLengthOk = metrics.averageSentenceLength <= expectations.maxSentenceLength;
    const wordLengthOk = metrics.averageWordLength <= expectations.maxWordLength;
    const complexityOk = metrics.complexWordPercentage <= expectations.maxComplexWords;
    const levelOk = this.isLevelAppropriate(level, expectations.expectedLevel);

    const appropriate = sentenceLengthOk && wordLengthOk && complexityOk && levelOk;

    // Generate recommendation if not appropriate
    let recommendation: string | undefined;
    if (!appropriate) {
      const issues: string[] = [];
      
      if (!sentenceLengthOk) {
        issues.push(`forkorte setninger (nå: ${metrics.averageSentenceLength} ord, maks: ${expectations.maxSentenceLength})`);
      }
      if (!wordLengthOk) {
        issues.push(`bruke enklere ord`);
      }
      if (!complexityOk) {
        issues.push(`redusere komplekse ord (nå: ${metrics.complexWordPercentage}%, maks: ${expectations.maxComplexWords}%)`);
      }
      if (!levelOk) {
        issues.push(`justere til ${this.translateLevel(expectations.expectedLevel)} nivå`);
      }

      recommendation = `For ${audience}: ${issues.join(', ')}`;
    }

    return { appropriate, recommendation };
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovements(
    metrics: ReadabilityResult['metrics'],
    level: ReadabilityResult['level'],
    audience: string,
    contentType: string
  ): ReadabilityImprovement[] {
    const improvements: ReadabilityImprovement[] = [];

    // Sentence length improvements
    if (metrics.averageSentenceLength > 25) {
      improvements.push({
        issue: 'Setningene er for lange',
        impact: 'high',
        suggestion: `Del opp lange setninger. Sikt mot ${this.READABILITY_CONSTANTS.optimalSentenceLength} ord per setning`,
        example: 'Del opp: "X og Y og Z" → "X. Dessuten Y. Til slutt Z."'
      });
    } else if (metrics.averageSentenceLength < 8) {
      improvements.push({
        issue: 'Setningene er for korte',
        impact: 'medium',
        suggestion: 'Kombiner korte setninger for bedre flyt',
        example: 'Slå sammen: "X er bra. Y er også bra." → "Både X og Y er bra."'
      });
    }

    // Word complexity improvements
    if (metrics.complexWordPercentage > 20) {
      improvements.push({
        issue: 'For mange komplekse ord',
        impact: 'high',
        suggestion: 'Erstatt lange og komplekse ord med enklere alternativer',
        example: '"implementering" → "gjennomføring", "konsolidering" → "sammenslåing"'
      });
    }

    // Passive voice improvements
    if (metrics.passiveSentencePercentage > 20) {
      improvements.push({
        issue: 'For mye passiv stemme',
        impact: 'medium',
        suggestion: 'Bruk aktiv stemme for mer direkte og engasjerende tekst',
        example: '"Beslutningen ble tatt" → "Vi tok beslutningen"'
      });
    }

    // Paragraph structure improvements
    if (metrics.averageParagraphLength > 6) {
      improvements.push({
        issue: 'Avsnittene er for lange',
        impact: 'medium',
        suggestion: 'Del opp lange avsnitt for bedre visuell struktur',
        example: 'Lag nytt avsnitt etter 3-4 setninger'
      });
    }

    // Syllable complexity
    if (metrics.syllablesPerWord > 2.2) {
      improvements.push({
        issue: 'Ordene har for mange stavelser',
        impact: 'low',
        suggestion: 'Foretrekk kortere ord med færre stavelser',
        example: '"organisasjon" → "firma", "informasjon" → "info"'
      });
    }

    // Content type specific improvements
    if (contentType === 'email' && metrics.averageSentenceLength > 15) {
      improvements.push({
        issue: 'E-poster bør være mer konsise',
        impact: 'medium',
        suggestion: 'Hold e-poster korte og poengterte',
        example: 'Bruk punktlister for bedre oversikt'
      });
    }

    if (contentType === 'blogPost' && level === 'very-difficult') {
      improvements.push({
        issue: 'Blogginnlegg er for komplekst',
        impact: 'high',
        suggestion: 'Forenkle språket for bredere appell',
        example: 'Forklar fagtermer første gang de brukes'
      });
    }

    // Sort by impact
    improvements.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });

    return improvements.slice(0, 10); // Limit to top 10
  }

  /**
   * Calculate detailed statistics
   */
  private calculateStatistics(
    content: string,
    metrics: ReadabilityResult['metrics']
  ): ReadabilityResult['statistics'] {
    const words = this.splitIntoWords(content);
    const sentences = this.splitIntoSentences(content);
    const paragraphs = this.splitIntoParagraphs(content);
    
    const totalSyllables = words.reduce((sum, word) => 
      sum + this.countSyllables(word), 0
    );
    
    const readingTimeSeconds = Math.ceil(
      (words.length / this.READABILITY_CONSTANTS.norwegianReadingSpeed) * 60
    );

    return {
      totalWords: words.length,
      totalSentences: sentences.length,
      totalParagraphs: paragraphs.length,
      totalSyllables,
      readingTimeSeconds
    };
  }

  /**
   * Quick readability check for real-time feedback
   */
  async quickCheck(content: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Quick sentence length check
    const sentences = this.splitIntoSentences(content);
    const words = this.splitIntoWords(content);
    
    if (sentences.length > 0) {
      const avgSentenceLength = words.length / sentences.length;
      if (avgSentenceLength > 25) {
        issues.push('Setningene er for lange');
        suggestions.push('Del opp lange setninger');
      }
    }

    // Quick complexity check
    const complexWords = words.filter(w => w.length > 10);
    const complexPercentage = (complexWords.length / Math.max(words.length, 1)) * 100;
    if (complexPercentage > 20) {
      issues.push('For mange komplekse ord');
      suggestions.push('Bruk enklere ord');
    }

    // Quick passive voice check
    const hasPassive = this.PASSIVE_INDICATORS.some(pattern => 
      pattern.test(content)
    );
    if (hasPassive) {
      suggestions.push('Vurder å bruke mer aktiv stemme');
    }

    // Calculate quick score
    let score = 100;
    score -= issues.length * 20;
    score -= suggestions.length * 10;

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  /**
   * Helper methods
   */
  private splitIntoSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private splitIntoWords(content: string): string[] {
    return content
      .replace(/[^\w\sæøåÆØÅ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private splitIntoParagraphs(content: string): string[] {
    return content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  private countSyllables(word: string): number {
    // Simplified Norwegian syllable counting
    word = word.toLowerCase();
    
    // Special cases
    if (word.length <= 3) return 1;
    
    // Count vowel groups as syllables
    const vowelGroups = word.match(/[aeiouyæøå]+/g);
    let count = vowelGroups ? vowelGroups.length : 1;
    
    // Adjust for common patterns
    if (word.endsWith('e') && word.length > 4) {
      count = Math.max(1, count - 1); // Silent e
    }
    
    // Norwegian specific adjustments
    if (word.includes('sjon') || word.includes('sjon')) {
      count += 1; // -sjon is typically 2 syllables
    }
    
    return Math.max(1, count);
  }

  private hasPassiveVoice(sentence: string): boolean {
    return this.PASSIVE_INDICATORS.some(pattern => 
      pattern.test(sentence)
    );
  }

  private normalizeAudience(audience: string): string {
    const lower = audience.toLowerCase();
    
    if (lower.includes('general') || lower.includes('alle')) {
      return 'general';
    }
    if (lower.includes('profesjon') || lower.includes('bedrift')) {
      return 'professional';
    }
    if (lower.includes('akadem') || lower.includes('forskning')) {
      return 'academic';
    }
    if (lower.includes('ung') || lower.includes('youth')) {
      return 'youth';
    }
    if (lower.includes('eldre') || lower.includes('senior')) {
      return 'elderly';
    }
    if (lower.includes('tekn') || lower.includes('ingeniør')) {
      return 'technical';
    }
    
    return 'general';
  }

  private isLevelAppropriate(
    actual: ReadabilityResult['level'],
    expected: ReadabilityResult['level']
  ): boolean {
    const levels = ['very-easy', 'easy', 'moderate', 'difficult', 'very-difficult'];
    const actualIndex = levels.indexOf(actual);
    const expectedIndex = levels.indexOf(expected);
    
    // Allow one level difference
    return Math.abs(actualIndex - expectedIndex) <= 1;
  }

  private translateLevel(level: ReadabilityResult['level']): string {
    const translations: Record<ReadabilityResult['level'], string> = {
      'very-easy': 'svært enkelt',
      'easy': 'enkelt',
      'moderate': 'moderat',
      'difficult': 'vanskelig',
      'very-difficult': 'svært vanskelig'
    };
    return translations[level];
  }
}