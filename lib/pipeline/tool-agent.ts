/**
 * Tool Agent — Phase 4
 * Autonomous reasoning layer that decides WHEN and WHICH tools to use
 * before code generation. Conservative policy: only research when genuinely needed.
 *
 * Decision flow:
 * 1. Receives user messages + AppSpecification
 * 2. AI reasons: should we research? Which tools?
 * 3. Executes approved tool calls via tool-executor.ts
 * 4. Synthesizes results into ToolResearchContext for the Code Generator
 */

import { GoogleGenAI } from "@google/genai";
import type {
  AppSpecification,
  AgentToolDecision,
  AgentToolCall,
  ToolCallLog,
  ToolResearchContext,
} from "@/types/pipeline";
import type { Message, FileData } from "@/types/workspace";
import { buildToolMenuForPrompt } from "./tool-registry";
import { executeTool } from "./tool-executor";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});

const MAX_TOOL_CALLS_PER_RUN = 4; // Safety cap

// ─── Decision Prompt ──────────────────────────────────────────────────────────

const TOOL_AGENT_SYSTEM = `You are the Research Intelligence layer of an autonomous app-building agent.

Your job is to decide IF and WHICH research tools to call BEFORE the Code Generator runs.

POLICY — Only call tools when:
1. The user explicitly wants live/external data (weather, stocks, maps, news, currency)
2. The user requests a specific library you are not 100% certain exists or is the best option
3. The user asks for an unusual/cutting-edge interaction (3D, WebGL, audio, AR) that benefits from research
4. The sandbox has no suitable existing package and you need to verify one

DO NOT call tools for:
- Standard CRUD apps, todo lists, landing pages, portfolios
- Apps using libraries already available (recharts, framer-motion, lucide-react, radix-ui, axios)
- Anything solvable from training knowledge with high confidence

MAX tools to call: 4. Be selective. Quality > quantity.

OUTPUT: Strict JSON only:
{
  "shouldResearch": true,
  "reasoning": "<1-2 sentences explaining why research is or is not needed>",
  "toolCalls": [
    {
      "tool": "<tool_name>",
      "reason": "<specific reason for this call>",
      "args": { "<param>": "<value>" }
    }
  ]
}

If shouldResearch is false, toolCalls must be an empty array [].`;

import { jsonrepair } from "jsonrepair";

function cleanJson(raw: string): unknown {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(jsonrepair(cleaned));
    } catch {
      const fb = cleaned.indexOf("{");
      const lb = cleaned.lastIndexOf("}");
      if (fb !== -1 && lb > fb) return JSON.parse(cleaned.slice(fb, lb + 1));
      throw new Error("Unable to parse Tool Agent decision JSON");
    }
  }
}

// ─── Decision Step ────────────────────────────────────────────────────────────

async function decideToolCalls(
  messages: Message[],
  spec: AppSpecification
): Promise<AgentToolDecision> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const toolMenu = buildToolMenuForPrompt();

  const prompt = `Analyze the following app request and decide which (if any) research tools to call.

USER REQUEST:
${lastUserMsg}

APP SPECIFICATION SUMMARY:
- App: ${spec.appName} (${spec.appType})
- Core Features: ${spec.coreFeatures.slice(0, 5).join(", ")}
- Requirements: ${spec.functionalRequirements.slice(0, 3).join(", ")}
- Things to Avoid: ${spec.thingsToAvoid.slice(0, 3).join(", ")}

AVAILABLE RESEARCH TOOLS (server-executable):
${toolMenu}

Decide and return JSON.`;

  const CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-flash-latest"];

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: TOOL_AGENT_SYSTEM,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });
      const raw = res.text ?? "";
      if (!raw) continue;
      const parsed = cleanJson(raw) as AgentToolDecision;
      return {
        shouldResearch: Boolean(parsed.shouldResearch),
        reasoning: parsed.reasoning || "No reasoning provided",
        toolCalls: Array.isArray(parsed.toolCalls)
          ? (parsed.toolCalls as AgentToolCall[]).slice(0, MAX_TOOL_CALLS_PER_RUN)
          : [],
      };
    } catch (err) {
      console.warn(`[TOOL-AGENT] Decision model ${model} failed:`, err);
    }
  }

  // Safe fallback: no research
  return {
    shouldResearch: false,
    reasoning: "AI decision model unavailable — skipping research phase.",
    toolCalls: [],
  };
}

// ─── Context Synthesizer ──────────────────────────────────────────────────────

async function synthesizeResearchContext(
  toolLogs: ToolCallLog[],
  spec: AppSpecification
): Promise<string> {
  const successfulResults = toolLogs
    .filter((l) => l.success && !l.skipped && l.result)
    .map((l) => `[${l.tool}]\n${l.result}`)
    .join("\n\n");

  if (!successfulResults) {
    return "No external research context — generate from training knowledge.";
  }

  const prompt = `Synthesize the following tool research results into a concise implementation context for a React app code generator.

APP: ${spec.appName} (${spec.appType})

RESEARCH RESULTS:
${successfulResults}

Write a structured implementation brief (under 300 words) with:
1. RECOMMENDED APPROACH: The best technology/API/library choice and why
2. KEY IMPLEMENTATION DETAILS: Specific code-level facts (API endpoint, import name, usage pattern)
3. AVOID: Any pitfalls or alternatives to skip

Be specific and code-actionable.`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1 },
    });
    return res.text?.slice(0, 2000).trim() ?? successfulResults.slice(0, 1500);
  } catch {
    return successfulResults.slice(0, 1500);
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function runToolAgent(
  messages: Message[],
  spec: AppSpecification,
  fileData: FileData | null,
  onToolLog?: (log: ToolCallLog) => void
): Promise<ToolResearchContext> {
  const toolCallLogs: ToolCallLog[] = [];

  // Step 1: AI decides
  let decision: AgentToolDecision;
  try {
    decision = await decideToolCalls(messages, spec);
  } catch {
    decision = { shouldResearch: false, reasoning: "Decision error", toolCalls: [] };
  }

  console.log(
    `[TOOL-AGENT] Decision: shouldResearch=${decision.shouldResearch} | Reasoning: ${decision.reasoning} | Tools: ${decision.toolCalls.length}`
  );

  if (!decision.shouldResearch || decision.toolCalls.length === 0) {
    return {
      wasResearchNeeded: false,
      toolCallLogs: [],
      synthesizedContext: "",
      recommendedPackages: [],
      apiEndpoints: [],
      implementationGuidance: [],
    };
  }

  // Step 2: Execute approved tool calls sequentially
  for (const call of decision.toolCalls) {
    try {
      const log = await executeTool(call.tool, { ...call.args, reason: call.reason }, fileData);
      toolCallLogs.push(log);
      onToolLog?.(log);

      console.log(
        `[TOOL-AGENT] ${log.success ? "✅" : "❌"} ${log.tool} (${log.durationMs}ms)${log.skipped ? " [SKIPPED]" : ""}`
      );
    } catch (err) {
      const fallbackLog: ToolCallLog = {
        tool: call.tool,
        reason: call.reason,
        args: call.args,
        result: null,
        success: false,
        durationMs: 0,
        error: err instanceof Error ? err.message : String(err),
      };
      toolCallLogs.push(fallbackLog);
      onToolLog?.(fallbackLog);
    }
  }

  // Step 3: Synthesize context from results
  const synthesizedContext = await synthesizeResearchContext(toolCallLogs, spec);

  // Extract structured signals from logs
  const recommendedPackages: string[] = [];
  const apiEndpoints: string[] = [];
  const implementationGuidance: string[] = [];

  for (const log of toolCallLogs) {
    if (!log.success || !log.result) continue;

    // Extract package names from package_search results
    if (log.tool === "package_search") {
      const pkgMatches = log.result.match(/\d+\.\s([\w@/-]+)@/g);
      if (pkgMatches) {
        recommendedPackages.push(
          ...pkgMatches.map((m) => m.replace(/^\d+\.\s/, "").split("@")[0])
        );
      }
    }

    // Extract URLs from web_search results
    if (log.tool === "web_search") {
      const urlMatches = log.result.match(/https?:\/\/[^\s"')]+/g);
      if (urlMatches) {
        apiEndpoints.push(...urlMatches.slice(0, 3));
      }
    }

    // Always add non-empty results as guidance
    if (log.result.length > 20) {
      implementationGuidance.push(`[${log.tool}] ${log.result.slice(0, 300)}`);
    }
  }

  return {
    wasResearchNeeded: true,
    toolCallLogs,
    synthesizedContext,
    recommendedPackages: [...new Set(recommendedPackages)],
    apiEndpoints: [...new Set(apiEndpoints)],
    implementationGuidance,
  };
}
