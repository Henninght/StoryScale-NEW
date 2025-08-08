/**
 * Content Generation API Endpoint
 * 
 * This endpoint uses the new 3-layer architecture:
 * Layer 1: Intelligent Gateway (routing, caching, cost tracking)
 * Layer 2: Processing Functions (research, generate, optimize, validate)
 * Layer 3: Intelligence Services (patterns, quality, metrics)
 */

import { NextRequest, NextResponse } from 'next/server'
import { IntelligentGateway, ContentRequest } from '@/lib/gateway/intelligent-gateway'

// Initialize the gateway (singleton pattern for performance)
let gateway: IntelligentGateway | null = null

function getGateway(): IntelligentGateway {
  if (!gateway) {
    gateway = new IntelligentGateway()
  }
  return gateway
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }
    
    // Build content request
    const contentRequest: ContentRequest = {
      content: body.content,
      purpose: body.purpose || 'value',
      format: body.format || 'insight',
      tone: body.tone || 'professional',
      targetAudience: body.targetAudience || 'business professionals',
      enableResearch: body.enableResearch || false,
      urlReference: body.urlReference,
      templateId: body.templateId,
      userId: body.userId || 'anonymous',
      sessionId: body.sessionId || `session_${Date.now()}`,
      preferences: body.preferences,
      patterns: body.patterns || []
    }
    
    // Process through intelligent gateway
    const gateway = getGateway()
    const result = await gateway.processRequest(contentRequest)
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      architecture: '3-layer-function-based',
      version: '2.0.0'
    })
    
  } catch (error) {
    console.error('Generation API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Generation failed', 
        message: errorMessage,
        architecture: '3-layer-function-based'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    status: 'healthy',
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
    }
  })
}

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
  if (typedBody.purpose && !['thought-leadership', 'question', 'value', 'authority'].includes(typedBody.purpose as string)) {
    errors.push('purpose must be one of: thought-leadership, question, value, authority')
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