/**
 * PatternDB - Vector-based Pattern Learning and Similarity Search
 * Implements vector embeddings for pattern matching and user preference learning
 */

import { EventEmitter } from 'events';
import { LanguageAwareContentRequest, SupportedLanguage } from '../types/language-aware-request';
import { createClient } from '@supabase/supabase-js';

// Pattern types from database schema
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

export interface ContentTemplate {
  id: string;
  name: string;
  type: string;
  language: SupportedLanguage;
  content: string;
  pattern_data: Record<string, any>;
  usage_count: number;
  success_rate: number;
  created_at: Date;
  updated_at: Date;
}

export interface SimilarityMatch {
  pattern: UserPattern;
  similarity_score: number;
  confidence: number;
  reason: string[];
}

export interface PatternEmbedding {
  id: string;
  pattern_id: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface PatternDBConfig {
  supabaseUrl: string;
  supabaseKey: string;
  openaiApiKey?: string;
  embeddingModel: string;
  similarityThreshold: number;
  maxResults: number;
  cacheSize: number;
}

export class PatternDB extends EventEmitter {
  private static instance: PatternDB;
  private config: PatternDBConfig;
  private supabase: any;
  private embeddingCache: Map<string, number[]>;
  private patternCache: Map<string, UserPattern[]>;
  
  private constructor(config: PatternDBConfig) {
    super();
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.embeddingCache = new Map();
    this.patternCache = new Map();
    
    // Setup cleanup intervals
    this.setupCacheCleanup();
  }

  public static getInstance(config?: PatternDBConfig): PatternDB {
    if (!PatternDB.instance) {
      if (!config) {
        throw new Error('PatternDB config required for first initialization');
      }
      PatternDB.instance = new PatternDB(config);
    }
    return PatternDB.instance;
  }

  /**
   * Find similar patterns using vector similarity search
   */
  public async findSimilarPatterns(
    request: LanguageAwareContentRequest,
    userId?: string,
    options?: {
      patternTypes?: PatternType[];
      minConfidence?: number;
      maxResults?: number;
    }
  ): Promise<SimilarityMatch[]> {
    const startTime = performance.now();
    
    try {
      // Generate embedding for the current request
      const requestEmbedding = await this.generateRequestEmbedding(request);
      
      // Get user patterns (with caching)
      const patterns = await this.getUserPatterns(userId, options?.patternTypes);
      
      if (patterns.length === 0) {
        return [];
      }
      
      // Calculate similarities
      const similarities = await Promise.all(
        patterns.map(async (pattern) => {
          const patternEmbedding = await this.getPatternEmbedding(pattern);
          const similarity = this.calculateCosineSimilarity(requestEmbedding, patternEmbedding);
          
          if (similarity >= this.config.similarityThreshold) {
            return {
              pattern,
              similarity_score: similarity,
              confidence: pattern.confidence_score,
              reason: this.generateSimilarityReason(request, pattern),
            };
          }
          return null;
        })
      );
      
      // Filter and sort results
      const validMatches = similarities
        .filter((match): match is SimilarityMatch => match !== null)
        .filter(match => !options?.minConfidence || match.confidence >= options.minConfidence)
        .sort((a, b) => {
          // Sort by weighted score: similarity * confidence
          const scoreA = a.similarity_score * a.confidence;
          const scoreB = b.similarity_score * b.confidence;
          return scoreB - scoreA;
        })
        .slice(0, options?.maxResults || this.config.maxResults);
      
      const duration = performance.now() - startTime;
      
      this.emit('similarity:search', {
        userId,
        requestType: request.type,
        patternsSearched: patterns.length,
        matchesFound: validMatches.length,
        duration,
      });
      
      return validMatches;
      
    } catch (error) {
      this.emit('similarity:error', { userId, error });
      throw error;
    }
  }

  /**
   * Learn from successful content to create/update patterns
   */
  public async learnFromSuccess(
    userId: string,
    request: LanguageAwareContentRequest,
    response: any,
    engagement: {
      likes?: number;
      comments?: number;
      shares?: number;
      total?: number;
    }
  ): Promise<UserPattern> {
    const totalEngagement = engagement.total || 
      (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0);
    
    // Only learn from successful posts (>500 engagement as per spec)
    if (totalEngagement <= 500) {
      return null;
    }
    
    try {
      // Extract pattern data from successful request/response
      const patternData = {
        type: 'successful_post',
        purpose: request.purpose,
        format: request.format,
        tone: request.tone,
        engagement: totalEngagement,
        character_range: this.getCharacterRange(response.content),
        structure: this.analyzeContentStructure(response.content),
        language: request.outputLanguage,
        cultural_context: request.culturalContext,
        keywords: request.keywords,
        target_audience: request.targetAudience,
        posting_time: new Date().getHours(),
        hashtag_count: this.countHashtags(response.content),
        emoji_usage: this.hasEmojis(response.content),
      };
      
      // Check if similar pattern already exists
      const existingPattern = await this.findExistingPattern(userId, patternData);
      
      if (existingPattern) {
        // Update existing pattern
        return this.reinforcePattern(existingPattern, patternData, totalEngagement);
      } else {
        // Create new pattern
        return this.createPattern(userId, 'successful_post', patternData);
      }
      
    } catch (error) {
      this.emit('learning:error', { userId, error });
      throw error;
    }
  }

  /**
   * Generate smart defaults based on user patterns
   */
  public async generateSmartDefaults(
    userId: string,
    partialRequest: Partial<LanguageAwareContentRequest>
  ): Promise<{
    purpose?: string;
    format?: string;
    tone?: string;
    targetAudience?: string;
    confidence: number;
    patterns_used: number;
  }> {
    try {
      // Get top 3 most confident patterns
      const { data: topPatterns } = await this.supabase
        .from('user_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('pattern_type', 'successful_post')
        .order('confidence_score', { ascending: false })
        .limit(3);
      
      if (!topPatterns || topPatterns.length === 0) {
        return { confidence: 0, patterns_used: 0 };
      }
      
      // Aggregate patterns to generate defaults
      const aggregated = this.aggregatePatterns(topPatterns);
      
      const defaults = {
        purpose: aggregated.purpose,
        format: aggregated.format,
        tone: aggregated.tone,
        targetAudience: aggregated.target_audience,
        confidence: aggregated.confidence,
        patterns_used: topPatterns.length,
      };
      
      this.emit('defaults:generated', { userId, defaults, patterns_used: topPatterns.length });
      
      return defaults;
      
    } catch (error) {
      this.emit('defaults:error', { userId, error });
      return { confidence: 0, patterns_used: 0 };
    }
  }

  /**
   * Private helper methods
   */

  private async generateRequestEmbedding(request: LanguageAwareContentRequest): Promise<number[]> {
    // Create a text representation of the request for embedding
    const requestText = [
      request.topic,
      request.purpose,
      request.format,
      request.tone,
      request.targetAudience,
      ...(request.keywords || []),
    ].filter(Boolean).join(' ');
    
    return this.generateEmbedding(requestText);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.hashText(text);
    
    // Check cache first
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }
    
    try {
      // Use mock embeddings in development
      if (!this.config.openaiApiKey || this.config.openaiApiKey === 'sk-mock-development-key') {
        const mockEmbedding = this.generateMockEmbedding(text);
        this.embeddingCache.set(cacheKey, mockEmbedding);
        return mockEmbedding;
      }
      
      // In production, use OpenAI embeddings
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
      
      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
      
    } catch (error) {
      // Fallback to mock embedding on error
      const mockEmbedding = this.generateMockEmbedding(text);
      this.embeddingCache.set(cacheKey, mockEmbedding);
      return mockEmbedding;
    }
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate deterministic mock embedding based on text content
    const dimension = 1536; // OpenAI ada-002 dimension
    const embedding = new Array(dimension);
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const seed = Math.abs(hash);
    const rng = this.seededRandom(seed);
    
    for (let i = 0; i < dimension; i++) {
      embedding[i] = (rng() - 0.5) * 2; // Range [-1, 1]
    }
    
    // Normalize the vector
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

  private async getPatternEmbedding(pattern: UserPattern): Promise<number[]> {
    const embeddingId = `pattern_${pattern.id}`;
    
    if (this.embeddingCache.has(embeddingId)) {
      return this.embeddingCache.get(embeddingId)!;
    }
    
    // Create text representation of the pattern
    const patternText = [
      pattern.pattern_data.purpose,
      pattern.pattern_data.format,
      pattern.pattern_data.tone,
      pattern.pattern_data.target_audience,
      ...(pattern.pattern_data.keywords || []),
    ].filter(Boolean).join(' ');
    
    const embedding = await this.generateEmbedding(patternText);
    this.embeddingCache.set(embeddingId, embedding);
    
    return embedding;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async getUserPatterns(userId?: string, patternTypes?: PatternType[]): Promise<UserPattern[]> {
    if (!userId) return [];
    
    const cacheKey = `user_${userId}_${patternTypes?.join(',') || 'all'}`;
    
    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey)!;
    }
    
    let query = this.supabase
      .from('user_patterns')
      .select('*')
      .eq('user_id', userId)
      .gte('confidence_score', 0.5) // Minimum confidence threshold
      .order('confidence_score', { ascending: false });
    
    if (patternTypes && patternTypes.length > 0) {
      query = query.in('pattern_type', patternTypes);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    const patterns = data || [];
    this.patternCache.set(cacheKey, patterns);
    
    return patterns;
  }

  private generateSimilarityReason(request: LanguageAwareContentRequest, pattern: UserPattern): string[] {
    const reasons: string[] = [];
    const data = pattern.pattern_data;
    
    if (request.purpose === data.purpose) {
      reasons.push(`Same purpose: ${request.purpose}`);
    }
    
    if (request.format === data.format) {
      reasons.push(`Same format: ${request.format}`);
    }
    
    if (request.tone === data.tone) {
      reasons.push(`Same tone: ${request.tone}`);
    }
    
    if (request.targetAudience === data.target_audience) {
      reasons.push(`Same target audience: ${request.targetAudience}`);
    }
    
    if (request.outputLanguage === data.language) {
      reasons.push(`Same language: ${request.outputLanguage}`);
    }
    
    if (data.engagement > 1000) {
      reasons.push(`High engagement: ${data.engagement}`);
    }
    
    return reasons;
  }

  private getCharacterRange(content: string): [number, number] {
    const length = content.length;
    const rangeSize = 200; // Group into ranges of 200 characters
    const lower = Math.floor(length / rangeSize) * rangeSize;
    const upper = lower + rangeSize;
    return [lower, upper];
  }

  private analyzeContentStructure(content: string): string[] {
    const structure: string[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      // Simple heuristic structure analysis
      if (lines[0].endsWith('?') || lines[0].includes('?')) {
        structure.push('hook');
      }
      
      if (lines.some(line => line.includes('story') || line.includes('when'))) {
        structure.push('story');
      }
      
      if (lines.some(line => line.includes('lesson') || line.includes('learned'))) {
        structure.push('lesson');
      }
      
      if (lines[lines.length - 1].includes('👉') || lines[lines.length - 1].includes('comment')) {
        structure.push('cta');
      }
    }
    
    return structure.length > 0 ? structure : ['generic'];
  }

  private countHashtags(content: string): number {
    const hashtags = content.match(/#\w+/g);
    return hashtags ? hashtags.length : 0;
  }

  private hasEmojis(content: string): boolean {
    const emojiRegex = /[\u{1f600}-\u{1f64f}]|[\u{1f300}-\u{1f5ff}]|[\u{1f680}-\u{1f6ff}]|[\u{1f1e0}-\u{1f1ff}]|[\u{2600}-\u{26ff}]|[\u{2700}-\u{27bf}]/u;
    return emojiRegex.test(content);
  }

  private async findExistingPattern(userId: string, patternData: any): Promise<UserPattern | null> {
    const { data, error } = await this.supabase
      .from('user_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('pattern_type', 'successful_post')
      .eq('pattern_data->>purpose', patternData.purpose)
      .eq('pattern_data->>format', patternData.format)
      .eq('pattern_data->>tone', patternData.tone)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    return data || null;
  }

  private async reinforcePattern(
    existingPattern: UserPattern,
    newPatternData: any,
    engagement: number
  ): Promise<UserPattern> {
    const newSampleSize = existingPattern.sample_size + 1;
    const oldAvgEngagement = existingPattern.pattern_data.engagement || 0;
    const newAvgEngagement = (oldAvgEngagement * existingPattern.sample_size + engagement) / newSampleSize;
    
    // Update confidence score based on sample size and consistency
    const newConfidence = Math.min(0.95, 0.5 + (newSampleSize * 0.1));
    
    const updatedPatternData = {
      ...existingPattern.pattern_data,
      engagement: Math.round(newAvgEngagement),
      sample_size: newSampleSize,
    };
    
    const { data, error } = await this.supabase
      .from('user_patterns')
      .update({
        pattern_data: updatedPatternData,
        confidence_score: newConfidence,
        sample_size: newSampleSize,
        last_reinforced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPattern.id)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Clear cache
    this.clearUserPatternCache(existingPattern.user_id);
    
    this.emit('pattern:reinforced', { pattern: data, newSampleSize, newConfidence });
    
    return data;
  }

  private async createPattern(
    userId: string,
    patternType: PatternType,
    patternData: any
  ): Promise<UserPattern> {
    const { data, error } = await this.supabase
      .from('user_patterns')
      .insert({
        user_id: userId,
        pattern_type: patternType,
        pattern_data: patternData,
        confidence_score: 0.6, // Initial confidence
        sample_size: 1,
      })
      .single();
    
    if (error) {
      throw error;
    }
    
    // Clear cache
    this.clearUserPatternCache(userId);
    
    this.emit('pattern:created', { pattern: data });
    
    return data;
  }

  private aggregatePatterns(patterns: UserPattern[]): any {
    const weights = patterns.map(p => p.confidence_score * p.sample_size);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) {
      return { confidence: 0 };
    }
    
    // Weighted mode calculation for categorical fields
    const purposeVotes: Record<string, number> = {};
    const formatVotes: Record<string, number> = {};
    const toneVotes: Record<string, number> = {};
    const audienceVotes: Record<string, number> = {};
    
    patterns.forEach((pattern, index) => {
      const weight = weights[index];
      const data = pattern.pattern_data;
      
      purposeVotes[data.purpose] = (purposeVotes[data.purpose] || 0) + weight;
      formatVotes[data.format] = (formatVotes[data.format] || 0) + weight;
      toneVotes[data.tone] = (toneVotes[data.tone] || 0) + weight;
      audienceVotes[data.target_audience] = (audienceVotes[data.target_audience] || 0) + weight;
    });
    
    return {
      purpose: this.getModeFromVotes(purposeVotes),
      format: this.getModeFromVotes(formatVotes),
      tone: this.getModeFromVotes(toneVotes),
      target_audience: this.getModeFromVotes(audienceVotes),
      confidence: Math.min(0.95, totalWeight / (patterns.length * 10)),
    };
  }

  private getModeFromVotes(votes: Record<string, number>): string | undefined {
    let maxVotes = 0;
    let mode: string | undefined;
    
    for (const [option, voteCount] of Object.entries(votes)) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        mode = option;
      }
    }
    
    return mode;
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private clearUserPatternCache(userId: string): void {
    const keysToDelete = Array.from(this.patternCache.keys()).filter(key => 
      key.startsWith(`user_${userId}_`)
    );
    
    keysToDelete.forEach(key => this.patternCache.delete(key));
  }

  private setupCacheCleanup(): void {
    // Clear embeddings cache every 30 minutes
    setInterval(() => {
      if (this.embeddingCache.size > this.config.cacheSize) {
        this.embeddingCache.clear();
        this.emit('cache:cleaned', { type: 'embeddings' });
      }
    }, 30 * 60 * 1000);
    
    // Clear pattern cache every 15 minutes
    setInterval(() => {
      if (this.patternCache.size > 100) {
        this.patternCache.clear();
        this.emit('cache:cleaned', { type: 'patterns' });
      }
    }, 15 * 60 * 1000);
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Test database connection
      const { data, error } = await this.supabase
        .from('user_patterns')
        .select('count')
        .limit(1);
      
      const dbHealthy = !error;
      const cacheSize = this.embeddingCache.size + this.patternCache.size;
      
      return {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        details: {
          database: dbHealthy,
          cache_size: cacheSize,
          embedding_model: this.config.embeddingModel,
          similarity_threshold: this.config.similarityThreshold,
        },
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }

  /**
   * Get statistics
   */
  public getStats(): {
    embedding_cache_size: number;
    pattern_cache_size: number;
    total_memory_mb: number;
  } {
    return {
      embedding_cache_size: this.embeddingCache.size,
      pattern_cache_size: this.patternCache.size,
      total_memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }
}