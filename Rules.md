# StoryScale Development Rules

This document defines mandatory operating principles for all AI instances working on StoryScale. These rules ensure consistent behavior, quality output, and proper development workflow.

---

## 🚨 CRITICAL WORKFLOW RULES

### Research → Plan → Implement (MANDATORY)
1. **NEVER jump straight to coding**
2. **ALWAYS research first** using MCP servers:
   - Use @context7 to analyze existing codebase
   - Use @octocode to get latest documentation
   - Use @perplexity for framework/library updates
3. **Create detailed plan** and get approval before implementing
4. **Implement with checkpoints** and validation at each step

---

## 📋 Core Development Standards

### AI Model Integration
- Support both OpenAI and Anthropic models as configured
- User can select preferred model in UI
- Implement fallback: OpenAI → Anthropic
- All API calls must use environment variables for keys
- **NEVER expose API keys in code or logs**

### Research Integration Standards
- Use Firecrawl for LinkedIn analysis and competitor research
- Use Tavily for general search and fact-checking
- Research is optional enhancement (toggle in wizard)
- Cache research results for 1 hour to avoid duplicate calls
- If research APIs fail, continue without research data

### Content Generation Quality
- **NO FAKE DATA**: Never generate fake statistics or research
- Only include data from actual API responses
- If research isn't relevant, generate content without statistics
- Avoid corporate/promotional language
- Write naturally and conversationally
- Match user-specified tone, format, and audience exactly

---

## 🎯 Performance Requirements

### Response Time Targets
- Content generation: <15 seconds total
- Wizard step navigation: <300ms
- Page load: <2 seconds
- API timeout: 30 seconds maximum

### Agent Pipeline Standards
- Each agent handles one specific task
- Agents must not block on failure
- Implement proper error boundaries
- Log execution time for monitoring

---

## 🛡️ Security & Privacy

### API Key Management
- All keys stored in environment variables only
- Never log or cache API keys
- Rotate keys according to provider recommendations
- Use separate keys for development/production

### Data Protection
- LocalStorage for guest sessions (30-day max)
- No sensitive data in localStorage
- Sanitize all user inputs
- Validate external API responses

---

## 💾 Storage & Caching

### Cache Management
- Guest data persists 30 days maximum
- Auto-save form state every 30 seconds
- Handle cache corruption gracefully
- Clear cache on logout or data migration

### Session Management
- Support both guest and authenticated modes
- Seamless migration from guest to authenticated
- Preserve user work during authentication

---

## 🎨 UI/UX Standards

### Component Development
- Follow design system in frontend/DESIGN.md
- Never use !important CSS overrides
- Always append classes, don't replace
- Test responsive behavior immediately
- Follow accessibility guidelines

### Wizard Flow
- Validate required fields before progression
- Show clear error messages
- Enable save draft at any step
- Maintain state during navigation

---

## 🧪 Testing Requirements

### Before Deployment
- Test all wizard paths
- Verify API integrations
- Check responsive design
- Validate error handling
- Test with both AI providers

### Server Verification
- Always verify actual HTTP connectivity
- Don't assume from build output alone
- Check port is actually listening
- Test in incognito mode

---

## 📝 Documentation Standards

### Code Documentation
- Document all agent interfaces
- Include TypeScript types
- Add JSDoc for complex functions
- Keep README files updated

### Component Documentation
- Document props and state
- Include usage examples
- Note any limitations
- Update when behavior changes

---

## 🚀 Development Workflow

### Feature Development
1. Research with MCP servers
2. Create implementation plan
3. Get plan approval
4. Build with validation points
5. Test thoroughly
6. Document changes

### Code Quality
- TypeScript strict mode
- Functional components only
- Proper error boundaries
- Clean, readable code
- No premature optimization

---

## ⚠️ Common Pitfalls to Avoid

### Don't:
- Generate fake research data
- Skip the research phase
- Hardcode API keys
- Use corporate marketing language
- Implement features not in requirements
- Over-engineer solutions

### Do:
- Follow Research → Plan → Implement
- Use real API data only
- Handle errors gracefully
- Write natural, professional content
- Focus on MVP requirements
- Keep solutions simple

---

## 🔄 Change Management

### Version Control
- Clear commit messages
- Feature branches for new work
- Test before merging
- Document breaking changes

### Rollback Procedures
- Feature flag new functionality
- Maintain backwards compatibility
- Test rollback procedures
- Keep deployment simple

---

These rules ensure StoryScale development remains consistent, secure, and user-focused while maintaining high code quality and performance standards.
