# Changelog

All notable changes to StoryScale will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Document identification system with AI-powered classification
  - Added document types: linkedin, blog, marketing, image, text
  - Added media types: text-only, image, mixed-media
  - Added purpose classification: thought-leadership, question, value, authority
  - See: [claude.md](./claude.md#document-identification--tools)
  - See: [frontend.md](./frontend.md#document-identification-ui-patterns)

- Research attribution system for content enhancement
  - In-text citations with "According to..." format
  - Sources tab with full context and snippet tracking
  - See: [claude.md](./claude.md#research-attribution-system)
  - See: [frontend.md](./frontend.md#research-attribution-components)

- Pattern learning and template system
  - AI learns from successful post patterns
  - Template suggestions based on user engagement history
  - See: [claude.md](./claude.md#pattern-learning--templates)
  - See: [frontend.md](./frontend.md#pattern-learning-ui-components)

- Design reference architecture
  - Organized UI/UX reference materials in /design-reference/
  - Cross-referenced design files with component implementations
  - See: [claude.md](./claude.md#design-reference-architecture)
  - See: [frontend.md](./frontend.md#design-reference-architecture)

### Changed
- Enhanced AI agent pipeline to support document classification
  - Updated InputAgent to handle document type identification
  - Enhanced ResearchAgent with attribution tracking
  - See: [claude.md](./claude.md#ai-agent-pipeline)

- Updated dashboard data table with document metadata
  - Added document type, purpose, and source count columns
  - Enhanced visual indicators for document classification
  - See: [frontend.md](./frontend.md#data-table-pattern-with-document-classification)

- Expanded tool definitions with future implementations
  - Added image-creator and content-writer tool specifications
  - Defined tool-specific document types

### Changed
- Simplified authentication to use only Google OAuth
  - Removed email/password authentication option
  - Updated security documentation with Google OAuth setup instructions
  - Added complete Google Cloud Console configuration steps
  - See: [security.md](./security.md#google-oauth-setup-requirements)
  - See: [claude.md](./claude.md#document-identification--tools)

### Technical
- Added TypeScript interfaces for document identification system
- Created comprehensive UI component patterns for classification
- Established design system color mappings from actual screenshots

---

## Documentation Structure

This changelog connects to the following documentation files:

### Core Documentation
- **[claude.md](./claude.md)** - Main development guide and architecture
- **[frontend.md](./frontend.md)** - Frontend patterns and UI components  
- **[Rules.md](./Rules.md)** - Development standards and workflows

### Planned Documentation (Priority Order)
1. **[architecture.md](./architecture.md)** - System architecture and data flows *(Coming Next)*
2. **[api.md](./api.md)** - REST API documentation
3. **[database.md](./database.md)** - Supabase schema and patterns
4. **[agents.md](./agents.md)** - AI agent system guide
5. **[deployment.md](./deployment.md)** - Deployment and production setup
6. **[security.md](./security.md)** - Security patterns and authentication
7. **[testing.md](./testing.md)** - Testing strategies and patterns
8. **[contributing.md](./contributing.md)** - Development workflow and standards

### Visual References
- **[design-reference/](./design-reference/)** - UI/UX screenshots and design assets
  - **[design-reference/README.md](./design-reference/README.md)** - Visual design guide

---

## Changelog Guidelines

When making changes, update this file with:

1. **Category** (Added/Changed/Fixed/Removed/Security)
2. **Description** with relevant context
3. **Cross-references** to affected .md files
4. **Technical details** for implementation changes

### Example Entry Format:
```markdown
### Added
- New feature description
  - Technical implementation details
  - See: [relevant-file.md](./relevant-file.md#specific-section)
  - See: [another-file.md](./another-file.md#related-section)
```

### Cross-Reference Format:
Use relative links to specific sections when possible:
- `[claude.md](./claude.md#section-name)`
- `[frontend.md](./frontend.md#component-name)`
- `[architecture.md](./architecture.md#system-overview)`

This ensures documentation stays connected and changes are traceable across the entire project.