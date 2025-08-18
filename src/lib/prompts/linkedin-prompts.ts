/**
 * LinkedIn AI Content System - Enterprise JavaScript Implementation
 * Production-ready LinkedIn content generation system
 * 
 * @version 2.0.0
 * @description Professional LinkedIn content generation system
 * @author AI Content System Team
 */

// Note: Install zod with: npm install zod
// If zod is not available, the system will work without runtime validation

// Basic validation function (fallback if zod is not available)
const validateOptional = (value, validator, defaultValue) => {
  try {
    return validator(value) ? value : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Content type constants
export const ContentType = {
  TEXT_ONLY: 'text-only',
  IMAGE_POST: 'image-post', 
  VIDEO_POST: 'video-post',
  CAROUSEL_PDF: 'carousel-pdf',
  POLL: 'poll'
};

export const Tone = {
  PROFESSIONAL: 'professional',
  FRIENDLY: 'friendly',
  AUTHORITATIVE: 'authoritative',
  CASUAL: 'casual'
};

export const Audience = {
  EXECUTIVES: 'executives',
  PROFESSIONALS: 'professionals',
  ENTREPRENEURS: 'entrepreneurs',
  GENERAL_BUSINESS: 'general-business',
  HR_LEADERS: 'hr-leaders',
  SALES_PROFESSIONALS: 'sales-professionals'
};

// Post length specifications
export const POST_LENGTH_SPECS = {
  short: {
    optimal: { min: 300, max: 800 },
    absolute: { min: 200, max: 1000 },
    note: "Quick insights, announcements, or simple updates - perfect for daily tips or breaking news",
    usage: "Daily engagement, quick thoughts, announcements"
  },
  medium: {
    optimal: { min: 800, max: 1500 },
    absolute: { min: 600, max: 1800 },
    note: "Detailed stories, case studies, or comprehensive tips - ideal for sharing experiences and guides",
    usage: "Story-telling, detailed insights, how-to content"
  },
  long: {
    optimal: { min: 1500, max: 3000 },
    absolute: { min: 1200, max: 3000 },
    note: "In-depth analysis, thought leadership, or comprehensive guides - best for authoritative content",
    usage: "Thought leadership, comprehensive analysis, detailed tutorials"
  }
};

// Authenticity constraints
const AUTHENTICITY_CONSTRAINTS = `
🛡️ CRITICAL AUTHENTICITY RULES - NEVER VIOLATE:

❌ FORBIDDEN PHRASES:
- "Having implemented/worked/consulted across X companies..."
- "Having worked in [role] for [X] years..."
- "As someone who's advised major corporations..."
- "From my experience with Fortune 500..."
- "My clients/team and I discovered..."
- "Industry insiders tell me..."
- "Based on confidential information..."
- "I've helped companies save millions..."
- "My network of X professionals..."
- "I've developed a revolutionary framework..."

✅ USE INSTEAD:
- "According to [credible source] research..."
- "Industry data from [organization] shows..."
- "Studies indicate..." / "Research reveals..."
- "Analysis of X companies found..."
- "Survey data shows..." / "Market research indicates..."
- "Industry reports suggest..." / "Expert analysis reveals..."

🎯 FOCUS: Share valuable insights through credible sources, not false personal credentials.
`;

// Content specifications
export const LINKEDIN_CONTENT_SPECS = {
  characterLimits: {
    'text-only': {
      optimal: { min: 1800, max: 2100 },
      absolute: { min: 1000, max: 3000 },
      note: "Text posts under 1000 characters see decreased reach"
    },
    'image-post': {
      optimal: { min: 900, max: 1200 },
      absolute: { min: 500, max: 1500 },
      note: "Image posts over 1300 characters may be truncated"
    },
    'video-post': {
      optimal: { min: 300, max: 500 },
      absolute: { min: 100, max: 1000 },
      note: "Video posts should focus on visual content, minimal text"
    },
    'carousel-pdf': {
      optimal: { min: 400, max: 500 },
      absolute: { min: 200, max: 800 },
      note: "PDF carousels generate highest engagement rates"
    },
    'poll': {
      optimal: { min: 300, max: 500 },
      absolute: { min: 150, max: 800 },
      note: "Polls should clearly explain the voting rationale"
    }
  },

  visualSpecs: {
    'single-image': {
      dimensions: ['1200x627px', '1080x1080px'],
      ratio: '1.91:1 (landscape) or 1:1 (square)',
      formats: ['JPG', 'PNG'],
      maxSize: '5MB',
      note: "Authentic, people-centric vertical images perform best"
    },
    'multi-image': {
      dimensions: ['1080x1080px', '1080x1350px'],
      maxImages: 10,
      note: "Now requires PDF format since LinkedIn removed native carousels"
    },
    'video': {
      aspectRatio: ['1:1', '4:5', '16:9'],
      dimensions: ['1080x1080px', '1080x1350px', '1920x1080px'],
      duration: { min: '15 seconds', max: '10 minutes', optimal: '1-2 minutes' },
      formats: ['MP4', 'MOV'],
      note: "Native video uploads perform better than links"
    },
    'carousel-pdf': {
      dimensions: ['1920x1080px', '1080x1080px'],
      maxSlides: 10,
      optimalSlides: 12,
      format: 'PDF only',
      note: "Each slide should have 25-50 words maximum"
    },
    // Map content types to their visual specs
    'image-post': {
      dimensions: ['1200x627px', '1080x1080px'],
      ratio: '1.91:1 (landscape) or 1:1 (square)',
      formats: ['JPG', 'PNG'],
      maxSize: '5MB',
      note: "Authentic, people-centric vertical images perform best"
    },
    'video-post': {
      aspectRatio: ['1:1', '4:5', '16:9'],
      dimensions: ['1080x1080px', '1080x1350px', '1920x1080px'],
      duration: { min: '15 seconds', max: '10 minutes', optimal: '1-2 minutes' },
      formats: ['MP4', 'MOV'],
      note: "Native video uploads perform better than links"
    }
  }
};

// System prompts
export const LINKEDIN_PROMPTS = {
  systemPrompts: {
    professional: `You are an expert LinkedIn content strategist who understands the 2024/2025 LinkedIn algorithm and professional audience behavior.

${AUTHENTICITY_CONSTRAINTS}

Your expertise includes:
- Creating hooks that stop the scroll within the first 2 lines
- Using strategic line breaks every 2-3 sentences for mobile readability
- Incorporating LinkedIn-specific engagement patterns
- Understanding the professional networking mindset
- Writing content that builds genuine business relationships

Always create content that:
- Provides authentic professional value using credible sources
- Uses conversational yet credible tone
- Includes strategic formatting for LinkedIn's mobile-first audience
- Encourages meaningful professional dialogue
- Builds trust and authority through valuable insights, not false credentials`,

    friendly: `You are a personable LinkedIn content creator who builds authentic professional relationships through content.

${AUTHENTICITY_CONSTRAINTS}

Your approach focuses on:
- Personal storytelling with professional lessons (using credible examples, not false personal claims)
- Vulnerable authenticity that resonates with professionals
- Conversational tone that feels like networking in person
- Behind-the-scenes insights into professional life
- Building community through shared experiences

Create content that:
- Makes people feel connected and understood
- Shares genuine professional insights through credible sources
- Uses relatable language while maintaining professionalism
- Encourages others to share their own experiences
- Builds long-term professional relationships through authentic value`,

    authoritative: `You are a recognized thought leader and industry expert creating authoritative LinkedIn content.

${AUTHENTICITY_CONSTRAINTS}

Your expertise includes:
- Industry trend analysis and future predictions based on credible data
- Data-driven insights with supporting evidence from reliable sources
- Framework development and strategic thinking using established methodologies
- Challenging conventional wisdom with research-backed evidence
- Providing expert commentary on industry developments

Always demonstrate:
- Deep industry knowledge through credible sources and research
- Confidence backed by verifiable evidence and examples
- Unique perspectives that advance industry thinking using established data
- Strategic insights that help others make better decisions
- Thought leadership through valuable insights, not false credentials`,

    casual: `You are a relaxed professional who makes complex topics accessible and engaging on LinkedIn.

${AUTHENTICITY_CONSTRAINTS}

Your style includes:
- Everyday language that doesn't intimidate
- Humor and lightness when appropriate
- Making complex concepts simple and actionable using credible sources
- Sharing quick wins and practical tips based on research
- Being approachable while still providing valuable, source-backed content

Focus on:
- Breaking down barriers to professional learning
- Making expertise accessible through credible information
- Creating content that's easy to consume and share
- Building an inclusive professional community
- Providing value through research and established best practices`
  },

  // Purpose templates
  purposeTemplates: {
    'share-insights': {
      intro: "Share a unique professional perspective or data-driven observation about",
      structure: "Hook (controversial/surprising) → Context/Data → Key Insight → Supporting Evidence → Professional Takeaway",
      emphasis: "Lead with counterintuitive findings or challenge common beliefs",
      characterTarget: 'text-only',
      engagementFocus: "thought-provoking comments and industry discussion"
    },
    'offer-value': {
      intro: "Create a value exchange that naturally attracts ideal prospects through",
      structure: "Free Value Hook → Resource Preview → Benefit Demonstration → Easy Access Method → Next Step",
      emphasis: "Focus on the VALUE first - make the free resource irresistible",
      characterTarget: 'text-only',
      engagementFocus: "resource downloads and value appreciation"
    },
    'ask-question': {
      intro: "Pose a strategic question that sparks professional dialogue about",
      structure: "Context → Specific Question → Your Initial Thoughts → Invite Expertise",
      emphasis: "Ask questions that professionals actually want to answer",
      characterTarget: 'text-only',
      engagementFocus: "detailed responses sharing professional experiences"
    },
    'share-story': {
      intro: "Tell a compelling professional story about",
      structure: "Hook → Professional Challenge → Actions Taken → Results → Universal Lesson",
      emphasis: "Make it relatable to professionals facing similar challenges",
      characterTarget: 'text-only',
      engagementFocus: "others sharing their similar experiences"
    },
    'provide-solutions': {
      intro: "Offer practical solutions and actionable advice for",
      structure: "Problem Recognition → Solution Introduction → Step-by-Step Approach → Implementation Tips → Expected Outcomes",
      emphasis: "Focus on immediately actionable solutions that professionals can implement",
      characterTarget: 'text-only',
      engagementFocus: "implementation questions and success stories from applying solutions"
    },
    'celebrate-success': {
      intro: "Share achievements and milestones while inspiring others about",
      structure: "Success Announcement → Journey Context → Key Challenges Overcome → Lessons Learned → Inspiration for Others",
      emphasis: "Balance celebration with humility and valuable lessons for the professional community",
      characterTarget: 'text-only',
      engagementFocus: "congratulations and others sharing their own success stories"
    },
    'announce-news': {
      intro: "Announce and provide professional context for",
      structure: "Headline → Business Impact → Industry Implications → What Professionals Should Know",
      emphasis: "Focus on what this means for professionals in the field",
      characterTarget: 'image-post',
      engagementFocus: "informed discussion about implications"
    },
    'thought-leadership': {
      intro: "Establish thought leadership and expert insights about",
      structure: "Expert Hook → Industry Context → Authoritative Analysis → Future Implications → Call for Industry Action",
      emphasis: "Demonstrate deep expertise with unique perspectives",
      characterTarget: 'text-only',
      engagementFocus: "high-level strategic discussions"
    },
    'data-insights': {
      intro: "Share compelling data and research findings about",
      structure: "Surprising Statistic → Context → Analysis → Professional Implications → Discussion Prompt",
      emphasis: "Use data to challenge assumptions or reveal trends",
      characterTarget: 'carousel-pdf',
      engagementFocus: "analytical discussions and data sharing"
    },
    'framework-sharing': {
      intro: "Present a practical framework or methodology for",
      structure: "Problem Statement → Framework Introduction → Step-by-Step Breakdown → Implementation Tips → Results Preview",
      emphasis: "Provide immediately actionable professional tools",
      characterTarget: 'carousel-pdf',
      engagementFocus: "implementation questions and success stories"
    }
  },

  // Audience customization
  audienceCustomization: {
    executives: {
      vocabulary: "strategic transformation, ROI optimization, stakeholder alignment, competitive advantage, organizational excellence",
      focus: "strategic decisions, market positioning, leadership challenges, transformation initiatives",
      length: "scannable with key insights highlighted",
      contentTypes: ['thought-leadership', 'data-insights', 'framework-sharing'],
      engagementStyle: "strategic questions, peer-level discussions, expertise sharing",
      hashtagMix: "executive-focused + industry-specific",
      timing: "Tuesday-Thursday 8-10am, avoid Mondays and Fridays"
    },
    professionals: {
      vocabulary: "best practices, professional development, career growth, skill enhancement, workplace efficiency",
      focus: "practical applications, career advancement, skill building, workplace success",
      length: "moderate detail with actionable takeaways",
      contentTypes: ['framework-sharing', 'share-story', 'share-insights'],
      engagementStyle: "experience sharing, advice seeking, practical questions",
      hashtagMix: "skill-based + career development",
      timing: "Tuesday-Thursday 7-9am, 12-1pm"
    },
    entrepreneurs: {
      vocabulary: "startup journey, scaling challenges, growth hacking, pivot strategies, entrepreneurial mindset",
      focus: "startup lessons, growth strategies, failure stories, funding insights",
      length: "story-driven with specific metrics and outcomes",
      contentTypes: ['share-story', 'data-insights', 'framework-sharing'],
      engagementStyle: "vulnerability, lesson sharing, mentor-mentee dynamics",
      hashtagMix: "startup-focused + entrepreneurship",
      timing: "Monday-Wednesday 6-8am, Sunday 7-9pm"
    },
    'hr-leaders': {
      vocabulary: "talent acquisition, employee engagement, organizational culture, performance management, workforce development",
      focus: "people strategies, culture building, talent challenges, employee experience",
      length: "detailed with people-focused insights",
      contentTypes: ['framework-sharing', 'data-insights', 'thought-leadership'],
      engagementStyle: "HR community discussions, best practice sharing",
      hashtagMix: "HR-specific + people management",
      timing: "Monday-Wednesday 9-11am"
    },
    'sales-professionals': {
      vocabulary: "sales methodology, relationship building, pipeline management, customer success, revenue growth",
      focus: "sales strategies, customer relationships, deal execution, sales team performance",
      length: "tactical with specific techniques and results",
      contentTypes: ['framework-sharing', 'share-story', 'data-insights'],
      engagementStyle: "technique sharing, success stories, challenge discussions",
      hashtagMix: "sales-focused + industry vertical",
      timing: "Tuesday-Thursday 7-9am, 5-6pm"
    },
    'general-business': {
      vocabulary: "business growth, professional success, industry trends, market dynamics, business strategy",
      focus: "universal business principles, broad industry insights, general professional development",
      length: "accessible and widely applicable",
      contentTypes: ['share-insights', 'ask-question', 'announce-news'],
      engagementStyle: "broad discussions, opinion sharing, trend analysis",
      hashtagMix: "general business + trending topics",
      timing: "Tuesday-Thursday 8-11am"
    }
  },

  // CTA templates
  ctaTemplates: {
    'discussion-starters': [
      "What's been your experience with {specific_scenario}? I'd love to hear different perspectives.",
      "Which approach has worked best in your {industry/role}? Share your wins and lessons.",
      "What would you add to this framework? I'm always looking to refine it.",
      "How are you seeing this trend play out in your organization?",
      "What's one thing you'd do differently if you faced this situation?"
    ],
    'authority-building': [
      "What trends are you seeing in {industry} that others might be missing?",
      "How are you preparing your team/organization for {future_change}?",
      "What's your prediction for {industry_topic} in the next 12 months?",
      "Where do you see the biggest opportunities in {field} right now?"
    ],
    'experience-sharing': [
      "Drop a comment if you've experienced something similar - I'd love to learn from your story.",
      "What's your biggest lesson learned from {similar_situation}?",
      "Share your {relevant_experience} in the comments - the community would benefit.",
      "What's worked best for you when dealing with {related_challenge}?"
    ]
  },

  // Hashtag strategy
  hashtagStrategies: {
    optimal: {
      count: "3-5 hashtags (LinkedIn's sweet spot)",
      mix: "1-2 popular (100K+ posts) + 2-3 niche (10K-50K posts) + 1 branded",
      placement: "End of post, not scattered throughout"
    },
    popular: {
      general: ["#LinkedIn", "#ProfessionalDevelopment", "#Leadership", "#BusinessStrategy", "#CareerGrowth"],
      business: ["#Entrepreneurship", "#Innovation", "#DigitalTransformation", "#FutureOfWork"],
      trending: ["#AI", "#RemoteWork", "#ESG", "#Diversity", "#Sustainability"]
    },
    niche: {
      byIndustry: {
        tech: ["#TechLeadership", "#ProductManagement", "#DevCulture"],
        finance: ["#FinTech", "#RiskManagement", "#InvestmentStrategy"],
        healthcare: ["#HealthcareInnovation", "#PatientCare", "#MedTech"],
        consulting: ["#ManagementConsulting", "#BusinessTransformation"]
      }
    }
  }
};

/**
 * Enhanced prompt builder with comprehensive validation
 * @param {Object} params - The parameters for building the LinkedIn prompt
 * @returns {Object} The built prompt result
 */
export function buildLinkedInPrompt(params) {
  // Input validation and sanitization
  const validatedParams = {
    topic: params.topic?.trim() || '',
    purpose: params.purpose || 'share-insights',
    goal: params.goal || 'increase-engagement',
    tone: params.tone || 'professional',
    audience: params.audience || 'professionals',
    format: params.format || 'text-only',
    postLength: params.postLength || 'medium',
    enableCTA: params.enableCTA ?? true,
    callToAction: params.callToAction?.trim() || '',
    url: params.url?.trim() || '',
    keywords: params.keywords || [],
    customInstructions: params.customInstructions?.trim() || '',
    contentType: params.contentType || 'text-only',
    industry: params.industry?.trim() || '',
    includeHashtags: params.includeHashtags ?? true,
    targetCharacterCount: params.targetCharacterCount ?? true,
    enableResearch: params.enableResearch ?? false,
    researchContext: params.researchContext || null
  };

  // Analyze input to detect personal announcements
  const analyzeInput = (topic) => {
    const text = topic.toLowerCase();
    const personalIndicators = [
      /\b(i am|i'm|my|we|our|i've|we've|i just|we just)\b/gi,
      /\b(launching|introducing|announcing|building|creating)\b/gi,
      /\b(excited to|proud to|happy to)\b/gi
    ];
    
    let personalityScore = 0;
    personalIndicators.forEach(pattern => {
      const matches = (topic.match(pattern) || []).length;
      personalityScore += matches * 15;
    });
    
    const isPersonalAnnouncement = personalityScore > 30 && 
      (text.includes('launch') || text.includes('announ') || text.includes('introduc') || 
       text.includes('proud') || text.includes('excited'));
    
    return {
      isPersonalAnnouncement,
      personalityScore
    };
  };

  const inputAnalysis = analyzeInput(validatedParams.topic);

  // Validate required fields
  if (!validatedParams.topic) {
    throw new Error('Topic is required and cannot be empty');
  }

  // Get specifications with safe fallbacks
  const getContentSpecs = (contentType) => {
    return LINKEDIN_CONTENT_SPECS.characterLimits[contentType] ||
           LINKEDIN_CONTENT_SPECS.characterLimits['text-only'];
  };

  const getPostLengthSpecs = (postLength) => {
    return POST_LENGTH_SPECS[postLength] || POST_LENGTH_SPECS.medium;
  };

  const getVisualSpecs = (contentType) => {
    // Check if visual specs exist for this content type
    const visualSpecsMap = LINKEDIN_CONTENT_SPECS.visualSpecs;
    
    // Return visual specs if they exist for this content type
    if (contentType in visualSpecsMap) {
      return visualSpecsMap[contentType];
    }
    
    // Content types that don't have visual specs
    if (contentType === 'text-only' || contentType === 'poll') {
      return null;
    }
    
    // Default fallback
    return null;
  };

  const getSystemPrompt = (tone) => {
    return LINKEDIN_PROMPTS.systemPrompts[tone] ||
           LINKEDIN_PROMPTS.systemPrompts.professional;
  };

  const getPurposeTemplate = (purpose) => {
    return LINKEDIN_PROMPTS.purposeTemplates[purpose] ||
           LINKEDIN_PROMPTS.purposeTemplates['share-insights'];
  };

  const getAudienceCustomization = (audience) => {
    return LINKEDIN_PROMPTS.audienceCustomization[audience] ||
           LINKEDIN_PROMPTS.audienceCustomization.professionals;
  };

  // Get specifications
  const specs = getPostLengthSpecs(validatedParams.postLength);
  const contentSpecs = getContentSpecs(validatedParams.contentType);
  const visualSpecs = getVisualSpecs(validatedParams.contentType);
  const systemPrompt = getSystemPrompt(validatedParams.tone);
  const purposeGuide = getPurposeTemplate(validatedParams.purpose);
  const audienceGuide = getAudienceCustomization(validatedParams.audience);

  // Generate CTA guidance
  const generateCTAGuidance = () => {
    if (!validatedParams.enableCTA) return '';
    
    if (validatedParams.callToAction) {
      return `- End with this specific call-to-action: "${validatedParams.callToAction}"`;
    }

    const ctaCategory = purposeGuide.engagementFocus.includes('discussion') ? 'discussion-starters' :
                       purposeGuide.engagementFocus.includes('experience') ? 'experience-sharing' :
                       'authority-building';
    
    const ctaOptions = LINKEDIN_PROMPTS.ctaTemplates[ctaCategory] || LINKEDIN_PROMPTS.ctaTemplates['discussion-starters'];
    
    return `- End with an engaging call-to-action. Examples:
${ctaOptions.slice(0, 3).map(cta => 
  `  • ${cta.replace('{specific_scenario}', 'this topic')
         .replace('{industry/role}', validatedParams.audience)
         .replace('{topic}', validatedParams.topic)}`
).join('\n')}`;
  };

  // Generate hashtag guidance
  const generateHashtagGuidance = () => {
    if (!validatedParams.includeHashtags) return '';
    
    const hashtagStrategy = LINKEDIN_PROMPTS.hashtagStrategies;
    return `
Hashtag Strategy (${hashtagStrategy.optimal.count}):
- ${hashtagStrategy.optimal.mix}
- Use audience-specific hashtags: ${audienceGuide.hashtagMix}
${validatedParams.industry ? `- Include industry hashtags for ${validatedParams.industry}` : ''}
- Place at end of post, not scattered throughout`;
  };

  // Build character count guidance
  const characterGuidance = validatedParams.targetCharacterCount ? `
Character Count: ${specs.optimal.min}-${specs.optimal.max} characters (${validatedParams.postLength} post)
Best for: ${specs.usage}
Note: ${specs.note}` : '';

  // Build visual guidance
  const visualGuidance = visualSpecs ? `
Visual Requirements:
- Dimensions: ${visualSpecs.dimensions?.join(' or ') || 'N/A'}
- ${visualSpecs.note}` : '';

  // Build the comprehensive prompt with smart personal detection
  const getTaskInstruction = () => {
    if (inputAnalysis.isPersonalAnnouncement) {
      return `Write a personal LinkedIn announcement based on this user's story and achievement: "${validatedParams.topic}"

🎯 CRITICAL: This is the user's PERSONAL story - write about THEM and THEIR specific journey/launch, not generic content about the topic.`;
    } else {
      return `${purposeGuide.intro} ${validatedParams.topic}`;
    }
  };

  const fullPrompt = `
${systemPrompt}

LINKEDIN CONTENT TASK: ${getTaskInstruction()}
Goal: ${validatedParams.goal.replace('-', ' ')} on LinkedIn
Content Type: ${validatedParams.contentType}

${inputAnalysis.isPersonalAnnouncement ? `
🚨 PERSONAL ANNOUNCEMENT REQUIREMENTS:
- This is about the USER'S personal journey and achievement
- Use first-person perspective naturally (I, we, my, our)
- Focus on THEIR specific story, background, and what THEY are launching/announcing
- Make it personal and authentic to THEIR experience
- Don't create generic content about the topic - write about THEM specifically
- Include their journey, motivation, and what makes their story unique
` : ''}

TARGET AUDIENCE:
- Primary: ${validatedParams.audience}
- Vocabulary level: ${audienceGuide.vocabulary}
- Content focus: ${audienceGuide.focus}
- Engagement style: ${audienceGuide.engagementStyle}
- Optimal posting time: ${audienceGuide.timing}

LINKEDIN FORMAT REQUIREMENTS:
Structure: ${inputAnalysis.isPersonalAnnouncement ? 
  'Personal Hook → Background/Journey → The Announcement → What Makes It Special → Vision/Impact → Call-to-Action' : 
  purposeGuide.structure}
${characterGuidance}
${visualGuidance}

CONTENT STRATEGY:
- Key emphasis: ${inputAnalysis.isPersonalAnnouncement ? 
  'Personal authenticity, specific journey details, genuine excitement, and what makes this launch/announcement meaningful' : 
  purposeGuide.emphasis}
- Engagement focus: ${inputAnalysis.isPersonalAnnouncement ? 
  'Personal story resonance, community support, and connecting with others on similar journeys' : 
  purposeGuide.engagementFocus}
${validatedParams.purpose === 'offer-value' && validatedParams.goal === 'generate-leads' ? `
ENHANCED LEAD MAGNET STRATEGY:
- Lead with a compelling preview of your free resource
- Clearly state the specific problem your resource solves
- Use numbers/specifics (e.g., "5-step framework", "10-point checklist")
- Make the value immediately obvious and tangible
- Include a clear, frictionless way to access the resource
- End with "Comment [specific word] and I'll send it to you"` : ''}
${validatedParams.keywords.length ? `- Include these keywords naturally: ${validatedParams.keywords.join(', ')}` : ''}
${validatedParams.url ? `- Reference this URL if relevant: ${validatedParams.url}` : ''}

AUTHENTICITY REQUIREMENTS:
${validatedParams.enableResearch && validatedParams.researchContext ? `
- Use ONLY the provided research context for any claims or statistics
- Reference the specific sources provided in the research context
- Do not add any statistics, data points, or research claims beyond what's provided
- Base insights on the verified research data provided` : `
- DO NOT include any statistics, percentages, or research claims
- DO NOT reference studies, reports, or data points unless verified
- DO NOT use phrases like "According to X study", "Research shows", "Data reveals"
- Focus on personal insights, opinions, and experience-based observations
- Use qualitative language instead of quantitative claims`}
- Avoid false personal experience claims
- Never claim fake authority or unverifiable credentials
- Focus on valuable insights, not personal credentials${validatedParams.researchContext ? `

VERIFIED RESEARCH CONTEXT:
${validatedParams.researchContext}

Use ONLY this research data for any factual claims.` : ''}

LINKEDIN OPTIMIZATION:
- Start with scroll-stopping hook (first 1-2 lines)
- Use line breaks every 2-3 sentences for mobile readability
- Include strategic → bullets or visual elements
- Add professional emojis for emphasis (not decoration)
- Build toward clear professional takeaway
${generateCTAGuidance()}
${generateHashtagGuidance()}

ALGORITHM CONSIDERATIONS:
- Native LinkedIn content performs better than links
- Comments are more valuable than likes for reach
- Early engagement (first 60 minutes) crucial
- Professional value must be clear and immediate

${validatedParams.customInstructions ? `SPECIAL INSTRUCTIONS: ${validatedParams.customInstructions}` : ''}

Write the LinkedIn post now, following all specifications above:`;

  return {
    system: systemPrompt,
    user: fullPrompt,
    metadata: {
      contentType: validatedParams.contentType,
      characterTarget: specs.optimal,
      visualSpecs,
      audienceStrategy: audienceGuide,
      hashtagCount: validatedParams.includeHashtags ? '3-5' : '0',
      generatedAt: new Date().toISOString(),
      version: '2.0.0'
    }
  };
}

// Validation utilities
export const ValidationUtils = {
  /**
   * Validates character limits for content
   * @param {string} content - The content to validate
   * @param {string} contentType - The type of content
   * @returns {Object} Validation result
   */
  validateCharacterCount: (content, contentType) => {
    const specs = LINKEDIN_CONTENT_SPECS.characterLimits[contentType];
    if (!specs) {
      return { isValid: false, message: 'Invalid content type' };
    }

    const length = content.length;
    
    if (length < specs.absolute.min) {
      return { 
        isValid: false, 
        message: `Content too short. Minimum ${specs.absolute.min} characters, got ${length}` 
      };
    }
    
    if (length > specs.absolute.max) {
      return { 
        isValid: false, 
        message: `Content too long. Maximum ${specs.absolute.max} characters, got ${length}` 
      };
    }
    
    if (length < specs.optimal.min || length > specs.optimal.max) {
      return { 
        isValid: true, 
        message: `Content length acceptable but not optimal. Optimal range: ${specs.optimal.min}-${specs.optimal.max}` 
      };
    }
    
    return { isValid: true, message: 'Character count optimal' };
  },

  /**
   * Checks for authenticity violations
   * @param {string} content - The content to check
   * @returns {Object} Authenticity check result
   */
  checkAuthenticity: (content) => {
    const forbiddenPhrases = [
      'Having implemented',
      'Having worked',
      'My clients',
      'Industry insiders tell me',
      'My sources',
      'I\'ve helped companies save',
      'My network of',
      'As someone who\'s',
      'From my experience with Fortune',
      'I can confidently say',
      'My revolutionary framework'
    ];

    const violations = forbiddenPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );

    return {
      isValid: violations.length === 0,
      violations
    };
  }
};

// Performance metrics
export const PerformanceMetrics = {
  engagementTargets: {
    'text-only': { likes: '2-4%', comments: '0.5-1%', shares: '0.1-0.3%' },
    'image-post': { likes: '3-6%', comments: '0.8-1.5%', shares: '0.2-0.5%' },
    'video-post': { likes: '4-8%', comments: '1-2%', shares: '0.3-0.8%' },
    'carousel-pdf': { likes: '5-10%', comments: '1.5-3%', shares: '0.5-1%' },
    'poll': { likes: '6-12%', comments: '2-4%', shares: '0.3-0.7%' }
  },
  
  qualityChecklist: [
    "Hook grabs attention in first 2 lines",
    "Character count in optimal range",
    "Line breaks every 2-3 sentences",
    "Clear professional value provided",
    "Specific, engaging call-to-action",
    "3-5 relevant hashtags",
    "Mobile-friendly formatting",
    "Authentic voice maintained",
    "NO false authority claims used",
    "Sources cited for any statistics/claims",
    "No unverifiable personal experience claims"
  ]
};

// Export everything for easy consumption
export default {
  buildLinkedInPrompt,
  LINKEDIN_CONTENT_SPECS,
  POST_LENGTH_SPECS,
  LINKEDIN_PROMPTS,
  ValidationUtils,
  PerformanceMetrics,
  ContentType,
  Tone,
  Audience
};