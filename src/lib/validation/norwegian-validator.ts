/**
 * Norwegian Quality Validation Orchestrator
 * Main validation system that coordinates all quality checks for Norwegian content
 */

import { GrammarChecker, GrammarValidationResult } from './grammar-checker';
import { CulturalValidator, CulturalValidationResult } from './cultural-validator';
import { BusinessValidator, BusinessValidationResult } from './business-validator';
import { ReadabilityAnalyzer, ReadabilityResult } from './readability-analyzer';
import { ValidationRules } from './validation-rules';
import { MultiLayerCache } from '../cache/multi-layer-cache';
import { CostGuardian } from '../monitoring/cost-guardian';
import { QualityAssessment } from '../generation/quality-scorer';

/**
 * Comprehensive validation request
 */
export interface ValidationRequest {
  content: string;
  contentType: 'blogPost' | 'socialMedia' | 'email' | 'websiteCopy' | 'caseStudy' | 'pressRelease';
  audience: string;
  industry?: string;
  company?: string;
  tone?: 'professional' | 'casual' | 'authoritative' | 'friendly';
  dialect?: 'bokmål' | 'nynorsk';
  strictness?: 'strict' | 'moderate' | 'relaxed';
  realtime?: boolean;
  provideSuggestions?: boolean;
}

/**
 * Complete validation response
 */
export interface ValidationResponse {
  id: string;
  timestamp: Date;
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  readinessLevel: 'ready' | 'needs_review' | 'needs_revision' | 'rejected';
  validations: {
    grammar: GrammarValidationResult;
    cultural: CulturalValidationResult;
    business: BusinessValidationResult;
    readability: ReadabilityResult;
  };
  criticalIssues: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationSuggestion[];
  improvements: ContentImprovement[];
  metadata: {
    processingTime: number;
    validatorsUsed: string[];
    cacheHit: boolean;
    cost: number;
  };
}

/**
 * Validation issue detail
 */
export interface ValidationIssue {
  type: 'grammar' | 'cultural' | 'business' | 'readability' | 'technical';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location?: {
    line?: number;
    column?: number;
    snippet?: string;
  };
  rule?: string;
  suggestion?: string;
}

/**
 * Validation suggestion
 */
export interface ValidationSuggestion {
  type: string;
  original: string;
  suggested: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

/**
 * Content improvement recommendation
 */
export interface ContentImprovement {
  area: string;
  currentState: string;
  desiredState: string;
  steps: string[];
  examples?: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedImpact: {
    qualityIncrease: number;
    effortRequired: 'minimal' | 'moderate' | 'significant';
  };
}

/**
 * Norwegian Quality Validator - Main Orchestrator
 */
export class NorwegianValidator {
  private grammarChecker: GrammarChecker;
  private culturalValidator: CulturalValidator;
  private businessValidator: BusinessValidator;
  private readabilityAnalyzer: ReadabilityAnalyzer;
  private validationRules: ValidationRules;
  private cache: MultiLayerCache;
  private costGuardian: CostGuardian;

  // Validation weights for overall scoring
  private readonly VALIDATION_WEIGHTS = {
    grammar: 0.25,
    cultural: 0.30,
    business: 0.25,
    readability: 0.20
  };

  // Quality thresholds
  private readonly QUALITY_THRESHOLDS = {
    ready: 85,
    needsReview: 70,
    needsRevision: 50
  };

  constructor(cache: MultiLayerCache, costGuardian: CostGuardian) {
    this.cache = cache;
    this.costGuardian = costGuardian;
    
    // Initialize validators
    this.grammarChecker = new GrammarChecker();
    this.culturalValidator = new CulturalValidator();
    this.businessValidator = new BusinessValidator();
    this.readabilityAnalyzer = new ReadabilityAnalyzer();
    this.validationRules = new ValidationRules();
  }

  /**
   * Perform comprehensive validation
   */
  async validate(request: ValidationRequest): Promise<ValidationResponse> {
    const startTime = Date.now();
    const validationId = this.generateValidationId();

    try {
      // Check cache
      const cacheKey = this.createCacheKey(request);
      const cached = await this.checkCache(cacheKey);
      if (cached && this.isCacheValid(cached, request)) {
        return this.createCachedResponse(cached, validationId);
      }

      // Track validation cost
      await this.costGuardian.trackUsage('validation', 0.001, {
        contentType: request.contentType,
        contentLength: request.content.length
      });

      // Run all validations in parallel
      const [grammar, cultural, business, readability] = await Promise.all([
        this.performGrammarValidation(request),
        this.performCulturalValidation(request),
        this.performBusinessValidation(request),
        this.performReadabilityAnalysis(request)
      ]);

      // Apply validation rules
      const ruleValidation = await this.applyValidationRules(request);

      // Compile issues and suggestions
      const { criticalIssues, warnings } = this.compileIssues(
        grammar,
        cultural,
        business,
        readability,
        ruleValidation
      );

      // Generate suggestions
      const suggestions = this.generateSuggestions(
        grammar,
        cultural,
        business,
        readability,
        request
      );

      // Create improvements
      const improvements = this.generateImprovements(
        grammar,
        cultural,
        business,
        readability,
        request
      );

      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        grammar,
        cultural,
        business,
        readability
      );

      // Determine grade and readiness
      const overallGrade = this.calculateGrade(overallScore);
      const readinessLevel = this.determineReadiness(overallScore, criticalIssues);

      // Create response
      const response: ValidationResponse = {
        id: validationId,
        timestamp: new Date(),
        overallScore,
        overallGrade,
        readinessLevel,
        validations: {
          grammar,
          cultural,
          business,
          readability
        },
        criticalIssues,
        warnings,
        suggestions,
        improvements,
        metadata: {
          processingTime: Date.now() - startTime,
          validatorsUsed: ['grammar', 'cultural', 'business', 'readability'],
          cacheHit: false,
          cost: 0.001
        }
      };

      // Cache response
      await this.cacheResponse(cacheKey, response);

      return response;

    } catch (error) {
      console.error('Validation failed:', error);
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform grammar validation
   */
  private async performGrammarValidation(
    request: ValidationRequest
  ): Promise<GrammarValidationResult> {
    return await this.grammarChecker.validate({
      content: request.content,
      dialect: request.dialect || 'bokmål',
      strictness: request.strictness || 'moderate',
      checkCompounds: true,
      checkPunctuation: true,
      checkSpelling: true,
      provideSuggestions: request.provideSuggestions !== false
    });
  }

  /**
   * Perform cultural validation
   */
  private async performCulturalValidation(
    request: ValidationRequest
  ): Promise<CulturalValidationResult> {
    return await this.culturalValidator.validate({
      content: request.content,
      audience: request.audience,
      industry: request.industry,
      strictness: request.strictness || 'moderate',
      checkJantelov: true,
      checkConsensusLanguage: true,
      checkCulturalReferences: true
    });
  }

  /**
   * Perform business validation
   */
  private async performBusinessValidation(
    request: ValidationRequest
  ): Promise<BusinessValidationResult> {
    return await this.businessValidator.validate({
      content: request.content,
      contentType: request.contentType,
      industry: request.industry,
      company: request.company,
      tone: request.tone,
      checkTerminology: true,
      checkProfessionalism: true,
      checkCredibility: true
    });
  }

  /**
   * Perform readability analysis
   */
  private async performReadabilityAnalysis(
    request: ValidationRequest
  ): Promise<ReadabilityResult> {
    return await this.readabilityAnalyzer.analyze({
      content: request.content,
      audience: request.audience,
      contentType: request.contentType,
      dialect: request.dialect || 'bokmål'
    });
  }

  /**
   * Apply custom validation rules
   */
  private async applyValidationRules(request: ValidationRequest): Promise<any> {
    return await this.validationRules.apply({
      content: request.content,
      contentType: request.contentType,
      strictness: request.strictness || 'moderate'
    });
  }

  /**
   * Compile issues from all validations
   */
  private compileIssues(
    grammar: GrammarValidationResult,
    cultural: CulturalValidationResult,
    business: BusinessValidationResult,
    readability: ReadabilityResult,
    ruleValidation: any
  ): { criticalIssues: ValidationIssue[]; warnings: ValidationIssue[] } {
    const criticalIssues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Grammar issues
    grammar.errors.forEach(error => {
      const issue: ValidationIssue = {
        type: 'grammar',
        severity: error.severity || 'high',
        message: error.message,
        location: error.position ? {
          line: error.position.line,
          column: error.position.column,
          snippet: error.context
        } : undefined,
        rule: error.rule,
        suggestion: error.suggestion
      };

      if (issue.severity === 'critical' || issue.severity === 'high') {
        criticalIssues.push(issue);
      } else {
        warnings.push(issue);
      }
    });

    // Cultural issues
    if (!cultural.jantelovCompliance.compliant) {
      cultural.jantelovCompliance.violations.forEach(violation => {
        criticalIssues.push({
          type: 'cultural',
          severity: 'high',
          message: violation,
          rule: 'jantelov',
          suggestion: 'Juster språket for å være mer ydmyk og inkluderende'
        });
      });
    }

    // Business issues
    if (business.professionalism.score < 70) {
      business.professionalism.issues.forEach(issue => {
        warnings.push({
          type: 'business',
          severity: 'medium',
          message: issue,
          rule: 'professionalism'
        });
      });
    }

    // Readability issues
    if (readability.score < 60) {
      criticalIssues.push({
        type: 'readability',
        severity: 'high',
        message: `Lesbarhetsscore er for lav (${readability.score}/100)`,
        suggestion: 'Forenkle setningsstruktur og reduser kompleksitet'
      });
    }

    return { criticalIssues, warnings };
  }

  /**
   * Generate suggestions for improvement
   */
  private generateSuggestions(
    grammar: GrammarValidationResult,
    cultural: CulturalValidationResult,
    business: BusinessValidationResult,
    readability: ReadabilityResult,
    request: ValidationRequest
  ): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];

    // Grammar suggestions
    grammar.corrections.forEach(correction => {
      suggestions.push({
        type: 'grammar',
        original: correction.original,
        suggested: correction.corrected,
        reason: correction.explanation,
        impact: 'high',
        confidence: correction.confidence
      });
    });

    // Terminology suggestions
    business.terminology.suggestions.forEach(suggestion => {
      suggestions.push({
        type: 'terminology',
        original: suggestion.original,
        suggested: suggestion.suggested,
        reason: suggestion.reason,
        impact: suggestion.impact as 'high' | 'medium' | 'low',
        confidence: 0.9
      });
    });

    // Cultural adaptations
    cultural.suggestions.forEach(suggestion => {
      suggestions.push({
        type: 'cultural',
        original: suggestion.current,
        suggested: suggestion.suggested,
        reason: suggestion.reason,
        impact: suggestion.culturalImpact as 'high' | 'medium' | 'low',
        confidence: 0.85
      });
    });

    // Sort by impact and confidence
    suggestions.sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      const aScore = impactScore[a.impact] * a.confidence;
      const bScore = impactScore[b.impact] * b.confidence;
      return bScore - aScore;
    });

    return suggestions.slice(0, 20); // Limit to top 20
  }

  /**
   * Generate content improvements
   */
  private generateImprovements(
    grammar: GrammarValidationResult,
    cultural: CulturalValidationResult,
    business: BusinessValidationResult,
    readability: ReadabilityResult,
    request: ValidationRequest
  ): ContentImprovement[] {
    const improvements: ContentImprovement[] = [];

    // Grammar improvements
    if (grammar.score < 80) {
      improvements.push({
        area: 'Grammatikk og språkføring',
        currentState: `Grammatisk kvalitet: ${grammar.score}/100`,
        desiredState: 'Feilfri norsk grammatikk med naturlig flyt',
        steps: [
          'Rett opp grammatiske feil markert i valideringen',
          'Sjekk sammensatte ord og særskriving',
          'Gjennomgå tegnsetting og setningsstruktur',
          'Verifiser bøyninger og samsvar'
        ],
        examples: grammar.corrections.slice(0, 3).map(c => 
          `"${c.original}" → "${c.corrected}"`
        ),
        priority: grammar.score < 60 ? 'critical' : 'high',
        estimatedImpact: {
          qualityIncrease: Math.min(30, 100 - grammar.score),
          effortRequired: grammar.errors.length > 10 ? 'significant' : 'moderate'
        }
      });
    }

    // Cultural improvements
    if (cultural.overallScore < 75) {
      improvements.push({
        area: 'Kulturell tilpasning',
        currentState: `Kulturell score: ${cultural.overallScore}/100`,
        desiredState: 'Full tilpasning til norsk forretningskultur',
        steps: [
          'Juster tone for bedre Jantelov-samsvar',
          'Øk bruk av konsensusbyggende språk',
          'Inkluder norske kulturelle referanser',
          'Balanser selvtillit med ydmykhet'
        ],
        priority: cultural.jantelovCompliance.compliant ? 'medium' : 'high',
        estimatedImpact: {
          qualityIncrease: Math.min(25, 100 - cultural.overallScore),
          effortRequired: 'moderate'
        }
      });
    }

    // Business communication improvements
    if (business.overallScore < 80) {
      improvements.push({
        area: 'Forretningsmessig kommunikasjon',
        currentState: `Business score: ${business.overallScore}/100`,
        desiredState: 'Profesjonell og troverdig forretningskommunikasjon',
        steps: [
          'Erstatt anglisismer med norske termer',
          'Styrk profesjonalitet i ordvalg',
          'Legg til troverdighetsbyggende elementer',
          'Inkluder klare handlingsoppfordringer'
        ],
        examples: business.terminology.suggestions.slice(0, 2).map(s =>
          `"${s.original}" → "${s.suggested}"`
        ),
        priority: business.professionalism.score < 60 ? 'high' : 'medium',
        estimatedImpact: {
          qualityIncrease: Math.min(20, 100 - business.overallScore),
          effortRequired: 'minimal'
        }
      });
    }

    // Readability improvements
    if (readability.score < 70) {
      improvements.push({
        area: 'Lesbarhet og tilgjengelighet',
        currentState: `Lesbarhet: ${readability.score}/100 (${readability.level})`,
        desiredState: `Optimal lesbarhet for ${request.audience}`,
        steps: [
          `Reduser gjennomsnittlig setningslengde (nå: ${readability.metrics.averageSentenceLength} ord)`,
          `Forenkle komplekse ord (${readability.metrics.complexWordPercentage}% komplekse)`,
          'Øk bruk av aktiv stemme',
          'Strukturer innhold med tydelige avsnitt'
        ],
        priority: readability.score < 50 ? 'critical' : 'medium',
        estimatedImpact: {
          qualityIncrease: Math.min(30, 100 - readability.score),
          effortRequired: 'moderate'
        }
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    improvements.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return improvements;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    grammar: GrammarValidationResult,
    cultural: CulturalValidationResult,
    business: BusinessValidationResult,
    readability: ReadabilityResult
  ): number {
    const weightedScore = 
      grammar.score * this.VALIDATION_WEIGHTS.grammar +
      cultural.overallScore * this.VALIDATION_WEIGHTS.cultural +
      business.overallScore * this.VALIDATION_WEIGHTS.business +
      readability.score * this.VALIDATION_WEIGHTS.readability;

    return Math.round(weightedScore);
  }

  /**
   * Calculate grade based on score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Determine readiness level
   */
  private determineReadiness(
    score: number,
    criticalIssues: ValidationIssue[]
  ): 'ready' | 'needs_review' | 'needs_revision' | 'rejected' {
    // Critical issues override score
    if (criticalIssues.length > 3) return 'rejected';
    if (criticalIssues.length > 0 && score < 70) return 'needs_revision';

    if (score >= this.QUALITY_THRESHOLDS.ready) return 'ready';
    if (score >= this.QUALITY_THRESHOLDS.needsReview) return 'needs_review';
    if (score >= this.QUALITY_THRESHOLDS.needsRevision) return 'needs_revision';
    return 'rejected';
  }

  /**
   * Real-time validation for live feedback
   */
  async validateRealtime(content: string, lastValidation?: ValidationResponse): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    // Quick validation for real-time feedback
    const quickGrammar = await this.grammarChecker.quickCheck(content);
    const quickCultural = await this.culturalValidator.quickCheck(content);
    const quickReadability = await this.readabilityAnalyzer.quickCheck(content);

    const score = Math.round(
      (quickGrammar.score + quickCultural.score + quickReadability.score) / 3
    );

    const issues = [
      ...quickGrammar.issues,
      ...quickCultural.issues,
      ...quickReadability.issues
    ].slice(0, 5);

    const suggestions = [
      ...quickGrammar.suggestions,
      ...quickCultural.suggestions
    ].slice(0, 3);

    return { score, issues, suggestions };
  }

  /**
   * Batch validation for multiple contents
   */
  async batchValidate(
    requests: ValidationRequest[]
  ): Promise<ValidationResponse[]> {
    const batchSize = 5;
    const results: ValidationResponse[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(req => this.validate(req))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Cache management
   */
  private createCacheKey(request: ValidationRequest): string {
    const key = {
      content: request.content.substring(0, 100), // First 100 chars
      contentType: request.contentType,
      strictness: request.strictness,
      dialect: request.dialect
    };
    return `validation:${JSON.stringify(key)}`;
  }

  private async checkCache(key: string): Promise<any> {
    return await this.cache.get(key);
  }

  private isCacheValid(cached: any, request: ValidationRequest): boolean {
    // Cache is valid for 1 hour for same content
    const age = Date.now() - new Date(cached.timestamp).getTime();
    return age < 60 * 60 * 1000;
  }

  private async cacheResponse(key: string, response: ValidationResponse): Promise<void> {
    await this.cache.set(key, response, { ttl: 3600 }); // 1 hour TTL
  }

  private createCachedResponse(cached: any, id: string): ValidationResponse {
    return {
      ...cached,
      id,
      metadata: {
        ...cached.metadata,
        cacheHit: true
      }
    };
  }

  private generateValidationId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get validation statistics
   */
  async getValidationStats(): Promise<{
    totalValidations: number;
    averageScore: number;
    commonIssues: Array<{ issue: string; frequency: number }>;
    improvementTrends: Array<{ date: string; averageScore: number }>;
  }> {
    // Implementation would retrieve stats from cache/database
    return {
      totalValidations: 0,
      averageScore: 0,
      commonIssues: [],
      improvementTrends: []
    };
  }
}