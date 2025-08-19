/**
 * Smart Input Analysis for Content Generation
 * Analyzes user input to provide intelligent suggestions and quality scoring
 */

export interface InputAnalysis {
  personalityLevel: number // 0-100: How personal/first-person the content is
  contextRichness: number // 0-100: How much context and background is provided
  actionableDetails: number // 0-100: How specific and actionable the content is
  overallQuality: number // 0-100: Combined weighted score
  suggestions: string[] // Specific micro-suggestions to improve input
  contentType: 'personal-announcement' | 'general-topic' | 'story-sharing' | 'advice-giving'
  readyToGenerate: boolean // Whether input is sufficient for quality generation
}

export interface SmartPrompt {
  icon: string
  message: string
  example?: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * Analyzes input text and provides quality scoring with suggestions
 */
export function analyzeInput(description: string): InputAnalysis {
  const text = description.trim().toLowerCase()
  const originalText = description.trim()
  
  // 1. Personal Indicators (30% weight)
  const personalIndicators = [
    /\b(i am|i'm|my|we|our|i've|we've|i just|we just)\b/gi,
    /\b(launching|introducing|announcing|building|creating)\b/gi,
    /\b(excited to|proud to|happy to)\b/gi
  ]
  
  let personalityScore = 0
  personalIndicators.forEach(pattern => {
    const matches = (originalText.match(pattern) || []).length
    personalityScore += Math.min(matches * 15, 40) // Max 40 points
  })
  
  // Detect company/product names (proper nouns that aren't common words)
  const properNouns = originalText.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]*)*\b/g) || []
  const productNames = properNouns.filter(noun => 
    !['LinkedIn', 'Facebook', 'Twitter', 'Instagram', 'Google'].includes(noun) &&
    noun.length > 2
  )
  if (productNames.length > 0) personalityScore += 20
  
  personalityScore = Math.min(personalityScore, 100)

  // 2. Context Richness (40% weight)
  const contextIndicators = [
    /\b(after|because|since|due to|following)\b/gi, // Causal context
    /\b(problem|challenge|issue|struggle|difficulty)\b/gi, // Problem context
    /\b(solution|solve|help|assist|enable)\b/gi, // Solution context
    /\b(professionals|people|users|customers|teams)\b/gi, // Audience context
    /\b(why|how|what|when|where)\b/gi // Explanatory context
  ]
  
  let contextScore = 0
  contextIndicators.forEach(pattern => {
    const matches = (originalText.match(pattern) || []).length
    contextScore += Math.min(matches * 8, 25) // Max 25 points each category
  })
  
  // Length bonus for detailed descriptions
  if (originalText.length > 100) contextScore += 15
  if (originalText.length > 200) contextScore += 10
  
  contextScore = Math.min(contextScore, 100)

  // 3. Actionable Details (30% weight)
  const actionableIndicators = [
    /\b(creates?|generates?|provides?|delivers?|offers?)\b/gi, // Action verbs
    /\b(in \d+\s*(?:seconds?|minutes?|hours?))\b/gi, // Time specifics
    /\b(\d+%|\d+x|faster|better|more)\b/gi, // Quantified benefits
    /\b(professional|quality|efficient|effective)\b/gi, // Quality indicators
    /\b(blog|post|content|copy|marketing)\b/gi // Output specifics
  ]
  
  let actionableScore = 0
  actionableIndicators.forEach(pattern => {
    const matches = (originalText.match(pattern) || []).length
    actionableScore += Math.min(matches * 10, 30) // Max 30 points each category
  })
  
  actionableScore = Math.min(actionableScore, 100)

  // Calculate weighted overall score
  const overallQuality = Math.round(
    (personalityScore * 0.3) + 
    (contextScore * 0.4) + 
    (actionableScore * 0.3)
  )

  // Determine content type
  let contentType: InputAnalysis['contentType'] = 'general-topic'
  if (personalityScore > 40) {
    if (text.includes('launch') || text.includes('announ') || text.includes('introduc')) {
      contentType = 'personal-announcement'
    } else if (text.includes('story') || text.includes('experience') || text.includes('journey')) {
      contentType = 'story-sharing'
    } else {
      contentType = 'advice-giving'
    }
  }

  // Generate smart suggestions
  const suggestions = generateSuggestions(personalityScore, contextScore, actionableScore, contentType, originalText)

  return {
    personalityLevel: personalityScore,
    contextRichness: contextScore,
    actionableDetails: actionableScore,
    overallQuality,
    suggestions,
    contentType,
    readyToGenerate: overallQuality >= 50
  }
}

/**
 * Generates smart, contextual suggestions to improve input
 */
function generateSuggestions(
  personality: number, 
  context: number, 
  actionable: number, 
  contentType: InputAnalysis['contentType'],
  originalText: string
): string[] {
  const suggestions: string[] = []

  // Priority 1: Missing personal touch (most impactful)
  if (personality < 30) {
    suggestions.push("💡 Make it personal: Start with 'I'm' or 'We're' to show this is your story")
  }

  // Priority 2: Missing context (high impact)
  if (context < 40) {
    if (contentType === 'personal-announcement') {
      suggestions.push("💡 Add your motivation: Why did you create this? What problem inspired you?")
    } else {
      suggestions.push("💡 Add context: What's the background or problem this addresses?")
    }
  }

  // Priority 3: Missing actionable details (medium impact)
  if (actionable < 30) {
    if (originalText.toLowerCase().includes('ai') || originalText.toLowerCase().includes('tool')) {
      suggestions.push("💡 Add impact: What specific results does this deliver? (e.g., 'saves 2 hours daily')")
    } else {
      suggestions.push("💡 Add specifics: What exactly does this do or achieve?")
    }
  }

  // Special suggestions based on content type
  if (contentType === 'personal-announcement' && personality > 40 && context > 40) {
    suggestions.push("✨ Consider adding: Your target audience or who this helps most")
  }

  // If no major issues, provide enhancement tips
  if (suggestions.length === 0 && context < 70) {
    suggestions.push("✨ Optional: Add a specific example or use case to make it even more engaging")
  }

  return suggestions.slice(0, 2) // Max 2 suggestions to avoid overwhelming
}

/**
 * Gets the primary smart prompt based on analysis
 */
export function getPrimarySmartPrompt(analysis: InputAnalysis): SmartPrompt | null {
  if (analysis.suggestions.length === 0) {
    return {
      icon: '🎯',
      message: 'Perfect! Ready to generate high-quality content',
      priority: 'low'
    }
  }

  const firstSuggestion = analysis.suggestions[0]
  
  if (firstSuggestion.includes('personal')) {
    return {
      icon: '👤',
      message: 'Make it personal for better engagement',
      example: '"I\'m launching..." or "We\'re excited to..."',
      priority: 'high'
    }
  }
  
  if (firstSuggestion.includes('motivation') || firstSuggestion.includes('context')) {
    return {
      icon: '💭',
      message: 'Add your why or background story',
      example: '"After seeing professionals struggle with..." or "I built this because..."',
      priority: 'high'
    }
  }
  
  if (firstSuggestion.includes('impact') || firstSuggestion.includes('specifics')) {
    return {
      icon: '🎯',
      message: 'Add specific benefits or results',
      example: '"Saves 2 hours daily" or "Creates posts in 15 seconds"',
      priority: 'medium'
    }
  }

  return {
    icon: '💡',
    message: firstSuggestion.replace(/💡\s*/, ''),
    priority: 'medium'
  }
}

/**
 * Gets quality level description for UI
 */
export function getQualityDescription(score: number): { text: string; color: string; emoji: string } {
  if (score >= 80) {
    return { text: 'Excellent - Ready for amazing content!', color: 'green', emoji: '🎯' }
  } else if (score >= 60) {
    return { text: 'Good - Will generate quality content', color: 'blue', emoji: '👍' }
  } else if (score >= 40) {
    return { text: 'Decent - Consider adding more details', color: 'yellow', emoji: '💡' }
  } else {
    return { text: 'Needs improvement - Add more context', color: 'orange', emoji: '⚠️' }
  }
}

/**
 * Example inputs for testing
 */
export const EXAMPLE_INPUTS = {
  poor: "AI tool for content",
  decent: "I'm launching an AI tool for creating content",
  good: "I'm launching StoryScale, an AI tool that helps create LinkedIn content",
  excellent: "I'm excited to launch StoryScale after seeing how professionals struggle with creating consistent LinkedIn content. It's an AI-powered studio that generates professional posts, blogs, and marketing copy in under 15 seconds."
}