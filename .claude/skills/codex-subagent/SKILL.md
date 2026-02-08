---
name: codex-subagent
description: Use OpenAI Codex as a verification subagent for repository-level analysis, including security review, bug hunting, pre-ship verification, and cross-model checks after another agent writes or edits code.
triggers:
  - User asks for security review, exploitability analysis, or auth/crypto risk checks
  - User asks for bug hunting, regression discovery, or root-cause validation
  - User asks for pre-ship verification, release readiness checks, or final QA gates
  - User asks for cross-model validation or a second opinion from Codex
---

# Codex Subagent Skill

Use this skill to run OpenAI Codex as an independent verification subagent from Claude Code.

## Use Codex When

- Run security review on changed or legacy code.
- Hunt bugs and regressions with fresh-model analysis.
- Perform pre-ship verification before merge or release.
- Check cross-model agreement after code authored by another model.
- Validate assumptions in tests, error handling, permissions, and edge cases.

## Do Not Use Codex When

- Planning architecture, product direction, or long-horizon refactors.
- Brainstorming naming, UX copy, or creative writing tasks.
- Generating simple boilerplate where verification overhead is unnecessary.
- Needing conversational ideation instead of concrete repository checks.

## Invocation

Run Codex directly with Bun:

```bash
bun run src/codex-agent.ts "<prompt>"
```

Common forms:

```bash
bun run src/codex-agent.ts --cwd /path/to/repo "Review the latest auth changes"
bun run src/codex-agent.ts --sandbox workspace-write "Fix failing tests and explain root cause"
bun run src/codex-agent.ts --reasoning high "Find security issues in payment flow"
bun run src/codex-agent.ts --model gpt-5.3-codex --timeout 300000 "Pre-ship verification"
```

## CLI Flags

| Flag | Short | Values | Default | Notes |
| --- | --- | --- | --- | --- |
| `--sandbox` | `-s` | `read-only`, `workspace-write`, `danger-full-access` | `read-only` | Controls file-system and command permissions for Codex |
| `--model` | `-m` | Any Codex model string | `gpt-5.3-codex` | Passed through to Codex SDK |
| `--reasoning` | `-r` | `minimal`, `low`, `medium`, `high`, `xhigh` | `medium` | Increases depth/cost/latency with higher levels |
| `--cwd` | `-C` | Path | Current directory | Working directory for Codex thread |
| `--timeout` | `-t` | Positive integer (ms) | `120000` | Hard timeout for the run |
| `--help` | `-h` | n/a | n/a | Prints usage and exits |

Positional input:

- Final positional text is treated as the prompt.
- Empty prompt returns `INVALID_ARGS`.

## Reasoning Effort Guide

| Level | Use Case |
| --- | --- |
| `minimal` | Fast smoke checks, formatting sanity |
| `low` | Small scoped tasks, straightforward bug checks |
| `medium` | Default for routine reviews and verification |
| `high` | Security reviews, regression hunts, pre-ship gates |
| `xhigh` | Deep edge-case analysis, auth/crypto/high-risk code |

## Output Format Reference

Successful execution returns JSON to stdout:

```json
{
  "success": true,
  "response": "Analysis results...",
  "items": []
}
```

Failure returns JSON to stdout:

```json
{
  "success": false,
  "error": "Error description",
  "code": "SDK_ERROR | TIMEOUT | INVALID_ARGS"
}
```

Operational behavior:

- Non-zero exit code on failure.
- Timeout errors use `code: "TIMEOUT"`.
- Argument parse errors use `code: "INVALID_ARGS"`.

## Example Prompts

Security review:

```text
Review auth middleware and session handling for privilege escalation or token misuse.
```

Bug hunt:

```text
Find likely causes of intermittent 500s in this repo and propose targeted fixes.
```

Code review:

```text
Review the latest changes for correctness, regressions, and missing tests.
```

Pre-ship check:

```text
Run a pre-ship verification on the current branch: security, stability, and release blockers.
```

## Anti-Patterns

- Using `danger-full-access` for passive review tasks that only require read access.
- Requesting broad “analyze everything” prompts without scope, path, or intent.
- Treating Codex output as final truth without validating high-impact recommendations.
- Using high/xhigh reasoning for trivial style-only checks.
- Running mutation/fix prompts against production-like repos without VCS safeguards.

## Integration Pattern (5 Steps)

1. Primary agent writes or updates code.
2. Invoke Codex with a verification-specific prompt and repo context.
3. Require Codex to classify findings by severity and confidence.
4. Reconcile disagreements across models; patch code or tests.
5. Re-run Codex for final pre-ship confirmation before merge/release.
