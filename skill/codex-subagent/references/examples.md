# Codex Subagent — Detailed Examples

Extended prompt examples organized by use case. For quick reference, see the main SKILL.md.

---

## Verification & Review

### Security Review — Auth Flow

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning high \
  "Review the authentication flow in src/auth/. Look for:
   - Token handling issues (expiry, refresh, storage)
   - Session management bugs (fixation, hijacking)
   - Permission bypasses (role escalation, missing checks)
   - Injection vulnerabilities (SQL, NoSQL, command)
   Report findings by severity: critical, high, medium, low."
```

### Security Review — Payment Flow

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning xhigh \
  "Audit the payment processing in src/payments/. Check for:
   - PCI compliance issues
   - Race conditions in transaction handling
   - Decimal precision bugs
   - State inconsistencies between payment providers
   - Error handling that could leave transactions in limbo
   This is payment code — be thorough."
```

### Pre-Ship Verification

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning high \
  "This branch is about to be merged. Pre-ship check:
   1. Obvious bugs or logic errors
   2. Unhandled error conditions
   3. Security issues
   4. Missing edge cases
   5. Type safety violations
   6. Incomplete implementations (TODOs that should be done)
   Classify each finding as: blocker, should-fix, nice-to-have."
```

### Code Review — Specific Files

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  "Review the changes in these files:
   - src/api/handlers/user.ts
   - src/api/handlers/session.ts
   Focus on: error handling, input validation, type safety, edge cases.
   Compare against patterns used elsewhere in src/api/handlers/."
```

### Dependency Audit

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning high \
  "Audit how external dependencies are used:
   1. Check for known insecure patterns
   2. Find deprecated API usage
   3. Identify unnecessary dependencies
   4. Look for version conflicts or compatibility issues
   Focus on security-sensitive deps: auth libs, crypto, data parsing."
```

---

## Implementation & Generation

### Feature Implementation

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  --reasoning high \
  "Implement user preferences API according to docs/specs/preferences-api.md.

   Requirements:
   - Follow patterns in src/api/handlers/ for structure
   - Use validation patterns from src/lib/validation.ts
   - Add appropriate error handling
   - Create types in src/types/preferences.ts

   Create all necessary files. Run tests after implementation."
```

### Test Generation

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  "Generate comprehensive tests for src/parser/.

   Cover:
   - Happy path for all public functions
   - Edge cases: empty input, malformed input, unicode
   - Error conditions and exception handling
   - Boundary values

   Follow test patterns in src/parser/__tests__/.
   Use vitest. Aim for 90%+ coverage."
```

### Migration — Class to Functional Components

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  --reasoning high \
  "Migrate all React class components in src/components/ to functional components.

   For each component:
   1. Convert lifecycle methods to useEffect
   2. Convert this.state to useState
   3. Convert this.props to destructured props
   4. Maintain all existing functionality and tests

   Skip components that are already functional.
   Document any edge cases that need manual review."
```

### API Implementation from OpenAPI Spec

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  --reasoning high \
  "Generate API handlers from the OpenAPI spec in docs/api.yaml.

   For each endpoint:
   - Create handler in src/api/handlers/
   - Add route registration in src/api/routes.ts
   - Create request/response types in src/types/api/
   - Add basic input validation

   Follow existing patterns. Use zod for validation."
```

---

## Debugging & Analysis

### Intermittent Test Failures

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning high \
  "The tests in src/parser/ are failing intermittently (pass 80% of the time).

   Analyze for:
   - Race conditions
   - Shared mutable state between tests
   - Time-dependent logic
   - Non-deterministic ordering
   - External dependencies (network, filesystem)

   Identify the likely cause and propose a fix."
```

### Production Error Investigation

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning high \
  "Users report 500 errors on POST /api/checkout after ~30 seconds.

   Error log snippet: 'Connection timeout: payment_gateway'

   Trace the code path from src/api/handlers/checkout.ts:
   1. Identify all external calls
   2. Check timeout configurations
   3. Find retry logic (or lack thereof)
   4. Look for connection pool exhaustion patterns

   Propose fixes ranked by impact and effort."
```

### Memory Leak Investigation

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning xhigh \
  "The server's memory usage grows linearly over time (restarts every 6 hours).

   Analyze the codebase for memory leaks:
   - Event listener accumulation
   - Cache without eviction
   - Closures holding references
   - Circular references preventing GC
   - Growing data structures

   Focus on long-lived services in src/services/.
   Report findings with file locations and line numbers."
```

### Performance Investigation

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning high \
  "The dashboard page takes 8+ seconds to load.

   Profile src/dashboard/:
   1. Data fetching patterns (serial vs parallel)
   2. N+1 query patterns
   3. Unnecessary re-renders
   4. Heavy computations on render
   5. Bundle size contributors

   Identify the top 3 bottlenecks with specific fixes."
```

---

## Refactoring

### Pattern Standardization

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  --reasoning high \
  "Standardize error handling across all API routes in src/api/.

   Target pattern (from src/lib/errors.ts):
   - Use AppError for application errors
   - Use ErrorResult<T> for typed error returns
   - Use the errorHandler middleware for HTTP translation

   Refactor all handlers to use this pattern.
   Preserve existing error semantics."
```

### Legacy Code Modernization

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  --reasoning high \
  "Refactor src/utils/legacy.ts to modern TypeScript:

   - Replace 'any' with proper types
   - Convert callbacks to async/await
   - Use destructuring and spread operators
   - Add proper error handling
   - Split into focused modules if too large

   All existing tests must pass after refactoring."
```

### Deduplication

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  "Find and consolidate duplicate validation logic across the codebase.

   1. Identify all validation patterns (email, phone, date, etc.)
   2. Create shared validators in src/lib/validators/
   3. Replace duplicates with imports
   4. Add tests for the shared validators

   Report: number of duplicates found, files changed, lines saved."
```

### Dependency Injection Refactor

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  --reasoning xhigh \
  "Refactor src/services/ to use dependency injection:

   Current: Services import dependencies directly
   Target: Services receive dependencies via constructor

   1. Create interfaces for all service dependencies
   2. Refactor services to accept deps via constructor
   3. Create a container in src/container.ts
   4. Update all service instantiations
   5. Update tests to inject mocks

   Maintain backward compatibility during transition."
```

---

## Codebase Exploration

### Architecture Understanding

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  "Analyze the codebase architecture:

   1. Identify the main modules and their responsibilities
   2. Map dependencies between modules
   3. Find the entry points (API routes, CLI commands, etc.)
   4. Document the data flow for a typical request

   Output: A structured overview suitable for onboarding."
```

### Dependency Mapping

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  "Map the dependency graph of src/core/:

   1. List all modules and what they import
   2. Identify circular dependencies
   3. Find modules with high fan-in (many dependents)
   4. Find modules with high fan-out (many dependencies)

   Output as a text-based dependency diagram."
```

---

## Complex Prompts (Multi-Step)

### Full Feature Implementation with Tests

```bash
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --sandbox workspace-write \
  --reasoning xhigh \
  --timeout 300000 \
  "Implement the notification system feature:

   Spec: docs/specs/notifications.md

   Steps:
   1. Create data models in src/models/notification.ts
   2. Create service in src/services/notification.ts
   3. Create API handlers in src/api/handlers/notifications.ts
   4. Add routes in src/api/routes.ts
   5. Create comprehensive tests
   6. Update API documentation

   Follow existing patterns. Run tests after each major step.
   If tests fail, fix before proceeding."
```

### Cross-Model Verification Pipeline

```bash
# Step 1: Claude implements feature
# Step 2: Codex verifies
SKILL_DIR="/path/to/project/.claude/skills/codex-subagent"
cd "$SKILL_DIR" && bun run src/codex-agent.ts \
  --cwd /path/to/repo \
  --reasoning high \
  "Claude just implemented a feature in src/features/export/.

   Verify:
   1. Does the implementation match the spec in docs/export-spec.md?
   2. Are there any obvious bugs or edge cases?
   3. Is error handling complete?
   4. Are there security concerns?
   5. Do the tests cover the important cases?

   Be constructively critical. Report issues by severity."
```
