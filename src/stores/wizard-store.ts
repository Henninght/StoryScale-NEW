/**
 * Wizard State Management Store
 * Manages state for the 4-step LinkedIn post creation wizard
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  WizardData,
  WizardMetadata,
  ContentPurpose,
  ContentGoal,
  TargetAudience,
  ContentTone,
  ContentFormat,
  PostLength,
  SmartDefaults,
  StepValidation,
  GeneratedContent
} from '@/types/wizard'
import { SupportedLanguage } from '@/lib/types/language'

interface WizardState {
  // Data
  data: WizardData
  metadata: WizardMetadata
  smartDefaults: SmartDefaults
  generatedContent: GeneratedContent | null
  isGenerating: boolean
  error: string | null

  // Actions - Step 1
  setContentDescription: (description: string) => void
  setContentPurpose: (purpose: ContentPurpose | '') => void
  setContentGoal: (goal: ContentGoal | '') => void
  setContentUrl: (url?: string) => void

  // Actions - Step 2
  setTargetAudience: (audience: TargetAudience | '') => void
  setContentTone: (tone: ContentTone | '') => void
  setContentFormat: (format: ContentFormat | '') => void
  setPostLength: (postLength: PostLength | '') => void

  // Actions - Step 3
  setLanguage: (language: SupportedLanguage) => void
  setEnableResearch: (enable: boolean) => void
  setResearchDepth: (depth: 'light' | 'balanced' | 'deep') => void

  // Actions - Step 4
  setCallToAction: (cta?: string) => void
  confirmGeneration: () => void

  // Navigation
  goToStep: (step: 1 | 2 | 3 | 4) => void
  nextStep: () => void
  previousStep: () => void
  canAdvanceToStep: (step: number) => boolean

  // Validation
  validateCurrentStep: () => StepValidation
  validateStep: (step: number) => StepValidation

  // Wizard lifecycle
  initializeWizard: () => void
  resetWizard: () => void
  generateContent: () => Promise<void>
  saveProgress: () => void
  loadProgress: (sessionId: string) => void
  loadFromSettings: (settings: any) => void

  // Utility
  applySmartDefaults: () => void
  getCompletionPercentage: () => number
  isStepCompleted: (step: number) => boolean
  validateStateIntegrity: () => boolean
  debugStateConsistency: () => void
}

// Initial state factory
const createInitialData = (): WizardData => ({
  step1: {
    description: '',
    purpose: '',
    goal: '',
    url: undefined
  },
  step2: {
    audience: '',
    tone: '',
    format: '',
    postLength: ''
  },
  step3: {
    language: 'en',
    enableResearch: false,
    researchDepth: 'balanced'
  },
  step4: {
    callToAction: undefined,
    confirmed: false
  }
})

const createInitialMetadata = (): WizardMetadata => ({
  currentStep: 1,
  completedSteps: [],
  startedAt: new Date(),
  lastSavedAt: undefined,
  sessionId: `wizard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
})

const createSmartDefaults = (): SmartDefaults => ({
  purpose: 'share-insights',
  goal: 'increase-engagement',
  audience: 'professionals',
  tone: 'professional',
  format: 'modern',
  postLength: 'medium',
  language: 'en',
  enableResearch: false
})

export const useWizardStore = create<WizardState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        data: createInitialData(),
        metadata: createInitialMetadata(),
        smartDefaults: createSmartDefaults(),
        generatedContent: null,
        isGenerating: false,
        error: null,

        // Step 1 Actions - Improved state isolation and atomic updates
        setContentDescription: (description) =>
          set((state) => {
            console.log('🔄 Store: Setting description:', description)
            return {
              ...state,
              data: {
                ...state.data,
                step1: { ...state.data.step1, description }
              },
              error: null // Clear any previous errors
            }
          }),

        setContentPurpose: (purpose) =>
          set((state) => {
            console.log('🔄 Store: Setting purpose:', purpose, 'Current goal:', state.data.step1.goal)
            return {
              ...state,
              data: {
                ...state.data,
                step1: { ...state.data.step1, purpose }
              },
              error: null
            }
          }),

        setContentGoal: (goal) =>
          set((state) => {
            console.log('🔄 Store: Setting goal:', goal, 'Current purpose:', state.data.step1.purpose)
            return {
              ...state,
              data: {
                ...state.data,
                step1: { ...state.data.step1, goal }
              },
              error: null
            }
          }),

        setContentUrl: (url) =>
          set((state) => {
            console.log('🔄 Store: Setting URL:', url)
            return {
              ...state,
              data: {
                ...state.data,
                step1: { ...state.data.step1, url }
              },
              error: null
            }
          }),

        // Step 2 Actions
        setTargetAudience: (audience) =>
          set((state) => ({
            data: {
              ...state.data,
              step2: { ...state.data.step2, audience }
            }
          })),

        setContentTone: (tone) =>
          set((state) => ({
            data: {
              ...state.data,
              step2: { ...state.data.step2, tone }
            }
          })),

        setContentFormat: (format) =>
          set((state) => ({
            data: {
              ...state.data,
              step2: { ...state.data.step2, format }
            }
          })),

        setPostLength: (postLength) =>
          set((state) => ({
            data: {
              ...state.data,
              step2: { ...state.data.step2, postLength }
            }
          })),

        // Step 3 Actions
        setLanguage: (language) =>
          set((state) => ({
            data: {
              ...state.data,
              step3: { ...state.data.step3, language }
            }
          })),

        setEnableResearch: (enable) =>
          set((state) => ({
            data: {
              ...state.data,
              step3: { ...state.data.step3, enableResearch: enable }
            }
          })),

        setResearchDepth: (depth) =>
          set((state) => ({
            data: {
              ...state.data,
              step3: { ...state.data.step3, researchDepth: depth }
            }
          })),

        // Step 4 Actions
        setCallToAction: (cta) =>
          set((state) => ({
            data: {
              ...state.data,
              step4: { ...state.data.step4, callToAction: cta }
            }
          })),

        confirmGeneration: () =>
          set((state) => ({
            data: {
              ...state.data,
              step4: { ...state.data.step4, confirmed: true }
            }
          })),

        // Navigation
        goToStep: (step) =>
          set((state) => {
            const validation = get().validateStep(state.metadata.currentStep)
            if (validation.isValid && !state.metadata.completedSteps.includes(state.metadata.currentStep)) {
              state.metadata.completedSteps.push(state.metadata.currentStep)
            }
            return {
              metadata: {
                ...state.metadata,
                currentStep: step,
                completedSteps: [...new Set(state.metadata.completedSteps)]
              }
            }
          }),

        nextStep: () => {
          const state = get()
          const validation = state.validateCurrentStep()
          if (validation.isValid && state.metadata.currentStep < 4) {
            state.goToStep((state.metadata.currentStep + 1) as 1 | 2 | 3 | 4)
          }
        },

        previousStep: () => {
          const state = get()
          if (state.metadata.currentStep > 1) {
            state.goToStep((state.metadata.currentStep - 1) as 1 | 2 | 3 | 4)
          }
        },

        canAdvanceToStep: (step) => {
          const state = get()
          if (step === 1) return true
          if (step > 4) return false
          
          // Check if all previous steps are completed
          for (let i = 1; i < step; i++) {
            if (!state.isStepCompleted(i)) return false
          }
          return true
        },

        // Validation
        validateCurrentStep: () => {
          const state = get()
          return state.validateStep(state.metadata.currentStep)
        },

        validateStep: (step) => {
          const state = get()
          const errors: string[] = []
          let canAutoAdvance = false

          switch (step) {
            case 1:
              if (!state.data.step1.description.trim()) {
                errors.push('Please provide a description of your content')
              }
              if (!state.data.step1.purpose) {
                errors.push('Please select a content purpose')
              }
              if (!state.data.step1.goal) {
                errors.push('Please select a content goal')
              }
              canAutoAdvance = errors.length === 0 && 
                            state.data.step1.description.length > 20
              break

            case 2:
              if (!state.data.step2.audience) {
                errors.push('Please select your target audience')
              }
              if (!state.data.step2.tone) {
                errors.push('Please select a content tone')
              }
              if (!state.data.step2.format) {
                errors.push('Please select a content format')
              }
              if (!state.data.step2.postLength) {
                errors.push('Please select a post length')
              }
              canAutoAdvance = errors.length === 0
              break

            case 3:
              // Step 3 has defaults, always valid
              canAutoAdvance = true
              break

            case 4:
              if (!state.data.step4.confirmed) {
                errors.push('Please confirm to generate content')
              }
              break
          }

          return {
            isValid: errors.length === 0,
            errors,
            canAutoAdvance
          }
        },

        // Wizard lifecycle
        initializeWizard: () =>
          set({
            data: createInitialData(),
            metadata: createInitialMetadata(),
            generatedContent: null,
            isGenerating: false,
            error: null
          }),

        resetWizard: () => {
          get().initializeWizard()
        },

        generateContent: async () => {
          const state = get()
          
          console.log('🎯 Wizard Store: Starting content generation')
          console.log('🎯 Wizard Store: Current data:', JSON.stringify(state.data, null, 2))
          
          // Migration: Add default postLength if missing
          if (!state.data.step2.postLength) {
            console.log('🔄 Wizard Store: Adding default postLength for migration')
            state.setPostLength('medium')
          }
          
          // Validate all steps
          for (let i = 1; i <= 4; i++) {
            const validation = state.validateStep(i)
            console.log(`🎯 Wizard Store: Step ${i} validation:`, validation)
            if (!validation.isValid) {
              console.log(`❌ Wizard Store: Step ${i} validation failed:`, validation.errors)
              set({ error: `Step ${i} validation failed: ${validation.errors.join(', ')}` })
              return
            }
          }

          set({ isGenerating: true, error: null })
          console.log('🎯 Wizard Store: Starting API call...')
          
          // Track generation start time
          const startTime = Date.now()

          // Map wizard values to API-expected values with lead generation intelligence
          const mapPurposeToAPI = (purpose: string, goal: string): string => {
            // Lead generation overrides based on purpose combination
            if (goal === 'generate-leads') {
              const leadGenMapping: Record<string, string> = {
                'share-insights': 'lead-generation',      // Direct lead capture
                'offer-value': 'lead-magnet',             // Value exchange approach
                'ask-question': 'lead-qualification',     // Qualify through questions
                'share-story': 'lead-nurture',           // Nurture through storytelling
                'provide-solutions': 'lead-generation',   // Solution-based lead capture
                'celebrate-success': 'lead-nurture'      // Soft sell through success
              }
              return leadGenMapping[purpose] || 'lead-generation'
            }

            // Original mapping for non-lead-gen goals
            const mapping: Record<string, string> = {
              'share-insights': 'thought-leadership',
              'offer-value': 'value',                    // Value exchange as value content
              'ask-question': 'question',
              'share-story': 'value',
              'provide-solutions': 'thought-leadership', // Solutions as thought leadership
              'celebrate-success': 'value'               // Success stories as value
            }
            return mapping[purpose] || purpose
          }

          const mapFormatToAPI = (format: string): string => {
            const mapping: Record<string, string> = {
              'modern': 'insight',
              'news': 'story',
              'tips': 'howto'
              // 'story', 'list', 'insight' remain unchanged
            }
            return mapping[format] || format
          }

          try {
            // Call the generate API endpoint with mapped values
            const requestBody = {
              type: 'linkedin-post',
              content: state.data.step1.description,
              purpose: mapPurposeToAPI(state.data.step1.purpose, state.data.step1.goal),
              goal: state.data.step1.goal,
              targetAudience: state.data.step2.audience,
              tone: state.data.step2.tone,
              format: mapFormatToAPI(state.data.step2.format),
              postLength: state.data.step2.postLength,
              language: state.data.step3.language,
              enableResearch: state.data.step3.enableResearch,
              researchDepth: state.data.step3.researchDepth,
              callToAction: state.data.step4.callToAction,
              url: state.data.step1.url
            }
            
            console.log('🎯 Wizard Store: API Request Body:', JSON.stringify(requestBody, null, 2))
            
            const response = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            })

            console.log('🎯 Wizard Store: API Response Status:', response.status)
            console.log('🎯 Wizard Store: API Response OK:', response.ok)

            if (!response.ok) {
              let errorMessage = `Generation failed: ${response.status} ${response.statusText}`
              
              try {
                const errorData = await response.json()
                console.log('❌ Wizard Store: API Error Response:', errorData)
                
                if (errorData.error) {
                  errorMessage = errorData.error
                  
                  // Handle specific error types with user-friendly messages
                  if (errorData.error.includes('CORS')) {
                    errorMessage = 'Network connection issue. Please refresh the page and try again.'
                  } else if (errorData.error.includes('Validation failed')) {
                    errorMessage = 'Invalid input data. Please check your selections and try again.'
                  } else if (errorData.error.includes('Rate limit')) {
                    errorMessage = 'Too many requests. Please wait a moment and try again.'
                  }
                }
              } catch (e) {
                // If JSON parsing fails, use text response
                const errorText = await response.text()
                console.log('❌ Wizard Store: Non-JSON Error Response:', errorText)
                
                if (errorText.includes('404') || errorText.includes('Not Found')) {
                  errorMessage = 'Content generation service unavailable. Please try again later.'
                } else if (errorText.includes('403') || errorText.includes('Forbidden')) {
                  errorMessage = 'Access denied. Please refresh the page and try again.'
                }
              }
              
              throw new Error(errorMessage)
            }

            const result = await response.json()
            console.log('🎯 Wizard Store: API Response Result:', JSON.stringify(result, null, 2))
            const endTime = Date.now()
            const totalTime = endTime - startTime
            
            // Calculate content statistics
            const content = result.content || ''
            const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
            const characterCount = content.length
            const hashtagCount = (content.match(/#\w+/g) || []).length
            
            set({
              generatedContent: {
                id: result.id || `gen_${Date.now()}`,
                content: result.content,
                language: state.data.step3.language,
                metadata: {
                  generatedAt: new Date(result.generatedAt || new Date().toISOString()),
                  modelUsed: result.modelUsed || 'claude-3-5-sonnet-20241022',
                  tokensUsed: result.tokensUsed || 0,
                  processingTime: result.processingTime || totalTime,
                  researchSources: result.researchSources || [],
                  wordCount,
                  characterCount,
                  hashtagCount,
                  qualityScore: result.quality_score
                }
              },
              isGenerating: false
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Content generation failed',
              isGenerating: false
            })
          }
        },

        saveProgress: () => {
          const state = get()
          set((s) => ({
            metadata: {
              ...s.metadata,
              lastSavedAt: new Date()
            }
          }))
          // Progress is automatically saved via persist middleware
        },

        loadProgress: (sessionId) => {
          // Implementation would load from persisted storage
          // The persist middleware handles this automatically
        },

        // Utility
        applySmartDefaults: () => {
          const state = get()
          set({
            data: {
              step1: {
                ...state.data.step1,
                purpose: state.data.step1.purpose || state.smartDefaults.purpose,
                goal: state.data.step1.goal || state.smartDefaults.goal
              },
              step2: {
                ...state.data.step2,
                audience: state.data.step2.audience || state.smartDefaults.audience,
                tone: state.data.step2.tone || state.smartDefaults.tone,
                format: state.data.step2.format || state.smartDefaults.format
              },
              step3: {
                ...state.data.step3,
                language: state.data.step3.language || state.smartDefaults.language,
                enableResearch: state.data.step3.enableResearch ?? state.smartDefaults.enableResearch
              },
              step4: state.data.step4
            }
          })
        },

        getCompletionPercentage: () => {
          const state = get()
          const totalSteps = 4
          const completedSteps = state.metadata.completedSteps.length
          
          // Add partial credit for current step
          const currentStepValidation = state.validateCurrentStep()
          const currentStepProgress = currentStepValidation.isValid ? 1 : 0.5
          
          const progress = completedSteps + 
                         (state.metadata.completedSteps.includes(state.metadata.currentStep) ? 0 : currentStepProgress)
          
          return Math.round((progress / totalSteps) * 100)
        },

        isStepCompleted: (step) => {
          const state = get()
          return state.metadata.completedSteps.includes(step)
        },

        // State integrity validation
        validateStateIntegrity: () => {
          const state = get()
          
          // Check for null/undefined values in required fields
          const hasValidStep1 = typeof state.data.step1.purpose === 'string' && 
                               typeof state.data.step1.goal === 'string'
          
          // Check that selections are independent
          const purposeGoalIndependence = state.data.step1.purpose !== state.data.step1.goal
          
          console.log('🔍 State integrity check:', {
            hasValidStep1,
            purposeGoalIndependence,
            currentPurpose: state.data.step1.purpose,
            currentGoal: state.data.step1.goal
          })
          
          return hasValidStep1 && purposeGoalIndependence
        },

        debugStateConsistency: () => {
          const state = get()
          console.log('🐛 Debug State Consistency:', {
            step1: state.data.step1,
            metadata: state.metadata,
            isGenerating: state.isGenerating,
            error: state.error,
            generatedContent: state.generatedContent ? 'exists' : 'null'
          })
        },

        loadFromSettings: (settings) => {
          console.log('🔄 Loading wizard from saved settings:', settings)
          
          set((state) => {
            const newData = { ...state.data }
            
            // Map saved settings to wizard data structure
            if (settings.purpose) {
              newData.step1.purpose = settings.purpose
            }
            if (settings.goal) {
              newData.step1.goal = settings.goal
            }
            if (settings.description) {
              newData.step1.description = settings.description
            }
            if (settings.audience) {
              newData.step2.audience = settings.audience
            }
            if (settings.tone) {
              newData.step2.tone = settings.tone
            }
            if (settings.format) {
              newData.step2.format = settings.format
            }
            if (settings.length) {
              newData.step2.postLength = settings.length
            }
            if (settings.outputLanguage) {
              newData.step3.language = settings.outputLanguage
            }
            if (settings.enableResearch !== undefined) {
              newData.step3.enableResearch = settings.enableResearch
            }
            
            console.log('🔄 Applied settings to wizard data:', newData)
            
            return {
              ...state,
              data: newData,
              error: null,
              generatedContent: null // Clear any existing generated content
            }
          })
        }
      }),
      {
        name: 'wizard-storage',
        partialize: (state) => ({
          data: state.data,
          metadata: state.metadata,
          smartDefaults: state.smartDefaults
        }),
        skipHydration: false, // Enable hydration to prevent client/server mismatch
        version: 1, // Add version to handle schema changes
        migrate: (persistedState: any, version: number) => {
          // Handle migration from old state format if needed
          return persistedState
        }
      }
    )
  )
)