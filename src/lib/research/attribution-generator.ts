/**
 * Attribution Generator for Norwegian Citations
 * Generates proper source attributions in Norwegian and English
 */

import { SupportedLanguage } from '../types/language-aware-request';
import { NorwegianSource } from './norwegian-sources';
import { CitableQuote } from './content-analyzer';

export interface Attribution {
  text: string;
  format: AttributionFormat;
  language: SupportedLanguage;
  source: SourceReference;
  style: CitationStyle;
  confidence: number;
}

export type AttributionFormat = 
  | 'inline'
  | 'parenthetical'
  | 'footnote'
  | 'endnote'
  | 'hyperlink';

export type CitationStyle = 
  | 'journalistic'
  | 'academic'
  | 'business'
  | 'casual'
  | 'formal';

export interface SourceReference {
  name: string;
  url?: string;
  author?: string;
  date?: string;
  title?: string;
  type: SourceType;
  credibility: number;
}

export type SourceType = 
  | 'news_article'
  | 'research_paper'
  | 'company_report'
  | 'government_document'
  | 'expert_opinion'
  | 'press_release'
  | 'social_media'
  | 'industry_report';

export interface AttributionOptions {
  style: CitationStyle;
  format: AttributionFormat;
  includeDate: boolean;
  includeAuthor: boolean;
  includeUrl: boolean;
  useHyperlinks: boolean;
  language: SupportedLanguage;
}

/**
 * Norwegian attribution phrases
 */
const NORWEGIAN_ATTRIBUTION_PHRASES = {
  according_to: [
    'Ifølge',
    'I henhold til',
    'Basert på',
    'Som rapportert av',
    'I følge'
  ],
  reports: [
    'rapporterer',
    'melder',
    'opplyser',
    'informerer',
    'skriver'
  ],
  states: [
    'uttaler',
    'sier',
    'hevder',
    'påpeker',
    'fremhever'
  ],
  shows: [
    'viser',
    'indikerer',
    'demonstrerer',
    'avslører',
    'dokumenterer'
  ],
  research: [
    'Forskning fra',
    'En studie fra',
    'Undersøkelse gjennomført av',
    'Analyse fra',
    'Data fra'
  ],
  date_prefix: [
    'publisert',
    'utgitt',
    'datert',
    'fra',
    'oppdatert'
  ]
};

/**
 * English attribution phrases
 */
const ENGLISH_ATTRIBUTION_PHRASES = {
  according_to: [
    'According to',
    'As reported by',
    'Based on',
    'As stated by',
    'Per'
  ],
  reports: [
    'reports',
    'states',
    'indicates',
    'reveals',
    'notes'
  ],
  states: [
    'states',
    'says',
    'claims',
    'argues',
    'emphasizes'
  ],
  shows: [
    'shows',
    'demonstrates',
    'reveals',
    'indicates',
    'suggests'
  ],
  research: [
    'Research from',
    'A study by',
    'Analysis from',
    'Data from',
    'According to research by'
  ],
  date_prefix: [
    'published',
    'released',
    'dated',
    'from',
    'updated'
  ]
};

/**
 * Source type credibility scores
 */
const SOURCE_CREDIBILITY: Record<SourceType, number> = {
  'government_document': 0.95,
  'research_paper': 0.9,
  'industry_report': 0.85,
  'company_report': 0.8,
  'news_article': 0.75,
  'expert_opinion': 0.7,
  'press_release': 0.6,
  'social_media': 0.4
};

export class AttributionGenerator {
  private defaultOptions: AttributionOptions;
  private norwegianPhrases = NORWEGIAN_ATTRIBUTION_PHRASES;
  private englishPhrases = ENGLISH_ATTRIBUTION_PHRASES;
  
  constructor(defaultOptions?: Partial<AttributionOptions>) {
    this.defaultOptions = {
      style: 'journalistic',
      format: 'inline',
      includeDate: true,
      includeAuthor: true,
      includeUrl: false,
      useHyperlinks: false,
      language: 'no',
      ...defaultOptions
    };
  }
  
  /**
   * Generate attribution for a source
   */
  public generateAttribution(
    source: NorwegianSource | SourceReference,
    quote?: string,
    options?: Partial<AttributionOptions>
  ): Attribution {
    const opts = { ...this.defaultOptions, ...options };
    const sourceRef = this.normalizeSource(source);
    
    // Select appropriate generation method
    let attributionText: string;
    switch (opts.format) {
      case 'inline':
        attributionText = this.generateInlineAttribution(sourceRef, quote, opts);
        break;
      case 'parenthetical':
        attributionText = this.generateParentheticalAttribution(sourceRef, opts);
        break;
      case 'footnote':
        attributionText = this.generateFootnoteAttribution(sourceRef, opts);
        break;
      case 'hyperlink':
        attributionText = this.generateHyperlinkAttribution(sourceRef, opts);
        break;
      default:
        attributionText = this.generateInlineAttribution(sourceRef, quote, opts);
    }
    
    return {
      text: attributionText,
      format: opts.format,
      language: opts.language,
      source: sourceRef,
      style: opts.style,
      confidence: this.calculateConfidence(sourceRef, opts)
    };
  }
  
  /**
   * Generate inline attribution
   */
  private generateInlineAttribution(
    source: SourceReference,
    quote?: string,
    options: AttributionOptions
  ): string {
    const phrases = options.language === 'no' ? this.norwegianPhrases : this.englishPhrases;
    
    // Select appropriate phrase based on style
    let introPhrase: string;
    if (options.style === 'formal' || options.style === 'academic') {
      introPhrase = phrases.according_to[0]; // Most formal option
    } else if (options.style === 'casual') {
      introPhrase = phrases.according_to[phrases.according_to.length - 1]; // More casual
    } else {
      // Journalistic or business - vary for readability
      introPhrase = this.selectVariedPhrase(phrases.according_to);
    }
    
    // Build attribution components
    const components: string[] = [];
    
    // Add intro phrase
    components.push(introPhrase);
    
    // Add source name
    components.push(source.name);
    
    // Add author if available and requested
    if (options.includeAuthor && source.author) {
      if (options.language === 'no') {
        components.push(`ved ${source.author}`);
      } else {
        components.push(`by ${source.author}`);
      }
    }
    
    // Add date if available and requested
    if (options.includeDate && source.date) {
      const datePhrase = options.language === 'no' 
        ? `(${phrases.date_prefix[0]} ${this.formatDate(source.date, options.language)})`
        : `(${phrases.date_prefix[0]} ${this.formatDate(source.date, options.language)})`;
      components.push(datePhrase);
    }
    
    // Add reporting verb if quote provided
    if (quote) {
      const verb = this.selectReportingVerb(source.type, options.language);
      components.push(verb);
    }
    
    // Join components
    let attribution = components.join(' ');
    
    // Add punctuation
    if (quote) {
      attribution += options.language === 'no' ? ': ' : ', ';
    } else {
      attribution += options.language === 'no' ? ',' : ',';
    }
    
    return attribution;
  }
  
  /**
   * Generate parenthetical attribution
   */
  private generateParentheticalAttribution(
    source: SourceReference,
    options: AttributionOptions
  ): string {
    const components: string[] = [];
    
    // Add source name (shortened if possible)
    const shortName = this.shortenSourceName(source.name);
    components.push(shortName);
    
    // Add year if available
    if (source.date) {
      const year = new Date(source.date).getFullYear();
      components.push(year.toString());
    }
    
    // Add page number if available (for academic style)
    if (options.style === 'academic' && source.title) {
      // This would need page number data
      // components.push('p. XX');
    }
    
    return `(${components.join(', ')})`;
  }
  
  /**
   * Generate footnote attribution
   */
  private generateFootnoteAttribution(
    source: SourceReference,
    options: AttributionOptions
  ): string {
    const components: string[] = [];
    
    // Author (if available)
    if (source.author) {
      components.push(source.author);
    }
    
    // Title (if available)
    if (source.title) {
      components.push(`"${source.title}"`);
    }
    
    // Source name
    components.push(source.name);
    
    // Date
    if (source.date) {
      components.push(this.formatDate(source.date, options.language));
    }
    
    // URL (if requested)
    if (options.includeUrl && source.url) {
      components.push(source.url);
    }
    
    return components.join(', ') + '.';
  }
  
  /**
   * Generate hyperlink attribution
   */
  private generateHyperlinkAttribution(
    source: SourceReference,
    options: AttributionOptions
  ): string {
    const linkText = source.title || source.name;
    
    if (options.useHyperlinks && source.url) {
      return `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    }
    
    return `[${linkText}](${source.url || '#'})`;
  }
  
  /**
   * Generate bulk attributions for multiple sources
   */
  public generateBulkAttributions(
    sources: Array<NorwegianSource | SourceReference>,
    options?: Partial<AttributionOptions>
  ): Attribution[] {
    return sources.map(source => this.generateAttribution(source, undefined, options));
  }
  
  /**
   * Generate attribution paragraph
   */
  public generateAttributionParagraph(
    sources: Array<{ source: NorwegianSource | SourceReference; quote?: string }>,
    options?: Partial<AttributionOptions>
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    const attributions: string[] = [];
    
    sources.forEach((item, index) => {
      const attribution = this.generateAttribution(item.source, item.quote, opts);
      
      if (item.quote) {
        attributions.push(`${attribution.text}"${item.quote}"`);
      } else {
        // For multiple sources without quotes, create a summary
        if (index === 0) {
          attributions.push(this.getMultiSourceIntro(opts.language));
        }
        attributions.push(attribution.text);
      }
    });
    
    return attributions.join(' ');
  }
  
  /**
   * Generate source list (bibliography style)
   */
  public generateSourceList(
    sources: Array<NorwegianSource | SourceReference>,
    options?: Partial<AttributionOptions>
  ): string[] {
    const opts = { ...this.defaultOptions, ...options };
    
    return sources.map((source, index) => {
      const sourceRef = this.normalizeSource(source);
      const number = index + 1;
      
      // Format based on style
      if (opts.style === 'academic') {
        return this.formatAcademicCitation(sourceRef, number, opts.language);
      } else if (opts.style === 'business') {
        return this.formatBusinessCitation(sourceRef, number, opts.language);
      } else {
        return this.formatJournalisticCitation(sourceRef, number, opts.language);
      }
    });
  }
  
  /**
   * Format academic citation
   */
  private formatAcademicCitation(
    source: SourceReference,
    number: number,
    language: SupportedLanguage
  ): string {
    const parts: string[] = [`[${number}]`];
    
    if (source.author) {
      parts.push(source.author);
    }
    
    if (source.date) {
      parts.push(`(${new Date(source.date).getFullYear()})`);
    }
    
    if (source.title) {
      parts.push(`"${source.title}"`);
    }
    
    parts.push(source.name);
    
    if (source.url) {
      if (language === 'no') {
        parts.push(`Tilgjengelig: ${source.url}`);
      } else {
        parts.push(`Available at: ${source.url}`);
      }
    }
    
    return parts.join('. ') + '.';
  }
  
  /**
   * Format business citation
   */
  private formatBusinessCitation(
    source: SourceReference,
    number: number,
    language: SupportedLanguage
  ): string {
    const parts: string[] = [`${number}.`];
    
    parts.push(source.name);
    
    if (source.title) {
      parts.push(`- ${source.title}`);
    }
    
    if (source.date) {
      parts.push(`(${this.formatDate(source.date, language)})`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Format journalistic citation
   */
  private formatJournalisticCitation(
    source: SourceReference,
    number: number,
    language: SupportedLanguage
  ): string {
    const parts: string[] = [`${number}.`];
    
    if (source.title) {
      parts.push(`"${source.title}"`);
    }
    
    parts.push(source.name);
    
    if (source.author) {
      const byText = language === 'no' ? 'av' : 'by';
      parts.push(`${byText} ${source.author}`);
    }
    
    if (source.date) {
      parts.push(`- ${this.formatDate(source.date, language)}`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Normalize source to SourceReference
   */
  private normalizeSource(source: NorwegianSource | SourceReference): SourceReference {
    if ('domain' in source && 'trustScore' in source) {
      // It's a NorwegianSource
      return {
        name: source.name,
        url: `https://${source.domain}`,
        type: this.mapCategoryToType(source.category),
        credibility: source.trustScore / 10
      };
    }
    
    // It's already a SourceReference
    return source;
  }
  
  /**
   * Map source category to source type
   */
  private mapCategoryToType(category: string): SourceType {
    const mapping: Record<string, SourceType> = {
      'business': 'industry_report',
      'news': 'news_article',
      'government': 'government_document',
      'academic': 'research_paper',
      'professional': 'expert_opinion',
      'industry': 'industry_report',
      'social': 'social_media'
    };
    
    return mapping[category] || 'news_article';
  }
  
  /**
   * Select varied phrase for better readability
   */
  private selectVariedPhrase(phrases: string[]): string {
    // Simple rotation to avoid repetition
    const index = Math.floor(Math.random() * phrases.length);
    return phrases[index];
  }
  
  /**
   * Select appropriate reporting verb
   */
  private selectReportingVerb(type: SourceType, language: SupportedLanguage): string {
    const phrases = language === 'no' ? this.norwegianPhrases : this.englishPhrases;
    
    switch (type) {
      case 'research_paper':
      case 'government_document':
        return this.selectVariedPhrase(phrases.shows);
      case 'expert_opinion':
        return this.selectVariedPhrase(phrases.states);
      case 'news_article':
      case 'industry_report':
        return this.selectVariedPhrase(phrases.reports);
      default:
        return this.selectVariedPhrase(phrases.reports);
    }
  }
  
  /**
   * Shorten source name for parenthetical citations
   */
  private shortenSourceName(name: string): string {
    // Remove common suffixes
    const shortened = name
      .replace(/\s+(AS|ASA|Ltd|Inc|Group|Gruppen)$/i, '')
      .replace(/\s+(Online|Digital|News|Nyheter)$/i, '');
    
    // If still long, use acronym
    if (shortened.length > 15) {
      const words = shortened.split(/\s+/);
      if (words.length > 1) {
        return words.map(w => w[0]).join('').toUpperCase();
      }
    }
    
    return shortened;
  }
  
  /**
   * Format date according to language
   */
  private formatDate(date: string, language: SupportedLanguage): string {
    const dateObj = new Date(date);
    
    if (language === 'no') {
      // Norwegian format: DD. month YYYY
      const months = [
        'januar', 'februar', 'mars', 'april', 'mai', 'juni',
        'juli', 'august', 'september', 'oktober', 'november', 'desember'
      ];
      
      const day = dateObj.getDate();
      const month = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      
      return `${day}. ${month} ${year}`;
    } else {
      // English format: Month DD, YYYY
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
  
  /**
   * Get multi-source introduction
   */
  private getMultiSourceIntro(language: SupportedLanguage): string {
    if (language === 'no') {
      return 'Basert på informasjon fra flere kilder, inkludert ';
    } else {
      return 'Based on information from multiple sources, including ';
    }
  }
  
  /**
   * Calculate confidence in attribution
   */
  private calculateConfidence(source: SourceReference, options: AttributionOptions): number {
    let confidence = source.credibility;
    
    // Boost for complete information
    if (source.author) confidence += 0.05;
    if (source.date) confidence += 0.05;
    if (source.title) confidence += 0.05;
    if (source.url) confidence += 0.05;
    
    // Adjust for source type
    confidence *= SOURCE_CREDIBILITY[source.type] || 0.5;
    
    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Generate attribution for quotes
   */
  public generateQuoteAttribution(
    quote: CitableQuote,
    options?: Partial<AttributionOptions>
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    
    if (opts.language === 'no') {
      if (quote.author) {
        return `Som ${quote.author} sa i ${quote.source}: "${quote.quote}"`;
      } else {
        return `Ifølge ${quote.source}: "${quote.quote}"`;
      }
    } else {
      if (quote.author) {
        return `As ${quote.author} stated in ${quote.source}: "${quote.quote}"`;
      } else {
        return `According to ${quote.source}: "${quote.quote}"`;
      }
    }
  }
  
  /**
   * Validate attribution requirements
   */
  public validateAttribution(attribution: Attribution): boolean {
    // Check minimum requirements
    if (!attribution.text || attribution.text.length < 5) {
      return false;
    }
    
    if (!attribution.source.name) {
      return false;
    }
    
    // Check confidence threshold
    if (attribution.confidence < 0.5) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Format attribution for different output formats
   */
  public formatForOutput(
    attribution: Attribution,
    outputFormat: 'html' | 'markdown' | 'plain'
  ): string {
    switch (outputFormat) {
      case 'html':
        return this.formatAsHTML(attribution);
      case 'markdown':
        return this.formatAsMarkdown(attribution);
      case 'plain':
      default:
        return attribution.text;
    }
  }
  
  /**
   * Format attribution as HTML
   */
  private formatAsHTML(attribution: Attribution): string {
    let html = attribution.text;
    
    // Add link if URL available
    if (attribution.source.url && attribution.format === 'hyperlink') {
      const linkText = attribution.source.name;
      html = html.replace(
        linkText,
        `<a href="${attribution.source.url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
      );
    }
    
    // Add semantic markup
    if (attribution.format === 'footnote') {
      html = `<sup>${html}</sup>`;
    }
    
    return `<cite>${html}</cite>`;
  }
  
  /**
   * Format attribution as Markdown
   */
  private formatAsMarkdown(attribution: Attribution): string {
    let markdown = attribution.text;
    
    // Add link if URL available
    if (attribution.source.url && attribution.format === 'hyperlink') {
      const linkText = attribution.source.name;
      markdown = markdown.replace(
        linkText,
        `[${linkText}](${attribution.source.url})`
      );
    }
    
    // Add footnote marker
    if (attribution.format === 'footnote') {
      markdown = `[^${markdown}]`;
    }
    
    return markdown;
  }
}