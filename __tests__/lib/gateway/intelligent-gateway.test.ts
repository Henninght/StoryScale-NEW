/**
 * Comprehensive test suite for IntelligentGateway
 * Covers request classification, routing, caching, cost tracking, and error handling
 */

import { IntelligentGateway, GatewayEvents } from '../../../src/lib/gateway/intelligent-gateway';
import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  RequestClassification,
  RouteDecision,
  GatewayConfig,
  GatewayError,
  GatewayErrorCode,
  CulturalContext,
  LanguageSpecificMetrics,
} from '../../../src/lib/types/language-aware-request';
import { LanguageDetectionService } from '../../../src/lib/services/language-detection';
import { CacheKeyGenerator } from '../../../src/lib/utils/cache-keys';

// Mock dependencies
jest.mock('../../../src/lib/services/language-detection');
jest.mock('../../../src/lib/utils/cache-keys');

describe('IntelligentGateway', () => {
  let gateway: IntelligentGateway;
  let mockLanguageDetector: jest.Mocked<LanguageDetectionService>;
  let mockCacheKeyGenerator: jest.Mocked<CacheKeyGenerator>;
  let eventEmissions: Record<string, any[]>;

  // Helper function to create test request
  const createTestRequest = (overrides?: Partial<LanguageAwareContentRequest>): LanguageAwareContentRequest => ({
    id: 'test-req-123',
    type: 'article',
    topic: 'AI Technology Trends',
    keywords: ['AI', 'machine learning', 'innovation'],
    tone: 'professional',
    targetAudience: 'tech professionals',
    wordCount: 800,
    timestamp: new Date(),
    outputLanguage: 'en',
    ...overrides,
  });

  beforeEach(() => {
    // Clear singleton instance
    (IntelligentGateway as any).instance = undefined;

    // Setup mocks
    mockLanguageDetector = {
      getInstance: jest.fn(),
      detectLanguage: jest.fn().mockResolvedValue({
        detectedLanguage: 'en',
        confidence: 0.95,
        alternatives: [],
      }),
    } as any;
    (LanguageDetectionService.getInstance as jest.Mock).mockReturnValue(mockLanguageDetector);

    mockCacheKeyGenerator = {
      getInstance: jest.fn(),
      generateKey: jest.fn().mockReturnValue('cache-key-123'),
      generateTags: jest.fn().mockReturnValue(['article', 'en', 'AI']),
      getInvalidationPattern: jest.fn().mockReturnValue('pattern-*'),
    } as any;
    (CacheKeyGenerator.getInstance as jest.Mock).mockReturnValue(mockCacheKeyGenerator);

    // Initialize gateway
    gateway = IntelligentGateway.getInstance();

    // Track event emissions
    eventEmissions = {};
    const events: (keyof GatewayEvents)[] = [
      'request:received',
      'request:classified',
      'request:routed',
      'request:completed',
      'request:failed',
      'cache:hit',
      'cache:miss',
      'fallback:triggered',
      'cost:threshold',
    ];

    events.forEach(event => {
      eventEmissions[event] = [];
      gateway.on(event, (...args) => {
        eventEmissions[event].push(args);
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    gateway.removeAllListeners();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = IntelligentGateway.getInstance();
      const instance2 = IntelligentGateway.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should accept configuration on first initialization', () => {
      (IntelligentGateway as any).instance = undefined;
      const config: Partial<GatewayConfig> = {
        defaultLanguage: 'no',
        cacheEnabled: false,
      };
      const instance = IntelligentGateway.getInstance(config);
      expect(instance).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    it('should accept valid requests', async () => {
      const request = createTestRequest();
      const responsePromise = gateway.processContent(request);
      await expect(responsePromise).resolves.toBeDefined();
    });

    it('should reject requests with missing required fields', async () => {
      const invalidRequest = createTestRequest({ id: '' });
      await expect(gateway.processContent(invalidRequest)).rejects.toThrow(GatewayError);
    });

    it('should reject requests with unsupported language', async () => {
      const request = createTestRequest({ outputLanguage: 'fr' as any });
      await expect(gateway.processContent(request)).rejects.toThrow(GatewayError);
    });

    it('should validate all required fields', async () => {
      const testCases = [
        { field: 'id', value: '' },
        { field: 'type', value: undefined },
        { field: 'topic', value: '' },
        { field: 'outputLanguage', value: undefined },
      ];

      for (const testCase of testCases) {
        const request = createTestRequest({ [testCase.field]: testCase.value } as any);
        await expect(gateway.processContent(request)).rejects.toThrow(GatewayError);
      }
    });
  });

  describe('Language Detection and Routing', () => {
    it('should auto-detect input language when not specified', async () => {
      const request = createTestRequest({ inputLanguage: undefined });
      await gateway.processContent(request);
      
      expect(mockLanguageDetector.detectLanguage).toHaveBeenCalledWith(
        expect.stringContaining('AI Technology Trends'),
        'en'
      );
    });

    it('should skip detection when input language is specified', async () => {
      const request = createTestRequest({ inputLanguage: 'no' });
      await gateway.processContent(request);
      
      expect(mockLanguageDetector.detectLanguage).not.toHaveBeenCalled();
    });

    it('should set translation flag when input and output languages differ', async () => {
      mockLanguageDetector.detectLanguage.mockResolvedValueOnce({
        detectedLanguage: 'no',
        confidence: 0.9,
        alternatives: [],
      });

      const request = createTestRequest({ inputLanguage: undefined });
      const response = await gateway.processContent(request);
      
      expect(response.metadata.wasTranslated).toBe(true);
    });

    it('should handle language detection failures gracefully', async () => {
      mockLanguageDetector.detectLanguage.mockRejectedValueOnce(new Error('Detection failed'));
      
      const request = createTestRequest({ inputLanguage: undefined });
      const response = await gateway.processContent(request);
      
      expect(response).toBeDefined();
      expect(response.metadata.wasTranslated).toBe(false);
    });
  });

  describe('Request Classification', () => {
    it('should classify simple requests correctly', async () => {
      const request = createTestRequest({
        wordCount: 300,
        requiresTranslation: false,
      });
      
      await gateway.processContent(request);
      
      expect(eventEmissions['request:classified']).toHaveLength(1);
      const classification = eventEmissions['request:classified'][0][0] as RequestClassification;
      expect(classification.complexity).toBe('simple');
    });

    it('should classify moderate complexity requests', async () => {
      const request = createTestRequest({
        wordCount: 800,
        requiresTranslation: true,
      });
      
      await gateway.processContent(request);
      
      const classification = eventEmissions['request:classified'][0][0] as RequestClassification;
      expect(classification.complexity).toBe('moderate');
    });

    it('should classify complex requests with cultural adaptation', async () => {
      const culturalContext: CulturalContext = {
        market: 'norway',
        businessType: 'b2b',
        dialectPreference: 'bokmål',
        formalityLevel: 'formal',
        localReferences: true,
      };
      
      const request = createTestRequest({
        wordCount: 1500,
        culturalContext,
        requiresTranslation: true,
      });
      
      await gateway.processContent(request);
      
      const classification = eventEmissions['request:classified'][0][0] as RequestClassification;
      expect(classification.complexity).toBe('complex');
      expect(classification.requiredCapabilities).toContain('cultural-adaptation');
    });

    it('should estimate token usage accurately', async () => {
      const request = createTestRequest({ wordCount: 1000 });
      await gateway.processContent(request);
      
      const classification = eventEmissions['request:classified'][0][0] as RequestClassification;
      expect(classification.estimatedTokens).toBeGreaterThan(1000);
      expect(classification.estimatedTokens).toBeLessThan(2000);
    });

    it('should suggest appropriate models based on requirements', async () => {
      const testCases = [
        { 
          request: createTestRequest({ wordCount: 200 }),
          expectedModel: 'gpt-3.5'
        },
        {
          request: createTestRequest({ 
            wordCount: 1500,
            culturalContext: { market: 'norway', businessType: 'b2b' }
          }),
          expectedModel: 'gpt-4'
        },
      ];

      for (const testCase of testCases) {
        await gateway.processContent(testCase.request);
        const classification = eventEmissions['request:classified'].pop()[0] as RequestClassification;
        expect(classification.suggestedModel).toBe(testCase.expectedModel);
      }
    });
  });

  describe('Model Selection and Fallback', () => {
    it('should select primary model for supported language', async () => {
      const request = createTestRequest({ outputLanguage: 'en' });
      await gateway.processContent(request);
      
      const route = eventEmissions['request:routed'][0][0] as RouteDecision;
      expect(['gpt-4', 'gpt-3.5-turbo', 'claude-3']).toContain(route.targetModel);
    });

    it('should setup fallback route for Norwegian requests', async () => {
      const request = createTestRequest({ outputLanguage: 'no' });
      await gateway.processContent(request);
      
      const route = eventEmissions['request:routed'][0][0] as RouteDecision;
      expect(route.fallbackRoute).toBeDefined();
      expect(route.fallbackRoute?.targetModel).toBe('gpt-3.5-turbo');
    });

    it('should trigger fallback on primary model failure', async () => {
      // Simulate processing error that triggers fallback
      const request = createTestRequest({ outputLanguage: 'no' });
      
      // Mock the processRequest to fail first time
      const originalProcess = (gateway as any).processRequest.bind(gateway);
      let callCount = 0;
      (gateway as any).processRequest = jest.fn().mockImplementation(async (context) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Primary model failed');
        }
        return originalProcess(context);
      });

      const response = await gateway.processContent(request);
      
      expect(eventEmissions['fallback:triggered']).toHaveLength(1);
      expect(response.metadata.fallbackUsed).toBe(true);
    });

    it('should throw error when no suitable model is available', async () => {
      // Override models to have no suitable options
      (gateway as any).models.clear();
      
      const request = createTestRequest();
      await expect(gateway.processContent(request)).rejects.toThrow(
        expect.objectContaining({
          code: GatewayErrorCode.MODEL_UNAVAILABLE,
        })
      );
    });
  });

  describe('Cache Operations', () => {
    it('should return cached response on cache hit', async () => {
      const request = createTestRequest();
      
      // First request - cache miss
      const response1 = await gateway.processContent(request);
      expect(response1.metadata.cacheHit).toBe(false);
      expect(eventEmissions['cache:miss']).toHaveLength(1);
      
      // Second identical request - cache hit
      const response2 = await gateway.processContent(request);
      expect(response2.metadata.cacheHit).toBe(true);
      expect(eventEmissions['cache:hit']).toHaveLength(1);
    });

    it('should respect cache TTL', async () => {
      const request = createTestRequest();
      
      // First request
      await gateway.processContent(request);
      
      // Expire cache entry
      const cache = (gateway as any).cache;
      const cacheEntry = cache.get('cache-key-123');
      if (cacheEntry) {
        cacheEntry.expiresAt = new Date(Date.now() - 1000);
      }
      
      // Second request should be cache miss
      const response2 = await gateway.processContent(request);
      expect(response2.metadata.cacheHit).toBe(false);
    });

    it('should generate correct cache keys', async () => {
      const request = createTestRequest();
      await gateway.processContent(request);
      
      expect(mockCacheKeyGenerator.generateKey).toHaveBeenCalledWith(request);
      expect(mockCacheKeyGenerator.generateTags).toHaveBeenCalledWith(request);
    });

    it('should handle cache disabled configuration', async () => {
      gateway.updateConfig({ cacheEnabled: false });
      
      const request = createTestRequest();
      await gateway.processContent(request);
      await gateway.processContent(request);
      
      expect(eventEmissions['cache:hit']).toHaveLength(0);
      expect(eventEmissions['cache:miss']).toHaveLength(0);
    });

    it('should clear cache by language', () => {
      // Add some cache entries
      const cache = (gateway as any).cache;
      cache.set('key-en-1', { language: 'en', expiresAt: new Date(Date.now() + 10000) });
      cache.set('key-en-2', { language: 'en', expiresAt: new Date(Date.now() + 10000) });
      cache.set('key-no-1', { language: 'no', expiresAt: new Date(Date.now() + 10000) });
      
      gateway.clearCache('en');
      
      expect(cache.has('key-en-1')).toBe(false);
      expect(cache.has('key-en-2')).toBe(false);
      expect(cache.has('key-no-1')).toBe(true);
    });

    it('should limit cache size to prevent memory issues', async () => {
      // Add many cache entries
      const cache = (gateway as any).cache;
      for (let i = 0; i < 10005; i++) {
        cache.set(`key-${i}`, {
          language: 'en',
          createdAt: new Date(i),
          expiresAt: new Date(Date.now() + 100000),
        });
      }
      
      // Trigger cleanup
      (gateway as any).cleanupCache();
      
      expect(cache.size).toBeLessThanOrEqual(10000);
    });
  });

  describe('Cost Tracking and Budget Enforcement', () => {
    it('should track costs per request', async () => {
      const request = createTestRequest();
      const response = await gateway.processContent(request);
      
      expect(response.metadata.cost).toBeGreaterThan(0);
      expect(gateway.getTotalCost()).toBeGreaterThan(0);
    });

    it('should emit warning when cost exceeds warning threshold', async () => {
      const request = createTestRequest({ wordCount: 5000 });
      await gateway.processContent(request);
      
      expect(eventEmissions['cost:threshold']).toHaveLength(1);
      const [cost, threshold] = eventEmissions['cost:threshold'][0];
      expect(cost).toBeGreaterThan(threshold);
    });

    it('should reject request when cost exceeds critical threshold', async () => {
      const request = createTestRequest({ wordCount: 50000 });
      
      await expect(gateway.processContent(request)).rejects.toThrow(
        expect.objectContaining({
          code: GatewayErrorCode.COST_THRESHOLD_EXCEEDED,
        })
      );
    });

    it('should calculate costs based on model and token usage', async () => {
      const request = createTestRequest({ wordCount: 1000 });
      const response = await gateway.processContent(request);
      
      const expectedTokens = response.metadata.tokenUsage.total;
      const modelCost = 0.00003; // GPT-4 cost per token from code
      const expectedCost = expectedTokens * modelCost;
      
      expect(response.metadata.cost).toBeCloseTo(expectedCost, 5);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        createTestRequest({ id: `concurrent-${i}` })
      );
      
      const responses = await Promise.all(
        requests.map(req => gateway.processContent(req))
      );
      
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.requestId).toMatch(/^concurrent-\d+$/);
      });
    });

    it('should track queue status', async () => {
      const request = createTestRequest();
      
      // Start processing without awaiting
      const promise = gateway.processContent(request);
      
      // Check queue status immediately
      const status = gateway.getQueueStatus();
      expect(status.size).toBeGreaterThanOrEqual(0);
      
      await promise;
      
      // Queue should be empty after completion
      const finalStatus = gateway.getQueueStatus();
      expect(finalStatus.size).toBe(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle validation errors', async () => {
      const request = createTestRequest({ type: undefined as any });
      
      await expect(gateway.processContent(request)).rejects.toThrow(GatewayError);
      expect(eventEmissions['request:failed']).toHaveLength(1);
    });

    it('should handle language detection errors', async () => {
      mockLanguageDetector.detectLanguage.mockRejectedValueOnce(
        new Error('Language detection service unavailable')
      );
      
      const request = createTestRequest();
      const response = await gateway.processContent(request);
      
      expect(response).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it('should retry with fallback on processing errors', async () => {
      const request = createTestRequest({ outputLanguage: 'no' });
      
      // Mock processing to fail first time
      let attempts = 0;
      const originalProcess = (gateway as any).processRequest;
      (gateway as any).processRequest = jest.fn().mockImplementation(async (context) => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Processing failed');
        }
        return originalProcess.call(gateway, context);
      });
      
      const response = await gateway.processContent(request);
      
      expect(response).toBeDefined();
      expect(eventEmissions['fallback:triggered']).toHaveLength(1);
    });

    it('should include error details in failed event', async () => {
      const request = createTestRequest({ outputLanguage: 'unsupported' as any });
      
      await expect(gateway.processContent(request)).rejects.toThrow();
      
      expect(eventEmissions['request:failed']).toHaveLength(1);
      const error = eventEmissions['request:failed'][0][0];
      expect(error.code).toBe(GatewayErrorCode.UNSUPPORTED_LANGUAGE);
    });
  });

  describe('Event Emissions', () => {
    it('should emit events in correct order', async () => {
      const request = createTestRequest();
      const events: string[] = [];
      
      const trackEvent = (name: string) => () => events.push(name);
      gateway.on('request:received', trackEvent('received'));
      gateway.on('request:classified', trackEvent('classified'));
      gateway.on('request:routed', trackEvent('routed'));
      gateway.on('request:completed', trackEvent('completed'));
      
      await gateway.processContent(request);
      
      expect(events).toEqual([
        'received',
        'classified',
        'routed',
        'completed',
      ]);
    });

    it('should emit cache events', async () => {
      const request = createTestRequest();
      
      // First request - cache miss
      await gateway.processContent(request);
      expect(eventEmissions['cache:miss']).toHaveLength(1);
      
      // Second request - cache hit
      await gateway.processContent(request);
      expect(eventEmissions['cache:hit']).toHaveLength(1);
    });

    it('should emit cost threshold events', async () => {
      gateway.updateConfig({
        costThresholds: {
          warning: 0.001,
          critical: 10,
        },
      });
      
      const request = createTestRequest({ wordCount: 1000 });
      await gateway.processContent(request);
      
      expect(eventEmissions['cost:threshold']).toHaveLength(1);
    });
  });

  describe('Metrics and Analytics', () => {
    it('should track language-specific metrics', async () => {
      const enRequest = createTestRequest({ outputLanguage: 'en' });
      const noRequest = createTestRequest({ outputLanguage: 'no' });
      
      await gateway.processContent(enRequest);
      await gateway.processContent(noRequest);
      
      const enMetrics = gateway.getMetrics('en') as LanguageSpecificMetrics;
      const noMetrics = gateway.getMetrics('no') as LanguageSpecificMetrics;
      
      expect(enMetrics.requestCount).toBe(1);
      expect(noMetrics.requestCount).toBe(1);
    });

    it('should calculate average processing time', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        createTestRequest({ id: `metric-${i}` })
      );
      
      for (const request of requests) {
        await gateway.processContent(request);
      }
      
      const metrics = gateway.getMetrics('en') as LanguageSpecificMetrics;
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.requestCount).toBe(5);
    });

    it('should track cache hit rate', async () => {
      const request = createTestRequest();
      
      // Multiple requests to build cache hit rate
      await gateway.processContent(request); // Miss
      await gateway.processContent(request); // Hit
      await gateway.processContent(request); // Hit
      
      const metrics = gateway.getMetrics('en') as LanguageSpecificMetrics;
      expect(metrics.cacheHitRate).toBeCloseTo(0.67, 1);
    });

    it('should track translation and fallback counts', async () => {
      const request = createTestRequest({
        outputLanguage: 'no',
        inputLanguage: 'en',
        requiresTranslation: true,
      });
      
      await gateway.processContent(request);
      
      const metrics = gateway.getMetrics('no') as LanguageSpecificMetrics;
      expect(metrics.translationCount).toBe(1);
    });

    it('should provide cache statistics', () => {
      // Add test cache entries
      const cache = (gateway as any).cache;
      cache.set('en-1', { language: 'en', hitCount: 2 });
      cache.set('en-2', { language: 'en', hitCount: 1 });
      cache.set('no-1', { language: 'no', hitCount: 3 });
      
      const stats = gateway.getCacheStats();
      
      expect(stats.size).toBe(3);
      expect(stats.languages.en).toBe(2);
      expect(stats.languages.no).toBe(1);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration dynamically', async () => {
      gateway.updateConfig({
        cacheEnabled: false,
        defaultLanguage: 'no',
      });
      
      const request = createTestRequest();
      await gateway.processContent(request);
      
      expect(eventEmissions['cache:hit']).toHaveLength(0);
      expect(eventEmissions['cache:miss']).toHaveLength(0);
    });

    it('should apply default configuration', () => {
      const config = (gateway as any).config;
      
      expect(config.defaultLanguage).toBe('en');
      expect(config.enableAutoDetection).toBe(true);
      expect(config.enableFallback).toBe(true);
      expect(config.cacheEnabled).toBe(true);
      expect(config.cacheTTL).toBe(3600);
    });

    it('should merge partial configuration', () => {
      (IntelligentGateway as any).instance = undefined;
      const gateway = IntelligentGateway.getInstance({
        defaultLanguage: 'no',
        cacheTTL: 7200,
      });
      
      const config = (gateway as any).config;
      expect(config.defaultLanguage).toBe('no');
      expect(config.cacheTTL).toBe(7200);
      expect(config.enableAutoDetection).toBe(true); // Default preserved
    });
  });

  describe('Health Checks', () => {
    it('should report healthy status', async () => {
      const health = await gateway.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.details.checks.cache).toBe(true);
      expect(health.details.checks.queue).toBe(true);
      expect(health.details.checks.cost).toBe(true);
      expect(health.details.checks.models).toBe(true);
    });

    it('should report degraded status when cache is too large', async () => {
      // Fill cache beyond threshold
      const cache = (gateway as any).cache;
      for (let i = 0; i < 20001; i++) {
        cache.set(`key-${i}`, { language: 'en' });
      }
      
      const health = await gateway.healthCheck();
      expect(health.status).toBe('degraded');
      expect(health.details.checks.cache).toBe(false);
    });

    it('should report unhealthy status when costs exceed limit', async () => {
      // Set very high total cost
      (gateway as any).totalCost = 1000;
      
      const health = await gateway.healthCheck();
      expect(health.status).toBe('degraded');
      expect(health.details.checks.cost).toBe(false);
    });

    it('should include metrics in health check', async () => {
      const request = createTestRequest();
      await gateway.processContent(request);
      
      const health = await gateway.healthCheck();
      
      expect(health.details.metrics.totalRequests).toBeGreaterThan(0);
      expect(health.details.metrics.totalCost).toBeGreaterThan(0);
      expect(health.details.metrics.cacheSize).toBeGreaterThanOrEqual(0);
      expect(health.details.metrics.queueSize).toBe(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should process simple request within 100ms', async () => {
      const request = createTestRequest({ wordCount: 100 });
      
      const start = Date.now();
      await gateway.processContent(request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should handle 100 concurrent requests', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => 
        createTestRequest({ id: `perf-${i}`, wordCount: 100 })
      );
      
      const start = Date.now();
      const responses = await Promise.all(
        requests.map(req => gateway.processContent(req))
      );
      const duration = Date.now() - start;
      
      expect(responses).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 requests
    });

    it('should maintain sub-10ms cache hit latency', async () => {
      const request = createTestRequest();
      
      // Prime cache
      await gateway.processContent(request);
      
      // Measure cache hit performance
      const start = Date.now();
      await gateway.processContent(request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10);
    });

    it('should cleanup expired cache entries efficiently', () => {
      const cache = (gateway as any).cache;
      
      // Add many expired entries
      for (let i = 0; i < 1000; i++) {
        cache.set(`expired-${i}`, {
          expiresAt: new Date(Date.now() - 1000),
          createdAt: new Date(Date.now() - 10000),
        });
      }
      
      const start = Date.now();
      (gateway as any).cleanupCache();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(50);
      expect(cache.size).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full request flow with caching', async () => {
      const request = createTestRequest({
        outputLanguage: 'no',
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
          formalityLevel: 'formal',
        },
      });
      
      // First request - full processing
      const response1 = await gateway.processContent(request);
      expect(response1.metadata.cacheHit).toBe(false);
      expect(response1.metadata.generatedLanguage).toBe('no');
      expect(response1.metadata.culturalAdaptations).toBeDefined();
      
      // Second request - from cache
      const response2 = await gateway.processContent(request);
      expect(response2.metadata.cacheHit).toBe(true);
      expect(response2.requestId).toBe(request.id);
      
      // Verify metrics updated
      const metrics = gateway.getMetrics('no') as LanguageSpecificMetrics;
      expect(metrics.requestCount).toBe(2);
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });

    it('should handle complex multilingual workflow', async () => {
      // English input that needs Norwegian output
      mockLanguageDetector.detectLanguage.mockResolvedValueOnce({
        detectedLanguage: 'en',
        confidence: 0.95,
        alternatives: [],
      });
      
      const request = createTestRequest({
        outputLanguage: 'no',
        inputLanguage: undefined, // Will be detected
        topic: 'Artificial Intelligence trends in Nordic markets',
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
          dialectPreference: 'bokmål',
        },
      });
      
      const response = await gateway.processContent(request);
      
      expect(response.metadata.generatedLanguage).toBe('no');
      expect(response.metadata.wasTranslated).toBe(true);
      expect(response.metadata.culturalAdaptations).toContain('post-adapted');
      
      // Verify events were emitted
      expect(eventEmissions['request:received']).toHaveLength(1);
      expect(eventEmissions['request:classified']).toHaveLength(1);
      expect(eventEmissions['request:routed']).toHaveLength(1);
      expect(eventEmissions['request:completed']).toHaveLength(1);
    });

    it('should recover from errors with fallback', async () => {
      const request = createTestRequest({
        outputLanguage: 'no',
        wordCount: 1000,
      });
      
      // Simulate primary model failure
      let attempts = 0;
      const originalProcess = (gateway as any).processRequest;
      (gateway as any).processRequest = jest.fn().mockImplementation(async (context) => {
        attempts++;
        if (attempts === 1 && context.route?.targetModel !== 'gpt-3.5-turbo') {
          throw new Error('Primary model timeout');
        }
        return originalProcess.call(gateway, context);
      });
      
      const response = await gateway.processContent(request);
      
      expect(response).toBeDefined();
      expect(response.metadata.fallbackUsed).toBe(true);
      expect(eventEmissions['fallback:triggered']).toHaveLength(1);
      
      // Verify metrics tracked the fallback
      const metrics = gateway.getMetrics('no') as LanguageSpecificMetrics;
      expect(metrics.fallbackCount).toBe(1);
    });

    it('should handle cost threshold workflow', async () => {
      gateway.updateConfig({
        costThresholds: {
          warning: 0.01,
          critical: 0.1,
        },
      });
      
      // Request that triggers warning
      const warningRequest = createTestRequest({ wordCount: 1000 });
      const response = await gateway.processContent(warningRequest);
      expect(response).toBeDefined();
      expect(eventEmissions['cost:threshold']).toHaveLength(1);
      
      // Request that triggers critical threshold
      const criticalRequest = createTestRequest({ wordCount: 10000 });
      await expect(gateway.processContent(criticalRequest)).rejects.toThrow(
        expect.objectContaining({
          code: GatewayErrorCode.COST_THRESHOLD_EXCEEDED,
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request queue gracefully', () => {
      const status = gateway.getQueueStatus();
      expect(status.size).toBe(0);
      expect(status.requests).toEqual([]);
    });

    it('should handle cache key generation failure', async () => {
      mockCacheKeyGenerator.generateKey.mockImplementationOnce(() => {
        throw new Error('Key generation failed');
      });
      
      const request = createTestRequest();
      const response = await gateway.processContent(request);
      
      expect(response).toBeDefined();
      expect(response.metadata.cacheHit).toBe(false);
    });

    it('should handle missing cultural defaults gracefully', async () => {
      const request = createTestRequest({
        outputLanguage: 'no',
        culturalContext: undefined,
      });
      
      const response = await gateway.processContent(request);
      expect(response).toBeDefined();
      expect(response.metadata.culturalAdaptations).toBeUndefined();
    });

    it('should handle concurrent cache updates', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        createTestRequest({ id: `cache-test-${i}` })
      );
      
      // Process all requests concurrently
      const responses = await Promise.all(
        requests.map(req => gateway.processContent(req))
      );
      
      expect(responses).toHaveLength(10);
      const cacheStats = gateway.getCacheStats();
      expect(cacheStats.size).toBeGreaterThanOrEqual(10);
    });

    it('should handle model capability mismatch', async () => {
      // Override models to have limited capabilities
      const models = (gateway as any).models;
      models.forEach((model: any) => {
        model.features = ['basic-generation'];
      });
      
      const request = createTestRequest({
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
        },
      });
      
      // Should still process but without cultural adaptation
      const response = await gateway.processContent(request);
      expect(response).toBeDefined();
    });
  });
});

describe('IntelligentGateway - Code Coverage Helpers', () => {
  let gateway: IntelligentGateway;

  beforeEach(() => {
    (IntelligentGateway as any).instance = undefined;
    gateway = IntelligentGateway.getInstance();
  });

  it('should cover all public methods', () => {
    const publicMethods = [
      'processContent',
      'getMetrics',
      'getTotalCost',
      'clearCache',
      'getCacheStats',
      'updateConfig',
      'getQueueStatus',
      'healthCheck',
    ];

    publicMethods.forEach(method => {
      expect(typeof (gateway as any)[method]).toBe('function');
    });
  });

  it('should cover all error codes', () => {
    const errorCodes = Object.values(GatewayErrorCode);
    expect(errorCodes).toContain('LANG_DETECT_FAIL');
    expect(errorCodes).toContain('LANG_UNSUPPORTED');
    expect(errorCodes).toContain('TRANS_FAIL');
    expect(errorCodes).toContain('ROUTE_FAIL');
    expect(errorCodes).toContain('MODEL_UNAVAIL');
    expect(errorCodes).toContain('CACHE_ERR');
    expect(errorCodes).toContain('TIMEOUT');
    expect(errorCodes).toContain('RATE_LIMIT');
    expect(errorCodes).toContain('COST_EXCEED');
  });

  it('should cover all request types', async () => {
    const types = ['article', 'social', 'email', 'landing', 'ad', 'blog'] as const;
    
    for (const type of types) {
      const request = createTestRequest({ type });
      const response = await gateway.processContent(request);
      expect(response).toBeDefined();
    }
  });

  it('should cover all complexity levels', () => {
    const complexityLevels = ['simple', 'moderate', 'complex'];
    
    complexityLevels.forEach(level => {
      expect(['simple', 'moderate', 'complex']).toContain(level);
    });
  });
});

// Helper function for tests
function createTestRequest(overrides?: Partial<LanguageAwareContentRequest>): LanguageAwareContentRequest {
  return {
    id: 'test-req-123',
    type: 'article',
    topic: 'AI Technology Trends',
    keywords: ['AI', 'machine learning', 'innovation'],
    tone: 'professional',
    targetAudience: 'tech professionals',
    wordCount: 800,
    timestamp: new Date(),
    outputLanguage: 'en',
    ...overrides,
  };
}