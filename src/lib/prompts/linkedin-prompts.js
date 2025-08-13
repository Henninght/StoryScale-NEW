// LinkedIn Post Prompt Templates
// Customize these to change how AI generates content

export const LINKEDIN_PROMPTS = {
  // Base system prompts for different tones
  systemPrompts: {
    professional: `You are a professional content strategist creating polished LinkedIn posts.
Focus on data-driven insights, industry expertise, and thought leadership.
Maintain a formal yet engaging tone.`,
    
    friendly: `You are a personable content creator who writes warm, approachable LinkedIn posts.
Use conversational language, personal anecdotes, and relatable experiences.
Be authentic and human while remaining professional.`,
    
    authoritative: `You are an industry expert and thought leader creating authoritative LinkedIn content.
Demonstrate deep expertise, cite trends and statistics, and provide unique insights.
Write with confidence and conviction.`,
    
    casual: `You are a relaxed professional sharing insights on LinkedIn.
Use everyday language, humor when appropriate, and a conversational style.
Keep it light but valuable.`
  },

  // Templates for different post purposes
  purposeTemplates: {
    'share-insights': {
      intro: "Share a unique perspective or observation about",
      structure: "Hook → Context → Key Insight → Supporting Points → Takeaway",
      emphasis: "Focus on the 'aha moment' or unexpected learning"
    },
    
    'announce-news': {
      intro: "Announce and provide context for",
      structure: "Headline → Details → Impact → What's Next",
      emphasis: "Lead with the news, explain why it matters"
    },
    
    'ask-question': {
      intro: "Pose a thought-provoking question about",
      structure: "Context → Question → Your Perspective → Invite Discussion",
      emphasis: "Make it genuinely engaging, not rhetorical"
    },
    
    'share-story': {
      intro: "Tell a compelling story about",
      structure: "Setup → Challenge → Action → Result → Lesson",
      emphasis: "Make it personal and relatable with a clear moral"
    },
    
    'thought-leadership': {
      intro: "Share expert insights and thought leadership about",
      structure: "Hook → Expert Context → Core Insight → Supporting Analysis → Forward-Looking Takeaway",
      emphasis: "Demonstrate deep expertise and unique perspective"
    },
    
    'promote-content': {
      intro: "Introduce and promote content about",
      structure: "Value Hook → Content Preview → Key Benefits → Clear CTA",
      emphasis: "Lead with value, not promotion"
    },
    
    'value': {
      intro: "Share valuable insights about",
      structure: "Problem → Solution → Benefits → Action",
      emphasis: "Focus on practical value and actionable advice"
    },
    
    'question': {
      intro: "Pose a thought-provoking question about",
      structure: "Context → Question → Your Perspective → Invite Discussion",
      emphasis: "Make it genuinely engaging, not rhetorical"
    },
    
    'authority': {
      intro: "Establish thought leadership about",
      structure: "Expert Hook → Industry Context → Authoritative Insight → Future Implications",
      emphasis: "Demonstrate expertise and industry knowledge"
    }
  },

  // Audience-specific adjustments
  audienceCustomization: {
    'executives': {
      vocabulary: "strategic, ROI, stakeholder, transformation, leadership",
      focus: "business impact, strategic decisions, organizational change",
      length: "concise and scannable"
    },
    
    'professionals': {
      vocabulary: "best practices, implementation, collaboration, efficiency",
      focus: "practical applications, day-to-day improvements, skill development",
      length: "moderate with actionable details"
    },
    
    'entrepreneurs': {
      vocabulary: "growth, pivot, bootstrap, scale, innovation",
      focus: "lessons learned, growth strategies, overcoming challenges",
      length: "story-driven with specific examples"
    },
    
    'general-business': {
      vocabulary: "business, professional, industry, success, growth",
      focus: "broad business applications, general insights, universal principles",
      length: "accessible and widely applicable"
    }
  },

  // Format-specific structures
  formatStructures: {
    'story': `Start with a hook: "Last week, something unexpected happened..."
Build tension, reveal the insight, share the outcome.
End with a lesson or question.`,
    
    'list': `Lead with a number: "5 ways AI is changing..."
Use bullet points or numbered items.
Brief explanation for each point.`,
    
    'insight': `Open with a counterintuitive statement or observation.
Provide evidence or examples.
Explain the implications.
End with a forward-looking statement.`,
    
    'tips': `Start with the problem you're solving.
Provide 3-5 actionable tips.
Include specific how-to details.
Close with encouragement to try.`,
    
    'modern': `Use emojis and trending language.
Create visual breaks with spacing.
Include a strong hook and relatable content.
Keep it fresh and engaging.`,
    
    'news': `Lead with the headline or announcement.
Provide context and background.
Explain the impact and implications.
Include next steps or what to watch.`,
    
    'howto': `Start with what you'll learn/achieve.
Break into numbered steps.
Include specific details and examples.
End with encouragement to try.`
  },

  // Call-to-action templates
  ctaTemplates: [
    "What's your experience with {topic}? Share below 👇",
    "Agree or disagree? I'd love to hear your perspective.",
    "What would you add to this list?",
    "Have you seen similar trends in your industry?",
    "What's one thing you'd do differently?",
    "Follow for more insights on {topic}",
    "Save this for later reference 📌"
  ],

  // Hashtag strategies
  hashtagStrategies: {
    standard: ["#LinkedIn", "#ProfessionalDevelopment", "#BusinessInsights"],
    trending: ["#FutureOfWork", "#DigitalTransformation", "#Innovation2025"],
    niche: "Add 2-3 specific to the topic",
    branded: "Consider adding company/personal brand hashtag"
  }
};

// Function to build a complete prompt
export function buildLinkedInPrompt(params) {
  const {
    topic,
    purpose = 'share-insights',
    goal = 'increase-engagement',
    tone = 'professional',
    audience = 'professionals',
    format = 'insight',
    enableCTA = true,
    callToAction = '',
    url = '',
    keywords = [],
    customInstructions = ''
  } = params;

  // Select appropriate templates
  const systemPrompt = LINKEDIN_PROMPTS.systemPrompts[tone];
  const purposeGuide = LINKEDIN_PROMPTS.purposeTemplates[purpose];
  const audienceGuide = LINKEDIN_PROMPTS.audienceCustomization[audience];
  const formatGuide = LINKEDIN_PROMPTS.formatStructures[format];

  // Build the complete prompt
  const fullPrompt = `
${systemPrompt}

Your task: ${purposeGuide.intro} ${topic}
Goal: ${goal.replace('-', ' ')} (focus on this objective)

Audience Profile:
- Target: ${audience}
- Use vocabulary like: ${audienceGuide.vocabulary}
- Focus on: ${audienceGuide.focus}
- Keep it: ${audienceGuide.length}

Structure Guidelines:
${purposeGuide.structure}
${formatGuide}

Key Requirements:
- ${purposeGuide.emphasis}
- Include these keywords naturally: ${keywords.join(', ') || 'none specified'}
- Length: 200-300 words
- Add 3-5 relevant hashtags
${url ? `- Reference this URL if relevant: ${url}` : ''}
${enableCTA && callToAction ? `- End with this call-to-action: "${callToAction}"` : enableCTA ? '- End with an engaging call-to-action' : ''}

${customInstructions ? `Special Instructions: ${customInstructions}` : ''}

Write the LinkedIn post now:`;

  return {
    system: systemPrompt,
    user: fullPrompt
  };
}

// Training data examples for fine-tuning
export const TRAINING_EXAMPLES = [
  {
    input: {
      topic: "remote work productivity",
      tone: "friendly",
      audience: "professionals"
    },
    output: `🏠 Working from home for 3 years taught me this surprising truth...

Productivity isn't about working MORE hours. It's about working the RIGHT hours.

My biggest revelation? My peak performance happens at 6 AM, not 9 AM. Without a commute, I could actually use those golden hours for deep work instead of sitting in traffic.

Here's what changed everything:
• Time-blocking my calendar around energy levels, not arbitrary office hours
• Taking walking meetings in my neighborhood (goodbye, conference room!)
• Actually using my lunch break to recharge (novel concept, right?)

The result? I'm delivering better work in fewer hours, and my team notices the difference.

The future of work isn't about WHERE we work. It's about designing work around human performance, not industrial-age schedules.

What productivity myth did remote work shatter for you? 🤔

#RemoteWork #ProductivityTips #FutureOfWork #WorkLifeBalance #ProfessionalDevelopment`
  },
  // Add more examples here for different combinations
];

// Customization hooks for specific industries/brands
export const BRAND_VOICES = {
  'tech-startup': {
    modifier: "Be innovative, optimistic, and slightly irreverent. Use startup lingo.",
    emojis: "generous",
    hashtags: ["#StartupLife", "#TechInnovation", "#Disruption"]
  },
  
  'corporate-enterprise': {
    modifier: "Be measured, data-driven, and authoritative. Avoid slang.",
    emojis: "minimal",
    hashtags: ["#EnterpriseTransformation", "#BusinessStrategy", "#Leadership"]
  },
  
  'creative-agency': {
    modifier: "Be creative, visual, and storytelling-focused. Use vivid language.",
    emojis: "artistic",
    hashtags: ["#CreativeIndustry", "#DesignThinking", "#BrandStorytelling"]
  }
};