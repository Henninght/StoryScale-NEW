/**
 * Cultural Enhancer for Norwegian Business Context
 * Adapts research insights for Norwegian cultural and business environment
 */

import { SupportedLanguage, CulturalContext } from '../types/language-aware-request';
import { Insight, BusinessMetric, NorwegianTerm } from './content-analyzer';

export interface CulturalEnhancement {
  originalContent: string;
  enhancedContent: string;
  adaptations: CulturalAdaptation[];
  norwegianContext: NorwegianBusinessContext;
  culturalNotes: CulturalNote[];
  localizedMetrics: LocalizedMetric[];
  industryContext: NorwegianIndustryContext;
  recommendations: string[];
}

export interface CulturalAdaptation {
  type: AdaptationType;
  original: string;
  adapted: string;
  reason: string;
  confidence: number;
}

export type AdaptationType = 
  | 'terminology'
  | 'business_practice'
  | 'regulatory_context'
  | 'cultural_reference'
  | 'measurement_unit'
  | 'date_format'
  | 'currency'
  | 'formal_tone'
  | 'local_example';

export interface NorwegianBusinessContext {
  marketSize: 'small' | 'medium' | 'large';
  businessCulture: BusinessCultureTrait[];
  regulatoryEnvironment: RegulatoryAspect[];
  economicFactors: EconomicFactor[];
  socialValues: string[];
  communicationStyle: CommunicationStyle;
}

export interface BusinessCultureTrait {
  trait: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface RegulatoryAspect {
  area: string;
  norwegianSpecific: boolean;
  euCompliant: boolean;
  description: string;
}

export interface EconomicFactor {
  factor: string;
  value: string | number;
  trend: 'increasing' | 'stable' | 'decreasing';
  relevance: number;
}

export interface CulturalNote {
  topic: string;
  note: string;
  importance: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface LocalizedMetric {
  metric: string;
  globalValue: string | number;
  norwegianValue: string | number;
  comparison: string;
  context: string;
}

export interface NorwegianIndustryContext {
  industry: string;
  keyPlayers: string[];
  marketCharacteristics: string[];
  challenges: string[];
  opportunities: string[];
  regulations: string[];
}

export interface CommunicationStyle {
  formality: 'formal' | 'neutral' | 'informal';
  directness: 'direct' | 'moderate' | 'indirect';
  relationshipFocus: 'high' | 'medium' | 'low';
  consensusOriented: boolean;
  egalitarian: boolean;
}

/**
 * Norwegian business culture characteristics
 */
const NORWEGIAN_BUSINESS_CULTURE: BusinessCultureTrait[] = [
  {
    trait: 'Flat organizational structure',
    description: 'Norwegian companies typically have fewer hierarchical levels',
    impact: 'high'
  },
  {
    trait: 'Consensus-driven decision making',
    description: 'Decisions often involve consultation with all stakeholders',
    impact: 'high'
  },
  {
    trait: 'Work-life balance',
    description: 'Strong emphasis on maintaining healthy work-life balance',
    impact: 'medium'
  },
  {
    trait: 'Environmental consciousness',
    description: 'High priority on sustainability and environmental responsibility',
    impact: 'high'
  },
  {
    trait: 'Gender equality',
    description: 'Strong focus on gender equality in the workplace',
    impact: 'high'
  },
  {
    trait: 'Direct communication',
    description: 'Preference for straightforward, honest communication',
    impact: 'medium'
  },
  {
    trait: 'Punctuality',
    description: 'Being on time is highly valued in business settings',
    impact: 'medium'
  },
  {
    trait: 'Informal dress code',
    description: 'Business casual is common even in corporate settings',
    impact: 'low'
  }
];

/**
 * Industry-specific Norwegian contexts
 */
const NORWEGIAN_INDUSTRIES = new Map<string, NorwegianIndustryContext>([
  ['oil-gas', {
    industry: 'Oil & Gas',
    keyPlayers: ['Equinor', 'Aker BP', 'Vår Energi', 'ConocoPhillips Norge'],
    marketCharacteristics: [
      'Dominated by state-owned Equinor',
      'Strong focus on offshore technology',
      'Transitioning to renewable energy',
      'High environmental standards'
    ],
    challenges: [
      'Energy transition',
      'Maintaining competitiveness',
      'Aging infrastructure',
      'Environmental regulations'
    ],
    opportunities: [
      'Carbon capture and storage',
      'Offshore wind development',
      'Hydrogen production',
      'Digital transformation'
    ],
    regulations: [
      'Petroleum Act',
      'Environmental regulations',
      'Safety standards (PSA)',
      'Tax regime'
    ]
  }],
  ['maritime', {
    industry: 'Maritime & Shipping',
    keyPlayers: ['DNV', 'Wilhelmsen', 'Wallenius Wilhelmsen', 'Kongsberg Maritime'],
    marketCharacteristics: [
      'Global shipping hub',
      'Strong in offshore support vessels',
      'Leading in green shipping technology',
      'Complete maritime cluster'
    ],
    challenges: [
      'Green transition',
      'Global competition',
      'Digitalization needs',
      'Crew competence'
    ],
    opportunities: [
      'Autonomous vessels',
      'Green ammonia shipping',
      'Digital twin technology',
      'Arctic shipping'
    ],
    regulations: [
      'Norwegian Maritime Code',
      'IMO regulations',
      'Flag state requirements',
      'Environmental standards'
    ]
  }],
  ['seafood', {
    industry: 'Seafood & Aquaculture',
    keyPlayers: ['Mowi', 'Lerøy', 'SalMar', 'Grieg Seafood'],
    marketCharacteristics: [
      'World leader in salmon farming',
      'Export-oriented industry',
      'High-tech aquaculture',
      'Sustainability focus'
    ],
    challenges: [
      'Sea lice management',
      'Environmental impact',
      'Market access',
      'Feed sustainability'
    ],
    opportunities: [
      'Land-based farming',
      'Offshore aquaculture',
      'Alternative proteins',
      'Asian market growth'
    ],
    regulations: [
      'Aquaculture Act',
      'Food safety regulations',
      'Environmental permits',
      'Export requirements'
    ]
  }],
  ['technology', {
    industry: 'Technology & IT',
    keyPlayers: ['Telenor', 'Schibsted', 'Kahoot!', 'Opera', 'Cognite'],
    marketCharacteristics: [
      'Strong in telecom and media tech',
      'Growing startup ecosystem',
      'Focus on B2B solutions',
      'Educational technology leader'
    ],
    challenges: [
      'Access to talent',
      'Scale-up funding',
      'International competition',
      'Market size limitations'
    ],
    opportunities: [
      'AI and machine learning',
      'Green tech solutions',
      'Digital government services',
      'EdTech expansion'
    ],
    regulations: [
      'GDPR compliance',
      'Electronic Communications Act',
      'Data localization requirements',
      'Accessibility standards'
    ]
  }],
  ['renewable-energy', {
    industry: 'Renewable Energy',
    keyPlayers: ['Statkraft', 'Scatec', 'NBT', 'Aker Horizons'],
    marketCharacteristics: [
      'Hydropower dominance',
      'Growing wind sector',
      'Battery technology development',
      'Green hydrogen initiatives'
    ],
    challenges: [
      'Grid capacity',
      'Public acceptance',
      'Investment needs',
      'Weather dependency'
    ],
    opportunities: [
      'Offshore wind expansion',
      'Energy storage solutions',
      'Green hydrogen export',
      'Data center power supply'
    ],
    regulations: [
      'Energy Act',
      'Environmental assessments',
      'Grid connection rules',
      'Subsidy schemes'
    ]
  }]
]);

/**
 * Norwegian-specific adaptations
 */
const CULTURAL_ADAPTATIONS = new Map<string, string>([
  // Business terms
  ['CEO', 'administrerende direktør'],
  ['board of directors', 'styret'],
  ['shareholders', 'aksjonærer'],
  ['revenue', 'omsetning'],
  ['profit', 'overskudd'],
  ['market share', 'markedsandel'],
  
  // Regulatory terms
  ['compliance', 'etterlevelse'],
  ['regulation', 'forskrift'],
  ['permit', 'tillatelse'],
  ['audit', 'revisjon'],
  
  // Cultural references
  ['work-life balance', 'balanse mellom jobb og fritid'],
  ['corporate social responsibility', 'samfunnsansvar'],
  ['sustainability', 'bærekraft'],
  ['innovation', 'innovasjon'],
  
  // Measurement conversions
  ['million dollars', 'millioner kroner'],
  ['billion dollars', 'milliarder kroner'],
  ['square feet', 'kvadratmeter'],
  ['miles', 'kilometer']
]);

export class CulturalEnhancer {
  private culturalContext: CulturalContext | undefined;
  private language: SupportedLanguage;
  private industryContexts: Map<string, NorwegianIndustryContext>;
  
  constructor(language: SupportedLanguage, culturalContext?: CulturalContext) {
    this.language = language;
    this.culturalContext = culturalContext;
    this.industryContexts = NORWEGIAN_INDUSTRIES;
  }
  
  /**
   * Enhance content with Norwegian cultural context
   */
  public async enhanceContent(
    content: string,
    insights: Insight[],
    metrics: BusinessMetric[],
    norwegianTerms: NorwegianTerm[]
  ): Promise<CulturalEnhancement> {
    // Skip enhancement for non-Norwegian content
    if (this.language !== 'no' && !this.culturalContext) {
      return this.createMinimalEnhancement(content);
    }
    
    // Perform cultural adaptations
    const adaptations = this.performAdaptations(content);
    
    // Build Norwegian business context
    const norwegianContext = this.buildNorwegianContext();
    
    // Generate cultural notes
    const culturalNotes = this.generateCulturalNotes(insights, metrics);
    
    // Localize metrics
    const localizedMetrics = this.localizeMetrics(metrics);
    
    // Get industry context if applicable
    const industryContext = this.getIndustryContext();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      insights,
      norwegianContext,
      industryContext
    );
    
    // Create enhanced content
    const enhancedContent = this.createEnhancedContent(
      content,
      adaptations,
      norwegianTerms
    );
    
    return {
      originalContent: content,
      enhancedContent,
      adaptations,
      norwegianContext,
      culturalNotes,
      localizedMetrics,
      industryContext,
      recommendations
    };
  }
  
  /**
   * Create minimal enhancement for non-Norwegian content
   */
  private createMinimalEnhancement(content: string): CulturalEnhancement {
    return {
      originalContent: content,
      enhancedContent: content,
      adaptations: [],
      norwegianContext: this.buildNorwegianContext(),
      culturalNotes: [],
      localizedMetrics: [],
      industryContext: {
        industry: 'General',
        keyPlayers: [],
        marketCharacteristics: [],
        challenges: [],
        opportunities: [],
        regulations: []
      },
      recommendations: []
    };
  }
  
  /**
   * Perform cultural adaptations
   */
  private performAdaptations(content: string): CulturalAdaptation[] {
    const adaptations: CulturalAdaptation[] = [];
    
    // Adapt terminology
    CULTURAL_ADAPTATIONS.forEach((norwegianTerm, englishTerm) => {
      if (content.toLowerCase().includes(englishTerm)) {
        adaptations.push({
          type: 'terminology',
          original: englishTerm,
          adapted: norwegianTerm,
          reason: 'Norwegian business terminology',
          confidence: 0.9
        });
      }
    });
    
    // Adapt currency references
    const currencyMatches = content.match(/\$[\d,]+\.?\d*\s*(million|billion)?/gi) || [];
    currencyMatches.forEach(match => {
      const nokValue = this.convertToNOK(match);
      adaptations.push({
        type: 'currency',
        original: match,
        adapted: nokValue,
        reason: 'Convert to Norwegian currency',
        confidence: 0.85
      });
    });
    
    // Adapt date formats
    const dateMatches = content.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
    dateMatches.forEach(match => {
      const norwegianDate = this.convertToNorwegianDate(match);
      adaptations.push({
        type: 'date_format',
        original: match,
        adapted: norwegianDate,
        reason: 'Norwegian date format (DD.MM.YYYY)',
        confidence: 1.0
      });
    });
    
    // Add local examples where appropriate
    if (content.includes('for example') || content.includes('such as')) {
      const localExample = this.suggestLocalExample(content);
      if (localExample) {
        adaptations.push({
          type: 'local_example',
          original: 'generic example',
          adapted: localExample,
          reason: 'Add Norwegian business example',
          confidence: 0.7
        });
      }
    }
    
    // Adapt formality level
    if (this.culturalContext?.formalityLevel) {
      const formalityAdaptation = this.adaptFormality(content);
      if (formalityAdaptation) {
        adaptations.push(formalityAdaptation);
      }
    }
    
    return adaptations;
  }
  
  /**
   * Build Norwegian business context
   */
  private buildNorwegianContext(): NorwegianBusinessContext {
    const marketSize = this.determineMarketSize();
    const communicationStyle = this.determineCommunicationStyle();
    
    return {
      marketSize,
      businessCulture: NORWEGIAN_BUSINESS_CULTURE,
      regulatoryEnvironment: this.getNorwegianRegulations(),
      economicFactors: this.getNorwegianEconomicFactors(),
      socialValues: [
        'Equality (likestilling)',
        'Trust (tillit)',
        'Transparency (åpenhet)',
        'Environmental responsibility (miljøansvar)',
        'Work-life balance',
        'Consensus building',
        'Innovation',
        'Social welfare'
      ],
      communicationStyle
    };
  }
  
  /**
   * Determine market size based on context
   */
  private determineMarketSize(): 'small' | 'medium' | 'large' {
    if (!this.culturalContext) return 'medium';
    
    switch (this.culturalContext.market) {
      case 'norway':
        return 'small'; // 5.5 million population
      case 'nordic':
        return 'medium'; // ~27 million combined
      case 'international':
        return 'large';
      default:
        return 'medium';
    }
  }
  
  /**
   * Determine communication style
   */
  private determineCommunicationStyle(): CommunicationStyle {
    const formalityLevel = this.culturalContext?.formalityLevel || 'neutral';
    
    return {
      formality: formalityLevel,
      directness: 'direct', // Norwegian culture values directness
      relationshipFocus: 'medium',
      consensusOriented: true,
      egalitarian: true
    };
  }
  
  /**
   * Get Norwegian regulations
   */
  private getNorwegianRegulations(): RegulatoryAspect[] {
    return [
      {
        area: 'Data Protection',
        norwegianSpecific: false,
        euCompliant: true,
        description: 'GDPR compliance required'
      },
      {
        area: 'Labor Law',
        norwegianSpecific: true,
        euCompliant: false,
        description: 'Strong worker protections and union rights'
      },
      {
        area: 'Environmental',
        norwegianSpecific: true,
        euCompliant: true,
        description: 'Strict environmental regulations'
      },
      {
        area: 'Corporate Governance',
        norwegianSpecific: true,
        euCompliant: true,
        description: 'Gender quota requirements for boards'
      },
      {
        area: 'Taxation',
        norwegianSpecific: true,
        euCompliant: false,
        description: 'High tax rates with strong social benefits'
      }
    ];
  }
  
  /**
   * Get Norwegian economic factors
   */
  private getNorwegianEconomicFactors(): EconomicFactor[] {
    return [
      {
        factor: 'GDP per capita',
        value: '$89,000',
        trend: 'stable',
        relevance: 0.9
      },
      {
        factor: 'Unemployment rate',
        value: '3.5%',
        trend: 'stable',
        relevance: 0.7
      },
      {
        factor: 'Oil fund (Government Pension Fund)',
        value: '$1.4 trillion',
        trend: 'increasing',
        relevance: 0.8
      },
      {
        factor: 'Interest rate',
        value: '4.5%',
        trend: 'increasing',
        relevance: 0.9
      },
      {
        factor: 'Inflation',
        value: '4.8%',
        trend: 'decreasing',
        relevance: 0.8
      }
    ];
  }
  
  /**
   * Generate cultural notes
   */
  private generateCulturalNotes(
    insights: Insight[],
    metrics: BusinessMetric[]
  ): CulturalNote[] {
    const notes: CulturalNote[] = [];
    
    // Add notes based on insights
    insights.forEach(insight => {
      if (insight.category === 'market_trend') {
        notes.push({
          topic: 'Market Dynamics',
          note: 'Norwegian market trends often differ from global patterns due to unique economic structure',
          importance: 'medium',
          actionable: true
        });
      }
      
      if (insight.category === 'regulatory_update') {
        notes.push({
          topic: 'Regulatory Environment',
          note: 'Norwegian regulations often exceed EU standards, particularly in environmental and labor areas',
          importance: 'high',
          actionable: true
        });
      }
    });
    
    // Add notes based on metrics
    const hasGrowthMetrics = metrics.some(m => m.metric.includes('Growth') || m.metric.includes('Vekst'));
    if (hasGrowthMetrics) {
      notes.push({
        topic: 'Growth Expectations',
        note: 'Norwegian businesses often prioritize sustainable growth over rapid expansion',
        importance: 'medium',
        actionable: false
      });
    }
    
    // Add general cultural notes
    if (this.culturalContext?.businessType === 'b2b') {
      notes.push({
        topic: 'B2B Relationships',
        note: 'Building trust through personal relationships is crucial in Norwegian B2B',
        importance: 'high',
        actionable: true
      });
    }
    
    // Add industry-specific notes
    if (this.culturalContext?.industry) {
      const industryNote = this.getIndustrySpecificNote(this.culturalContext.industry);
      if (industryNote) {
        notes.push(industryNote);
      }
    }
    
    return notes;
  }
  
  /**
   * Get industry-specific cultural note
   */
  private getIndustrySpecificNote(industry: string): CulturalNote | null {
    const industryNotes: Record<string, CulturalNote> = {
      'technology': {
        topic: 'Tech Industry',
        note: 'Norwegian tech sector emphasizes work-life balance and flat hierarchies',
        importance: 'medium',
        actionable: true
      },
      'energy': {
        topic: 'Energy Sector',
        note: 'Strong focus on transition from oil to renewable energy',
        importance: 'high',
        actionable: true
      },
      'maritime': {
        topic: 'Maritime Industry',
        note: 'Norway leads in green shipping technology and autonomous vessels',
        importance: 'high',
        actionable: true
      },
      'finance': {
        topic: 'Financial Services',
        note: 'Conservative approach with strong regulatory oversight',
        importance: 'medium',
        actionable: false
      }
    };
    
    return industryNotes[industry.toLowerCase()] || null;
  }
  
  /**
   * Localize metrics for Norwegian context
   */
  private localizeMetrics(metrics: BusinessMetric[]): LocalizedMetric[] {
    return metrics.map(metric => {
      const localized: LocalizedMetric = {
        metric: metric.metric,
        globalValue: metric.value,
        norwegianValue: metric.value,
        comparison: '',
        context: ''
      };
      
      // Convert monetary values
      if (metric.unit && ['USD', 'EUR', '$', '€'].includes(metric.unit)) {
        const nokValue = this.convertCurrencyToNOK(metric.value, metric.unit);
        localized.norwegianValue = nokValue;
        localized.comparison = `Approximately ${nokValue} NOK`;
        localized.context = 'Converted at current exchange rate';
      }
      
      // Add Norwegian market context
      if (metric.metric.includes('Growth') || metric.metric.includes('Vekst')) {
        const avgGrowth = 3.5; // Average Norwegian business growth
        const metricValue = typeof metric.value === 'number' ? metric.value : parseFloat(metric.value.toString());
        if (metricValue > avgGrowth) {
          localized.comparison = `Above Norwegian average (${avgGrowth}%)`;
        } else {
          localized.comparison = `Below Norwegian average (${avgGrowth}%)`;
        }
        localized.context = 'Compared to Norwegian business sector average';
      }
      
      // Add market share context
      if (metric.metric.includes('Market Share') || metric.metric.includes('Markedsandel')) {
        localized.context = `In Norwegian market of ${this.determineMarketSize()} size`;
      }
      
      return localized;
    });
  }
  
  /**
   * Get industry context
   */
  private getIndustryContext(): NorwegianIndustryContext {
    if (!this.culturalContext?.industry) {
      return {
        industry: 'General Business',
        keyPlayers: [],
        marketCharacteristics: ['Small domestic market', 'Export-oriented', 'High purchasing power'],
        challenges: ['Market size', 'High costs', 'Competition from imports'],
        opportunities: ['Innovation', 'Sustainability', 'Digital transformation'],
        regulations: ['GDPR', 'Labor laws', 'Environmental standards']
      };
    }
    
    // Map industry to context
    const industryKey = this.mapToIndustryKey(this.culturalContext.industry);
    return this.industryContexts.get(industryKey) || this.getIndustryContext();
  }
  
  /**
   * Map industry string to industry key
   */
  private mapToIndustryKey(industry: string): string {
    const mappings: Record<string, string> = {
      'oil': 'oil-gas',
      'gas': 'oil-gas',
      'energy': 'oil-gas',
      'shipping': 'maritime',
      'marine': 'maritime',
      'fish': 'seafood',
      'salmon': 'seafood',
      'aquaculture': 'seafood',
      'tech': 'technology',
      'it': 'technology',
      'software': 'technology',
      'renewable': 'renewable-energy',
      'wind': 'renewable-energy',
      'solar': 'renewable-energy'
    };
    
    const lower = industry.toLowerCase();
    for (const [key, value] of Object.entries(mappings)) {
      if (lower.includes(key)) {
        return value;
      }
    }
    
    return industry.toLowerCase();
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    insights: Insight[],
    norwegianContext: NorwegianBusinessContext,
    industryContext: NorwegianIndustryContext
  ): string[] {
    const recommendations: string[] = [];
    
    // Business culture recommendations
    if (norwegianContext.businessCulture.some(t => t.trait.includes('consensus'))) {
      recommendations.push('Involve stakeholders early in decision-making processes');
    }
    
    if (norwegianContext.businessCulture.some(t => t.trait.includes('environmental'))) {
      recommendations.push('Emphasize sustainability and environmental responsibility');
    }
    
    // Communication recommendations
    if (norwegianContext.communicationStyle.directness === 'direct') {
      recommendations.push('Use clear, direct communication without excessive formality');
    }
    
    // Market-specific recommendations
    if (norwegianContext.marketSize === 'small') {
      recommendations.push('Consider expansion to other Nordic markets for growth');
    }
    
    // Industry-specific recommendations
    if (industryContext.opportunities.length > 0) {
      recommendations.push(`Focus on key opportunities: ${industryContext.opportunities.slice(0, 2).join(', ')}`);
    }
    
    if (industryContext.challenges.length > 0) {
      recommendations.push(`Address main challenges: ${industryContext.challenges[0]}`);
    }
    
    // Regulatory recommendations
    const relevantRegulations = norwegianContext.regulatoryEnvironment
      .filter(r => r.norwegianSpecific)
      .slice(0, 2);
    
    if (relevantRegulations.length > 0) {
      recommendations.push(`Ensure compliance with Norwegian-specific regulations: ${relevantRegulations.map(r => r.area).join(', ')}`);
    }
    
    return recommendations;
  }
  
  /**
   * Create enhanced content
   */
  private createEnhancedContent(
    content: string,
    adaptations: CulturalAdaptation[],
    norwegianTerms: NorwegianTerm[]
  ): string {
    let enhanced = content;
    
    // Apply adaptations
    adaptations.forEach(adaptation => {
      if (adaptation.confidence > 0.7) {
        enhanced = enhanced.replace(
          new RegExp(adaptation.original, 'gi'),
          `${adaptation.adapted} (${adaptation.original})`
        );
      }
    });
    
    // Add Norwegian term explanations
    norwegianTerms.forEach(term => {
      if (term.businessRelevance) {
        const explanation = ` [${term.term}: ${term.translation}]`;
        const regex = new RegExp(`\\b${term.term}\\b(?![:\\]])`, 'gi');
        enhanced = enhanced.replace(regex, `${term.term}${explanation}`);
      }
    });
    
    // Add cultural context markers
    if (this.culturalContext?.market === 'norway') {
      enhanced = `[Norwegian Market Context]\n${enhanced}`;
    }
    
    return enhanced;
  }
  
  /**
   * Convert currency to NOK
   */
  private convertToNOK(amount: string): string {
    const exchangeRates: Record<string, number> = {
      'USD': 10.5,
      'EUR': 11.5,
      'GBP': 13.0
    };
    
    const match = amount.match(/\$([\d,]+\.?\d*)\s*(million|billion)?/i);
    if (!match) return amount;
    
    const value = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2]?.toLowerCase() === 'billion' ? 1000000000 : 
                      match[2]?.toLowerCase() === 'million' ? 1000000 : 1;
    
    const nokValue = value * multiplier * exchangeRates.USD;
    
    if (nokValue >= 1000000000) {
      return `${(nokValue / 1000000000).toFixed(1)} milliarder NOK`;
    } else if (nokValue >= 1000000) {
      return `${(nokValue / 1000000).toFixed(1)} millioner NOK`;
    } else {
      return `${nokValue.toFixed(0)} NOK`;
    }
  }
  
  /**
   * Convert currency value to NOK
   */
  private convertCurrencyToNOK(value: string | number, unit: string): string {
    const exchangeRates: Record<string, number> = {
      'USD': 10.5,
      '$': 10.5,
      'EUR': 11.5,
      '€': 11.5,
      'GBP': 13.0,
      '£': 13.0
    };
    
    const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
    const rate = exchangeRates[unit] || 1;
    const nokValue = numValue * rate;
    
    return nokValue.toFixed(2);
  }
  
  /**
   * Convert date to Norwegian format
   */
  private convertToNorwegianDate(date: string): string {
    const parts = date.split('/');
    if (parts.length !== 3) return date;
    
    // Assuming MM/DD/YYYY format
    const [month, day, year] = parts;
    return `${day}.${month}.${year}`;
  }
  
  /**
   * Suggest local example
   */
  private suggestLocalExample(content: string): string | null {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('technology company')) {
      return 'like Schibsted or Kahoot!';
    }
    
    if (contentLower.includes('oil company')) {
      return 'such as Equinor or Aker BP';
    }
    
    if (contentLower.includes('bank')) {
      return 'like DNB or SpareBank 1';
    }
    
    if (contentLower.includes('startup')) {
      return 'similar to Oda or Gelato';
    }
    
    return null;
  }
  
  /**
   * Adapt formality level
   */
  private adaptFormality(content: string): CulturalAdaptation | null {
    if (this.culturalContext?.formalityLevel === 'casual') {
      return {
        type: 'formal_tone',
        original: 'formal tone',
        adapted: 'informal, direct tone',
        reason: 'Norwegian business culture prefers less formal communication',
        confidence: 0.8
      };
    }
    
    if (this.culturalContext?.formalityLevel === 'formal') {
      return {
        type: 'formal_tone',
        original: 'casual tone',
        adapted: 'professional but not overly formal tone',
        reason: 'Balance between professionalism and Norwegian directness',
        confidence: 0.8
      };
    }
    
    return null;
  }
}