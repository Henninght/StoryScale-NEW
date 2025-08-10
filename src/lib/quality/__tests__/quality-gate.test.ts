/**
 * Quality Gate Tests - Ensure poor quality content is blocked
 * Tests the complete quality validation and regeneration pipeline
 */

import { QualityValidator } from '../quality-validator';
import { BrandVoiceAnalyzer } from '../brand-voice-analyzer';
import { RegenerationTrigger } from '../regeneration-trigger';
import { LanguageAwareContentRequest } from '../../types/language-aware-request';

describe('Quality Gate Integration', () => {
  let qualityValidator: QualityValidator;
  let brandVoiceAnalyzer: BrandVoiceAnalyzer;
  let regenerationTrigger: RegenerationTrigger;
  
  beforeEach(() => {
    qualityValidator = QualityValidator.getInstance();
    brandVoiceAnalyzer = BrandVoiceAnalyzer.getInstance();
    regenerationTrigger = RegenerationTrigger.getInstance({
      maxAttempts: 3,
      qualityThreshold: 0.7,
      voiceConsistencyThreshold: 0.75,
      improvementStrategy: 'iterative',
      fallbackBehavior: 'manual-review'
    });
  });
  
  describe('Quality Validation', () => {
    it('should reject content below quality threshold', async () => {
      const poorContent = `
        hey guys just wanted to share something...
        i think maybe you might find this interesting or not idk
        basically what happened was like... yeah
        
        anyway let me know what u think!!!!!!
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Professional development',
        language: 'en',
        targetAudience: 'Business professionals',
        tone: 'professional',
        timestamp: new Date()
      };
      
      const metrics = await qualityValidator.validateContent(poorContent, request);
      
      expect(metrics.passesThreshold).toBe(false);
      expect(metrics.overallScore).toBeLessThan(0.7);
      expect(metrics.qualityLevel).toBe('poor');
      expect(metrics.issues.length).toBeGreaterThan(0);
      
      // Check specific LinkedIn metrics
      expect(metrics.hookStrength).toBeLessThan(0.5);
      expect(metrics.professionalismScore).toBeLessThan(0.6);
      expect(metrics.ctaEffectiveness).toBeLessThan(0.5);
    });
    
    it('should approve high-quality LinkedIn content', async () => {
      const goodContent = `
        Did you know that 73% of professionals struggle with imposter syndrome?
        
        After 10 years in leadership roles, I've learned that feeling like a "fraud" 
        is often a sign you're pushing beyond your comfort zone - exactly where 
        growth happens.
        
        Here are 3 strategies that helped me overcome self-doubt:
        
        • Documenting wins: Keep a "success journal" of achievements, no matter how small
        • Seeking feedback: Regular 1-on-1s with mentors provide perspective
        • Teaching others: Sharing knowledge reinforces your expertise
        
        Remember: If you never feel out of your depth, you're not challenging yourself enough.
        
        The most successful leaders I know still experience imposter syndrome. 
        The difference? They've learned to recognize it as a growth signal, not a stop sign.
        
        What's your experience with imposter syndrome? Share your strategies below 👇
        
        #Leadership #ProfessionalDevelopment #GrowthMindset #CareerAdvice
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Overcoming imposter syndrome',
        language: 'en',
        targetAudience: 'Business professionals',
        tone: 'professional',
        timestamp: new Date()
      };
      
      const metrics = await qualityValidator.validateContent(goodContent, request);
      
      expect(metrics.passesThreshold).toBe(true);
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0.7);
      expect(metrics.qualityLevel).toMatch(/excellent|good/);
      
      // Check LinkedIn-specific strengths
      expect(metrics.hookStrength).toBeGreaterThan(0.7);
      expect(metrics.ctaEffectiveness).toBeGreaterThan(0.7);
      expect(metrics.hashtagRelevance).toBeGreaterThan(0.8);
      expect(metrics.lengthOptimization).toBeGreaterThan(0.7);
    });
    
    it('should identify specific quality issues', async () => {
      const problematicContent = `
        AMAZING OPPORTUNITY!!! CHECK THIS OUT NOW!!!
        
        gonna tell u about something
        
        #too #many #random #hashtags #everywhere #spam #content #linkedin #business #work #job #career
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Business opportunity',
        language: 'en',
        targetAudience: 'Professionals',
        timestamp: new Date()
      };
      
      const metrics = await qualityValidator.validateContent(problematicContent, request);
      
      // Check for specific issues
      const hasCapitalizationIssue = metrics.issues.some(
        issue => issue.description.toLowerCase().includes('caps') || 
                 issue.description.toLowerCase().includes('shouting')
      );
      const hasHashtagIssue = metrics.issues.some(
        issue => issue.description.toLowerCase().includes('hashtag')
      );
      const hasLengthIssue = metrics.issues.some(
        issue => issue.description.toLowerCase().includes('short') ||
                 issue.description.toLowerCase().includes('length')
      );
      
      expect(hasCapitalizationIssue).toBe(true);
      expect(hasHashtagIssue).toBe(true);
      expect(hasLengthIssue).toBe(true);
      expect(metrics.professionalismScore).toBeLessThan(0.5);
    });
  });
  
  describe('Brand Voice Consistency', () => {
    it('should detect brand voice deviations', () => {
      // Set up a professional brand profile
      const profile = brandVoiceAnalyzer.getTemplateProfile('corporate');
      brandVoiceAnalyzer.setActiveProfile(profile.id);
      
      const casualContent = `
        Hey folks! 👋 Gonna share something super cool today!
        
        So like, we've been working on this awesome project and it's kinda 
        mind-blowing how much we've achieved. Totally stoked about it!
        
        Wanna hear more? Hit me up! 🚀🔥💪
      `;
      
      const analysis = brandVoiceAnalyzer.analyzeVoiceConsistency(
        casualContent,
        profile.id
      );
      
      expect(analysis.overallConsistency).toBeLessThan(0.75);
      expect(analysis.toneAlignment).toBeLessThan(0.5);
      expect(analysis.deviations.length).toBeGreaterThan(0);
      
      // Check for specific deviations
      const hasEmojiDeviation = analysis.deviations.some(
        d => d.description.includes('emoji')
      );
      const hasToneDeviation = analysis.deviations.some(
        d => d.type === 'tone' || d.type === 'style'
      );
      
      expect(hasEmojiDeviation).toBe(true);
      expect(hasToneDeviation).toBe(true);
    });
    
    it('should approve brand-aligned content', () => {
      const profile = brandVoiceAnalyzer.getTemplateProfile('thoughtLeader');
      brandVoiceAnalyzer.setActiveProfile(profile.id);
      
      const alignedContent = `
        The future of work demands a fundamental shift in how we approach leadership.
        
        After analyzing data from over 500 organizations, three patterns emerge:
        
        1. Adaptive leadership outperforms traditional command-and-control by 47%
        2. Cross-functional collaboration increases innovation output by 3x
        3. Continuous learning cultures see 65% higher employee retention
        
        These findings suggest that tomorrow's successful organizations will be 
        those that embrace flexibility, foster collaboration, and invest in their 
        people's growth.
        
        The question isn't whether to transform, but how quickly you can adapt.
        
        What transformation challenges are you facing in your organization?
      `;
      
      const analysis = brandVoiceAnalyzer.analyzeVoiceConsistency(
        alignedContent,
        profile.id
      );
      
      expect(analysis.overallConsistency).toBeGreaterThan(0.75);
      expect(analysis.toneAlignment).toBeGreaterThan(0.7);
      expect(analysis.personalityMatch).toBeGreaterThan(0.7);
      expect(analysis.alignedElements.length).toBeGreaterThan(0);
    });
  });
  
  describe('Regeneration Trigger', () => {
    it('should not regenerate high-quality content', async () => {
      const excellentContent = `
        3 lessons from building a $10M business in 2 years:
        
        1. Speed beats perfection
        We shipped our MVP in 6 weeks. It was rough, but real user feedback 
        shaped a product people actually wanted.
        
        2. Your network is your net worth
        Every major breakthrough came through connections. Invest in relationships 
        before you need them.
        
        3. Focus is a superpower
        We said no to 100 opportunities to excel at one. That discipline made 
        all the difference.
        
        Building a business isn't about having all the answers. It's about asking 
        better questions and iterating faster than your competition.
        
        What's the most valuable lesson you've learned in business? Share below 👇
        
        #Entrepreneurship #StartupLessons #BusinessGrowth
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Business lessons',
        language: 'en',
        targetAudience: 'Entrepreneurs',
        tone: 'professional',
        timestamp: new Date()
      };
      
      const result = await regenerationTrigger.regenerateIfNeeded(
        excellentContent,
        request
      );
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(0);
      expect(result.requiresManualReview).toBe(false);
      expect(result.finalQualityScore).toBeGreaterThan(0.7);
      expect(result.finalContent).toBe(excellentContent);
    });
    
    it('should attempt to regenerate poor quality content', async () => {
      const poorContent = `
        just some thoughts... maybe interesting?
        
        work stuff happened today.
        
        thoughts?
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Professional insights',
        language: 'en',
        targetAudience: 'Business professionals',
        tone: 'professional',
        timestamp: new Date()
      };
      
      const result = await regenerationTrigger.regenerateIfNeeded(
        poorContent,
        request
      );
      
      expect(result.attempts).toBeGreaterThan(0);
      expect(result.improvementPath.length).toBeGreaterThan(0);
      
      // Should either improve or flag for review
      if (result.success) {
        expect(result.finalQualityScore).toBeGreaterThan(0.5);
        expect(result.finalContent).not.toBe(poorContent);
      } else {
        expect(result.requiresManualReview).toBe(true);
      }
    });
    
    it('should preserve strong elements during regeneration', async () => {
      const mixedContent = `
        Random intro that needs work.
        
        Did you know that 87% of leaders cite communication as their biggest challenge?
        
        Here's a powerful framework I've used with Fortune 500 executives:
        • Listen first, speak second
        • Ask "What's the real problem?" three times
        • Summarize before suggesting
        
        weak ending...
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Leadership communication',
        language: 'en',
        targetAudience: 'Executives',
        tone: 'professional',
        timestamp: new Date()
      };
      
      const result = await regenerationTrigger.regenerateIfNeeded(
        mixedContent,
        request
      );
      
      // Strong statistic should be preserved
      expect(result.finalContent).toContain('87%');
      // Framework should be preserved
      expect(result.finalContent).toContain('Listen first');
      
      // Weak parts should be improved
      expect(result.finalContent).not.toContain('Random intro');
      expect(result.finalContent).not.toContain('weak ending');
    });
  });
  
  describe('End-to-End Quality Gate', () => {
    it('should block content that fails all quality checks', async () => {
      const terribleContent = `
        BUY NOW!!! CLICK HERE!!!
        
        amazing deal... dont miss out...
        
        #spam #scam #clickbait #fake #garbage
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Product promotion',
        language: 'en',
        targetAudience: 'Professionals',
        tone: 'professional',
        timestamp: new Date()
      };
      
      // Step 1: Quality validation should fail
      const metrics = await qualityValidator.validateContent(terribleContent, request);
      expect(metrics.passesThreshold).toBe(false);
      expect(metrics.qualityLevel).toBe('poor');
      
      // Step 2: Brand voice should flag major deviations
      const profile = brandVoiceAnalyzer.getTemplateProfile('corporate');
      const voiceAnalysis = brandVoiceAnalyzer.analyzeVoiceConsistency(
        terribleContent,
        profile.id
      );
      expect(voiceAnalysis.overallConsistency).toBeLessThan(0.5);
      
      // Step 3: Regeneration should attempt fixes
      const result = await regenerationTrigger.regenerateIfNeeded(
        terribleContent,
        request,
        profile.id
      );
      
      // Content should either be significantly improved or flagged
      if (!result.success) {
        expect(result.requiresManualReview).toBe(true);
        expect(result.finalContent).toContain('[REQUIRES MANUAL REVIEW]');
      } else {
        // If somehow improved, should meet minimum standards
        expect(result.finalQualityScore).toBeGreaterThanOrEqual(0.5);
      }
    });
    
    it('should allow high-quality content to pass through immediately', async () => {
      const premiumContent = `
        The 10,000-hour rule is dead. Here's what actually creates expertise:
        
        After studying 50+ world-class performers, researcher Anders Ericsson found 
        that deliberate practice matters more than time invested.
        
        Key components of deliberate practice:
        
        → Specific goal for each session
        → Immediate feedback loop
        → Repetition with refinement
        → Progressive difficulty increase
        → Focus on weaknesses, not strengths
        
        Example: A pianist doesn't play pieces they've mastered. They isolate 
        difficult passages and repeat them until flawless.
        
        This principle transformed how I approach learning:
        • 1 hour of deliberate practice > 5 hours of casual repetition
        • Quality of attention beats quantity of time
        • Comfort is the enemy of growth
        
        The path to mastery isn't about logging hours. It's about designing 
        practice that pushes you to the edge of your ability.
        
        How do you structure your practice sessions? Share your approach 👇
        
        #Learning #ProfessionalDevelopment #Mastery #GrowthMindset
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Expertise development',
        language: 'en',
        targetAudience: 'Ambitious professionals',
        tone: 'professional',
        timestamp: new Date()
      };
      
      // Should pass all quality gates
      const metrics = await qualityValidator.validateContent(premiumContent, request);
      expect(metrics.passesThreshold).toBe(true);
      expect(metrics.qualityLevel).toMatch(/excellent|good/);
      expect(metrics.overallScore).toBeGreaterThan(0.8);
      
      // Should not trigger regeneration
      const result = await regenerationTrigger.regenerateIfNeeded(
        premiumContent,
        request
      );
      expect(result.attempts).toBe(0);
      expect(result.success).toBe(true);
      expect(result.finalContent).toBe(premiumContent);
    });
  });
  
  describe('Performance and Edge Cases', () => {
    it('should handle very short content appropriately', async () => {
      const shortContent = 'Great insight!';
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Response',
        language: 'en',
        timestamp: new Date()
      };
      
      const metrics = await qualityValidator.validateContent(shortContent, request);
      expect(metrics.lengthOptimization).toBeLessThan(0.5);
      expect(metrics.issues.some(i => i.description.includes('short'))).toBe(true);
    });
    
    it('should handle very long content appropriately', async () => {
      const longContent = 'Lorem ipsum '.repeat(500); // ~1000 words
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Test',
        language: 'en',
        timestamp: new Date()
      };
      
      const metrics = await qualityValidator.validateContent(longContent, request);
      expect(metrics.lengthOptimization).toBeLessThan(0.8);
    });
    
    it('should complete quality checks within reasonable time', async () => {
      const content = `
        Professional LinkedIn post about technology trends.
        
        Discussing AI, automation, and the future of work.
        
        What are your thoughts on these developments?
        
        #Tech #AI #FutureOfWork
      `;
      
      const request: LanguageAwareContentRequest = {
        type: 'social',
        topic: 'Technology',
        language: 'en',
        timestamp: new Date()
      };
      
      const startTime = Date.now();
      await qualityValidator.validateContent(content, request);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});