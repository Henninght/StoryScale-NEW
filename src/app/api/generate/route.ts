/**
 * Content Generation API Endpoint
 * 
 * This endpoint uses the new 3-layer architecture:
 * Layer 1: Intelligent Gateway (routing, caching, cost tracking)
 * Layer 2: Processing Functions (research, generate, optimize, validate)
 * Layer 3: Intelligence Services (patterns, quality, metrics)
 */

import { NextRequest, NextResponse } from 'next/server'
import { LanguageAwareContentRequest } from '@/lib/types/language-aware-request'
import { hybridProcessor } from '@/lib/processors/hybrid-processor'
import { withSecurity, validateResearchRequest } from '@/lib/middleware/security-middleware'

// Initialize the hybrid processor (singleton pattern for performance)
const processor = hybridProcessor

// Secure POST handler
const securePostHandler = withSecurity({
  enableRateLimit: true,
  enableRequestValidation: true,
  maxRequestSize: 512 * 1024, // 512KB for content requests
})

export const POST = securePostHandler(async (request: NextRequest) => {
  try {
    console.log('🚀 Generate API: Request received')
    
    // Parse request body
    const body = await request.json()
    console.log('🚀 Generate API: Body parsed:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    const validation = validateRequest(body)
    if (!validation.valid) {
      console.log('❌ Generate API: Validation failed:', validation.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }
    console.log('✅ Generate API: Validation passed')

    // Additional security validation for research requests
    if (body.enableResearch) {
      const researchValidation = await validateResearchRequest(
        body.content,
        body.enableResearch,
        body.userId
      )
      
      if (!researchValidation.allowed) {
        return NextResponse.json(
          { error: 'Research request validation failed', reason: researchValidation.reason },
          { status: 400 }
        )
      }
      
      // Use sanitized content if provided
      if (researchValidation.sanitizedContent) {
        body.content = researchValidation.sanitizedContent
      }
    }
    
    // Build content request - pass all wizard data
    const contentRequest: LanguageAwareContentRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: body.type || 'linkedin-post', // Keep original type
      topic: body.content || 'No topic provided',
      purpose: body.purpose, // Pass wizard purpose
      goal: body.goal, // Pass wizard goal
      format: body.format, // Pass wizard format
      postLength: body.postLength || 'medium', // Pass wizard post length
      keywords: body.keywords,
      tone: body.tone || 'professional',
      targetAudience: body.targetAudience || 'business professionals',
      wordCount: body.wordCount || 500,
      timestamp: new Date(),
      inputLanguage: body.language || 'en',
      outputLanguage: body.language || 'en',
      culturalContext: body.culturalContext,
      requiresTranslation: false,
      enableResearch: body.enableResearch || false,
      callToAction: body.callToAction, // Pass call-to-action
      url: body.url, // Pass URL if provided
      aiProvider: 'anthropic', // Default to Claude Sonnet 4
      glossary: body.glossary,
      seoRequirements: body.seoRequirements
    }
    
    // Process through hybrid processor with new architecture
    console.log('🔄 Generate API: Calling processor with request:', JSON.stringify(contentRequest, null, 2))
    const result = await processor.process(contentRequest, {
      userId: body.userId,
      enableComparison: body.enableComparison || false,
      customFeatureFlags: body.featureFlags
    })
    console.log('✅ Generate API: Processor returned result')
    console.log('🔄 Generate API: Result success:', result.success)
    console.log('🔄 Generate API: Result content length:', result.content?.length || 0)
    console.log('🔄 Generate API: Result content preview:', result.content?.substring(0, 100) + '...')
    
    // Return successful response in format expected by wizard store
    const response = {
      success: result.success,
      id: contentRequest.id,
      content: result.content,
      generatedAt: new Date().toISOString(),
      modelUsed: 'claude-3-5-sonnet-20241022',
      tokensUsed: 1000, // Estimated
      processingTime: result.processing_time,
      researchSources: [], // Empty for now
      data: result,
      architecture: '3-layer-function-based',
      version: '2.0.0',
      strategy_used: result.strategy_used,
      quality_score: result.metadata.quality_score,
      functions_executed: result.new_architecture_result?.metadata?.functionsExecuted || [],
      feature_flags: result.metadata.feature_flags_applied
    }
    
    console.log('📤 Generate API: Returning response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Generation API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Generation failed', 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          errorType: error?.constructor?.name,
          stack: error instanceof Error ? error.stack : undefined
        } : undefined,
        architecture: '3-layer-function-based'
      },
      { status: 500 }
    )
  }
})

// Secure GET handler (less restrictive for health checks)
const secureGetHandler = withSecurity({
  enableRateLimit: true,
  enableRequestValidation: false, // No body validation for GET
  maxRequestSize: 0, // No body expected
})

export const GET = secureGetHandler(async () => {
  // Health check endpoint with hybrid processor status
  const healthCheck = await processor.healthCheck()
  
  return NextResponse.json({
    status: healthCheck.status,
    architecture: '3-layer-function-based',
    version: '2.0.0',
    layers: {
      gateway: 'Intelligent Gateway (routing, caching, cost tracking)',
      functions: 'Processing Functions (research, generate, optimize, validate)',
      intelligence: 'Intelligence Services (patterns, quality, metrics)'
    },
    performance: {
      target_simple: '<1s (50% cached)',
      target_complex: '4-6s',
      cache_hit_rate: '50%',
      cost_reduction: '60%'
    },
    feature_flags: processor.getFeatureFlags(),
    processing_stats: processor.getProcessingStats(),
    health_details: healthCheck.details,
    security: {
      api_protection: 'enabled',
      rate_limiting: 'active',
      content_filtering: 'active'
    }
  })
})

/**
 * Validate request body
 */
function validateRequest(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const typedBody = body as Record<string, unknown>
  
  // Required fields
  if (!typedBody.content || typeof typedBody.content !== 'string') {
    errors.push('content is required and must be a string')
  }
  
  if (typedBody.content && typeof typedBody.content === 'string' && typedBody.content.length < 10) {
    errors.push('content must be at least 10 characters long')
  }
  
  if (typedBody.content && typeof typedBody.content === 'string' && typedBody.content.length > 2000) {
    errors.push('content must be less than 2000 characters')
  }
  
  // Optional field validation
  // Allow both wizard purposes and API purposes (mapped by wizard store)
  if (typedBody.purpose && !['thought-leadership', 'question', 'value', 'authority', 'lead-generation', 'lead-nurture', 'lead-qualification', 'lead-magnet'].includes(typedBody.purpose as string)) {
    errors.push('purpose must be one of: thought-leadership, question, value, authority, lead-generation, lead-nurture, lead-qualification, lead-magnet')
  }
  
  if (typedBody.format && !['story', 'insight', 'list', 'howto', 'question'].includes(typedBody.format as string)) {
    errors.push('format must be one of: story, insight, list, howto, question')
  }
  
  if (typedBody.tone && !['professional', 'casual', 'friendly', 'authoritative'].includes(typedBody.tone as string)) {
    errors.push('tone must be one of: professional, casual, friendly, authoritative')
  }
  
  if (typedBody.urlReference && !isValidUrl(typedBody.urlReference as string)) {
    errors.push('urlReference must be a valid URL')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate URL format
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}