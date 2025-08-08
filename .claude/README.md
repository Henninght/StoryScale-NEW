# Claude Code Agents - StoryScale Project

## 📍 **Important: Working Directory Requirements**

**CRITICAL**: Claude Code agents are only accessible when you run commands from the correct working directory.

### ✅ **Correct Usage**
```bash
# Navigate to the project root first
cd /Users/henningtorp/Desktop/AAA/Storyscale/storyscale

# Then use agent commands
/agents                    # List all available agents
Task with agent-name      # Use specific agent
```

### ❌ **Common Mistake**
```bash
# Running from parent directory - agents won't be found
cd /Users/henningtorp/Desktop/AAA/Storyscale
/agents  # ❌ Will show empty list
```

## 🤖 **Available Agents**

This project has **8 specialized agents** located in `.claude/agents/`:

1. **agent-ecosystem-optimizer** - Optimize and manage agent collections
2. **backend-engineer** - Backend development, APIs, databases  
3. **debug-investigator** - Systematic debugging and issue resolution
4. **devops-config-architect** - Infrastructure and deployment
5. **frontend-architect** - React/UI architecture and components
6. **product-manager** - Strategic product decisions and features
7. **security-analyst** - Security vulnerabilities and protection
8. **system-architect** - High-level system design and scalability

## 🔧 **Agent Directory Structure**

```
/Users/henningtorp/Desktop/AAA/Storyscale/storyscale/
├── .claude/                    # Project-level Claude config
│   └── agents/                 # ✅ Project agents (8 agents)
│       ├── agent-ecosystem-optimizer.md
│       ├── backend-engineer.md
│       └── ... (6 more)
└── [project files]

/Users/henningtorp/.claude/     # User-level Claude config
└── agents/                     # ❌ Empty (no user-level agents)
```

## 🎯 **Quick Reference**

| Command | Purpose |
|---------|---------|
| `/agents` | List all available agents |
| `Task with product-manager: "question"` | Use product manager agent |
| `Task with debug-investigator: "issue"` | Debug specific problems |

## 🚨 **Troubleshooting**

**Issue**: `/agents` shows empty list  
**Solution**: Ensure you're in `/Storyscale/storyscale/` directory

**Issue**: Agent not found  
**Solution**: Check agent name spelling and current directory

---
*Last updated: August 8, 2025*
*Agent count: 8 active agents*