/**
 * Pattern Service - High-level interface for pattern learning and recommendations
 * Integrates PatternDB with the application's content generation pipeline
 */

import { PatternDB, PatternType, SimilarityMatch } from './pattern-db';
import { LanguageAwareContentRequest, LanguageAwareResponse } from '../types/language-aware-request';

export interface PatternRecommendation {
  purpose?: string;
  format?: string;
  tone?: string;
  targetAudience?: string;
  keywords?: string[];
  confidence: number;
  patterns_used: number;
  similar_patterns: SimilarityMatch[];
}

export interface ContentAnalysis {
  structure: string[];
  character_count: number;
  hashtag_count: number;
  emoji_usage: boolean;
  estimated_reading_time: number;
  engagement_prediction: number;
}

export class PatternService {
  private static instance: PatternService;
  private patternDB: PatternDB;
  private initialized = false;

  private constructor() {
    // Initialize will be called separately
  }

  public static getInstance(): PatternService {
    if (!PatternService.instance) {
      PatternService.instance = new PatternService();
    }
    return PatternService.instance;
  }

  /**
   * Initialize the pattern service with configuration
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      openaiApiKey: process.env.OPENAI_API_KEY,
      embeddingModel: 'text-embedding-ada-002',
      similarityThreshold: 0.75,
      maxResults: 10,
      cacheSize: 1000,
    };

    this.patternDB = PatternDB.getInstance(config);
    
    // Set up event listeners for monitoring
    this.setupEventListeners();
    
    this.initialized = true;
  }

  /**
   * Get personalized recommendations for a content request
   */
  public async getRecommendations(
    request: LanguageAwareContentRequest,
    userId?: string
  ): Promise<PatternRecommendation> {
    await this.ensureInitialized();

    try {
      // Get similar patterns based on vector similarity
      const similarPatterns = await this.patternDB.findSimilarPatterns(request, userId, {
        patternTypes: ['successful_post', 'template'],
        minConfidence: 0.6,
        maxResults: 5,
      });

      // Generate smart defaults based on user's top patterns
      const smartDefaults = await this.patternDB.generateSmartDefaults(userId, request);

      // Combine similar patterns with smart defaults
      const recommendation: PatternRecommendation = {
        purpose: request.purpose || smartDefaults.purpose,
        format: request.format || smartDefaults.format,
        tone: request.tone || smartDefaults.tone,
        targetAudience: request.targetAudience || smartDefaults.targetAudience,
        keywords: this.generateKeywordRecommendations(similarPatterns),
        confidence: Math.max(smartDefaults.confidence, this.calculateAverageConfidence(similarPatterns)),
        patterns_used: smartDefaults.patterns_used,
        similar_patterns: similarPatterns,
      };

      return recommendation;

    } catch (error) {
      console.error('Pattern recommendation error:', error);
      
      // Return empty recommendation on error
      return {
        confidence: 0,
        patterns_used: 0,
        similar_patterns: [],
      };
    }
  }

  /**
   * Learn from successful content generation
   */
  public async learnFromSuccess(
    userId: string,
    request: LanguageAwareContentRequest,
    response: LanguageAwareResponse,
    engagement?: {
      likes?: number;
      comments?: number;
      shares?: number;
      total?: number;
    }
  ): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Use mock high engagement in development
      const mockEngagement = engagement || { total: 1000 };
      
      const pattern = await this.patternDB.learnFromSuccess(
        userId,
        request,
        response,
        mockEngagement
      );

      return !!pattern;

    } catch (error) {
      console.error('Pattern learning error:', error);
      return false;
    }
  }

  /**
   * Analyze content for patterns and structure
   */
  public analyzeContent(content: string): ContentAnalysis {
    const lines = content.split('\n').filter(line => line.trim());
    const words = content.trim().split(/\s+/).length;
    
    return {
      structure: this.analyzeContentStructure(content),
      character_count: content.length,
      hashtag_count: this.countHashtags(content),
      emoji_usage: this.hasEmojis(content),
      estimated_reading_time: Math.ceil(words / 200), // 200 WPM average
      engagement_prediction: this.predictEngagement(content),
    };
  }

  /**
   * Get pattern insights for a user
   */
  public async getPatternInsights(userId: string): Promise<{
    total_patterns: number;
    most_successful_purpose: string | null;
    most_successful_format: string | null;
    average_engagement: number;
    pattern_confidence: number;
  }> {
    await this.ensureInitialized();

    try {
      // This would typically query the database for user patterns
      // For now, return mock insights
      return {
        total_patterns: 0,
        most_successful_purpose: null,
        most_successful_format: null,
        average_engagement: 0,
        pattern_confidence: 0,
      };

    } catch (error) {
      console.error('Pattern insights error:', error);
      return {
        total_patterns: 0,
        most_successful_purpose: null,
        most_successful_format: null,
        average_engagement: 0,
        pattern_confidence: 0,
      };
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    if (!this.initialized) {
      return {
        status: 'unhealthy',
        details: { error: 'Service not initialized' },
      };
    }

    return this.patternDB.healthCheck();
  }

  /**
   * Private helper methods
   */

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private setupEventListeners(): void {
    this.patternDB.on('similarity:search', (data) => {
      console.log('Pattern similarity search:', data);
    });

    this.patternDB.on('pattern:created', (data) => {
      console.log('New pattern created:', data.pattern.pattern_type);
    });

    this.patternDB.on('pattern:reinforced', (data) => {
      console.log('Pattern reinforced:', data.newSampleSize, 'samples');
    });

    this.patternDB.on('defaults:generated', (data) => {
      console.log('Smart defaults generated:', data.patterns_used, 'patterns used');
    });
  }

  private generateKeywordRecommendations(patterns: SimilarityMatch[]): string[] {
    const keywordFreq: Record<string, number> = {};
    
    patterns.forEach(match => {
      const keywords = match.pattern.pattern_data.keywords || [];
      keywords.forEach((keyword: string) => {
        keywordFreq[keyword] = (keywordFreq[keyword] || 0) + match.similarity_score;
      });
    });

    // Return top 5 keywords by weighted frequency
    return Object.entries(keywordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  private calculateAverageConfidence(patterns: SimilarityMatch[]): number {
    if (patterns.length === 0) return 0;
    
    const totalConfidence = patterns.reduce((sum, match) => 
      sum + (match.similarity_score * match.confidence), 0
    );
    
    return totalConfidence / patterns.length;
  }

  private analyzeContentStructure(content: string): string[] {
    const structure: string[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return ['empty'];
    
    // Simple heuristic structure analysis
    const firstLine = lines[0].toLowerCase();
    const lastLine = lines[lines.length - 1].toLowerCase();
    
    // Hook detection
    if (firstLine.includes('?') || firstLine.includes('imagine') || firstLine.includes('what if')) {
      structure.push('hook');
    }
    
    // Story detection
    if (content.toLowerCase().includes('story') || 
        content.toLowerCase().includes('when i') ||
        content.toLowerCase().includes('once')) {
      structure.push('story');
    }
    
    // Lesson/insight detection
    if (content.toLowerCase().includes('lesson') ||
        content.toLowerCase().includes('learned') ||
        content.toLowerCase().includes('insight')) {
      structure.push('lesson');
    }
    
    // Call-to-action detection
    if (lastLine.includes('comment') ||
        lastLine.includes('share') ||
        lastLine.includes('👉') ||
        lastLine.includes('what do you think')) {
      structure.push('cta');
    }
    
    // List detection
    if (content.includes('1.') || content.includes('•') || content.includes('-')) {
      structure.push('list');
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

  private predictEngagement(content: string): number {
    let score = 500; // Base score
    
    // Length factor
    const idealLength = 1300;
    const lengthFactor = Math.max(0.5, 1 - Math.abs(content.length - idealLength) / idealLength);
    score *= lengthFactor;
    
    // Hashtag factor
    const hashtagCount = this.countHashtags(content);
    if (hashtagCount >= 2 && hashtagCount <= 4) {
      score *= 1.2;
    } else if (hashtagCount > 4) {
      score *= 0.9;
    }
    
    // Emoji factor
    if (this.hasEmojis(content)) {
      score *= 1.1;
    }
    
    // Question factor (engagement driver)
    const questionCount = (content.match(/\?/g) || []).length;
    if (questionCount > 0) {
      score *= 1 + (questionCount * 0.1);
    }
    
    // Structure factor
    const structure = this.analyzeContentStructure(content);
    if (structure.includes('hook')) score *= 1.15;
    if (structure.includes('story')) score *= 1.1;
    if (structure.includes('cta')) score *= 1.2;
    
    return Math.round(Math.max(100, Math.min(5000, score)));
  }
}

// Export singleton instance
export const patternService = PatternService.getInstance();