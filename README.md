# codex-task-subagent

Use [OpenAI Codex](https://platform.openai.com/docs/guides/codex) as a task subagent from any AI coding agent. A second pair of eyes — different model, different blind spots.

## The Idea

AI coding agents (Claude Code, Cursor, Windsurf, etc.) are powerful but have blind spots. A different model catches different bugs.

**codex-task-subagent** is a thin CLI wrapper around the Codex TypeScript SDK that makes it trivial to spawn Codex as a verification subagent from any agent or script. It outputs clean JSON, handles timeouts, and stays out of your way.

This is v0.1 — the seed. The roadmap includes multi-turn sessions, programmatic API, MCP server mode, and integration patterns for major AI coding agents. Watch this space.

## Quick Start

```bash
git clone https://github.com/buildoak/codex-task-subagent.git
cd codex-task-subagent
npm install
npx tsx src/codex-agent.ts "Review this repo for security issues"
```

Requires an OpenAI API key set as OPENAI_API_KEY environment variable.

## Usage

```bash
# Basic
npx tsx src/codex-agent.ts "Your prompt here"

# Point at a specific repo
npx tsx src/codex-agent.ts --cwd /path/to/repo "Analyze architecture"

# Security review with high reasoning
npx tsx src/codex-agent.ts --cwd /path/to/repo -r high "Review auth flow for vulnerabilities"

# Let Codex make fixes
npx tsx src/codex-agent.ts --sandbox workspace-write "Fix the failing tests"

# Deep analysis
npx tsx src/codex-agent.ts -r xhigh "Deep analysis of edge cases"
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

## Roadmap

- [ ] Multi-turn sessions (iterative refinement)
- [ ] Programmatic TypeScript API (import, not just CLI)
- [ ] MCP server mode (use from any MCP-compatible agent)
- [ ] Integration guides for Claude Code, Cursor, Windsurf
- [ ] Result formatting options (markdown, structured reports)

## License

MIT
