import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import type { Message, FileData } from "@/types/workspace";
import { aj } from "@/lib/arcjet";

import { analyzeRequirements } from "@/lib/pipeline/analyzer";
import { generatePlan } from "@/lib/pipeline/planner";
import { exploreDesignDNA } from "@/lib/pipeline/design-explorer";
import { evaluateGeneratedApp } from "@/lib/pipeline/evaluator";
import { runSelfHealingFixer } from "@/lib/pipeline/fixer";
import { runToolAgent } from "@/lib/pipeline/tool-agent";

import {
  retrieveRelevantMemory,
  extractUserPreferences,
  buildGenerationReport,
  updateProjectMemory,
} from "@/lib/pipeline/memory";
import type {
  AppSpecification,
  AppPlan,
  DesignDNA,
  ToolResearchContext,
  ToolCallLog,
  ProjectMemory,
  UserDesignPreferences,
  MemoryRetrievalContext,
  FixerResult,
} from "@/types/pipeline";



const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});


// ─── SSE helper ───────────────────────────────────────────────────────────────

function sseEvent(type: string, payload: unknown): string {
  return `data: ${JSON.stringify({ type, ...(payload as object) })}\n\n`;
}

// ─── Extract short label from a Gemini thought chunk ─────────────────────────
// Gemini thoughts often start with a bold heading like **Verify Config**
// We extract that. If no bold heading, take the first sentence only.

function extractThoughtLabel(text: string): string | null {
  // Try to grab **bold heading** at the start
  const boldMatch = text.match(/\*\*([^*]{4,60})\*\*/);
  if (boldMatch) return boldMatch[1].trim();

  // Fall back to first sentence (up to first . or \n), capped at 60 chars
  const sentence = text.split(/[.\n]/)[0].trim();
  if (sentence.length >= 8 && sentence.length <= 80) return sentence;

  return null;
}

// ─── npm validation ───────────────────────────────────────────────────────────

const KNOWN_SAFE_PACKAGES = new Set([
  "react",
  "react-dom",
  "lucide-react",
  "recharts",
  "framer-motion",
  "clsx",
  "tailwind-merge",
  "date-fns",
  "react-router-dom",
  "zod",
  "react-hook-form",
  "@hookform/resolvers",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-tabs",
  "@radix-ui/react-tooltip",
  "@radix-ui/react-accordion",
  "@radix-ui/react-select",
  "axios",
  "class-variance-authority",
]);

async function validateDependencies(
  deps: Record<string, string>
): Promise<Record<string, string>> {
  const valid: Record<string, string> = {};
  await Promise.all(
    Object.entries(deps).map(async ([pkg, version]) => {
      if (KNOWN_SAFE_PACKAGES.has(pkg)) {
        valid[pkg] = version;
        return;
      }
      try {
        const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`, {
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok) valid[pkg] = version;
      } catch {
        // silently skip hallucinated packages
      }
    })
  );
  return valid;
}

function cleanAndParseJson(raw: string) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error("Unable to parse JSON from AI response");
  }
}

// ─── History trimming ─────────────────────────────────────────────────────────

function trimHistory(messages: Message[]): Message[] {
  if (messages.length <= 10) return messages;
  return [messages[0], ...messages.slice(-8)];
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a World-Class Full-Stack React Software Architect and UI/UX Designer.
Your mission is to build STUNNING, unique, production-grade, and 100% fully functional React web applications tailored PRECISELY to the provided App Specification, Architectural Plan, and bespoke Design DNA (supporting English, Hindi, Hinglish, casual phrases, or detailed specifications).

CRITICAL ARCHITECTURE & CREATIVE PRINCIPLES:

1. STRICTLY ENFORCE THE BESPOKE DESIGN DNA (HARD CONSTRAINT):
   - Adopt the EXACT visualStyle, designMood, colorStrategy, typographyStrategy, layoutStrategy, and componentShapeStrategy designated in the Design DNA.
   - STRICTLY AVOID every pattern listed in the Design DNA's 'avoidPatterns' blacklist.
   - Do NOT fall back to generic SaaS dashboards, default purple gradients, or uninspired 3-card rows unless the domain explicitly demands it.
   - Tailor the visual identity and layout specifically to the product domain (e.g. warm tactile pet profiles, Swiss high-density finance, magazine editorial portfolios, arcade game HUDs, or crisp invoice utilities).

2. REAL WORKING FUNCTIONALITY & COMPLETE STATE MANAGEMENT:
   - EVERY button, toggle, filter, search bar, slider, form, tab, and modal MUST be fully functional with React state ('useState', 'useEffect', 'useMemo', 'useCallback').
   - NEVER provide dummy/dead buttons or non-functional placeholder handlers.
   - CRITICAL SANDBOX / PREVIEW INTERACTIVITY RULES:
     * The app runs inside a browser preview iframe. NEVER rely exclusively on keyboard events without providing clear ON-SCREEN CLICKABLE CONTROLS.
     * For games or keyboard-driven tools, ALWAYS include both On-Screen Touch/Click Controls AND keyboard listeners, with a click-to-focus helper.
     * Search bars actually filter items dynamically in real-time.
     * Category/status tabs switch active views smoothly.
     * Forms validate inputs and add/update items in state.
     * Deletion, toggling, favoriting, and editing mutate state immediately with clean visual feedback.
   - Populate with generous, rich domain-specific realistic mock data (realistic names, prices, stats, avatars, descriptions, and high-resolution Unsplash image URLs).

3. 100% RESPONSIVE DESIGN (LAPTOP, TABLET, MOBILE):
   - The app must fit and look gorgeous on all screen sizes (100% full screen laptop, 768px tablet, 390px mobile).
   - Follow the responsive layout strategy specified in the Design DNA.
   - Avoid fixed widths that cause horizontal scrolling. Use 'w-full', 'max-w-full', 'truncate', 'flex-wrap'.

4. MODULAR MULTI-FILE ARCHITECTURE & STRICT JSX RULES:
   - Implement the modular files specified in the Component Architecture plan:
     * "/App.js": Main application shell, state hub, layout. Default export.
     * Component files matching the domain (e.g. "/components/Header.js", "/components/MainView.js", etc.).
     * "/data/mockData.js": Domain-specific initial data and constants.
   - CRITICAL JSX SYNTAX RULES:
     * EVERY self-closing tag MUST be closed with '/>' (e.g. <input ... />, <img ... />, <br />, <hr />).
     * Every opening tag MUST have an exact matching closing tag.
     * Include 'import React, { useState, useEffect } from "react";' at the top of every component file.
     * Pure JavaScript/JSX only (no TypeScript syntax in sandbox files).

5. OUTPUT FORMAT (STRICT JSON ONLY):
   - Return ONLY a single raw JSON object (NO markdown backticks, NO surrounding text outside JSON):
{
  "assistantMessage": "<enthusiastic 1-2 sentence overview of what was created with reference to the bespoke design style>",
  "title": "<short 2-4 word clean title for the project>",
  "files": {
    "/App.js": { "code": "<complete valid javascript code>" },
    "/components/Navbar.js": { "code": "<complete valid javascript code>" },
    "/components/MainView.js": { "code": "<complete valid javascript code>" },
    "/data/mockData.js": { "code": "<complete valid javascript code>" }
  },
  "dependencies": {
    "lucide-react": "^0.475.0",
    "recharts": "^2.15.0"
  }
}`;

// ─── Gemini contents builder ──────────────────────────────────────────────────

function buildContents(
  messages: Message[],
  fileData: FileData | null,
  spec?: AppSpecification,
  plan?: AppPlan,
  designDNA?: DesignDNA,
  researchContext?: ToolResearchContext,
  memoryContext?: MemoryRetrievalContext
) {
  const trimmed = trimHistory(messages);

  return trimmed.map((msg, idx) => {
    const role = msg.role === "assistant" ? "model" : "user";

    if (msg.role === "user") {
      const parts: object[] = [];

      let text = msg.content;

      if (msg.imageUrl) {
        text = `[The user has attached an image. Use this URL directly in the generated app where relevant (as img src, background-image, etc.): ${msg.imageUrl}]\n\n${text}`;
      }

      const isLast = idx === trimmed.length - 1;
      if (isLast) {
        if (spec && plan && designDNA) {
          text += `\n\n══════════════════════════════════════════════════════════════════\nAPPROVED APP SPECIFICATION:\n${JSON.stringify(spec, null, 2)}\n\n══════════════════════════════════════════════════════════════════\nARCHITECTURAL & IMPLEMENTATION PLAN:\n${JSON.stringify(plan, null, 2)}\n\n══════════════════════════════════════════════════════════════════\nMANDATORY BESPOKE DESIGN DNA (HARD CONSTRAINT):\n${JSON.stringify(designDNA, null, 2)}\n══════════════════════════════════════════════════════════════════\nCRITICAL DESIGN DNA EXECUTION RULES:\n- Visual Style & Mood: ${designDNA.visualStyle} (${designDNA.designMood})\n- Layout System: ${designDNA.layoutStrategy}\n- Component Shapes: Use ${designDNA.componentShapeStrategy.borderRadius} corners, '${designDNA.componentShapeStrategy.borderStyle}', and '${designDNA.componentShapeStrategy.cardStyle}'\n- Colors: Background (${designDNA.colorStrategy.background}), Surface (${designDNA.colorStrategy.surface}), Text (${designDNA.colorStrategy.textPrimary}), Accent (${designDNA.colorStrategy.accent}). Rule: ${designDNA.colorStrategy.usageRules}\n- FORBIDDEN PATTERNS TO STRICTLY AVOID:\n${designDNA.avoidPatterns.map((p) => `  * ${p}`).join("\n")}\n\nImplement the complete React application files adhering strictly to this plan, specification, and bespoke Design DNA.`;
        }

        // ── Inject Tool Research Context if available ────────────────────────
        if (researchContext?.wasResearchNeeded && researchContext.synthesizedContext) {
          text += `\n\n══════════════════════════════════════════════════════════════════\n🔍 TOOL RESEARCH CONTEXT (from autonomous research phase):\n${researchContext.synthesizedContext}${researchContext.recommendedPackages.length > 0 ? `\n\nRECOMMENDED PACKAGES: ${researchContext.recommendedPackages.join(", ")}` : ""}${researchContext.apiEndpoints.length > 0 ? `\nKEY API ENDPOINTS: ${researchContext.apiEndpoints.slice(0, 3).join(", ")}` : ""}\n══════════════════════════════════════════════════════════════════\nCRITICAL: Use the research context above to implement the most accurate and up-to-date solution. Prefer the recommended packages and API patterns.`;
        }

        // ── Inject Prior Quality Directives from Memory if available ────────
        if (memoryContext?.hasMemory && memoryContext.priorFixesToRemember.length > 0) {
          text += `\n\n══════════════════════════════════════════════════════════════════\n🛡️ HISTORICAL QUALITY DIRECTIVES (Prevent Regression):\nIn previous runs for this workspace, the following fixes had to be applied:\n${memoryContext.priorFixesToRemember.map((f) => `- ${f}`).join("\n")}\nEnsure your generated code avoids these exact failure modes.\n══════════════════════════════════════════════════════════════════`;
        }

        if (fileData) {
          text +=
            "\n\nCurrent project files for context:\n" +
            JSON.stringify(fileData, null, 2);
        }
      }

      parts.push({ text });
      return { role, parts };
    }

    return { role, parts: [{ text: msg.content }] };
  });
}



// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceId, userId, messages, fileData } = body as {
    workspaceId: string | null;
    userId: string;
    messages: Message[];
    fileData: FileData | null;
  };

  if (!messages?.length) {
    return Response.json({ message: "No messages provided" }, { status: 400 });
  }

  // ── Arcjet: rate limit, prompt injection, sensitive info ──────────────────
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (lastUserMessage) {
    const decision = await aj.protect(request, {
      requested: 1,
      userId: clerkId,
      detectPromptInjectionMessage: lastUserMessage,
      sensitiveInfoValue: lastUserMessage,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return Response.json(
          { message: "Rate limit exceeded. Please wait a moment before generating again." },
          { status: 429 }
        );
      }
      if (decision.reason.isPromptInjection()) {
        return Response.json(
          { message: "Prompt injection detected. Request blocked." },
          { status: 400 }
        );
      }
      if (decision.reason.isSensitiveInfo()) {
        return Response.json(
          { message: "Sensitive information detected in prompt. Request blocked." },
          { status: 400 }
        );
      }
      return Response.json(
        { message: "Request blocked by security policy." },
        { status: 403 }
      );
    }
  }

  let user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, credits: true, preferences: true },
  });

  if (!user) {
    const synced = await checkUser();
    if (synced) {
      user = { id: synced.id, credits: synced.credits, preferences: {} as any };
    }
  }

  if (!user)
    return Response.json({ message: "User not found" }, { status: 404 });
  if (user.credits < CREDIT_COST_PER_GENERATION) {
    return Response.json({ message: "Insufficient credits" }, { status: 402 });
  }

  const currentUserId = user.id;

  // Retrieve existing Workspace Memory if available
  let existingWorkspaceMemory: ProjectMemory | null = null;
  if (workspaceId) {
    const existingWs = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { memory: true },
    });
    if (existingWs?.memory && typeof existingWs.memory === "object") {
      existingWorkspaceMemory = existingWs.memory as unknown as ProjectMemory;
    }
  }

  // Retrieve relevant memory context for this generation run
  const memoryContext = retrieveRelevantMemory(
    existingWorkspaceMemory,
    (user.preferences as unknown as UserDesignPreferences) ?? null,
    lastUserMessage
  );

  if (memoryContext.hasMemory) {
    console.log(`[MEMORY] Retrieved memory context: ${memoryContext.userPreferences.length} preferences, ${memoryContext.recentDesignFootprints.length} design footprints`);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: string) =>
        controller.enqueue(encoder.encode(chunk));

      try {
        // ─── Stage 0: Tool Agent — Research & Context Gathering ─────────────
        enqueue(sseEvent("status", { message: "Assessing research needs…" }));
        const toolStart = Date.now();
        let researchContext: ToolResearchContext | undefined;
        try {
          researchContext = await runToolAgent(
            messages,
            // We need a quick spec for tool decisions — run analyzer first
            // but we'll run the full analyzer below. Use message content directly.
            { appName: "app", appType: "web app", coreFeatures: [messages[messages.length - 1]?.content ?? ""] } as AppSpecification,
            fileData,
            (log: ToolCallLog) => {
              // Stream each tool call log to the client in real-time
              enqueue(sseEvent("tool_log", {
                tool: log.tool,
                reason: log.reason,
                result: log.result,
                success: log.success,
                durationMs: log.durationMs,
                skipped: log.skipped ?? false,
                skipReason: log.skipReason,
                error: log.error,
              }));
            }
          );
        } catch (toolErr) {
          console.warn("[TOOL-AGENT] Research phase failed gracefully:", toolErr);
        }
        if (researchContext?.wasResearchNeeded) {
          enqueue(sseEvent("status", { message: `Research complete — ${researchContext.toolCallLogs.length} tool(s) executed in ${Date.now() - toolStart}ms` }));
          console.log(`[TOOL-AGENT] Research done in ${Date.now() - toolStart}ms. Packages: ${researchContext.recommendedPackages.join(", ") || "none"}`);
        }

        // ─── Stage 1: Requirement Analyzer ─────────────────────────────────
        enqueue(sseEvent("status", { message: "Analyzing requirements & intent…" }));
        const specStart = Date.now();
        const appSpec = await analyzeRequirements(messages, fileData, memoryContext);
        console.log(`[ANALYZER] Completed specification for "${appSpec.appName}" (${appSpec.appType}) in ${Date.now() - specStart}ms`);

        // Re-run tool agent with proper spec if initial research detected needs
        // (Tool Agent was seeded with raw message — now refine with real spec context)
        if (!researchContext?.wasResearchNeeded) {
          try {
            const refinedContext = await runToolAgent(
              messages,
              appSpec,
              fileData,
              (log: ToolCallLog) => {
                enqueue(sseEvent("tool_log", {
                  tool: log.tool,
                  reason: log.reason,
                  result: log.result,
                  success: log.success,
                  durationMs: log.durationMs,
                  skipped: log.skipped ?? false,
                  skipReason: log.skipReason,
                  error: log.error,
                }));
              }
            );
            if (refinedContext.wasResearchNeeded) {
              researchContext = refinedContext;
              enqueue(sseEvent("status", { message: `Research complete — ${refinedContext.toolCallLogs.length} tool(s) used` }));
            }
          } catch { /* graceful skip */ }
        }

        // ─── Stage 2: Architecture & UX Planner ─────────────────────────────
        enqueue(sseEvent("status", { message: "Formulating architectural & UX plan…" }));
        const planStart = Date.now();
        const appPlan = await generatePlan(appSpec, fileData);
        console.log(`[PLANNER] Planned ${appPlan.componentArchitecture.length} components in ${Date.now() - planStart}ms`);

        // ─── Stage 3: Design Explorer & Design DNA ──────────────────────────
        enqueue(sseEvent("status", { message: "Exploring bespoke design concepts & Crafting Design DNA…" }));
        const dnaStart = Date.now();
        const explorerResult = await exploreDesignDNA(appSpec, appPlan, fileData, memoryContext);
        const designDNA = explorerResult.designDNA;
        console.log(`[DESIGN-DNA] Selected "${designDNA.conceptName}" (Quality: ${designDNA.designQualityScore}/10, Uniqueness: ${designDNA.uniquenessScore}/10, Style: "${designDNA.visualStyle}") in ${Date.now() - dnaStart}ms`);

        // ─── Stage 4: Code Generation ───────────────────────────────────────
        enqueue(sseEvent("status", { message: "Generating full-stack application code…" }));
        const contents = buildContents(messages, fileData, appSpec, appPlan, designDNA, researchContext, memoryContext);


        const CANDIDATE_MODELS = [
          "gemini-3.1-flash-lite",
          "gemini-3.5-flash",
          "gemini-3.7-flash",
          "gemini-flash-latest",
          "gemini-3.6-flash",
        ];

        let geminiStream = null;
        let lastError = null;
        let selectedModel = "";
        const genStart = Date.now();


        for (const model of CANDIDATE_MODELS) {
          try {
            console.log(`[GENERATION] Gemini started with model ${model}`);
            geminiStream = await ai.models.generateContentStream({
              model,
              contents,
              config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.7,
                responseMimeType: "application/json",
                maxOutputTokens: 8192,
              },
            });
            selectedModel = model;
            break;
          } catch (err: any) {
            console.warn(`[GENERATION] Model ${model} failed, trying next candidate:`, err?.message || err);
            lastError = err;
          }
        }

        if (!geminiStream) {
          throw lastError || new Error("Failed to generate code with AI models");
        }

        let accumulated = ""; // final JSON output
        let lastEmitTime = 0; // throttle thought emissions

        for await (const chunk of geminiStream) {
          const parts = chunk.candidates?.[0]?.content?.parts ?? [];

          for (const part of parts) {
            if (!part.text) continue;

            if (part.thought) {
              // Extract just the short label — not the full wall of text
              const now = Date.now();
              if (now - lastEmitTime > 600) {
                const label = extractThoughtLabel(part.text);
                if (label) {
                  enqueue(sseEvent("status", { message: label }));
                  lastEmitTime = now;
                }
              }
            } else {
              // Actual JSON output
              accumulated += part.text;
            }
          }
        }

        const genDuration = Date.now() - genStart;
        console.log(`[GENERATION] Gemini completed in ${genDuration}ms with model ${selectedModel}. Output length: ${accumulated.length} chars`);

        // ── Parse the complete JSON response ──────────────────────────────────

        let parsed: {
          assistantMessage: string;
          title?: string;
          files: Record<string, { code: string }>;
          dependencies: Record<string, string>;
        };

        try {
          parsed = cleanAndParseJson(accumulated);
        } catch {
          enqueue(
            sseEvent("error", {
              message: "AI returned invalid JSON. Please try again.",
            })
          );
          controller.close();
          return;
        }

        const {
          assistantMessage,
          title: aiTitle,
          files,
          dependencies,
        } = parsed;

        if (!files || typeof files !== "object") {
          enqueue(
            sseEvent("error", {
              message: "AI response missing files. Please try again.",
            })
          );
          controller.close();
          return;
        }

        // ─── Stage 5: Inspect, Critique & Self-Healing Loop ──────────────────
        enqueue(sseEvent("status", { message: "Evaluating quality & inspecting code…" }));
        const critique = await evaluateGeneratedApp(files, appSpec, appPlan, designDNA);
        let finalFiles = files;
        let fixResult: FixerResult | null = null;

        if (!critique.passed && critique.criticalIssues.length > 0) {
          enqueue(sseEvent("status", { message: "Self-healing critic refining code…" }));
          fixResult = await runSelfHealingFixer(files, critique, appSpec, appPlan, designDNA, 1);
          finalFiles = fixResult.fixedFiles;
          console.log(`[FIXER] Applied ${fixResult.fixesApplied.length} autonomous fix(es) across ${fixResult.attemptCount} iteration(s)`);
        }


        // ── Validate npm packages ──────────────────────────────────────────────

        enqueue(sseEvent("status", { message: "Validating packages…" }));
        const validatedDeps = await validateDependencies(dependencies ?? {});
        const newFileData: FileData = {
          files: finalFiles,
          dependencies: validatedDeps,
          title: aiTitle,
        };

        // ─── Phase 5: Build Generation Report & Update Project Memory ─────────
        const updatedUserPreferences = extractUserPreferences(
          lastUserMessage,
          (user.preferences as unknown as UserDesignPreferences) ?? undefined
        );

        const generationReport = buildGenerationReport({
          userPrompt: lastUserMessage,
          spec: appSpec,
          plan: appPlan,
          designDNA,
          exploredConcepts: explorerResult.exploredConcepts,
          toolLogs: researchContext?.toolCallLogs,
          evaluation: critique,
          fixesApplied: fixResult?.fixesApplied,
          iterationsPerformed: fixResult ? fixResult.attemptCount : 1,
        });

        const updatedProjectMemory = updateProjectMemory(
          existingWorkspaceMemory,
          generationReport,
          designDNA,
          updatedUserPreferences
        );

        console.log(`[MEMORY] Generated report ${generationReport.generationId} (Score: ${generationReport.evaluationScores.overall}/10). Total memory records: ${updatedProjectMemory.generationReports.length}`);

        // ── Database persistence & credit deduction ────────────────────────────

        enqueue(sseEvent("status", { message: "Saving…" }));
        const dbStart = Date.now();
        console.log(`[DATABASE] Save started for user ${currentUserId}`);

        const updatedMessages: Message[] = [
          ...messages,
          { role: "assistant", content: assistantMessage },
        ];

        let workspace;
        let updatedUser;

        try {
          // Perform sequential fast database operations outside interactive transaction lock
          // to prevent P2028 pooler timeout
          if (workspaceId) {
            workspace = await db.workspace.update({
              where: { id: workspaceId },
              data: {
                message: updatedMessages as never,
                fileData: newFileData as never,
                memory: updatedProjectMemory as never,
              },
            });
          } else {
            workspace = await db.workspace.create({
              data: {
                userId: currentUserId,
                name: aiTitle ?? "Workspace",
                title: aiTitle ?? lastUserMessage.slice(0, 80),
                message: updatedMessages as never,
                fileData: newFileData as never,
                memory: updatedProjectMemory as never,
              },
            });
          }

          updatedUser = await db.user.update({
            where: { id: currentUserId },
            data: {
              credits: { decrement: CREDIT_COST_PER_GENERATION },
              preferences: updatedUserPreferences as never,
            },
            select: { credits: true },
          });

          const dbDuration = Date.now() - dbStart;
          console.log(`[DATABASE] Save completed in ${dbDuration}ms`);
        } catch (dbErr: any) {
          const isTimeout =
            dbErr?.code === "P2028" ||
            (typeof dbErr?.message === "string" && dbErr.message.includes("P2028"));
          if (isTimeout) {
            console.error("[DATABASE] P2028 transaction timeout:", dbErr);
          } else {
            console.error("[DATABASE] Database save failed:", dbErr);
          }
          enqueue(
            sseEvent("error", {
              message: isTimeout
                ? "Database save timed out. Please try again."
                : "Application generation succeeded, but saving the workspace failed.",
            })
          );
          controller.close();
          return;
        }

        // ── Emit final result ──────────────────────────────────────────────────

        enqueue(
          sseEvent("done", {
            workspaceId: workspace.id,
            assistantMessage,
            fileData: newFileData,
            creditsRemaining:
              updatedUser?.credits ?? user.credits - CREDIT_COST_PER_GENERATION,
          })
        );
      } catch (err) {
        console.error("[gen-ai-code] stream error:", err);
        enqueue(
          sseEvent("error", {
            message: "Something went wrong. Please try again.",
          })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export const runtime = "nodejs";
export const maxDuration = 300; // for vercel - 300s on Fluid