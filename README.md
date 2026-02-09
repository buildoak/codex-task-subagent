# codex-task-subagent

Use OpenAI Codex as a task subagent for Claude Code workflows.

## The Idea

This project is about cross-model verification: one model implements, another model challenges assumptions and catches different failure modes.

The most practical setup is ChatGPT Pro/Plus with Codex access, then orchestrate Codex from Claude as a specialized worker. In practice, this is usually the most logical and cost-effective path to multi-model quality control.

`codex-task-subagent` ships as a self-contained skill + CLI in `skill/codex-subagent/`.

## Orchestration Patterns

These are proven patterns from the digital employee protocol.

### 1) NORMAL Mode

```
Main Thread (coordinator)
    ├── Claude subagent (Task tool)
    ├── Codex subagent (this skill)
    └── Results synthesized back to main
```

Use when: 1-2 subagent steps, simple pipeline, single-domain work.

### 2) DEEP Mode

```
Main Thread
    └── Opus Coordinator Subagent
            ├── Worker 1 (Claude or Codex)
            ├── Worker 2 (Claude or Codex)
            └── Synthesized result → Main Thread
```

Use when: 3+ sequential steps, multi-model pipelines, complex chains.

### 3) The 10x Pattern

```
Codex (high effort) → Claude subagent (audit) → fixes → done
```

Different blind spots = higher confidence than either model alone.

### 4) Parallel Execution

```
Claude (main) → [Codex 1, Codex 2, Codex 3] → aggregate results
```

Use when independent tasks can run concurrently (module review, parallel implementation, compare-and-merge analysis).

## CLI Flags

### Help Output

```text
Usage: bun run src/codex-agent.ts [options] "prompt"

Options:
  -s, --sandbox <mode>     Sandbox mode: read-only (default), workspace-write, danger-full-access
  -m, --model <name>       Model string passed directly to Codex (default: gpt-5.3-codex)
  -r, --reasoning <level>  Reasoning effort: minimal, low, medium (default), high, xhigh
  -C, --cwd <dir>          Working directory for Codex
  -t, --timeout <ms>       Positive timeout in milliseconds (default: 120000)
  -n, --network            Enable network access (for npm install, web requests, etc.)
  -f, --full               Full access mode: danger-full-access sandbox + network enabled
  -h, --help               Show this help

Examples:
  bun run src/codex-agent.ts "What does this repo do?"
  bun run src/codex-agent.ts --sandbox workspace-write "Fix the failing tests"
  bun run src/codex-agent.ts --cwd /path/to/repo "Analyze architecture"
  bun run src/codex-agent.ts -m gpt-5.3-codex -r high "Review for security issues"
  bun run src/codex-agent.ts -r xhigh "Deep analysis of edge cases"
  bun run src/codex-agent.ts --full "Install deps and implement feature"
```

### Quick Mode Selection

| Goal | Command |
|---|---|
| Review only | default (`read-only`, no network) |
| Implementation | `--sandbox workspace-write` |
| Implementation + deps | `--sandbox workspace-write --network` |
| Full trust | `--full` |

## MCP Servers

Codex supports MCP servers through `~/.codex/config.toml`.

Example using Exa for web search:

```toml
[mcp_servers.exa]
command = "npx"
args = ["-y", "exa-mcp-server"]
env = { EXA_API_KEY = "your_exa_api_key" }
```

After configuring, restart Codex/Claude sessions so the MCP server is discovered.

## Installation

`bun install` is required in both installation paths.

### 1) Install as a Claude Code skill (recommended)

```bash
cp -r skill/codex-subagent /path/to/project/.claude/skills/
cd /path/to/project/.claude/skills/codex-subagent
bun install
```

### 2) Use as a standalone CLI

```bash
git clone https://github.com/buildoak/codex-task-subagent.git
cd codex-task-subagent/skill/codex-subagent
bun install
bun run src/codex-agent.ts "your prompt"
```

## Proven Patterns

What consistently works in production:
- Keep main-thread prompts short and role-specific.
- Use Codex for implementation/review passes, then route back to Claude for synthesis.
- Escalate to DEEP mode when chains exceed 2 steps.
- Use `--network` only when dependency install or web access is required.
- Use `--full` only in trusted repos and bounded tasks.

## License

MIT
