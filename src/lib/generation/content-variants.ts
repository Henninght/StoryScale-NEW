/**
 * Content Variants Generator for Norwegian Text
 * Creates short, medium, and long variants optimized for Norwegian business communication
 */

import { GenerationResponse, NorwegianAIProvider } from './ai-providers';
import { NORWEGIAN_CONTENT_LENGTHS } from './norwegian-prompts';
import { ResearchResult } from '../functions/research-function';

/**
 * Content variant with metadata
 */
export interface ContentVariant {
  length: 'short' | 'medium' | 'long';
  content: string;
  wordCount: number;
  characterCount: number;
  readingTime: number; // in seconds
  suitability: {
    platform: string[];
    audience: string[];
    purpose: string[];
  };
  metrics: {
    sentenceCount: number;
    averageSentenceLength: number;
    paragraphCount: number;
    complexityScore: number;
  };
}

/**
 * Variant generation request
 */
export interface VariantGenerationRequest {
  baseContent?: string;
  contentType: string;
  topic: string;
  audience: string;
  tone: string;
  research?: ResearchResult[];
  generateAllLengths: boolean;
  targetPlatforms?: string[];
}

/**
 * Norwegian Content Variants Generator
 */
export class NorwegianVariantsGenerator {
  private aiProvider: NorwegianAIProvider;
  
  // Norwegian reading speed (slightly slower than English due to compound words)
  private readonly NORWEGIAN_WORDS_PER_MINUTE = 200;
  
  constructor(aiProvider: NorwegianAIProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * Generate content variants
   */
  async generateVariants(
    request: VariantGenerationRequest
  ): Promise<ContentVariant[]> {
    const variants: ContentVariant[] = [];
    
    if (request.generateAllLengths) {
      // Generate all three variants
      const lengths: Array<'short' | 'medium' | 'long'> = ['short', 'medium', 'long'];
      
      for (const length of lengths) {
        const variant = await this.generateSingleVariant(
          request,
          length
        );
        variants.push(variant);
      }
    } else if (request.baseContent) {
      // Create variants from existing content
      variants.push(
        await this.createShortVariant(request.baseContent, request),
        await this.createMediumVariant(request.baseContent, request),
        await this.createLongVariant(request.baseContent, request)
      );
    } else {
      // Generate single optimal variant
      const optimalLength = this.determineOptimalLength(request);
      const variant = await this.generateSingleVariant(
        request,
        optimalLength
      );
      variants.push(variant);
    }
    
    // Optimize for platforms if specified
    if (request.targetPlatforms && request.targetPlatforms.length > 0) {
      return this.optimizeForPlatforms(variants, request.targetPlatforms);
    }
    
    return variants;
  }

  /**
   * Generate single variant
   */
  private async generateSingleVariant(
    request: VariantGenerationRequest,
    length: 'short' | 'medium' | 'long'
  ): Promise<ContentVariant> {
    // Generate content using AI provider
    const response = await this.aiProvider.generateContent({
      contentType: request.contentType as any,
      topic: request.topic,
      audience: request.audience,
      tone: request.tone as any,
      length,
      research: request.research
    });
    
    return this.createVariantFromContent(
      response.content,
      length,
      request
    );
  }

  /**
   * Create short variant from existing content
   */
  private async createShortVariant(
    content: string,
    request: VariantGenerationRequest
  ): Promise<ContentVariant> {
    const targetLength = this.getTargetLength(request.contentType, 'short');
    
    // Use AI to create concise summary
    const shortPrompt = `Lag en kort, konsis versjon av følgende innhold på cirka ${targetLength} ord.
    
ORIGINALT INNHOLD:
${content}

KRAV:
- Behold kjernebudskapet
- Fjern unødvendige detaljer
- Bruk korte, klare setninger
- Oppretthold norsk forretningstradisjon
- Målgruppe: ${request.audience}

Skriv den korte versjonen:`;

    const response = await this.aiProvider.generateContent({
      contentType: 'websiteCopy',
      topic: request.topic,
      audience: request.audience,
      tone: request.tone as any,
      variables: { 
        prompt: shortPrompt,
        originalContent: content 
      }
    });
    
    return this.createVariantFromContent(
      response.content,
      'short',
      request
    );
  }

  /**
   * Create medium variant from existing content
   */
  private async createMediumVariant(
    content: string,
    request: VariantGenerationRequest
  ): Promise<ContentVariant> {
    const currentLength = this.countWords(content);
    const targetLength = this.getTargetLength(request.contentType, 'medium');
    
    if (Math.abs(currentLength - targetLength) < 50) {
      // Content is already medium length
      return this.createVariantFromContent(content, 'medium', request);
    }
    
    const action = currentLength > targetLength ? 'kortere' : 'lengre';
    const mediumPrompt = `Juster følgende innhold til cirka ${targetLength} ord (gjør det ${action}).
    
ORIGINALT INNHOLD:
${content}

KRAV:
- Behold alle hovedpoenger
- ${currentLength > targetLength ? 'Fjern mindre viktige detaljer' : 'Legg til relevante detaljer og eksempler'}
- Oppretthold flyt og lesbarhet
- Bevar norsk forretningstradisjon
- Målgruppe: ${request.audience}

Skriv den justerte versjonen:`;

    const response = await this.aiProvider.generateContent({
      contentType: 'websiteCopy',
      topic: request.topic,
      audience: request.audience,
      tone: request.tone as any,
      variables: {
        prompt: mediumPrompt,
        originalContent: content
      }
    });
    
    return this.createVariantFromContent(
      response.content,
      'medium',
      request
    );
  }

  /**
   * Create long variant from existing content
   */
  private async createLongVariant(
    content: string,
    request: VariantGenerationRequest
  ): Promise<ContentVariant> {
    const targetLength = this.getTargetLength(request.contentType, 'long');
    
    // Use AI to expand content
    const longPrompt = `Utvid følgende innhold til en omfattende versjon på cirka ${targetLength} ord.
    
ORIGINALT INNHOLD:
${content}

UTVIDELSE SKAL INKLUDERE:
- Dypere forklaringer av hovedpoenger
- Norske eksempler og case-studier
- Praktiske råd og implementering
- Flere perspektiver og nyanser
- Støttende fakta og statistikk

KRAV:
- Bevar kjernemebudskapet
- Legg til verdi, ikke fyllstoff
- Oppretthold profesjonell tone
- Følg norsk forretningstradisjon
- Målgruppe: ${request.audience}

${request.research ? `
TILGJENGELIG FORSKNING:
${request.research.map(r => `- ${r.keyFacts.join(', ')}`).join('\n')}
` : ''}

Skriv den utvidede versjonen:`;

    const response = await this.aiProvider.generateContent({
      contentType: 'blogPost',
      topic: request.topic,
      audience: request.audience,
      tone: request.tone as any,
      research: request.research,
      variables: {
        prompt: longPrompt,
        originalContent: content
      }
    });
    
    return this.createVariantFromContent(
      response.content,
      'long',
      request
    );
  }

  /**
   * Create variant from content
   */
  private createVariantFromContent(
    content: string,
    length: 'short' | 'medium' | 'long',
    request: VariantGenerationRequest
  ): ContentVariant {
    const metrics = this.analyzeContent(content);
    const suitability = this.determineSuitability(length, request.contentType);
    
    return {
      length,
      content,
      wordCount: metrics.wordCount,
      characterCount: metrics.characterCount,
      readingTime: Math.ceil(metrics.wordCount / this.NORWEGIAN_WORDS_PER_MINUTE * 60),
      suitability,
      metrics: {
        sentenceCount: metrics.sentenceCount,
        averageSentenceLength: metrics.averageSentenceLength,
        paragraphCount: metrics.paragraphCount,
        complexityScore: metrics.complexityScore
      }
    };
  }

  /**
   * Analyze content metrics
   */
  private analyzeContent(content: string): {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    averageSentenceLength: number;
    paragraphCount: number;
    complexityScore: number;
  } {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Calculate complexity based on Norwegian language patterns
    const complexityFactors = {
      longWords: words.filter(w => w.length > 10).length / words.length,
      compoundWords: words.filter(w => w.includes('-')).length / words.length,
      sentenceVariation: this.calculateVariation(
        sentences.map(s => s.split(/\s+/).length)
      ),
      avgSentenceLength: words.length / sentences.length
    };
    
    const complexityScore = 
      (complexityFactors.longWords * 0.3) +
      (complexityFactors.compoundWords * 0.2) +
      (complexityFactors.sentenceVariation * 0.2) +
      (Math.min(complexityFactors.avgSentenceLength / 30, 1) * 0.3);
    
    return {
      wordCount: words.length,
      characterCount: content.length,
      sentenceCount: sentences.length,
      averageSentenceLength: words.length / sentences.length,
      paragraphCount: paragraphs.length,
      complexityScore: Math.round(complexityScore * 100)
    };
  }

  /**
   * Calculate variation (standard deviation)
   */
  private calculateVariation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0
    ) / values.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  /**
   * Determine content suitability
   */
  private determineSuitability(
    length: 'short' | 'medium' | 'long',
    contentType: string
  ): ContentVariant['suitability'] {
    const suitabilityMap = {
      short: {
        platform: ['Twitter', 'Instagram', 'SMS', 'Push notifications'],
        audience: ['Busy executives', 'Mobile users', 'Social media followers'],
        purpose: ['Awareness', 'Quick updates', 'Teasers', 'Headlines']
      },
      medium: {
        platform: ['LinkedIn', 'Facebook', 'Email', 'Landing pages'],
        audience: ['Professionals', 'Engaged readers', 'Email subscribers'],
        purpose: ['Engagement', 'Education', 'Lead generation', 'Newsletters']
      },
      long: {
        platform: ['Blog', 'Website', 'PDF', 'White papers'],
        audience: ['Researchers', 'Decision makers', 'Deep readers'],
        purpose: ['Thought leadership', 'SEO', 'Education', 'Documentation']
      }
    };
    
    return suitabilityMap[length];
  }

  /**
   * Optimize variants for specific platforms
   */
  private async optimizeForPlatforms(
    variants: ContentVariant[],
    platforms: string[]
  ): Promise<ContentVariant[]> {
    const optimized: ContentVariant[] = [];
    
    for (const platform of platforms) {
      const bestVariant = this.selectBestVariantForPlatform(variants, platform);
      
      if (bestVariant) {
        const platformOptimized = await this.optimizeForPlatform(
          bestVariant,
          platform
        );
        optimized.push(platformOptimized);
      }
    }
    
    return optimized;
  }

  /**
   * Select best variant for platform
   */
  private selectBestVariantForPlatform(
    variants: ContentVariant[],
    platform: string
  ): ContentVariant | null {
    // Platform-specific length preferences
    const platformPreferences: Record<string, 'short' | 'medium' | 'long'> = {
      'LinkedIn': 'medium',
      'Facebook': 'medium',
      'Instagram': 'short',
      'Twitter': 'short',
      'Email': 'medium',
      'Blog': 'long',
      'Website': 'medium'
    };
    
    const preferredLength = platformPreferences[platform] || 'medium';
    return variants.find(v => v.length === preferredLength) || variants[0];
  }

  /**
   * Optimize content for specific platform
   */
  private async optimizeForPlatform(
    variant: ContentVariant,
    platform: string
  ): Promise<ContentVariant> {
    const platformOptimizations: Record<string, (content: string) => string> = {
      'LinkedIn': (content) => this.optimizeForLinkedIn(content),
      'Facebook': (content) => this.optimizeForFacebook(content),
      'Instagram': (content) => this.optimizeForInstagram(content),
      'Twitter': (content) => this.optimizeForTwitter(content),
      'Email': (content) => this.optimizeForEmail(content)
    };
    
    const optimizer = platformOptimizations[platform];
    if (optimizer) {
      const optimizedContent = optimizer(variant.content);
      return {
        ...variant,
        content: optimizedContent,
        suitability: {
          ...variant.suitability,
          platform: [platform]
        }
      };
    }
    
    return variant;
  }

  /**
   * Platform-specific optimizations
   */
  private optimizeForLinkedIn(content: string): string {
    // Add professional hashtags
    const hashtags = this.extractNorwegianHashtags(content, 'professional');
    return `${content}\n\n${hashtags.join(' ')}`;
  }

  private optimizeForFacebook(content: string): string {
    // Add engagement question
    const question = '\n\nHva er dine tanker om dette? 💭';
    return content + question;
  }

  private optimizeForInstagram(content: string): string {
    // Truncate and add call-to-action
    const truncated = this.truncateToLength(content, 150);
    return `${truncated}... Les mer i lenken i bio 🔗`;
  }

  private optimizeForTwitter(content: string): string {
    // Ensure within character limit
    return this.truncateToLength(content, 280);
  }

  private optimizeForEmail(content: string): string {
    // Add personalization placeholder
    return `Hei {fornavn},\n\n${content}\n\nMed vennlig hilsen,\n{avsender}`;
  }

  /**
   * Extract relevant Norwegian hashtags
   */
  private extractNorwegianHashtags(
    content: string,
    style: 'professional' | 'casual'
  ): string[] {
    const hashtags: string[] = [];
    
    // Extract key terms
    const norwegianBusinessTerms = [
      'innovasjon', 'bærekraft', 'digitalisering', 'ledelse',
      'strategi', 'vekst', 'samarbeid', 'teknologi'
    ];
    
    for (const term of norwegianBusinessTerms) {
      if (content.toLowerCase().includes(term)) {
        hashtags.push(`#${term}`);
      }
    }
    
    // Add style-specific tags
    if (style === 'professional') {
      hashtags.push('#norskbusiness', '#næringslivnorge');
    }
    
    return hashtags.slice(0, 5); // Limit to 5 hashtags
  }

  /**
   * Truncate content to length
   */
  private truncateToLength(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    // Find last complete word before limit
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) 
      : truncated;
  }

  /**
   * Determine optimal length based on context
   */
  private determineOptimalLength(
    request: VariantGenerationRequest
  ): 'short' | 'medium' | 'long' {
    // Platform-based determination
    if (request.targetPlatforms && request.targetPlatforms.length > 0) {
      const primaryPlatform = request.targetPlatforms[0];
      if (['Twitter', 'Instagram'].includes(primaryPlatform)) {
        return 'short';
      } else if (['Blog', 'Website'].includes(primaryPlatform)) {
        return 'long';
      }
    }
    
    // Content type based
    const contentTypeLengths: Record<string, 'short' | 'medium' | 'long'> = {
      'socialMedia': 'short',
      'email': 'medium',
      'blogPost': 'long',
      'caseStudy': 'long',
      'websiteCopy': 'medium',
      'pressRelease': 'medium'
    };
    
    return contentTypeLengths[request.contentType] || 'medium';
  }

  /**
   * Get target length for content type
   */
  private getTargetLength(
    contentType: string,
    length: 'short' | 'medium' | 'long'
  ): number {
    const lengths = NORWEGIAN_CONTENT_LENGTHS;
    
    if (contentType === 'blogPost') {
      return lengths.blogPost[length].target;
    } else if (contentType === 'socialMedia') {
      return 100; // Generic social media length
    } else if (contentType === 'email') {
      return lengths.email.body.optimal;
    }
    
    // Default lengths
    const defaults = { short: 100, medium: 250, long: 500 };
    return defaults[length];
  }

  /**
   * Count words in Norwegian text
   */
  private countWords(text: string): number {
    // Norwegian word counting (handles compound words)
    return text
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  /**
   * A/B test variants
   */
  async testVariants(
    variants: ContentVariant[],
    testCriteria: {
      metric: 'engagement' | 'clarity' | 'conversion';
      audience: string;
    }
  ): Promise<{
    winner: ContentVariant;
    scores: Map<ContentVariant, number>;
  }> {
    const scores = new Map<ContentVariant, number>();
    
    for (const variant of variants) {
      const score = await this.scoreVariant(variant, testCriteria);
      scores.set(variant, score);
    }
    
    // Find winner
    let winner = variants[0];
    let highestScore = 0;
    
    for (const [variant, score] of scores) {
      if (score > highestScore) {
        highestScore = score;
        winner = variant;
      }
    }
    
    return { winner, scores };
  }

  /**
   * Score variant based on criteria
   */
  private async scoreVariant(
    variant: ContentVariant,
    criteria: { metric: string; audience: string }
  ): Promise<number> {
    let score = 50; // Base score
    
    // Readability affects all metrics
    const readabilityScore = 100 - variant.metrics.complexityScore;
    score += readabilityScore * 0.2;
    
    // Metric-specific scoring
    if (criteria.metric === 'engagement') {
      // Shorter content often has higher engagement
      if (variant.length === 'short') score += 15;
      else if (variant.length === 'medium') score += 10;
      
      // Questions and calls-to-action increase engagement
      if (variant.content.includes('?')) score += 5;
    } else if (criteria.metric === 'clarity') {
      // Simpler sentences are clearer
      if (variant.metrics.averageSentenceLength < 15) score += 10;
      
      // Proper structure improves clarity
      if (variant.metrics.paragraphCount > 2) score += 5;
    } else if (criteria.metric === 'conversion') {
      // Medium length often converts best
      if (variant.length === 'medium') score += 10;
      
      // Action words improve conversion
      const actionWords = ['bestill', 'kjøp', 'start', 'prøv', 'last ned'];
      const hasActionWords = actionWords.some(word => 
        variant.content.toLowerCase().includes(word)
      );
      if (hasActionWords) score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }
}