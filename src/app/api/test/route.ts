import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'StoryScale 3-Layer Architecture Test',
    status: 'working',
    timestamp: new Date().toISOString(),
    architecture: {
      layer1: 'Intelligent Gateway (routing, caching, cost tracking)',
      layer2: 'Processing Functions (research, generate, optimize, validate)',
      layer3: 'Intelligence Services (patterns, quality, metrics)'
    },
    performance: {
      target_simple: '<1s (50% cached)',
      target_complex: '4-6s',
      cache_hit_rate: '50%',
      cost_reduction: '60%'
    },
    version: '2.0.0'
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  
  // Simple mock response for testing
  return NextResponse.json({
    success: true,
    message: 'Mock content generation successful',
    input: body,
    mockOutput: {
      content: {
        short: `Mock short content for: ${body.content || 'test'}`,
        medium: `Mock medium content for: ${body.content || 'test'}. This is a longer version with more details.`,
        long: `Mock long content for: ${body.content || 'test'}. This is the most comprehensive version with extensive details and examples.`,
        selected: `Mock medium content for: ${body.content || 'test'}. This is a longer version with more details.`
      },
      qualityScore: 0.85,
      metadata: {
        processingTime: 1200,
        tokensUsed: 450,
        cacheHit: false,
        provider: 'mock-provider',
        confidence: 0.85
      }
    },
    architecture: '3-layer-function-based',
    version: '2.0.0'
  })
}