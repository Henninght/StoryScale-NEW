/**
 * LinkedIn Post Creator Wizard Types
 * Defines all interfaces for the 4-step wizard flow
 */

import { SupportedLanguage } from './language';

// Step 1: Content & Purpose
export interface ContentPurposeData {
  description: string;
  purpose: ContentPurpose | '';
  goal: ContentGoal | '';
  url?: string;
}

export type ContentPurpose = 
  | 'share-insights'
  | 'announce-news'
  | 'ask-question'
  | 'share-story'
  | 'promote-content';

export type ContentGoal = 
  | 'increase-engagement'
  | 'generate-leads'
  | 'build-authority'
  | 'drive-traffic'
  | 'start-discussion';

// Step 2: Audience & Style
export interface AudienceStyleData {
  audience: TargetAudience | '';
  tone: ContentTone | '';
  format: ContentFormat | '';
}

export type TargetAudience = 
  | 'professionals'
  | 'executives'
  | 'entrepreneurs'
  | 'general-business';

export type ContentTone = 
  | 'professional'
  | 'friendly'
  | 'authoritative'
  | 'casual';

export type ContentFormat = 
  | 'story'
  | 'news'
  | 'list'
  | 'tips'
  | 'insight'
  | 'modern';

// Step 3: Research & Enhancement
export interface ResearchEnhancementData {
  language: SupportedLanguage;
  enableResearch: boolean;
  researchDepth?: 'light' | 'balanced' | 'deep';
}

// Step 4: Summary & Action
export interface SummaryActionData {
  callToAction?: string;
  confirmed: boolean;
}

// Complete Wizard Data
export interface WizardData {
  step1: ContentPurposeData;
  step2: AudienceStyleData;
  step3: ResearchEnhancementData;
  step4: SummaryActionData;
}

// Wizard Metadata
export interface WizardMetadata {
  currentStep: 1 | 2 | 3 | 4;
  completedSteps: number[];
  startedAt: Date;
  lastSavedAt?: Date;
  sessionId: string;
}

// Validation
export interface StepValidation {
  isValid: boolean;
  errors: string[];
  canAutoAdvance: boolean;
}

// Smart Defaults
export interface SmartDefaults {
  purpose: ContentPurpose;
  goal: ContentGoal;
  audience: TargetAudience;
  tone: ContentTone;
  format: ContentFormat;
  language: SupportedLanguage;
  enableResearch: boolean;
}

// Generated Content Response
export interface GeneratedContent {
  id: string;
  content: string;
  language: SupportedLanguage;
  metadata: {
    generatedAt: Date;
    modelUsed: string;
    tokensUsed: number;
    processingTime: number;
    researchSources?: string[];
  };
}