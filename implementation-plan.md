# 🚀 StoryScale Implementation Plan for Claude Code (Updated August 2025)

## Executive Summary
StoryScale is an AI-powered content studio for creating professional LinkedIn posts, blogs, and marketing copy in under 15 seconds. The project uses Next.js 14, TypeScript, Supabase, and multi-provider AI integration (OpenAI + Anthropic).

**⚠️ IMPORTANT: Updated Architecture** 
Based on expert system-architect, backend-engineer, and product-manager analysis, this implementation plan now reflects the **new 3-layer function-based architecture** instead of the original 6-agent orchestration system for better performance (4-6s vs 15-30s) and maintainability.

**Important Files to Reference:**
- **UPDATED** Architecture: `/storyscale-v3/architecture.md` (now shows 3-layer system)
- **UPDATED** AI Processing: `/storyscale-v3/agents.md` (now shows function composition)  
- Database Schema: `/storyscale-v3/database.md`
- API Specs: `/storyscale-v3/api.md`
- Design Screenshots: `/storyscale-v3/design-reference/`
- Development Guide: `/storyscale-v3/claude.md`

## Phase 1: Foundation & Intelligent Gateway (Week 1)

### 🎯 Updated Focus: Build 3-Layer Architecture Foundation

### 1.1 Project Initialization
- [✅] Run `npx create-next-app@14 storyscale --typescript --tailwind --app --src-dir --import-alias "@/*"` to initialize Next.js 14 with TypeScript and App Router
- [✅] Configure `tsconfig.json` with strict mode: `"strict": true, "noImplicitAny": true, "strictNullChecks": true`
- [✅] Install core dependencies: `npm install @supabase/supabase-js @supabase/auth-helpers-nextjs openai anthropic-ai/sdk stripe @radix-ui/react-* clsx tailwind-merge`
- [✅] Create the exact folder structure from `/storyscale-v3/architecture.md` lines 273-295:
  ```
  /src
  ├── app/                    # Next.js App Router
  │   ├── api/               # API endpoints
  │   ├── workspace/         # Main application
  │   └── (marketing)/       # Landing pages
  ├── components/            # React components
  │   ├── ui/               # Base UI components
  │   ├── wizard/           # Content wizards
  │   └── workspace/        # Workspace features
  ├── lib/                   # Core libraries
  │   ├── agents/           # AI agent system
  │   ├── providers/        # External services
  │   └── database/         # Supabase client
  ├── hooks/                # Custom React hooks
  └── types/                # TypeScript types
  ```

### 1.2 Database & Authentication
- [✅] Create a new Supabase project at https://app.supabase.com
- [✅] Copy all SQL from `/storyscale-v3/database.md` lines 82-633 and execute in Supabase SQL editor to create complete schema
- [✅] Enable Google OAuth in Supabase Authentication settings with redirect URLs
- [✅] Implement Row Level Security policies from `/storyscale-v3/database.md` lines 459-509
- [✅] Create migration file `supabase/migrations/001_initial_schema.sql` with all tables
- [✅] Test guest session creation with localStorage implementation: `localStorage.setItem('guest_session_id', crypto.randomUUID())`

### 1.3 Core Infrastructure
- [✅] Create `/src/lib/database/supabase.ts` with client configuration using environment variables from `.env.local`:
  ```typescript
  // Reference claude.md for environment variables needed
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [✅] Implement error boundary in `/src/app/error.tsx` and `/src/app/global-error.tsx`
- [✅] Create authentication middleware in `/src/middleware.ts` that checks for both guest sessions and authenticated users
- [✅] Set up API route structure matching `/storyscale-v3/api.md` endpoints (lines 33-527)
- [✅] Test database connection with health check API endpoint
- [✅] Create OAuth callback handler in `/src/app/auth/callback/route.ts`

## Phase 1: Foundation & Intelligent Gateway (Week 1) - UPDATED

### 🎯 Updated Implementation Approach
**CRITICAL CHANGE**: Based on expert analysis from system-architect, backend-engineer, and product-manager agents, this plan now implements the **3-layer function-based architecture** from `/agent-report-updated-0808.md` for superior performance and maintainability.

### Week 1: Foundation Layer (Lower Risk)
```yaml
Priority: P0 (Critical)
Tasks:
  - Build Intelligent Gateway (routing + caching + cost tracking)
  - Implement Research Function (enhanced with caching)  
  - Create basic Generate Function (unified prompting)
  - Deploy with 10% traffic rollout

Success Criteria:
  - 30% performance improvement on routed traffic
  - 25% cost reduction through caching
  - Zero errors on fallback to existing system
```

## Phase 2: Processing Functions (Week 2) - UPDATED

### Week 2: Processing Functions (Medium Risk)  
```yaml
Priority: P1 (High Value)
Tasks:
  - Complete Generate Function (all content types)
  - Implement Optimize Function (platform-specific)
  - Add Validate Function (quality scoring)
  - Scale to 25% traffic

Success Criteria:
  - 60% performance improvement on new pipeline
  - 40% cost reduction through optimization
  - <5% error rate with graceful fallbacks
```

## Phase 3: Intelligence Services (Week 3) - UPDATED

### Week 3: Intelligence Services (Strategic)
```yaml
Priority: P2 (Strategic Value)  
Tasks:
  - Deploy PatternDB (vector similarity search)
  - Add QualityModel (ML-based scoring)
  - Implement advanced caching strategies
  - Scale to 50% traffic

Success Criteria:
  - 75% first-generation acceptance rate
  - Pattern learning showing measurable improvements
  - 45% cache hit rate achieved
```

## Phase 4: Production Optimization (Week 4) - UPDATED

### Week 4: Production Optimization (Operational)
```yaml
Priority: P1 (Operational Readiness)
Tasks:
  - Load testing and performance tuning
  - Complete monitoring and alerting
  - Documentation and team training  
  - Full production rollout (100%)

Success Criteria:
  - All performance targets met consistently
  - Comprehensive monitoring in place
  - Team fully trained on new system
```

## 🔧 TECHNICAL IMPLEMENTATION (Updated Architecture)

### Function Composition Over Agent Orchestration
```python
# New approach - Function composition:
async def process_request(request: ContentRequest) -> ContentResponse:
    # Smart routing
    route = await intelligent_gateway.classify_and_route(request)
    
    if route.cached:
        return route.cached_response
    
    # Parallel function execution
    tasks = []
    if route.needs_research:
        tasks.append(research_function(request))
    
    tasks.append(generate_function(request))
    
    # Compose results
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Apply optimizations and validation
    content = await compose_and_optimize(results, request)
    quality_score = await validate_function(content)
    
    if quality_score < 0.7:
        # Trigger regeneration with feedback
        content = await regenerate_with_feedback(request, quality_score)
    
    return ContentResponse(content=content, metadata=build_metadata(results))
```

### Multi-Layer Caching Strategy
```yaml
caching_strategy:
  L1_memory: 
    purpose: "Request deduplication"
    ttl: "5 minutes"
    hit_rate_target: "15%"
  
  L2_redis:
    purpose: "Research results & patterns" 
    ttl: "24 hours"
    hit_rate_target: "25%"
    
  L3_cdn:
    purpose: "Common templates & responses"
    ttl: "7 days" 
    hit_rate_target: "10%"
    
total_cache_hit_rate: "50% (vs 45% original target)"
```

### 2.1 🚀 Intelligent Gateway Implementation
- [ ] Create `/src/lib/gateway/intelligent-gateway.ts` with request classification and smart routing
- [ ] Implement 3-layer cache system in `/src/lib/cache/multi-layer-cache.ts`:
  - [ ] L1 Memory cache (5 min TTL, 15% hit rate target)
  - [ ] L2 Redis cache (24 hour TTL, 25% hit rate target) 
  - [ ] L3 CDN cache (7 day TTL, 10% hit rate target)
- [ ] Create cost tracking in `/src/lib/monitoring/cost-guardian.ts`
- [ ] Add environment variables to `.env.local`:
  ```
  OPENAI_API_KEY=
  ANTHROPIC_API_KEY=
  FIRECRAWL_API_KEY=
  TAVILY_API_KEY=
  REDIS_URL=
  ```
- [ ] ✅ **Success Check**: 30% performance improvement + 25% cost reduction

### 2.2 🔧 Processing Functions Implementation  
- [ ] Create `/src/lib/functions/research-function.ts` with intelligent caching (24h TTL)
- [ ] Implement `/src/lib/functions/generate-function.ts` - unified content generation
- [ ] Build `/src/lib/functions/optimize-function.ts` for platform-specific optimization
- [ ] Create `/src/lib/functions/validate-function.ts` with quality scoring (>0.7 threshold)
- [ ] Implement `/src/lib/functions/composer.ts` for parallel execution and result composition
- [ ] Create hybrid processor in `/src/lib/processors/hybrid-processor.ts` with feature flags
- [ ] ✅ **Success Check**: 60% performance improvement + 40% cost reduction

### 2.3 🔍 Research & Attribution Integration
- [ ] Integrate research function with Firecrawl and Tavily APIs
- [ ] Implement source tracking using sources table schema from database.md lines 176-214
- [ ] Create citation insertion with "According to..." pattern integration
- [ ] Build research cache deduplication using `cache_key` field
- [ ] Test research attribution with full source context and snippet tracking
- [ ] ✅ **Success Check**: Research integration working with proper attribution

## Phase 3: Intelligence Services (Week 3) - UPDATED

### 3.1 🧠 Pattern Database & Learning
- [ ] Deploy PatternDB using vector similarity search (Pinecone/Weaviate)
- [ ] Implement pattern mining from successful content (engagement >500 = successful)
- [ ] Create template generation from user patterns in `user_patterns` table
- [ ] Build pattern confidence scoring (minimum 3 similar posts required)
- [ ] Add smart defaults that pre-select dropdowns based on top 3 user patterns
- [ ] ✅ **Success Check**: Pattern learning showing measurable content improvements

### 3.2 🎯 Quality Model & Validation
- [ ] Implement ML-based content scoring with >0.7 quality threshold
- [ ] Create content coherence validation
- [ ] Add brand voice consistency checks
- [ ] Build automatic regeneration trigger for low-quality scores
- [ ] Test quality gate preventing poor outputs from reaching users
- [ ] ✅ **Success Check**: 75% first-generation acceptance rate achieved

### 3.3 📊 Advanced Caching & Performance
- [ ] Implement advanced caching strategies across all 3 layers
- [ ] Create cache warming procedures for common requests
- [ ] Build cache invalidation strategies for pattern updates
- [ ] Add cache performance monitoring and optimization
- [ ] Scale system to handle 50% traffic on new pipeline
- [ ] ✅ **Success Check**: 45% cache hit rate achieved consistently

## Phase 4: User Interface & Experience (Week 4) - UPDATED

### 4.1 🎨 Content Creation Wizard
- [ ] Create wizard component `/src/components/wizard/content-wizard.tsx` with 4 steps matching `/storyscale-v3/design-reference/wizard/`
- [ ] Step 1: Content & Purpose - Large textarea + AI-powered dropdowns
- [ ] Step 2: Audience & Style - Selection cards with recommendations
- [ ] Step 3: Research & Enhancement - Toggle switches for optional features
- [ ] Step 4: Summary & Action - Review layout with generation button
- [ ] Implement progress bar with blue (#5B6FED) active states
- [ ] Connect to intelligent gateway for request routing and caching
- [ ] ✅ **Success Check**: Full wizard integration with new architecture

### 4.2 ✏️ Edit & Refine Tool
- [ ] Create edit tool layout matching `/storyscale-v3/design-reference/tools/edit-and-refine-tool1.png`
- [ ] Implement 380px configuration sidebar with purple (#8B5CF6) Enhance button
- [ ] Build real-time editor with character counter and quality indicators
- [ ] Connect to validate_function for real-time quality scoring
- [ ] Add version history using documents table timestamp tracking
- [ ] ✅ **Success Check**: Edit tool integrated with quality validation

### 4.3 📁 Document Management & Performance
- [ ] Create document CRUD API routes in `/src/app/api/documents/route.ts`
- [ ] Implement document search and filtering with performance optimization
- [ ] Build document analytics showing generation times and quality scores
- [ ] Add export functionality for generated content
- [ ] Create document sharing and collaboration features
- [ ] ✅ **Success Check**: Complete document management with performance tracking
- [ ] Implement full-text search using the `search_vector` column from database.md lines 151-158
- [ ] Create document status management (draft/published/archived) with status pills UI
- [ ] Build source attribution display component showing research sources in a dedicated tab
- [ ] Add document list view matching `/storyscale-v3/design-reference/dashboard/Dasboard2-with-content.png`

## Phase 5: Production Deployment & Monitoring

### 5.1 🚀 Load Testing & Performance Tuning
- [ ] Conduct load testing on all 3 architecture layers
- [ ] Validate <1s response time for cached requests (50% of traffic)
- [ ] Confirm 4-6s response time for complex requests
- [ ] Test concurrent user load and scaling behavior
- [ ] Optimize bottlenecks identified during testing
- [ ] ✅ **Success Check**: All performance targets met consistently

### 5.2 📊 Monitoring & Alerting Setup
- [ ] Implement comprehensive monitoring for intelligent gateway
- [ ] Set up cost tracking alerts and budget controls
- [ ] Create performance monitoring for processing functions
- [ ] Build quality metrics tracking and reporting
- [ ] Add cache hit rate monitoring and optimization alerts
- [ ] ✅ **Success Check**: Complete monitoring visibility in place

### 5.3 📚 Documentation & Team Training
- [ ] Create technical documentation for new 3-layer architecture
- [ ] Build troubleshooting guides for function-based processing
- [ ] Train team on new intelligent gateway and caching systems
- [ ] Document deployment and rollback procedures
- [ ] Create performance optimization playbooks
- [ ] ✅ **Success Check**: Team fully trained on new system

### 5.4 🌍 Full Production Rollout
- [ ] Complete gradual traffic migration to 100% on new pipeline
- [ ] Validate all success criteria achieved
- [ ] Implement final monitoring and alerting
- [ ] Complete documentation handover
- [ ] Celebrate successful architecture transformation! 🎉
- [ ] ✅ **Success Check**: Full production rollout completed successfully
- [ ] **Use frontend-architect sub-agent** to design optimal component hierarchy and state management
- [ ] Create main workspace layout `/src/app/workspace/layout.tsx` with exact dimensions from `/storyscale-v3/design-reference/readme.md` lines 89-100
- [ ] Implement 240px fixed sidebar with light gray (#F9FAFB) background matching dashboard screenshots
- [ ] Add sidebar navigation items: Dashboard, LinkedIn Tools (with submenu), Settings
- [ ] Create orange "Tools" dropdown button (#E85D2F) in top-right corner as shown in screenshots
- [ ] Implement content area that switches between Wizard, Editor, and Dashboard views
- [ ] Add responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- [ ] Test all interactive states (hover, focus, active) match design tokens from design-reference/readme.md lines 44-73

### 4.2 Dashboard & Analytics
- [ ] Create dashboard layout matching `/storyscale-v3/design-reference/dashboard/Dasboard1.png` for empty state
- [ ] Implement 3 metric cards with exact styling: white background, subtle shadow `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- [ ] Build data table matching `Dasboard2-with-content.png` with hover states and status pills
- [ ] Create analytics calculations using the `document_performance` table from database.md lines 309-344
- [ ] Implement time saved metric: average 51 minutes per post (reference api.md lines 374)
- [ ] Add post type distribution chart showing percentages (general, authority, value)
- [ ] Create "Recent Activity" section with last edited timestamps

### 4.3 Progressive Enhancement
- [ ] Implement guest mode in `/src/lib/auth/guest-session.ts` using localStorage with 30-day expiry
- [ ] Create migration flow in `/src/lib/auth/migration.ts` using function from database.md lines 513-608
- [ ] Build seamless upgrade prompt when guest user wants to save >10 documents
- [ ] Implement session management with automatic data sync for authenticated users
- [ ] Add guest session cleanup job that runs daily (reference database.md lines 613-633)
- [ ] Test data persistence across guest → authenticated transition

## Phase 5: Advanced Features (Week 5)

### 5.1 Pattern Learning
- [ ] Implement pattern analysis in `/src/lib/patterns/analyzer.ts` using schema from database.md lines 225-261
- [ ] Create successful post detection: engagement > 500 = successful (store in `user_patterns` table)
- [ ] Build template generation from patterns in `/src/lib/patterns/template-generator.ts` (reference database.md lines 263-306)
- [ ] Implement preference learning that tracks: purpose, format, tone, character count preferences
- [ ] Create smart defaults that pre-select dropdowns based on user's top 3 patterns
- [ ] Add pattern confidence scoring: require minimum 3 similar posts before suggesting template
- [ ] Test pattern matching with the SQL query from database.md lines 691-705

### 5.2 Performance Optimization
- [ ] Implement API response caching using Redis with TTLs from database.md lines 419-454
- [ ] Configure Next.js Image component for all images with automatic WebP conversion
- [ ] Set up route-based code splitting in `next.config.js` with dynamic imports
- [ ] Add lazy loading for wizard steps: `const Step2 = lazy(() => import('./step2'))`
- [ ] Implement SWR for data fetching with 5-minute cache: `useSWR(key, fetcher, { refreshInterval: 300000 })`
- [ ] Create bundle analyzer setup: `npm install @next/bundle-analyzer`
- [ ] Target metrics: <2s page load, <500ms API response (reference architecture.md line 444)

### 5.3 Payment Integration
- [ ] Install Stripe: `npm install stripe @stripe/stripe-js`
- [ ] Create checkout session endpoint `/src/app/api/payments/checkout/route.ts` (reference api.md lines 387-406)
- [ ] Implement webhook handler `/src/app/api/payments/webhook/route.ts` with signature verification
- [ ] Add subscription management in `/src/lib/payments/subscription-manager.ts`
- [ ] Create usage quota tracking using `quota_usage` field in users table (database.md line 89)
- [ ] Add environment variables:
  ```
  STRIPE_SECRET_KEY=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  STRIPE_WEBHOOK_SECRET=
  ```
- [ ] Test webhook locally using Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`

## Phase 6: Testing & Deployment (Week 6)

### 6.1 Testing Strategy
- [ ] Install testing dependencies: `npm install -D jest @testing-library/react @testing-library/jest-dom playwright`
- [ ] Create unit tests for each agent in `/src/lib/agents/__tests__/` (reference agents.md lines 816-889)
- [ ] Write integration tests for API endpoints in `/src/app/api/__tests__/` covering all routes from api.md
- [ ] Set up Playwright E2E tests in `/tests/e2e/` for critical user flows:
  - [ ] Guest user creates first post
  - [ ] User completes full wizard flow
  - [ ] Guest upgrades to authenticated account
  - [ ] Research attribution displays correctly
- [ ] Add performance tests checking: <15s content generation, <2s page load, <500ms API response
- [ ] Create test data fixtures in `/tests/fixtures/` with sample documents and patterns
- [ ] Run full test suite: `npm run test:all`

### 6.2 Deployment
- [ ] **Use devops-config-architect sub-agent** for production deployment strategy and monitoring setup
- [ ] Create `vercel.json` with configuration for Next.js 14 and environment variables
- [ ] Set up production Supabase project with same schema as development
- [ ] Configure environment variables in Vercel dashboard (all from .env.local)
- [ ] Create GitHub Actions workflow in `.github/workflows/deploy.yml`:
  ```yaml
  name: Deploy to Production
  on:
    push:
      branches: [main]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: npm ci
        - run: npm run test:all
    deploy:
      needs: test
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: vercel/action@v3
  ```
- [ ] Set up preview deployments for pull requests
- [ ] Configure custom domain in Vercel: storyscale.app
- [ ] Test production deployment with all features

### 6.3 Monitoring
- [ ] Install Sentry: `npm install @sentry/nextjs` and configure error tracking
- [ ] Set up Vercel Analytics for Core Web Vitals monitoring
- [ ] Implement custom analytics events for key actions:
  - [ ] Content generation started/completed
  - [ ] Research enabled/disabled
  - [ ] Pattern learned
  - [ ] Template used
- [ ] Create health check endpoint `/api/health` (reference api.md lines 427-447)
- [ ] Build admin dashboard at `/admin` showing:
  - [ ] System health status
  - [ ] API provider status (OpenAI, Anthropic, Firecrawl, Tavily)
  - [ ] Error rates and response times
  - [ ] User activity metrics
- [ ] Add feedback widget using Crisp or Intercom for user support

## Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State**: React Context + Supabase Realtime
- **Components**: Radix UI primitives

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Google OAuth
- **APIs**: Next.js API Routes
- **File Storage**: Supabase Storage

### AI Integration
- **Primary**: OpenAI (GPT-4-turbo, GPT-4, GPT-3.5-turbo)
- **Fallback**: Anthropic (Claude-3 models)
- **Research**: Firecrawl + Tavily APIs

### Infrastructure
- **Hosting**: Vercel (frontend + API)
- **Database**: Supabase Cloud
- **Payments**: Stripe
- **CDN**: Vercel Edge Network

## 🞯 Key Implementation Priorities (UPDATED)

1. **🚀 Speed-First Architecture**: Target <1s for 50% requests, 4-6s for complex (vs 15-30s)
2. **💰 Cost Optimization**: 60% cost reduction through intelligent routing and caching  
3. **🧠 Quality Excellence**: 85% first-generation acceptance through learning systems
4. **📦 Function Composition**: Stateless, scalable functions over agent orchestration
5. **📊 Progressive Rollout**: 10% → 25% → 50% → 100% with fallbacks and monitoring

## Critical Design Requirements (MUST MATCH)

### Colors (Use exact hex values)
- Orange brand: #E85D2F (Tools button, brand elements)
- Blue CTAs: #5B6FED (Primary buttons, active states)
- Purple accent: #8B5CF6 (Enhance button, special actions)
- Green success: #10B981 (Generate Post button, success states)
- Gray backgrounds: #F9FAFB (Sidebar, card backgrounds)

### Layout Dimensions
- Sidebar: Exactly 240px width
- Edit tool sidebar: Exactly 380px width
- Card padding: 24px
- Border radius: 8px for cards, 6px for inputs

### UI Components Must Match Screenshots
- Always check `/storyscale-v3/design-reference/` before implementing any UI
- Step indicators must use blue (#5B6FED) for active state
- Metric cards need white background with shadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- Data tables require hover states and status pills

## Risk Mitigation

- **API Rate Limits**: Use Redis caching with 1-hour TTL for research, 10-min for suggestions
- **Cost Control**: Track usage in `quota_usage` field, implement hard limits per tier
- **Data Privacy**: RLS policies from day one, GDPR-compliant data handling
- **Performance**: Target <15s generation, <2s page load, <500ms API response
- **Fallbacks**: OpenAI → Anthropic fallback chain, skip research on provider failure

## Success Metrics (Updated Targets)

### Performance Targets (Improved)
- ✅ **Simple requests**: <1s (50% cached responses)
- ✅ **Complex requests**: 4-6s (vs 15-30s competitors) 
- ✅ **Research requests**: 6-10s (vs 20-35s current)
- ✅ **Cache hit rate**: 50% across 3 cache layers
- ✅ **Cost per document**: $0.02 (60% reduction)

### Quality Targets
- ✅ **First-generation acceptance**: 85% (vs 60% industry)
- ✅ **User revision requests**: <15% (90% reduction)
- ✅ **Content quality score**: >0.7 threshold
- ✅ **Pattern learning accuracy**: >75%

### Business Targets  
- ✅ **User retention**: 80% after first content creation
- ✅ **Error rate**: <2% in production
- ✅ **System uptime**: 99.9% for all services
- ✅ **Break-even time**: 7.6 months (30% faster ROI)

## 📅 Updated Implementation Timeline (4 Weeks)

```
🏁 Week 1: Foundation & Intelligent Gateway
├── Days 1-2: Project setup + Intelligent Gateway core
├── Days 3-4: Multi-layer cache implementation
└── Days 5-7: Cost tracking + 10% traffic rollout
✅ Target: 30% performance improvement + 25% cost reduction

🔧 Week 2: Processing Functions
├── Days 1-2: Research + Generate functions
├── Days 3-4: Optimize + Validate functions  
└── Days 5-7: Function composition + 25% traffic
✅ Target: 60% performance improvement + 40% cost reduction

🧠 Week 3: Intelligence Services
├── Days 1-2: PatternDB deployment + learning
├── Days 3-4: Quality model + validation
└── Days 5-7: Advanced caching + 50% traffic
✅ Target: 75% acceptance rate + 45% cache hit rate

🎆 Week 4: Production Optimization
├── Days 1-2: Load testing + performance tuning
├── Days 3-4: Monitoring + team training
└── Days 5-7: Full rollout (100%) + celebration
✅ Target: All performance targets + full production ready
```

## Quick Start for Claude Code

### Step 1: Initialize Project
```bash
# Create project with exact specifications
npx create-next-app@14 storyscale --typescript --tailwind --app --src-dir --import-alias "@/*"
cd storyscale

# Install all dependencies at once
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs openai anthropic-ai/sdk stripe @stripe/stripe-js @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-switch clsx tailwind-merge swr redis

# Install dev dependencies
npm install -D @types/node jest @testing-library/react @testing-library/jest-dom playwright @next/bundle-analyzer
```

### Step 2: Set Up Environment Variables
Create `.env.local` with all required keys:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Research
FIRECRAWL_API_KEY=
TAVILY_API_KEY=

# Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Redis (for caching)
REDIS_URL=
```

### Step 3: Database Setup
1. Go to https://app.supabase.com and create new project
2. Copy ALL SQL from `/storyscale-v3/database.md` lines 82-633
3. Execute in Supabase SQL editor
4. Enable Google OAuth in Authentication settings

### Step 4: Start Building
Follow the phases above in order, checking off each task as completed.

## Common Claude Code Commands

```bash
# When implementing UI components
# First check the design reference:
ls /storyscale-v3/design-reference/dashboard/
ls /storyscale-v3/design-reference/wizard/

# When implementing agents
# Copy exact code from agents.md:
cat /storyscale-v3/agents.md | head -n 196  # For InputAgent

# When setting up API routes
# Reference the exact specifications:
cat /storyscale-v3/api.md | head -n 156  # For document endpoints

# For database queries
# Use the exact schema:
cat /storyscale-v3/database.md | head -n 167  # For documents table
```

## 🤖 When to Use Sub-Agents

Use the Task tool to launch specialized agents for complex tasks:

**For Strategic Decisions:**
```bash
# Use product-manager for feature prioritization
Task with product-manager: "Should we build image generator or blog writer first?"

# Use system-architect for architectural decisions
Task with system-architect: "Design scalable multi-tenant architecture"
```

**For Implementation:**
```bash
# Use frontend-architect for React/UI architecture
Task with frontend-architect: "Optimize wizard component hierarchy and performance"

# Use backend-engineer for API/database work
Task with backend-engineer: "Design rate limiting for AI provider calls"
```

**For Issues & Operations:**
```bash
# Use debug-investigator for systematic debugging
Task with debug-investigator: "Agent pipeline timeout on step 3 - investigate"

# Use devops-config-architect for deployment/infrastructure
Task with devops-config-architect: "Set up production monitoring and alerting"

# Use security-analyst for security reviews
Task with security-analyst: "Audit guest session implementation for vulnerabilities"
```

## Validation Checklist

Before marking any task complete, verify:
- [ ] Colors match exact hex values from design tokens
- [ ] Layout dimensions match screenshots exactly
- [ ] API responses match specification from api.md
- [ ] Database queries use proper indexes
- [ ] Agent pipeline completes in <15 seconds
- [ ] Error handling includes fallbacks
- [ ] Tests pass for the implemented feature

## Documentation References

- [Architecture Documentation](./architecture.md) - System design and data flow
- [Database Schema](./database.md) - Complete SQL schema and queries
- [API Specification](./api.md) - All endpoint specifications
- [AI Agents Guide](./agents.md) - Complete agent implementations
- [Design Reference](./design-reference/readme.md) - UI specifications and screenshots
- [Development Guide](./claude.md) - MCP integration and workflows

---

*Last Updated: 2025-08-07*
*Version: 2.0.0 - Enhanced for Claude Code with specific instructions and checkboxes*