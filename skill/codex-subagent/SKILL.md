---
name: codex-subagent
description: |
  General-purpose Codex subagent for code-focused tasks using OpenAI Codex (default: GPT-5.3-Codex).
  Spawns an independent Codex agent the same way Claude's Task tool spawns Claude subagents.
  Can be invoked from Claude's main thread OR from Claude subagents (nested pattern).

  Trigger when:
  - User explicitly requests Codex ("have Codex do this", "spawn a Codex agent")
  - Cross-model verification or second opinion needed
  - Security review, vulnerability scan, or auth/crypto/payment code analysis
  - Bug hunting, debugging, or root-cause analysis
  - Code generation or implementation where Codex's style fits
  - Refactoring, cleanup, or large-scale code transformations
  - Codebase analysis or exploration
  - Any code-focused task that benefits from a different model's perspective
  - Nested subagent pattern: Claude subagent needs to spawn a Codex worker

  Prefer NOT to trigger for:
  - Simple tasks that don't benefit from model diversity
  - Single-file edits where Claude is already doing fine

  Do NOT use for:
  - Architecture planning (Claude is better — Codex lacks conversation context)
  - Creative writing, documentation, or prose
  - Tasks requiring conversation history (Codex sees only the prompt)
  - Research or web-based tasks (Codex has no MCP access)
---

# Codex Subagent

Spawn OpenAI Codex as an independent subagent from Claude Code. Same pattern as Claude's Task tool, different model. Use when you want a second perspective, parallel execution, or Codex-specific strengths.

**Key insight:** Claude subagents can invoke Codex. This creates multi-model pipelines — Claude plans, Codex executes, Claude reviews. Nested depth is your choice.

---

## When to Use

| Use Case | Why Codex |
|----------|-----------|
| **Verification & review** | Different training catches different bugs |
| **Implementation & generation** | Parallel execution, fresh perspective |
| **Debugging & analysis** | If Claude is stuck, try a different model |
| **Refactoring** | Large-scale transforms at scale |
| **Codebase exploration** | Fresh eyes on unfamiliar code |
| **Nested subagent work** | Claude subagent delegates to Codex |

**The 10x pattern:** Codex generates/refactors at scale, Claude catches what Codex misses. Different blind spots = higher confidence than either model alone.

---

## When NOT to Use

- **Architecture planning** — Codex has no conversation context
- **Creative/writing tasks** — Claude's strength
- **Tasks needing chat history** — Codex sees only the prompt
- **Research with MCP** — Codex can't access your servers
- **Simple boilerplate** — overhead not worth it

---

## Invocation

**Skill location:** `codex-subagent/` (this folder)

### Prerequisites (first run only)

```bash
bun install
```

### Basic Usage

```bash
bun run src/codex-agent.ts "Your prompt here"
```

### With Options

```bash
bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  --reasoning high \
  "Implement the feature described in SPEC.md"
```

---

## CLI Flags

| Flag | Short | Values | Default | Notes |
|------|-------|--------|---------|-------|
| `--sandbox` | `-s` | `read-only`, `workspace-write`, `danger-full-access` | `read-only` | `read-only` for review, `workspace-write` for edits |
| `--model` | `-m` | Any Codex model string | `gpt-5.3-codex` | Passed through to SDK |
| `--reasoning` | `-r` | `minimal`, `low`, `medium`, `high`, `xhigh` | `medium` | Higher = deeper analysis, slower, costlier |
| `--cwd` | `-C` | path | current dir | Point at the repo to analyze |
| `--timeout` | `-t` | milliseconds | 120000 | Increase for large codebases |

---

## Reasoning Effort Guide

| Level | When to Use |
|-------|-------------|
| `minimal` | Quick smoke checks, formatting validation |
| `low` | Simple scoped tasks, straightforward fixes |
| `medium` | Default — routine review, implementation |
| `high` | Security review, complex debugging, refactoring |
| `xhigh` | Architecture decisions, deep edge-case analysis, crypto/auth |

**Rule of thumb:**
- Planning/architecture: `xhigh` (worth the cost)
- Implementation: `high` (sufficient quality)
- Routine checks: `medium`

---

## Output Format

Success:
```json
{
  "success": true,
  "response": "Codex's analysis or output...",
  "items": [/* tool calls made by Codex */]
}
```

Failure:
```json
{
  "success": false,
  "error": "Error message",
  "code": "SDK_ERROR" | "TIMEOUT" | "INVALID_ARGS"
}
```

---

## Example Prompts by Use Case

### Verification & Review

```bash
# Security review
"Review the authentication flow in src/auth/. Look for: token handling issues, session bugs, permission bypasses, injection vulnerabilities."

# Pre-ship check
"This code is about to ship. Scan for: obvious bugs, unhandled errors, security issues, missing edge cases. Be thorough."

# Code review
"Review the changes in src/api/handlers.ts. Focus on error handling, input validation, and type safety."
```

### Implementation & Generation

```bash
# Feature implementation
"Implement the user preferences API according to the spec in docs/preferences-api.md. Follow existing patterns in src/api/."

# Test generation
"Generate comprehensive tests for src/parser/. Cover edge cases, error conditions, and the happy path."

# Migration
"Migrate all React class components in src/components/ to functional components with hooks."
```

### Debugging & Analysis

```bash
# Bug hunt
"The tests in src/parser/ are failing intermittently. Analyze for race conditions, edge cases, or state leaks."

# Root cause analysis
"Users report 500 errors on /api/checkout. Trace the code path and identify likely causes."

# Performance investigation
"The dashboard loads slowly. Profile the data fetching in src/dashboard/ and identify bottlenecks."
```

### Refactoring

```bash
# Code cleanup
"Refactor src/utils/legacy.ts to use modern TypeScript patterns. Maintain all existing functionality."

# Pattern standardization
"Standardize error handling across all API routes in src/api/ to use the ErrorResult pattern."

# Deduplication
"Find and consolidate duplicate validation logic across the codebase."
```

---

## Integration Patterns

### From Main Thread

Claude's main thread spawns Codex for a focused task:

```
Claude (main) -> Codex (subagent) -> result back to Claude
```

Use case: Claude is working on a feature, wants Codex to verify before commit.

### From Claude Subagent (Nested)

Claude subagent spawns Codex for part of its work:

```
Claude (main) -> Claude subagent (Task) -> Codex (subagent) -> result to Claude subagent -> summary to main
```

Use case: Claude subagent is auditing a codebase, uses Codex for specific file analysis.

### Parallel Execution

Multiple Codex instances for parallel work:

```
Claude (main) -> [Codex 1, Codex 2, Codex 3] -> aggregate results
```

Use case: Reviewing multiple modules simultaneously.

### Pipeline (Codex -> Claude)

Codex generates, Claude reviews:

```
Codex (generate at xhigh) -> Claude subagent (audit) -> fixes -> done
```

This is the **validated 10x pattern** from digital-employee-day: Codex generates at scale, Claude catches what Codex misses.

---

## Anti-Patterns

**DON'T:**
- Use `danger-full-access` for review tasks (read-only suffices)
- Send vague "analyze everything" prompts (scope it)
- Trust Codex output blindly (validate high-impact findings)
- Use `xhigh` for trivial checks (waste of compute)
- Run mutation prompts without VCS safeguards
- Expect Codex to remember previous interactions
- Skip `--cwd` (Codex needs to know where to look)

**DO:**
- Always specify `--cwd` pointing to the repo
- Match sandbox mode to task (`read-only` vs `workspace-write`)
- Increase `--reasoning` for security-sensitive code
- Parse JSON output and synthesize with Claude's view
- Use for focused, well-scoped tasks with clear deliverables

---

## Files

- **Agent:** `src/codex-agent.ts`
- **Skill:** `SKILL.md`

## Progressive Disclosure

- **Detailed examples:** `references/examples.md`
- **Integration patterns:** `references/integration-patterns.md`
