/**
 * LinkedIn Cache Warming Service
 * Pre-generates and caches common LinkedIn post patterns for sub-second response times
 */

import { CacheOptimizer } from './cache-optimizer';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  SupportedLanguage,
} from '../types/language-aware-request';

interface LinkedInPattern {
  id: string;
  name: string;
  description: string;
  frequency: 'very-high' | 'high' | 'medium' | 'low';
  template: Partial<LanguageAwareContentRequest>;
  variations?: Array<Partial<LanguageAwareContentRequest>>;
}

export class LinkedInWarmingService {
  private static instance: LinkedInWarmingService;
  private cacheOptimizer: CacheOptimizer;
  private patterns: LinkedInPattern[] = [];
  private warmingInterval?: NodeJS.Timeout;
  private isWarming: boolean = false;

  private constructor() {
    this.cacheOptimizer = CacheOptimizer.getInstance();
    this.initializePatterns();
    this.startWarmingCycle();
  }

  public static getInstance(): LinkedInWarmingService {
    if (!LinkedInWarmingService.instance) {
      LinkedInWarmingService.instance = new LinkedInWarmingService();
    }
    return LinkedInWarmingService.instance;
  }

  /**
   * Initialize common LinkedIn post patterns
   */
  private initializePatterns(): void {
    this.patterns = [
      // Professional announcement patterns
      {
        id: 'prof-announcement-en',
        name: 'Professional Announcement (English)',
        description: 'New role, promotion, achievement announcements',
        frequency: 'very-high',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'en' as SupportedLanguage,
          tone: 'professional',
          targetAudience: 'professional network',
          style: 'announcement',
        },
        variations: [
          { keywords: ['promotion', 'new role', 'excited to announce'] },
          { keywords: ['joined', 'starting', 'new journey'] },
          { keywords: ['achievement', 'milestone', 'proud'] },
        ],
      },
      {
        id: 'prof-announcement-no',
        name: 'Professional Announcement (Norwegian)',
        description: 'Karrierekunngjøringer på norsk',
        frequency: 'high',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'no' as SupportedLanguage,
          tone: 'professional',
          targetAudience: 'norsk nettverk',
          style: 'announcement',
          culturalContext: {
            market: 'norway',
            businessType: 'b2b',
            dialectPreference: 'bokmål',
            formalityLevel: 'neutral',
            localReferences: true,
          },
        },
        variations: [
          { keywords: ['ny stilling', 'forfremmelse', 'karriere'] },
          { keywords: ['starter', 'ny reise', 'blir med'] },
        ],
      },

      // Thought leadership patterns
      {
        id: 'thought-leadership-tech',
        name: 'Tech Thought Leadership',
        description: 'Insights and opinions on technology trends',
        frequency: 'very-high',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'en' as SupportedLanguage,
          tone: 'thought-provoking',
          targetAudience: 'tech professionals',
          style: 'thought leadership',
        },
        variations: [
          { keywords: ['AI', 'artificial intelligence', 'future'] },
          { keywords: ['innovation', 'disruption', 'transformation'] },
          { keywords: ['data', 'analytics', 'insights'] },
          { keywords: ['automation', 'efficiency', 'productivity'] },
        ],
      },

      // Industry insights
      {
        id: 'industry-insights',
        name: 'Industry Insights',
        description: 'Analysis and insights about industry trends',
        frequency: 'high',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'en' as SupportedLanguage,
          tone: 'insightful',
          targetAudience: 'industry professionals',
          style: 'analytical',
        },
        variations: [
          { keywords: ['market trends', 'analysis', 'forecast'] },
          { keywords: ['industry report', 'statistics', 'growth'] },
          { keywords: ['challenges', 'opportunities', 'outlook'] },
        ],
      },

      // Company updates
      {
        id: 'company-update',
        name: 'Company Update',
        description: 'Company news, product launches, team updates',
        frequency: 'high',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'en' as SupportedLanguage,
          tone: 'exciting',
          targetAudience: 'customers and partners',
          style: 'company update',
        },
        variations: [
          { keywords: ['product launch', 'new feature', 'release'] },
          { keywords: ['team growth', 'hiring', 'welcome'] },
          { keywords: ['partnership', 'collaboration', 'together'] },
          { keywords: ['milestone', 'anniversary', 'celebration'] },
        ],
      },

      // Educational content
      {
        id: 'educational-tips',
        name: 'Educational Tips',
        description: 'Tips, tutorials, and how-to content',
        frequency: 'very-high',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'en' as SupportedLanguage,
          tone: 'educational',
          targetAudience: 'professionals seeking knowledge',
          style: 'educational',
        },
        variations: [
          { keywords: ['5 tips', '10 ways', 'how to'] },
          { keywords: ['guide', 'tutorial', 'learn'] },
          { keywords: ['best practices', 'mistakes to avoid', 'lessons'] },
          { keywords: ['productivity', 'efficiency', 'workflow'] },
        ],
      },

      // Personal story
      {
        id: 'personal-story',
        name: 'Personal Story',
        description: 'Personal experiences and lessons learned',
        frequency: 'medium',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'en' as SupportedLanguage,
          tone: 'conversational',
          targetAudience: 'professional network',
          style: 'storytelling',
        },
        variations: [
          { keywords: ['learned', 'experience', 'journey'] },
          { keywords: ['failure', 'success', 'growth'] },
          { keywords: ['mentor', 'advice', 'wisdom'] },
        ],
      },

      // Event promotion
      {
        id: 'event-promotion',
        name: 'Event Promotion',
        description: 'Webinars, conferences, meetups promotion',
        frequency: 'medium',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'en' as SupportedLanguage,
          tone: 'enthusiastic',
          targetAudience: 'event attendees',
          style: 'promotional',
        },
        variations: [
          { keywords: ['webinar', 'register', 'join us'] },
          { keywords: ['conference', 'summit', 'event'] },
          { keywords: ['speaking', 'presenting', 'panel'] },
        ],
      },

      // Job posting
      {
        id: 'job-posting',
        name: 'Job Posting',
        description: 'Hiring announcements and job opportunities',
        frequency: 'high',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'en' as SupportedLanguage,
          tone: 'welcoming',
          targetAudience: 'job seekers',
          style: 'job posting',
        },
        variations: [
          { keywords: ['hiring', 'looking for', 'join our team'] },
          { keywords: ['opportunity', 'position', 'role'] },
          { keywords: ['remote', 'hybrid', 'flexible'] },
        ],
      },

      // Norwegian business content
      {
        id: 'norsk-business',
        name: 'Norwegian Business Content',
        description: 'Business content for Norwegian market',
        frequency: 'medium',
        template: {
          type: 'linkedin-post',
          outputLanguage: 'no' as SupportedLanguage,
          tone: 'professional',
          targetAudience: 'norske bedrifter',
          style: 'business',
          culturalContext: {
            market: 'norway',
            businessType: 'b2b',
            dialectPreference: 'bokmål',
            formalityLevel: 'professional',
            localReferences: true,
          },
        },
        variations: [
          { keywords: ['bærekraft', 'grønn omstilling', 'miljø'] },
          { keywords: ['digitalisering', 'teknologi', 'innovasjon'] },
          { keywords: ['samarbeid', 'partnerskap', 'nettverk'] },
        ],
      },
    ];
  }

  /**
   * Start the warming cycle
   */
  private startWarmingCycle(): void {
    // Initial warming
    this.warmHighPriorityPatterns();

    // Set up periodic warming (every 10 minutes)
    this.warmingInterval = setInterval(() => {
      this.warmPatterns();
    }, 10 * 60 * 1000);
  }

  /**
   * Warm high-priority patterns immediately
   */
  public async warmHighPriorityPatterns(): Promise<void> {
    if (this.isWarming) return;
    this.isWarming = true;

    const highPriorityPatterns = this.patterns.filter(
      p => p.frequency === 'very-high' || p.frequency === 'high'
    );

    console.log(`[Cache Warming] Starting high-priority warming for ${highPriorityPatterns.length} patterns`);

    for (const pattern of highPriorityPatterns) {
      await this.warmPattern(pattern);
    }

    this.isWarming = false;
    console.log('[Cache Warming] High-priority warming complete');
  }

  /**
   * Warm all patterns based on frequency
   */
  public async warmPatterns(): Promise<void> {
    if (this.isWarming) return;
    this.isWarming = true;

    console.log(`[Cache Warming] Starting full pattern warming`);

    // Sort by frequency priority
    const sortedPatterns = [...this.patterns].sort((a, b) => {
      const priorityMap = { 'very-high': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return priorityMap[a.frequency] - priorityMap[b.frequency];
    });

    for (const pattern of sortedPatterns) {
      // Skip low-frequency patterns during regular warming
      if (pattern.frequency === 'low' && Math.random() > 0.3) continue;
      
      await this.warmPattern(pattern);
    }

    this.isWarming = false;
    console.log('[Cache Warming] Full pattern warming complete');
  }

  /**
   * Warm a specific pattern with its variations
   */
  private async warmPattern(pattern: LinkedInPattern): Promise<void> {
    try {
      // Create base request
      const baseRequest: LanguageAwareContentRequest = {
        id: `warm-${pattern.id}-${Date.now()}`,
        ...pattern.template,
        type: pattern.template.type || 'linkedin-post',
        topic: 'general',
        targetAudience: pattern.template.targetAudience || 'professionals',
        tone: pattern.template.tone || 'professional',
        outputLanguage: pattern.template.outputLanguage || 'en',
        timestamp: new Date(),
      } as LanguageAwareContentRequest;

      // Check if already cached
      const cached = await this.cacheOptimizer.get(baseRequest);
      if (cached) {
        console.log(`[Cache Warming] Pattern ${pattern.id} already cached`);
        return;
      }

      // Generate and cache base pattern
      const response = await this.generateMockResponse(baseRequest, pattern);
      if (response) {
        await this.cacheOptimizer.set(baseRequest, response, 2000); // 2 second mock generation time
      }

      // Warm variations if defined
      if (pattern.variations) {
        for (const variation of pattern.variations) {
          const varRequest = {
            ...baseRequest,
            ...variation,
            id: `warm-${pattern.id}-var-${Date.now()}`,
          };

          const varCached = await this.cacheOptimizer.get(varRequest);
          if (!varCached) {
            const varResponse = await this.generateMockResponse(varRequest, pattern);
            if (varResponse) {
              await this.cacheOptimizer.set(varRequest, varResponse, 2000);
            }
          }
        }
      }

      console.log(`[Cache Warming] Pattern ${pattern.id} warmed successfully`);
    } catch (error) {
      console.error(`[Cache Warming] Error warming pattern ${pattern.id}:`, error);
    }
  }

  /**
   * Generate mock response for warming
   * In production, this would call the actual generation service
   */
  private async generateMockResponse(
    request: LanguageAwareContentRequest,
    pattern: LinkedInPattern
  ): Promise<LanguageAwareResponse> {
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockContent = this.getMockContent(pattern, request.outputLanguage);

    return {
      id: `response-${request.id}`,
      requestId: request.id,
      content: mockContent,
      language: request.outputLanguage,
      metadata: {
        generatedAt: new Date(),
        modelUsed: 'gpt-5-mini',
        tokensUsed: 150,
        processingTime: 100,
        cacheHit: false,
        wasTranslated: false,
        confidence: 0.95,
        qualityScore: {
          overall: 0.92,
          relevance: 0.95,
          engagement: 0.90,
          clarity: 0.91,
        },
      },
      alternatives: [],
      culturalAdaptations: request.culturalContext ? {
        adaptedPhrases: [],
        localReferences: [],
        warnings: [],
      } : undefined,
    };
  }

  /**
   * Get mock content for pattern
   */
  private getMockContent(pattern: LinkedInPattern, language: SupportedLanguage): string {
    const contentMap: Record<string, Record<SupportedLanguage, string>> = {
      'prof-announcement-en': {
        en: "🎉 Excited to share that I'm starting a new chapter in my career! After an incredible journey, I'm thrilled to announce my new role as [Position] at [Company]. Looking forward to contributing to innovative solutions and working with an amazing team. Thank you to everyone who has supported me along the way! #NewBeginnings #CareerGrowth #Excited",
        no: "",
      },
      'prof-announcement-no': {
        no: "🎉 Gledelig nyhet! Jeg er stolt over å kunne dele at jeg starter i ny stilling som [Stilling] hos [Selskap]. Ser frem til spennende utfordringer og å bidra til selskapets videre vekst sammen med et fantastisk team. Takk til alle som har støttet meg på veien! #NyMulighet #Karriere #Stolt",
        en: "",
      },
      'thought-leadership-tech': {
        en: "The rise of AI is not just transforming how we work—it's redefining what work means. As we integrate these powerful tools, the key question isn't 'Will AI replace us?' but 'How can we collaborate with AI to unlock human potential?' Here are 3 ways forward: 1) Focus on uniquely human skills 2) Embrace continuous learning 3) Lead with empathy and creativity. What's your take? #AI #FutureOfWork #Innovation",
        no: "",
      },
      'educational-tips': {
        en: "5 LinkedIn tips that boosted my engagement by 300%: 1️⃣ Post consistently (3-4x/week) 2️⃣ Use storytelling to connect 3️⃣ Engage genuinely with others' content 4️⃣ Share failures alongside successes 5️⃣ Always provide value first. Which tip will you try this week? #LinkedInTips #ProfessionalGrowth #Networking",
        no: "",
      },
    };

    return contentMap[pattern.id]?.[language] || 
           `[Warmed ${pattern.name} content for ${language === 'no' ? 'Norwegian' : 'English'} audience]`;
  }

  /**
   * Get warming statistics
   */
  public async getStats(): Promise<{
    patternsConfigured: number;
    highPriorityPatterns: number;
    isCurrentlyWarming: boolean;
    nextWarmingIn: number; // minutes
  }> {
    const highPriority = this.patterns.filter(
      p => p.frequency === 'very-high' || p.frequency === 'high'
    ).length;

    return {
      patternsConfigured: this.patterns.length,
      highPriorityPatterns: highPriority,
      isCurrentlyWarming: this.isWarming,
      nextWarmingIn: 10, // Fixed 10-minute interval
    };
  }

  /**
   * Add custom pattern for warming
   */
  public addCustomPattern(pattern: LinkedInPattern): void {
    this.patterns.push(pattern);
    
    // Immediately warm if high priority
    if (pattern.frequency === 'very-high' || pattern.frequency === 'high') {
      this.warmPattern(pattern);
    }
  }

  /**
   * Stop warming service
   */
  public stop(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = undefined;
    }
    this.isWarming = false;
  }
}