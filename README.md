# codex-task-subagent

Use [OpenAI Codex](https://platform.openai.com/docs/guides/codex) as a task subagent from any AI coding agent. A second pair of eyes — different model, different blind spots.

## The Idea

AI coding agents are powerful but have blind spots. A different model catches different bugs.

**codex-task-subagent** is a self-contained skill + CLI that lets Claude Code (or any agent) spawn OpenAI Codex as a verification subagent. It outputs clean JSON, handles timeouts, and stays out of your way.

### Nested Subagents: The 10x Pattern

This is where it gets interesting. Claude Code already has subagents via the Task tool. **codex-task-subagent** adds a second layer — Codex as a subagent *inside* Claude Code subagents. This creates nested agent pipelines:

```
You (human)
  └── Claude Code (orchestrator)
        ├── Claude subagent (Task tool — writes code)
        └── Codex subagent (this tool — verifies code)
              └── Codex reads files, runs commands, analyzes
```

Why this matters:
- **10x productivity** — Claude writes, Codex verifies, in the same session
- **10x experience** — Cross-model agreement before shipping = fewer production bugs
- **10x context preservation** — Claude keeps its main context clean by delegating verification to Codex, which runs in its own sandbox

This is v0.1 — the seed. The roadmap includes multi-turn sessions, programmatic API, MCP server mode, and integration patterns for major AI coding agents.

## Quick Start

### As a Claude Code Skill (Recommended)

Copy the skill folder into your project:

```bash
# Clone the repo
git clone https://github.com/buildoak/codex-task-subagent.git

# Copy skill definition to your project
cp -r codex-task-subagent/.claude/skills/codex-subagent /path/to/your/project/.claude/skills/

# Copy the agent code
mkdir -p /path/to/your/project/lib/codex-subagent
cp codex-task-subagent/src/codex-agent.ts /path/to/your/project/lib/codex-subagent/
cp codex-task-subagent/package.json /path/to/your/project/lib/codex-subagent/

# Install dependencies
cd /path/to/your/project/lib/codex-subagent && bun install
```

Claude Code will automatically discover the skill and use Codex for verification tasks.

### As a Standalone CLI

```bash
git clone https://github.com/buildoak/codex-task-subagent.git
cd codex-task-subagent
bun install
bun run src/codex-agent.ts "Review this repo for security issues"
```

Requires: [Bun](https://bun.sh), OpenAI API key as `OPENAI_API_KEY` env var.

## Usage

```bash
# Basic
bun run src/codex-agent.ts "Your prompt here"

# Point at a specific repo
bun run src/codex-agent.ts --cwd /path/to/repo "Analyze architecture"

# Security review with high reasoning
bun run src/codex-agent.ts --cwd /path/to/repo -r high "Review auth flow for vulnerabilities"

# Let Codex make fixes
bun run src/codex-agent.ts --sandbox workspace-write "Fix the failing tests"

# Deep analysis
bun run src/codex-agent.ts -r xhigh "Deep analysis of edge cases"
```

## CLI Flags

| Flag | Short | Values | Default |
|------|-------|--------|---------|
| --sandbox | -s | read-only, workspace-write, danger-full-access | read-only |
| --model | -m | Any Codex model | gpt-5.3-codex |
| --reasoning | -r | minimal, low, medium, high, xhigh | medium |
| --cwd | -C | path | current directory |
| --timeout | -t | milliseconds | 120000 |

## Output

Clean JSON to stdout:

```json
{
  "success": true,
  "response": "Analysis results...",
  "items": [...]
}
```

On error:

```json
{
  "success": false,
  "error": "Error description",
  "code": "SDK_ERROR | TIMEOUT | INVALID_ARGS"
}
```

## Cross-Model Verification Pattern

The real power is using Codex as a verification layer alongside your primary AI agent:

1. Your primary agent (Claude, GPT, etc.) writes code
2. Codex reviews it with fresh eyes — different training, different blind spots
3. Cross-model agreement = higher confidence before shipping

This pattern was validated during a full-day autonomous coding session where Claude Code orchestrated Codex for security reviews, bug hunts, and pre-ship checks. Different models consistently caught different issues.

### Reasoning Effort Guide

| Level | Use Case |
|-------|----------|
| medium | Routine code review, quick checks |
| high | Security review, bug hunting, pre-ship verification |
| xhigh | Deep analysis, edge cases, crypto/auth code |

## Repo Structure

```
codex-task-subagent/
├── .claude/
│   └── skills/
│       └── codex-subagent/
│           └── SKILL.md          # Claude Code skill definition
├── src/
│   └── codex-agent.ts            # The agent runner (~230 lines)
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## Roadmap

- [ ] Multi-turn sessions (iterative refinement)
- [ ] Programmatic TypeScript API (import, not just CLI)
- [ ] MCP server mode (use from any MCP-compatible agent)
- [ ] Integration guides for Claude Code, Cursor, Windsurf
- [ ] Result formatting options (markdown, structured reports)
- [ ] Progressive disclosure examples library

## License

MIT
