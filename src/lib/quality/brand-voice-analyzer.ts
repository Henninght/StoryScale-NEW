/**
 * Brand Voice Analyzer - Ensures content consistency with brand guidelines
 * Maintains consistent voice across all LinkedIn posts
 */

import { SupportedLanguage } from '../types/language-aware-request';

export interface BrandVoiceProfile {
  id: string;
  name: string;
  description: string;
  
  // Voice characteristics
  tone: VoiceTone[];
  personality: PersonalityTrait[];
  values: string[];
  
  // Language preferences
  vocabulary: VocabularyPreferences;
  sentenceStructure: StructurePreferences;
  
  // Content patterns
  storytellingStyle: 'personal' | 'corporate' | 'educational' | 'inspirational';
  perspectivePreference: 'first-person' | 'second-person' | 'third-person' | 'mixed';
  
  // LinkedIn-specific
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'frequent';
  hashtagStyle: 'camelCase' | 'lowercase' | 'UPPERCASE' | 'mixed';
  formattingPreference: FormattingStyle[];
  
  // Examples
  exemplarPosts: string[];
  avoidExamples: string[];
}

export type VoiceTone = 
  | 'professional' | 'casual' | 'formal' | 'friendly'
  | 'authoritative' | 'conversational' | 'enthusiastic'
  | 'empathetic' | 'confident' | 'humble' | 'bold'
  | 'witty' | 'serious' | 'optimistic' | 'pragmatic';

export type PersonalityTrait =
  | 'innovative' | 'traditional' | 'analytical' | 'creative'
  | 'data-driven' | 'people-focused' | 'results-oriented'
  | 'collaborative' | 'independent' | 'visionary' | 'practical';

export interface VocabularyPreferences {
  complexity: 'simple' | 'moderate' | 'sophisticated';
  jargonLevel: 'none' | 'minimal' | 'industry-standard' | 'technical';
  preferredTerms: Map<string, string>;
  bannedWords: string[];
  powerWords: string[]; // Words that resonate with the brand
}

export interface StructurePreferences {
  sentenceLength: 'short' | 'medium' | 'varied' | 'long';
  paragraphLength: 'brief' | 'standard' | 'detailed';
  useOfQuestions: 'frequent' | 'occasional' | 'rare';
  useOfStatistics: 'heavy' | 'moderate' | 'light';
}

export type FormattingStyle = 
  | 'bullet-points' | 'numbered-lists' | 'paragraphs'
  | 'short-lines' | 'emoji-bullets' | 'arrow-points';

export interface VoiceConsistencyAnalysis {
  overallConsistency: number; // 0-1 score
  toneAlignment: number;
  vocabularyMatch: number;
  structureAlignment: number;
  personalityMatch: number;
  
  deviations: VoiceDeviation[];
  suggestions: VoiceImprovement[];
  alignedElements: string[];
}

export interface VoiceDeviation {
  type: 'tone' | 'vocabulary' | 'structure' | 'personality' | 'style';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  location: string;
  expected: string;
  found: string;
}

export interface VoiceImprovement {
  type: 'replacement' | 'restructure' | 'addition' | 'removal';
  target: string;
  suggestion: string;
  reason: string;
  impact: number; // Expected improvement in consistency score
}

export class BrandVoiceAnalyzer {
  private static instance: BrandVoiceAnalyzer;
  private profiles: Map<string, BrandVoiceProfile> = new Map();
  private activeProfile: BrandVoiceProfile | null = null;
  
  // Pre-defined brand voice templates for LinkedIn
  private readonly templates = {
    thoughtLeader: {
      tone: ['authoritative', 'confident', 'professional'] as VoiceTone[],
      personality: ['visionary', 'analytical', 'innovative'] as PersonalityTrait[],
      storytellingStyle: 'educational' as const,
      perspectivePreference: 'first-person' as const,
      emojiUsage: 'minimal' as const
    },
    
    entrepreneur: {
      tone: ['enthusiastic', 'bold', 'conversational'] as VoiceTone[],
      personality: ['innovative', 'results-oriented', 'creative'] as PersonalityTrait[],
      storytellingStyle: 'personal' as const,
      perspectivePreference: 'first-person' as const,
      emojiUsage: 'moderate' as const
    },
    
    corporate: {
      tone: ['professional', 'formal', 'authoritative'] as VoiceTone[],
      personality: ['traditional', 'data-driven', 'results-oriented'] as PersonalityTrait[],
      storytellingStyle: 'corporate' as const,
      perspectivePreference: 'third-person' as const,
      emojiUsage: 'none' as const
    },
    
    consultant: {
      tone: ['professional', 'empathetic', 'pragmatic'] as VoiceTone[],
      personality: ['analytical', 'people-focused', 'practical'] as PersonalityTrait[],
      storytellingStyle: 'educational' as const,
      perspectivePreference: 'second-person' as const,
      emojiUsage: 'minimal' as const
    }
  };
  
  private constructor() {
    this.initializeDefaultProfiles();
  }
  
  public static getInstance(): BrandVoiceAnalyzer {
    if (!BrandVoiceAnalyzer.instance) {
      BrandVoiceAnalyzer.instance = new BrandVoiceAnalyzer();
    }
    return BrandVoiceAnalyzer.instance;
  }
  
  /**
   * Analyze content for brand voice consistency
   */
  public analyzeVoiceConsistency(
    content: string,
    profileId?: string
  ): VoiceConsistencyAnalysis {
    const profile = profileId 
      ? this.profiles.get(profileId) 
      : this.activeProfile;
    
    if (!profile) {
      throw new Error('No brand voice profile specified');
    }
    
    // Analyze different aspects of voice consistency
    const toneAlignment = this.analyzeToneAlignment(content, profile);
    const vocabularyMatch = this.analyzeVocabularyMatch(content, profile);
    const structureAlignment = this.analyzeStructureAlignment(content, profile);
    const personalityMatch = this.analyzePersonalityMatch(content, profile);
    
    // Calculate overall consistency
    const overallConsistency = this.calculateOverallConsistency({
      toneAlignment,
      vocabularyMatch,
      structureAlignment,
      personalityMatch
    });
    
    // Identify deviations
    const deviations = this.identifyDeviations(content, profile);
    
    // Generate improvement suggestions
    const suggestions = this.generateImprovements(content, profile, deviations);
    
    // Identify aligned elements
    const alignedElements = this.identifyAlignedElements(content, profile);
    
    return {
      overallConsistency,
      toneAlignment,
      vocabularyMatch,
      structureAlignment,
      personalityMatch,
      deviations,
      suggestions,
      alignedElements
    };
  }
  
  /**
   * Learn brand voice from successful posts
   */
  public learnFromContent(
    successfulPosts: string[],
    profileName: string
  ): BrandVoiceProfile {
    const profile: BrandVoiceProfile = {
      id: `profile_${Date.now()}`,
      name: profileName,
      description: `Learned from ${successfulPosts.length} successful posts`,
      tone: this.extractTone(successfulPosts),
      personality: this.extractPersonality(successfulPosts),
      values: this.extractValues(successfulPosts),
      vocabulary: this.extractVocabularyPreferences(successfulPosts),
      sentenceStructure: this.extractStructurePreferences(successfulPosts),
      storytellingStyle: this.detectStorytellingStyle(successfulPosts),
      perspectivePreference: this.detectPerspective(successfulPosts),
      emojiUsage: this.detectEmojiUsage(successfulPosts),
      hashtagStyle: this.detectHashtagStyle(successfulPosts),
      formattingPreference: this.detectFormattingStyles(successfulPosts),
      exemplarPosts: successfulPosts.slice(0, 5),
      avoidExamples: []
    };
    
    this.profiles.set(profile.id, profile);
    return profile;
  }
  
  /**
   * Set active brand voice profile
   */
  public setActiveProfile(profileId: string): void {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }
    this.activeProfile = profile;
  }
  
  /**
   * Get or create profile from template
   */
  public getTemplateProfile(
    templateName: keyof typeof this.templates
  ): BrandVoiceProfile {
    const templateId = `template_${templateName}`;
    
    if (!this.profiles.has(templateId)) {
      const template = this.templates[templateName];
      const profile: BrandVoiceProfile = {
        id: templateId,
        name: `${templateName} Template`,
        description: `Pre-defined ${templateName} voice profile`,
        tone: template.tone,
        personality: template.personality,
        values: [],
        vocabulary: {
          complexity: templateName === 'corporate' ? 'sophisticated' : 'moderate',
          jargonLevel: templateName === 'corporate' ? 'industry-standard' : 'minimal',
          preferredTerms: new Map(),
          bannedWords: [],
          powerWords: []
        },
        sentenceStructure: {
          sentenceLength: templateName === 'entrepreneur' ? 'short' : 'medium',
          paragraphLength: 'standard',
          useOfQuestions: templateName === 'consultant' ? 'frequent' : 'occasional',
          useOfStatistics: templateName === 'thoughtLeader' ? 'heavy' : 'moderate'
        },
        storytellingStyle: template.storytellingStyle,
        perspectivePreference: template.perspectivePreference,
        emojiUsage: template.emojiUsage,
        hashtagStyle: 'camelCase',
        formattingPreference: ['paragraphs', 'bullet-points'],
        exemplarPosts: [],
        avoidExamples: []
      };
      
      this.profiles.set(templateId, profile);
    }
    
    return this.profiles.get(templateId)!;
  }
  
  // Analysis methods
  
  private analyzeToneAlignment(content: string, profile: BrandVoiceProfile): number {
    let score = 0;
    const totalTones = profile.tone.length;
    
    profile.tone.forEach(tone => {
      if (this.detectTone(content, tone)) {
        score += 1;
      }
    });
    
    return totalTones > 0 ? score / totalTones : 0;
  }
  
  private analyzeVocabularyMatch(content: string, profile: BrandVoiceProfile): number {
    let score = 1.0;
    const words = content.toLowerCase().split(/\s+/);
    
    // Check for banned words
    profile.vocabulary.bannedWords.forEach(banned => {
      if (words.includes(banned.toLowerCase())) {
        score -= 0.1;
      }
    });
    
    // Check for power words usage
    let powerWordCount = 0;
    profile.vocabulary.powerWords.forEach(power => {
      if (content.toLowerCase().includes(power.toLowerCase())) {
        powerWordCount++;
      }
    });
    
    if (profile.vocabulary.powerWords.length > 0) {
      const powerWordRatio = powerWordCount / profile.vocabulary.powerWords.length;
      score = score * 0.7 + powerWordRatio * 0.3;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  private analyzeStructureAlignment(content: string, profile: BrandVoiceProfile): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => 
      sum + s.split(/\s+/).length, 0
    ) / Math.max(sentences.length, 1);
    
    let score = 0.5;
    
    // Check sentence length preference
    const { sentenceLength } = profile.sentenceStructure;
    if (sentenceLength === 'short' && avgSentenceLength < 10) score += 0.3;
    else if (sentenceLength === 'medium' && avgSentenceLength >= 10 && avgSentenceLength <= 20) score += 0.3;
    else if (sentenceLength === 'long' && avgSentenceLength > 20) score += 0.3;
    else if (sentenceLength === 'varied') score += 0.2; // Varied is more flexible
    
    // Check question usage
    const questionCount = (content.match(/\?/g) || []).length;
    const { useOfQuestions } = profile.sentenceStructure;
    if (useOfQuestions === 'frequent' && questionCount >= 3) score += 0.2;
    else if (useOfQuestions === 'occasional' && questionCount >= 1 && questionCount <= 2) score += 0.2;
    else if (useOfQuestions === 'rare' && questionCount <= 1) score += 0.2;
    
    return Math.min(1, score);
  }
  
  private analyzePersonalityMatch(content: string, profile: BrandVoiceProfile): number {
    let matchCount = 0;
    
    profile.personality.forEach(trait => {
      if (this.detectPersonalityTrait(content, trait)) {
        matchCount++;
      }
    });
    
    return profile.personality.length > 0 
      ? matchCount / profile.personality.length 
      : 0.5;
  }
  
  private calculateOverallConsistency(scores: Record<string, number>): number {
    const weights = {
      toneAlignment: 0.3,
      vocabularyMatch: 0.25,
      structureAlignment: 0.2,
      personalityMatch: 0.25
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (key in scores) {
        weightedSum += scores[key] * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  private identifyDeviations(
    content: string,
    profile: BrandVoiceProfile
  ): VoiceDeviation[] {
    const deviations: VoiceDeviation[] = [];
    
    // Check perspective
    const detectedPerspective = this.detectPerspective([content]);
    if (detectedPerspective !== profile.perspectivePreference) {
      deviations.push({
        type: 'style',
        severity: 'moderate',
        description: 'Perspective mismatch',
        location: 'Throughout content',
        expected: profile.perspectivePreference,
        found: detectedPerspective
      });
    }
    
    // Check emoji usage
    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    const expectedEmojiLevel = profile.emojiUsage;
    if (
      (expectedEmojiLevel === 'none' && emojiCount > 0) ||
      (expectedEmojiLevel === 'minimal' && emojiCount > 2) ||
      (expectedEmojiLevel === 'moderate' && (emojiCount === 0 || emojiCount > 5))
    ) {
      deviations.push({
        type: 'style',
        severity: 'minor',
        description: 'Emoji usage inconsistent with brand voice',
        location: 'Throughout content',
        expected: expectedEmojiLevel,
        found: `${emojiCount} emojis`
      });
    }
    
    // Check vocabulary
    const words = content.toLowerCase().split(/\s+/);
    profile.vocabulary.bannedWords.forEach(banned => {
      if (words.includes(banned.toLowerCase())) {
        deviations.push({
          type: 'vocabulary',
          severity: 'major',
          description: 'Banned word detected',
          location: `Word: "${banned}"`,
          expected: 'Not to use this word',
          found: banned
        });
      }
    });
    
    return deviations;
  }
  
  private generateImprovements(
    content: string,
    profile: BrandVoiceProfile,
    deviations: VoiceDeviation[]
  ): VoiceImprovement[] {
    const improvements: VoiceImprovement[] = [];
    
    deviations.forEach(deviation => {
      if (deviation.type === 'vocabulary' && deviation.severity === 'major') {
        // Suggest replacement for banned words
        const replacement = profile.vocabulary.preferredTerms.get(deviation.found) || '[alternative term]';
        improvements.push({
          type: 'replacement',
          target: deviation.found,
          suggestion: replacement,
          reason: `"${deviation.found}" doesn't align with brand voice`,
          impact: 0.15
        });
      }
      
      if (deviation.type === 'style' && deviation.description === 'Perspective mismatch') {
        improvements.push({
          type: 'restructure',
          target: 'Perspective',
          suggestion: `Rewrite using ${profile.perspectivePreference} perspective`,
          reason: 'Maintain consistent brand perspective',
          impact: 0.2
        });
      }
    });
    
    // Add power word suggestions if missing
    const hasPowerWords = profile.vocabulary.powerWords.some(word =>
      content.toLowerCase().includes(word.toLowerCase())
    );
    
    if (!hasPowerWords && profile.vocabulary.powerWords.length > 0) {
      improvements.push({
        type: 'addition',
        target: 'Power words',
        suggestion: `Consider using words like: ${profile.vocabulary.powerWords.slice(0, 3).join(', ')}`,
        reason: 'Strengthen brand voice with characteristic vocabulary',
        impact: 0.1
      });
    }
    
    return improvements;
  }
  
  private identifyAlignedElements(
    content: string,
    profile: BrandVoiceProfile
  ): string[] {
    const aligned: string[] = [];
    
    // Check tone alignment
    profile.tone.forEach(tone => {
      if (this.detectTone(content, tone)) {
        aligned.push(`${tone} tone maintained`);
      }
    });
    
    // Check formatting
    profile.formattingPreference.forEach(format => {
      if (this.detectFormatting(content, format)) {
        aligned.push(`${format} formatting used effectively`);
      }
    });
    
    // Check storytelling style
    if (this.detectStorytellingStyle([content]) === profile.storytellingStyle) {
      aligned.push(`${profile.storytellingStyle} storytelling style`);
    }
    
    return aligned;
  }
  
  // Detection methods
  
  private detectTone(content: string, tone: VoiceTone): boolean {
    const toneIndicators: Record<VoiceTone, string[]> = {
      professional: ['expertise', 'industry', 'strategic', 'professional'],
      casual: ['hey', 'gonna', 'stuff', 'things'],
      formal: ['therefore', 'furthermore', 'consequently', 'accordingly'],
      friendly: ['thanks', 'appreciate', 'love', 'great'],
      authoritative: ['must', 'should', 'proven', 'fact'],
      conversational: ["you'll", "we've", "let's", "here's"],
      enthusiastic: ['amazing', 'excited', 'fantastic', 'incredible'],
      empathetic: ['understand', 'feel', 'relate', 'experience'],
      confident: ['certain', 'definitely', 'absolutely', 'guaranteed'],
      humble: ['think', 'perhaps', 'might', 'maybe'],
      bold: ['revolutionary', 'game-changing', 'breakthrough', 'transform'],
      witty: ['pun', 'joke', 'humor', 'funny'],
      serious: ['critical', 'important', 'essential', 'vital'],
      optimistic: ['opportunity', 'potential', 'positive', 'bright'],
      pragmatic: ['practical', 'realistic', 'actionable', 'feasible']
    };
    
    const indicators = toneIndicators[tone] || [];
    const lowerContent = content.toLowerCase();
    
    return indicators.some(indicator => lowerContent.includes(indicator));
  }
  
  private detectPersonalityTrait(content: string, trait: PersonalityTrait): boolean {
    const traitIndicators: Record<PersonalityTrait, string[]> = {
      innovative: ['innovative', 'new', 'novel', 'creative'],
      traditional: ['proven', 'established', 'classic', 'traditional'],
      analytical: ['data', 'analysis', 'metrics', 'numbers'],
      creative: ['imagine', 'create', 'design', 'innovate'],
      'data-driven': ['statistics', 'research', 'study', 'findings'],
      'people-focused': ['team', 'people', 'community', 'together'],
      'results-oriented': ['results', 'outcomes', 'achieve', 'deliver'],
      collaborative: ['together', 'collaborate', 'team', 'we'],
      independent: ['I', 'my', 'solo', 'independently'],
      visionary: ['future', 'vision', 'imagine', 'possibility'],
      practical: ['practical', 'actionable', 'implement', 'apply']
    };
    
    const indicators = traitIndicators[trait] || [];
    const lowerContent = content.toLowerCase();
    
    return indicators.some(indicator => lowerContent.includes(indicator));
  }
  
  private detectFormatting(content: string, format: FormattingStyle): boolean {
    switch (format) {
      case 'bullet-points':
        return content.includes('•') || content.includes('- ');
      case 'numbered-lists':
        return /\d+\./.test(content);
      case 'paragraphs':
        return content.split('\n\n').length > 1;
      case 'short-lines':
        return content.split('\n').some(line => line.length < 50);
      case 'emoji-bullets':
        return /^[\u{1F300}-\u{1F9FF}]/gmu.test(content);
      case 'arrow-points':
        return content.includes('→') || content.includes('➜');
      default:
        return false;
    }
  }
  
  // Learning methods
  
  private extractTone(posts: string[]): VoiceTone[] {
    const toneCounts = new Map<VoiceTone, number>();
    const allTones: VoiceTone[] = [
      'professional', 'casual', 'formal', 'friendly',
      'authoritative', 'conversational', 'enthusiastic',
      'empathetic', 'confident', 'humble', 'bold',
      'witty', 'serious', 'optimistic', 'pragmatic'
    ];
    
    posts.forEach(post => {
      allTones.forEach(tone => {
        if (this.detectTone(post, tone)) {
          toneCounts.set(tone, (toneCounts.get(tone) || 0) + 1);
        }
      });
    });
    
    // Return top 3 most common tones
    return Array.from(toneCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tone]) => tone);
  }
  
  private extractPersonality(posts: string[]): PersonalityTrait[] {
    const traitCounts = new Map<PersonalityTrait, number>();
    const allTraits: PersonalityTrait[] = [
      'innovative', 'traditional', 'analytical', 'creative',
      'data-driven', 'people-focused', 'results-oriented',
      'collaborative', 'independent', 'visionary', 'practical'
    ];
    
    posts.forEach(post => {
      allTraits.forEach(trait => {
        if (this.detectPersonalityTrait(post, trait)) {
          traitCounts.set(trait, (traitCounts.get(trait) || 0) + 1);
        }
      });
    });
    
    // Return top 3 most common traits
    return Array.from(traitCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trait]) => trait);
  }
  
  private extractValues(posts: string[]): string[] {
    // Extract common themes and values from posts
    const valueKeywords = [
      'integrity', 'innovation', 'excellence', 'collaboration',
      'transparency', 'growth', 'sustainability', 'diversity',
      'quality', 'customer-focus', 'efficiency', 'creativity'
    ];
    
    const valueCounts = new Map<string, number>();
    
    posts.forEach(post => {
      const lowerPost = post.toLowerCase();
      valueKeywords.forEach(value => {
        if (lowerPost.includes(value)) {
          valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
        }
      });
    });
    
    return Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value]) => value);
  }
  
  private extractVocabularyPreferences(posts: string[]): VocabularyPreferences {
    const allWords = posts.join(' ').toLowerCase().split(/\s+/);
    const wordFrequency = new Map<string, number>();
    
    allWords.forEach(word => {
      if (word.length > 4) { // Focus on meaningful words
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    });
    
    // Identify power words (frequently used impactful words)
    const powerWords = Array.from(wordFrequency.entries())
      .filter(([word, count]) => count >= posts.length / 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    // Determine complexity based on average word length
    const avgWordLength = allWords.reduce((sum, word) => sum + word.length, 0) / allWords.length;
    const complexity = avgWordLength < 5 ? 'simple' : avgWordLength < 7 ? 'moderate' : 'sophisticated';
    
    return {
      complexity,
      jargonLevel: 'minimal', // Would need industry-specific analysis
      preferredTerms: new Map(),
      bannedWords: [],
      powerWords
    };
  }
  
  private extractStructurePreferences(posts: string[]): StructurePreferences {
    let totalSentences = 0;
    let totalWords = 0;
    let totalQuestions = 0;
    let totalStats = 0;
    
    posts.forEach(post => {
      const sentences = post.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = post.split(/\s+/);
      
      totalSentences += sentences.length;
      totalWords += words.length;
      totalQuestions += (post.match(/\?/g) || []).length;
      totalStats += (post.match(/\d+%|\d+\s+\w+/g) || []).length;
    });
    
    const avgSentenceLength = totalWords / Math.max(totalSentences, 1);
    const avgQuestions = totalQuestions / posts.length;
    const avgStats = totalStats / posts.length;
    
    return {
      sentenceLength: avgSentenceLength < 10 ? 'short' : avgSentenceLength < 20 ? 'medium' : 'long',
      paragraphLength: 'standard',
      useOfQuestions: avgQuestions > 2 ? 'frequent' : avgQuestions > 0.5 ? 'occasional' : 'rare',
      useOfStatistics: avgStats > 3 ? 'heavy' : avgStats > 1 ? 'moderate' : 'light'
    };
  }
  
  private detectStorytellingStyle(posts: string[]): 'personal' | 'corporate' | 'educational' | 'inspirational' {
    const styleCounts = {
      personal: 0,
      corporate: 0,
      educational: 0,
      inspirational: 0
    };
    
    posts.forEach(post => {
      const lowerPost = post.toLowerCase();
      
      // Personal indicators
      if (lowerPost.includes(' i ') || lowerPost.includes(' my ') || lowerPost.includes(' me ')) {
        styleCounts.personal++;
      }
      
      // Corporate indicators
      if (lowerPost.includes(' we ') || lowerPost.includes(' our company ') || lowerPost.includes(' organization ')) {
        styleCounts.corporate++;
      }
      
      // Educational indicators
      if (lowerPost.includes('how to') || lowerPost.includes('learn') || lowerPost.includes('guide')) {
        styleCounts.educational++;
      }
      
      // Inspirational indicators
      if (lowerPost.includes('believe') || lowerPost.includes('dream') || lowerPost.includes('possible')) {
        styleCounts.inspirational++;
      }
    });
    
    // Return the most common style
    return Object.entries(styleCounts)
      .sort((a, b) => b[1] - a[1])[0][0] as any;
  }
  
  private detectPerspective(posts: string[]): 'first-person' | 'second-person' | 'third-person' | 'mixed' {
    const perspectiveCounts = {
      first: 0,
      second: 0,
      third: 0
    };
    
    posts.forEach(post => {
      const words = post.toLowerCase().split(/\s+/);
      
      // First person
      const firstPerson = words.filter(w => ['i', 'me', 'my', 'we', 'our', 'us'].includes(w)).length;
      
      // Second person
      const secondPerson = words.filter(w => ['you', 'your', "you're", "you'll"].includes(w)).length;
      
      // Update counts
      if (firstPerson > secondPerson * 2) perspectiveCounts.first++;
      else if (secondPerson > firstPerson * 2) perspectiveCounts.second++;
      else if (firstPerson === 0 && secondPerson === 0) perspectiveCounts.third++;
    });
    
    const total = posts.length;
    if (perspectiveCounts.first > total * 0.6) return 'first-person';
    if (perspectiveCounts.second > total * 0.6) return 'second-person';
    if (perspectiveCounts.third > total * 0.6) return 'third-person';
    return 'mixed';
  }
  
  private detectEmojiUsage(posts: string[]): 'none' | 'minimal' | 'moderate' | 'frequent' {
    const emojiCounts = posts.map(post =>
      (post.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length
    );
    
    const avgEmojis = emojiCounts.reduce((sum, count) => sum + count, 0) / posts.length;
    
    if (avgEmojis === 0) return 'none';
    if (avgEmojis < 1) return 'minimal';
    if (avgEmojis < 3) return 'moderate';
    return 'frequent';
  }
  
  private detectHashtagStyle(posts: string[]): 'camelCase' | 'lowercase' | 'UPPERCASE' | 'mixed' {
    const hashtags: string[] = [];
    
    posts.forEach(post => {
      const matches = post.match(/#\w+/g) || [];
      hashtags.push(...matches);
    });
    
    if (hashtags.length === 0) return 'camelCase'; // Default
    
    const styleCounts = {
      camelCase: 0,
      lowercase: 0,
      uppercase: 0
    };
    
    hashtags.forEach(tag => {
      const tagContent = tag.substring(1); // Remove #
      
      if (tagContent === tagContent.toLowerCase()) {
        styleCounts.lowercase++;
      } else if (tagContent === tagContent.toUpperCase()) {
        styleCounts.uppercase++;
      } else {
        styleCounts.camelCase++;
      }
    });
    
    // Return most common style
    const sorted = Object.entries(styleCounts).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === 0) return 'mixed';
    return sorted[0][0] as any;
  }
  
  private detectFormattingStyles(posts: string[]): FormattingStyle[] {
    const styles = new Set<FormattingStyle>();
    
    posts.forEach(post => {
      if (post.includes('•') || post.includes('- ')) styles.add('bullet-points');
      if (/\d+\./.test(post)) styles.add('numbered-lists');
      if (post.split('\n\n').length > 1) styles.add('paragraphs');
      if (post.split('\n').some(line => line.length < 50 && line.length > 0)) styles.add('short-lines');
      if (/^[\u{1F300}-\u{1F9FF}]/gmu.test(post)) styles.add('emoji-bullets');
      if (post.includes('→') || post.includes('➜')) styles.add('arrow-points');
    });
    
    return Array.from(styles);
  }
  
  private initializeDefaultProfiles(): void {
    // Initialize with template profiles
    Object.keys(this.templates).forEach(templateName => {
      this.getTemplateProfile(templateName as keyof typeof this.templates);
    });
  }
}

// Export singleton instance
export const brandVoiceAnalyzer = BrandVoiceAnalyzer.getInstance();