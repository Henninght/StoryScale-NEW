/**
 * Generate Function - Main Content Generation Orchestrator
 * Coordinates AI generation with Norwegian cultural context and business optimization
 */

import { 
  LanguageAwareRequest,
  LanguageAwareResponse,
  ValidationResult 
} from '../gateway/content-gateway';
import { CostGuardian } from '../monitoring/cost-guardian';
import { MultiLayerCache } from '../cache/multi-layer-cache';
import { ResearchFunction, ResearchResult } from './research-function';
import { NorwegianAIProvider, NorwegianGenerationRequest, GenerationResponse } from '../generation/ai-providers';
import { NorwegianVariantsGenerator, ContentVariant, VariantGenerationRequest } from '../generation/content-variants';
import { NorwegianCulturalAdapter, CulturalAdaptationResult } from '../generation/cultural-adapter';
import { NorwegianQualityScorer, QualityAssessment } from '../generation/quality-scorer';
import { NORWEGIAN_CONTENT_PROMPTS } from '../generation/norwegian-prompts';

/**
 * Generation request with full context
 */
export interface GenerateRequest extends LanguageAwareRequest {
  contentType: 'blogPost' | 'socialMedia' | 'email' | 'websiteCopy' | 'caseStudy' | 'pressRelease';
  topic: string;
  audience: string;
  company?: string;
  industry?: string;
  tone?: 'professional' | 'casual' | 'persuasive' | 'informative' | 'authoritative' | 'friendly';
  objectives?: string[];
  keywords?: string[];
  competitors?: string[];
  uniqueSellingPoints?: string[];
  constraints?: {
    maxLength?: number;
    minLength?: number;
    requiredElements?: string[];
    avoidTopics?: string[];
  };
  variants?: {
    generateAll?: boolean;
    lengths?: Array<'short' | 'medium' | 'long'>;
    platforms?: string[];
  };
  quality?: {
    minScore?: number;
    culturalStrictness?: 'strict' | 'moderate' | 'relaxed';
    requireReview?: boolean;
  };
  research?: {
    enable?: boolean;
    sources?: string[];
    depth?: 'basic' | 'comprehensive' | 'exhaustive';
  };
}

/**
 * Complete generation response
 */
export interface GenerateResponse extends LanguageAwareResponse {
  id: string;
  status: 'success' | 'partial' | 'failed';
  content: {
    primary: GeneratedContent;
    variants?: GeneratedContent[];
  };
  metadata: GenerationMetadata;
  quality: QualityAssessment;
  research?: ResearchResult[];
  recommendations?: string[];
  errors?: GenerationError[];
}

/**
 * Generated content with full context
 */
export interface GeneratedContent {
  text: string;
  length: 'short' | 'medium' | 'long';
  variant?: ContentVariant;
  culturalAdaptation?: CulturalAdaptationResult;
  platform?: string;
  wordCount: number;
  characterCount: number;
  readingTime: number;
  seoMetadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  generatedAt: Date;
  provider: string;
  model: string;
  cost: number;
  latency: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cacheStatus: 'hit' | 'miss' | 'partial';
  iterations?: number;
  improvementCycles?: number;
}

/**
 * Generation error details
 */
export interface GenerationError {
  code: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  suggestion?: string;
}

/**
 * Norwegian Content Generation Function
 */
export class GenerateFunction {
  private aiProvider: NorwegianAIProvider;
  private variantsGenerator: NorwegianVariantsGenerator;
  private culturalAdapter: NorwegianCulturalAdapter;
  private qualityScorer: NorwegianQualityScorer;
  private researchFunction: ResearchFunction;
  private costGuardian: CostGuardian;
  private cache: MultiLayerCache;

  constructor(
    costGuardian: CostGuardian,
    cache: MultiLayerCache
  ) {
    this.costGuardian = costGuardian;
    this.cache = cache;
    
    // Initialize components
    this.aiProvider = new NorwegianAIProvider(costGuardian, cache);
    this.variantsGenerator = new NorwegianVariantsGenerator(this.aiProvider);
    this.culturalAdapter = new NorwegianCulturalAdapter();
    this.qualityScorer = new NorwegianQualityScorer();
    this.researchFunction = new ResearchFunction(costGuardian, cache);
  }

  /**
   * Main generation orchestration
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();
    const generationId = this.generateId();
    const errors: GenerationError[] = [];

    try {
      // Step 1: Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return this.createErrorResponse(
          generationId,
          validation.errors || ['Invalid request'],
          request
        );
      }

      // Step 2: Check cache
      const cacheKey = this.createCacheKey(request);
      const cached = await this.checkCache(cacheKey);
      if (cached && this.isCacheValid(cached, request)) {
        return this.createCachedResponse(cached, generationId, request);
      }

      // Step 3: Conduct research if enabled
      let research: ResearchResult[] | undefined;
      if (request.research?.enable) {
        research = await this.conductResearch(request);
      }

      // Step 4: Generate primary content
      const primaryContent = await this.generatePrimaryContent(
        request,
        research
      );

      // Step 5: Apply cultural adaptation
      const culturallyAdapted = await this.applyCulturalAdaptation(
        primaryContent,
        request
      );

      // Step 6: Generate variants if requested
      let variants: GeneratedContent[] | undefined;
      if (request.variants?.generateAll || request.variants?.lengths) {
        variants = await this.generateVariants(
          culturallyAdapted,
          request,
          research
        );
      }

      // Step 7: Assess quality
      const qualityAssessment = await this.assessQuality(
        culturallyAdapted,
        request
      );

      // Step 8: Apply quality improvements if needed
      let finalContent = culturallyAdapted;
      let improvementCycles = 0;
      
      while (qualityAssessment.overallScore < (request.quality?.minScore || 70) && 
             improvementCycles < 3) {
        finalContent = await this.improveContent(
          finalContent,
          qualityAssessment,
          request,
          research
        );
        
        // Reassess quality
        const newAssessment = await this.assessQuality(finalContent, request);
        if (newAssessment.overallScore <= qualityAssessment.overallScore) {
          break; // No improvement, stop trying
        }
        
        Object.assign(qualityAssessment, newAssessment);
        improvementCycles++;
      }

      // Step 9: Generate SEO metadata if applicable
      if (this.requiresSEO(request.contentType)) {
        finalContent = await this.addSEOMetadata(finalContent, request);
      }

      // Step 10: Create response
      const response = this.createSuccessResponse(
        generationId,
        finalContent,
        variants,
        qualityAssessment,
        research,
        {
          generatedAt: new Date(),
          provider: primaryContent.provider,
          model: primaryContent.model,
          cost: primaryContent.cost,
          latency: Date.now() - startTime,
          tokens: primaryContent.tokenUsage,
          cacheStatus: 'miss',
          iterations: 1,
          improvementCycles
        },
        request
      );

      // Step 11: Cache successful response
      await this.cacheResponse(cacheKey, response);

      // Step 12: Track metrics
      await this.trackMetrics(response, request);

      return response;

    } catch (error) {
      console.error('Generation failed:', error);
      errors.push({
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'critical'
      });
      
      return this.createErrorResponse(generationId, errors, request);
    }
  }

  /**
   * Validate generation request
   */
  private validateRequest(request: GenerateRequest): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    if (!request.contentType) {
      errors.push('Content type is required');
    }
    if (!request.topic) {
      errors.push('Topic is required');
    }
    if (!request.audience) {
      errors.push('Audience is required');
    }

    // Validate content type
    const validContentTypes = Object.keys(NORWEGIAN_CONTENT_PROMPTS);
    if (!validContentTypes.includes(request.contentType)) {
      errors.push(`Invalid content type: ${request.contentType}`);
    }

    // Validate constraints
    if (request.constraints) {
      if (request.constraints.maxLength && request.constraints.minLength) {
        if (request.constraints.maxLength < request.constraints.minLength) {
          errors.push('Max length must be greater than min length');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Conduct research for content generation
   */
  private async conductResearch(
    request: GenerateRequest
  ): Promise<ResearchResult[]> {
    const researchRequest = {
      query: request.topic,
      language: request.language || 'no',
      depth: request.research?.depth || 'comprehensive',
      sources: request.research?.sources,
      industry: request.industry,
      culturalContext: request.culturalContext
    };

    const results = await this.researchFunction.research(researchRequest);
    
    // Filter and rank results
    return results
      .filter(r => r.relevanceScore >= 7)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Top 5 most relevant
  }

  /**
   * Generate primary content
   */
  private async generatePrimaryContent(
    request: GenerateRequest,
    research?: ResearchResult[]
  ): Promise<GenerationResponse> {
    const generationRequest: NorwegianGenerationRequest = {
      contentType: request.contentType,
      topic: request.topic,
      audience: request.audience,
      company: request.company,
      industry: request.industry,
      tone: request.tone,
      length: this.determineInitialLength(request),
      research,
      variables: {
        objectives: request.objectives,
        keywords: request.keywords,
        uniqueSellingPoints: request.uniqueSellingPoints,
        constraints: request.constraints
      },
      culturalStrictness: request.quality?.culturalStrictness
    };

    return await this.aiProvider.generateContent(generationRequest);
  }

  /**
   * Apply cultural adaptation
   */
  private async applyCulturalAdaptation(
    content: GenerationResponse,
    request: GenerateRequest
  ): Promise<GeneratedContent> {
    const adaptation = await this.culturalAdapter.adaptContent(
      content.content,
      {
        industry: request.industry,
        audience: request.audience,
        formality: this.determineFormality(request.tone),
        companySize: this.inferCompanySize(request.company)
      }
    );

    return {
      text: adaptation.adaptedContent,
      length: this.determineInitialLength(request),
      culturalAdaptation: adaptation,
      wordCount: this.countWords(adaptation.adaptedContent),
      characterCount: adaptation.adaptedContent.length,
      readingTime: this.calculateReadingTime(adaptation.adaptedContent)
    };
  }

  /**
   * Generate content variants
   */
  private async generateVariants(
    baseContent: GeneratedContent,
    request: GenerateRequest,
    research?: ResearchResult[]
  ): Promise<GeneratedContent[]> {
    const variantRequest: VariantGenerationRequest = {
      baseContent: baseContent.text,
      contentType: request.contentType,
      topic: request.topic,
      audience: request.audience,
      tone: request.tone || 'professional',
      research,
      generateAllLengths: request.variants?.generateAll || false,
      targetPlatforms: request.variants?.platforms
    };

    const variants = await this.variantsGenerator.generateVariants(variantRequest);
    
    return variants.map(variant => ({
      text: variant.content,
      length: variant.length,
      variant,
      platform: variant.suitability.platform[0],
      wordCount: variant.wordCount,
      characterCount: variant.characterCount,
      readingTime: variant.readingTime
    }));
  }

  /**
   * Assess content quality
   */
  private async assessQuality(
    content: GeneratedContent,
    request: GenerateRequest
  ): Promise<QualityAssessment> {
    return await this.qualityScorer.assessQuality(
      content.text,
      {
        contentType: request.contentType,
        audience: request.audience,
        purpose: request.objectives?.join(', ') || 'general',
        culturalAdaptation: content.culturalAdaptation,
        variant: content.variant
      }
    );
  }

  /**
   * Improve content based on quality assessment
   */
  private async improveContent(
    content: GeneratedContent,
    assessment: QualityAssessment,
    request: GenerateRequest,
    research?: ResearchResult[]
  ): Promise<GeneratedContent> {
    // Create improvement prompt based on issues
    const improvementPrompt = this.createImprovementPrompt(
      content.text,
      assessment
    );

    // Generate improved version
    const improved = await this.aiProvider.generateContent({
      contentType: request.contentType,
      topic: request.topic,
      audience: request.audience,
      tone: request.tone,
      research,
      variables: {
        originalContent: content.text,
        improvementPrompt,
        issues: assessment.weaknesses
      }
    });

    // Apply cultural adaptation to improved content
    const adaptation = await this.culturalAdapter.adaptContent(
      improved.content,
      {
        industry: request.industry,
        audience: request.audience
      }
    );

    return {
      ...content,
      text: adaptation.adaptedContent,
      culturalAdaptation: adaptation,
      wordCount: this.countWords(adaptation.adaptedContent),
      characterCount: adaptation.adaptedContent.length
    };
  }

  /**
   * Create improvement prompt
   */
  private createImprovementPrompt(
    content: string,
    assessment: QualityAssessment
  ): string {
    const improvements = assessment.improvements
      .filter(i => i.priority === 'critical' || i.priority === 'high')
      .slice(0, 5);

    return `Forbedre følgende innhold basert på disse punktene:

FORBEDRINGSPUNKTER:
${improvements.map(i => `- ${i.issue}: ${i.suggestion}`).join('\n')}

ORIGINALT INNHOLD:
${content}

Generer en forbedret versjon som addresserer disse punktene samtidig som du beholder kjernebudskapet.`;
  }

  /**
   * Add SEO metadata
   */
  private async addSEOMetadata(
    content: GeneratedContent,
    request: GenerateRequest
  ): Promise<GeneratedContent> {
    // Generate SEO title
    const title = await this.generateSEOTitle(content.text, request);
    
    // Generate meta description
    const description = await this.generateMetaDescription(content.text, request);
    
    // Extract/enhance keywords
    const keywords = this.extractKeywords(content.text, request.keywords);

    return {
      ...content,
      seoMetadata: {
        title,
        description,
        keywords
      }
    };
  }

  /**
   * Generate SEO title
   */
  private async generateSEOTitle(
    content: string,
    request: GenerateRequest
  ): Promise<string> {
    const firstLine = content.split('\n')[0];
    const words = firstLine.split(' ');
    
    if (words.length <= 10) {
      return firstLine;
    }
    
    // Generate concise title
    const titlePrompt = `Lag en SEO-vennlig tittel (maks 60 tegn) for: ${request.topic}`;
    const response = await this.aiProvider.generateContent({
      contentType: 'websiteCopy',
      topic: titlePrompt,
      audience: request.audience,
      tone: request.tone,
      length: 'short'
    });
    
    return response.content.trim();
  }

  /**
   * Generate meta description
   */
  private async generateMetaDescription(
    content: string,
    request: GenerateRequest
  ): Promise<string> {
    const descPrompt = `Lag en meta-beskrivelse (maks 160 tegn) som oppsummerer: ${content.substring(0, 500)}`;
    const response = await this.aiProvider.generateContent({
      contentType: 'websiteCopy',
      topic: descPrompt,
      audience: request.audience,
      tone: request.tone,
      length: 'short'
    });
    
    return response.content.trim();
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(
    content: string,
    providedKeywords?: string[]
  ): string[] {
    const keywords = new Set(providedKeywords || []);
    
    // Extract Norwegian business terms
    const businessTerms = [
      'innovasjon', 'bærekraft', 'digitalisering', 'strategi',
      'vekst', 'effektivitet', 'kvalitet', 'samarbeid'
    ];
    
    for (const term of businessTerms) {
      if (content.toLowerCase().includes(term)) {
        keywords.add(term);
      }
    }
    
    return Array.from(keywords).slice(0, 10);
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineInitialLength(
    request: GenerateRequest
  ): 'short' | 'medium' | 'long' {
    if (request.constraints?.maxLength) {
      if (request.constraints.maxLength < 200) return 'short';
      if (request.constraints.maxLength < 500) return 'medium';
      return 'long';
    }
    
    // Default by content type
    const defaults: Record<string, 'short' | 'medium' | 'long'> = {
      socialMedia: 'short',
      email: 'medium',
      blogPost: 'long',
      caseStudy: 'long',
      websiteCopy: 'medium',
      pressRelease: 'medium'
    };
    
    return defaults[request.contentType] || 'medium';
  }

  private determineFormality(
    tone?: string
  ): 'high' | 'medium' | 'low' {
    if (tone === 'professional' || tone === 'authoritative') return 'high';
    if (tone === 'casual') return 'low';
    return 'medium';
  }

  private inferCompanySize(company?: string): 'startup' | 'SMB' | 'enterprise' {
    if (!company) return 'SMB';
    
    const lower = company.toLowerCase();
    if (lower.includes('startup') || lower.includes('gründer')) return 'startup';
    if (lower.includes('as') || lower.includes('asa')) return 'enterprise';
    return 'SMB';
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200; // Norwegian reading speed
    const words = this.countWords(text);
    return Math.ceil(words / wordsPerMinute * 60); // in seconds
  }

  private requiresSEO(contentType: string): boolean {
    return ['blogPost', 'websiteCopy', 'caseStudy'].includes(contentType);
  }

  /**
   * Cache management
   */
  private createCacheKey(request: GenerateRequest): string {
    const key = {
      type: request.contentType,
      topic: request.topic,
      audience: request.audience,
      tone: request.tone,
      length: this.determineInitialLength(request),
      industry: request.industry,
      quality: request.quality?.culturalStrictness
    };
    
    return `generated_content:${JSON.stringify(key)}`;
  }

  private async checkCache(key: string): Promise<any> {
    return await this.cache.get(key);
  }

  private isCacheValid(cached: any, request: GenerateRequest): boolean {
    // Check if cached content meets quality requirements
    if (request.quality?.minScore) {
      if (!cached.quality || cached.quality.overallScore < request.quality.minScore) {
        return false;
      }
    }
    
    // Check age (24 hours for most content)
    const maxAge = request.contentType === 'pressRelease' ? 4 * 60 * 60 : 24 * 60 * 60;
    const age = Date.now() - new Date(cached.metadata?.generatedAt).getTime();
    
    return age < maxAge * 1000;
  }

  private async cacheResponse(key: string, response: GenerateResponse): Promise<void> {
    const ttl = response.content.primary.variant?.suitability.purpose.includes('SEO')
      ? 7 * 24 * 60 * 60  // 7 days for SEO content
      : 24 * 60 * 60;      // 24 hours for other content
    
    await this.cache.set(key, response, { ttl });
  }

  /**
   * Response creation
   */
  private createSuccessResponse(
    id: string,
    primary: GeneratedContent,
    variants: GeneratedContent[] | undefined,
    quality: QualityAssessment,
    research: ResearchResult[] | undefined,
    metadata: GenerationMetadata,
    request: GenerateRequest
  ): GenerateResponse {
    const recommendations = this.generateRecommendations(quality, request);
    
    return {
      id,
      status: 'success',
      content: {
        primary,
        variants
      },
      metadata,
      quality,
      research,
      recommendations,
      language: request.language || 'no',
      culturalContext: request.culturalContext,
      timestamp: new Date()
    };
  }

  private createCachedResponse(
    cached: any,
    id: string,
    request: GenerateRequest
  ): GenerateResponse {
    return {
      ...cached,
      id,
      metadata: {
        ...cached.metadata,
        cacheStatus: 'hit'
      },
      timestamp: new Date()
    };
  }

  private createErrorResponse(
    id: string,
    errors: GenerationError[] | string[],
    request: GenerateRequest
  ): GenerateResponse {
    const formattedErrors = errors.map(e => 
      typeof e === 'string' 
        ? { code: 'VALIDATION_ERROR', message: e, severity: 'critical' as const }
        : e
    );
    
    return {
      id,
      status: 'failed',
      content: {
        primary: {
          text: '',
          length: 'short',
          wordCount: 0,
          characterCount: 0,
          readingTime: 0
        }
      },
      metadata: {
        generatedAt: new Date(),
        provider: 'none',
        model: 'none',
        cost: 0,
        latency: 0,
        tokens: { prompt: 0, completion: 0, total: 0 },
        cacheStatus: 'miss'
      },
      quality: {
        overallScore: 0,
        dimensions: {
          linguistic: { score: 0, grammar: 0, spelling: 0, punctuation: 0, flowAndRhythm: 0, sentenceVariation: 0, wordChoice: 0, issues: [] },
          cultural: { score: 0, jantelovCompliance: 0, consensusLanguage: 0, culturalReferences: 0, appropriateness: 0, issues: [] },
          business: { score: 0, professionalism: 0, terminology: 0, credibility: 0, persuasiveness: 0, actionability: 0, issues: [] },
          technical: { score: 0, accuracy: 0, completeness: 0, structure: 0, seoOptimization: 0, accessibility: 0, issues: [] },
          engagement: { score: 0, hookStrength: 0, readability: 0, emotionalConnection: 0, callToAction: 0, shareability: 0, issues: [] }
        },
        strengths: [],
        weaknesses: [],
        improvements: [],
        grade: 'F',
        readinessLevel: 'rejected'
      },
      errors: formattedErrors,
      language: request.language || 'no',
      culturalContext: request.culturalContext,
      timestamp: new Date()
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    quality: QualityAssessment,
    request: GenerateRequest
  ): string[] {
    const recommendations: string[] = [];
    
    // Quality-based recommendations
    if (quality.overallScore < 70) {
      recommendations.push('Vurder å kjøre en ny generering med strengere kvalitetskrav');
    }
    
    if (quality.dimensions.cultural.jantelovCompliance < 80) {
      recommendations.push('Juster innholdet for bedre Jantelov-tilpasning');
    }
    
    // Content type specific
    if (request.contentType === 'blogPost' && !request.keywords) {
      recommendations.push('Legg til målrettede søkeord for bedre SEO');
    }
    
    if (request.contentType === 'socialMedia' && !request.variants?.platforms) {
      recommendations.push('Generer plattform-spesifikke varianter for optimal ytelse');
    }
    
    // Research recommendations
    if (!request.research?.enable && quality.dimensions.business.credibility < 70) {
      recommendations.push('Aktiver forskning for å øke troverdighet med fakta og kilder');
    }
    
    return recommendations;
  }

  /**
   * Track generation metrics
   */
  private async trackMetrics(
    response: GenerateResponse,
    request: GenerateRequest
  ): Promise<void> {
    await this.costGuardian.trackUsage(
      'generation',
      response.metadata.cost,
      {
        contentType: request.contentType,
        quality: response.quality.grade,
        provider: response.metadata.provider,
        cached: response.metadata.cacheStatus === 'hit'
      }
    );
  }

  /**
   * Batch generation
   */
  async batchGenerate(
    requests: GenerateRequest[]
  ): Promise<GenerateResponse[]> {
    const results: GenerateResponse[] = [];
    const batchSize = 3; // Process 3 at a time
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(req => this.generate(req))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Stream generation for real-time output
   */
  async *streamGenerate(
    request: GenerateRequest
  ): AsyncGenerator<string, GenerateResponse, unknown> {
    const response = await this.generate(request);
    
    // Stream the content word by word
    const words = response.content.primary.text.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return response;
  }
}

// Export singleton instance
export const generateFunction = new GenerateFunction();