import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import type { Message, FileData } from "@/types/workspace";
import { aj } from "@/lib/arcjet";

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
Your mission is to build STUNNING, production-grade, complete, and fully functional React web applications based on ANY user prompt (including natural language in English, Hindi, Hinglish, casual phrases, or detailed specifications).

CRITICAL ARCHITECTURE & DESIGN EXCELLENCE GUIDELINES:

1. PRODUCTION-GRADE, FEATURE-COMPLETE APPLICATION:
   - NEVER create a toy, basic, or half-baked MVP. The generated app must feel like a finished, commercially viable, premium SaaS or consumer product.
   - Every app MUST include:
     * TOP NAVBAR: App branding with icon, navigation links/pills with active indicators, live interactive search input, notification bell with badge, and user profile avatar.
     * KEY METRICS / STATS BAR: 3–4 insightful KPI cards (e.g. Total Revenue, Active Orders, Satisfaction Rate, Growth %) with colored trend badges (+14.2%), icons, and glassmorphic card borders.
     * MAIN INTERACTIVE WORKSPACE: Rich interactive views (e.g. product catalog, task board, audio player, crypto charts, activity feed) with category filter pills, sorting options, and search filtering.
     * WORKING MODALS & DRAWERS: Detail view modal, "Create / Add New" modal with a working form, cart slide-over, or settings drawer.
     * FULL INTERACTIVE STATE: Search filtering actually filters items, category pills switch tabs, Add/Delete/Toggle actions work in state, bookmark/favorite buttons toggle state.
     * GENEROUS REALISTIC MOCK DATA: In "/data/mockData.js", provide 6–10 detailed items with realistic titles, descriptions, prices/numbers, tags, dates, ratings, and real Unsplash photos (e.g. "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&q=80").

2. 100% RESPONSIVE IN ALL VIEWPORT MODES (LAPTOP, TABLET, MOBILE):
   - The root wrapper MUST be: 'min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden'
   - Responsive padding and max-widths: 'max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col'
   - Responsive grids: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
   - Responsive headers/sidebars: stack cleanly on mobile ('flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between')
   - No fixed pixel widths that cause horizontal overflow. Use 'w-full', 'max-w-full', 'truncate', and 'flex-wrap'.

3. ULTRA-PREMIUM MODERN VISUAL AESTHETICS:
   - Deep modern dark theme palette (slate-950 base, slate-900/70 cards, slate-800/80 borders, slate-400 secondary text).
   - Glassmorphism & subtle gradients: 'bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl'
   - Vibrant accent gradients for CTAs and highlights: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-medium shadow-lg shadow-indigo-500/25'
   - Micro-interactions: 'transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-indigo-500/10'
   - Polish badges: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold'
   - Extensively use 'lucide-react' icons across all buttons, cards, metrics, and navigation.

4. MODULAR MULTI-FILE CODE STRUCTURE & STRICT JSX RULES:
   - Split complex logic across clean, modular files:
     * "/App.js": Main application shell, state management (items, cart/favorites, active category, search query, modal open/close), top-level layout. Default export.
     * "/components/Navbar.js": Top navigation bar with branding, search, filter triggers, and profile.
     * "/components/StatsGrid.js": Key metric statistics cards with trends.
     * "/components/MainCatalog.js": Feature grid/list with filter pills, search results, and interactive item cards.
     * "/components/ItemModal.js": Interactive detail modal or create item modal.
     * "/data/mockData.js": Generous realistic mock datasets and categories.
   - CRITICAL JSX SYNTAX RULES:
     * EVERY self-closing HTML/JSX tag MUST be closed with '/>' (e.g. <input ... />, <img ... />, <br />, <hr />). NEVER leave '<input>' or '<img>' unclosed.
     * Ensure every JSX block is syntactically perfect with matching opening/closing tags, brackets, and parentheses.
     * Every component file MUST include: 'import React, { useState, useEffect } from "react";' at the top.
     * Do NOT use TypeScript syntax in generated sandbox files (pure clean React JSX).

5. DEPENDENCY SAFETY:
   - Supported packages: "lucide-react", "recharts", "framer-motion", "clsx", "tailwind-merge", "date-fns".
   - Do NOT import non-existent packages or files not declared in "files".

6. OUTPUT FORMAT (STRICT JSON ONLY):
   - Return ONLY a single raw JSON object (NO markdown backticks, NO surrounding text):
{
  "assistantMessage": "<enthusiastic 1-2 sentence overview of what was created>",
  "title": "<short 2-4 word clean title for the project>",
  "files": {
    "/App.js": { "code": "<complete valid javascript code>" },
    "/components/Navbar.js": { "code": "<complete valid javascript code>" },
    "/components/StatsGrid.js": { "code": "<complete valid javascript code>" },
    "/components/MainCatalog.js": { "code": "<complete valid javascript code>" },
    "/components/ItemModal.js": { "code": "<complete valid javascript code>" },
    "/data/mockData.js": { "code": "<complete valid javascript code>" }
  },
  "dependencies": {
    "lucide-react": "^0.475.0",
    "recharts": "^2.15.0"
  }
}`;

// ─── Gemini contents builder ──────────────────────────────────────────────────

function buildContents(messages: Message[], fileData: FileData | null) {
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
      if (isLast && fileData) {
        text +=
          "\n\nCurrent project files for context:\n" +
          JSON.stringify(fileData, null, 2);
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
    select: { id: true, credits: true },
  });

  if (!user) {
    const synced = await checkUser();
    if (synced) {
      user = { id: synced.id, credits: synced.credits };
    }
  }

  if (!user)
    return Response.json({ message: "User not found" }, { status: 404 });
  if (user.credits < CREDIT_COST_PER_GENERATION) {
    return Response.json({ message: "Insufficient credits" }, { status: 402 });
  }

  const currentUserId = user.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: string) =>
        controller.enqueue(encoder.encode(chunk));

      try {
        const contents = buildContents(messages, fileData);

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

        // ── Validate npm packages ──────────────────────────────────────────────

        enqueue(sseEvent("status", { message: "Validating packages…" }));
        const validatedDeps = await validateDependencies(dependencies ?? {});
        const newFileData: FileData = {
          files,
          dependencies: validatedDeps,
          title: aiTitle,
        };

        // ── Database persistence & credit deduction ────────────────────────────

        enqueue(sseEvent("status", { message: "Saving…" }));
        const dbStart = Date.now();
        console.log(`[DATABASE] Save started for user ${currentUserId}`);

        const lastUserMessage = messages[messages.length - 1];
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
              },
            });
          } else {
            workspace = await db.workspace.create({
              data: {
                userId: currentUserId,
                name: aiTitle ?? "Workspace",
                title: aiTitle ?? lastUserMessage.content.slice(0, 80),
                message: updatedMessages as never,
                fileData: newFileData as never,
              },
            });
          }

          updatedUser = await db.user.update({
            where: { id: currentUserId },
            data: { credits: { decrement: CREDIT_COST_PER_GENERATION } },
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