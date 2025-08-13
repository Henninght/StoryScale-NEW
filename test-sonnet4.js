// Test Claude Sonnet 4 content generation
async function testSonnet4() {
  console.log('🚀 Testing Claude Sonnet 4 for LinkedIn content generation...\n');
  
  const testData = {
    type: 'linkedin-post',
    content: 'The future of AI agents in enterprise software and how they will transform business operations',
    purpose: 'thought-leadership',
    goal: 'increase-engagement',
    targetAudience: 'executives',
    tone: 'authoritative',
    format: 'insight',
    language: 'en',
    enableResearch: false,
    aiProvider: 'anthropic'
  };
  
  console.log('📋 Request Details:');
  console.log(`- Topic: ${testData.content}`);
  console.log(`- Audience: ${testData.targetAudience}`);
  console.log(`- Tone: ${testData.tone}`);
  console.log(`- Format: ${testData.format}`);
  console.log(`- AI Provider: Claude Sonnet 4\n`);
  
  console.log('⏳ Generating content with Claude Sonnet 4...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    const endTime = Date.now();
    
    if (result.success) {
      console.log('✅ SUCCESS! Claude Sonnet 4 generated:\n');
      console.log('═'.repeat(80));
      console.log(result.content);
      console.log('═'.repeat(80));
      
      console.log('\n📊 Performance Metrics:');
      console.log(`- Response time: ${endTime - startTime}ms`);
      console.log(`- Processing time: ${result.processing_time}ms`);
      console.log(`- Quality score: ${result.quality_score}`);
      console.log(`- Strategy used: ${result.strategy_used}`);
      console.log(`- Architecture: ${result.architecture}`);
      
      // Analyze content quality
      const wordCount = result.content.split(' ').length;
      const hasHashtags = result.content.includes('#');
      const hasCTA = result.content.includes('?') || result.content.toLowerCase().includes('share') || result.content.toLowerCase().includes('comment');
      const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(result.content);
      
      console.log('\n🔍 Content Analysis:');
      console.log(`- Word count: ${wordCount}`);
      console.log(`- Has hashtags: ${hasHashtags ? '✅' : '❌'}`);
      console.log(`- Has CTA: ${hasCTA ? '✅' : '❌'}`);
      console.log(`- Uses emojis: ${hasEmojis ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ Generation failed:', result.error || 'Unknown error');
      console.log('Response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Network/API Error:', error.message);
  }
}

// Test advanced prompt with Sonnet 4
async function testAdvancedPrompt() {
  console.log('\n\n🎯 Testing Advanced Prompt with Claude Sonnet 4...\n');
  
  const advancedTest = {
    type: 'linkedin-post',
    content: 'How quantum computing will revolutionize cryptography and blockchain security',
    purpose: 'share-insights',
    goal: 'build-authority',
    targetAudience: 'professionals',
    tone: 'authoritative',
    format: 'insight',
    language: 'en',
    keywords: ['quantum computing', 'cryptography', 'blockchain', 'security'],
    customInstructions: 'Include specific technical details and future timeline predictions',
    aiProvider: 'anthropic'
  };
  
  console.log('📋 Advanced Test Parameters:');
  console.log(`- Keywords: ${advancedTest.keywords.join(', ')}`);
  console.log(`- Custom instructions: ${advancedTest.customInstructions}`);
  console.log('\n⏳ Processing...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advancedTest)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Advanced Content Generated:\n');
      console.log('═'.repeat(80));
      console.log(result.content);
      console.log('═'.repeat(80));
      
      // Check if keywords were included
      const keywordCount = advancedTest.keywords.filter(keyword => 
        result.content.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      console.log(`\n🎯 Keyword Integration: ${keywordCount}/${advancedTest.keywords.length} keywords included`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
console.log('🤖 Claude Sonnet 4 Content Generation Test Suite\n');
testSonnet4().then(() => testAdvancedPrompt());