/**
 * Content Gateway Types
 * Core type definitions for the content generation gateway
 */

import { SupportedLanguage, CulturalContext } from '../types/language-aware-request';

/**
 * Base request interface for language-aware content generation
 */
export interface LanguageAwareRequest {
  id: string;
  content: string;
  outputLanguage: SupportedLanguage;
  inputLanguage?: SupportedLanguage;
  culturalContext?: CulturalContext;
  enableResearch?: boolean;
  timestamp: Date;
}

/**
 * Response interface for language-aware content generation
 */
export interface LanguageAwareResponse {
  content: string;
  metadata: {
    language: SupportedLanguage;
    model: string;
    tokens: number;
    cost: number;
    processingTime: number;
    cacheHit: boolean;
    researchSources?: string[];
    culturalAdaptations?: string[];
  };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  score?: number;
}

/**
 * Request classification for routing decisions
 */
export interface RequestClassification {
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTokens: number;
  requiredCapabilities: string[];
  suggestedModels: string[];
  requiresTranslation: boolean;
  requiresCulturalAdaptation: boolean;
}

/**
 * Route decision interface
 */
export interface RouteDecision {
  primaryRoute: string;
  fallbackRoute?: string;
  model: string;
  provider: string;
  estimatedCost: number;
  estimatedTime: number;
}

export type { SupportedLanguage, CulturalContext };