/**
 * Norwegian Cultural Validator
 * Validates content for cultural appropriateness in Norwegian business context
 */

/**
 * Cultural validation request
 */
export interface CulturalValidationRequest {
  content: string;
  audience: string;
  industry?: string;
  strictness: 'strict' | 'moderate' | 'relaxed';
  checkJantelov?: boolean;
  checkConsensusLanguage?: boolean;
  checkCulturalReferences?: boolean;
}

/**
 * Cultural validation result
 */
export interface CulturalValidationResult {
  overallScore: number;
  jantelovCompliance: {
    compliant: boolean;
    score: number;
    violations: string[];
    suggestions: string[];
  };
  consensusLanguage: {
    score: number;
    inclusivityLevel: 'high' | 'medium' | 'low';
    improvements: string[];
  };
  culturalReferences: {
    score: number;
    appropriate: boolean;
    norwegianReferences: string[];
    inappropriateReferences: string[];
  };
  formalityLevel: {
    detected: 'high' | 'medium' | 'low';
    appropriate: boolean;
    recommendation?: string;
  };
  suggestions: CulturalSuggestion[];
}

/**
 * Cultural suggestion
 */
export interface CulturalSuggestion {
  current: string;
  suggested: string;
  reason: string;
  culturalImpact: 'high' | 'medium' | 'low';
  category: 'jantelov' | 'consensus' | 'formality' | 'reference';
}

/**
 * Norwegian Cultural Validator
 */
export class CulturalValidator {
  // Jantelov violation patterns
  private readonly JANTELOV_VIOLATIONS = {
    selfPromotion: [
      'markedsledende',
      'best i norge',
      'best på',
      'nummer én',
      'overlegen',
      'uslåelig',
      'enestående',
      'eksepsjonell',
      'fremragende',
      'suveren'
    ],
    comparativeSuperiority: [
      'bedre enn alle',
      'bedre enn konkurrentene',
      'slår alle andre',
      'ingen kan måle seg',
      'uten sidestykke'
    ],
    absoluteClaims: [
      'alltid best',
      'aldri feil',
      'garantert suksess',
      '100% sikker',
      'perfekt løsning',
      'feilfri'
    ],
    individualGlory: [
      'min suksess',
      'jeg har oppnådd',
      'takket være meg',
      'min prestasjon',
      'jeg alene'
    ]
  };

  // Consensus-building language patterns
  private readonly CONSENSUS_PATTERNS = {
    inclusive: [
      'vi', 'oss', 'vår', 'våre',
      'sammen', 'felles', 'samarbeid',
      'i fellesskap', 'kollektivt', 'team'
    ],
    collaborative: [
      'la oss', 'kan vi', 'skal vi',
      'sammen kan vi', 'i samarbeid med',
      'gjennom dialog', 'i samråd med'
    ],
    humble: [
      'vi mener', 'vi tror', 'vår erfaring',
      'etter vår mening', 'vi foreslår',
      'kanskje kunne vi', 'det kan være'
    ],
    respectful: [
      'med respekt for', 'tar hensyn til',
      'verdsetter', 'anerkjenner', 'forstår'
    ]
  };

  // Norwegian cultural references
  private readonly CULTURAL_REFERENCES = {
    positive: [
      'dugnad', 'friluftsliv', 'koselig', 'hygge',
      'bærekraft', 'likestilling', 'velferd',
      'fellesskap', 'solidaritet', 'tillitsbasert'
    ],
    seasonal: [
      'påskeferie', 'sommerferie', 'julebord',
      '17. mai', 'sankthans', 'vinterferie'
    ],
    business: [
      'tariffavtale', 'tillitsvalgt', 'verneombud',
      'bedriftsdemokrati', 'partssamarbeid',
      'trepartssamarbeid', 'hovedavtale'
    ],
    avoid: [
      'american dream', 'winner takes all',
      'survival of the fittest', 'dog eat dog',
      'crushing the competition'
    ]
  };

  // Formality levels for different contexts
  private readonly FORMALITY_RULES = {
    highFormality: {
      indicators: ['De', 'Deres', 'herved', 'følgelig', 'således'],
      appropriate: ['government', 'legal', 'academic', 'formal-business']
    },
    mediumFormality: {
      indicators: ['du', 'din', 'gjerne', 'kanskje', 'trolig'],
      appropriate: ['business', 'professional', 'b2b', 'consulting']
    },
    lowFormality: {
      indicators: ['hei', 'takk', 'fint', 'kult', 'super'],
      appropriate: ['startup', 'creative', 'b2c', 'social-media']
    }
  };

  /**
   * Validate cultural appropriateness
   */
  async validate(request: CulturalValidationRequest): Promise<CulturalValidationResult> {
    // Check Jantelov compliance
    const jantelovCompliance = request.checkJantelov !== false
      ? this.checkJantelovCompliance(request.content, request.strictness)
      : { compliant: true, score: 100, violations: [], suggestions: [] };

    // Check consensus language
    const consensusLanguage = request.checkConsensusLanguage !== false
      ? this.checkConsensusLanguage(request.content)
      : { score: 100, inclusivityLevel: 'high' as const, improvements: [] };

    // Check cultural references
    const culturalReferences = request.checkCulturalReferences !== false
      ? this.checkCulturalReferences(request.content)
      : { score: 100, appropriate: true, norwegianReferences: [], inappropriateReferences: [] };

    // Check formality level
    const formalityLevel = this.checkFormalityLevel(request.content, request.audience, request.industry);

    // Generate suggestions
    const suggestions = this.generateCulturalSuggestions(
      request.content,
      jantelovCompliance,
      consensusLanguage,
      request.strictness
    );

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      jantelovCompliance.score,
      consensusLanguage.score,
      culturalReferences.score,
      formalityLevel.appropriate ? 100 : 70
    );

    return {
      overallScore,
      jantelovCompliance,
      consensusLanguage,
      culturalReferences,
      formalityLevel,
      suggestions
    };
  }

  /**
   * Check Jantelov compliance
   */
  private checkJantelovCompliance(
    content: string,
    strictness: 'strict' | 'moderate' | 'relaxed'
  ): CulturalValidationResult['jantelovCompliance'] {
    const violations: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const lowerContent = content.toLowerCase();

    // Check for self-promotion violations
    for (const term of this.JANTELOV_VIOLATIONS.selfPromotion) {
      if (lowerContent.includes(term)) {
        violations.push(`Overdreven selvskryt: "${term}"`);
        suggestions.push(`Erstatt "${term}" med mer nøytrale termer`);
        score -= strictness === 'strict' ? 15 : strictness === 'moderate' ? 10 : 5;
      }
    }

    // Check for comparative superiority
    for (const phrase of this.JANTELOV_VIOLATIONS.comparativeSuperiority) {
      if (lowerContent.includes(phrase)) {
        violations.push(`Direkte sammenligning: "${phrase}"`);
        suggestions.push('Fokuser på egne styrker uten å sammenligne med andre');
        score -= strictness === 'strict' ? 20 : strictness === 'moderate' ? 15 : 10;
      }
    }

    // Check for absolute claims
    for (const claim of this.JANTELOV_VIOLATIONS.absoluteClaims) {
      if (lowerContent.includes(claim)) {
        violations.push(`Absolutt påstand: "${claim}"`);
        suggestions.push('Bruk mer moderate og faktabaserte formuleringer');
        score -= strictness === 'strict' ? 15 : strictness === 'moderate' ? 10 : 5;
      }
    }

    // Check for individual glory
    for (const phrase of this.JANTELOV_VIOLATIONS.individualGlory) {
      if (lowerContent.includes(phrase)) {
        violations.push(`Individuell fremheving: "${phrase}"`);
        suggestions.push('Fremhev teamets innsats fremfor individuelle prestasjoner');
        score -= strictness === 'strict' ? 15 : strictness === 'moderate' ? 10 : 5;
      }
    }

    // Add general suggestions if violations found
    if (violations.length > 0) {
      suggestions.push('Vurder en mer ydmyk og balansert tilnærming');
      suggestions.push('Bruk "vi" fremfor "jeg" der det er mulig');
      suggestions.push('Støtt påstander med fakta og referanser');
    }

    return {
      compliant: violations.length === 0,
      score: Math.max(0, score),
      violations,
      suggestions
    };
  }

  /**
   * Check consensus language usage
   */
  private checkConsensusLanguage(content: string): CulturalValidationResult['consensusLanguage'] {
    const improvements: string[] = [];
    let inclusiveCount = 0;
    let collaborativeCount = 0;
    let humbleCount = 0;
    let respectfulCount = 0;

    const lowerContent = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;

    // Count inclusive language
    for (const term of this.CONSENSUS_PATTERNS.inclusive) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        inclusiveCount += matches.length;
      }
    }

    // Count collaborative language
    for (const phrase of this.CONSENSUS_PATTERNS.collaborative) {
      if (lowerContent.includes(phrase)) {
        collaborativeCount++;
      }
    }

    // Count humble language
    for (const phrase of this.CONSENSUS_PATTERNS.humble) {
      if (lowerContent.includes(phrase)) {
        humbleCount++;
      }
    }

    // Count respectful language
    for (const phrase of this.CONSENSUS_PATTERNS.respectful) {
      if (lowerContent.includes(phrase)) {
        respectfulCount++;
      }
    }

    // Calculate inclusivity ratio
    const inclusivityRatio = inclusiveCount / (wordCount / 100);
    const totalConsensusElements = inclusiveCount + collaborativeCount + humbleCount + respectfulCount;

    // Determine inclusivity level
    let inclusivityLevel: 'high' | 'medium' | 'low';
    if (inclusivityRatio > 3 && totalConsensusElements > 5) {
      inclusivityLevel = 'high';
    } else if (inclusivityRatio > 1.5 && totalConsensusElements > 2) {
      inclusivityLevel = 'medium';
    } else {
      inclusivityLevel = 'low';
    }

    // Generate improvements
    if (inclusiveCount < 2) {
      improvements.push('Øk bruken av inkluderende språk (vi, oss, sammen)');
    }
    if (collaborativeCount === 0) {
      improvements.push('Legg til samarbeidsfremmende formuleringer');
    }
    if (humbleCount === 0) {
      improvements.push('Inkluder mer ydmyke formuleringer (vi mener, vår erfaring)');
    }
    if (respectfulCount === 0) {
      improvements.push('Vis respekt for andre perspektiver og interessenter');
    }

    // Calculate score
    const score = Math.min(100, 
      (inclusivityRatio * 15) + 
      (collaborativeCount * 10) + 
      (humbleCount * 10) + 
      (respectfulCount * 10)
    );

    return {
      score: Math.round(score),
      inclusivityLevel,
      improvements
    };
  }

  /**
   * Check cultural references
   */
  private checkCulturalReferences(content: string): CulturalValidationResult['culturalReferences'] {
    const norwegianReferences: string[] = [];
    const inappropriateReferences: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for positive Norwegian references
    for (const ref of this.CULTURAL_REFERENCES.positive) {
      if (lowerContent.includes(ref)) {
        norwegianReferences.push(ref);
      }
    }

    // Check for seasonal references
    for (const ref of this.CULTURAL_REFERENCES.seasonal) {
      if (lowerContent.includes(ref)) {
        norwegianReferences.push(ref);
      }
    }

    // Check for business culture references
    for (const ref of this.CULTURAL_REFERENCES.business) {
      if (lowerContent.includes(ref)) {
        norwegianReferences.push(ref);
      }
    }

    // Check for inappropriate references
    for (const ref of this.CULTURAL_REFERENCES.avoid) {
      if (lowerContent.includes(ref)) {
        inappropriateReferences.push(ref);
      }
    }

    // Calculate score
    const positiveScore = norwegianReferences.length * 10;
    const negativeScore = inappropriateReferences.length * 20;
    const score = Math.max(0, Math.min(100, 50 + positiveScore - negativeScore));

    return {
      score,
      appropriate: inappropriateReferences.length === 0,
      norwegianReferences,
      inappropriateReferences
    };
  }

  /**
   * Check formality level
   */
  private checkFormalityLevel(
    content: string,
    audience: string,
    industry?: string
  ): CulturalValidationResult['formalityLevel'] {
    let highIndicators = 0;
    let mediumIndicators = 0;
    let lowIndicators = 0;

    const lowerContent = content.toLowerCase();

    // Count formality indicators
    for (const indicator of this.FORMALITY_RULES.highFormality.indicators) {
      if (lowerContent.includes(indicator.toLowerCase())) {
        highIndicators++;
      }
    }

    for (const indicator of this.FORMALITY_RULES.mediumFormality.indicators) {
      if (lowerContent.includes(indicator.toLowerCase())) {
        mediumIndicators++;
      }
    }

    for (const indicator of this.FORMALITY_RULES.lowFormality.indicators) {
      if (lowerContent.includes(indicator.toLowerCase())) {
        lowIndicators++;
      }
    }

    // Determine detected formality level
    let detected: 'high' | 'medium' | 'low';
    if (highIndicators > mediumIndicators && highIndicators > lowIndicators) {
      detected = 'high';
    } else if (lowIndicators > mediumIndicators) {
      detected = 'low';
    } else {
      detected = 'medium';
    }

    // Determine if appropriate for context
    const expectedFormality = this.getExpectedFormality(audience, industry);
    const appropriate = detected === expectedFormality || 
      (expectedFormality === 'medium' && (detected === 'high' || detected === 'low'));

    // Generate recommendation if not appropriate
    let recommendation: string | undefined;
    if (!appropriate) {
      if (expectedFormality === 'high' && detected !== 'high') {
        recommendation = 'Øk formalitetsnivået for denne målgruppen';
      } else if (expectedFormality === 'low' && detected === 'high') {
        recommendation = 'Reduser formalitetsnivået for en mer tilgjengelig tone';
      } else if (expectedFormality === 'medium') {
        recommendation = 'Juster til et moderat formalitetsnivå';
      }
    }

    return {
      detected,
      appropriate,
      recommendation
    };
  }

  /**
   * Get expected formality based on context
   */
  private getExpectedFormality(
    audience: string,
    industry?: string
  ): 'high' | 'medium' | 'low' {
    const lowerAudience = audience.toLowerCase();
    const lowerIndustry = industry?.toLowerCase() || '';

    // High formality contexts
    if (lowerAudience.includes('myndighet') || 
        lowerAudience.includes('departement') ||
        lowerIndustry.includes('legal') ||
        lowerIndustry.includes('finans')) {
      return 'high';
    }

    // Low formality contexts
    if (lowerAudience.includes('ungdom') ||
        lowerAudience.includes('startup') ||
        lowerIndustry.includes('kreativ') ||
        lowerIndustry.includes('underholdning')) {
      return 'low';
    }

    // Default to medium
    return 'medium';
  }

  /**
   * Generate cultural suggestions
   */
  private generateCulturalSuggestions(
    content: string,
    jantelovCompliance: CulturalValidationResult['jantelovCompliance'],
    consensusLanguage: CulturalValidationResult['consensusLanguage'],
    strictness: 'strict' | 'moderate' | 'relaxed'
  ): CulturalSuggestion[] {
    const suggestions: CulturalSuggestion[] = [];

    // Jantelov suggestions
    if (!jantelovCompliance.compliant) {
      // Suggest replacements for self-promotion
      const selfPromotionReplacements: Record<string, string> = {
        'markedsledende': 'anerkjent aktør',
        'best i norge': 'blant de fremste',
        'overlegen': 'konkurransedyktig',
        'uslåelig': 'svært god'
      };

      for (const [original, replacement] of Object.entries(selfPromotionReplacements)) {
        if (content.toLowerCase().includes(original)) {
          suggestions.push({
            current: original,
            suggested: replacement,
            reason: 'Mer ydmyk formulering i tråd med Janteloven',
            culturalImpact: 'high',
            category: 'jantelov'
          });
        }
      }
    }

    // Consensus language suggestions
    if (consensusLanguage.inclusivityLevel === 'low') {
      suggestions.push({
        current: 'jeg/min/mitt',
        suggested: 'vi/vår/vårt',
        reason: 'Øk inkluderende språkbruk',
        culturalImpact: 'medium',
        category: 'consensus'
      });

      suggestions.push({
        current: 'bedriften har oppnådd',
        suggested: 'sammen har vi oppnådd',
        reason: 'Fremhev kollektiv innsats',
        culturalImpact: 'medium',
        category: 'consensus'
      });
    }

    // Sort by cultural impact
    suggestions.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.culturalImpact] - impactOrder[b.culturalImpact];
    });

    return suggestions.slice(0, 10); // Limit to top 10
  }

  /**
   * Calculate overall cultural score
   */
  private calculateOverallScore(
    jantelovScore: number,
    consensusScore: number,
    referencesScore: number,
    formalityScore: number
  ): number {
    // Weighted average with Jantelov having highest weight
    const weightedScore = 
      jantelovScore * 0.35 +
      consensusScore * 0.30 +
      referencesScore * 0.20 +
      formalityScore * 0.15;

    return Math.round(weightedScore);
  }

  /**
   * Quick cultural check for real-time feedback
   */
  async quickCheck(content: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const lowerContent = content.toLowerCase();

    // Quick Jantelov check
    const majorViolations = ['markedsledende', 'best i', 'nummer én', 'overlegen'];
    for (const violation of majorViolations) {
      if (lowerContent.includes(violation)) {
        issues.push(`Jantelov-brudd: "${violation}"`);
        suggestions.push('Bruk mer ydmyke formuleringer');
        break;
      }
    }

    // Quick consensus check
    const hasInclusive = this.CONSENSUS_PATTERNS.inclusive.some(term => 
      lowerContent.includes(term)
    );
    if (!hasInclusive) {
      issues.push('Mangler inkluderende språk');
      suggestions.push('Legg til "vi", "oss", eller "sammen"');
    }

    // Calculate quick score
    const score = Math.max(0, 100 - (issues.length * 30));

    return { score, issues, suggestions };
  }
}