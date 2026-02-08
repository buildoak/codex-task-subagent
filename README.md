# codex-task-subagent

Use [OpenAI Codex](https://platform.openai.com/docs/guides/codex) as a task subagent for Claude Code. Claude Code with Opus 4.6 is already a prompt master via the subagents pattern, which makes it an ideal orchestrator for Codex.

## The Idea

The core value is cross-model verification: Codex gives you an additional pair of eyes with a different mindset. Models trained differently fail differently, so a second model catches different classes of bugs, logic gaps, and risky assumptions. In practice, this is the real 10x enabler.

**codex-task-subagent** is a self-contained skill + CLI. The distributable unit is `skill/codex-subagent/`: it contains `SKILL.md`, runtime source, references, and runtime dependencies.

### Nested Subagents: The 10x Pattern (Architectural Bonus)

Claude Code already has subagents via the Task tool. This project adds Codex as a subagent inside Claude workflows:

```
You (human)
  └── Claude Code (orchestrator)
        ├── Claude subagent (Task tool — writes code)
        └── Codex subagent (this skill — verifies code)
              └── Codex reads files, runs commands, analyzes
```

Why this helps:
- Smooth delegation: Claude writes, Codex verifies, same session
- Better confidence: cross-model agreement before shipping
- Context preservation: Claude delegates focused checks to Codex

## Repository Structure

```
codex-task-subagent/
├── skill/
│   └── codex-subagent/
│       ├── SKILL.md
│       ├── src/
│       │   └── codex-agent.ts
│       ├── references/
│       │   ├── examples.md
│       │   └── integration-patterns.md
│       ├── package.json
│       └── tsconfig.json
├── README.md
├── LICENSE
└── .gitignore
```

## Installation

### 1) As a Claude Code Skill (Recommended)

```bash
cp -r skill/codex-subagent /path/to/project/.claude/skills/ && cd /path/to/project/.claude/skills/codex-subagent && bun install
```

Claude Code will auto-discover `codex-subagent` from `.claude/skills/codex-subagent/SKILL.md`.

### 2) As a Standalone CLI

```bash
git clone https://github.com/buildoak/codex-task-subagent.git && cd codex-task-subagent/skill/codex-subagent && bun install && bun run src/codex-agent.ts "prompt"
```

Requires Bun and `OPENAI_API_KEY`.

## Claude Code Self-Install

Claude Code can install this skill autonomously by reading this README and executing the install command in your project. Because all runtime files live under `skill/codex-subagent/`, installation is just copy + `bun install`.

## Usage

```bash
cd /path/to/project/.claude/skills/codex-subagent
bun run src/codex-agent.ts "Review this repo for security issues"
bun run src/codex-agent.ts --cwd /path/to/repo -r high "Review auth flow for vulnerabilities"
bun run src/codex-agent.ts --sandbox workspace-write "Fix failing tests"
```

## Cross-Model Verification Pattern

1. Claude Code writes code
2. Codex reviews with fresh-model analysis
3. Compare perspectives and patch issues
4. Re-run Codex for pre-ship confidence

Different models catch different classes of mistakes.

## Future Vision

We are pursuing deeper research into best practices for multi-agent collaboration. The focus is how different models complement each other, which delegation patterns work best, and when to use which model for maximum reliability and speed. Over time, this project aims to turn those findings into practical, repeatable operating patterns for teams.

## License

MIT
