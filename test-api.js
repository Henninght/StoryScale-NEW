// Test script to debug API generation endpoint

async function testAPI() {
  console.log('Testing /api/generate endpoint...\n');
  
  const testData = {
    type: 'linkedin-post',
    content: 'Test content about AI and software development',
    purpose: 'thought-leadership',
    goal: 'increase-engagement',
    targetAudience: 'professionals',
    tone: 'professional',
    format: 'insight',
    language: 'en',
    enableResearch: false
  };
  
  console.log('Request payload:', JSON.stringify(testData, null, 2));
  console.log('\nMaking request...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const text = await response.text();
    
    // Try to parse as JSON, otherwise show raw text
    try {
      const json = JSON.parse(text);
      console.log('\nResponse body (JSON):', JSON.stringify(json, null, 2));
    } catch {
      console.log('\nResponse body (text):', text.slice(0, 500));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();