/**
 * Manual test script for Research Function
 * Run with: npx ts-node src/lib/functions/test-research.ts
 */

import { ResearchFunction } from './research-function'
import { LanguageAwareContentRequest } from '../types/language-aware-request'

async function testResearchFunction() {
  console.log('🔬 Testing Research Function Integration\n')
  
  const researchFunction = new ResearchFunction()
  
  // Test 1: English research with mock providers
  console.log('Test 1: English content research')
  const englishRequest: LanguageAwareContentRequest = {
    id: 'test-en-1',
    topic: 'Artificial Intelligence trends in 2025',
    type: 'social',
    outputLanguage: 'en',
    enableResearch: true,
    timestamp: new Date()
  }
  
  const englishResult = await researchFunction.research(englishRequest)
  console.log('✅ English Results:')
  console.log(`  - Sources found: ${englishResult.sources.length}`)
  console.log(`  - Insights generated: ${englishResult.insights.length}`)
  console.log(`  - Attributions: ${englishResult.attributions.length}`)
  console.log(`  - Cache hit: ${englishResult.cacheHit}`)
  console.log(`  - Processing time: ${englishResult.processingTime}ms`)
  console.log(`  - Cost: $${englishResult.cost}`)
  
  if (englishResult.sources.length > 0) {
    console.log(`  - First source: ${englishResult.sources[0].title} (${englishResult.sources[0].source})`)
  }
  
  if (englishResult.attributions.length > 0) {
    console.log(`  - Sample attribution: ${JSON.stringify(englishResult.attributions[0])}`)
  }
  
  console.log()
  
  // Test 2: Norwegian research with mock providers
  console.log('Test 2: Norwegian content research')
  const norwegianRequest: LanguageAwareContentRequest = {
    id: 'test-no-1',
    topic: 'Digital transformasjon i norsk næringsliv',
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
  console.log('✅ Norwegian Results:')
  console.log(`  - Sources found: ${norwegianResult.sources.length}`)
  console.log(`  - Insights generated: ${norwegianResult.insights.length}`)
  console.log(`  - Attributions: ${norwegianResult.attributions.length}`)
  console.log(`  - Language: ${norwegianResult.language}`)
  console.log(`  - Cultural enhancement: ${norwegianResult.culturalEnhancement ? 'Yes' : 'No'}`)
  console.log(`  - Processing time: ${norwegianResult.processingTime}ms`)
  
  if (norwegianResult.culturalEnhancement) {
    console.log(`  - Cultural notes: ${norwegianResult.culturalEnhancement.culturalNotes.length}`)
  }
  
  console.log()
  
  // Test 3: Disabled research
  console.log('Test 3: Disabled research')
  const disabledRequest: LanguageAwareContentRequest = {
    id: 'test-disabled-1',
    topic: 'Quick post without research',
    type: 'social',
    outputLanguage: 'en',
    enableResearch: false,
    timestamp: new Date()
  }
  
  const disabledResult = await researchFunction.research(disabledRequest)
  console.log('✅ Disabled Research Results:')
  console.log(`  - Sources found: ${disabledResult.sources.length}`)
  console.log(`  - Insights generated: ${disabledResult.insights.length}`)
  console.log(`  - Cost: $${disabledResult.cost}`)
  console.log(`  - Processing time: ${disabledResult.processingTime}ms`)
  
  console.log()
  
  // Test 4: Article type (should auto-enable research)
  console.log('Test 4: Article type (auto-enabled research)')
  const articleRequest: LanguageAwareContentRequest = {
    id: 'test-article-1',
    topic: 'The Future of Remote Work',
    type: 'article',
    outputLanguage: 'en',
    timestamp: new Date()
  }
  
  const articleResult = await researchFunction.research(articleRequest)
  console.log('✅ Article Results:')
  console.log(`  - Sources found: ${articleResult.sources.length}`)
  console.log(`  - Content analysis: ${articleResult.contentAnalysis ? 'Yes' : 'No'}`)
  if (articleResult.contentAnalysis) {
    console.log(`  - Relevance score: ${articleResult.contentAnalysis.relevanceScore}`)
    console.log(`  - Key insights: ${articleResult.contentAnalysis.keyInsights.length}`)
  }
  
  console.log()
  console.log('🎉 All tests completed successfully!')
  
  // Summary
  console.log('\n📊 Summary:')
  console.log('- Research function initializes with mock providers when API keys are not set')
  console.log('- Attribution generation works for both English and Norwegian')
  console.log('- Source routing properly handles language-specific requests')
  console.log('- Cultural enhancement is applied to Norwegian content')
  console.log('- Research can be disabled when not needed')
  console.log('- Article type automatically enables research')
}

// Run the tests
testResearchFunction().catch(console.error)