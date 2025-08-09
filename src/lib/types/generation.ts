/**
 * Content Generation Types for StoryScale
 */

export interface ContentGenerationRequest {
  contentType: string
  topic: string
  audience?: string
  tone?: string
  language?: string
  culturalContext?: any
  keywords?: string[]
  wordCount?: number
  seoRequirements?: any
}

export interface ContentGenerationResponse {
  content: string
  metadata: {
    model: string
    tokens: number
    processingTime: number
    language: string
    culturalAdaptation: boolean
  }
  success: boolean
}

export interface GenerationMetrics {
  totalRequests: number
  averageTime: number
  successRate: number
  costPerRequest: number
}