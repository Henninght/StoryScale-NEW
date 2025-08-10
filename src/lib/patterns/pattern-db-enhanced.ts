/**
 * Enhanced PatternDB with Supabase pgvector Integration
 * Combines pattern learning with vector similarity search using Supabase's native capabilities
 */

import { EventEmitter } from 'events';
import { LanguageAwareContentRequest, SupportedLanguage } from '../types/language-aware-request';
import { SupabaseVectorDB } from './vector-db-supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type PatternType = 'successful_post' | 'template' | 'style_preference';

export interface UserPattern {
  id: string;
  user_id: string;
  pattern_type: PatternType;
  pattern_data: Record<string, any>;
  confidence_score: number;
  sample_size: number;
  last_reinforced: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PatternMatch {
  pattern: UserPattern;
  similarity: number;
  confidence: number;
  reasons: string[];
}

export interface PatternDBConfig {
  supabaseUrl: string;
  supabaseKey: string;
  openaiApiKey?: string;
  embeddingModel?: string;
  similarityThreshold?: number;
  minConfidenceScore?: number;
  minSampleSize?: number;
}

export class EnhancedPatternDB extends EventEmitter {
  private static instance: EnhancedPatternDB;
  private config: PatternDBConfig;
  private supabase: SupabaseClient;
  private vectorDB: SupabaseVectorDB;
  private embeddingCache: Map<string, number[]>;
  
  private constructor(config: PatternDBConfig) {
    super();
    this.config = {
      embeddingModel: 'text-embedding-ada-002',
      similarityThreshold: 0.7,
      minConfidenceScore: 0.7,
      minSampleSize: 3,
      ...config
    };
    
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.vectorDB = new SupabaseVectorDB({
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
    });
    
    this.embeddingCache = new Map();
    
    // Initialize vector DB
    this.vectorDB.initialize().catch(console.error);
  }

  public static getInstance(config?: PatternDBConfig): EnhancedPatternDB {
    if (!EnhancedPatternDB.instance) {
      if (!config) {
        throw new Error('PatternDB config required for first initialization');
      }
      EnhancedPatternDB.instance = new EnhancedPatternDB(config);
    }
    return EnhancedPatternDB.instance;
  }

  /**
   * Mine patterns from successful content (engagement > 500)
   */
  public async mineSuccessfulContent(
    userId: string,
    documentId: string,
    content: string,
    request: LanguageAwareContentRequest,
    engagement: {
      likes?: number;
      comments?: number;
      shares?: number;
      total?: number;
    }
  ): Promise<UserPattern | null> {
    const totalEngagement = engagement.total || 
      (engagement.likes || 0) + (engagement.comments || 0) * 2 + (engagement.shares || 0) * 3;
    
    // Only learn from successful posts (>500 engagement as per spec)
    if (totalEngagement <= 500) {
      this.emit('mining:skipped', { 
        userId, 
        documentId, 
        engagement: totalEngagement,
        reason: 'Engagement below threshold (500)' 
      });
      return null;
    }
    
    try {
      // Extract comprehensive pattern data
      const patternData = {
        type: 'successful_post',
        document_id: documentId,
        purpose: request.purpose,
        format: request.format,
        tone: request.tone,
        engagement: totalEngagement,
        engagement_breakdown: {
          likes: engagement.likes || 0,
          comments: engagement.comments || 0,
          shares: engagement.shares || 0,
        },
        character_count: content.length,
        character_range: this.getCharacterRange(content.length),
        structure: this.analyzeContentStructure(content),
        language: request.outputLanguage,
        cultural_context: request.culturalContext,
        keywords: request.keywords || [],
        target_audience: request.targetAudience,
        posting_time: new Date().toISOString(),
        hashtag_count: this.countHashtags(content),
        emoji_usage: this.hasEmojis(content),
        question_hook: content.startsWith('?') || content.split('\n')[0].includes('?'),
        has_statistics: /\d+%|\d+\/\d+|\d+ out of \d+/i.test(content),
        has_list: /^\d+\.|^-\s|^•\s/m.test(content),
      };
      
      // Check for existing similar pattern
      const existingPattern = await this.findSimilarExistingPattern(userId, patternData);
      
      let pattern: UserPattern;
      
      if (existingPattern) {
        // Reinforce existing pattern
        pattern = await this.reinforcePattern(existingPattern.id, totalEngagement);
        
        this.emit('pattern:reinforced', {
          userId,
          patternId: pattern.id,
          oldConfidence: existingPattern.confidence_score,
          newConfidence: pattern.confidence_score,
          sampleSize: pattern.sample_size,
        });
      } else {
        // Create new pattern
        pattern = await this.createNewPattern(userId, 'successful_post', patternData);
        
        this.emit('pattern:created', {
          userId,
          patternId: pattern.id,
          patternType: 'successful_post',
          engagement: totalEngagement,
        });
      }
      
      // Generate and store embedding for the pattern
      await this.storePatternEmbedding(pattern, content);
      
      return pattern;
      
    } catch (error) {
      this.emit('mining:error', { userId, documentId, error });
      throw error;
    }
  }

  /**
   * Generate template from user patterns
   */
  public async generateTemplate(
    userId: string,
    patternIds?: string[]
  ): Promise<any> {
    try {
      // Get patterns to use for template generation
      let patterns: UserPattern[];
      
      if (patternIds && patternIds.length > 0) {
        const { data } = await this.supabase
          .from('user_patterns')
          .select('*')
          .in('id', patternIds)
          .eq('user_id', userId);
        patterns = data || [];
      } else {
        // Get top 3 patterns with confidence scoring
        patterns = await this.getTopUserPatterns(userId, 3);
      }
      
      if (patterns.length < this.config.minSampleSize!) {
        throw new Error(`Need at least ${this.config.minSampleSize} patterns to generate template`);
      }
      
      // Analyze patterns to extract common elements
      const templateStructure = this.analyzePatternCommonalities(patterns);
      
      // Create template
      const template = {
        name: `Auto-generated from ${patterns.length} successful posts`,
        description: `Template based on posts with avg engagement: ${this.calculateAvgEngagement(patterns)}`,
        structure: {
          sections: templateStructure.sections,
          prompts: templateStructure.prompts,
          style_guide: {
            tone: templateStructure.commonTone,
            voice: templateStructure.commonVoice,
            perspective: templateStructure.commonPerspective,
            character_range: templateStructure.characterRange,
          },
          best_practices: templateStructure.bestPractices,
        },
        pattern_ids: patterns.map(p => p.id),
        confidence_score: this.calculateTemplateConfidence(patterns),
      };
      
      // Store template in database
      const { data: savedTemplate, error } = await this.supabase
        .from('templates')
        .insert({
          user_id: userId,
          pattern_id: patterns[0].id, // Link to primary pattern
          name: template.name,
          description: template.description,
          structure: template.structure,
          use_count: 0,
          avg_engagement: this.calculateAvgEngagement(patterns),
          success_rate: 0,
          is_ai_generated: true,
          tags: ['auto-generated', 'pattern-based'],
        })
        .select()
        .single();
      
      if (error) throw error;
      
      this.emit('template:generated', {
        userId,
        templateId: savedTemplate.id,
        patternsUsed: patterns.length,
        confidence: template.confidence_score,
      });
      
      return savedTemplate;
      
    } catch (error) {
      this.emit('template:error', { userId, error });
      throw error;
    }
  }

  /**
   * Build pattern confidence scoring
   */
  public async calculatePatternConfidence(
    pattern: UserPattern,
    additionalEngagement?: number
  ): Promise<number> {
    const baseConfidence = pattern.confidence_score || 0.5;
    const sampleSize = pattern.sample_size || 1;
    
    // Require minimum 3 similar posts for high confidence
    if (sampleSize < this.config.minSampleSize!) {
      return Math.min(baseConfidence, 0.6);
    }
    
    // Calculate confidence based on multiple factors
    const factors = {
      sampleSize: Math.min(sampleSize / 10, 1), // Max at 10 samples
      engagement: this.normalizeEngagement(pattern.pattern_data.engagement || 0),
      recency: this.calculateRecencyScore(pattern.last_reinforced),
      consistency: await this.calculateConsistencyScore(pattern),
    };
    
    // Weighted average of factors
    const weights = {
      sampleSize: 0.3,
      engagement: 0.3,
      recency: 0.2,
      consistency: 0.2,
    };
    
    let confidence = 0;
    for (const [factor, value] of Object.entries(factors)) {
      confidence += value * weights[factor as keyof typeof weights];
    }
    
    // Apply additional engagement boost if provided
    if (additionalEngagement && additionalEngagement > 500) {
      const boost = Math.min((additionalEngagement - 500) / 5000, 0.1); // Max 0.1 boost
      confidence = Math.min(1.0, confidence + boost);
    }
    
    return Number(confidence.toFixed(2));
  }

  /**
   * Add smart defaults that pre-select dropdowns based on top 3 user patterns
   */
  public async getSmartDefaults(
    userId: string,
    context?: Partial<LanguageAwareContentRequest>
  ): Promise<{
    purpose?: string;
    format?: string;
    tone?: string;
    targetAudience?: string;
    language?: SupportedLanguage;
    suggestions: Array<{
      field: string;
      value: string;
      confidence: number;
      reason: string;
    }>;
  }> {
    try {
      // Get top 3 patterns
      const topPatterns = await this.getTopUserPatterns(userId, 3);
      
      if (topPatterns.length === 0) {
        return { suggestions: [] };
      }
      
      // Analyze patterns for most common values
      const aggregated = this.aggregatePatternData(topPatterns);
      
      // Build smart defaults
      const defaults: any = {};
      const suggestions: any[] = [];
      
      // Purpose
      if (aggregated.purpose && aggregated.purpose.confidence >= 0.7) {
        defaults.purpose = aggregated.purpose.value;
        suggestions.push({
          field: 'purpose',
          value: aggregated.purpose.value,
          confidence: aggregated.purpose.confidence,
          reason: `Used in ${aggregated.purpose.count}/${topPatterns.length} successful posts`,
        });
      }
      
      // Format
      if (aggregated.format && aggregated.format.confidence >= 0.7) {
        defaults.format = aggregated.format.value;
        suggestions.push({
          field: 'format',
          value: aggregated.format.value,
          confidence: aggregated.format.confidence,
          reason: `Your most engaging format (avg ${aggregated.format.avgEngagement} engagement)`,
        });
      }
      
      // Tone
      if (aggregated.tone && aggregated.tone.confidence >= 0.7) {
        defaults.tone = aggregated.tone.value;
        suggestions.push({
          field: 'tone',
          value: aggregated.tone.value,
          confidence: aggregated.tone.confidence,
          reason: `Consistent tone across successful posts`,
        });
      }
      
      // Target Audience
      if (aggregated.targetAudience && aggregated.targetAudience.confidence >= 0.7) {
        defaults.targetAudience = aggregated.targetAudience.value;
        suggestions.push({
          field: 'targetAudience',
          value: aggregated.targetAudience.value,
          confidence: aggregated.targetAudience.confidence,
          reason: `Your primary audience segment`,
        });
      }
      
      // Language preference
      if (aggregated.language && aggregated.language.confidence >= 0.7) {
        defaults.language = aggregated.language.value as SupportedLanguage;
        suggestions.push({
          field: 'language',
          value: aggregated.language.value,
          confidence: aggregated.language.confidence,
          reason: `Your preferred content language`,
        });
      }
      
      this.emit('defaults:generated', {
        userId,
        defaults,
        patternsUsed: topPatterns.length,
        suggestions: suggestions.length,
      });
      
      return {
        ...defaults,
        suggestions,
      };
      
    } catch (error) {
      this.emit('defaults:error', { userId, error });
      return { suggestions: [] };
    }
  }

  /**
   * Private helper methods
   */

  private async storePatternEmbedding(pattern: UserPattern, content: string): Promise<void> {
    try {
      // Generate text representation for embedding
      const patternText = this.createPatternText(pattern, content);
      
      // Generate embedding
      const embedding = await this.generateEmbedding(patternText);
      
      // Store in vector database
      await this.vectorDB.upsert([{
        id: pattern.id,
        embedding,
        metadata: {
          pattern_id: pattern.id,
          user_id: pattern.user_id,
          pattern_type: pattern.pattern_type,
          confidence_score: pattern.confidence_score,
          sample_size: pattern.sample_size,
          ...pattern.pattern_data,
        },
      }]);
    } catch (error) {
      console.error('Error storing pattern embedding:', error);
    }
  }

  private createPatternText(pattern: UserPattern, content: string): string {
    // Create rich text representation for better embeddings
    const elements = [
      `Purpose: ${pattern.pattern_data.purpose}`,
      `Format: ${pattern.pattern_data.format}`,
      `Tone: ${pattern.pattern_data.tone}`,
      `Audience: ${pattern.pattern_data.target_audience}`,
      `Language: ${pattern.pattern_data.language}`,
      `Keywords: ${(pattern.pattern_data.keywords || []).join(', ')}`,
      `Engagement: ${pattern.pattern_data.engagement}`,
      `Structure: ${(pattern.pattern_data.structure || []).join(', ')}`,
      // Include a sample of the actual content for context
      `Sample: ${content.substring(0, 200)}`,
    ];
    
    return elements.filter(Boolean).join(' | ');
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.hashText(text);
    
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }
    
    try {
      // In development, use mock embeddings
      if (!this.config.openaiApiKey || this.config.openaiApiKey.startsWith('sk-mock')) {
        const mockEmbedding = this.generateMockEmbedding(text);
        this.embeddingCache.set(cacheKey, mockEmbedding);
        return mockEmbedding;
      }
      
      // Production: Use OpenAI embeddings
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: this.config.embeddingModel,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      this.embeddingCache.set(cacheKey, embedding);
      return embedding;
      
    } catch (error) {
      // Fallback to mock on error
      const mockEmbedding = this.generateMockEmbedding(text);
      this.embeddingCache.set(cacheKey, mockEmbedding);
      return mockEmbedding;
    }
  }

  private generateMockEmbedding(text: string): number[] {
    const dimension = 1536;
    const embedding = new Array(dimension);
    
    // Generate deterministic embedding based on text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    
    const seed = Math.abs(hash);
    const rng = this.seededRandom(seed);
    
    for (let i = 0; i < dimension; i++) {
      embedding[i] = (rng() - 0.5) * 2;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    return `embed_${Math.abs(hash)}`;
  }

  private async findSimilarExistingPattern(
    userId: string,
    patternData: Record<string, any>
  ): Promise<UserPattern | null> {
    const { data } = await this.supabase
      .from('user_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('pattern_type', 'successful_post');
    
    if (!data || data.length === 0) return null;
    
    // Find patterns with similar characteristics
    for (const pattern of data) {
      const similarity = this.calculatePatternSimilarity(pattern.pattern_data, patternData);
      if (similarity >= 0.8) {
        return pattern;
      }
    }
    
    return null;
  }

  private calculatePatternSimilarity(a: any, b: any): number {
    const features = ['purpose', 'format', 'tone', 'target_audience', 'language'];
    let matches = 0;
    
    for (const feature of features) {
      if (a[feature] === b[feature]) matches++;
    }
    
    return matches / features.length;
  }

  private async reinforcePattern(patternId: string, engagement: number): Promise<UserPattern> {
    // Use Supabase RPC function to reinforce pattern
    await this.supabase.rpc('reinforce_pattern', {
      target_pattern_id: patternId,
      engagement_score: engagement,
    });
    
    // Fetch updated pattern
    const { data } = await this.supabase
      .from('user_patterns')
      .select('*')
      .eq('id', patternId)
      .single();
    
    return data;
  }

  private async createNewPattern(
    userId: string,
    patternType: PatternType,
    patternData: Record<string, any>
  ): Promise<UserPattern> {
    const { data, error } = await this.supabase
      .from('user_patterns')
      .insert({
        user_id: userId,
        pattern_type: patternType,
        pattern_data: patternData,
        confidence_score: 0.5, // Start with base confidence
        sample_size: 1,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  private async getTopUserPatterns(userId: string, limit: number = 3): Promise<UserPattern[]> {
    const { data } = await this.supabase.rpc('get_top_user_patterns', {
      target_user_id: userId,
      limit_count: limit,
    });
    
    return data || [];
  }

  private getCharacterRange(length: number): [number, number] {
    const rangeSize = 200;
    const lower = Math.floor(length / rangeSize) * rangeSize;
    return [lower, lower + rangeSize];
  }

  private analyzeContentStructure(content: string): string[] {
    const structure: string[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines[0]?.includes('?')) structure.push('question_hook');
    if (/^\d+\.|^-\s|^•\s/m.test(content)) structure.push('list');
    if (/story|when|once/i.test(content)) structure.push('story');
    if (/lesson|learned|insight/i.test(content)) structure.push('lesson');
    if (/what.*you|share.*thoughts|comment/i.test(content)) structure.push('cta');
    
    return structure;
  }

  private countHashtags(content: string): number {
    const matches = content.match(/#\w+/g);
    return matches ? matches.length : 0;
  }

  private hasEmojis(content: string): boolean {
    return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u.test(content);
  }

  private normalizeEngagement(engagement: number): number {
    // Normalize to 0-1 scale, with 5000 engagement = 1.0
    return Math.min(engagement / 5000, 1);
  }

  private calculateRecencyScore(lastReinforced: Date): number {
    const daysSince = (Date.now() - new Date(lastReinforced).getTime()) / (1000 * 60 * 60 * 24);
    // Decay over 30 days
    return Math.max(0, 1 - (daysSince / 30));
  }

  private async calculateConsistencyScore(pattern: UserPattern): Promise<number> {
    // Check how consistent the pattern's performance has been
    // For now, return a base score based on sample size
    const sampleSize = pattern.sample_size || 1;
    return Math.min(sampleSize / 5, 1); // Max at 5 samples
  }

  private analyzePatternCommonalities(patterns: UserPattern[]): any {
    const analysis: any = {
      sections: [],
      prompts: {},
      commonTone: '',
      commonVoice: '',
      commonPerspective: '',
      characterRange: [0, 0],
      bestPractices: [],
    };
    
    // Extract common sections
    const allSections = patterns.flatMap(p => p.pattern_data.structure || []);
    const sectionCounts = allSections.reduce((acc: any, section: string) => {
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});
    
    analysis.sections = Object.entries(sectionCounts)
      .filter(([_, count]) => count as number >= patterns.length / 2)
      .map(([section]) => section);
    
    // Generate prompts for common sections
    for (const section of analysis.sections) {
      analysis.prompts[section] = this.generateSectionPrompt(section);
    }
    
    // Find common tone
    const tones = patterns.map(p => p.pattern_data.tone).filter(Boolean);
    analysis.commonTone = this.findMostCommon(tones);
    
    // Calculate character range
    const ranges = patterns.map(p => p.pattern_data.character_range).filter(Boolean);
    if (ranges.length > 0) {
      const avgLower = ranges.reduce((sum, r) => sum + r[0], 0) / ranges.length;
      const avgUpper = ranges.reduce((sum, r) => sum + r[1], 0) / ranges.length;
      analysis.characterRange = [Math.floor(avgLower), Math.ceil(avgUpper)];
    }
    
    // Extract best practices
    if (patterns.every(p => p.pattern_data.hashtag_count > 0)) {
      analysis.bestPractices.push('Include 2-3 relevant hashtags');
    }
    if (patterns.every(p => p.pattern_data.emoji_usage)) {
      analysis.bestPractices.push('Use emojis for visual appeal');
    }
    if (patterns.every(p => p.pattern_data.question_hook)) {
      analysis.bestPractices.push('Start with an engaging question');
    }
    
    return analysis;
  }

  private generateSectionPrompt(section: string): string {
    const prompts: Record<string, string> = {
      question_hook: 'Start with a thought-provoking question that resonates with your audience',
      story: 'Share a relevant personal or professional experience',
      list: 'Present key points in a clear, numbered or bulleted list',
      lesson: 'Extract and clearly state the key insight or learning',
      cta: 'End with an engaging call-to-action that encourages interaction',
    };
    
    return prompts[section] || `Add ${section} content`;
  }

  private findMostCommon<T>(items: T[]): T | undefined {
    if (items.length === 0) return undefined;
    
    const counts = items.reduce((acc: Map<T, number>, item) => {
      acc.set(item, (acc.get(item) || 0) + 1);
      return acc;
    }, new Map());
    
    let maxCount = 0;
    let mostCommon: T | undefined;
    
    for (const [item, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    
    return mostCommon;
  }

  private calculateAvgEngagement(patterns: UserPattern[]): number {
    const total = patterns.reduce((sum, p) => sum + (p.pattern_data.engagement || 0), 0);
    return Math.round(total / patterns.length);
  }

  private calculateTemplateConfidence(patterns: UserPattern[]): number {
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence_score, 0) / patterns.length;
    const sampleSizeBonus = Math.min(patterns.length / 10, 0.2); // Up to 0.2 bonus for more patterns
    return Math.min(avgConfidence + sampleSizeBonus, 1);
  }

  private aggregatePatternData(patterns: UserPattern[]): any {
    const aggregated: any = {};
    
    const fields = ['purpose', 'format', 'tone', 'target_audience', 'language'];
    
    for (const field of fields) {
      const values = patterns.map(p => p.pattern_data[field]).filter(Boolean);
      if (values.length === 0) continue;
      
      const mostCommon = this.findMostCommon(values);
      const count = values.filter(v => v === mostCommon).length;
      const avgEngagement = patterns
        .filter(p => p.pattern_data[field] === mostCommon)
        .reduce((sum, p) => sum + (p.pattern_data.engagement || 0), 0) / count;
      
      aggregated[field] = {
        value: mostCommon,
        confidence: count / patterns.length,
        count,
        avgEngagement: Math.round(avgEngagement),
      };
    }
    
    return aggregated;
  }
}