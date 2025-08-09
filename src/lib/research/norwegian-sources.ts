/**
 * Norwegian Source Configuration
 * Comprehensive list of Norwegian business, news, and professional sources
 * with quality ratings, language support, and domain expertise
 */

import { SupportedLanguage } from '../types/language-aware-request';

export type SourceCategory = 
  | 'business' 
  | 'news' 
  | 'professional' 
  | 'government' 
  | 'academic'
  | 'industry'
  | 'social';

export type SourceTier = 'premium' | 'standard' | 'community';

export interface NorwegianSource {
  domain: string;
  name: string;
  category: SourceCategory;
  tier: SourceTier;
  language: SupportedLanguage;
  trustScore: number; // 0-10
  specializations: string[];
  apiSupported: boolean;
  requiresAuth: boolean;
  scrapingAllowed: boolean;
  updateFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
  businessRelevance: number; // 0-10
  culturalAuthenticity: number; // 0-10
  selectors?: {
    title?: string;
    content?: string;
    author?: string;
    date?: string;
    category?: string;
  };
  metadata?: {
    paywall?: boolean;
    rateLimit?: number; // requests per minute
    preferredTime?: string; // Best time to scrape
    backupDomains?: string[];
  };
}

export interface SourceGroup {
  name: string;
  description: string;
  sources: NorwegianSource[];
  priority: number;
  defaultQuota: number; // Max sources to use from group
}

/**
 * Premium Norwegian Business Sources
 */
export const BUSINESS_SOURCES: NorwegianSource[] = [
  {
    domain: 'dn.no',
    name: 'Dagens Næringsliv',
    category: 'business',
    tier: 'premium',
    language: 'no',
    trustScore: 9.5,
    specializations: ['finance', 'economy', 'stocks', 'business-news', 'startups'],
    apiSupported: false,
    requiresAuth: true,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 10,
    culturalAuthenticity: 10,
    selectors: {
      title: 'h1.article-title',
      content: 'div.article-body',
      author: 'span.byline',
      date: 'time.published-date'
    },
    metadata: {
      paywall: true,
      rateLimit: 30,
      preferredTime: '06:00-09:00',
      backupDomains: ['borsen.dk']
    }
  },
  {
    domain: 'e24.no',
    name: 'E24',
    category: 'business',
    tier: 'standard',
    language: 'no',
    trustScore: 8.5,
    specializations: ['economy', 'markets', 'technology', 'real-estate', 'energy'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 9,
    culturalAuthenticity: 9,
    selectors: {
      title: 'h1.article-title',
      content: 'div.article-content',
      author: 'div.byline',
      date: 'time'
    },
    metadata: {
      paywall: false,
      rateLimit: 60,
      preferredTime: '07:00-10:00'
    }
  },
  {
    domain: 'kapital.no',
    name: 'Kapital',
    category: 'business',
    tier: 'premium',
    language: 'no',
    trustScore: 9,
    specializations: ['wealth', 'investments', 'luxury', 'entrepreneurship', 'leadership'],
    apiSupported: false,
    requiresAuth: true,
    scrapingAllowed: true,
    updateFrequency: 'weekly',
    businessRelevance: 9,
    culturalAuthenticity: 9,
    selectors: {
      title: 'h1.entry-title',
      content: 'div.entry-content',
      author: 'span.author',
      date: 'span.date'
    },
    metadata: {
      paywall: true,
      rateLimit: 20,
      preferredTime: '10:00-14:00'
    }
  },
  {
    domain: 'finansavisen.no',
    name: 'Finansavisen',
    category: 'business',
    tier: 'premium',
    language: 'no',
    trustScore: 9,
    specializations: ['finance', 'stocks', 'shipping', 'oil-gas', 'real-estate'],
    apiSupported: false,
    requiresAuth: true,
    scrapingAllowed: true,
    updateFrequency: 'daily',
    businessRelevance: 10,
    culturalAuthenticity: 10,
    metadata: {
      paywall: true,
      rateLimit: 20
    }
  },
  {
    domain: 'hegnar.no',
    name: 'Hegnar Online',
    category: 'business',
    tier: 'standard',
    language: 'no',
    trustScore: 8,
    specializations: ['stocks', 'markets', 'commodities', 'crypto'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 8,
    culturalAuthenticity: 8,
    metadata: {
      rateLimit: 40
    }
  }
];

/**
 * Norwegian News Sources
 */
export const NEWS_SOURCES: NorwegianSource[] = [
  {
    domain: 'nrk.no',
    name: 'NRK',
    category: 'news',
    tier: 'premium',
    language: 'no',
    trustScore: 10,
    specializations: ['national-news', 'politics', 'culture', 'investigative', 'regional'],
    apiSupported: true,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 7,
    culturalAuthenticity: 10,
    selectors: {
      title: 'h1.title',
      content: 'div.article-body',
      author: 'span.author',
      date: 'time'
    },
    metadata: {
      paywall: false,
      rateLimit: 100,
      backupDomains: ['nrk.no/nyheter', 'nrk.no/norge']
    }
  },
  {
    domain: 'vg.no',
    name: 'Verdens Gang',
    category: 'news',
    tier: 'standard',
    language: 'no',
    trustScore: 8,
    specializations: ['breaking-news', 'entertainment', 'sports', 'lifestyle'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 6,
    culturalAuthenticity: 9,
    metadata: {
      paywall: false,
      rateLimit: 80
    }
  },
  {
    domain: 'aftenposten.no',
    name: 'Aftenposten',
    category: 'news',
    tier: 'premium',
    language: 'no',
    trustScore: 9.5,
    specializations: ['politics', 'analysis', 'opinion', 'international', 'oslo'],
    apiSupported: false,
    requiresAuth: true,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 8,
    culturalAuthenticity: 10,
    metadata: {
      paywall: true,
      rateLimit: 30
    }
  },
  {
    domain: 'dagbladet.no',
    name: 'Dagbladet',
    category: 'news',
    tier: 'standard',
    language: 'no',
    trustScore: 7.5,
    specializations: ['news', 'celebrity', 'opinion', 'culture'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 5,
    culturalAuthenticity: 8,
    metadata: {
      rateLimit: 60
    }
  },
  {
    domain: 'tv2.no',
    name: 'TV 2',
    category: 'news',
    tier: 'standard',
    language: 'no',
    trustScore: 8,
    specializations: ['news', 'weather', 'sports', 'regional'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 6,
    culturalAuthenticity: 9,
    metadata: {
      rateLimit: 60
    }
  }
];

/**
 * Professional & Industry Sources
 */
export const PROFESSIONAL_SOURCES: NorwegianSource[] = [
  {
    domain: 'linkedin.com',
    name: 'LinkedIn Norge',
    category: 'professional',
    tier: 'premium',
    language: 'no',
    trustScore: 8,
    specializations: ['professional', 'networking', 'career', 'thought-leadership'],
    apiSupported: true,
    requiresAuth: true,
    scrapingAllowed: false,
    updateFrequency: 'realtime',
    businessRelevance: 9,
    culturalAuthenticity: 7,
    metadata: {
      rateLimit: 10,
      backupDomains: ['linkedin.com/pulse/no/']
    }
  },
  {
    domain: 'digi.no',
    name: 'Digi',
    category: 'industry',
    tier: 'standard',
    language: 'no',
    trustScore: 8.5,
    specializations: ['technology', 'IT', 'digitalization', 'innovation', 'cybersecurity'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'daily',
    businessRelevance: 9,
    culturalAuthenticity: 9,
    metadata: {
      rateLimit: 40
    }
  },
  {
    domain: 'tu.no',
    name: 'Teknisk Ukeblad',
    category: 'industry',
    tier: 'premium',
    language: 'no',
    trustScore: 9,
    specializations: ['engineering', 'construction', 'energy', 'environment', 'technology'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'daily',
    businessRelevance: 8,
    culturalAuthenticity: 10,
    metadata: {
      rateLimit: 40
    }
  },
  {
    domain: 'kode24.no',
    name: 'Kode24',
    category: 'industry',
    tier: 'standard',
    language: 'no',
    trustScore: 7.5,
    specializations: ['programming', 'software', 'developers', 'tech-culture'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'daily',
    businessRelevance: 7,
    culturalAuthenticity: 8,
    metadata: {
      rateLimit: 60
    }
  },
  {
    domain: 'shifter.no',
    name: 'Shifter',
    category: 'professional',
    tier: 'standard',
    language: 'no',
    trustScore: 8,
    specializations: ['startups', 'entrepreneurship', 'innovation', 'venture'],
    apiSupported: false,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'weekly',
    businessRelevance: 9,
    culturalAuthenticity: 9,
    metadata: {
      rateLimit: 40
    }
  }
];

/**
 * Government & Official Sources
 */
export const GOVERNMENT_SOURCES: NorwegianSource[] = [
  {
    domain: 'regjeringen.no',
    name: 'Regjeringen',
    category: 'government',
    tier: 'premium',
    language: 'no',
    trustScore: 10,
    specializations: ['policy', 'regulations', 'announcements', 'white-papers'],
    apiSupported: true,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'daily',
    businessRelevance: 8,
    culturalAuthenticity: 10,
    metadata: {
      rateLimit: 100
    }
  },
  {
    domain: 'ssb.no',
    name: 'Statistisk sentralbyrå',
    category: 'government',
    tier: 'premium',
    language: 'no',
    trustScore: 10,
    specializations: ['statistics', 'demographics', 'economy', 'research', 'data'],
    apiSupported: true,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'monthly',
    businessRelevance: 9,
    culturalAuthenticity: 10,
    metadata: {
      rateLimit: 100
    }
  },
  {
    domain: 'nav.no',
    name: 'NAV',
    category: 'government',
    tier: 'premium',
    language: 'no',
    trustScore: 10,
    specializations: ['employment', 'welfare', 'pensions', 'benefits', 'labor-market'],
    apiSupported: true,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'weekly',
    businessRelevance: 7,
    culturalAuthenticity: 10,
    metadata: {
      rateLimit: 100
    }
  },
  {
    domain: 'brreg.no',
    name: 'Brønnøysundregistrene',
    category: 'government',
    tier: 'premium',
    language: 'no',
    trustScore: 10,
    specializations: ['business-registry', 'company-data', 'ownership', 'financial-reports'],
    apiSupported: true,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'realtime',
    businessRelevance: 10,
    culturalAuthenticity: 10,
    metadata: {
      rateLimit: 50
    }
  },
  {
    domain: 'norges-bank.no',
    name: 'Norges Bank',
    category: 'government',
    tier: 'premium',
    language: 'no',
    trustScore: 10,
    specializations: ['monetary-policy', 'interest-rates', 'oil-fund', 'currency'],
    apiSupported: true,
    requiresAuth: false,
    scrapingAllowed: true,
    updateFrequency: 'daily',
    businessRelevance: 10,
    culturalAuthenticity: 10,
    metadata: {
      rateLimit: 100
    }
  }
];

/**
 * Source Groups for organized access
 */
export const SOURCE_GROUPS: SourceGroup[] = [
  {
    name: 'Premium Business',
    description: 'High-quality Norwegian business and financial sources',
    sources: BUSINESS_SOURCES.filter(s => s.tier === 'premium'),
    priority: 1,
    defaultQuota: 3
  },
  {
    name: 'National News',
    description: 'Major Norwegian news outlets',
    sources: NEWS_SOURCES.filter(s => s.trustScore >= 8),
    priority: 2,
    defaultQuota: 2
  },
  {
    name: 'Industry Specific',
    description: 'Specialized industry and professional sources',
    sources: PROFESSIONAL_SOURCES,
    priority: 3,
    defaultQuota: 2
  },
  {
    name: 'Government & Official',
    description: 'Official Norwegian government and institutional sources',
    sources: GOVERNMENT_SOURCES,
    priority: 4,
    defaultQuota: 1
  },
  {
    name: 'Community & Social',
    description: 'Community-driven and social media sources',
    sources: [...PROFESSIONAL_SOURCES.filter(s => s.domain.includes('linkedin'))],
    priority: 5,
    defaultQuota: 1
  }
];

/**
 * Get all Norwegian sources
 */
export function getAllNorwegianSources(): NorwegianSource[] {
  return [
    ...BUSINESS_SOURCES,
    ...NEWS_SOURCES,
    ...PROFESSIONAL_SOURCES,
    ...GOVERNMENT_SOURCES
  ];
}

/**
 * Get sources by category
 */
export function getSourcesByCategory(category: SourceCategory): NorwegianSource[] {
  return getAllNorwegianSources().filter(s => s.category === category);
}

/**
 * Get sources by specialization
 */
export function getSourcesBySpecialization(specialization: string): NorwegianSource[] {
  return getAllNorwegianSources().filter(s => 
    s.specializations.includes(specialization.toLowerCase())
  );
}

/**
 * Get premium sources only
 */
export function getPremiumSources(): NorwegianSource[] {
  return getAllNorwegianSources().filter(s => s.tier === 'premium');
}

/**
 * Get sources suitable for a topic
 */
export function getSourcesForTopic(topic: string, maxSources: number = 5): NorwegianSource[] {
  const topicLower = topic.toLowerCase();
  const sources = getAllNorwegianSources();
  
  // Score sources based on relevance to topic
  const scoredSources = sources.map(source => {
    let score = 0;
    
    // Check specializations
    source.specializations.forEach(spec => {
      if (topicLower.includes(spec) || spec.includes(topicLower)) {
        score += 3;
      }
    });
    
    // Check category relevance
    if (topicLower.includes('business') && source.category === 'business') score += 2;
    if (topicLower.includes('news') && source.category === 'news') score += 2;
    if (topicLower.includes('tech') && source.category === 'industry') score += 2;
    if (topicLower.includes('government') && source.category === 'government') score += 2;
    
    // Boost for trust score
    score += source.trustScore / 2;
    
    // Boost for business relevance
    score += source.businessRelevance / 3;
    
    return { source, score };
  });
  
  // Sort by score and return top sources
  return scoredSources
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSources)
    .map(item => item.source);
}

/**
 * Domain to source mapping for quick lookup
 */
export const DOMAIN_MAP: Map<string, NorwegianSource> = new Map(
  getAllNorwegianSources().map(source => [source.domain, source])
);

/**
 * Check if a domain is a known Norwegian source
 */
export function isNorwegianSource(domain: string): boolean {
  return DOMAIN_MAP.has(domain);
}

/**
 * Get source metadata by domain
 */
export function getSourceByDomain(domain: string): NorwegianSource | undefined {
  return DOMAIN_MAP.get(domain);
}