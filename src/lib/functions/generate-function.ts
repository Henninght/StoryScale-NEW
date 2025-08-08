/**
 * Generate Function - Unified content generation with built-in optimization
 * 
 * Part of Layer 2: Processing Functions
 * 
 * Responsibilities:
 * - Generate content in multiple length variants (short/medium/long)
 * - Support multiple AI providers with fallbacks
 * - Apply user patterns and templates
 * - Integrate research insights
 * - Built-in optimization for platform constraints
 */

import { ContentRequest, ContentResponse, UserPattern } from '../gateway/intelligent-gateway'
import { ResearchResult } from './research-function'

export interface GenerateResult {
  content: ContentVariants
  metadata: GenerationMetadata
  confidence: number
  processingTime: number
  tokensUsed: number
}

export interface ContentVariants {
  short: string
  medium: string
  long: string
  selected: string
}

export interface GenerationMetadata {
  model: string
  provider: 'openai' | 'anthropic'
  prompt: string
  patterns?: string[]
  templateUsed?: string
  researchIntegrated: boolean
}

export interface AIProvider {
  name: 'openai' | 'anthropic'
  models: string[]
  generate(request: GenerationRequest): Promise<GenerationResponse>
  isHealthy(): Promise<boolean>
}

export interface GenerationRequest {
  prompt: string
  model: string
  temperature: number
  maxTokens: number
}

export interface GenerationResponse {
  content: string
  tokens: number
  confidence: number
  model: string
}

export interface TemplateEngine {
  getTemplate(templateId: string): Promise<ContentTemplate>
  applyTemplate(template: ContentTemplate, content: string): string
}

export interface ContentTemplate {
  id: string
  name: string
  structure: string[]
  placeholders: Record<string, string>
}

export class GenerateFunction {
  private aiProviders: Map<string, AIProvider> = new Map()
  private templateEngine: TemplateEngine
  private patternMatcher: PatternMatcher
  
  constructor() {
    this.initializeProviders()
    this.templateEngine = new MockTemplateEngine()
    this.patternMatcher = new PatternMatcher()
  }

  /**
   * Main generation function - create content variants with optimization
   */
  async generate(
    request: ContentRequest, 
    researchResult?: ResearchResult
  ): Promise<GenerateResult> {
    const startTime = Date.now()
    
    try {
      // Select optimal AI provider and model
      const provider = await this.selectProvider(request)
      
      // Build enhanced prompt with patterns, templates, and research
      const enhancedPrompt = await this.buildEnhancedPrompt(request, researchResult)
      
      // Generate content variants in parallel
      const variants = await this.generateContentVariants(provider, enhancedPrompt, request)
      
      // Apply pattern learning and optimization
      const optimizedVariants = await this.applyPatternOptimization(variants, request.patterns)
      
      const metadata: GenerationMetadata = {
        model: provider.models[0], // Current model
        provider: provider.name,
        prompt: enhancedPrompt,
        patterns: request.patterns?.map(p => p.id) || [],
        templateUsed: request.templateId,
        researchIntegrated: !!researchResult?.sources.length
      }
      
      return {
        content: optimizedVariants,
        metadata,
        confidence: this.calculateOverallConfidence(variants),
        processingTime: Date.now() - startTime,
        tokensUsed: this.calculateTotalTokens(variants)
      }
      
    } catch (error) {
      // Try fallback provider
      if (error.message.includes('rate limit') || error.message.includes('timeout')) {
        console.warn('Primary provider failed, trying fallback...')
        return await this.generateWithFallback(request, researchResult)
      }
      
      throw new Error(`Content generation failed: ${error.message}`)
    }
  }

  /**
   * Generate content variants (short, medium, long)
   */
  private async generateContentVariants(
    provider: AIProvider,
    basePrompt: string,
    request: ContentRequest
  ): Promise<Record<string, GenerationResponse & { variant: string }>> {
    // Generate all length variants in parallel for efficiency
    const [shortContent, mediumContent, longContent] = await Promise.all([
      this.generateVariant(provider, basePrompt, 'short', request),
      this.generateVariant(provider, basePrompt, 'medium', request),
      this.generateVariant(provider, basePrompt, 'long', request)
    ])
    
    return {
      short: { ...shortContent, variant: 'short' },
      medium: { ...mediumContent, variant: 'medium' },
      long: { ...longContent, variant: 'long' }
    }
  }

  /**
   * Generate single content variant
   */
  private async generateVariant(
    provider: AIProvider,
    basePrompt: string,
    length: 'short' | 'medium' | 'long',
    request: ContentRequest
  ): Promise<GenerationResponse> {
    const lengthSpecs = {
      short: { 
        chars: '300-500', 
        description: 'concise and impactful',
        maxTokens: 300
      },
      medium: { 
        chars: '800-1200', 
        description: 'detailed and engaging',
        maxTokens: 600
      },
      long: { 
        chars: '1500-2500', 
        description: 'comprehensive and thorough',
        maxTokens: 1000
      }
    }
    
    const spec = lengthSpecs[length]
    const prompt = `${basePrompt}

IMPORTANT: Generate a ${spec.description} ${request.format} post that:
- Is ${spec.chars} characters long
- Uses ${request.tone} tone
- Targets ${request.targetAudience}
- Follows ${request.purpose} purpose
- Format as ${request.format} with appropriate structure and flow

Focus on creating engaging, valuable content that resonates with the target audience.`

    return await provider.generate({
      prompt,
      model: provider.models[0], // Use primary model
      temperature: 0.7,
      maxTokens: spec.maxTokens
    })
  }

  /**
   * Build enhanced prompt with patterns, templates, and research
   */
  private async buildEnhancedPrompt(
    request: ContentRequest,
    researchResult?: ResearchResult
  ): Promise<string> {
    let prompt = `Create a professional ${request.format} for ${request.targetAudience} with ${request.tone} tone.

Topic: ${request.content}
Purpose: ${request.purpose}`

    // Add template structure if available
    if (request.templateId) {
      try {
        const template = await this.templateEngine.getTemplate(request.templateId)
        prompt += `\n\nFollow this proven structure: ${JSON.stringify(template.structure)}`
      } catch (error) {
        console.warn('Template not found:', request.templateId)
      }
    }

    // Add pattern insights from user's successful content
    if (request.patterns?.length > 0) {
      const patternInsights = this.patternMatcher.extractInsights(request.patterns)
      prompt += `\n\nApply these successful patterns from your previous content: ${patternInsights}`
    }

    // Integrate research insights and attribution requirements
    if (researchResult?.sources.length > 0) {
      prompt += `\n\nIncorporate these research insights: ${researchResult.insights.join('. ')}`
      prompt += `\n\nWhen referencing research, use natural citation phrases like "According to [source name]..." or "Recent research suggests..."`
      prompt += `\n\nAvailable sources: ${researchResult.sources.map(s => s.title).join(', ')}`
    }

    // Add platform-specific optimization hints
    prompt += this.getPlatformOptimizationHints(request)

    return prompt
  }

  /**
   * Get platform-specific optimization hints
   */
  private getPlatformOptimizationHints(request: ContentRequest): string {
    // LinkedIn-specific optimizations (primary platform)
    let hints = '\n\nLinkedIn Optimization:'
    
    switch (request.format) {
      case 'story':
        hints += '\n- Start with a compelling hook\n- Include a personal anecdote\n- End with a clear lesson or takeaway'
        break
      case 'list':
        hints += '\n- Use numbered points for easy scanning\n- Include actionable tips\n- Add brief explanations for each point'
        break
      case 'insight':
        hints += '\n- Lead with the key insight\n- Provide supporting evidence\n- Include implications for the audience'
        break
      case 'question':
        hints += '\n- Ask thought-provoking questions\n- Encourage engagement and discussion\n- Provide your own perspective'
        break
    }
    
    // Add general LinkedIn engagement tips
    hints += '\n- Use line breaks for readability\n- Include 2-3 relevant hashtags\n- Consider adding a call-to-action'
    
    return hints
  }

  /**
   * Apply pattern learning and optimization
   */
  private async applyPatternOptimization(
    variants: Record<string, GenerationResponse & { variant: string }>,
    patterns?: UserPattern[]
  ): Promise<ContentVariants> {
    const optimized: ContentVariants = {
      short: variants.short.content,
      medium: variants.medium.content,
      long: variants.long.content,
      selected: variants.medium.content // Default to medium
    }

    // Apply pattern-based optimizations if patterns available
    if (patterns?.length > 0) {
      const successfulPatterns = patterns.filter(p => p.type === 'successful_post')
      
      if (successfulPatterns.length > 0) {
        // Apply successful post patterns to each variant
        optimized.short = this.applyPatternOptimizations(optimized.short, successfulPatterns)
        optimized.medium = this.applyPatternOptimizations(optimized.medium, successfulPatterns)
        optimized.long = this.applyPatternOptimizations(optimized.long, successfulPatterns)
        
        // Select the variant that best matches user's successful patterns
        optimized.selected = this.selectOptimalVariant(optimized, successfulPatterns)
      }
    }

    return optimized
  }

  /**
   * Apply pattern-based optimizations to content
   */
  private applyPatternOptimizations(content: string, patterns: UserPattern[]): string {
    let optimizedContent = content
    
    // Apply common successful patterns
    for (const pattern of patterns) {
      if (pattern.pattern.engagement > 500) { // High engagement pattern
        // Apply successful formatting or structure
        if (pattern.pattern.hasEmoji) {
          // Add emoji if successful pattern used them
          optimizedContent = this.addStrategicEmojis(optimizedContent)
        }
        
        if (pattern.pattern.hasHashtags) {
          // Ensure hashtags are included
          optimizedContent = this.ensureHashtags(optimizedContent)
        }
      }
    }
    
    return optimizedContent
  }

  /**
   * Select optimal variant based on user patterns
   */
  private selectOptimalVariant(variants: ContentVariants, patterns: UserPattern[]): string {
    // Analyze user's successful post lengths
    const avgSuccessfulLength = this.calculateAverageSuccessfulLength(patterns)
    
    if (avgSuccessfulLength < 600) return variants.short
    if (avgSuccessfulLength > 1500) return variants.long
    return variants.medium
  }

  /**
   * Select optimal AI provider based on request characteristics
   */
  private async selectProvider(request: ContentRequest): Promise<AIProvider> {
    // User preference takes priority
    if (request.preferences?.preferredModel?.includes('gpt')) {
      const openai = this.aiProviders.get('openai')
      if (openai && await openai.isHealthy()) return openai
    }
    
    if (request.preferences?.preferredModel?.includes('claude')) {
      const anthropic = this.aiProviders.get('anthropic')
      if (anthropic && await anthropic.isHealthy()) return anthropic
    }
    
    // Default selection based on content characteristics
    if (request.purpose === 'thought-leadership' || request.format === 'insight') {
      const openai = this.aiProviders.get('openai')
      if (openai && await openai.isHealthy()) return openai
    }
    
    if (request.format === 'story' || request.tone === 'casual') {
      const anthropic = this.aiProviders.get('anthropic')
      if (anthropic && await anthropic.isHealthy()) return anthropic
    }
    
    // Fallback to any healthy provider
    for (const [name, provider] of this.aiProviders) {
      if (await provider.isHealthy()) {
        return provider
      }
    }
    
    throw new Error('No healthy AI providers available')
  }

  /**
   * Generate with fallback provider
   */
  private async generateWithFallback(
    request: ContentRequest,
    researchResult?: ResearchResult
  ): Promise<GenerateResult> {
    // Try alternative provider
    const providers = Array.from(this.aiProviders.values())
    for (const provider of providers) {
      try {
        if (await provider.isHealthy()) {
          const enhancedPrompt = await this.buildEnhancedPrompt(request, researchResult)
          const variants = await this.generateContentVariants(provider, enhancedPrompt, request)
          const optimizedVariants = await this.applyPatternOptimization(variants, request.patterns)
          
          return {
            content: optimizedVariants,
            metadata: {
              model: provider.models[0],
              provider: provider.name,
              prompt: enhancedPrompt,
              patterns: request.patterns?.map(p => p.id) || [],
              researchIntegrated: !!researchResult?.sources.length
            },
            confidence: this.calculateOverallConfidence(variants),
            processingTime: 0,
            tokensUsed: this.calculateTotalTokens(variants)
          }
        }
      } catch (error) {
        console.warn(`Fallback provider ${provider.name} failed:`, error)
        continue
      }
    }
    
    throw new Error('All AI providers unavailable')
  }

  /**
   * Utility methods
   */
  private calculateOverallConfidence(variants: Record<string, GenerationResponse>): number {
    const confidences = Object.values(variants).map(v => v.confidence)
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
  }

  private calculateTotalTokens(variants: Record<string, GenerationResponse>): number {
    return Object.values(variants).reduce((sum, variant) => sum + variant.tokens, 0)
  }

  private calculateAverageSuccessfulLength(patterns: UserPattern[]): number {
    const lengths = patterns
      .filter(p => p.pattern.characterCount)
      .map(p => p.pattern.characterCount)
    
    return lengths.length > 0 ? lengths.reduce((sum, len) => sum + len, 0) / lengths.length : 800
  }

  private addStrategicEmojis(content: string): string {
    // Add emojis strategically without overdoing it
    return content // Placeholder for emoji addition logic
  }

  private ensureHashtags(content: string): string {
    // Ensure relevant hashtags are present
    if (!content.includes('#')) {
      content += '\n\n#leadership #growth #insights'
    }
    return content
  }

  /**
   * Initialize AI providers
   */
  private initializeProviders(): void {
    this.aiProviders.set('openai', new MockOpenAIProvider())
    this.aiProviders.set('anthropic', new MockAnthropicProvider())
  }
}

/**
 * Pattern matcher for analyzing user success patterns
 */
class PatternMatcher {
  extractInsights(patterns: UserPattern[]): string {
    const insights: string[] = []
    
    const successfulPosts = patterns.filter(p => p.type === 'successful_post')
    
    if (successfulPosts.length > 0) {
      const avgEngagement = successfulPosts.reduce((sum, p) => sum + (p.pattern.engagement || 0), 0) / successfulPosts.length
      if (avgEngagement > 100) {
        insights.push('Use engaging, conversational style that has worked well for you')
      }
      
      const commonFormats = this.findCommonFormats(successfulPosts)
      if (commonFormats.length > 0) {
        insights.push(`Your most successful format is: ${commonFormats[0]}`)
      }
    }
    
    return insights.join('. ')
  }

  private findCommonFormats(patterns: UserPattern[]): string[] {
    const formats = patterns.map(p => p.pattern.format).filter(Boolean)
    const formatCounts = formats.reduce((acc, format) => {
      acc[format] = (acc[format] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(formatCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([format]) => format)
  }
}

/**
 * Mock template engine for development
 */
class MockTemplateEngine implements TemplateEngine {
  async getTemplate(templateId: string): Promise<ContentTemplate> {
    // Mock template
    return {
      id: templateId,
      name: 'Success Story Template',
      structure: ['hook', 'story', 'lesson', 'call_to_action'],
      placeholders: {
        hook: 'Compelling opening',
        story: 'Personal anecdote',
        lesson: 'Key takeaway',
        call_to_action: 'Engagement question'
      }
    }
  }

  applyTemplate(template: ContentTemplate, content: string): string {
    return content // Placeholder for template application
  }
}

/**
 * Mock AI providers for development
 */
class MockOpenAIProvider implements AIProvider {
  name: 'openai' = 'openai'
  models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Mock generation
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
    
    return {
      content: `Mock OpenAI generated content for: ${request.prompt.slice(0, 50)}...`,
      tokens: request.maxTokens * 0.8,
      confidence: 0.85,
      model: request.model
    }
  }

  async isHealthy(): Promise<boolean> {
    return true
  }
}

class MockAnthropicProvider implements AIProvider {
  name: 'anthropic' = 'anthropic'
  models = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Mock generation
    await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API delay
    
    return {
      content: `Mock Claude generated content for: ${request.prompt.slice(0, 50)}...`,
      tokens: request.maxTokens * 0.75,
      confidence: 0.9,
      model: request.model
    }
  }

  async isHealthy(): Promise<boolean> {
    return true
  }
}