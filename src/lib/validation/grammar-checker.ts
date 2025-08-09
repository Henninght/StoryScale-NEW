/**
 * Norwegian Grammar Checker
 * Advanced grammar validation for Norwegian Bokmål and Nynorsk
 */

/**
 * Grammar validation request
 */
export interface GrammarValidationRequest {
  content: string;
  dialect: 'bokmål' | 'nynorsk';
  strictness: 'strict' | 'moderate' | 'relaxed';
  checkCompounds?: boolean;
  checkPunctuation?: boolean;
  checkSpelling?: boolean;
  provideSuggestions?: boolean;
}

/**
 * Grammar validation result
 */
export interface GrammarValidationResult {
  score: number;
  errors: GrammarError[];
  warnings: GrammarWarning[];
  corrections: GrammarCorrection[];
  statistics: {
    totalWords: number;
    totalSentences: number;
    errorsFound: number;
    warningsFound: number;
    compoundWordIssues: number;
    punctuationIssues: number;
    spellingIssues: number;
  };
}

/**
 * Grammar error detail
 */
export interface GrammarError {
  type: 'grammar' | 'spelling' | 'punctuation' | 'compound' | 'agreement' | 'word-order';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  position?: {
    line: number;
    column: number;
    offset: number;
  };
  context?: string;
  rule?: string;
  suggestion?: string;
}

/**
 * Grammar warning
 */
export interface GrammarWarning {
  type: string;
  message: string;
  suggestion?: string;
}

/**
 * Grammar correction suggestion
 */
export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
  confidence: number;
  ruleApplied: string;
}

/**
 * Norwegian Grammar Checker
 */
export class GrammarChecker {
  // Common Norwegian grammar patterns and rules
  private readonly GRAMMAR_RULES = {
    // Compound word rules
    compounds: {
      // Words that should be written as one
      shouldBeCombined: [
        ['for', 'øvrig'], // forøvrig
        ['i', 'mellom'], // imellom
        ['over', 'alt'], // overalt
        ['for', 'di'], // fordi
        ['etter', 'hvert'], // etterhvert
        ['for', 'hånd'], // forhånd
      ],
      // Words that should be separated
      shouldBeSeparated: [
        'pågrunn', // på grunn
        'istedet', // i stedet
        'tilross', // til tross
        'iforbindelse', // i forbindelse
      ]
    },

    // Common grammar errors
    commonErrors: {
      // Double negation
      doubleNegation: /\bikke\s+ingen\b|\bikke\s+aldri\b/gi,
      // Wrong word order
      wrongOrder: /\bhar\s+ikke\s+fått\b/gi, // Should be "ikke har fått"
      // Redundant expressions
      redundant: [
        /\bkun\s+bare\b/gi,
        /\bbegge\s+to\b/gi,
        /\bhelt\s+og\s+holdent\b/gi
      ],
      // Agreement errors
      subjectVerbAgreement: /\bvi\s+har\s+gått\b/gi, // Check context
      // Wrong prepositions
      wrongPreposition: [
        /\binteressert\s+for\b/gi, // Should be "interessert i"
        /\bflink\s+i\b/gi, // Should be "flink til"
        /\bredd\s+på\b/gi // Should be "redd for"
      ]
    },

    // Punctuation rules
    punctuation: {
      // Missing comma before subordinate clause
      missingComma: /\b(men|og|eller|for|så)\s+[a-zæøå]/gi,
      // Double punctuation
      doublePunctuation: /[.!?]{2,}/g,
      // Space before punctuation
      spaceBeforePunctuation: /\s+[.,!?;:]/g,
      // Missing space after punctuation
      missingSpaceAfter: /[.,!?;:][a-zæøåA-ZÆØÅ]/g
    },

    // Bokmål specific rules
    bokmål: {
      feminineNouns: {
        optional: ['jenta', 'boka', 'døra'], // Can be jenten, boken, døren
        required: ['kvinnen', 'mannen', 'barnet']
      },
      verbForms: {
        infinitive: /\bå\s+[a-zæøå]+e\b/gi,
        present: /\b(jeg|du|han|hun|vi|de)\s+[a-zæøå]+er\b/gi
      }
    },

    // Nynorsk specific rules
    nynorsk: {
      articles: {
        indefinite: { masculine: 'ein', feminine: 'ei', neuter: 'eit' },
        definite: { masculine: '-en', feminine: '-a', neuter: '-et' }
      },
      verbForms: {
        infinitive: /\bå\s+[a-zæøå]+a\b/gi,
        present: /\b(eg|du|han|ho|vi|dei)\s+[a-zæøå]+ar\b/gi
      }
    }
  };

  // Common spelling mistakes
  private readonly SPELLING_MISTAKES = new Map<string, string>([
    ['definitivt', 'definitivt'],
    ['defenitivt', 'definitivt'],
    ['skjønt', 'skjønt'],
    ['skjønnt', 'skjønt'],
    ['iløpet', 'i løpet'],
    ['istedenfor', 'i stedet for'],
    ['oppdrettsfisk', 'oppdrettsfisk'],
    ['oppdretts fisk', 'oppdrettsfisk'],
    ['email', 'e-post'],
    ['e-mail', 'e-post']
  ]);

  // Norwegian-specific word patterns
  private readonly WORD_PATTERNS = {
    compoundWords: /\b[a-zæøå]+[a-zæøå]{3,}\b/gi,
    abbreviations: /\b[A-ZÆØÅ]{2,}\b/g,
    numbers: /\b\d+\b/g,
    dates: /\b\d{1,2}[.]\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\b/gi
  };

  /**
   * Validate grammar
   */
  async validate(request: GrammarValidationRequest): Promise<GrammarValidationResult> {
    const errors: GrammarError[] = [];
    const warnings: GrammarWarning[] = [];
    const corrections: GrammarCorrection[] = [];

    // Split content into sentences and words
    const sentences = this.splitIntoSentences(request.content);
    const words = request.content.split(/\s+/);

    // Check compound words
    if (request.checkCompounds !== false) {
      const compoundErrors = this.checkCompoundWords(request.content, request.dialect);
      errors.push(...compoundErrors.errors);
      corrections.push(...compoundErrors.corrections);
    }

    // Check punctuation
    if (request.checkPunctuation !== false) {
      const punctuationErrors = this.checkPunctuation(request.content);
      errors.push(...punctuationErrors);
    }

    // Check spelling
    if (request.checkSpelling !== false) {
      const spellingErrors = this.checkSpelling(request.content);
      errors.push(...spellingErrors.errors);
      corrections.push(...spellingErrors.corrections);
    }

    // Check grammar patterns
    const grammarErrors = this.checkGrammarPatterns(request.content, request.dialect);
    errors.push(...grammarErrors.errors);
    warnings.push(...grammarErrors.warnings);
    corrections.push(...grammarErrors.corrections);

    // Check dialect-specific rules
    if (request.dialect === 'bokmål') {
      const bokmålErrors = this.checkBokmålRules(request.content);
      errors.push(...bokmålErrors);
    } else {
      const nynorskErrors = this.checkNynorskRules(request.content);
      errors.push(...nynorskErrors);
    }

    // Apply strictness level
    const filteredErrors = this.filterByStrictness(errors, request.strictness);
    const filteredWarnings = this.filterWarningsByStrictness(warnings, request.strictness);

    // Calculate score
    const score = this.calculateGrammarScore(
      filteredErrors.length,
      filteredWarnings.length,
      words.length,
      sentences.length
    );

    // Compile statistics
    const statistics = {
      totalWords: words.length,
      totalSentences: sentences.length,
      errorsFound: filteredErrors.length,
      warningsFound: filteredWarnings.length,
      compoundWordIssues: errors.filter(e => e.type === 'compound').length,
      punctuationIssues: errors.filter(e => e.type === 'punctuation').length,
      spellingIssues: errors.filter(e => e.type === 'spelling').length
    };

    return {
      score,
      errors: filteredErrors,
      warnings: filteredWarnings,
      corrections: request.provideSuggestions !== false ? corrections : [],
      statistics
    };
  }

  /**
   * Check compound words
   */
  private checkCompoundWords(
    content: string,
    dialect: 'bokmål' | 'nynorsk'
  ): { errors: GrammarError[]; corrections: GrammarCorrection[] } {
    const errors: GrammarError[] = [];
    const corrections: GrammarCorrection[] = [];

    // Check words that should be combined
    for (const [word1, word2] of this.GRAMMAR_RULES.compounds.shouldBeCombined) {
      const pattern = new RegExp(`\\b${word1}\\s+${word2}\\b`, 'gi');
      const matches = content.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          const combined = word1 + word2;
          errors.push({
            type: 'compound',
            severity: 'medium',
            message: `"${match}" skal skrives som ett ord`,
            suggestion: combined,
            rule: 'compound-words'
          });

          corrections.push({
            original: match,
            corrected: combined,
            explanation: 'Sammensatt ord skal skrives som ett ord i norsk',
            confidence: 0.95,
            ruleApplied: 'compound-combination'
          });
        });
      }
    }

    // Check words that should be separated
    for (const word of this.GRAMMAR_RULES.compounds.shouldBeSeparated) {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          const separated = this.getSeparatedForm(match);
          errors.push({
            type: 'compound',
            severity: 'medium',
            message: `"${match}" skal skrives som to ord`,
            suggestion: separated,
            rule: 'compound-separation'
          });

          corrections.push({
            original: match,
            corrected: separated,
            explanation: 'Dette uttrykket skal skrives som separate ord',
            confidence: 0.95,
            ruleApplied: 'compound-separation'
          });
        });
      }
    }

    return { errors, corrections };
  }

  /**
   * Check punctuation
   */
  private checkPunctuation(content: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Check double punctuation
    const doublePunct = content.match(this.GRAMMAR_RULES.punctuation.doublePunctuation);
    if (doublePunct) {
      doublePunct.forEach(match => {
        errors.push({
          type: 'punctuation',
          severity: 'low',
          message: `Dobbel tegnsetting: "${match}"`,
          suggestion: match[0],
          rule: 'double-punctuation'
        });
      });
    }

    // Check space before punctuation
    const spaceBefore = content.match(this.GRAMMAR_RULES.punctuation.spaceBeforePunctuation);
    if (spaceBefore) {
      spaceBefore.forEach(match => {
        errors.push({
          type: 'punctuation',
          severity: 'low',
          message: 'Mellomrom før tegnsetting',
          suggestion: match.trim(),
          rule: 'space-before-punctuation'
        });
      });
    }

    // Check missing space after punctuation
    const missingSpace = content.match(this.GRAMMAR_RULES.punctuation.missingSpaceAfter);
    if (missingSpace) {
      missingSpace.forEach(match => {
        errors.push({
          type: 'punctuation',
          severity: 'medium',
          message: 'Manglende mellomrom etter tegnsetting',
          suggestion: match[0] + ' ' + match.slice(1),
          rule: 'missing-space-after-punctuation'
        });
      });
    }

    return errors;
  }

  /**
   * Check spelling
   */
  private checkSpelling(
    content: string
  ): { errors: GrammarError[]; corrections: GrammarCorrection[] } {
    const errors: GrammarError[] = [];
    const corrections: GrammarCorrection[] = [];

    // Check against common spelling mistakes
    for (const [mistake, correct] of this.SPELLING_MISTAKES) {
      const pattern = new RegExp(`\\b${mistake}\\b`, 'gi');
      const matches = content.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          errors.push({
            type: 'spelling',
            severity: 'high',
            message: `Mulig stavefeil: "${match}"`,
            suggestion: correct,
            rule: 'common-spelling-error'
          });

          corrections.push({
            original: match,
            corrected: correct,
            explanation: 'Vanlig stavefeil i norsk',
            confidence: 0.9,
            ruleApplied: 'spelling-correction'
          });
        });
      }
    }

    return { errors, corrections };
  }

  /**
   * Check grammar patterns
   */
  private checkGrammarPatterns(
    content: string,
    dialect: 'bokmål' | 'nynorsk'
  ): { errors: GrammarError[]; warnings: GrammarWarning[]; corrections: GrammarCorrection[] } {
    const errors: GrammarError[] = [];
    const warnings: GrammarWarning[] = [];
    const corrections: GrammarCorrection[] = [];

    // Check for double negation
    const doubleNeg = content.match(this.GRAMMAR_RULES.commonErrors.doubleNegation);
    if (doubleNeg) {
      doubleNeg.forEach(match => {
        errors.push({
          type: 'grammar',
          severity: 'high',
          message: `Dobbel nektelse: "${match}"`,
          suggestion: match.replace(/ikke\s+/, ''),
          rule: 'double-negation'
        });
      });
    }

    // Check for redundant expressions
    for (const pattern of this.GRAMMAR_RULES.commonErrors.redundant) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          warnings.push({
            type: 'redundancy',
            message: `Overflødig uttrykk: "${match}"`,
            suggestion: this.getSimplifiedForm(match)
          });
        });
      }
    }

    // Check wrong prepositions
    for (const pattern of this.GRAMMAR_RULES.commonErrors.wrongPreposition) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const corrected = this.correctPreposition(match);
          errors.push({
            type: 'grammar',
            severity: 'medium',
            message: `Feil preposisjon: "${match}"`,
            suggestion: corrected,
            rule: 'wrong-preposition'
          });

          corrections.push({
            original: match,
            corrected,
            explanation: 'Feil preposisjonsbruk',
            confidence: 0.85,
            ruleApplied: 'preposition-correction'
          });
        });
      }
    }

    return { errors, warnings, corrections };
  }

  /**
   * Check Bokmål-specific rules
   */
  private checkBokmålRules(content: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Check for consistent use of feminine/masculine forms
    const feminineOptional = this.GRAMMAR_RULES.bokmål.feminineNouns.optional;
    for (const noun of feminineOptional) {
      const femininePattern = new RegExp(`\\b${noun}\\b`, 'gi');
      const masculineForm = noun.replace(/a$/, 'en');
      const masculinePattern = new RegExp(`\\b${masculineForm}\\b`, 'gi');
      
      const hasFeminine = femininePattern.test(content);
      const hasMasculine = masculinePattern.test(content);
      
      if (hasFeminine && hasMasculine) {
        errors.push({
          type: 'agreement',
          severity: 'low',
          message: `Inkonsekvent kjønnsbruk: både "${noun}" og "${masculineForm}" brukes`,
          suggestion: 'Velg én form konsekvent',
          rule: 'gender-consistency'
        });
      }
    }

    return errors;
  }

  /**
   * Check Nynorsk-specific rules
   */
  private checkNynorskRules(content: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Check for Bokmål forms in Nynorsk text
    const bokmålIndicators = ['jeg', 'meg', 'deg', 'seg', 'hun', 'dem'];
    const nynorskEquivalents = ['eg', 'meg', 'deg', 'seg', 'ho', 'dei'];

    bokmålIndicators.forEach((bokmål, index) => {
      const pattern = new RegExp(`\\b${bokmål}\\b`, 'gi');
      if (pattern.test(content)) {
        errors.push({
          type: 'grammar',
          severity: 'high',
          message: `Bokmålsform "${bokmål}" i nynorsktekst`,
          suggestion: nynorskEquivalents[index],
          rule: 'dialect-consistency'
        });
      }
    });

    return errors;
  }

  /**
   * Quick grammar check for real-time feedback
   */
  async quickCheck(content: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Quick check for most common errors
    if (this.GRAMMAR_RULES.commonErrors.doubleNegation.test(content)) {
      issues.push('Dobbel nektelse oppdaget');
    }

    // Check for obvious compound word errors
    for (const [word1, word2] of this.GRAMMAR_RULES.compounds.shouldBeCombined.slice(0, 3)) {
      const pattern = new RegExp(`\\b${word1}\\s+${word2}\\b`, 'gi');
      if (pattern.test(content)) {
        suggestions.push(`Skriv "${word1} ${word2}" som "${word1}${word2}"`);
      }
    }

    // Quick score calculation
    const errorCount = issues.length + suggestions.length;
    const wordCount = content.split(/\s+/).length;
    const score = Math.max(0, 100 - (errorCount * 10));

    return { score, issues, suggestions };
  }

  /**
   * Helper methods
   */
  private splitIntoSentences(content: string): string[] {
    return content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private getSeparatedForm(word: string): string {
    const separations: Record<string, string> = {
      'pågrunn': 'på grunn',
      'istedet': 'i stedet',
      'tilross': 'til tross',
      'iforbindelse': 'i forbindelse'
    };
    return separations[word.toLowerCase()] || word;
  }

  private getSimplifiedForm(expression: string): string {
    const simplifications: Record<string, string> = {
      'kun bare': 'bare',
      'begge to': 'begge',
      'helt og holdent': 'helt'
    };
    
    for (const [redundant, simple] of Object.entries(simplifications)) {
      if (expression.toLowerCase().includes(redundant)) {
        return simple;
      }
    }
    return expression;
  }

  private correctPreposition(phrase: string): string {
    const corrections: Record<string, string> = {
      'interessert for': 'interessert i',
      'flink i': 'flink til',
      'redd på': 'redd for'
    };
    
    for (const [wrong, correct] of Object.entries(corrections)) {
      if (phrase.toLowerCase().includes(wrong)) {
        return phrase.toLowerCase().replace(wrong, correct);
      }
    }
    return phrase;
  }

  private filterByStrictness(
    errors: GrammarError[],
    strictness: 'strict' | 'moderate' | 'relaxed'
  ): GrammarError[] {
    if (strictness === 'strict') {
      return errors; // Return all errors
    } else if (strictness === 'moderate') {
      return errors.filter(e => 
        e.severity === 'critical' || e.severity === 'high' || e.severity === 'medium'
      );
    } else {
      return errors.filter(e => 
        e.severity === 'critical' || e.severity === 'high'
      );
    }
  }

  private filterWarningsByStrictness(
    warnings: GrammarWarning[],
    strictness: 'strict' | 'moderate' | 'relaxed'
  ): GrammarWarning[] {
    if (strictness === 'strict') {
      return warnings;
    } else if (strictness === 'moderate') {
      return warnings.slice(0, Math.ceil(warnings.length / 2));
    } else {
      return []; // No warnings in relaxed mode
    }
  }

  private calculateGrammarScore(
    errorCount: number,
    warningCount: number,
    wordCount: number,
    sentenceCount: number
  ): number {
    // Base score
    let score = 100;

    // Deduct for errors (weighted by word count)
    const errorRate = errorCount / Math.max(wordCount / 100, 1);
    score -= Math.min(50, errorRate * 20);

    // Deduct for warnings
    const warningRate = warningCount / Math.max(wordCount / 100, 1);
    score -= Math.min(20, warningRate * 5);

    // Bonus for good sentence structure
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
      score += 5; // Bonus for optimal sentence length
    }

    return Math.max(0, Math.round(score));
  }
}