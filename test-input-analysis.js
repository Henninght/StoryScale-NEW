/**
 * Test Script for Input Analysis System
 * Tests various input types to validate detection and suggestions
 */

import { analyzeInput, EXAMPLE_INPUTS, getPrimarySmartPrompt, getQualityDescription } from './src/lib/utils/input-analysis.ts';

const testInputs = {
  // Personal Announcements (should be detected as personal-announcement)
  personalAnnouncements: [
    "I'm excited to launch StoryScale after seeing professionals struggle with LinkedIn content",
    "We're introducing our new AI-powered content creation tool",
    "I'm announcing the launch of my latest project",
    "We just launched our revolutionary content studio",
    "I'm proud to share that we've built something amazing",
  ],
  
  // Story Sharing (should be detected as story-sharing)  
  storySharing: [
    "I remember when I first started creating content and struggled with consistency",
    "My journey from manual content creation to AI automation",
    "The story of how we solved the content creation problem",
    "I experienced firsthand how time-consuming content creation can be",
  ],
  
  // Advice Giving (should be detected as advice-giving)
  adviceGiving: [
    "I've learned that consistent posting is key to LinkedIn success",
    "My approach to content creation has evolved over the years",
    "I recommend using AI tools to streamline your workflow",
    "I believe automation is the future of content marketing",
  ],
  
  // General Topics (should be detected as general-topic)
  generalTopics: [
    "AI tools for content creation are becoming popular",
    "Content marketing strategies for businesses",
    "The future of artificial intelligence in marketing",
    "LinkedIn best practices and engagement tips",
    "Marketing automation tools comparison",
  ],
  
  // Low Quality Inputs (should suggest improvements)
  lowQuality: [
    "AI tool",
    "Content creation",
    "Launch product",
    "New tool for LinkedIn",
    "AI content generator",
  ],
  
  // High Quality Inputs (should be ready to generate)
  highQuality: [
    "I'm launching StoryScale because I saw how professionals spend hours struggling with LinkedIn content creation. It's an AI studio that generates professional posts in under 15 seconds, solving the time-consuming challenge of consistent content marketing.",
    "We're excited to introduce our research-backed content optimization system that helps marketing teams create data-driven posts. After analyzing thousands of high-performing LinkedIn posts, we've built an AI that understands what drives engagement.",
  ]
};

function runTests() {
  console.log('🧪 Testing Input Analysis System\n');
  console.log('=' .repeat(80));
  
  Object.entries(testInputs).forEach(([category, inputs]) => {
    console.log(`\n📋 Testing: ${category.toUpperCase()}`);
    console.log('-'.repeat(50));
    
    inputs.forEach((input, index) => {
      const analysis = analyzeInput(input);
      const smartPrompt = getPrimarySmartPrompt(analysis);
      const qualityDesc = getQualityDescription(analysis.overallQuality);
      
      console.log(`\n${index + 1}. Input: "${input.substring(0, 60)}${input.length > 60 ? '...' : ''}"`);
      console.log(`   Content Type: ${analysis.contentType}`);
      console.log(`   Overall Quality: ${analysis.overallQuality}% (${qualityDesc.text})`);
      console.log(`   Breakdown: Personal ${analysis.personalityLevel}% | Context ${analysis.contextRichness}% | Actionable ${analysis.actionableDetails}%`);
      console.log(`   Ready to Generate: ${analysis.readyToGenerate ? '✅ Yes' : '❌ No'}`);
      
      if (smartPrompt) {
        console.log(`   Smart Prompt: ${smartPrompt.icon} ${smartPrompt.message}`);
        if (smartPrompt.example) {
          console.log(`   Example: "${smartPrompt.example}"`);
        }
      }
      
      if (analysis.suggestions.length > 0) {
        console.log(`   Suggestions:`);
        analysis.suggestions.forEach(suggestion => {
          console.log(`   - ${suggestion}`);
        });
      }
    });
  });
  
  // Test expected behaviors
  console.log('\n🎯 VALIDATION CHECKS');
  console.log('=' .repeat(80));
  
  // Check personal announcement detection
  const personalTest = analyzeInput("I'm launching StoryScale");
  console.log(`\n✅ Personal Detection Test:`);
  console.log(`   Input: "I'm launching StoryScale"`);
  console.log(`   Detected as: ${personalTest.contentType}`);
  console.log(`   Personal Level: ${personalTest.personalityLevel}%`);
  console.log(`   Expected: personal-announcement with high personal level`);
  console.log(`   Status: ${personalTest.contentType === 'personal-announcement' && personalTest.personalityLevel > 40 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Check quality progression
  const examples = [
    EXAMPLE_INPUTS.poor,
    EXAMPLE_INPUTS.decent, 
    EXAMPLE_INPUTS.good,
    EXAMPLE_INPUTS.excellent
  ];
  
  console.log(`\n✅ Quality Progression Test:`);
  const scores = examples.map(input => {
    const analysis = analyzeInput(input);
    console.log(`   "${input.substring(0, 40)}..." → ${analysis.overallQuality}%`);
    return analysis.overallQuality;
  });
  
  const isProgressive = scores.every((score, i) => i === 0 || score >= scores[i-1]);
  console.log(`   Status: ${isProgressive ? '✅ PASS - Quality increases progressively' : '❌ FAIL - Quality regression detected'}`);
  
  // Check suggestion relevance
  const lowQualityTest = analyzeInput("AI tool");
  console.log(`\n✅ Suggestion System Test:`);
  console.log(`   Low quality input: "AI tool"`);
  console.log(`   Suggestions provided: ${lowQualityTest.suggestions.length}`);
  console.log(`   Has personal suggestion: ${lowQualityTest.suggestions.some(s => s.includes('personal')) ? '✅ Yes' : '❌ No'}`);
  console.log(`   Status: ${lowQualityTest.suggestions.length > 0 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n🏁 Test completed!');
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}

export { runTests };