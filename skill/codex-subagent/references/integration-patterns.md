# Codex Subagent — Integration Patterns

How to use Codex subagent from different contexts within Claude Code.

---

## Core Concept: Nested Subagents

Claude Code has two types of subagents:

1. **Claude subagents** — spawned via Task tool, runs Claude
2. **Codex subagents** — spawned via this tool, runs OpenAI Codex

The key insight: these can be nested. A Claude subagent can spawn a Codex subagent. This creates multi-model pipelines.

```
Main Thread (Claude)
    |
    ├── Task tool -> Claude subagent
    |       |
    |       └── Bash tool -> Codex subagent
    |
    └── Bash tool -> Codex subagent (direct)
```

---

## Pattern 1: Direct Invocation from Main Thread

**When:** Main Claude thread needs Codex for a focused task.

**Flow:**
```
Claude (main) -> Codex (subagent) -> result back to Claude
```

**Example — Security review before commit:**

```typescript
// Claude's reasoning:
// "User wants to commit. Let me have Codex review first."

// Claude runs:
// bun run src/codex-agent.ts --cwd /path/to/repo --reasoning high \
//   "Review staged changes for security issues"

// Codex returns JSON with findings
// Claude synthesizes and presents to user
```

**Best for:**
- One-off verification tasks
- When Claude wants a second opinion
- Simple request-response patterns

---

## Pattern 2: From Claude Subagent (Nested)

**When:** A Claude subagent (Task) is doing work that benefits from Codex.

**Flow:**
```
Claude (main) -> Claude subagent (Task) -> Codex (subagent) -> result to subagent -> summary to main
```

**Example — Codebase audit with mixed analysis:**

```typescript
// Claude main spawns Task for audit
// Task: "Audit src/ for code quality issues"

// Inside the Task, Claude subagent reasons:
// "I'll analyze architecture myself, but let Codex check for bugs"

// Claude subagent runs Codex:
// bun run src/codex-agent.ts --cwd /path/to/repo \
//   "Find bugs in src/services/"

// Codex returns findings
// Claude subagent combines with its own analysis
// Returns comprehensive audit to main thread
```

**Best for:**
- Complex tasks requiring both Claude and Codex strengths
- When a subagent encounters work better suited for Codex
- Division of labor within a larger task

---

## Pattern 3: Parallel Codex Instances

**When:** Multiple independent code areas need analysis.

**Flow:**
```
Claude (main) -> [Codex 1, Codex 2, Codex 3] (parallel) -> aggregate results
```

**Example — Multi-module security review:**

```bash
# Claude spawns multiple Codex instances in parallel (via background jobs or sequential calls)

# Instance 1: Auth module
bun run src/codex-agent.ts --cwd /repo -r high "Review src/auth/ for security issues"

# Instance 2: Payments module
bun run src/codex-agent.ts --cwd /repo -r high "Review src/payments/ for security issues"

# Instance 3: API module
bun run src/codex-agent.ts --cwd /repo -r high "Review src/api/ for security issues"

# Claude aggregates all findings into unified report
```

**Best for:**
- Large codebases with independent modules
- Parallelizable analysis tasks
- Time-sensitive reviews

---

## Pattern 4: Pipeline (Codex -> Claude)

**When:** Codex generates/refactors, Claude reviews.

**Flow:**
```
Codex (generate at xhigh) -> output -> Claude subagent (audit) -> fixes -> done
```

**This is the validated 10x pattern from digital-employee-day.**

**Example — Feature implementation with review:**

```bash
# Step 1: Codex implements
bun run src/codex-agent.ts --cwd /repo --sandbox workspace-write -r xhigh \
  "Implement the notification system per docs/spec.md"

# Step 2: Claude reviews Codex's output
# (Claude examines the changes, looking for what Codex might have missed)

# Step 3: If issues found, iterate
```

**Why this works:**
- Codex is fast at large-scale generation
- Claude catches edge cases, over-engineering, subtle bugs
- Different training = different blind spots = higher combined confidence

**Best for:**
- Feature implementation
- Large refactoring
- Any task where generation + review is valuable

---

## Pattern 5: Ping-Pong (Claude -> Codex -> Claude -> ...)

**When:** Iterative refinement between models.

**Flow:**
```
Claude (plan) -> Codex (implement) -> Claude (review) -> Codex (fix) -> Claude (verify) -> done
```

**Example — Complex feature development:**

```
1. Claude writes detailed implementation plan
2. Codex implements according to plan
3. Claude reviews, finds issues
4. Codex fixes issues
5. Claude verifies fixes, approves for merge
```

**Best for:**
- Complex features requiring iteration
- When neither model gets it right first try
- High-stakes code requiring multiple passes

---

## Anti-Patterns

### Don't: Nest Too Deep

```
Claude -> Claude subagent -> Codex -> (another level?)
```

Keep nesting to 2 levels max. Deeper nesting adds latency and loses context.

### Don't: Use Codex for Context-Heavy Tasks

Codex has no memory of your conversation. If the task requires understanding what was discussed, Claude should do it.

```
# BAD: Codex can't know what "the approach we discussed" means
"Implement the approach we discussed earlier"

# GOOD: Self-contained prompt with all context
"Implement user authentication using JWT tokens. Store tokens in httpOnly cookies. Refresh tokens should have 7-day expiry."
```

### Don't: Skip --cwd

Codex needs to know where to look. Always specify `--cwd`.

```bash
# BAD: Codex doesn't know which repo
bun run src/codex-agent.ts "Review the auth code"

# GOOD: Explicit repo path
bun run src/codex-agent.ts --cwd /path/to/repo "Review the auth code"
```

### Don't: Use xhigh for Everything

Higher reasoning = slower + more expensive. Match effort to task:

```bash
# BAD: xhigh for simple check
bun run src/codex-agent.ts -r xhigh "Check if the linter passes"

# GOOD: minimal for simple checks
bun run src/codex-agent.ts -r minimal "Check if the linter passes"

# GOOD: xhigh for security-critical code
bun run src/codex-agent.ts -r xhigh "Audit the crypto implementation"
```

---

## Best Practices

### 1. Match Sandbox to Task

| Task Type | Sandbox |
|-----------|---------|
| Review, audit, analysis | `read-only` |
| Bug fixes, refactoring | `workspace-write` |
| System commands needed | `danger-full-access` (rarely) |

### 2. Provide Rich Context in Prompts

Codex sees only the prompt. Include:
- File paths to focus on
- Relevant constraints or requirements
- Output format expectations
- Severity classification criteria

### 3. Parse and Validate Output

Always check `success` before using `response`:

```javascript
const result = JSON.parse(stdout);
if (!result.success) {
  // Handle error: result.error, result.code
  return;
}
// Use result.response
```

### 4. Synthesize Multi-Model Views

When using Codex for verification:
1. Get Codex's findings
2. Consider Claude's perspective
3. Present unified view to user
4. Note disagreements explicitly

### 5. Set Appropriate Timeouts

Default is 120s. Large codebases or complex analysis may need more:

```bash
# For large repos or xhigh reasoning
bun run src/codex-agent.ts --timeout 300000 -r xhigh "Deep analysis..."
```

---

## Decision Tree: When to Use Which Pattern

```
Is the task code-focused?
├── No -> Use Claude (don't invoke Codex)
└── Yes -> Does it need conversation context?
    ├── Yes -> Use Claude
    └── No -> Is it verification/review?
        ├── Yes -> Pattern 1 or 4 (Codex for review)
        └── No -> Is it implementation?
            ├── Small scope -> Claude is fine
            └── Large scope -> Pattern 4 (Codex generates, Claude reviews)
                            or Pattern 5 (ping-pong for iteration)
```
