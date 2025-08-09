/**
 * Norwegian Business Communication Validator
 * Validates content for business appropriateness and professional standards
 */

/**
 * Business validation request
 */
export interface BusinessValidationRequest {
  content: string;
  contentType: string;
  industry?: string;
  company?: string;
  tone?: 'professional' | 'casual' | 'authoritative' | 'friendly';
  checkTerminology?: boolean;
  checkProfessionalism?: boolean;
  checkCredibility?: boolean;
}

/**
 * Business validation result
 */
export interface BusinessValidationResult {
  overallScore: number;
  professionalism: {
    score: number;
    level: 'high' | 'medium' | 'low';
    issues: string[];
  };
  terminology: {
    score: number;
    anglicismsFound: number;
    suggestions: TerminologySuggestion[];
  };
  credibility: {
    score: number;
    hasEvidence: boolean;
    hasNumbers: boolean;
    hasReferences: boolean;
    improvements: string[];
  };
  persuasiveness: {
    score: number;
    hasValueProposition: boolean;
    hasBenefits: boolean;
    hasCallToAction: boolean;
  };
  structure: {
    score: number;
    hasIntroduction: boolean;
    hasConclusion: boolean;
    isLogical: boolean;
    improvements: string[];
  };
}

/**
 * Terminology suggestion
 */
export interface TerminologySuggestion {
  original: string;
  suggested: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  category: 'anglicism' | 'jargon' | 'informal' | 'technical';
}

/**
 * Norwegian Business Validator
 */
export class BusinessValidator {
  // Business terminology mappings
  private readonly TERMINOLOGY_MAP = {
    anglicisms: {
      // Common business anglicisms and their Norwegian equivalents
      'meeting': 'møte',
      'deadline': 'frist',
      'feedback': 'tilbakemelding',
      'workshop': 'arbeidsøkt',
      'brainstorming': 'idédugnad',
      'case': 'sak/eksempel',
      'business': 'virksomhet/forretning',
      'management': 'ledelse',
      'compliance': 'etterlevelse',
      'performance': 'ytelse/prestasjon',
      'team': 'lag/gruppe',
      'leader': 'leder',
      'skills': 'ferdigheter/kompetanse',
      'training': 'opplæring',
      'coaching': 'veiledning',
      'networking': 'nettverksbygging',
      'outsourcing': 'utkontraktering',
      'benchmark': 'referansemåling',
      'best practice': 'beste praksis',
      'stakeholder': 'interessent',
      'merger': 'fusjon',
      'acquisition': 'oppkjøp',
      'revenue': 'inntekt/omsetning',
      'profit': 'fortjeneste/overskudd'
    },
    jargon: {
      // Business jargon to avoid or replace
      'synergi': 'samarbeid',
      'leverage': 'utnytte',
      'alignere': 'tilpasse',
      'skalere': 'vokse',
      'disrupte': 'forstyrre/endre',
      'pivotere': 'endre retning',
      'agile': 'smidig',
      'iterate': 'forbedre gradvis'
    },
    technical: {
      // Technical terms by industry
      'digitalisering': 'digital transformasjon',
      'automatisering': 'automatisering',
      'optimalisering': 'forbedring',
      'implementering': 'gjennomføring',
      'konsolidering': 'sammenslåing',
      'diversifisering': 'variasjon'
    }
  };

  // Professional language indicators
  private readonly PROFESSIONALISM_INDICATORS = {
    professional: [
      'følgelig', 'således', 'videre', 'henhold',
      'vedrørende', 'angående', 'ifølge', 'basert på',
      'i tråd med', 'med hensyn til', 'som følge av'
    ],
    unprofessional: [
      'lol', 'haha', 'hehe', 'wtf', 'omg',
      'kult', 'gøy', 'morsomt', 'tullete',
      'sykt', 'sinnsykt', 'vanvittig'
    ],
    casual: [
      'liksom', 'sånn', 'typ', 'greier',
      'ting', 'stuff', 'osv', 'etc'
    ]
  };

  // Credibility markers
  private readonly CREDIBILITY_MARKERS = {
    evidence: [
      'ifølge', 'viser', 'indikerer', 'dokumenterer',
      'beviser', 'underbygger', 'støtter', 'bekrefter'
    ],
    sources: [
      'forskning', 'studie', 'undersøkelse', 'rapport',
      'analyse', 'statistikk', 'data', 'fakta'
    ],
    vague: [
      'mange mener', 'noen sier', 'kanskje', 'muligens',
      'antagelig', 'sannsynligvis', 'ofte', 'vanligvis'
    ],
    absolute: [
      'alltid', 'aldri', 'garantert', 'definitivt',
      '100%', 'helt sikkert', 'uten tvil'
    ]
  };

  // Industry-specific terminology
  private readonly INDUSTRY_TERMS: Record<string, string[]> = {
    technology: [
      'digitalisering', 'skyløsning', 'kunstig intelligens',
      'maskinlæring', 'dataanalyse', 'cybersikkerhet'
    ],
    finance: [
      'likviditet', 'avkastning', 'portefølje',
      'risikostyring', 'compliance', 'regulering'
    ],
    healthcare: [
      'pasientforløp', 'behandlingslinje', 'diagnostikk',
      'forebygging', 'rehabilitering', 'primærhelsetjeneste'
    ],
    retail: [
      'omsetning', 'margin', 'lager', 'logistikk',
      'kundeopplevelse', 'lojalitetsprogram'
    ],
    energy: [
      'bærekraft', 'fornybar', 'energieffektivitet',
      'utslipp', 'grønn omstilling', 'karbonnøytral'
    ]
  };

  /**
   * Validate business communication
   */
  async validate(request: BusinessValidationRequest): Promise<BusinessValidationResult> {
    // Check professionalism
    const professionalism = request.checkProfessionalism !== false
      ? this.checkProfessionalism(request.content, request.tone)
      : { score: 100, level: 'high' as const, issues: [] };

    // Check terminology
    const terminology = request.checkTerminology !== false
      ? this.checkTerminology(request.content, request.industry)
      : { score: 100, anglicismsFound: 0, suggestions: [] };

    // Check credibility
    const credibility = request.checkCredibility !== false
      ? this.checkCredibility(request.content)
      : { 
          score: 100, 
          hasEvidence: true, 
          hasNumbers: true, 
          hasReferences: true, 
          improvements: [] 
        };

    // Check persuasiveness
    const persuasiveness = this.checkPersuasiveness(request.content, request.contentType);

    // Check structure
    const structure = this.checkStructure(request.content, request.contentType);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      professionalism.score,
      terminology.score,
      credibility.score,
      persuasiveness.score,
      structure.score
    );

    return {
      overallScore,
      professionalism,
      terminology,
      credibility,
      persuasiveness,
      structure
    };
  }

  /**
   * Check professionalism level
   */
  private checkProfessionalism(
    content: string,
    tone?: string
  ): BusinessValidationResult['professionalism'] {
    const issues: string[] = [];
    let score = 100;
    let professionalCount = 0;
    let unprofessionalCount = 0;
    let casualCount = 0;

    const lowerContent = content.toLowerCase();

    // Check for professional language
    for (const term of this.PROFESSIONALISM_INDICATORS.professional) {
      if (lowerContent.includes(term)) {
        professionalCount++;
      }
    }

    // Check for unprofessional language
    for (const term of this.PROFESSIONALISM_INDICATORS.unprofessional) {
      if (lowerContent.includes(term)) {
        unprofessionalCount++;
        issues.push(`Uprofesjonelt språk: "${term}"`);
        score -= 20;
      }
    }

    // Check for casual language
    for (const term of this.PROFESSIONALISM_INDICATORS.casual) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(lowerContent)) {
        casualCount++;
        if (tone !== 'casual' && tone !== 'friendly') {
          issues.push(`For uformelt språk: "${term}"`);
          score -= 5;
        }
      }
    }

    // Determine professionalism level
    let level: 'high' | 'medium' | 'low';
    if (unprofessionalCount > 0) {
      level = 'low';
    } else if (professionalCount > 3 && casualCount < 2) {
      level = 'high';
    } else if (casualCount > 5) {
      level = 'low';
    } else {
      level = 'medium';
    }

    // Add issues based on expectations
    if (level === 'low' && tone === 'professional') {
      issues.push('Profesjonalitetsnivået matcher ikke forventet tone');
      score -= 10;
    }

    if (professionalCount === 0) {
      issues.push('Mangler profesjonelle språkmarkører');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      level,
      issues
    };
  }

  /**
   * Check business terminology
   */
  private checkTerminology(
    content: string,
    industry?: string
  ): BusinessValidationResult['terminology'] {
    const suggestions: TerminologySuggestion[] = [];
    let anglicismsFound = 0;
    let score = 100;

    const lowerContent = content.toLowerCase();

    // Check for anglicisms
    for (const [english, norwegian] of Object.entries(this.TERMINOLOGY_MAP.anglicisms)) {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      
      if (matches) {
        anglicismsFound += matches.length;
        suggestions.push({
          original: english,
          suggested: norwegian,
          reason: 'Foretrekk norsk terminologi fremfor anglisisme',
          impact: 'medium',
          category: 'anglicism'
        });
        score -= 5;
      }
    }

    // Check for business jargon
    for (const [jargon, replacement] of Object.entries(this.TERMINOLOGY_MAP.jargon)) {
      if (lowerContent.includes(jargon)) {
        suggestions.push({
          original: jargon,
          suggested: replacement,
          reason: 'Unngå overflødig forretningssjargong',
          impact: 'low',
          category: 'jargon'
        });
        score -= 3;
      }
    }

    // Check industry-specific terminology if applicable
    if (industry && this.INDUSTRY_TERMS[industry.toLowerCase()]) {
      const expectedTerms = this.INDUSTRY_TERMS[industry.toLowerCase()];
      const hasIndustryTerms = expectedTerms.some(term => 
        lowerContent.includes(term.toLowerCase())
      );
      
      if (!hasIndustryTerms && content.length > 200) {
        suggestions.push({
          original: 'generisk språk',
          suggested: 'bransjespesifikk terminologi',
          reason: `Inkluder relevante termer for ${industry}-bransjen`,
          impact: 'medium',
          category: 'technical'
        });
        score -= 10;
      }
    }

    // Sort suggestions by impact
    suggestions.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });

    return {
      score: Math.max(0, score),
      anglicismsFound,
      suggestions: suggestions.slice(0, 15) // Limit to top 15
    };
  }

  /**
   * Check credibility markers
   */
  private checkCredibility(content: string): BusinessValidationResult['credibility'] {
    const improvements: string[] = [];
    let score = 70; // Base score
    const lowerContent = content.toLowerCase();

    // Check for evidence markers
    const hasEvidence = this.CREDIBILITY_MARKERS.evidence.some(marker => 
      lowerContent.includes(marker)
    );
    if (hasEvidence) {
      score += 10;
    } else {
      improvements.push('Legg til kildehenvisninger eller bevis');
    }

    // Check for sources
    const hasReferences = this.CREDIBILITY_MARKERS.sources.some(source => 
      lowerContent.includes(source)
    );
    if (hasReferences) {
      score += 10;
    } else {
      improvements.push('Referer til forskning, studier eller rapporter');
    }

    // Check for numbers/statistics
    const hasNumbers = /\d+\s*(%|prosent|kr|mill|mrd)/i.test(content);
    if (hasNumbers) {
      score += 10;
    } else {
      improvements.push('Inkluder konkrete tall og statistikk');
    }

    // Penalize vague language
    const vagueCount = this.CREDIBILITY_MARKERS.vague.filter(vague => 
      lowerContent.includes(vague)
    ).length;
    if (vagueCount > 0) {
      score -= vagueCount * 5;
      improvements.push('Unngå vage formuleringer og generaliseringer');
    }

    // Penalize absolute claims without evidence
    const absoluteCount = this.CREDIBILITY_MARKERS.absolute.filter(absolute => 
      lowerContent.includes(absolute)
    ).length;
    if (absoluteCount > 0 && !hasEvidence) {
      score -= absoluteCount * 10;
      improvements.push('Moderer absolutte påstander eller underbygg med fakta');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      hasEvidence,
      hasNumbers,
      hasReferences,
      improvements
    };
  }

  /**
   * Check persuasiveness
   */
  private checkPersuasiveness(
    content: string,
    contentType: string
  ): BusinessValidationResult['persuasiveness'] {
    const lowerContent = content.toLowerCase();
    let score = 50; // Base score

    // Check for value proposition
    const valueKeywords = ['fordel', 'nytte', 'verdi', 'gevinst', 'resultat'];
    const hasValueProposition = valueKeywords.some(keyword => 
      lowerContent.includes(keyword)
    );
    if (hasValueProposition) {
      score += 20;
    }

    // Check for benefits
    const benefitKeywords = ['sparer', 'øker', 'forbedrer', 'effektiviserer', 'forenkler'];
    const hasBenefits = benefitKeywords.some(keyword => 
      lowerContent.includes(keyword)
    );
    if (hasBenefits) {
      score += 15;
    }

    // Check for call to action
    const ctaKeywords = [
      'kontakt', 'bestill', 'prøv', 'registrer',
      'last ned', 'les mer', 'finn ut', 'kom i gang'
    ];
    const hasCallToAction = ctaKeywords.some(keyword => 
      lowerContent.includes(keyword)
    );
    if (hasCallToAction) {
      score += 15;
    }

    // Content type specific adjustments
    if (contentType === 'email' || contentType === 'salesCopy') {
      if (!hasCallToAction) {
        score -= 20; // CTA is critical for these types
      }
    }

    return {
      score: Math.min(100, score),
      hasValueProposition,
      hasBenefits,
      hasCallToAction
    };
  }

  /**
   * Check content structure
   */
  private checkStructure(
    content: string,
    contentType: string
  ): BusinessValidationResult['structure'] {
    const improvements: string[] = [];
    let score = 100;

    // Split into paragraphs
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for introduction (first paragraph/sentences)
    const hasIntroduction = paragraphs.length > 0 && 
      paragraphs[0].length > 50 &&
      paragraphs[0].includes('?') || paragraphs[0].match(/^[A-ZÆØÅ]/);
    
    if (!hasIntroduction && content.length > 200) {
      improvements.push('Legg til en klar introduksjon');
      score -= 15;
    }

    // Check for conclusion (last paragraph)
    const hasConclusion = paragraphs.length > 1 && 
      (paragraphs[paragraphs.length - 1].includes('oppsummer') ||
       paragraphs[paragraphs.length - 1].includes('konklusjon') ||
       paragraphs[paragraphs.length - 1].includes('avslutningsvis') ||
       paragraphs[paragraphs.length - 1].length > 50);
    
    if (!hasConclusion && contentType !== 'socialMedia' && content.length > 300) {
      improvements.push('Avslutt med en tydelig konklusjon');
      score -= 15;
    }

    // Check logical flow (paragraphs should have reasonable length)
    const avgParagraphLength = content.length / Math.max(paragraphs.length, 1);
    const isLogical = avgParagraphLength > 100 && avgParagraphLength < 500;
    
    if (!isLogical) {
      if (avgParagraphLength < 100) {
        improvements.push('Utvid avsnittene for bedre dybde');
        score -= 10;
      } else {
        improvements.push('Del opp lange avsnitt for bedre lesbarhet');
        score -= 10;
      }
    }

    // Check for structure markers
    const structureMarkers = [
      'først', 'deretter', 'videre', 'dessuten',
      'for det første', 'for det andre', 'avslutningsvis'
    ];
    const hasStructureMarkers = structureMarkers.some(marker => 
      content.toLowerCase().includes(marker)
    );
    
    if (!hasStructureMarkers && paragraphs.length > 3) {
      improvements.push('Bruk strukturmarkører for bedre flyt');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      hasIntroduction,
      hasConclusion,
      isLogical,
      improvements
    };
  }

  /**
   * Calculate overall business score
   */
  private calculateOverallScore(
    professionalismScore: number,
    terminologyScore: number,
    credibilityScore: number,
    persuasivenessScore: number,
    structureScore: number
  ): number {
    // Weighted average
    const weightedScore = 
      professionalismScore * 0.25 +
      terminologyScore * 0.20 +
      credibilityScore * 0.25 +
      persuasivenessScore * 0.15 +
      structureScore * 0.15;

    return Math.round(weightedScore);
  }

  /**
   * Quick business check for real-time feedback
   */
  async quickCheck(content: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const lowerContent = content.toLowerCase();

    // Quick professionalism check
    for (const term of this.PROFESSIONALISM_INDICATORS.unprofessional) {
      if (lowerContent.includes(term)) {
        issues.push(`Uprofesjonelt: "${term}"`);
        suggestions.push('Bruk mer profesjonelt språk');
        break;
      }
    }

    // Quick anglicism check
    const commonAnglicisms = ['meeting', 'deadline', 'feedback', 'workshop'];
    for (const anglicism of commonAnglicisms) {
      if (lowerContent.includes(anglicism)) {
        const norwegian = this.TERMINOLOGY_MAP.anglicisms[anglicism];
        suggestions.push(`Bruk "${norwegian}" i stedet for "${anglicism}"`);
        break;
      }
    }

    // Quick credibility check
    const hasNumbers = /\d+/.test(content);
    if (!hasNumbers && content.length > 100) {
      issues.push('Mangler konkrete tall');
    }

    // Calculate quick score
    const score = Math.max(0, 100 - (issues.length * 25) - (suggestions.length * 10));

    return { score, issues, suggestions };
  }
}