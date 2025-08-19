/**
 * Brand Voice Types - Type definitions for brand voice training and application
 */

export interface VoiceCharacteristics {
  tone: VoiceTone
  formality: VoiceFormality
  perspective: VoicePerspective
  emotionalRange: EmotionalRange
  vocabularyLevel: VocabularyLevel
  sentenceStructure: SentenceStructure
  contentPatterns: ContentPatterns
}

export type VoiceTone = 
  | 'professional' 
  | 'friendly' 
  | 'authoritative' 
  | 'conversational'
  | 'inspiring'
  | 'analytical'
  | 'empathetic'
  | 'confident'

export type VoiceFormality = 
  | 'formal' 
  | 'semi-formal' 
  | 'casual' 
  | 'conversational'

export type VoicePerspective = 
  | 'first-person' 
  | 'second-person' 
  | 'third-person' 
  | 'mixed'

export interface EmotionalRange {
  primary: string[]  // e.g., ['optimistic', 'determined', 'thoughtful']
  intensity: 'low' | 'medium' | 'high'
  variability: 'consistent' | 'moderate' | 'dynamic'
}

export interface VocabularyLevel {
  complexity: 'simple' | 'moderate' | 'advanced' | 'expert'
  industryTerms: string[]
  commonPhrases: string[]
  avoidedWords: string[]
}

export interface SentenceStructure {
  averageLength: number
  variability: 'low' | 'medium' | 'high'
  preferredStructures: string[]  // e.g., ['compound', 'simple', 'complex']
  punctuationStyle: PunctuationStyle
}

export interface PunctuationStyle {
  exclamationUsage: 'rare' | 'moderate' | 'frequent'
  questionUsage: 'rare' | 'moderate' | 'frequent'
  ellipsisUsage: 'rare' | 'moderate' | 'frequent'
  emojisUsage: 'none' | 'minimal' | 'moderate' | 'frequent'
}

export interface ContentPatterns {
  openingStyle: string[]  // Common ways to start posts
  closingStyle: string[]  // Common ways to end posts
  transitionPhrases: string[]
  storytellingElements: boolean
  dataUsage: 'minimal' | 'moderate' | 'heavy'
  personalAnecdotes: 'rare' | 'occasional' | 'frequent'
}

// Brand Voice Profile
export interface BrandVoiceProfile {
  id: string
  name: string
  description?: string
  characteristics: VoiceCharacteristics
  trainingData: TrainingData
  confidence: number  // 0-1 scale of how confident we are in the voice analysis
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface TrainingData {
  sources: ContentSource[]
  totalWords: number
  totalPosts: number
  analysisVersion: string
  lastAnalyzed: Date
}

export interface ContentSource {
  id: string
  type: 'linkedin' | 'twitter' | 'blog' | 'email' | 'other'
  content: string
  metadata?: {
    platform?: string
    date?: Date
    engagement?: {
      likes?: number
      comments?: number
      shares?: number
    }
  }
}

// Voice Analysis Results
export interface VoiceAnalysis {
  overallScore: number
  characteristics: VoiceCharacteristics
  keyPhrases: string[]
  writingPatterns: WritingPattern[]
  recommendations: string[]
  confidence: {
    tone: number
    style: number
    vocabulary: number
    structure: number
  }
}

export interface WritingPattern {
  pattern: string
  frequency: number
  examples: string[]
  importance: 'low' | 'medium' | 'high'
}

// Voice Training Interface
export interface VoiceTrainingStep {
  id: string
  title: string
  description: string
  isCompleted: boolean
  isActive: boolean
  data?: any
}

export interface VoiceTrainingSession {
  id: string
  profileId: string
  steps: VoiceTrainingStep[]
  currentStep: number
  startedAt: Date
  completedAt?: Date
  status: 'active' | 'completed' | 'paused'
}

// Content Generation with Voice
export interface VoiceGenerationRequest {
  prompt: string
  voiceProfileId: string
  contentType: 'linkedin' | 'twitter' | 'blog' | 'email'
  targetLength?: number
  additionalInstructions?: string
}

export interface VoiceGenerationResult {
  content: string
  voiceAlignment: number  // 0-1 score of how well it matches the voice
  appliedCharacteristics: string[]
  suggestions?: string[]
}

// Voice Comparison & Refinement
export interface VoiceComparison {
  originalContent: string
  generatedContent: string
  alignment: {
    tone: number
    vocabulary: number
    structure: number
    overall: number
  }
  differences: string[]
  improvements: string[]
}

export interface VoiceFeedback {
  contentId: string
  voiceProfileId: string
  rating: 1 | 2 | 3 | 4 | 5
  feedback: string
  suggestions?: string[]
  createdAt: Date
}