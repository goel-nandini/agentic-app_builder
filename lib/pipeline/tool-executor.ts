/**
 * Tool Executor — Phase 4
 * Runs individual tool calls with retry logic, timeouts, and graceful failure.
 * Only executes tools with executionContext === "server".
 * Sandbox/stub tools are returned as informational stubs.
 */

import { GoogleGenAI } from "@google/genai";
import type { ToolCallLog } from "@/types/pipeline";
import type { FileData } from "@/types/workspace";
import { SANDBOX_BASE_DEPENDENCIES } from "./tool-registry";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});

const MAX_RETRY = 2;
const TOOL_TIMEOUT_MS = 8000;

// ─── Utilities ────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Tool timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function retry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

// ─── web_search ──────────────────────────────────────────────────────────────

async function executeWebSearch(query: string, intent: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a technical research assistant. Answer this query concisely and with high technical precision.
Focus on: ${intent}

Query: ${query}

Provide:
1. Top 2-3 relevant options or findings (name, key fact, URL if known)
2. Which option is recommended and why
3. Any critical implementation detail or gotcha

Keep response under 250 words. Be specific and actionable.`,
          },
        ],
      },
    ],
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
    },
  });

  const text = response.text ?? "";
  // Strip grounding metadata, keep only the text
  return text.slice(0, 1500).trim();
}

// ─── package_search ───────────────────────────────────────────────────────────

async function executePackageSearch(keyword: string): Promise<string> {
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(keyword)}&size=5&quality=0.7&popularity=0.3`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { "User-Agent": "agentic-app-builder/1.0" },
  });

  if (!res.ok) throw new Error(`NPM search failed: ${res.status}`);

  const data = (await res.json()) as {
    objects: Array<{
      package: { name: string; description: string; version: string; links?: { npm?: string } };
      score: { final: number };
    }>;
  };

  if (!data.objects?.length) return "No packages found for this keyword.";

  const results = data.objects
    .slice(0, 4)
    .map((o, i) => {
      const inSandbox = SANDBOX_BASE_DEPENDENCIES.has(o.package.name);
      return `${i + 1}. ${o.package.name}@${o.package.version} (score: ${o.score.final.toFixed(2)})${inSandbox ? " ✅ Already in sandbox" : ""}
   ${o.package.description ?? "No description"}`;
    })
    .join("\n");

  return results;
}

// ─── documentation_search ────────────────────────────────────────────────────

async function executeDocumentationSearch(url: string, topic: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    headers: { "User-Agent": "agentic-app-builder/1.0", Accept: "text/html,text/plain" },
  });

  if (!res.ok) throw new Error(`Doc fetch failed: ${res.status} for ${url}`);

  const html = await res.text();

  // Strip HTML tags and collapse whitespace
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  // Use AI to extract the relevant section
  const extracted = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Extract ONLY the key information about "${topic}" from the following documentation text.
Return a concise, actionable implementation guide (under 200 words).

DOC TEXT:
${text}`,
          },
        ],
      },
    ],
    config: { temperature: 0.1 },
  });

  return extracted.text?.slice(0, 1000).trim() ?? "Could not extract documentation.";
}

// ─── list_files (sandbox-aware) ───────────────────────────────────────────────

function executeListFiles(fileData: FileData | null): string {
  if (!fileData?.files) return "No files in current sandbox project.";
  const paths = Object.keys(fileData.files);
  return `Current sandbox files (${paths.length}):\n${paths.map((p) => `  ${p}`).join("\n")}`;
}

// ─── read_file (sandbox-aware) ────────────────────────────────────────────────

function executeReadFile(fileData: FileData | null, path: string): string {
  if (!fileData?.files) return "No sandbox files available.";
  const file = fileData.files[path];
  if (!file) return `File not found: ${path}. Available: ${Object.keys(fileData.files).join(", ")}`;
  const preview = file.code.slice(0, 800);
  return `File: ${path}\n\`\`\`\n${preview}${file.code.length > 800 ? "\n...(truncated)" : ""}\n\`\`\``;
}

// ─── install_dependency ───────────────────────────────────────────────────────

async function executeInstallDependency(
  packageName: string,
  version: string,
  reason: string
): Promise<string> {
  // Safety: block packages that could expose secrets or are clearly malicious
  const BLOCKED_PATTERNS = [/dotenv/, /process\.env/, /secret/, /credential/, /\.env/i];
  if (BLOCKED_PATTERNS.some((p) => p.test(packageName))) {
    throw new Error(`Package '${packageName}' is blocked by safety policy.`);
  }

  // Skip if already in sandbox base deps
  if (SANDBOX_BASE_DEPENDENCIES.has(packageName)) {
    return `SKIPPED: '${packageName}' is already included in the sandbox base dependencies. No installation needed.`;
  }

  // Validate on npm registry
  const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
    signal: AbortSignal.timeout(4000),
    headers: { "User-Agent": "agentic-app-builder/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Package '${packageName}' not found on npm registry (${res.status}).`);
  }

  const meta = (await res.json()) as { name: string; version: string };
  return `VALIDATED: '${meta.name}@${meta.version}' exists on npm. Will be added to sandbox dependencies. Reason: ${reason}`;
}

// ─── Main Tool Dispatcher ─────────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  fileData?: FileData | null
): Promise<ToolCallLog> {
  const start = Date.now();

  const baseLog: Omit<ToolCallLog, "result" | "success" | "durationMs" | "error"> = {
    tool: toolName,
    reason: (args.reason as string) || "",
    args,
  };

  // Stub tools — return informational response without executing
  const STUB_TOOLS = new Set([
    "run_command",
    "run_build",
    "run_lint",
    "run_tests",
    "start_app",
    "stop_app",
    "get_app_status",
    "get_preview_url",
    "open_page",
    "click",
    "type",
    "scroll",
    "screenshot",
    "create_file",
    "edit_file",
    "delete_file",
  ]);

  if (STUB_TOOLS.has(toolName)) {
    return {
      ...baseLog,
      result: `[SANDBOX] '${toolName}' is managed by the Sandpack sandbox runtime and Code Generator.`,
      success: true,
      durationMs: Date.now() - start,
      skipped: true,
      skipReason: "Sandbox/stub tool — handled by Code Generator and Sandpack runtime",
    };
  }

  try {
    const result = await withTimeout(
      retry(async () => {
        switch (toolName) {
          case "web_search":
            return await executeWebSearch(
              args.query as string,
              args.intent as string
            );

          case "package_search":
            return await executePackageSearch(args.keyword as string);

          case "documentation_search":
            return await executeDocumentationSearch(
              args.url as string,
              args.topic as string
            );

          case "list_files":
            return executeListFiles(fileData ?? null);

          case "read_file":
            return executeReadFile(fileData ?? null, args.path as string);

          case "install_dependency":
            return await executeInstallDependency(
              args.packageName as string,
              args.version as string,
              args.reason as string
            );

          default:
            return `Unknown tool: ${toolName}`;
        }
      }, MAX_RETRY),
      TOOL_TIMEOUT_MS
    );

    return {
      ...baseLog,
      result,
      success: true,
      durationMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[TOOL-EXECUTOR] Tool '${toolName}' failed: ${errorMsg}`);

    return {
      ...baseLog,
      result: null,
      success: false,
      durationMs: Date.now() - start,
      error: errorMsg,
    };
  }
}
