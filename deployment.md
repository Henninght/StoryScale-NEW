# StoryScale Deployment Guide

## 🚀 Deployment Overview

StoryScale is deployed using **Vercel** for the frontend and API, **Supabase** for the database and authentication, and **Stripe** for payment processing. The architecture supports automatic deployments with comprehensive monitoring and rollback capabilities.

**Deployment Stack:**
- **Frontend & API**: Vercel (Edge Functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Monitoring**: Vercel Analytics + Custom metrics
- **Error Tracking**: Built-in error boundaries + logging

## 🌍 Environment Configuration

### Environment Variables

#### Core Application
```bash
# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://storyscale.app
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

#### AI Providers
```bash
# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_ORG_ID=org-your-org-id

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Research APIs
FIRECRAWL_API_KEY=fc-your-firecrawl-key
TAVILY_API_KEY=tvly-your-tavily-key
```

#### Payment Processing
```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

#### Security & Monitoring
```bash
# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-character-encryption-key
NEXTAUTH_SECRET=your-nextauth-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-analytics-id
```

### Environment Setup by Stage

#### Development (.env.local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
# Use development API keys with lower rate limits
OPENAI_API_KEY=sk-your-dev-openai-key
```

#### Staging (.env.staging)
```bash
NEXT_PUBLIC_APP_URL=https://staging.storyscale.app
NEXT_PUBLIC_ENVIRONMENT=staging
# Use staging database and API keys
```

#### Production (.env.production)
```bash
NEXT_PUBLIC_APP_URL=https://storyscale.app
NEXT_PUBLIC_ENVIRONMENT=production
# Use production database and API keys with full rate limits
```

## 📦 Vercel Deployment Configuration

### vercel.json
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/dashboard",
      "destination": "/workspace",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/api/webhooks/stripe",
      "destination": "/api/payments/webhook"
    }
  ]
}
```

### Build Configuration

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Optimize for production
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js', 'openai'],
  },
  
  // Bundle analysis
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, './'),
      }
    }
    return config
  },
  
  // Image optimization
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

#### package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "db:migrate": "supabase db push",
    "db:seed": "supabase db seed",
    "analyze": "cross-env ANALYZE=true next build"
  }
}
```

## 🗄️ Database Deployment (Supabase)

### Migration Strategy
```sql
-- migrations/001_initial_schema.sql
-- Run migrations in order
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables (see database.md for full schema)
-- Enable RLS
-- Create indexes
-- Set up functions
```

### Supabase Configuration

#### supabase/config.toml
```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
site_url = "https://storyscale.app"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 3600
password_min_length = 8

[auth.external.google]
enabled = true
client_id = "your-google-client-id"
secret = "your-google-client-secret"
redirect_uri = "https://your-project.supabase.co/auth/v1/callback"

[db]
port = 54322
shadow_port = 54320
max_connections = 100

[storage]
enabled = true
file_size_limit = "50MiB"
```

### Database Deployment Steps
```bash
# 1. Link to project
supabase link --project-ref your-project-ref

# 2. Run migrations
supabase db push

# 3. Seed data (optional)
supabase db seed

# 4. Generate types
supabase gen types typescript --local > types/supabase.ts

# 5. Deploy functions (if any)
supabase functions deploy
```

## 💳 Stripe Configuration

### Webhook Configuration
```bash
# Create webhook endpoint in Stripe Dashboard
# URL: https://storyscale.app/api/payments/webhook
# Events: 
# - checkout.session.completed
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed
```

### Product Configuration
```javascript
// Stripe Products & Prices (configure in Stripe Dashboard)
const products = {
  free: {
    name: 'Free Plan',
    features: ['10 documents/month', 'Basic AI models', 'Standard support']
  },
  pro: {
    name: 'Pro Plan', 
    price: '$29/month',
    features: ['Unlimited documents', 'All AI models', 'Research integration', 'Pattern learning']
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: '$99/month', 
    features: ['Everything in Pro', 'Custom integrations', 'Priority support', 'Team collaboration']
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1

  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=staging --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Staging
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Run Database Migrations
        run: |
          npm install -g supabase
          supabase db push --db-url ${{ secrets.DATABASE_URL }}
```

### Pre-deploy Checks

#### .github/workflows/pre-deploy.yml
```yaml
name: Pre-deploy Checks

on:
  pull_request:
    branches: [main, staging]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

  performance-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Bundle size check
        run: |
          npm ci
          npm run build
          npx bundlesize

  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check outdated dependencies
        run: npm outdated --json > outdated.json || true
      
      - name: Validate dependencies
        run: |
          # Check for known vulnerabilities
          npm audit --audit-level moderate
```

## 📊 Monitoring & Observability

### Health Check Endpoint

#### app/api/health/route.ts
```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const startTime = Date.now()
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    services: {} as Record<string, string>
  }
  
  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    health.services.database = dbError ? 'unhealthy' : 'healthy'
    
    // Check AI providers
    health.services.openai = await checkOpenAI() ? 'healthy' : 'degraded'
    health.services.anthropic = await checkAnthropic() ? 'healthy' : 'degraded'
    
    // Check external APIs
    health.services.firecrawl = await checkFirecrawl() ? 'healthy' : 'degraded'
    health.services.tavily = await checkTavily() ? 'healthy' : 'degraded'
    health.services.stripe = await checkStripe() ? 'healthy' : 'degraded'
    
  } catch (error) {
    health.status = 'unhealthy'
    health.services.error = error.message
  }
  
  const responseTime = Date.now() - startTime
  
  return NextResponse.json({
    ...health,
    responseTime
  }, {
    status: health.status === 'healthy' ? 200 : 503
  })
}
```

### Custom Metrics

#### lib/metrics.ts
```typescript
export class MetricsCollector {
  private static instance: MetricsCollector
  
  static getInstance(): MetricsCollector {
    if (!this.instance) {
      this.instance = new MetricsCollector()
    }
    return this.instance
  }
  
  // Track API performance
  trackApiCall(endpoint: string, duration: number, success: boolean) {
    const metric = {
      name: 'api_call',
      endpoint,
      duration,
      success,
      timestamp: Date.now()
    }
    
    this.sendMetric(metric)
  }
  
  // Track AI agent performance
  trackAgentExecution(agent: string, duration: number, tokens: number) {
    const metric = {
      name: 'agent_execution',
      agent,
      duration,
      tokens,
      timestamp: Date.now()
    }
    
    this.sendMetric(metric)
  }
  
  // Track user actions
  trackUserAction(action: string, userId: string, metadata: Record<string, any>) {
    const metric = {
      name: 'user_action',
      action,
      userId,
      metadata,
      timestamp: Date.now()
    }
    
    this.sendMetric(metric)
  }
  
  private sendMetric(metric: any) {
    // Send to analytics service (could be custom endpoint, Posthog, etc.)
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(err => console.warn('Failed to send metric:', err))
  }
}
```

### Error Tracking

#### lib/error-tracking.ts
```typescript
export class ErrorTracker {
  static captureException(error: Error, context?: Record<string, any>) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location?.href,
      userAgent: navigator?.userAgent,
      context
    }
    
    // Send to error tracking service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(console.warn)
  }
  
  static captureMessage(message: string, level: 'info' | 'warning' | 'error') {
    const report = {
      message,
      level,
      timestamp: new Date().toISOString(),
      url: window.location?.href
    }
    
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    }).catch(console.warn)
  }
}
```

## 🛡️ Security Deployment

### Security Headers (middleware.ts)
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' *.supabase.co *.stripe.com;"
    )
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### API Rate Limiting
```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 3600 // 1 hour
) {
  const key = `rate_limit:${identifier}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, window)
  }
  
  return {
    success: count <= limit,
    count,
    limit,
    remaining: Math.max(0, limit - count),
    resetTime: Date.now() + (window * 1000)
  }
}
```

## 🔄 Rollback Procedures

### Automated Rollback
```bash
# Vercel automatic rollback on health check failure
vercel rollback --token=$VERCEL_TOKEN

# Manual rollback to specific deployment
vercel rollback [deployment-url] --token=$VERCEL_TOKEN
```

### Database Rollback
```sql
-- Create rollback migration
-- migrations/002_rollback_feature.sql
BEGIN;

-- Rollback schema changes
DROP TABLE IF EXISTS new_feature_table;
ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column;

-- Verify rollback
SELECT COUNT(*) FROM critical_table;

COMMIT;
```

### Emergency Procedures
```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 Emergency rollback initiated"

# 1. Stop processing (maintenance mode)
vercel env add MAINTENANCE_MODE true --token=$VERCEL_TOKEN

# 2. Rollback to last known good deployment
LAST_GOOD_DEPLOYMENT=$(vercel list --token=$VERCEL_TOKEN | head -2 | tail -1 | awk '{print $1}')
vercel rollback $LAST_GOOD_DEPLOYMENT --token=$VERCEL_TOKEN

# 3. Verify health
sleep 30
HEALTH_STATUS=$(curl -s https://storyscale.app/api/health | jq -r '.status')

if [ "$HEALTH_STATUS" = "healthy" ]; then
  echo "✅ Rollback successful"
  vercel env rm MAINTENANCE_MODE --token=$VERCEL_TOKEN
else
  echo "❌ Rollback failed - manual intervention required"
  # Alert team
fi
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] All tests pass (unit, integration, e2e)
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Stripe webhooks configured

### Deployment
- [ ] Deploy to staging first
- [ ] Verify staging functionality
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify production health checks
- [ ] Monitor error rates for 30 minutes

### Post-deployment
- [ ] Verify all critical user flows
- [ ] Check payment processing
- [ ] Monitor AI agent performance
- [ ] Verify database connectivity
- [ ] Update monitoring dashboards
- [ ] Notify team of successful deployment

---

*This deployment documentation is connected to:*
- *[architecture.md](./architecture.md) - System architecture overview*
- *[security.md](./security.md) - Security implementation details*
- *[database.md](./database.md) - Database deployment procedures*
- *[testing.md](./testing.md) - Testing strategies and CI/CD integration*