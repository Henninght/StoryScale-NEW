# Contributing to StoryScale

## 🤝 Welcome Contributors

Thank you for your interest in contributing to StoryScale! This guide provides everything you need to know about contributing to our AI-powered content studio, from setting up your development environment to submitting your first pull request.

**StoryScale Mission:** Create professional content in under 15 seconds through intelligent AI agents, document identification, and pattern learning.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Git** for version control
- **Supabase CLI** for database operations
- **Claude Code** (recommended) with MCP servers configured

### Development Setup
```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/storyscale-v3.git
cd storyscale-v3

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Set up Supabase
supabase link --project-ref your-project-ref
supabase db push

# 5. Start development server
npm run dev
```

### First-Time Setup Checklist
- [ ] Repository forked and cloned
- [ ] Dependencies installed successfully
- [ ] Environment variables configured
- [ ] Supabase database connected
- [ ] Development server running at http://localhost:3000
- [ ] All tests passing: `npm test`

## 📋 Development Guidelines

### Core Development Workflow

#### 🚨 MANDATORY: Research → Plan → Implement
**NEVER jump straight to coding!** Always follow this sequence:

1. **Research Phase**
   - Use @context7 MCP server to analyze existing codebase
   - Use @octocode-mcp to get latest documentation  
   - Use @perplexity MCP server for framework/library updates
   - Review related components and patterns

2. **Planning Phase**
   - Create detailed implementation plan
   - Identify file paths and dependencies
   - Present plan in PR description
   - Get approval before implementation

3. **Implementation Phase**
   - Follow the approved plan
   - Test each component before moving to next
   - Document any deviations from plan
   - Update CHANGELOG.md with changes

### Code Standards

#### TypeScript & React
```typescript
// Use strict TypeScript configuration
interface ComponentProps {
  // Always define explicit props
  className?: string // Allow style overrides
  children?: React.ReactNode
  onAction: (data: ActionData) => void // Required props without default
}

// Functional components only
export function Component({ className, children, onAction }: ComponentProps) {
  // Use hooks for state management
  const [isLoading, setIsLoading] = useState(false)
  
  // Event handlers with proper typing
  const handleAction = useCallback((data: ActionData) => {
    setIsLoading(true)
    onAction(data)
    setIsLoading(false)
  }, [onAction])
  
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  )
}
```

#### Database Operations
```typescript
// Always use typed Supabase client
import { Database } from '@/types/supabase'

// Proper error handling
async function createDocument(data: DocumentInput): Promise<Document | null> {
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .insert(data)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return null
    }
    
    return document
  } catch (error) {
    console.error('Unexpected error:', error)
    return null
  }
}
```

#### AI Agent Development
```typescript
// All agents must implement this interface
interface Agent {
  process(input: AgentInput): Promise<AgentOutput>
}

// Agent implementation pattern
export class YourAgent implements Agent {
  async process(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now()
    
    try {
      // Agent logic here
      const result = await this.performTask(input)
      
      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
        tokensUsed: result.tokensUsed || 0,
        confidence: result.confidence || 0.8
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        confidence: 0
      }
    }
  }
}
```

### File Organization

#### Component Structure
```
components/
├── ui/                 # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── wizard/             # Content wizard components
│   ├── StepOne.tsx
│   ├── StepTwo.tsx
│   └── WizardLayout.tsx
└── workspace/          # Workspace features
    ├── Dashboard.tsx
    └── DocumentList.tsx
```

#### Naming Conventions
- **Components**: PascalCase (`DocumentCard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)
- **Types**: PascalCase with descriptive names (`DocumentClassification`)

### Git Workflow

#### Branch Naming
```bash
# Feature branches
feature/document-identification-system
feature/research-attribution
feature/pattern-learning-ui

# Bug fixes
fix/wizard-validation-error
fix/rate-limiting-issue

# Documentation
docs/update-api-documentation
docs/add-agent-testing-guide
```

#### Commit Messages
```bash
# Format: type(scope): description
feat(wizard): add AI-powered document classification
fix(agents): handle research API timeout gracefully
docs(api): update endpoint documentation
test(agents): add comprehensive agent pipeline tests
refactor(database): optimize document search queries

# Breaking changes
feat(api)!: change document classification schema
```

#### Pull Request Process
1. **Create feature branch** from main
2. **Implement changes** following Research → Plan → Implement
3. **Write tests** for new functionality
4. **Update documentation** if needed
5. **Update CHANGELOG.md** with changes
6. **Create pull request** with detailed description
7. **Request review** from maintainers
8. **Address feedback** and iterate
9. **Merge** after approval

## 🧪 Testing Requirements

### Test Coverage Standards
- **Unit tests**: Minimum 80% coverage
- **Component tests**: All interactive components
- **Integration tests**: All API endpoints  
- **E2E tests**: Critical user journeys

### Testing Checklist
- [ ] Unit tests for new functions/components
- [ ] Integration tests for API changes
- [ ] E2E tests for user-facing features
- [ ] Visual regression tests for UI changes
- [ ] Agent tests for AI pipeline changes
- [ ] Performance tests for optimization work

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:all

# Visual regression tests
npm run test:visual
```

## 📚 Documentation Standards

### Code Documentation
```typescript
/**
 * Processes user input through the AI agent pipeline
 * 
 * @param input - User's content creation request
 * @param options - Pipeline configuration options
 * @returns Promise resolving to generated content with attribution
 * 
 * @example
 * ```typescript
 * const result = await processContent({
 *   content: "AI is transforming healthcare",
 *   purpose: "thought-leadership",
 *   enableResearch: true
 * })
 * ```
 */
async function processContent(input: ContentInput, options: PipelineOptions): Promise<ContentResult> {
  // Implementation
}
```

### README Updates
When adding new features:
- Update feature list in README.md
- Add usage examples
- Update architecture diagrams if needed
- Add any new environment variables

### CHANGELOG Updates
**ALWAYS** update CHANGELOG.md with:
```markdown
### Added
- Document identification system with AI-powered classification
  - Added document types: linkedin, blog, marketing, image, text
  - See: [claude.md](./claude.md#document-identification--tools)
  - See: [frontend.md](./frontend.md#document-identification-ui-patterns)

### Changed
- Enhanced wizard flow with AI suggestions
  - Updated suggestion dropdowns to show confidence scores
  - See: [api.md](./api.md#generate-content)

### Fixed
- Fixed research attribution not showing proper citations
  - Citations now display complete source context
  - See: [agents.md](./agents.md#enhanceagent---final-polish--attribution)
```

## 🎯 Contribution Areas

### 🔥 High Priority Areas
1. **AI Agent Optimization**
   - Improve agent processing speed
   - Add new AI provider integrations
   - Enhance pattern learning algorithms

2. **Document Classification**
   - Add new document types
   - Improve classification accuracy
   - Expand format options

3. **Research Integration**
   - Add new research providers
   - Improve source attribution
   - Enhance citation quality

4. **UI/UX Improvements**
   - Responsive design enhancements
   - Accessibility improvements
   - Performance optimizations

### 🌟 Feature Requests
- **Template System**: User-created content templates
- **Bulk Operations**: Batch content generation
- **Analytics Dashboard**: Content performance insights
- **Team Collaboration**: Multi-user workspaces
- **API Extensions**: Public API for integrations

### 🐛 Bug Reports
When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/device information
- Error messages or logs
- Screenshots if relevant

### 💡 Enhancement Ideas
- Performance optimizations
- Security improvements
- Developer experience improvements
- Documentation enhancements
- Test coverage improvements

## 🔒 Security Guidelines

### Secure Coding Practices
```typescript
// Input validation
import { z } from 'zod'

const DocumentSchema = z.object({
  content: z.string().min(1).max(5000),
  purpose: z.enum(['thought-leadership', 'question', 'value', 'authority'])
})

// Sanitize user input
import { DataSanitizer } from '@/lib/sanitization'

const sanitizedContent = DataSanitizer.sanitizeUserInput(userInput)
```

### API Security
- Always validate request data
- Implement rate limiting
- Use proper authentication
- Sanitize all inputs
- Never expose sensitive information in errors

### Database Security  
- Use parameterized queries
- Implement Row Level Security (RLS)
- Validate all data before insertion
- Encrypt sensitive data
- Audit data access

## 🤖 AI Development Guidelines

### Agent Development
1. **Single Responsibility**: Each agent handles one specific task
2. **Fault Tolerance**: Agents must handle failures gracefully
3. **Performance**: Target <30 second processing time
4. **Monitoring**: Include comprehensive logging
5. **Testing**: Write both unit and integration tests

### AI Provider Integration
```typescript
// Provider interface
interface AIProvider {
  name: string
  models: string[]
  generate(prompt: string, options: GenerateOptions): Promise<GenerateResponse>
  isHealthy(): Promise<boolean>
}

// Always include fallback logic
async function generateWithFallback(prompt: string): Promise<string> {
  for (const provider of providers) {
    try {
      if (await provider.isHealthy()) {
        return await provider.generate(prompt)
      }
    } catch (error) {
      console.warn(`Provider ${provider.name} failed:`, error)
    }
  }
  
  throw new Error('All AI providers are unavailable')
}
```

## 🎨 Design System

### Component Development
- Follow existing design patterns
- Use design tokens from design system
- Ensure responsive behavior
- Include accessibility features
- Test with screen readers

### Color System
```typescript
// Use design system colors
const documentColors = {
  purposes: {
    'thought-leadership': 'bg-purple-100 text-purple-700',
    'question': 'bg-pink-100 text-pink-700',
    'value': 'bg-blue-100 text-blue-700',
    'authority': 'bg-orange-100 text-orange-700'
  }
}
```

### Responsive Design
- Mobile-first approach
- Test on multiple devices
- Use Tailwind breakpoints consistently
- Ensure touch-friendly interfaces

## 📋 Code Review Guidelines

### As a Reviewer
- Review for code quality and standards
- Check test coverage
- Verify security best practices
- Ensure documentation is updated
- Test functionality locally
- Provide constructive feedback

### As an Author
- Provide clear PR description
- Include screenshots for UI changes
- Respond to feedback promptly
- Update based on suggestions
- Ensure CI passes before review request

### Review Checklist
- [ ] Code follows project standards
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] CHANGELOG.md reflects changes
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Accessibility requirements met

## 🎉 Recognition

### Contributor Levels
- **First-time contributors**: Welcome package and mentoring
- **Regular contributors**: Recognition in releases
- **Core contributors**: Maintainer privileges
- **Expert contributors**: Architecture decision involvement

### Ways to Get Recognized
- Quality code contributions
- Comprehensive test coverage
- Documentation improvements
- Bug reports and fixes
- Community support
- Code reviews

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Request Comments**: Code-specific discussions

### Documentation Resources
- [Architecture Guide](./architecture.md) - System design overview
- [API Documentation](./api.md) - API endpoint reference
- [Database Guide](./database.md) - Database schema and operations
- [Agent System](./agents.md) - AI agent development
- [Testing Guide](./testing.md) - Testing strategies
- [Security Guide](./security.md) - Security best practices
- [Deployment Guide](./deployment.md) - Production deployment

### Common Questions

**Q: How do I add a new document type?**
A: See [database.md](./database.md#document-types) for schema changes and [api.md](./api.md#create-document) for API updates.

**Q: How do I create a new AI agent?**
A: Follow the pattern in [agents.md](./agents.md#agent-implementations) and implement the Agent interface.

**Q: How do I add research provider integration?**
A: See [agents.md](./agents.md#researchagent---external-data-enrichment) for the ResearchAgent pattern.

**Q: How do I update the UI design?**
A: Reference [frontend.md](./frontend.md) for component patterns and design system usage.

---

## 📋 Contribution Checklist

Before submitting your contribution:

### Development
- [ ] Followed Research → Plan → Implement workflow
- [ ] Code follows TypeScript and React standards
- [ ] All tests pass locally
- [ ] Code coverage meets requirements
- [ ] No security vulnerabilities introduced

### Documentation
- [ ] CHANGELOG.md updated with changes
- [ ] Code includes JSDoc comments
- [ ] README updated if needed
- [ ] Relevant .md files updated

### Testing
- [ ] Unit tests for new functionality
- [ ] Integration tests for API changes
- [ ] E2E tests for user-facing features
- [ ] Visual regression tests for UI changes

### Review
- [ ] PR description is clear and detailed
- [ ] All CI checks pass
- [ ] Requested review from maintainers
- [ ] Addressed all feedback

Thank you for contributing to StoryScale! Together, we're building the future of AI-powered content creation. 🚀

---

*This contributing guide is connected to:*
- *[claude.md](./claude.md) - Development workflow and standards*
- *[architecture.md](./architecture.md) - System design principles*
- *[testing.md](./testing.md) - Testing requirements and strategies*
- *[security.md](./security.md) - Security guidelines and best practices*