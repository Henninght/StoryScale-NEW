/**
 * Language-aware cache key generation utilities
 * Provides consistent cache key generation with language parameters
 */

import { createHash } from 'crypto';
import { 
  LanguageAwareContentRequest, 
  CulturalContext,
  SupportedLanguage 
} from '../types/language-aware-request';

// Cache key configuration
export interface CacheKeyConfig {
  includeTimestamp?: boolean;
  timestampGranularity?: 'minute' | 'hour' | 'day';
  includeUserContext?: boolean;
  includeSEO?: boolean;
  hashContent?: boolean;
  maxKeyLength?: number;
}

// Cache key components
interface CacheKeyComponents {
  base: string;
  language: string;
  cultural?: string;
  content: string;
  metadata?: string;
  timestamp?: string;
}

export class CacheKeyGenerator {
  private static instance: CacheKeyGenerator;
  private readonly defaultConfig: CacheKeyConfig = {
    includeTimestamp: false,
    timestampGranularity: 'hour',
    includeUserContext: true,
    includeSEO: true,
    hashContent: true,
    maxKeyLength: 250,
  };

  private constructor() {}

  public static getInstance(): CacheKeyGenerator {
    if (!CacheKeyGenerator.instance) {
      CacheKeyGenerator.instance = new CacheKeyGenerator();
    }
    return CacheKeyGenerator.instance;
  }

  /**
   * Generate a cache key for a language-aware request
   */
  public generateKey(
    request: LanguageAwareContentRequest,
    config?: Partial<CacheKeyConfig>
  ): string {
    const finalConfig = { ...this.defaultConfig, ...config };
    const components = this.extractKeyComponents(request, finalConfig);
    return this.assembleKey(components, finalConfig);
  }

  /**
   * Generate a batch cache key for multiple requests
   */
  public generateBatchKey(
    requests: LanguageAwareContentRequest[],
    config?: Partial<CacheKeyConfig>
  ): string {
    const sortedRequests = [...requests].sort((a, b) => a.id.localeCompare(b.id));
    const batchHash = this.hashObject({
      count: requests.length,
      ids: sortedRequests.map(r => r.id),
      languages: [...new Set(sortedRequests.map(r => r.outputLanguage))],
    });
    
    return `batch:${batchHash}:${requests.length}`;
  }

  /**
   * Extract cache key components from request
   */
  private extractKeyComponents(
    request: LanguageAwareContentRequest,
    config: CacheKeyConfig
  ): CacheKeyComponents {
    const components: CacheKeyComponents = {
      base: this.generateBaseKey(request),
      language: this.generateLanguageKey(request),
      content: this.generateContentKey(request, config),
    };

    // Add cultural context if present
    if (request.culturalContext) {
      components.cultural = this.generateCulturalKey(request.culturalContext);
    }

    // Add metadata
    if (config.includeUserContext || config.includeSEO) {
      components.metadata = this.generateMetadataKey(request, config);
    }

    // Add timestamp if configured
    if (config.includeTimestamp) {
      components.timestamp = this.generateTimestampKey(
        request.timestamp,
        config.timestampGranularity!
      );
    }

    return components;
  }

  /**
   * Generate base key component
   */
  private generateBaseKey(request: LanguageAwareContentRequest): string {
    const baseComponents = [
      request.type,
      this.sanitizeString(request.topic),
      request.tone || 'default',
    ];

    if (request.wordCount) {
      // Round to nearest 100 for better cache hits
      const roundedCount = Math.ceil(request.wordCount / 100) * 100;
      baseComponents.push(`wc${roundedCount}`);
    }

    return baseComponents.join(':');
  }

  /**
   * Generate language key component
   */
  private generateLanguageKey(request: LanguageAwareContentRequest): string {
    const langComponents = [
      `out_${request.outputLanguage}`,
    ];

    if (request.inputLanguage) {
      langComponents.push(`in_${request.inputLanguage}`);
    }

    if (request.requiresTranslation) {
      langComponents.push('trans');
    }

    if (request.glossary && Object.keys(request.glossary).length > 0) {
      const glossaryHash = this.hashObject(request.glossary).substring(0, 8);
      langComponents.push(`gloss_${glossaryHash}`);
    }

    return langComponents.join(':');
  }

  /**
   * Generate cultural context key component
   */
  private generateCulturalKey(context: CulturalContext): string {
    const culturalComponents = [
      `mkt_${context.market}`,
    ];

    if (context.businessType) {
      culturalComponents.push(`biz_${context.businessType}`);
    }

    if (context.dialectPreference) {
      culturalComponents.push(`dial_${context.dialectPreference}`);
    }

    if (context.formalityLevel) {
      culturalComponents.push(`form_${context.formalityLevel}`);
    }

    if (context.localReferences !== undefined) {
      culturalComponents.push(`local_${context.localReferences ? '1' : '0'}`);
    }

    if (context.industry) {
      culturalComponents.push(`ind_${this.sanitizeString(context.industry)}`);
    }

    return culturalComponents.join(':');
  }

  /**
   * Generate content key component
   */
  private generateContentKey(
    request: LanguageAwareContentRequest,
    config: CacheKeyConfig
  ): string {
    const contentParts: string[] = [];

    // Keywords
    if (request.keywords && request.keywords.length > 0) {
      const sortedKeywords = [...request.keywords].sort();
      if (config.hashContent) {
        contentParts.push(`kw_${this.hashArray(sortedKeywords).substring(0, 12)}`);
      } else {
        const keywordStr = sortedKeywords
          .slice(0, 3)
          .map(k => this.sanitizeString(k))
          .join('_');
        contentParts.push(`kw_${keywordStr}`);
      }
    }

    // Target audience
    if (request.targetAudience) {
      const audienceKey = config.hashContent
        ? this.hashString(request.targetAudience).substring(0, 8)
        : this.sanitizeString(request.targetAudience);
      contentParts.push(`aud_${audienceKey}`);
    }

    return contentParts.join(':');
  }

  /**
   * Generate metadata key component
   */
  private generateMetadataKey(
    request: LanguageAwareContentRequest,
    config: CacheKeyConfig
  ): string {
    const metaParts: string[] = [];

    // SEO requirements
    if (config.includeSEO && request.seoRequirements) {
      const seo = request.seoRequirements;
      const seoKey = this.hashObject({
        primary: seo.primaryKeyword,
        secondary: seo.secondaryKeywords,
        region: seo.targetRegion,
      }).substring(0, 10);
      metaParts.push(`seo_${seoKey}`);
    }

    return metaParts.length > 0 ? metaParts.join(':') : '';
  }

  /**
   * Generate timestamp key component
   */
  private generateTimestampKey(
    timestamp: Date,
    granularity: 'minute' | 'hour' | 'day'
  ): string {
    const date = new Date(timestamp);
    
    switch (granularity) {
      case 'minute':
        date.setSeconds(0, 0);
        break;
      case 'hour':
        date.setMinutes(0, 0, 0);
        break;
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
    }

    return `ts_${date.getTime()}`;
  }

  /**
   * Assemble final cache key from components
   */
  private assembleKey(
    components: CacheKeyComponents,
    config: CacheKeyConfig
  ): string {
    const parts = [
      'storyscale',
      'v1',
      components.base,
      components.language,
    ];

    if (components.cultural) {
      parts.push(components.cultural);
    }

    if (components.content) {
      parts.push(components.content);
    }

    if (components.metadata) {
      parts.push(components.metadata);
    }

    if (components.timestamp) {
      parts.push(components.timestamp);
    }

    let key = parts.filter(Boolean).join(':');

    // Ensure key doesn't exceed max length
    if (config.maxKeyLength && key.length > config.maxKeyLength) {
      // Hash the excess and append
      const excess = key.substring(config.maxKeyLength - 20);
      const hash = this.hashString(excess).substring(0, 16);
      key = key.substring(0, config.maxKeyLength - 20) + ':h_' + hash;
    }

    return key;
  }

  /**
   * Parse a cache key to extract its components
   */
  public parseKey(key: string): Partial<CacheKeyComponents> & { version?: string } {
    const parts = key.split(':');
    const result: Partial<CacheKeyComponents> & { version?: string } = {};

    if (parts[0] === 'storyscale') {
      result.version = parts[1];
      
      // Parse remaining parts based on patterns
      for (let i = 2; i < parts.length; i++) {
        const part = parts[i];
        
        if (part.startsWith('out_') || part.startsWith('in_')) {
          result.language = (result.language || '') + ':' + part;
        } else if (part.startsWith('mkt_') || part.startsWith('biz_')) {
          result.cultural = (result.cultural || '') + ':' + part;
        } else if (part.startsWith('ts_')) {
          result.timestamp = part;
        }
      }
    }

    return result;
  }

  /**
   * Validate cache key format
   */
  public isValidKey(key: string): boolean {
    // Check basic format
    if (!key || typeof key !== 'string') {
      return false;
    }

    // Check prefix
    if (!key.startsWith('storyscale:v')) {
      return false;
    }

    // Check for required components
    const parts = key.split(':');
    if (parts.length < 4) {
      return false;
    }

    // Check for language component
    const hasLanguage = parts.some(p => p.startsWith('out_'));
    if (!hasLanguage) {
      return false;
    }

    return true;
  }

  /**
   * Generate cache tags for invalidation
   */
  public generateTags(request: LanguageAwareContentRequest): string[] {
    const tags: string[] = [
      `type:${request.type}`,
      `lang:${request.outputLanguage}`,
    ];

    if (request.inputLanguage) {
      tags.push(`input_lang:${request.inputLanguage}`);
    }

    if (request.culturalContext) {
      tags.push(`market:${request.culturalContext.market}`);
      if (request.culturalContext.industry) {
        tags.push(`industry:${request.culturalContext.industry}`);
      }
    }

    if (request.tone) {
      tags.push(`tone:${request.tone}`);
    }

    if (request.keywords) {
      request.keywords.slice(0, 3).forEach(kw => {
        tags.push(`kw:${this.sanitizeString(kw)}`);
      });
    }

    return tags;
  }

  /**
   * Utility methods
   */
  private sanitizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9æøå]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex');
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return this.hashString(str);
  }

  private hashArray(arr: string[]): string {
    return this.hashString(arr.join('|'));
  }

  /**
   * Generate namespace for different cache stores
   */
  public getNamespace(language: SupportedLanguage, contentType?: string): string {
    const parts = ['storyscale', language];
    if (contentType) {
      parts.push(contentType);
    }
    return parts.join('_');
  }

  /**
   * Generate pattern for cache invalidation
   */
  public getInvalidationPattern(
    language?: SupportedLanguage,
    type?: string,
    market?: string
  ): string {
    const patterns: string[] = ['storyscale:v1'];

    if (type) {
      patterns.push(type);
    } else {
      patterns.push('*');
    }

    if (language) {
      patterns.push(`*out_${language}*`);
    } else {
      patterns.push('*');
    }

    if (market) {
      patterns.push(`*mkt_${market}*`);
    }

    return patterns.join(':');
  }
}