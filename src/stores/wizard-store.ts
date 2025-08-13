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

  // Utility
  applySmartDefaults: () => void
  getCompletionPercentage: () => number
  isStepCompleted: (step: number) => boolean
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
    format: ''
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

        // Step 1 Actions
        setContentDescription: (description) =>
          set((state) => ({
            data: {
              ...state.data,
              step1: { ...state.data.step1, description }
            }
          })),

        setContentPurpose: (purpose) =>
          set((state) => ({
            data: {
              ...state.data,
              step1: { ...state.data.step1, purpose }
            }
          })),

        setContentGoal: (goal) =>
          set((state) => ({
            data: {
              ...state.data,
              step1: { ...state.data.step1, goal }
            }
          })),

        setContentUrl: (url) =>
          set((state) => ({
            data: {
              ...state.data,
              step1: { ...state.data.step1, url }
            }
          })),

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
          
          // Validate all steps
          for (let i = 1; i <= 4; i++) {
            const validation = state.validateStep(i)
            if (!validation.isValid) {
              set({ error: `Step ${i} validation failed: ${validation.errors.join(', ')}` })
              return
            }
          }

          set({ isGenerating: true, error: null })

          // Map wizard values to API-expected values
          const mapPurposeToAPI = (purpose: string): string => {
            const mapping: Record<string, string> = {
              'share-insights': 'thought-leadership',
              'announce-news': 'value',
              'ask-question': 'question',
              'share-story': 'value',
              'promote-content': 'authority'
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
            const response = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'linkedin-post',
                content: state.data.step1.description,
                purpose: mapPurposeToAPI(state.data.step1.purpose),
                goal: state.data.step1.goal,
                targetAudience: state.data.step2.audience,
                tone: state.data.step2.tone,
                format: mapFormatToAPI(state.data.step2.format),
                language: state.data.step3.language,
                enableResearch: state.data.step3.enableResearch,
                researchDepth: state.data.step3.researchDepth,
                callToAction: state.data.step4.callToAction,
                url: state.data.step1.url
              })
            })

            if (!response.ok) {
              throw new Error(`Generation failed: ${response.statusText}`)
            }

            const result = await response.json()
            
            set({
              generatedContent: {
                id: result.id,
                content: result.content,
                language: state.data.step3.language,
                metadata: {
                  generatedAt: new Date(result.generatedAt),
                  modelUsed: result.modelUsed,
                  tokensUsed: result.tokensUsed,
                  processingTime: result.processingTime,
                  researchSources: result.researchSources
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
        }
      }),
      {
        name: 'wizard-storage',
        partialize: (state) => ({
          data: state.data,
          metadata: state.metadata,
          smartDefaults: state.smartDefaults
        })
      }
    )
  )
)