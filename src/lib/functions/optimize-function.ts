/**
 * Optimize Function - Platform-specific content optimization
 * Adapts content for different platforms (LinkedIn, Twitter, Blog, etc.)
 * and applies audience-specific optimizations
 */

import { EventEmitter } from 'events';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  SupportedLanguage,
  CulturalContext,
} from '../types/language-aware-request';

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  platform: string;
  contentType: string;
  language?: SupportedLanguage;
  priority: number;
  apply: (content: string, context: OptimizationContext) => Promise<OptimizationResult>;
}

export interface OptimizationContext {
  platform: string;
  contentType: string;
  language: SupportedLanguage;
  culturalContext?: CulturalContext;
  targetAudience: string;
  tone: string;
  originalRequest: LanguageAwareContentRequest;
  metadata?: Record<string, any>;
}

export interface OptimizationResult {
  optimizedContent: string;
  changes: OptimizationChange[];
  confidence: number;
  metadata: {
    character_count: number;
    word_count: number;
    hashtag_count: number;
    emoji_count: number;
    reading_time_seconds: number;
    engagement_score: number;
  };
}

export interface OptimizationChange {
  type: 'length' | 'formatting' | 'tone' | 'structure' | 'cultural' | 'platform';
  description: string;
  before: string;
  after: string;
  impact: 'low' | 'medium' | 'high';
}

export interface OptimizeFunctionConfig {
  enablePlatformOptimization: boolean;
  enableCulturalOptimization: boolean;
  enableAudienceOptimization: boolean;
  maxOptimizationRounds: number;
  qualityThreshold: number;
}

export class OptimizeFunction extends EventEmitter {
  private static instance: OptimizeFunction;
  private config: OptimizeFunctionConfig;
  private rules: Map<string, OptimizationRule>;
  private platformSpecs: Map<string, PlatformSpecification>;

  private constructor(config?: Partial<OptimizeFunctionConfig>) {
    super();
    
    this.config = {
      enablePlatformOptimization: true,
      enableCulturalOptimization: true,
      enableAudienceOptimization: true,
      maxOptimizationRounds: 3,
      qualityThreshold: 0.7,
      ...config,
    };

    this.rules = new Map();
    this.platformSpecs = new Map();
    
    this.initializePlatformSpecs();
    this.initializeOptimizationRules();
  }

  public static getInstance(config?: Partial<OptimizeFunctionConfig>): OptimizeFunction {
    if (!OptimizeFunction.instance) {
      OptimizeFunction.instance = new OptimizeFunction(config);
    }
    return OptimizeFunction.instance;
  }

  /**
   * Main optimization function
   */
  public async optimize(
    content: string,
    request: LanguageAwareContentRequest,
    options?: {
      platform?: string;
      skipRules?: string[];
      maxRounds?: number;
    }
  ): Promise<OptimizationResult> {
    const startTime = performance.now();
    
    const context: OptimizationContext = {
      platform: options?.platform || this.inferPlatform(request.type),
      contentType: request.type,
      language: request.outputLanguage,
      culturalContext: request.culturalContext,
      targetAudience: request.targetAudience,
      tone: request.tone,
      originalRequest: request,
    };

    this.emit('optimization:started', { context, contentLength: content.length });

    try {
      let optimizedContent = content;
      let allChanges: OptimizationChange[] = [];
      let rounds = 0;
      const maxRounds = options?.maxRounds || this.config.maxOptimizationRounds;

      // Apply optimization rules in priority order
      const applicableRules = this.getApplicableRules(context, options?.skipRules);
      
      for (const rule of applicableRules) {
        if (rounds >= maxRounds) break;
        
        try {
          const result = await rule.apply(optimizedContent, context);
          
          if (result.changes.length > 0) {
            optimizedContent = result.optimizedContent;
            allChanges.push(...result.changes);
            rounds++;
            
            this.emit('optimization:rule-applied', {
              ruleId: rule.id,
              changes: result.changes.length,
              confidence: result.confidence,
            });
          }
        } catch (error) {
          this.emit('optimization:rule-error', { ruleId: rule.id, error });
          continue;
        }
      }

      // Calculate final metrics
      const finalResult: OptimizationResult = {
        optimizedContent,
        changes: allChanges,
        confidence: this.calculateOverallConfidence(allChanges),
        metadata: this.calculateContentMetrics(optimizedContent),
      };

      const duration = performance.now() - startTime;
      
      this.emit('optimization:completed', {
        context,
        originalLength: content.length,
        optimizedLength: optimizedContent.length,
        changesApplied: allChanges.length,
        duration,
        confidence: finalResult.confidence,
      });

      return finalResult;

    } catch (error) {
      this.emit('optimization:error', { context, error });
      
      // Return original content with error metadata
      return {
        optimizedContent: content,
        changes: [],
        confidence: 0,
        metadata: this.calculateContentMetrics(content),
      };
    }
  }

  /**
   * Platform specifications
   */
  private initializePlatformSpecs(): void {
    // LinkedIn specifications
    this.platformSpecs.set('linkedin', {
      name: 'LinkedIn',
      maxCharacters: 3000,
      optimalCharacters: { min: 1000, max: 1500 },
      maxHashtags: 5,
      optimalHashtags: 3,
      supportsEmojis: true,
      preferredStructure: ['hook', 'content', 'cta'],
      tonePreferences: ['professional', 'thought-leadership', 'conversational'],
      formatPreferences: ['story', 'insights', 'tips'],
    });

    // Twitter specifications
    this.platformSpecs.set('twitter', {
      name: 'Twitter',
      maxCharacters: 280,
      optimalCharacters: { min: 240, max: 280 },
      maxHashtags: 2,
      optimalHashtags: 1,
      supportsEmojis: true,
      preferredStructure: ['hook', 'content'],
      tonePreferences: ['conversational', 'witty', 'direct'],
      formatPreferences: ['thread', 'quote', 'question'],
    });

    // Blog specifications
    this.platformSpecs.set('blog', {
      name: 'Blog',
      maxCharacters: 10000,
      optimalCharacters: { min: 2000, max: 4000 },
      maxHashtags: 10,
      optimalHashtags: 5,
      supportsEmojis: true,
      preferredStructure: ['introduction', 'main-content', 'conclusion', 'cta'],
      tonePreferences: ['informative', 'professional', 'engaging'],
      formatPreferences: ['how-to', 'listicle', 'analysis'],
    });

    // Email specifications
    this.platformSpecs.set('email', {
      name: 'Email',
      maxCharacters: 2000,
      optimalCharacters: { min: 500, max: 1200 },
      maxHashtags: 0,
      optimalHashtags: 0,
      supportsEmojis: false,
      preferredStructure: ['greeting', 'content', 'cta', 'signature'],
      tonePreferences: ['professional', 'personal', 'direct'],
      formatPreferences: ['newsletter', 'announcement', 'personal'],
    });
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    // Length optimization rule
    this.rules.set('length-optimization', {
      id: 'length-optimization',
      name: 'Length Optimization',
      description: 'Optimize content length for platform',
      platform: 'all',
      contentType: 'all',
      priority: 1,
      apply: this.applyLengthOptimization.bind(this),
    });

    // Hashtag optimization rule
    this.rules.set('hashtag-optimization', {
      id: 'hashtag-optimization',
      name: 'Hashtag Optimization',
      description: 'Optimize hashtag usage for platform',
      platform: 'all',
      contentType: 'all',
      priority: 2,
      apply: this.applyHashtagOptimization.bind(this),
    });

    // Structure optimization rule
    this.rules.set('structure-optimization', {
      id: 'structure-optimization',
      name: 'Structure Optimization',
      description: 'Optimize content structure for engagement',
      platform: 'all',
      contentType: 'all',
      priority: 3,
      apply: this.applyStructureOptimization.bind(this),
    });

    // Norwegian cultural optimization
    this.rules.set('norwegian-cultural', {
      id: 'norwegian-cultural',
      name: 'Norwegian Cultural Optimization',
      description: 'Apply Norwegian business culture norms',
      platform: 'all',
      contentType: 'all',
      language: 'no',
      priority: 4,
      apply: this.applyNorwegianCulturalOptimization.bind(this),
    });

    // Tone optimization rule
    this.rules.set('tone-optimization', {
      id: 'tone-optimization',
      name: 'Tone Optimization',
      description: 'Adjust tone for audience and platform',
      platform: 'all',
      contentType: 'all',
      priority: 5,
      apply: this.applyToneOptimization.bind(this),
    });

    // Call-to-action optimization
    this.rules.set('cta-optimization', {
      id: 'cta-optimization',
      name: 'Call-to-Action Optimization',
      description: 'Optimize call-to-action for engagement',
      platform: 'all',
      contentType: 'all',
      priority: 6,
      apply: this.applyCTAOptimization.bind(this),
    });
  }

  /**
   * Optimization rule implementations
   */

  private async applyLengthOptimization(
    content: string,
    context: OptimizationContext
  ): Promise<OptimizationResult> {
    const changes: OptimizationChange[] = [];
    let optimizedContent = content;
    
    const platformSpec = this.platformSpecs.get(context.platform);
    if (!platformSpec) {
      return { optimizedContent, changes, confidence: 1, metadata: this.calculateContentMetrics(content) };
    }

    const currentLength = content.length;
    const { min, max } = platformSpec.optimalCharacters;

    // Too long - need to shorten
    if (currentLength > max) {
      const targetLength = max;
      optimizedContent = this.intelligentTruncate(content, targetLength);
      
      changes.push({
        type: 'length',
        description: `Shortened content from ${currentLength} to ${optimizedContent.length} characters`,
        before: content.substring(0, 100) + '...',
        after: optimizedContent.substring(0, 100) + '...',
        impact: 'high',
      });
    }
    
    // Too short - need to expand (but only suggest)
    else if (currentLength < min) {
      changes.push({
        type: 'length',
        description: `Content is ${min - currentLength} characters shorter than optimal range`,
        before: `${currentLength} characters`,
        after: `Suggested: ${min}-${max} characters`,
        impact: 'medium',
      });
    }

    return {
      optimizedContent,
      changes,
      confidence: 0.9,
      metadata: this.calculateContentMetrics(optimizedContent),
    };
  }

  private async applyHashtagOptimization(
    content: string,
    context: OptimizationContext
  ): Promise<OptimizationResult> {
    const changes: OptimizationChange[] = [];
    let optimizedContent = content;
    
    const platformSpec = this.platformSpecs.get(context.platform);
    if (!platformSpec) {
      return { optimizedContent, changes, confidence: 1, metadata: this.calculateContentMetrics(content) };
    }

    const currentHashtags = this.extractHashtags(content);
    const currentCount = currentHashtags.length;
    const optimalCount = platformSpec.optimalHashtags;
    const maxCount = platformSpec.maxHashtags;

    // Too many hashtags - remove excess
    if (currentCount > maxCount) {
      const hashtagsToKeep = currentHashtags.slice(0, optimalCount);
      optimizedContent = content;
      
      // Remove excess hashtags
      currentHashtags.slice(optimalCount).forEach(hashtag => {
        optimizedContent = optimizedContent.replace(new RegExp(`\\s*${hashtag}\\s*`, 'g'), ' ');
      });
      
      optimizedContent = optimizedContent.replace(/\s+/g, ' ').trim();
      
      changes.push({
        type: 'formatting',
        description: `Removed ${currentCount - optimalCount} hashtags (kept ${optimalCount})`,
        before: currentHashtags.join(' '),
        after: hashtagsToKeep.join(' '),
        impact: 'medium',
      });
    }

    // No hashtags but platform supports them - suggest adding
    else if (currentCount === 0 && optimalCount > 0) {
      const suggestedHashtags = this.generateHashtagSuggestions(context);
      if (suggestedHashtags.length > 0) {
        changes.push({
          type: 'formatting',
          description: `Consider adding ${optimalCount} relevant hashtags`,
          before: 'No hashtags',
          after: `Suggested: ${suggestedHashtags.slice(0, optimalCount).join(' ')}`,
          impact: 'low',
        });
      }
    }

    return {
      optimizedContent,
      changes,
      confidence: 0.8,
      metadata: this.calculateContentMetrics(optimizedContent),
    };
  }

  private async applyStructureOptimization(
    content: string,
    context: OptimizationContext
  ): Promise<OptimizationResult> {
    const changes: OptimizationChange[] = [];
    let optimizedContent = content;
    
    const platformSpec = this.platformSpecs.get(context.platform);
    if (!platformSpec) {
      return { optimizedContent, changes, confidence: 1, metadata: this.calculateContentMetrics(content) };
    }

    const currentStructure = this.analyzeContentStructure(content);
    const preferredStructure = platformSpec.preferredStructure;

    // Check if content has a strong opening hook
    if (!this.hasHook(content) && preferredStructure.includes('hook')) {
      changes.push({
        type: 'structure',
        description: 'Content could benefit from a stronger opening hook',
        before: 'Weak or missing hook',
        after: 'Add question, statistic, or compelling statement',
        impact: 'high',
      });
    }

    // Check for call-to-action
    if (!this.hasCTA(content) && preferredStructure.includes('cta')) {
      changes.push({
        type: 'structure',
        description: 'Content missing call-to-action',
        before: 'No clear CTA',
        after: 'Add engagement question or action request',
        impact: 'medium',
      });
    }

    // Check paragraph structure
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    if (paragraphs.length === 1 && content.length > 500) {
      changes.push({
        type: 'structure',
        description: 'Content would benefit from paragraph breaks',
        before: 'Single large paragraph',
        after: 'Break into 2-3 paragraphs for readability',
        impact: 'medium',
      });
    }

    return {
      optimizedContent,
      changes,
      confidence: 0.7,
      metadata: this.calculateContentMetrics(optimizedContent),
    };
  }

  private async applyNorwegianCulturalOptimization(
    content: string,
    context: OptimizationContext
  ): Promise<OptimizationResult> {
    if (context.language !== 'no') {
      return { 
        optimizedContent: content, 
        changes: [], 
        confidence: 1, 
        metadata: this.calculateContentMetrics(content) 
      };
    }

    const changes: OptimizationChange[] = [];
    let optimizedContent = content;

    // Norwegian business culture adjustments
    const norwegianPatterns = {
      // Replace overly direct language with more modest expressions
      directToModest: [
        { from: /jeg er den beste/gi, to: 'jeg har god erfaring med', reason: 'Norwegian modesty culture' },
        { from: /dette er revolusjonerende/gi, to: 'dette kan være nyttig', reason: 'Avoid hyperbole' },
      ],
      // Add Norwegian business courtesy
      businessCourtesy: [
        { pattern: /^(?!.*takk|tusen|mvh)/i, suggestion: 'Consider adding Norwegian courtesy phrases' },
      ],
    };

    // Apply modest language adjustments
    norwegianPatterns.directToModest.forEach(pattern => {
      if (pattern.from.test(optimizedContent)) {
        const before = optimizedContent;
        optimizedContent = optimizedContent.replace(pattern.from, pattern.to);
        
        changes.push({
          type: 'cultural',
          description: `Adjusted for ${pattern.reason}`,
          before: before.match(pattern.from)?.[0] || 'Direct language',
          after: pattern.to,
          impact: 'medium',
        });
      }
    });

    // Check for Norwegian business context
    if (context.culturalContext?.market === 'norway') {
      // Ensure appropriate formality level
      const formalityLevel = context.culturalContext.formalityLevel || 'neutral';
      
      if (formalityLevel === 'formal' && !this.hasNorwegianFormality(content)) {
        changes.push({
          type: 'cultural',
          description: 'Consider more formal Norwegian business language',
          before: 'Informal tone',
          after: 'Use "De/Dem" and formal expressions',
          impact: 'medium',
        });
      }
    }

    return {
      optimizedContent,
      changes,
      confidence: 0.8,
      metadata: this.calculateContentMetrics(optimizedContent),
    };
  }

  private async applyToneOptimization(
    content: string,
    context: OptimizationContext
  ): Promise<OptimizationResult> {
    const changes: OptimizationChange[] = [];
    let optimizedContent = content;
    
    const platformSpec = this.platformSpecs.get(context.platform);
    const targetTone = context.tone;

    // Check if current tone matches target
    const currentToneScore = this.analyzeTone(content);
    const toneAlignment = this.calculateToneAlignment(currentToneScore, targetTone);

    if (toneAlignment < 0.7) {
      changes.push({
        type: 'tone',
        description: `Tone adjustment needed for ${targetTone} style`,
        before: `Current tone score: ${currentToneScore.dominant}`,
        after: `Target tone: ${targetTone}`,
        impact: 'medium',
      });
    }

    // Platform-specific tone adjustments
    if (platformSpec) {
      const preferredTones = platformSpec.tonePreferences;
      if (!preferredTones.includes(targetTone)) {
        changes.push({
          type: 'tone',
          description: `Consider ${preferredTones[0]} tone for ${context.platform}`,
          before: targetTone,
          after: preferredTones[0],
          impact: 'low',
        });
      }
    }

    return {
      optimizedContent,
      changes,
      confidence: 0.6,
      metadata: this.calculateContentMetrics(optimizedContent),
    };
  }

  private async applyCTAOptimization(
    content: string,
    context: OptimizationContext
  ): Promise<OptimizationResult> {
    const changes: OptimizationChange[] = [];
    let optimizedContent = content;
    
    const hasCTA = this.hasCTA(content);
    const platformSpec = this.platformSpecs.get(context.platform);

    if (!hasCTA && platformSpec?.preferredStructure.includes('cta')) {
      const ctaSuggestions = this.generateCTASuggestions(context);
      
      changes.push({
        type: 'structure',
        description: 'Add call-to-action to increase engagement',
        before: 'No CTA',
        after: `Suggested: ${ctaSuggestions[0]}`,
        impact: 'high',
      });
    }

    return {
      optimizedContent,
      changes,
      confidence: 0.8,
      metadata: this.calculateContentMetrics(optimizedContent),
    };
  }

  /**
   * Helper methods
   */

  private inferPlatform(contentType: string): string {
    const platformMap: Record<string, string> = {
      'linkedin-post': 'linkedin',
      'twitter-thread': 'twitter',
      'blog-post': 'blog',
      'email': 'email',
      'social-post': 'linkedin',
    };
    
    return platformMap[contentType] || 'linkedin';
  }

  private getApplicableRules(context: OptimizationContext, skipRules?: string[]): OptimizationRule[] {
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => {
        // Skip rules in skipRules array
        if (skipRules?.includes(rule.id)) return false;
        
        // Check platform match
        if (rule.platform !== 'all' && rule.platform !== context.platform) return false;
        
        // Check content type match
        if (rule.contentType !== 'all' && rule.contentType !== context.contentType) return false;
        
        // Check language match
        if (rule.language && rule.language !== context.language) return false;
        
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
    
    return applicableRules;
  }

  private intelligentTruncate(content: string, targetLength: number): string {
    if (content.length <= targetLength) return content;
    
    // Try to truncate at sentence boundaries
    const sentences = content.split(/[.!?]+/);
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length <= targetLength - 10) { // Leave room for ellipsis
        truncated += sentence + '.';
      } else {
        break;
      }
    }
    
    // If we couldn't build a good truncation, just cut at word boundary
    if (truncated.length < targetLength * 0.7) {
      const words = content.split(' ');
      truncated = '';
      
      for (const word of words) {
        if ((truncated + ' ' + word).length <= targetLength - 3) {
          truncated += (truncated ? ' ' : '') + word;
        } else {
          break;
        }
      }
      truncated += '...';
    }
    
    return truncated;
  }

  private extractHashtags(content: string): string[] {
    const hashtags = content.match(/#\w+/g);
    return hashtags || [];
  }

  private generateHashtagSuggestions(context: OptimizationContext): string[] {
    const suggestions: Record<string, string[]> = {
      'linkedin': ['#LinkedIn', '#Professional', '#Business', '#Career', '#Leadership'],
      'twitter': ['#Tech', '#Innovation', '#Business', '#Digital', '#Future'],
      'blog': ['#Blog', '#Content', '#Writing', '#Digital', '#Marketing'],
    };
    
    const platformSuggestions = suggestions[context.platform] || suggestions['linkedin'];
    
    // Add language-specific suggestions
    if (context.language === 'no') {
      return ['#Norge', '#Business', '#Profesjonell', '#Karriere', '#Lederskap'];
    }
    
    return platformSuggestions;
  }

  private analyzeContentStructure(content: string): string[] {
    const structure: string[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      const firstLine = lines[0];
      const lastLine = lines[lines.length - 1];
      
      // Hook detection
      if (firstLine.includes('?') || firstLine.toLowerCase().includes('imagine')) {
        structure.push('hook');
      }
      
      // CTA detection
      if (lastLine.includes('?') || lastLine.toLowerCase().includes('comment') || lastLine.includes('👉')) {
        structure.push('cta');
      }
      
      // List detection
      if (content.includes('1.') || content.includes('•')) {
        structure.push('list');
      }
    }
    
    return structure;
  }

  private hasHook(content: string): boolean {
    const lines = content.split('\n');
    if (lines.length === 0) return false;
    
    const firstLine = lines[0].toLowerCase();
    return firstLine.includes('?') || 
           firstLine.includes('imagine') ||
           firstLine.includes('what if') ||
           firstLine.includes('did you know');
  }

  private hasCTA(content: string): boolean {
    const ctaPatterns = [
      /what do you think/i,
      /comment below/i,
      /share your/i,
      /let me know/i,
      /👉/,
      /⬇️/,
    ];
    
    return ctaPatterns.some(pattern => pattern.test(content));
  }

  private hasNorwegianFormality(content: string): boolean {
    const formalPatterns = [
      /\bDe\b/,
      /\bDem\b/,
      /\bDeres\b/,
      /med vennlig hilsen/i,
      /takk for/i,
    ];
    
    return formalPatterns.some(pattern => pattern.test(content));
  }

  private analyzeTone(content: string): { dominant: string; confidence: number } {
    // Simple tone analysis - in production, this could use ML
    const toneWords = {
      professional: ['business', 'strategy', 'professional', 'industry', 'expertise'],
      casual: ['hey', 'awesome', 'cool', 'super', 'yeah'],
      formal: ['furthermore', 'moreover', 'consequently', 'therefore', 'accordingly'],
      friendly: ['great', 'wonderful', 'amazing', 'fantastic', 'love'],
    };
    
    const scores: Record<string, number> = {};
    const contentLower = content.toLowerCase();
    
    Object.entries(toneWords).forEach(([tone, words]) => {
      scores[tone] = words.reduce((count, word) => {
        return count + (contentLower.split(word).length - 1);
      }, 0);
    });
    
    const dominant = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
    
    const confidence = scores[dominant] / content.split(' ').length;
    
    return { dominant, confidence };
  }

  private calculateToneAlignment(currentTone: { dominant: string; confidence: number }, targetTone: string): number {
    if (currentTone.dominant === targetTone) {
      return currentTone.confidence;
    }
    
    // Partial matches
    const toneCompatibility: Record<string, string[]> = {
      professional: ['formal', 'business'],
      casual: ['friendly', 'conversational'],
      formal: ['professional'],
      friendly: ['casual', 'conversational'],
    };
    
    if (toneCompatibility[targetTone]?.includes(currentTone.dominant)) {
      return currentTone.confidence * 0.7;
    }
    
    return 0.3;
  }

  private generateCTASuggestions(context: OptimizationContext): string[] {
    const suggestions: Record<string, string[]> = {
      linkedin: [
        'What\'s your experience with this?',
        'Share your thoughts in the comments.',
        'What would you add to this list?',
      ],
      twitter: [
        'What do you think?',
        'RT if you agree!',
        'Your thoughts? 👇',
      ],
      blog: [
        'What\'s your take on this topic?',
        'Share this post if you found it helpful.',
        'Leave a comment with your experience.',
      ],
    };
    
    const platformSuggestions = suggestions[context.platform] || suggestions['linkedin'];
    
    // Add Norwegian suggestions
    if (context.language === 'no') {
      return [
        'Hva tenker du om dette?',
        'Del dine tanker i kommentarene.',
        'Hva ville du lagt til?',
      ];
    }
    
    return platformSuggestions;
  }

  private calculateOverallConfidence(changes: OptimizationChange[]): number {
    if (changes.length === 0) return 1;
    
    const impactWeights = { low: 0.3, medium: 0.6, high: 1.0 };
    const totalWeight = changes.reduce((sum, change) => sum + impactWeights[change.impact], 0);
    
    return Math.min(0.95, totalWeight / changes.length);
  }

  private calculateContentMetrics(content: string): OptimizationResult['metadata'] {
    const words = content.trim().split(/\s+/).length;
    const hashtags = (content.match(/#\w+/g) || []).length;
    const emojis = (content.match(/[\u{1f600}-\u{1f64f}]|[\u{1f300}-\u{1f5ff}]|[\u{1f680}-\u{1f6ff}]/gu) || []).length;
    
    return {
      character_count: content.length,
      word_count: words,
      hashtag_count: hashtags,
      emoji_count: emojis,
      reading_time_seconds: Math.ceil(words / 200 * 60), // 200 WPM
      engagement_score: this.calculateEngagementScore(content),
    };
  }

  private calculateEngagementScore(content: string): number {
    let score = 0.5; // Base score
    
    // Length factor
    const optimalLength = 1200;
    const lengthFactor = 1 - Math.abs(content.length - optimalLength) / optimalLength;
    score += lengthFactor * 0.2;
    
    // Structure factors
    if (this.hasHook(content)) score += 0.15;
    if (this.hasCTA(content)) score += 0.15;
    
    // Hashtag factor
    const hashtagCount = this.extractHashtags(content).length;
    if (hashtagCount >= 2 && hashtagCount <= 4) score += 0.1;
    
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Public utility methods
   */

  public updateConfig(newConfig: Partial<OptimizeFunctionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public addCustomRule(rule: OptimizationRule): void {
    this.rules.set(rule.id, rule);
  }

  public getAvailableRules(): OptimizationRule[] {
    return Array.from(this.rules.values());
  }

  public getSupportedPlatforms(): string[] {
    return Array.from(this.platformSpecs.keys());
  }
}

// Platform specification interface
interface PlatformSpecification {
  name: string;
  maxCharacters: number;
  optimalCharacters: { min: number; max: number };
  maxHashtags: number;
  optimalHashtags: number;
  supportsEmojis: boolean;
  preferredStructure: string[];
  tonePreferences: string[];
  formatPreferences: string[];
}

// Export singleton instance
export const optimizeFunction = OptimizeFunction.getInstance();