# StoryScale API Documentation

## 🚀 API Overview

StoryScale uses Next.js API routes to provide a RESTful API with real-time capabilities through Supabase. The API follows REST conventions with JWT-based authentication and comprehensive error handling.

**Base URL**: `https://storyscale.app/api` (Production)  
**Base URL**: `http://localhost:3000/api` (Development)

## 🔐 Authentication

### Authentication Methods
```typescript
// Guest sessions (no auth required)
headers: {
  'Content-Type': 'application/json'
  'X-Guest-Session': 'guest-session-id'
}

// Authenticated users
headers: {
  'Authorization': 'Bearer <supabase-jwt-token>'
  'Content-Type': 'application/json'
}
```

### Session Management
- **Guest Sessions**: 30-day localStorage-based sessions
- **Authenticated Sessions**: JWT tokens with automatic refresh
- **Migration**: Automatic data transfer from guest to authenticated

## 📄 Document Management API

### Create Document
```http
POST /api/documents
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "What do you want to share?",
  "purpose": "thought-leadership",
  "goal": "authority-building", 
  "targetAudience": "professionals",
  "tone": "professional",
  "format": "story",
  "enableResearch": true,
  "urlReference": "https://example.com/article",
  "outputLanguage": "no",
  "culturalContext": {
    "formality": "semi-formal",
    "businessNorms": ["jantelov-aware", "consensus-focused"],
    "dialect": "bokmål"
  }
}
```

**Response:**
```json
{
  "id": "doc_123",
  "type": "linkedin",
  "mediaType": "text-only",
  "status": "processing",
  "estimatedTime": "15 seconds",
  "message": "Document creation started"
}
```

### Get Document Status
```http
GET /api/documents/{id}/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "doc_123",
  "status": "completed",
  "progress": 100,
  "results": {
    "content": {
      "short": "Generated short content...",
      "medium": "Generated medium content...", 
      "long": "Generated long content..."
    },
    "selectedLength": "medium",
    "metadata": {
      "characterCount": 1247,
      "purpose": "thought-leadership",
      "format": "story",
      "aiConfidence": 0.89,
      "outputLanguage": "no",
      "contentLanguage": "en",
      "culturalAdaptation": {
        "score": 0.92,
        "adaptations": ["jantelov-compliant", "consensus-focused"],
        "businessTerms": ["samarbeid", "bærekraft", "innovasjon"]
      }
    },
    "sources": [
      {
        "id": "src_456",
        "title": "Article Title",
        "url": "https://example.com/article",
        "type": "article",
        "fullContext": "Complete context from source...",
        "usedSnippets": ["snippet1", "snippet2"],
        "author": "Author Name",
        "date": "2024-08-06"
      }
    ]
  }
}
```

### List Documents
```http
GET /api/documents?limit=20&offset=0&type=linkedin&status=published
Authorization: Bearer <token>
```

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_123",
      "title": "Generated title from content",
      "emoji": "🚀",
      "type": "linkedin",
      "mediaType": "text-only",
      "purpose": "thought-leadership",
      "format": "story",
      "status": "published",
      "characterCount": 1247,
      "createdAt": "2024-08-06T10:30:00Z",
      "lastEdited": "2024-08-06T10:35:00Z",
      "sourceCount": 2,
      "preview": "First 100 characters of content..."
    }
  ],
  "pagination": {
    "total": 47,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Update Document
```http
PATCH /api/documents/{id}
Authorization: Bearer <token>

{
  "content": "Updated content",
  "status": "published",
  "selectedLength": "long"
}
```

### Delete Document
```http
DELETE /api/documents/{id}
Authorization: Bearer <token>
```

## 🧠 AI Generation API

### Generate Content
```http
POST /api/generate
Authorization: Bearer <token>

{
  "input": "Content description",
  "purpose": "thought-leadership",
  "format": "story",
  "tone": "professional",
  "targetAudience": "professionals",
  "model": "gpt-4-turbo",
  "enableResearch": true,
  "lengthVariants": ["short", "medium", "long"]
}
```

**Response:**
```json
{
  "generationId": "gen_789",
  "status": "processing",
  "estimatedTime": 15,
  "message": "Content generation started"
}
```

### Get Generation Status
```http
GET /api/generate/{generationId}/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "gen_789",
  "status": "completed",
  "progress": 100,
  "steps": {
    "input": { "status": "completed", "time": 1.2 },
    "research": { "status": "completed", "time": 8.5 },
    "content": { "status": "completed", "time": 12.3 },
    "optimize": { "status": "completed", "time": 3.1 },
    "enhance": { "status": "completed", "time": 2.8 }
  },
  "results": {
    "content": {
      "short": "Short version...",
      "medium": "Medium version...",
      "long": "Long version..."
    },
    "suggestions": {
      "purpose": [
        { "value": "thought-leadership", "confidence": 0.89 },
        { "value": "value", "confidence": 0.11 }
      ],
      "format": [
        { "value": "story", "confidence": 0.76 },
        { "value": "insight", "confidence": 0.24 }
      ]
    },
    "attribution": {
      "citations": [
        {
          "text": "According to TechCrunch",
          "position": 145,
          "sourceId": "src_456"
        }
      ],
      "sources": [...]
    }
  }
}
```

## 🌍 Multi-Language API Support

### Language Detection
```http
POST /api/language/detect
Content-Type: application/json

{
  "text": "Dette er norsk tekst som skal analyseres"
}
```

**Response:**
```json
{
  "language": "no",
  "confidence": 0.95,
  "supportedLanguages": ["en", "no"],
  "dialect": "bokmål"
}
```

### Norwegian Content Generation
```http
POST /api/generate/norwegian
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Ønsker å skrive om bærekraft i norsk næringsliv",
  "purpose": "thought-leadership",
  "targetAudience": "norske bedriftsledere",
  "tone": "professional",
  "format": "insight",
  "culturalContext": {
    "formality": "semi-formal",
    "businessNorms": ["jantelov-aware", "consensus-focused"],
    "industryFocus": "technology",
    "companySector": "private"
  },
  "norwegianSources": {
    "includeDomains": ["dn.no", "e24.no", "nrk.no"],
    "excludeAnglicisms": true,
    "preferNorwegianTerms": true
  }
}
```

**Response:**
```json
{
  "id": "gen_no_456",
  "content": {
    "text": "Bærekraft er ikke lenger bare et moteord i norsk næringsliv...",
    "language": "no",
    "dialect": "bokmål",
    "characterCount": 1156
  },
  "quality": {
    "grammarScore": 0.96,
    "culturalScore": 0.91,
    "jantelovCompliance": 0.88,
    "businessAppropriate": 0.93,
    "overallScore": 0.92
  },
  "culturalAdaptations": {
    "appliedAdaptations": [
      "Used 'samarbeid' instead of 'collaboration'",
      "Emphasized consensus-building approach",
      "Avoided excessive self-promotion",
      "Referenced Norwegian business values"
    ],
    "norwegianTerms": ["bærekraft", "næringsliv", "samarbeid", "innovasjon"],
    "businessReferences": ["DNB", "Equinor", "Telenor"],
    "culturalContext": "Norwegian flat hierarchy business culture"
  },
  "sources": [
    {
      "title": "Norsk næringsliv satser på bærekraft",
      "url": "https://dn.no/sustainability-article", 
      "domain": "dn.no",
      "language": "no",
      "relevanceScore": 0.87,
      "culturalRelevance": 0.91
    }
  ],
  "metadata": {
    "processingTime": 6.2,
    "modelUsed": "gpt-4-turbo",
    "languagePromptStrategy": "native-norwegian",
    "translationUsed": false
  }
}
```

### Cultural Context Validation
```http
POST /api/validate/cultural
Content-Type: application/json

{
  "content": "Vi er de beste i bransjen og har revolusjonert markedet!",
  "language": "no",
  "context": {
    "businessType": "corporate",
    "targetAudience": "norwegian-professionals"
  }
}
```

**Response:**
```json
{
  "culturalScore": 0.31,
  "issues": [
    {
      "type": "jantelov-violation",
      "severity": "high",
      "message": "Excessive self-promotion detected",
      "suggestion": "Consider more humble phrasing like 'Vi bidrar til utvikling i bransjen'"
    },
    {
      "type": "consensus-oriented",
      "severity": "medium", 
      "message": "Could be more collaborative",
      "suggestion": "Add references to industry collaboration"
    }
  ],
  "suggestions": [
    "Gjennom samarbeid med våre partnere bidrar vi til utvikling i bransjen",
    "Vi er stolte av å være en del av bransjeutviklingen"
  ],
  "improvementScore": 0.85
}
```

### Language Preferences
```http
PUT /api/users/language-preferences
Content-Type: application/json
Authorization: Bearer <token>

{
  "defaultLanguage": "no",
  "culturalContext": {
    "formality": "semi-formal",
    "businessNorms": ["jantelov-aware", "consensus-focused"],
    "dialect": "bokmål"
  },
  "autoDetect": true,
  "norwegianTerminology": "business-standard"
}
```

### Request Parameters for Multi-Language

All generation endpoints now support these additional parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `outputLanguage` | `'en' \| 'no'` | Target output language | `'en'` |
| `contentLanguage` | `'auto' \| 'en' \| 'no'` | Input content language detection | `'auto'` |
| `culturalContext` | `CulturalContext` | Cultural adaptation settings | `null` |
| `norwegianSources` | `NorwegianSourceConfig` | Norwegian-specific research settings | `null` |
| `dialect` | `'bokmål' \| 'nynorsk'` | Norwegian dialect preference | `'bokmål'` |

### Cultural Context Object

```typescript
interface CulturalContext {
  formality: 'formal' | 'semi-formal' | 'informal'
  businessNorms: ('jantelov-aware' | 'consensus-focused' | 'direct-communication')[]
  industryFocus?: string
  companySector?: 'private' | 'public' | 'nonprofit'
  targetRegion?: 'oslo' | 'bergen' | 'trondheim' | 'stavanger' | 'national'
}
```

## 🔍 Research API

### Research Topic
```http
POST /api/research
Authorization: Bearer <token>

{
  "topic": "AI in content creation",
  "providers": ["firecrawl", "tavily"],
  "depth": "balanced",
  "maxSources": 5
}
```

**Response:**
```json
{
  "researchId": "res_101",
  "status": "processing",
  "estimatedTime": 10,
  "message": "Research started"
}
```

### Get Research Results
```http
GET /api/research/{researchId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "res_101",
  "status": "completed",
  "results": {
    "sources": [
      {
        "id": "src_456",
        "title": "The Future of AI Content Creation",
        "url": "https://techcrunch.com/article",
        "type": "article",
        "provider": "firecrawl",
        "fullContext": "Complete article context...",
        "relevantSnippets": ["AI tools are transforming...", "Content creators now..."],
        "author": "Jane Doe",
        "date": "2024-08-01",
        "relevanceScore": 0.92
      }
    ],
    "summary": "Key insights about AI in content creation...",
    "trends": ["automation", "personalization", "efficiency"]
  }
}
```

## 🎯 Pattern Learning API

### Get User Patterns
```http
GET /api/patterns
Authorization: Bearer <token>
```

**Response:**
```json
{
  "patterns": {
    "successfulPosts": [
      {
        "purpose": "thought-leadership",
        "format": "story", 
        "tone": "professional",
        "engagement": 847,
        "characterCount": 1200
      }
    ],
    "templates": [
      {
        "id": "tpl_123",
        "name": "Your Viral Story Format",
        "purpose": "thought-leadership",
        "format": "story",
        "structure": ["hook", "story", "lesson", "cta"],
        "avgEngagement": 650,
        "useCount": 12
      }
    ]
  }
}
```

### Record Post Performance
```http
POST /api/patterns/record
Authorization: Bearer <token>

{
  "documentId": "doc_123",
  "engagement": {
    "likes": 45,
    "comments": 12,
    "shares": 8,
    "total": 65
  },
  "platform": "linkedin"
}
```

## 📊 Analytics API

### Get Dashboard Metrics
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "metrics": {
    "postTypes": {
      "general": { "count": 23, "percentage": 50 },
      "authority": { "count": 15, "percentage": 33 },
      "value": { "count": 8, "percentage": 17 }
    },
    "draftCompletion": {
      "started": 7,
      "completed": 2,
      "pending": 5,
      "completionRate": 0.29
    },
    "timeSaved": {
      "total": 306,
      "avgPerPost": 51,
      "mostProductiveDay": "Friday"
    }
  },
  "recentActivity": [
    {
      "documentId": "doc_123",
      "title": "When OpenAI's CEO Sam Altman says...",
      "status": "published",
      "lastEdited": "4h ago"
    }
  ]
}
```

## 💳 Payment API

### Create Checkout Session
```http
POST /api/payments/checkout
Authorization: Bearer <token>

{
  "priceId": "price_123",
  "successUrl": "https://storyscale.app/success",
  "cancelUrl": "https://storyscale.app/cancel"
}
```

**Response:**
```json
{
  "sessionId": "cs_123",
  "url": "https://checkout.stripe.com/pay/cs_123"
}
```

### Handle Webhook
```http
POST /api/payments/webhook
Stripe-Signature: webhook_signature

{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_123",
      "customer": "cus_123",
      "subscription": "sub_123"
    }
  }
}
```

## 🔧 System API

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-08-06T10:30:00Z",
  "services": {
    "database": "healthy",
    "openai": "healthy", 
    "anthropic": "healthy",
    "firecrawl": "healthy",
    "tavily": "degraded",
    "stripe": "healthy"
  },
  "version": "1.0.0"
}
```

### Get System Configuration
```http
GET /api/config
Authorization: Bearer <token>
```

**Response:**
```json
{
  "aiProviders": {
    "available": ["openai", "anthropic"],
    "models": {
      "openai": ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
      "anthropic": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]
    },
    "defaultModel": "gpt-4"
  },
  "features": {
    "researchEnabled": true,
    "patternLearning": true,
    "templateSuggestions": true
  },
  "limits": {
    "documentsPerMonth": 100,
    "researchCallsPerDay": 50
  }
}
```

## ⚠️ Error Handling

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "purpose",
      "message": "Must be one of: thought-leadership, question, value, authority"
    },
    "requestId": "req_123",
    "timestamp": "2024-08-06T10:30:00Z"
  }
}
```

### Error Codes
- **400 Bad Request**: `VALIDATION_ERROR`, `INVALID_INPUT`
- **401 Unauthorized**: `AUTHENTICATION_REQUIRED`, `INVALID_TOKEN`
- **403 Forbidden**: `INSUFFICIENT_PERMISSIONS`, `QUOTA_EXCEEDED`
- **404 Not Found**: `RESOURCE_NOT_FOUND`
- **429 Too Many Requests**: `RATE_LIMIT_EXCEEDED`
- **500 Internal Server Error**: `INTERNAL_ERROR`, `AI_SERVICE_ERROR`
- **503 Service Unavailable**: `SERVICE_MAINTENANCE`, `EXTERNAL_SERVICE_DOWN`

## 📈 Rate Limits

### Limits by Endpoint
- **Content Generation**: 10 requests per minute per user
- **Research API**: 20 requests per hour per user  
- **Document CRUD**: 100 requests per minute per user
- **Analytics**: 60 requests per minute per user

### Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1628097600
```

## 🧪 Testing & Development

### Mock Mode
Add `X-Mock-Mode: true` header to use mock responses for development.

### Webhooks Testing
Use ngrok or similar tool for local webhook testing:
```bash
ngrok http 3000
# Use the ngrok URL in webhook configuration
```

---

*This API documentation is connected to:*
- *[architecture.md](./architecture.md) - System architecture overview*
- *[database.md](./database.md) - Database schema and queries*
- *[agents.md](./agents.md) - AI agent implementation details*
- *[security.md](./security.md) - Authentication and authorization*