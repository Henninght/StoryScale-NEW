import { NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/database/supabase'

export async function GET() {
  try {
    // Check database connection
    const { error: dbError } = await supabaseClient
      .from('users')
      .select('count(*)', { count: 'exact', head: true })
    
    // Check service status
    const services = {
      database: dbError ? 'unhealthy' : 'healthy',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not-configured',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not-configured',
      firecrawl: process.env.FIRECRAWL_API_KEY ? 'configured' : 'not-configured',
      tavily: process.env.TAVILY_API_KEY ? 'configured' : 'not-configured',
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not-configured',
    }

    const allHealthy = Object.values(services).every(status => 
      status === 'healthy' || status === 'configured'
    )

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      architecture: '3-layer-function-based',
      services,
      version: '2.0.0',
      layers: {
        gateway: 'Intelligent Gateway (routing, caching, cost tracking)',
        functions: 'Processing Functions (research, generate, optimize, validate)',
        intelligence: 'Intelligence Services (patterns, quality, metrics)'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      version: '2.0.0',
    }, { status: 503 })
  }
}