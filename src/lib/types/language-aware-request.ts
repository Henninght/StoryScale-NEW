/**
 * Language-aware request/response interfaces for StoryScale
 * Extends base interfaces with multi-language support
 */

// Supported languages
export type SupportedLanguage = 'en' | 'no';

// Cultural context for Norwegian business adaptation
export interface CulturalContext {
  market: 'norway' | 'nordic' | 'international';
  businessType?: 'b2b' | 'b2c' | 'government';
  industry?: string;
  dialectPreference?: 'bokmål' | 'nynorsk'; // Norwegian written forms
  formalityLevel?: 'formal' | 'neutral' | 'casual';
  localReferences?: boolean; // Include Norwegian-specific references
}

// Base content request interface
export interface BaseContentRequest {
  id: string;
  type: 'article' | 'social' | 'email' | 'landing' | 'ad' | 'blog';
  topic: string;
  keywords?: string[];
  tone?: 'professional' | 'casual' | 'persuasive' | 'informative';
  targetAudience?: string;
  wordCount?: number;
  timestamp: Date;
}

// Extended language-aware content request
export interface LanguageAwareContentRequest extends BaseContentRequest {
  inputLanguage?: SupportedLanguage; // Detected or specified input language
  outputLanguage: SupportedLanguage; // Required output language
  culturalContext?: CulturalContext; // Norwegian business adaptation
  requiresTranslation?: boolean; // If input and output languages differ
  enableResearch?: boolean; // Enable web research for content enrichment
  glossary?: Record<string, string>; // Domain-specific translations
  seoRequirements?: {
    primaryKeyword: string;
    secondaryKeywords?: string[];
    metaDescription?: string;
    targetRegion: 'norway' | 'nordic' | 'global';
  };
  
  // LinkedIn-specific fields
  purpose?: string; // Content purpose (share-insights, offer-value, etc.)
  goal?: string; // Content goal (increase-engagement, build-authority, etc.)
  format?: string; // Content format (story, news, list, etc.)
  postLength?: 'short' | 'medium' | 'long'; // Post length preference
  callToAction?: string; // Optional call-to-action
  url?: string; // Optional URL to reference
  aiProvider?: string; // AI provider preference
}

// Request classification for routing decisions
export interface RequestClassification {
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTokens: number;
  requiredCapabilities: string[];
  suggestedModel: 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5' | 'gpt-4o' | 'claude' | 'specialized';
  languageRequirements: {
    inputLang: SupportedLanguage;
    outputLang: SupportedLanguage;
    requiresNativeGeneration: boolean; // Direct generation vs translation
    requiresCulturalAdaptation: boolean;
  };
  priority: 'low' | 'medium' | 'high';
  estimatedProcessingTime: number; // in milliseconds
}

// Response metadata with language tracking
export interface LanguageAwareResponse {
  requestId: string;
  content: string;
  metadata: {
    generatedLanguage: SupportedLanguage;
    wasTranslated: boolean;
    translationQuality?: 'native' | 'translated' | 'adapted';
    culturalAdaptations?: string[]; // List of adaptations made
    processingTime: number;
    tokenUsage: {
      prompt: number;
      completion: number;
      total: number;
    };
    model: string;
    cost: number;
    cacheHit: boolean;
    fallbackUsed?: boolean; // If Norwegian failed and fell back to English
  };
  alternatives?: {
    language: SupportedLanguage;
    content: string;
    confidence: number;
  }[];
  errors?: Array<{
    code: string;
    message: string;
    severity: 'warning' | 'error';
  }>;
}

// Cache entry structure
export interface CacheEntry {
  key: string;
  request: LanguageAwareContentRequest;
  response: LanguageAwareResponse;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  language: SupportedLanguage;
  tags: string[]; // For cache invalidation
}

// Cost tracking structure
export interface LanguageSpecificMetrics {
  language: SupportedLanguage;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  translationCount: number;
  fallbackCount: number;
  errorRate: number;
}

// Gateway configuration
export interface GatewayConfig {
  defaultLanguage: SupportedLanguage;
  enableAutoDetection: boolean;
  enableFallback: boolean;
  cacheEnabled: boolean;
  cacheTTL: number; // in seconds
  maxRetries: number;
  timeout: number; // in milliseconds
  costThresholds: {
    warning: number;
    critical: number;
  };
  languageModels: {
    en: string[];
    no: string[];
  };
  culturalDefaults: {
    no: CulturalContext;
  };
}

// Error types
export enum GatewayErrorCode {
  LANGUAGE_DETECTION_FAILED = 'LANG_DETECT_FAIL',
  UNSUPPORTED_LANGUAGE = 'LANG_UNSUPPORTED',
  TRANSLATION_FAILED = 'TRANS_FAIL',
  ROUTING_FAILED = 'ROUTE_FAIL',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAIL',
  CACHE_ERROR = 'CACHE_ERR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  COST_THRESHOLD_EXCEEDED = 'COST_EXCEED',
}

export class GatewayError extends Error {
  constructor(
    public code: GatewayErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

// Route decision structure
export interface RouteDecision {
  targetModel: string;
  targetEndpoint: string;
  requiresPreprocessing: boolean;
  preprocessingSteps?: Array<{
    type: 'translate' | 'adapt' | 'enhance';
    config: any;
  }>;
  requiresPostprocessing: boolean;
  postprocessingSteps?: Array<{
    type: 'translate' | 'validate' | 'format';
    config: any;
  }>;
  estimatedCost: number;
  estimatedTime: number;
  fallbackRoute?: RouteDecision;
}