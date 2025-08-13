# AI Customization & Training Guide

## 🎯 Customization Methods

### 1. **Prompt Engineering** (Easiest)
Edit `/src/lib/prompts/linkedin-prompts.js` to modify:
- System prompts for different tones
- Purpose-specific templates
- Audience vocabulary and focus
- Format structures
- CTA templates

**Example**: Make posts more casual
```javascript
systemPrompts: {
  professional: `You are a LinkedIn creator who writes in a conversational, 
  approachable style while maintaining professionalism. Use "you" and "we" 
  often. Include personal observations.`
}
```

### 2. **Add Industry-Specific Templates**
```javascript
// In linkedin-prompts.js
export const INDUSTRY_TEMPLATES = {
  'saas': {
    keywords: ['scalability', 'integration', 'workflow', 'automation'],
    topics: ['product updates', 'customer success', 'feature releases'],
    tone: 'enthusiastic but data-driven'
  },
  'finance': {
    keywords: ['compliance', 'risk management', 'ROI', 'portfolio'],
    topics: ['market analysis', 'regulatory updates', 'investment strategies'],
    tone: 'authoritative and precise'
  }
};
```

### 3. **Training with Examples** (Fine-tuning approach)
Collect good examples of posts and add them to `TRAINING_EXAMPLES`:

```javascript
export const TRAINING_EXAMPLES = [
  {
    input: { topic: "AI in healthcare", tone: "professional" },
    output: "Your ideal LinkedIn post example here..."
  }
];
```

Then use few-shot prompting:
```javascript
const userPrompt = `
Here are examples of excellent LinkedIn posts:
${TRAINING_EXAMPLES.slice(0, 3).map(ex => ex.output).join('\n---\n')}

Now create a similar post about: ${topic}
`;
```

### 4. **Add Brand Voice**
Create company-specific writing styles:

```javascript
// In your company settings
export const COMPANY_VOICE = {
  name: "TechCorp",
  values: ["innovation", "collaboration", "impact"],
  tone: "Optimistic and forward-thinking",
  phrases: [
    "At TechCorp, we believe...",
    "Our mission to...",
    "Join us in..."
  ],
  avoid: ["jargon", "corporate speak", "buzzwords"],
  emojis: "strategic use only",
  hashtags: ["#TechCorpInnovates", "#FutureOfTech"]
};
```

### 5. **User-Specific Learning**
Store successful posts and user preferences:

```javascript
// Create a user profile system
const userProfile = {
  preferredTone: 'friendly',
  topPerformingPosts: [
    { content: '...', engagement: 500, topic: 'leadership' }
  ],
  writingPatterns: {
    openings: ['Questions', 'Statistics', 'Stories'],
    avgLength: 250,
    emojiUsage: 'moderate',
    hashtagCount: 4
  }
};

// Use in prompt
const userPrompt = `
Based on this user's successful posts, which typically:
- Start with ${userProfile.writingPatterns.openings[0]}
- Average ${userProfile.writingPatterns.avgLength} words
- Use ${userProfile.writingPatterns.emojiUsage} emojis

Create a new post about: ${topic}
`;
```

### 6. **A/B Testing System**
```javascript
// Test different prompt variations
const PROMPT_VARIANTS = {
  A: "Write a LinkedIn post that tells a story...",
  B: "Create a data-driven LinkedIn post...",
  C: "Craft an engaging question-based post..."
};

// Track performance
const trackPerformance = (variant, engagement) => {
  // Store which prompts generate better content
  analytics.track('prompt_performance', { variant, engagement });
};
```

### 7. **Advanced Model Configuration**
```javascript
// Adjust OpenAI parameters for different effects
const modelConfigs = {
  creative: {
    temperature: 0.9,  // More creative/random
    top_p: 0.95,
    frequency_penalty: 0.5  // Avoid repetition
  },
  focused: {
    temperature: 0.3,  // More predictable
    top_p: 0.8,
    frequency_penalty: 0.2
  },
  balanced: {
    temperature: 0.7,  // Default
    top_p: 0.9,
    frequency_penalty: 0.3
  }
};
```

## 📚 Implementation Steps

### Quick Start (5 minutes)
1. Edit `/src/lib/prompts/linkedin-prompts.js`
2. Modify the `systemPrompts` object for your tone
3. Test with the wizard

### Medium Customization (1 hour)
1. Add industry templates
2. Create brand voice guidelines
3. Add 5-10 training examples
4. Test variations

### Full Training System (1 day)
1. Implement user preference storage
2. Create A/B testing framework
3. Build analytics dashboard
4. Collect 50+ training examples
5. Fine-tune prompts based on data

## 🔬 Testing Your Customizations

```javascript
// Test script for prompt variations
async function testPromptVariations() {
  const testCases = [
    { topic: "remote work", tone: "casual", audience: "entrepreneurs" },
    { topic: "AI ethics", tone: "authoritative", audience: "executives" },
    { topic: "team building", tone: "friendly", audience: "professionals" }
  ];

  for (const test of testCases) {
    const result = await generateContent(test);
    console.log(`\nTest: ${JSON.stringify(test)}`);
    console.log(`Result: ${result.substring(0, 200)}...`);
    console.log(`Quality Score: ${evaluateQuality(result)}`);
  }
}
```

## 💾 Storing Custom Settings

Create a settings file for each user/company:

```javascript
// /src/config/ai-settings.json
{
  "defaultTone": "professional",
  "brandVoice": {
    "enabled": true,
    "profile": "tech-startup"
  },
  "customPrompts": {
    "introductions": [
      "Did you know that...",
      "Here's something surprising..."
    ]
  },
  "forbiddenWords": ["synergy", "leverage", "circling back"],
  "preferredModel": "gpt-4o-mini",
  "temperature": 0.7
}
```

## 🚀 Advanced: Connect to Fine-tuned Models

```javascript
// Use a fine-tuned model if available
const useFineTunedModel = async (prompt) => {
  const fineTunedModelId = process.env.FINE_TUNED_MODEL_ID;
  
  if (fineTunedModelId) {
    return await openai.chat.completions.create({
      model: fineTunedModelId,  // Your custom model
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
  }
  
  // Fallback to base model
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [/* standard prompts */]
  });
};
```

## 📊 Measure & Improve

Track what works:
```javascript
const metrics = {
  avgEngagement: 0,
  bestPerformingTone: '',
  optimalLength: 0,
  topHashtags: [],
  bestPostTime: '',
  successfulTopics: []
};

// Use metrics to improve prompts
const optimizedPrompt = `
Based on data, posts with ${metrics.optimalLength} words 
and ${metrics.bestPerformingTone} tone perform best.
Create a post about ${topic} following these patterns.
`;
```

---

**Remember**: The key to great AI content is iteration. Start simple, test often, and refine based on results!