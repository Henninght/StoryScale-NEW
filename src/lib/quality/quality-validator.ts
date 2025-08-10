/**
 * Quality Validator - ML-based content quality scoring for LinkedIn posts
 * Ensures all generated content meets professional standards (>0.7 threshold)
 */

import { LanguageAwareContentRequest, SupportedLanguage } from '../types/language-aware-request';

export interface QualityMetrics {
  // Core quality scores (0-1 scale)
  coherenceScore: number;          // Logical flow and structure
  relevanceScore: number;          // Topic relevance and focus
  engagementScore: number;         // Predicted engagement potential
  professionalismScore: number;    // Professional tone and language
  readabilityScore: number;        // Ease of reading and comprehension
  
  // LinkedIn-specific metrics
  hookStrength: number;            // Opening line effectiveness
  ctaEffectiveness: number;        // Call-to-action clarity
  hashtagRelevance: number;        // Hashtag appropriateness
  lengthOptimization: number;      // Optimal length for platform
  
  // Overall quality
  overallScore: number;            // Weighted average of all metrics
  qualityLevel: 'excellent' | 'good' | 'acceptable' | 'poor';
  passesThreshold: boolean;        // True if >= 0.7
  
  // Detailed feedback
  issues: QualityIssue[];
  suggestions: QualitySuggestion[];
  strengths: string[];
}

export interface QualityIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  location?: string;
  impact: number; // Impact on overall score (0-1)
}

export interface QualitySuggestion {
  type: 'improvement' | 'optimization' | 'enhancement';
  category: string;
  suggestion: string;
  expectedImprovement: number; // Expected score improvement (0-1)
  example?: string;
}

export interface ValidationConfig {
  threshold: number;                // Minimum acceptable score (default: 0.7)
  strictMode: boolean;              // Require all sub-scores > 0.6
  language: SupportedLanguage;
  contentType: 'linkedin' | 'article' | 'email';
  industryContext?: string;
  brandGuidelines?: BrandGuidelines;
}

export interface BrandGuidelines {
  tone: string[];                   // e.g., ['professional', 'friendly', 'innovative']
  avoidWords: string[];             // Words to avoid
  preferredTerms: Map<string, string>; // Term replacements
  voiceAttributes: string[];       // e.g., ['authoritative', 'approachable']
  minLength?: number;
  maxLength?: number;
}

export class QualityValidator {
  private static instance: QualityValidator;
  private config: ValidationConfig;
  
  // LinkedIn-specific quality patterns
  private readonly linkedInPatterns = {
    strongHooks: [
      /^Did you know/i,
      /^[0-9]+%/,
      /^After \d+ years/i,
      /^I learned/i,
      /^Here's what/i,
      /^The truth about/i,
      /^Stop doing/i,
      /^Start doing/i,
      /^Why .+ matters/i,
      /^How to/i
    ],
    
    weakHooks: [
      /^Today I want to/i,
      /^I think/i,
      /^In my opinion/i,
      /^Just wanted to share/i,
      /^Random thought/i
    ],
    
    effectiveCTAs: [
      /What's your .+\?$/,
      /Share your .+ below/i,
      /Have you experienced/i,
      /What do you think\?$/,
      /Let me know .+ comments/i,
      /Agree\? Disagree\?/i,
      /Follow .+ more/i
    ],
    
    optimalLength: {
      min: 800,
      max: 2000,
      sweet_spot: 1300
    }
  };
  
  private constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      threshold: 0.7,
      strictMode: false,
      language: 'en',
      contentType: 'linkedin',
      ...config
    };
  }
  
  public static getInstance(config?: Partial<ValidationConfig>): QualityValidator {
    if (!QualityValidator.instance) {
      QualityValidator.instance = new QualityValidator(config);
    }
    return QualityValidator.instance;
  }
  
  /**
   * Validate content quality with ML-based scoring
   */
  public async validateContent(
    content: string,
    request?: LanguageAwareContentRequest
  ): Promise<QualityMetrics> {
    // Calculate individual metrics
    const coherence = await this.calculateCoherence(content);
    const relevance = request ? await this.calculateRelevance(content, request) : 0.8;
    const engagement = this.calculateEngagementPotential(content);
    const professionalism = this.calculateProfessionalism(content);
    const readability = this.calculateReadability(content);
    
    // LinkedIn-specific metrics
    const hookStrength = this.evaluateHook(content);
    const ctaEffectiveness = this.evaluateCTA(content);
    const hashtagRelevance = this.evaluateHashtags(content);
    const lengthOptimization = this.evaluateLength(content);
    
    // Calculate weighted overall score
    const overallScore = this.calculateOverallScore({
      coherence,
      relevance,
      engagement,
      professionalism,
      readability,
      hookStrength,
      ctaEffectiveness,
      hashtagRelevance,
      lengthOptimization
    });
    
    // Determine quality level
    const qualityLevel = this.determineQualityLevel(overallScore);
    const passesThreshold = overallScore >= this.config.threshold;
    
    // Generate feedback
    const issues = this.identifyIssues(content, {
      coherence,
      relevance,
      engagement,
      professionalism,
      readability,
      hookStrength,
      ctaEffectiveness,
      hashtagRelevance,
      lengthOptimization
    });
    
    const suggestions = this.generateSuggestions(content, issues);
    const strengths = this.identifyStrengths(content, {
      coherence,
      relevance,
      engagement,
      professionalism,
      readability,
      hookStrength,
      ctaEffectiveness,
      hashtagRelevance,
      lengthOptimization
    });
    
    return {
      coherenceScore: coherence,
      relevanceScore: relevance,
      engagementScore: engagement,
      professionalismScore: professionalism,
      readabilityScore: readability,
      hookStrength,
      ctaEffectiveness,
      hashtagRelevance,
      lengthOptimization,
      overallScore,
      qualityLevel,
      passesThreshold,
      issues,
      suggestions,
      strengths
    };
  }
  
  /**
   * Calculate content coherence using NLP techniques
   */
  private async calculateCoherence(content: string): Promise<number> {
    const sentences = this.splitIntoSentences(content);
    if (sentences.length < 2) return 0.7;
    
    let coherenceScore = 1.0;
    
    // Check logical flow between sentences
    for (let i = 1; i < sentences.length; i++) {
      const prevSentence = sentences[i - 1];
      const currSentence = sentences[i];
      
      // Check for transition words
      const hasTransition = this.hasTransitionWord(currSentence);
      if (!hasTransition && i > 1) {
        coherenceScore -= 0.05;
      }
      
      // Check for topic consistency
      const topicShift = this.detectTopicShift(prevSentence, currSentence);
      if (topicShift > 0.7) {
        coherenceScore -= 0.1;
      }
    }
    
    // Check paragraph structure
    const paragraphs = content.split(/\n\n+/);
    if (paragraphs.length === 1 && sentences.length > 5) {
      coherenceScore -= 0.1; // Penalize lack of paragraph breaks
    }
    
    return Math.max(0, Math.min(1, coherenceScore));
  }
  
  /**
   * Calculate relevance to the request topic
   */
  private async calculateRelevance(
    content: string,
    request: LanguageAwareContentRequest
  ): Promise<number> {
    if (!request.topic) return 0.8;
    
    const topicKeywords = this.extractKeywords(request.topic);
    const contentKeywords = this.extractKeywords(content);
    
    // Calculate keyword overlap
    const overlap = topicKeywords.filter(keyword =>
      contentKeywords.includes(keyword)
    ).length;
    
    const relevanceScore = overlap / Math.max(topicKeywords.length, 1);
    
    // Boost score if main topic is in first paragraph
    const firstParagraph = content.split(/\n\n/)[0];
    if (firstParagraph.toLowerCase().includes(request.topic.toLowerCase())) {
      return Math.min(1, relevanceScore + 0.2);
    }
    
    return relevanceScore;
  }
  
  /**
   * Calculate engagement potential based on LinkedIn best practices
   */
  private calculateEngagementPotential(content: string): number {
    let score = 0.5; // Base score
    
    // Check for engaging elements
    if (content.includes('?')) score += 0.1; // Questions engage readers
    if (/\d+/.test(content)) score += 0.1; // Statistics increase credibility
    if (content.match(/\n\n/g)?.length || 0 > 2) score += 0.1; // Good formatting
    if (content.includes('•') || content.includes('→')) score += 0.05; // Lists
    
    // Check for story elements
    if (/\b(I|my|me)\b/i.test(content.substring(0, 200))) {
      score += 0.15; // Personal stories engage
    }
    
    // Check for value proposition
    const valueWords = ['learn', 'discover', 'secret', 'tip', 'strategy', 'mistake', 'lesson'];
    const hasValue = valueWords.some(word => 
      content.toLowerCase().includes(word)
    );
    if (hasValue) score += 0.1;
    
    return Math.min(1, score);
  }
  
  /**
   * Calculate professionalism score
   */
  private calculateProfessionalism(content: string): number {
    let score = 1.0;
    
    // Check for unprofessional elements
    const informalWords = ['gonna', 'wanna', 'gotta', 'dunno', 'kinda', 'sorta', 'yeah', 'nah'];
    informalWords.forEach(word => {
      if (content.toLowerCase().includes(word)) {
        score -= 0.05;
      }
    });
    
    // Check for excessive exclamation marks
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      score -= (exclamationCount - 2) * 0.05;
    }
    
    // Check for all caps (shouting)
    const capsWords = content.match(/\b[A-Z]{4,}\b/g) || [];
    if (capsWords.length > 1) {
      score -= capsWords.length * 0.05;
    }
    
    // Check grammar basics (simplified)
    if (!/^[A-Z]/.test(content.trim())) score -= 0.1; // Starts with capital
    if (!content.trim().match(/[.!?]$/)) score -= 0.05; // Ends with punctuation
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Calculate readability using Flesch Reading Ease formula
   */
  private calculateReadability(content: string): number {
    const sentences = this.splitIntoSentences(content);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((total, word) => 
      total + this.countSyllables(word), 0
    );
    
    if (sentences.length === 0 || words.length === 0) return 0.5;
    
    // Flesch Reading Ease formula
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    let fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    
    // Convert to 0-1 scale (Flesch 60-100 is good for business writing)
    if (fleschScore >= 60) return 1.0;
    if (fleschScore >= 50) return 0.8;
    if (fleschScore >= 40) return 0.6;
    if (fleschScore >= 30) return 0.4;
    return 0.3;
  }
  
  /**
   * Evaluate hook strength for LinkedIn
   */
  private evaluateHook(content: string): number {
    const firstLine = content.split('\n')[0];
    
    // Check against strong hook patterns
    const hasStrongHook = this.linkedInPatterns.strongHooks.some(pattern =>
      pattern.test(firstLine)
    );
    if (hasStrongHook) return 0.9;
    
    // Check against weak hook patterns
    const hasWeakHook = this.linkedInPatterns.weakHooks.some(pattern =>
      pattern.test(firstLine)
    );
    if (hasWeakHook) return 0.4;
    
    // Default moderate score
    return 0.6;
  }
  
  /**
   * Evaluate CTA effectiveness
   */
  private evaluateCTA(content: string): number {
    const lastParagraph = content.split(/\n\n/).pop() || '';
    
    // Check for effective CTA patterns
    const hasEffectiveCTA = this.linkedInPatterns.effectiveCTAs.some(pattern =>
      pattern.test(lastParagraph)
    );
    
    if (hasEffectiveCTA) return 0.9;
    if (lastParagraph.includes('?')) return 0.7; // Any question is decent
    if (lastParagraph.includes('comment') || lastParagraph.includes('share')) return 0.6;
    
    return 0.3; // No clear CTA
  }
  
  /**
   * Evaluate hashtag usage
   */
  private evaluateHashtags(content: string): number {
    const hashtags = content.match(/#\w+/g) || [];
    const hashtagCount = hashtags.length;
    
    // LinkedIn optimal: 3-5 hashtags
    if (hashtagCount >= 3 && hashtagCount <= 5) return 1.0;
    if (hashtagCount === 2 || hashtagCount === 6) return 0.8;
    if (hashtagCount === 1 || hashtagCount === 7) return 0.6;
    if (hashtagCount === 0) return 0.4;
    if (hashtagCount > 10) return 0.2;
    
    return 0.5;
  }
  
  /**
   * Evaluate content length optimization
   */
  private evaluateLength(content: string): number {
    const charCount = content.length;
    const { min, max, sweet_spot } = this.linkedInPatterns.optimalLength;
    
    if (charCount >= sweet_spot - 200 && charCount <= sweet_spot + 200) {
      return 1.0; // Perfect length
    }
    if (charCount >= min && charCount <= max) {
      return 0.8; // Good length
    }
    if (charCount < min) {
      return Math.max(0.3, charCount / min); // Too short
    }
    if (charCount > max) {
      return Math.max(0.3, max / charCount); // Too long
    }
    
    return 0.5;
  }
  
  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(metrics: Record<string, number>): number {
    const weights = {
      coherenceScore: 0.15,
      relevanceScore: 0.15,
      engagementScore: 0.15,
      professionalismScore: 0.10,
      readabilityScore: 0.10,
      hookStrength: 0.15,
      ctaEffectiveness: 0.10,
      hashtagRelevance: 0.05,
      lengthOptimization: 0.05
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (key in metrics) {
        weightedSum += metrics[key] * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Determine quality level based on score
   */
  private determineQualityLevel(score: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (score >= 0.85) return 'excellent';
    if (score >= 0.70) return 'good';
    if (score >= 0.55) return 'acceptable';
    return 'poor';
  }
  
  /**
   * Identify quality issues
   */
  private identifyIssues(
    content: string,
    metrics: Record<string, number>
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    // Check each metric for issues
    if (metrics.coherenceScore < 0.6) {
      issues.push({
        severity: 'major',
        category: 'coherence',
        description: 'Content lacks logical flow between ideas',
        impact: 0.15
      });
    }
    
    if (metrics.hookStrength < 0.5) {
      issues.push({
        severity: 'critical',
        category: 'engagement',
        description: 'Weak opening line - won\'t capture attention',
        location: 'First sentence',
        impact: 0.2
      });
    }
    
    if (metrics.ctaEffectiveness < 0.5) {
      issues.push({
        severity: 'major',
        category: 'engagement',
        description: 'Missing or weak call-to-action',
        location: 'End of post',
        impact: 0.1
      });
    }
    
    if (metrics.lengthOptimization < 0.5) {
      const charCount = content.length;
      const issue = charCount < 800 ? 'too short' : 'too long';
      issues.push({
        severity: 'minor',
        category: 'formatting',
        description: `Content is ${issue} for optimal LinkedIn engagement`,
        impact: 0.05
      });
    }
    
    if (metrics.readabilityScore < 0.6) {
      issues.push({
        severity: 'major',
        category: 'readability',
        description: 'Content is difficult to read - simplify sentence structure',
        impact: 0.1
      });
    }
    
    return issues;
  }
  
  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(
    content: string,
    issues: QualityIssue[]
  ): QualitySuggestion[] {
    const suggestions: QualitySuggestion[] = [];
    
    // Generate suggestions based on issues
    issues.forEach(issue => {
      if (issue.category === 'engagement' && issue.location === 'First sentence') {
        suggestions.push({
          type: 'improvement',
          category: 'hook',
          suggestion: 'Start with a compelling statistic, question, or personal insight',
          expectedImprovement: 0.2,
          example: 'Did you know that 73% of professionals struggle with...'
        });
      }
      
      if (issue.category === 'engagement' && issue.location === 'End of post') {
        suggestions.push({
          type: 'improvement',
          category: 'cta',
          suggestion: 'End with a question to encourage comments',
          expectedImprovement: 0.15,
          example: 'What\'s been your experience with this? Share below 👇'
        });
      }
      
      if (issue.category === 'readability') {
        suggestions.push({
          type: 'optimization',
          category: 'structure',
          suggestion: 'Break long sentences into shorter ones and add paragraph breaks',
          expectedImprovement: 0.1
        });
      }
    });
    
    // Add enhancement suggestions even for good content
    if (!content.includes('•') && !content.includes('→')) {
      suggestions.push({
        type: 'enhancement',
        category: 'formatting',
        suggestion: 'Consider using bullet points for key takeaways',
        expectedImprovement: 0.05
      });
    }
    
    return suggestions;
  }
  
  /**
   * Identify content strengths
   */
  private identifyStrengths(
    content: string,
    metrics: Record<string, number>
  ): string[] {
    const strengths: string[] = [];
    
    if (metrics.hookStrength >= 0.8) {
      strengths.push('Strong, attention-grabbing opening');
    }
    
    if (metrics.engagementScore >= 0.8) {
      strengths.push('High engagement potential with target audience');
    }
    
    if (metrics.coherenceScore >= 0.8) {
      strengths.push('Excellent logical flow and structure');
    }
    
    if (metrics.readabilityScore >= 0.8) {
      strengths.push('Clear and easy to read');
    }
    
    if (metrics.professionalismScore >= 0.9) {
      strengths.push('Professional tone and language');
    }
    
    if (metrics.ctaEffectiveness >= 0.8) {
      strengths.push('Compelling call-to-action');
    }
    
    return strengths;
  }
  
  // Utility methods
  
  private splitIntoSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g) || [];
  }
  
  private hasTransitionWord(sentence: string): boolean {
    const transitions = [
      'however', 'therefore', 'furthermore', 'moreover',
      'additionally', 'consequently', 'meanwhile', 'nevertheless',
      'thus', 'hence', 'accordingly', 'similarly'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return transitions.some(word => lowerSentence.includes(word));
  }
  
  private detectTopicShift(sentence1: string, sentence2: string): number {
    const keywords1 = this.extractKeywords(sentence1);
    const keywords2 = this.extractKeywords(sentence2);
    
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const similarity = commonKeywords.length / Math.max(keywords1.length, keywords2.length);
    return 1 - similarity; // Return dissimilarity
  }
  
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (could be enhanced with NLP)
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
      'it', 'from', 'be', 'are', 'was', 'were', 'been', 'have', 'has'
    ]);
    
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }
  
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiou]/.test(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e')) {
      count--;
    }
    
    // Ensure at least one syllable
    return Math.max(1, count);
  }
}

// Export singleton instance
export const qualityValidator = QualityValidator.getInstance();