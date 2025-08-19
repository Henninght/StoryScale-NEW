# StoryScale - AI Development Guide

## 🚨 CRITICAL WORKFLOW - ALWAYS FOLLOW THIS SEQUENCE

### Workflow: Research → Plan → Implement

**NEVER JUMP STRAIGHT TO CODING!** Always follow this sequence:

1. **Research** (MANDATORY FIRST STEP):
   - ALWAYS use context7 MCP server to analyze existing codebase
   - ALWAYS use octocode-mcp to get latest documentation
   - ALWAYS use perplexity MCP server for framework/library updates
   - Gather ALL relevant information BEFORE planning

2. **Plan**: 
   - Create detailed implementation plan based on research
   - Include specific file paths and dependencies
   - Present plan for verification
   - Wait for approval before proceeding

3. **Implement**: 
   - Execute approved plan with validation checkpoints
   - Test each component before moving to next
   - Document any deviations from plan

## 🎯 Project Overview
StoryScale is an AI-powered content studio for creating professional LinkedIn posts, blogs, and marketing copy. Built with Next.js 14, TypeScript, and Supabase.

**Repository**: https://github.com/Henninght/storyscale  
**Mission**: Professional content in under 15 seconds  
**Stack**: Next.js | TypeScript | Tailwind | Supabase | OpenAI

## 🚀 Quick Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run all tests

# Code Generation
npm run gen:component [name]    # Generate new component
npm run gen:agent [type]        # Generate AI agent
npm run gen:api [endpoint]      # Generate API route

# Database & Profile System
npm run db:migrate   # Run database migrations (includes user profiles)
npm run db:seed      # Seed database with sample data
npm run profile:setup # Initialize user profile system tables
```

## 🏗️ Project Architecture
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

## 🤖 AI Agent Pipeline
```typescript
// Agent Flow: Input → Research → Generate → Optimize → Enhance
InputAgent      // Validates and structures user input
ResearchAgent   // Gathers relevant data and insights
ContentAgent    // Generates initial content
OptimizeAgent   // Refines for platform and audience
EnhanceAgent    // Adds final polish and formatting
```

### AI Model Support
```typescript
// Multi-provider configuration
const aiProviders = {
  openai: {
    models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4o', 'gpt-4-turbo', 'gpt-4'],
    apiKey: process.env.OPENAI_API_KEY
  },
  anthropic: {
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    apiKey: process.env.ANTHROPIC_API_KEY
  }
  // Future: Gemini, Mistral, Llama
}

// User can select model in UI
const selectedModel = userSettings.preferredModel || 'gpt-5-mini'
```

### Research Integration
```typescript
// Research providers for data enrichment
const researchProviders = {
  firecrawl: {
    use: 'LinkedIn analysis, competitor research',
    api: process.env.FIRECRAWL_API_KEY
  },
  tavily: {
    use: 'General search, fact-checking, trends',
    api: process.env.TAVILY_API_KEY
  }
}

// Research agent uses both providers
async function enrichContent(topic: string) {
  const insights = await Promise.all([
    firecrawl.analyze(topic),
    tavily.search(topic)
  ])
  return synthesizeInsights(insights)
}

## 🔧 MCP Server Integration
```bash
# Research & Documentation
@context7 analyze                    # Analyze existing codebase structure
@context7 dependencies              # Map project dependencies
@octocode search [library]          # Get latest library documentation
@perplexity search [framework]      # Research framework best practices

# Database
@supabase db:create [table]          # Create new table
@supabase db:query [sql]             # Execute query
@supabase auth:user                  # Current user info

# Testing  
@playwright test [feature]           # Run specific tests
@playwright record                   # Record new test

# Web Scraping & Research
@firecrawl scrape [url]              # Extract webpage content
@firecrawl research [topic]          # Topic research
```

## 📦 Core Features

### 1. Content Wizard System
```typescript
// Create new wizard configuration
interface WizardConfig {
  steps: WizardStep[]
  validations: ValidationRules
  output: OutputFormat
}
```

### 2. AI Provider Management
```typescript
// Provider priority system with model selection
providers: {
  primary: 'openai',
  fallback: ['anthropic'],
  models: {
    openai: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4o', 'gpt-4-turbo', 'gpt-4'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  },
  research: ['firecrawl', 'tavily']
}
```

### 3. Smart Storage
```typescript
// Hybrid storage approach
storage: {
  local: 'guest-sessions',    // No auth required
  cloud: 'supabase',         // Authenticated users
  sync: 'automatic'          // Seamless migration
}
```

### 4. Planned Tools
```typescript
// Future tool additions
tools: {
  // Active Tools
  'content-wizard': 'Active - LinkedIn, Blog posts',
  'edit-refine': 'Active - Enhance existing content',
  'analytics-dashboard': 'Active - Performance tracking',
  
  // Planned Tools - Future Implementation
  'image-creator': 'Planned - AI-powered image generation for posts',
  'content-writer': 'Planned - Long-form article and blog writer',
  'campaign-manager': 'Planned - Multi-post campaigns',
  'bulk-generator': 'Planned - Batch content creation',
  'brand-voice': 'Planned - Custom brand voice training',
  'template-library': 'Planned - Pre-built content templates',
  'seo-optimizer': 'Planned - SEO-focused content enhancement',
  'video-script': 'Planned - Video script generation',
  'email-composer': 'Planned - Email marketing content',
  'social-scheduler': 'Planned - Cross-platform scheduling'
}
```

## 💳 Payment Integration
Payment processing is handled through Stripe for secure and reliable transactions.

```typescript
// Stripe configuration
payment: {
  provider: 'stripe',
  environment: process.env.NODE_ENV,
  keys: {
    publishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secret: process.env.STRIPE_SECRET_KEY
  },
  webhooks: process.env.STRIPE_WEBHOOK_SECRET
}
```

## 🛠️ Development Workflow

### Feature Development
```bash
1. Create feature branch
2. Generate component: npm run gen:component
3. Implement with TDD
4. Test with Playwright
5. Submit PR
```

### Agent Development
```bash
1. Define agent interface
2. Generate base: npm run gen:agent
3. Implement process method
4. Add to pipeline
5. Test end-to-end
```

## 📊 Key Workflows

### Generate LinkedIn Post
```typescript
// Wizard → Agents → Output
const config = linkedInWizardConfig
const pipeline = new AgentPipeline()
const result = await pipeline.process(wizardData)
```

### Research-Enhanced Content
```typescript
// Enable research toggle in wizard
if (wizardData.enableResearch) {
  const insights = await researchAgent.gather({
    topic: wizardData.description,
    providers: ['firecrawl', 'tavily'],
    depth: 'balanced'
  })
  wizardData.enrichedContext = insights
}
```

### Model Selection Flow
```typescript
// User selects AI model in UI
const generateContent = async (prompt, modelChoice) => {
  const provider = modelChoice.includes('gpt') ? 'openai' : 'anthropic'
  return await aiProviders[provider].generate(prompt, modelChoice)
}
```

### Add New Content Type
```typescript
1. Create wizard config
2. Define agent modifications
3. Add to workspace menu
4. Implement preview
```

### Deploy to Production
```bash
git push main        # Auto-deploy via Vercel
npm run checks      # Pre-deploy validation
npm run migrate     # Database migrations
```

## 🎨 UI/UX Patterns
```typescript
// Component hierarchy
<Workspace>
  <Sidebar />
  <ContentArea>
    <Wizard | Editor | Dashboard />
  </ContentArea>
</Workspace>

// State management
- Local: React hooks
- Global: Context API
- Server: Supabase realtime
```

## 🔐 Authentication Flow
```typescript
// Progressive enhancement
1. Guest mode (localStorage)
2. Optional sign-in
3. Google OAuth
4. Session persistence
5. Data migration
```

## 📈 Performance Targets
- Content generation: <15 seconds
- Page load: <2 seconds  
- API response: <500ms
- Agent timeout: 30 seconds max

## 🧪 Testing Strategy
```bash
# Unit tests for logic
npm run test:unit

# Integration for APIs  
npm run test:api

# E2E for user flows
npm run test:e2e

# Visual regression
npm run test:visual
```

## 📝 Coding Standards
- TypeScript strict mode
- Functional components only
- Composition over inheritance
- Error boundaries everywhere
- Accessible by default

## 🚦 Status Indicators
- 🟢 Ready: Core features stable
- 🟡 Beta: Advanced features in testing
- 🔴 Planned: Future enhancements

## 💡 Quick References
- [API Documentation](./docs/api.md)
- [Component Library](./docs/components.md)
- [Agent Guide](./docs/agents.md)
- [Deployment](./docs/deployment.md)
