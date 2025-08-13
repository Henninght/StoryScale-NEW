// Test script for Claude Sonnet API
async function testClaude() {
  console.log('🤖 Testing Claude Sonnet 3.5 for LinkedIn content generation...\n');
  
  const testData = {
    type: 'linkedin-post',
    content: 'The rise of AI assistants and their impact on developer productivity',
    purpose: 'thought-leadership',
    goal: 'increase-engagement',
    targetAudience: 'professionals',
    tone: 'professional',
    format: 'insight',
    language: 'en',
    enableResearch: false,
    aiProvider: 'anthropic' // Explicitly use Claude
  };
  
  console.log('Request:', JSON.stringify(testData, null, 2));
  console.log('\n⏳ Calling API with Claude Sonnet...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SUCCESS! Claude Sonnet generated:\n');
      console.log('═'.repeat(60));
      console.log(result.content);
      console.log('═'.repeat(60));
      console.log('\n📊 Stats:');
      console.log(`- Processing time: ${result.processing_time}ms`);
      console.log(`- Quality score: ${result.quality_score}`);
      console.log(`- Strategy: ${result.strategy_used}`);
    } else {
      console.log('❌ Generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Compare OpenAI vs Claude
async function compareProviders() {
  console.log('\n🔬 Comparing OpenAI vs Claude for the same prompt...\n');
  
  const topic = 'How remote work is reshaping company culture';
  
  // Test OpenAI
  console.log('1️⃣ Testing OpenAI GPT-4o-mini...');
  const openaiResponse = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'linkedin-post',
      content: topic,
      purpose: 'thought-leadership',
      targetAudience: 'executives',
      tone: 'professional',
      format: 'story',
      language: 'en',
      aiProvider: 'openai'
    })
  });
  
  const openaiResult = await openaiResponse.json();
  
  // Test Claude
  console.log('\n2️⃣ Testing Claude Sonnet 3.5...');
  const claudeResponse = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'linkedin-post',
      content: topic,
      purpose: 'thought-leadership',
      targetAudience: 'executives',
      tone: 'professional',
      format: 'story',
      language: 'en',
      aiProvider: 'anthropic'
    })
  });
  
  const claudeResult = await claudeResponse.json();
  
  // Display comparison
  console.log('\n' + '═'.repeat(60));
  console.log('COMPARISON RESULTS');
  console.log('═'.repeat(60));
  
  console.log('\n📝 OpenAI GPT-4o-mini:');
  console.log('-'.repeat(40));
  console.log(openaiResult.content?.substring(0, 300) + '...');
  console.log(`\nTime: ${openaiResult.processing_time}ms`);
  
  console.log('\n🤖 Claude Sonnet 3.5:');
  console.log('-'.repeat(40));
  console.log(claudeResult.content?.substring(0, 300) + '...');
  console.log(`\nTime: ${claudeResult.processing_time}ms`);
  
  console.log('\n' + '═'.repeat(60));
}

// Run tests
testClaude().then(() => {
  console.log('\n\nWant to compare with OpenAI? Running comparison...');
  return compareProviders();
});