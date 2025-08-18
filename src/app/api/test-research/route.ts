/**
 * Test endpoint for Research Function
 * GET /api/test-research
 */

import { NextResponse } from 'next/server'
import { ResearchFunction } from '@/lib/functions/research-function'
import { LanguageAwareContentRequest } from '@/lib/types/language-aware-request'

// Prevent static generation for this test endpoint
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const researchFunction = new ResearchFunction()
    const results: any[] = []
    
    // Test 1: English research
    const englishRequest: LanguageAwareContentRequest = {
      id: 'test-en-api',
      topic: 'Artificial Intelligence trends in 2025',
      type: 'social',
      outputLanguage: 'en',
      enableResearch: true,
      timestamp: new Date()
    }
    
    const englishResult = await researchFunction.research(englishRequest)
    results.push({
      test: 'English Research',
      success: true,
      sources: englishResult.sources.length,
      insights: englishResult.insights.length,
      attributions: englishResult.attributions.length,
      cacheHit: englishResult.cacheHit,
      processingTime: englishResult.processingTime,
      cost: englishResult.cost
    })
    
    // Test 2: Norwegian research
    const norwegianRequest: LanguageAwareContentRequest = {
      id: 'test-no-api',
      topic: 'Digital transformasjon i Norge',
      type: 'social',
      outputLanguage: 'no',
      culturalContext: {
        market: 'norway',
        industry: 'technology',
        businessType: 'b2b'
      },
      timestamp: new Date()
    }
    
    const norwegianResult = await researchFunction.research(norwegianRequest)
    results.push({
      test: 'Norwegian Research',
      success: true,
      sources: norwegianResult.sources.length,
      insights: norwegianResult.insights.length,
      attributions: norwegianResult.attributions.length,
      language: norwegianResult.language,
      culturalEnhancement: norwegianResult.culturalEnhancement ? 'Yes' : 'No',
      processingTime: norwegianResult.processingTime
    })
    
    // Test 3: Disabled research
    const disabledRequest: LanguageAwareContentRequest = {
      id: 'test-disabled-api',
      topic: 'Quick post without research',
      type: 'social',
      outputLanguage: 'en',
      enableResearch: false,
      timestamp: new Date()
    }
    
    const disabledResult = await researchFunction.research(disabledRequest)
    results.push({
      test: 'Disabled Research',
      success: true,
      sources: disabledResult.sources.length,
      insights: disabledResult.insights.length,
      cost: disabledResult.cost,
      processingTime: disabledResult.processingTime
    })
    
    // Test 4: Article type (auto-enables research)
    const articleRequest: LanguageAwareContentRequest = {
      id: 'test-article-api',
      topic: 'The Future of Remote Work',
      type: 'article',
      outputLanguage: 'en',
      timestamp: new Date()
    }
    
    const articleResult = await researchFunction.research(articleRequest)
    results.push({
      test: 'Article Type',
      success: true,
      sources: articleResult.sources.length,
      contentAnalysis: articleResult.contentAnalysis ? 'Yes' : 'No',
      relevanceScore: articleResult.contentAnalysis?.relevanceScore || 0,
      processingTime: articleResult.processingTime
    })
    
    return NextResponse.json({
      status: 'success',
      message: 'Research function tests completed',
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalTests: results.length,
        allPassed: results.every(r => r.success),
        providersUsed: 'Mock providers (API keys not set)'
      }
    })
    
  } catch (error) {
    console.error('Research function test error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Research function test failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}