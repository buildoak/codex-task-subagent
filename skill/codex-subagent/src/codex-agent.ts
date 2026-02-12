/**
 * codex-agent.ts — General-purpose Codex subagent
 *
 * Usage:
 *   bun run src/codex-agent.ts "Your prompt here"
 *   bun run src/codex-agent.ts --sandbox workspace-write "Fix the tests"
 *   bun run src/codex-agent.ts --cwd /path/to/repo "Analyze this"
 *   bun run src/codex-agent.ts --timeout 300000 "Big task"
 *   bun run src/codex-agent.ts --model gpt-5.3-codex --reasoning xhigh "Deep analysis"
 *
 * Output: JSON to stdout
 *   { "success": true, "response": "...", "items": [...] }
 *   { "success": false, "error": "...", "code": "..." }
 */

import { Codex, type CodexOptions, type ModelReasoningEffort, type SandboxMode } from "@openai/codex-sdk";
import { parseArgs } from "node:util";
import { resolveClusters, listClusters, ALL_KNOWN_SERVERS } from "/Users/otonashi/thinking/pratchett-os/centerpiece/.claude/skills/_shared/mcp-clusters.ts";

// --- Types ---

interface CodexResult {
  success: true;
  response: string;
  items: unknown[];
}

interface CodexError {
  success: false;
  error: string;
  code: "INVALID_ARGS" | "SDK_ERROR" | "TIMEOUT";
}

type Output = CodexResult | CodexError;

// --- Config ---

const DEFAULT_SANDBOX: SandboxMode = "read-only";
const DEFAULT_MODEL = "gpt-5.3-codex";
const DEFAULT_REASONING: ModelReasoningEffort = "medium";
const VALID_REASONING: ModelReasoningEffort[] = ["minimal", "low", "medium", "high", "xhigh"];

// Timeout defaults scaled by reasoning effort
const TIMEOUT_BY_REASONING: Record<ModelReasoningEffort, number> = {
  minimal: 120_000,    // 2 min
  low: 120_000,        // 2 min
  medium: 600_000,     // 10 min
  high: 1_200_000,     // 20 min
  xhigh: 2_400_000,    // 40 min
};

function getDefaultTimeout(reasoning: ModelReasoningEffort): number {
  return TIMEOUT_BY_REASONING[reasoning] ?? 120_000;
}
const HELP_TEXT = `Usage: bun run src/codex-agent.ts [options] "prompt"

Options:
  -s, --sandbox <mode>     Sandbox mode: read-only (default), workspace-write, danger-full-access
  -m, --model <name>       Model string passed directly to Codex (default: gpt-5.3-codex)
  -r, --reasoning <level>  Reasoning effort: minimal, low, medium (default), high, xhigh
  -C, --cwd <dir>          Working directory for Codex
  -t, --timeout <ms>       Positive timeout in ms (default: 2min/2min/10min/20min/40min by reasoning)
  -d, --add-dir <path>     Additional writable directory (repeatable, workspace-write only)
  -n, --network            Enable network access (for npm install, web requests, etc.)
  -f, --full               Full access mode: danger-full-access sandbox + network enabled
  -b, --browser            Enable browser MCP cluster (sugar for --mcp-cluster browser)
      --mcp-cluster <name> Enable an MCP cluster (repeatable). No MCPs enabled by default.
  -h, --help               Show this help

MCP Clusters:
${listClusters()}

Examples:
  bun run src/codex-agent.ts "What does this repo do?"
  bun run src/codex-agent.ts --sandbox workspace-write "Fix the failing tests"
  bun run src/codex-agent.ts --cwd /path/to/repo "Analyze architecture"
  bun run src/codex-agent.ts -m gpt-5.3-codex -r high "Review for security issues"
  bun run src/codex-agent.ts -r xhigh "Deep analysis of edge cases"
  bun run src/codex-agent.ts --full "Install deps and implement feature"
  bun run src/codex-agent.ts --sandbox workspace-write --cwd /repo --add-dir /repo/../data "Cross-dir writes"
  bun run src/codex-agent.ts --browser --cwd /repo "Navigate to site and take screenshot"
  bun run src/codex-agent.ts --mcp-cluster knowledge "Search the knowledge base"
  bun run src/codex-agent.ts --mcp-cluster browser --mcp-cluster research "Browse and search"`;

type ParseResult =
  | {
      kind: "ok";
      prompt: string;
      sandbox: SandboxMode;
      model: string;
      reasoning: ModelReasoningEffort;
      cwd?: string;
      timeout: number;
      network: boolean;
      addDirs: string[];
      browser: boolean;
      mcpClusters: string[];
    }
  | { kind: "help" }
  | { kind: "invalid"; error: string };

// --- Argument Parsing ---

function parseCliArgs(): ParseResult {
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: {
        sandbox: { type: "string", short: "s" },
        model: { type: "string", short: "m" },
        reasoning: { type: "string", short: "r" },
        cwd: { type: "string", short: "C" },
        timeout: { type: "string", short: "t" },
        "add-dir": { type: "string", short: "d", multiple: true },
        network: { type: "boolean", short: "n" },
        full: { type: "boolean", short: "f" },
        browser: { type: "boolean", short: "b" },
        "mcp-cluster": { type: "string", multiple: true },
        help: { type: "boolean", short: "h" },
      },
    });

    if (values.help) {
      return { kind: "help" };
    }

    const prompt = positionals.join(" ").trim();

    // Reject empty or whitespace-only prompts
    if (!prompt) {
      return { kind: "invalid", error: "A prompt is required." };
    }

    // --full overrides sandbox to danger-full-access and enables network
    const fullMode = values.full === true;
    const sandbox = fullMode
      ? "danger-full-access"
      : (values.sandbox as SandboxMode) || DEFAULT_SANDBOX;
    const model = values.model || DEFAULT_MODEL;
    const reasoning = (values.reasoning as ModelReasoningEffort) || DEFAULT_REASONING;
    const network = fullMode || values.network === true;
    const addDirs = (values["add-dir"] as string[] | undefined) ?? [];

    let timeout = getDefaultTimeout(reasoning);
    if (values.timeout !== undefined) {
      const timeoutText = values.timeout.trim();
      if (!/^\d+$/.test(timeoutText)) {
        return { kind: "invalid", error: "--timeout must be a positive integer in milliseconds." };
      }

      const parsedTimeout = parseInt(timeoutText, 10);
      if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
        return { kind: "invalid", error: "--timeout must be a positive integer in milliseconds." };
      }
      timeout = parsedTimeout;
    }

    // Validate sandbox mode
    if (!["read-only", "workspace-write", "danger-full-access"].includes(sandbox)) {
      return { kind: "invalid", error: `Invalid sandbox mode: ${sandbox}.` };
    }

    // Validate reasoning effort
    if (!VALID_REASONING.includes(reasoning)) {
      return { kind: "invalid", error: `Invalid reasoning effort: ${reasoning}.` };
    }

    // Collect MCP cluster names
    const mcpClusters: string[] = (values["mcp-cluster"] as string[] | undefined) ?? [];
    // --browser is sugar for --mcp-cluster browser
    if (values.browser === true && !mcpClusters.includes("browser")) {
      mcpClusters.push("browser");
    }

    return {
      kind: "ok",
      prompt,
      sandbox,
      model,
      reasoning,
      cwd: values.cwd,
      timeout,
      network,
      addDirs,
      browser: values.browser === true,
      mcpClusters,
    };
  } catch (err) {
    return {
      kind: "invalid",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --- Output Helpers ---

function output(result: Output): never {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

function fail(error: string, code: CodexError["code"]): never {
  output({ success: false, error, code });
}

// --- Main Execution ---

async function runCodex(
  prompt: string,
  sandbox: SandboxMode,
  model: string,
  reasoning: ModelReasoningEffort,
  cwd?: string,
  timeout?: number,
  network?: boolean,
  addDirs?: string[],
  mcpClusters?: string[]
): Promise<Output> {
  // Build MCP config overrides
  // Strategy: disable ALL known servers from config.toml, then enable only requested clusters
  const mcpOverride: Record<string, Record<string, unknown>> = {};

  // First: disable all known MCP servers (overrides config.toml auto-loading)
  for (const name of ALL_KNOWN_SERVERS) {
    mcpOverride[name] = { enabled: false };
  }

  // Then: enable only servers from requested clusters
  if (mcpClusters && mcpClusters.length > 0) {
    const resolved = resolveClusters(mcpClusters);
    for (const [name, config] of Object.entries(resolved)) {
      mcpOverride[name] = { enabled: true, ...config };
    }
  }

  const codexOptions: CodexOptions = {
    config: { mcp_servers: mcpOverride },
  };

  const codex = new Codex(codexOptions);
  const thread = codex.startThread({
    model,
    sandboxMode: sandbox,
    modelReasoningEffort: reasoning,
    workingDirectory: cwd,
    skipGitRepoCheck: true,
    networkAccessEnabled: network,
    additionalDirectories: addDirs?.length ? addDirs : undefined,
  });

  // Race against timeout
  const timeoutMs = timeout || getDefaultTimeout(reasoning);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
  });

  try {
    const turn = await Promise.race([
      thread.run(prompt),
      timeoutPromise,
    ]);

    // Null checks for turn properties per audit
    return {
      success: true,
      response: turn.finalResponse ?? "(no response)",
      items: turn.items ?? [],
    };
  } catch (err) {
    if (err instanceof Error && err.message === "TIMEOUT") {
      return {
        success: false,
        error: `Codex timed out after ${timeoutMs / 1000}s`,
        code: "TIMEOUT",
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      code: "SDK_ERROR",
    };
  }
}

// --- Entry Point ---

async function main(): Promise<void> {
  const args = parseCliArgs();

  if (args.kind === "help") {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (args.kind === "invalid") {
    fail(`${args.error}\n\n${HELP_TEXT}`, "INVALID_ARGS");
  }

  const result = await runCodex(
    args.prompt,
    args.sandbox,
    args.model,
    args.reasoning,
    args.cwd,
    args.timeout,
    args.network,
    args.addDirs,
    args.mcpClusters
  );
  output(result);
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err), "SDK_ERROR");
});
