/**
 * Norwegian Cultural Adapter for Business Content
 * Applies Norwegian cultural context and business norms to generated content
 */

import { NORWEGIAN_CULTURAL_GUIDELINES, NORWEGIAN_VALIDATION_RULES } from './norwegian-prompts';

/**
 * Cultural adaptation result
 */
export interface CulturalAdaptationResult {
  adaptedContent: string;
  changes: AdaptationChange[];
  culturalScore: number;
  jantelovCompliance: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  businessAppropriateness: {
    score: number;
    terminology: Map<string, string>;
    tone: 'appropriate' | 'too_formal' | 'too_casual';
  };
  recommendations: string[];
}

/**
 * Individual adaptation change
 */
export interface AdaptationChange {
  type: 'jantelov' | 'terminology' | 'tone' | 'structure' | 'consensus';
  original: string;
  adapted: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Norwegian Business Cultural Adapter
 */
export class NorwegianCulturalAdapter {
  // Jantelov-violating phrases to replace
  private readonly JANTELOV_REPLACEMENTS = new Map<RegExp, string>([
    [/vi er best i/gi, 'vi fokuserer på'],
    [/markedsledende/gi, 'erfaren'],
    [/nummer én/gi, 'blant de fremste'],
    [/overlegen/gi, 'solid'],
    [/uslåelig/gi, 'konkurransedyktig'],
    [/revolusjonerende/gi, 'nyskapende'],
    [/banebrytende/gi, 'innovativ'],
    [/eksepsjonell/gi, 'god'],
    [/enestående/gi, 'særegen'],
    [/garantert suksess/gi, 'gode muligheter for suksess']
  ]);

  // Business terminology replacements (English -> Norwegian)
  private readonly BUSINESS_TERMINOLOGY = new Map<RegExp, string>([
    [/\bmeeting\b/gi, 'møte'],
    [/\bdeadline\b/gi, 'frist'],
    [/\bfeedback\b/gi, 'tilbakemelding'],
    [/\bworkshop\b/gi, 'arbeidsøkt'],
    [/\bbrainstorming\b/gi, 'idédugnad'],
    [/\bbenchmark\b/gi, 'referansepunkt'],
    [/\bbest practice\b/gi, 'beste praksis'],
    [/\bstakeholder\b/gi, 'interessent'],
    [/\bcompliance\b/gi, 'etterlevelse'],
    [/\bperformance\b/gi, 'ytelse'],
    [/\bscalable\b/gi, 'skalerbar'],
    [/\bdisruptive\b/gi, 'omveltende'],
    [/\bagile\b/gi, 'smidig'],
    [/\blean\b/gi, 'slank'],
    [/\btarget audience\b/gi, 'målgruppe'],
    [/\bvalue proposition\b/gi, 'verdiforslag'],
    [/\breturn on investment\b/gi, 'avkastning på investering'],
    [/\bkey performance indicator\b/gi, 'nøkkelindikator']
  ]);

  // Consensus-building phrases
  private readonly CONSENSUS_PHRASES = [
    'sammen kan vi',
    'i fellesskap',
    'gjennom samarbeid',
    'med felles innsats',
    'vi inviterer til dialog',
    'la oss utforske',
    'vi ser frem til å høre deres perspektiv',
    'deres innspill er verdifulle'
  ];

  // Industry-specific adaptations
  private readonly INDUSTRY_ADAPTATIONS = new Map<string, Map<string, string>>([
    ['technology', new Map([
      ['cutting-edge', 'moderne'],
      ['revolutionary', 'nyskapende'],
      ['game-changing', 'betydningsfull']
    ])],
    ['finance', new Map([
      ['aggressive growth', 'stabil vekst'],
      ['market domination', 'sterk markedsposisjon'],
      ['unbeatable returns', 'gode avkastninger']
    ])],
    ['consulting', new Map([
      ['thought leader', 'kunnskapsrik rådgiver'],
      ['industry expert', 'erfaren fagperson'],
      ['transformational', 'utviklende']
    ])]
  ]);

  /**
   * Apply full cultural adaptation to content
   */
  async adaptContent(
    content: string,
    context: {
      industry?: string;
      audience?: string;
      formality?: 'high' | 'medium' | 'low';
      companySize?: 'startup' | 'SMB' | 'enterprise';
    } = {}
  ): Promise<CulturalAdaptationResult> {
    const changes: AdaptationChange[] = [];
    let adaptedContent = content;

    // Step 1: Apply Jantelov adaptations
    const jantelovResult = this.applyJantelovAdaptations(adaptedContent);
    adaptedContent = jantelovResult.content;
    changes.push(...jantelovResult.changes);

    // Step 2: Replace business terminology
    const terminologyResult = this.replaceBusinessTerminology(adaptedContent);
    adaptedContent = terminologyResult.content;
    changes.push(...terminologyResult.changes);

    // Step 3: Adjust tone and formality
    const toneResult = this.adjustToneAndFormality(
      adaptedContent,
      context.formality || 'medium',
      context.audience
    );
    adaptedContent = toneResult.content;
    changes.push(...toneResult.changes);

    // Step 4: Add consensus language
    const consensusResult = this.addConsensusLanguage(adaptedContent);
    adaptedContent = consensusResult.content;
    changes.push(...consensusResult.changes);

    // Step 5: Apply industry-specific adaptations
    if (context.industry) {
      const industryResult = this.applyIndustryAdaptations(
        adaptedContent,
        context.industry
      );
      adaptedContent = industryResult.content;
      changes.push(...industryResult.changes);
    }

    // Step 6: Structure optimization for Norwegian reading patterns
    const structureResult = this.optimizeStructure(adaptedContent);
    adaptedContent = structureResult.content;
    changes.push(...structureResult.changes);

    // Calculate scores and compliance
    const jantelovCompliance = this.assessJantelovCompliance(adaptedContent);
    const businessAppropriateness = this.assessBusinessAppropriateness(
      adaptedContent,
      context
    );
    const culturalScore = this.calculateCulturalScore(
      jantelovCompliance,
      businessAppropriateness
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      adaptedContent,
      jantelovCompliance,
      businessAppropriateness,
      context
    );

    return {
      adaptedContent,
      changes,
      culturalScore,
      jantelovCompliance,
      businessAppropriateness,
      recommendations
    };
  }

  /**
   * Apply Jantelov adaptations
   */
  private applyJantelovAdaptations(
    content: string
  ): { content: string; changes: AdaptationChange[] } {
    let adaptedContent = content;
    const changes: AdaptationChange[] = [];

    for (const [pattern, replacement] of this.JANTELOV_REPLACEMENTS) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          changes.push({
            type: 'jantelov',
            original: match,
            adapted: replacement,
            reason: 'Fjernet selvskryt for å følge Janteloven',
            impact: 'high'
          });
        });
        adaptedContent = adaptedContent.replace(pattern, replacement);
      }
    }

    // Check for superlatives and moderate them
    const superlativePattern = /\b(alltid|aldri|perfekt|feilfri|garantert)\b/gi;
    const superlativeMatches = adaptedContent.match(superlativePattern);
    
    if (superlativeMatches) {
      const moderations = {
        'alltid': 'ofte',
        'aldri': 'sjelden',
        'perfekt': 'svært god',
        'feilfri': 'pålitelig',
        'garantert': 'sannsynlig'
      };

      superlativeMatches.forEach(match => {
        const lower = match.toLowerCase();
        if (moderations[lower as keyof typeof moderations]) {
          const replacement = moderations[lower as keyof typeof moderations];
          adaptedContent = adaptedContent.replace(
            new RegExp(`\\b${match}\\b`, 'gi'),
            replacement
          );
          changes.push({
            type: 'jantelov',
            original: match,
            adapted: replacement,
            reason: 'Moderert absolutt påstand',
            impact: 'medium'
          });
        }
      });
    }

    return { content: adaptedContent, changes };
  }

  /**
   * Replace English business terminology
   */
  private replaceBusinessTerminology(
    content: string
  ): { content: string; changes: AdaptationChange[] } {
    let adaptedContent = content;
    const changes: AdaptationChange[] = [];

    for (const [pattern, replacement] of this.BUSINESS_TERMINOLOGY) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          changes.push({
            type: 'terminology',
            original: match,
            adapted: replacement,
            reason: 'Erstattet engelsk term med norsk',
            impact: 'medium'
          });
        });
        adaptedContent = adaptedContent.replace(pattern, replacement);
      }
    }

    return { content: adaptedContent, changes };
  }

  /**
   * Adjust tone and formality
   */
  private adjustToneAndFormality(
    content: string,
    targetFormality: 'high' | 'medium' | 'low',
    audience?: string
  ): { content: string; changes: AdaptationChange[] } {
    let adaptedContent = content;
    const changes: AdaptationChange[] = [];

    // Formality adjustments
    if (targetFormality === 'high') {
      // Make more formal
      const informalReplacements = new Map([
        [/\bhei\b/gi, 'god dag'],
        [/\bfint\b/gi, 'utmerket'],
        [/\bkult\b/gi, 'interessant'],
        [/\bbra\b/gi, 'godt']
      ]);

      for (const [pattern, replacement] of informalReplacements) {
        if (pattern.test(adaptedContent)) {
          adaptedContent = adaptedContent.replace(pattern, replacement);
          changes.push({
            type: 'tone',
            original: pattern.source,
            adapted: replacement,
            reason: 'Økt formalitetsnivå',
            impact: 'low'
          });
        }
      }
    } else if (targetFormality === 'low') {
      // Make more casual
      const formalReplacements = new Map([
        [/\bgod dag\b/gi, 'hei'],
        [/\butmerket\b/gi, 'fint'],
        [/\bfremragende\b/gi, 'kjempebra']
      ]);

      for (const [pattern, replacement] of formalReplacements) {
        if (pattern.test(adaptedContent)) {
          adaptedContent = adaptedContent.replace(pattern, replacement);
          changes.push({
            type: 'tone',
            original: pattern.source,
            adapted: replacement,
            reason: 'Redusert formalitetsnivå',
            impact: 'low'
          });
        }
      }
    }

    // Audience-specific adjustments
    if (audience) {
      if (audience.toLowerCase().includes('leder') || 
          audience.toLowerCase().includes('direktør')) {
        // Executive audience - more concise and strategic
        adaptedContent = this.makeMoreExecutive(adaptedContent);
        changes.push({
          type: 'tone',
          original: 'standard tone',
          adapted: 'executive tone',
          reason: 'Tilpasset ledelsesnivå',
          impact: 'medium'
        });
      } else if (audience.toLowerCase().includes('teknisk') ||
                 audience.toLowerCase().includes('utvikler')) {
        // Technical audience - more precise
        adaptedContent = this.makeMoreTechnical(adaptedContent);
        changes.push({
          type: 'tone',
          original: 'standard tone',
          adapted: 'technical tone',
          reason: 'Tilpasset teknisk målgruppe',
          impact: 'medium'
        });
      }
    }

    return { content: adaptedContent, changes };
  }

  /**
   * Add consensus-building language
   */
  private addConsensusLanguage(
    content: string
  ): { content: string; changes: AdaptationChange[] } {
    let adaptedContent = content;
    const changes: AdaptationChange[] = [];

    // Check if content lacks consensus language
    const hasConsensus = this.CONSENSUS_PHRASES.some(phrase => 
      content.toLowerCase().includes(phrase)
    );

    if (!hasConsensus) {
      // Add consensus phrase at strategic points
      const sentences = adaptedContent.split('. ');
      
      if (sentences.length > 3) {
        // Add after first third of content
        const insertPoint = Math.floor(sentences.length / 3);
        const consensusPhrase = this.CONSENSUS_PHRASES[
          Math.floor(Math.random() * this.CONSENSUS_PHRASES.length)
        ];
        
        sentences[insertPoint] += `. Gjennom ${consensusPhrase}`;
        adaptedContent = sentences.join('. ');
        
        changes.push({
          type: 'consensus',
          original: 'Manglende konsensusspråk',
          adapted: consensusPhrase,
          reason: 'La til inkluderende språk',
          impact: 'medium'
        });
      }
    }

    // Replace "I/me" with "we/us"
    const individualPronouns = [
      [/\bjeg\b/gi, 'vi'],
      [/\bmeg\b/gi, 'oss'],
      [/\bmin\b/gi, 'vår'],
      [/\bmitt\b/gi, 'vårt'],
      [/\bmine\b/gi, 'våre']
    ];

    for (const [pattern, replacement] of individualPronouns) {
      if (pattern.test(adaptedContent)) {
        adaptedContent = adaptedContent.replace(pattern, replacement);
        changes.push({
          type: 'consensus',
          original: pattern.source,
          adapted: replacement,
          reason: 'Endret til kollektivt perspektiv',
          impact: 'high'
        });
      }
    }

    return { content: adaptedContent, changes };
  }

  /**
   * Apply industry-specific adaptations
   */
  private applyIndustryAdaptations(
    content: string,
    industry: string
  ): { content: string; changes: AdaptationChange[] } {
    let adaptedContent = content;
    const changes: AdaptationChange[] = [];

    const industryMap = this.INDUSTRY_ADAPTATIONS.get(industry.toLowerCase());
    if (industryMap) {
      for (const [original, replacement] of industryMap) {
        const pattern = new RegExp(`\\b${original}\\b`, 'gi');
        if (pattern.test(adaptedContent)) {
          adaptedContent = adaptedContent.replace(pattern, replacement);
          changes.push({
            type: 'terminology',
            original,
            adapted: replacement,
            reason: `Tilpasset ${industry} bransjestandard`,
            impact: 'medium'
          });
        }
      }
    }

    // Add industry-specific context
    if (industry === 'technology') {
      // Add sustainability angle (important in Norway)
      if (!adaptedContent.includes('bærekraft')) {
        adaptedContent += ' Dette bidrar til bærekraftig utvikling.';
        changes.push({
          type: 'structure',
          original: 'Manglende bærekraftsperspektiv',
          adapted: 'Lagt til bærekraftsperspektiv',
          reason: 'Viktig for norsk teknologisektor',
          impact: 'medium'
        });
      }
    } else if (industry === 'finance') {
      // Add transparency emphasis
      if (!adaptedContent.includes('transparent') && !adaptedContent.includes('åpen')) {
        adaptedContent = adaptedContent.replace(
          /våre tjenester/gi,
          'våre transparente tjenester'
        );
        changes.push({
          type: 'structure',
          original: 'våre tjenester',
          adapted: 'våre transparente tjenester',
          reason: 'Fremhevet transparens for finanssektoren',
          impact: 'medium'
        });
      }
    }

    return { content: adaptedContent, changes };
  }

  /**
   * Optimize structure for Norwegian reading patterns
   */
  private optimizeStructure(
    content: string
  ): { content: string; changes: AdaptationChange[] } {
    let adaptedContent = content;
    const changes: AdaptationChange[] = [];

    // Split into paragraphs if too long
    const words = adaptedContent.split(/\s+/);
    if (words.length > 150 && !adaptedContent.includes('\n\n')) {
      // Add paragraph breaks at logical points
      const sentences = adaptedContent.split('. ');
      const sentencesPerParagraph = Math.ceil(sentences.length / 3);
      
      const paragraphs: string[] = [];
      for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
        paragraphs.push(
          sentences.slice(i, i + sentencesPerParagraph).join('. ')
        );
      }
      
      adaptedContent = paragraphs.join('.\n\n');
      changes.push({
        type: 'structure',
        original: 'Enkelt avsnitt',
        adapted: 'Delt i avsnitt',
        reason: 'Forbedret lesbarhet',
        impact: 'low'
      });
    }

    // Ensure strong opening (Norwegian preference for context-setting)
    const firstSentence = adaptedContent.split('.')[0];
    if (firstSentence.length < 50) {
      // Opening is too abrupt, add context
      adaptedContent = `I dagens norske næringsliv, ${adaptedContent.charAt(0).toLowerCase()}${adaptedContent.slice(1)}`;
      changes.push({
        type: 'structure',
        original: 'Kort åpning',
        adapted: 'Kontekstualisert åpning',
        reason: 'Norsk preferanse for kontekstsetting',
        impact: 'low'
      });
    }

    return { content: adaptedContent, changes };
  }

  /**
   * Make content more executive-focused
   */
  private makeMoreExecutive(content: string): string {
    // Remove unnecessary details
    content = content.replace(/for eksempel|eksempelvis|med andre ord/gi, '');
    
    // Make more action-oriented
    content = content.replace(/vi bør vurdere/gi, 'vi implementerer');
    content = content.replace(/kan være/gi, 'er');
    
    // Add strategic language
    if (!content.includes('strategi')) {
      content = content.replace(/plan/gi, 'strategisk plan');
    }
    
    return content;
  }

  /**
   * Make content more technical
   */
  private makeMoreTechnical(content: string): string {
    // Add precision
    content = content.replace(/omtrent|cirka|rundt/gi, 'nøyaktig');
    
    // Use technical terms
    content = content.replace(/system/gi, 'teknisk system');
    content = content.replace(/løsning/gi, 'teknisk løsning');
    
    return content;
  }

  /**
   * Assess Jantelov compliance
   */
  private assessJantelovCompliance(content: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const validation = NORWEGIAN_VALIDATION_RULES.checkJantelovCompliance(content);
    const issues = validation.issues;
    const suggestions: string[] = [];

    // Calculate score (100 = full compliance)
    let score = 100;
    score -= issues.length * 10;
    
    // Check for positive indicators
    const positiveIndicators = [
      'sammen', 'fellesskap', 'samarbeid', 'vi', 'oss', 'felles'
    ];
    
    const positiveCount = positiveIndicators.filter(indicator =>
      content.toLowerCase().includes(indicator)
    ).length;
    
    score += positiveCount * 5;
    
    // Generate suggestions
    if (issues.length > 0) {
      suggestions.push('Vurder å moderere påstander og fokusere mer på kollektive prestasjoner');
    }
    
    if (positiveCount < 3) {
      suggestions.push('Legg til mer inkluderende og samarbeidsorientert språk');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      suggestions
    };
  }

  /**
   * Assess business appropriateness
   */
  private assessBusinessAppropriateness(
    content: string,
    context: any
  ): {
    score: number;
    terminology: Map<string, string>;
    tone: 'appropriate' | 'too_formal' | 'too_casual';
  } {
    const terminology = new Map<string, string>();
    let score = 100;

    // Check for remaining English terms
    const englishTerms = [
      'meeting', 'deadline', 'feedback', 'workshop', 'performance'
    ];
    
    for (const term of englishTerms) {
      if (content.toLowerCase().includes(term)) {
        terminology.set(term, 'Bør erstattes med norsk term');
        score -= 5;
      }
    }

    // Assess tone
    const formalIndicators = ['herved', 'således', 'følgelig'];
    const casualIndicators = ['kjempebra', 'kult', 'gøy'];
    
    const formalCount = formalIndicators.filter(ind =>
      content.toLowerCase().includes(ind)
    ).length;
    
    const casualCount = casualIndicators.filter(ind =>
      content.toLowerCase().includes(ind)
    ).length;
    
    let tone: 'appropriate' | 'too_formal' | 'too_casual' = 'appropriate';
    
    if (formalCount > 2) {
      tone = 'too_formal';
      score -= 10;
    } else if (casualCount > 2) {
      tone = 'too_casual';
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      terminology,
      tone
    };
  }

  /**
   * Calculate overall cultural score
   */
  private calculateCulturalScore(
    jantelovCompliance: any,
    businessAppropriateness: any
  ): number {
    // Weighted average
    const jantelovWeight = 0.4;
    const businessWeight = 0.3;
    const baseScore = 0.3;
    
    return Math.round(
      jantelovCompliance.score * jantelovWeight +
      businessAppropriateness.score * businessWeight +
      100 * baseScore
    );
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    content: string,
    jantelovCompliance: any,
    businessAppropriateness: any,
    context: any
  ): string[] {
    const recommendations: string[] = [];

    // Jantelov recommendations
    if (jantelovCompliance.score < 70) {
      recommendations.push(
        'Reduser selvpromotering og fokuser mer på kollektive resultater'
      );
    }

    // Business terminology
    if (businessAppropriateness.terminology.size > 0) {
      recommendations.push(
        `Erstatt ${businessAppropriateness.terminology.size} engelske termer med norske`
      );
    }

    // Tone recommendations
    if (businessAppropriateness.tone === 'too_formal') {
      recommendations.push('Gjør tonen mer tilgjengelig og mindre formell');
    } else if (businessAppropriateness.tone === 'too_casual') {
      recommendations.push('Øk profesjonalitetsnivået i språket');
    }

    // Context-specific recommendations
    if (context.industry === 'technology') {
      if (!content.includes('bærekraft') && !content.includes('etisk')) {
        recommendations.push(
          'Vurder å inkludere perspektiver på bærekraft eller etisk teknologi'
        );
      }
    }

    // Length recommendations
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 500) {
      recommendations.push('Vurder å dele innholdet i kortere seksjoner');
    }

    return recommendations;
  }

  /**
   * Quick check for critical cultural issues
   */
  quickCulturalCheck(content: string): {
    hasIssues: boolean;
    criticalIssues: string[];
  } {
    const criticalIssues: string[] = [];

    // Check for major Jantelov violations
    const majorViolations = [
      'vi er best', 'markedsledende', 'nummer én', 'overlegen'
    ];
    
    for (const violation of majorViolations) {
      if (content.toLowerCase().includes(violation)) {
        criticalIssues.push(`Fjern "${violation}" - strider mot Janteloven`);
      }
    }

    // Check for inappropriate comparisons
    if (/bedre enn alle|slår konkurrentene/i.test(content)) {
      criticalIssues.push('Unngå direkte negative sammenligninger med konkurrenter');
    }

    return {
      hasIssues: criticalIssues.length > 0,
      criticalIssues
    };
  }
}