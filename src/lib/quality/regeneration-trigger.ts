/**
 * Regeneration Trigger - Automatic content regeneration for low-quality scores
 * Ensures all LinkedIn posts meet professional standards (>0.7 threshold)
 */

import { QualityValidator, QualityMetrics } from './quality-validator';
import { BrandVoiceAnalyzer, VoiceConsistencyAnalysis } from './brand-voice-analyzer';
import { LanguageAwareContentRequest, SupportedLanguage } from '../types/language-aware-request';
import { GenerateFunction, GenerateRequest, GenerateResponse } from '../functions/generate-function';

export interface RegenerationConfig {
  maxAttempts: number;                    // Maximum regeneration attempts (default: 3)
  qualityThreshold: number;               // Minimum quality score (default: 0.7)
  voiceConsistencyThreshold: number;      // Minimum brand consistency (default: 0.75)
  improvementStrategy: 'iterative' | 'complete' | 'targeted';
  enableLearning: boolean;                // Learn from successful regenerations
  fallbackBehavior: 'accept' | 'reject' | 'manual-review';
}

export interface RegenerationResult {
  success: boolean;
  attempts: number;
  finalContent: string;
  finalQualityScore: number;
  finalVoiceScore: number;
  improvementPath: RegenerationAttempt[];
  learnings?: RegenerationLearning[];
  requiresManualReview: boolean;
}

export interface RegenerationAttempt {
  attemptNumber: number;
  strategy: string;
  content: string;
  qualityMetrics: QualityMetrics;
  voiceAnalysis?: VoiceConsistencyAnalysis;
  improvements: string[];
  duration: number;
}

export interface RegenerationLearning {
  type: 'quality_issue' | 'voice_deviation' | 'successful_pattern';
  description: string;
  pattern: string;
  solution?: string;
  confidence: number;
}

export interface RegenerationStrategy {
  type: 'iterative' | 'complete' | 'targeted';
  focusAreas: string[];
  constraints: string[];
  preserveElements?: string[];
}

export class RegenerationTrigger {
  private static instance: RegenerationTrigger;
  private qualityValidator: QualityValidator;
  private brandVoiceAnalyzer: BrandVoiceAnalyzer;
  private generateFunction: GenerateFunction;
  private config: RegenerationConfig;
  private learningDatabase: Map<string, RegenerationLearning[]> = new Map();
  
  private constructor(config?: Partial<RegenerationConfig>) {
    this.config = {
      maxAttempts: 3,
      qualityThreshold: 0.7,
      voiceConsistencyThreshold: 0.75,
      improvementStrategy: 'iterative',
      enableLearning: true,
      fallbackBehavior: 'manual-review',
      ...config
    };
    
    this.qualityValidator = QualityValidator.getInstance();
    this.brandVoiceAnalyzer = BrandVoiceAnalyzer.getInstance();
    this.generateFunction = new GenerateFunction(
      {} as any, // Cost guardian placeholder
      {} as any  // Cache placeholder
    );
  }
  
  public static getInstance(config?: Partial<RegenerationConfig>): RegenerationTrigger {
    if (!RegenerationTrigger.instance) {
      RegenerationTrigger.instance = new RegenerationTrigger(config);
    }
    return RegenerationTrigger.instance;
  }
  
  /**
   * Main regeneration orchestration
   */
  public async regenerateIfNeeded(
    content: string,
    request: LanguageAwareContentRequest,
    brandProfileId?: string
  ): Promise<RegenerationResult> {
    const startTime = Date.now();
    const attempts: RegenerationAttempt[] = [];
    const learnings: RegenerationLearning[] = [];
    
    let currentContent = content;
    let attemptCount = 0;
    let qualityMetrics: QualityMetrics;
    let voiceAnalysis: VoiceConsistencyAnalysis | undefined;
    
    // Initial quality check
    qualityMetrics = await this.qualityValidator.validateContent(currentContent, request);
    
    // Initial voice check if brand profile exists
    if (brandProfileId) {
      voiceAnalysis = this.brandVoiceAnalyzer.analyzeVoiceConsistency(
        currentContent,
        brandProfileId
      );
    }
    
    // Check if regeneration is needed
    const needsRegeneration = this.shouldRegenerate(qualityMetrics, voiceAnalysis);
    
    if (!needsRegeneration) {
      return {
        success: true,
        attempts: 0,
        finalContent: currentContent,
        finalQualityScore: qualityMetrics.overallScore,
        finalVoiceScore: voiceAnalysis?.overallConsistency || 1,
        improvementPath: [],
        requiresManualReview: false
      };
    }
    
    // Regeneration loop
    while (attemptCount < this.config.maxAttempts) {
      attemptCount++;
      
      // Determine regeneration strategy
      const strategy = this.determineStrategy(
        qualityMetrics,
        voiceAnalysis,
        attemptCount
      );
      
      // Generate improved content
      const improvedContent = await this.regenerateContent(
        currentContent,
        request,
        strategy,
        qualityMetrics,
        voiceAnalysis
      );
      
      // Validate improved content
      const newQualityMetrics = await this.qualityValidator.validateContent(
        improvedContent,
        request
      );
      
      let newVoiceAnalysis: VoiceConsistencyAnalysis | undefined;
      if (brandProfileId) {
        newVoiceAnalysis = this.brandVoiceAnalyzer.analyzeVoiceConsistency(
          improvedContent,
          brandProfileId
        );
      }
      
      // Record attempt
      attempts.push({
        attemptNumber: attemptCount,
        strategy: strategy.type,
        content: improvedContent,
        qualityMetrics: newQualityMetrics,
        voiceAnalysis: newVoiceAnalysis,
        improvements: this.identifyImprovements(qualityMetrics, newQualityMetrics),
        duration: Date.now() - startTime
      });
      
      // Check if improvement is sufficient
      if (this.isImprovementSufficient(qualityMetrics, newQualityMetrics, voiceAnalysis, newVoiceAnalysis)) {
        currentContent = improvedContent;
        qualityMetrics = newQualityMetrics;
        voiceAnalysis = newVoiceAnalysis;
        
        // Check if targets are met
        if (!this.shouldRegenerate(qualityMetrics, voiceAnalysis)) {
          // Success - learn from this
          if (this.config.enableLearning) {
            learnings.push(...this.extractLearnings(attempts, 'success'));
            this.storeLearnings(request, learnings);
          }
          
          return {
            success: true,
            attempts: attemptCount,
            finalContent: currentContent,
            finalQualityScore: qualityMetrics.overallScore,
            finalVoiceScore: voiceAnalysis?.overallConsistency || 1,
            improvementPath: attempts,
            learnings,
            requiresManualReview: false
          };
        }
      } else {
        // No improvement or degradation
        if (attemptCount === 1) {
          // First attempt failed, try different strategy
          continue;
        } else {
          // Multiple attempts failed, stop trying
          break;
        }
      }
    }
    
    // Max attempts reached or no improvement
    const fallbackResult = await this.handleFallback(
      currentContent,
      qualityMetrics,
      voiceAnalysis,
      attempts,
      request
    );
    
    // Learn from failure
    if (this.config.enableLearning) {
      learnings.push(...this.extractLearnings(attempts, 'failure'));
      this.storeLearnings(request, learnings);
    }
    
    return {
      success: fallbackResult.accepted,
      attempts: attemptCount,
      finalContent: fallbackResult.content,
      finalQualityScore: qualityMetrics.overallScore,
      finalVoiceScore: voiceAnalysis?.overallConsistency || 0,
      improvementPath: attempts,
      learnings,
      requiresManualReview: fallbackResult.requiresReview
    };
  }
  
  /**
   * Determine if content should be regenerated
   */
  private shouldRegenerate(
    qualityMetrics: QualityMetrics,
    voiceAnalysis?: VoiceConsistencyAnalysis
  ): boolean {
    // Check quality threshold
    if (qualityMetrics.overallScore < this.config.qualityThreshold) {
      return true;
    }
    
    // Check voice consistency if applicable
    if (voiceAnalysis && voiceAnalysis.overallConsistency < this.config.voiceConsistencyThreshold) {
      return true;
    }
    
    // Check for critical issues
    const hasCriticalIssues = qualityMetrics.issues.some(
      issue => issue.severity === 'critical'
    );
    
    if (hasCriticalIssues) {
      return true;
    }
    
    // Check LinkedIn-specific metrics
    if (qualityMetrics.hookStrength < 0.5 || qualityMetrics.ctaEffectiveness < 0.4) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine regeneration strategy based on issues
   */
  private determineStrategy(
    qualityMetrics: QualityMetrics,
    voiceAnalysis?: VoiceConsistencyAnalysis,
    attemptNumber?: number
  ): RegenerationStrategy {
    const focusAreas: string[] = [];
    const constraints: string[] = [];
    const preserveElements: string[] = [];
    
    // Analyze quality issues
    if (qualityMetrics.coherenceScore < 0.6) {
      focusAreas.push('logical_flow');
      focusAreas.push('structure');
    }
    
    if (qualityMetrics.hookStrength < 0.5) {
      focusAreas.push('opening_hook');
      constraints.push('start_with_question_or_statistic');
    }
    
    if (qualityMetrics.ctaEffectiveness < 0.5) {
      focusAreas.push('call_to_action');
      constraints.push('end_with_engagement_prompt');
    }
    
    if (qualityMetrics.professionalismScore < 0.7) {
      focusAreas.push('tone_formality');
      constraints.push('maintain_professional_language');
    }
    
    // Analyze voice issues
    if (voiceAnalysis) {
      if (voiceAnalysis.toneAlignment < 0.7) {
        focusAreas.push('brand_tone');
      }
      
      if (voiceAnalysis.vocabularyMatch < 0.7) {
        focusAreas.push('brand_vocabulary');
      }
      
      // Preserve aligned elements
      preserveElements.push(...voiceAnalysis.alignedElements);
    }
    
    // Identify high-scoring elements to preserve
    if (qualityMetrics.engagementScore > 0.8) {
      preserveElements.push('engagement_elements');
    }
    
    if (qualityMetrics.readabilityScore > 0.8) {
      preserveElements.push('reading_flow');
    }
    
    // Choose strategy based on attempt number and issues
    let strategyType: 'iterative' | 'complete' | 'targeted' = 'iterative';
    
    if (attemptNumber && attemptNumber > 1) {
      // Switch strategy if previous attempts failed
      if (focusAreas.length > 3) {
        strategyType = 'complete'; // Too many issues, rewrite
      } else {
        strategyType = 'targeted'; // Focus on specific issues
      }
    } else {
      // First attempt - use configured strategy
      strategyType = this.config.improvementStrategy;
    }
    
    return {
      type: strategyType,
      focusAreas,
      constraints,
      preserveElements
    };
  }
  
  /**
   * Regenerate content based on strategy
   */
  private async regenerateContent(
    originalContent: string,
    request: LanguageAwareContentRequest,
    strategy: RegenerationStrategy,
    qualityMetrics: QualityMetrics,
    voiceAnalysis?: VoiceConsistencyAnalysis
  ): Promise<string> {
    // Build improvement prompt
    const improvementPrompt = this.buildImprovementPrompt(
      originalContent,
      strategy,
      qualityMetrics,
      voiceAnalysis
    );
    
    // Apply learned patterns if available
    const learnings = this.getLearnings(request);
    const enhancedPrompt = this.applyLearnings(improvementPrompt, learnings);
    
    // Create regeneration request
    const regenerationRequest: GenerateRequest = {
      contentType: 'socialMedia', // LinkedIn is social media
      topic: request.topic || '',
      audience: request.targetAudience || 'Professional LinkedIn audience',
      tone: request.tone,
      objectives: ['improve_quality', 'fix_issues', ...strategy.focusAreas],
      constraints: {
        requiredElements: strategy.constraints,
        maxLength: 2000, // LinkedIn optimal
        minLength: 800
      },
      quality: {
        minScore: this.config.qualityThreshold,
        culturalStrictness: 'moderate'
      },
      // Include original content as context
      keywords: this.extractKeyElements(originalContent, strategy.preserveElements)
    };
    
    // Generate improved content
    try {
      const response = await this.generateFunction.generate(regenerationRequest);
      
      if (response.status === 'success' && response.content.primary.text) {
        return response.content.primary.text;
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
    }
    
    // Fallback to manual improvement
    return this.manualImprovement(
      originalContent,
      strategy,
      qualityMetrics,
      voiceAnalysis
    );
  }
  
  /**
   * Build improvement prompt
   */
  private buildImprovementPrompt(
    content: string,
    strategy: RegenerationStrategy,
    qualityMetrics: QualityMetrics,
    voiceAnalysis?: VoiceConsistencyAnalysis
  ): string {
    let prompt = `Improve this LinkedIn post to meet professional standards.\n\n`;
    
    // Add strategy-specific instructions
    switch (strategy.type) {
      case 'complete':
        prompt += `COMPLETE REWRITE NEEDED. Maintain core message but restructure entirely.\n`;
        break;
      case 'targeted':
        prompt += `TARGETED IMPROVEMENTS for: ${strategy.focusAreas.join(', ')}\n`;
        break;
      case 'iterative':
        prompt += `ITERATIVE REFINEMENT focusing on gradual improvements.\n`;
        break;
    }
    
    // Add quality issues
    prompt += `\nQUALITY ISSUES TO FIX:\n`;
    qualityMetrics.issues.forEach(issue => {
      prompt += `- ${issue.description} (${issue.severity})\n`;
    });
    
    // Add voice deviations
    if (voiceAnalysis && voiceAnalysis.deviations.length > 0) {
      prompt += `\nBRAND VOICE DEVIATIONS:\n`;
      voiceAnalysis.deviations.forEach(deviation => {
        prompt += `- ${deviation.description}: Expected "${deviation.expected}", found "${deviation.found}"\n`;
      });
    }
    
    // Add constraints
    if (strategy.constraints.length > 0) {
      prompt += `\nCONSTRAINTS:\n`;
      strategy.constraints.forEach(constraint => {
        prompt += `- ${constraint}\n`;
      });
    }
    
    // Add elements to preserve
    if (strategy.preserveElements && strategy.preserveElements.length > 0) {
      prompt += `\nPRESERVE THESE STRONG ELEMENTS:\n`;
      strategy.preserveElements.forEach(element => {
        prompt += `- ${element}\n`;
      });
    }
    
    // Add improvement suggestions
    prompt += `\nSUGGESTED IMPROVEMENTS:\n`;
    qualityMetrics.suggestions.slice(0, 5).forEach(suggestion => {
      prompt += `- ${suggestion.suggestion}`;
      if (suggestion.example) {
        prompt += ` (Example: ${suggestion.example})`;
      }
      prompt += '\n';
    });
    
    prompt += `\nORIGINAL CONTENT:\n${content}\n`;
    
    return prompt;
  }
  
  /**
   * Manual improvement fallback
   */
  private manualImprovement(
    content: string,
    strategy: RegenerationStrategy,
    qualityMetrics: QualityMetrics,
    voiceAnalysis?: VoiceConsistencyAnalysis
  ): string {
    let improved = content;
    
    // Fix critical issues manually
    
    // Improve hook if weak
    if (qualityMetrics.hookStrength < 0.5) {
      const lines = improved.split('\n');
      if (lines.length > 0) {
        // Add a strong hook pattern
        const hooks = [
          `Did you know that ${lines[0].toLowerCase()}`,
          `Here's what nobody tells you about ${lines[0].toLowerCase()}`,
          `After years of experience, I learned that ${lines[0].toLowerCase()}`
        ];
        lines[0] = hooks[Math.floor(Math.random() * hooks.length)];
        improved = lines.join('\n');
      }
    }
    
    // Add CTA if missing
    if (qualityMetrics.ctaEffectiveness < 0.5) {
      const ctas = [
        '\n\nWhat\'s your experience with this? Share your thoughts below 👇',
        '\n\nAgree? Disagree? Let me know in the comments!',
        '\n\nFollow for more insights on this topic 🚀'
      ];
      improved += ctas[Math.floor(Math.random() * ctas.length)];
    }
    
    // Add hashtags if missing
    if (qualityMetrics.hashtagRelevance < 0.5) {
      improved += '\n\n#LinkedIn #ProfessionalDevelopment #BusinessInsights';
    }
    
    // Fix vocabulary issues
    if (voiceAnalysis) {
      voiceAnalysis.suggestions.forEach(suggestion => {
        if (suggestion.type === 'replacement') {
          improved = improved.replace(
            new RegExp(suggestion.target, 'gi'),
            suggestion.suggestion
          );
        }
      });
    }
    
    return improved;
  }
  
  /**
   * Check if improvement is sufficient
   */
  private isImprovementSufficient(
    oldMetrics: QualityMetrics,
    newMetrics: QualityMetrics,
    oldVoice?: VoiceConsistencyAnalysis,
    newVoice?: VoiceConsistencyAnalysis
  ): boolean {
    // Quality must improve by at least 10%
    const qualityImprovement = newMetrics.overallScore - oldMetrics.overallScore;
    if (qualityImprovement < 0.1) {
      return false;
    }
    
    // Voice consistency must not degrade
    if (oldVoice && newVoice) {
      if (newVoice.overallConsistency < oldVoice.overallConsistency) {
        return false;
      }
    }
    
    // Critical issues must be reduced
    const oldCriticalCount = oldMetrics.issues.filter(i => i.severity === 'critical').length;
    const newCriticalCount = newMetrics.issues.filter(i => i.severity === 'critical').length;
    
    if (newCriticalCount >= oldCriticalCount && oldCriticalCount > 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle fallback when regeneration fails
   */
  private async handleFallback(
    content: string,
    qualityMetrics: QualityMetrics,
    voiceAnalysis: VoiceConsistencyAnalysis | undefined,
    attempts: RegenerationAttempt[],
    request: LanguageAwareContentRequest
  ): Promise<{ accepted: boolean; content: string; requiresReview: boolean }> {
    switch (this.config.fallbackBehavior) {
      case 'accept':
        // Accept the best attempt
        const bestAttempt = this.findBestAttempt(attempts);
        return {
          accepted: true,
          content: bestAttempt?.content || content,
          requiresReview: false
        };
        
      case 'reject':
        // Reject and return empty
        return {
          accepted: false,
          content: '',
          requiresReview: false
        };
        
      case 'manual-review':
      default:
        // Flag for manual review
        const bestContent = this.findBestAttempt(attempts)?.content || content;
        return {
          accepted: false,
          content: this.addReviewMarkers(bestContent, qualityMetrics, voiceAnalysis),
          requiresReview: true
        };
    }
  }
  
  /**
   * Find the best attempt from all regenerations
   */
  private findBestAttempt(attempts: RegenerationAttempt[]): RegenerationAttempt | undefined {
    if (attempts.length === 0) return undefined;
    
    return attempts.reduce((best, current) => {
      const bestScore = best.qualityMetrics.overallScore + 
                       (best.voiceAnalysis?.overallConsistency || 0);
      const currentScore = current.qualityMetrics.overallScore + 
                          (current.voiceAnalysis?.overallConsistency || 0);
      
      return currentScore > bestScore ? current : best;
    });
  }
  
  /**
   * Add review markers to content
   */
  private addReviewMarkers(
    content: string,
    qualityMetrics: QualityMetrics,
    voiceAnalysis?: VoiceConsistencyAnalysis
  ): string {
    let marked = `[REQUIRES MANUAL REVIEW]\n`;
    marked += `Quality Score: ${(qualityMetrics.overallScore * 100).toFixed(1)}%\n`;
    
    if (voiceAnalysis) {
      marked += `Brand Voice Score: ${(voiceAnalysis.overallConsistency * 100).toFixed(1)}%\n`;
    }
    
    marked += `\nISSUES:\n`;
    qualityMetrics.issues.slice(0, 3).forEach(issue => {
      marked += `- ${issue.description}\n`;
    });
    
    marked += `\n---\n${content}`;
    
    return marked;
  }
  
  /**
   * Identify improvements between attempts
   */
  private identifyImprovements(
    oldMetrics: QualityMetrics,
    newMetrics: QualityMetrics
  ): string[] {
    const improvements: string[] = [];
    
    if (newMetrics.coherenceScore > oldMetrics.coherenceScore) {
      improvements.push('Improved logical flow');
    }
    
    if (newMetrics.hookStrength > oldMetrics.hookStrength) {
      improvements.push('Stronger opening hook');
    }
    
    if (newMetrics.ctaEffectiveness > oldMetrics.ctaEffectiveness) {
      improvements.push('Better call-to-action');
    }
    
    if (newMetrics.readabilityScore > oldMetrics.readabilityScore) {
      improvements.push('Enhanced readability');
    }
    
    if (newMetrics.professionalismScore > oldMetrics.professionalismScore) {
      improvements.push('More professional tone');
    }
    
    return improvements;
  }
  
  /**
   * Extract learnings from regeneration attempts
   */
  private extractLearnings(
    attempts: RegenerationAttempt[],
    outcome: 'success' | 'failure'
  ): RegenerationLearning[] {
    const learnings: RegenerationLearning[] = [];
    
    if (outcome === 'success' && attempts.length > 0) {
      const successfulAttempt = attempts[attempts.length - 1];
      
      // Learn from successful patterns
      successfulAttempt.improvements.forEach(improvement => {
        learnings.push({
          type: 'successful_pattern',
          description: improvement,
          pattern: successfulAttempt.strategy,
          confidence: 0.8
        });
      });
    } else {
      // Learn from failures
      attempts.forEach(attempt => {
        attempt.qualityMetrics.issues
          .filter(issue => issue.severity === 'critical')
          .forEach(issue => {
            learnings.push({
              type: 'quality_issue',
              description: issue.description,
              pattern: `Failed to fix: ${issue.category}`,
              confidence: 0.6
            });
          });
      });
    }
    
    return learnings;
  }
  
  /**
   * Store learnings for future use
   */
  private storeLearnings(
    request: LanguageAwareContentRequest,
    learnings: RegenerationLearning[]
  ): void {
    const key = `${request.type}_${request.tone}_${request.purpose}`;
    const existing = this.learningDatabase.get(key) || [];
    
    // Merge and deduplicate learnings
    const merged = [...existing, ...learnings];
    const unique = merged.filter((learning, index, self) =>
      index === self.findIndex(l => 
        l.description === learning.description && l.type === learning.type
      )
    );
    
    // Keep only the most recent 100 learnings
    this.learningDatabase.set(key, unique.slice(-100));
  }
  
  /**
   * Get relevant learnings for a request
   */
  private getLearnings(request: LanguageAwareContentRequest): RegenerationLearning[] {
    const key = `${request.type}_${request.tone}_${request.purpose}`;
    return this.learningDatabase.get(key) || [];
  }
  
  /**
   * Apply learnings to improvement prompt
   */
  private applyLearnings(
    prompt: string,
    learnings: RegenerationLearning[]
  ): string {
    if (learnings.length === 0) return prompt;
    
    let enhanced = prompt + '\n\nLEARNED PATTERNS:\n';
    
    // Add successful patterns
    const successPatterns = learnings
      .filter(l => l.type === 'successful_pattern')
      .slice(0, 3);
    
    if (successPatterns.length > 0) {
      enhanced += 'Previously successful improvements:\n';
      successPatterns.forEach(pattern => {
        enhanced += `- ${pattern.description}`;
        if (pattern.solution) {
          enhanced += ` (Solution: ${pattern.solution})`;
        }
        enhanced += '\n';
      });
    }
    
    // Add known issues to avoid
    const knownIssues = learnings
      .filter(l => l.type === 'quality_issue')
      .slice(0, 3);
    
    if (knownIssues.length > 0) {
      enhanced += '\nKnown issues to avoid:\n';
      knownIssues.forEach(issue => {
        enhanced += `- ${issue.description}\n`;
      });
    }
    
    return enhanced;
  }
  
  /**
   * Extract key elements to preserve
   */
  private extractKeyElements(
    content: string,
    preserveElements?: string[]
  ): string[] {
    const keywords: string[] = [];
    
    // Extract numbers and statistics
    const numbers = content.match(/\d+%|\d+\s+\w+/g) || [];
    keywords.push(...numbers);
    
    // Extract questions
    const questions = content.match(/[^.!?]*\?/g) || [];
    if (questions.length > 0 && preserveElements?.includes('engagement_elements')) {
      keywords.push(questions[0]); // Keep the main question
    }
    
    // Extract key phrases
    const keyPhrases = [
      'game-changer', 'breakthrough', 'innovative', 'transform',
      'success', 'growth', 'impact', 'results'
    ];
    
    keyPhrases.forEach(phrase => {
      if (content.toLowerCase().includes(phrase)) {
        keywords.push(phrase);
      }
    });
    
    return keywords.slice(0, 10); // Limit to top 10
  }
  
  /**
   * Batch regeneration for multiple posts
   */
  public async batchRegenerate(
    posts: Array<{
      content: string;
      request: LanguageAwareContentRequest;
      brandProfileId?: string;
    }>
  ): Promise<RegenerationResult[]> {
    const results: RegenerationResult[] = [];
    
    // Process in parallel with limit
    const batchSize = 3;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(post => 
          this.regenerateIfNeeded(post.content, post.request, post.brandProfileId)
        )
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Get regeneration statistics
   */
  public getStatistics(): {
    totalRegenerations: number;
    successRate: number;
    averageAttempts: number;
    commonIssues: string[];
    learningsCount: number;
  } {
    // This would typically query a database
    // For now, return mock statistics
    return {
      totalRegenerations: 0,
      successRate: 0,
      averageAttempts: 0,
      commonIssues: [],
      learningsCount: Array.from(this.learningDatabase.values())
        .reduce((sum, learnings) => sum + learnings.length, 0)
    };
  }
}

// Export singleton instance
export const regenerationTrigger = RegenerationTrigger.getInstance();