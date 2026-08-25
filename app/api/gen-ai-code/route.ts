import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/prisma";
import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import type { Message, FileData } from "@/types/workspace";
import { aj } from "@/lib/arcjet";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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

async function validateDependencies(
  deps: Record<string, string>
): Promise<Record<string, string>> {
  const valid: Record<string, string> = {};
  await Promise.all(
    Object.entries(deps).map(async ([pkg, version]) => {
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

// ─── History trimming ─────────────────────────────────────────────────────────

function trimHistory(messages: Message[]): Message[] {
  if (messages.length <= 10) return messages;
  return [messages[0], ...messages.slice(-8)];
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a World-Class Full-Stack React Software Architect and UI/UX Designer.
Your mission is to build STUNNING, production-grade, fully functional React web applications based on ANY user prompt (including natural language in English, Hindi, Hinglish, casual phrases, or detailed specifications).

CRITICAL ARCHITECTURE & QUALITY GUIDELINES:
1. COMPREHENSIVE, RICH APPLICATION EXPERIENCE:
   - Never build a toy, basic, or half-finished UI.
   - Build a comprehensive, feature-packed application with realistic workflows, interactive state, search/filter capabilities, tabs, modals, dashboards, statistics cards, and full interactive actions (create, edit, delete, toggle, filter, playback).
   - If user asks in natural language / Hindi / Hinglish (e.g. "ek music app banao" or "build a crypto dashboard with charts"), understand their true product vision and deliver a complete, polished product.
   - Populate with realistic, rich mock data (e.g. realistic user profiles, images from Unsplash via https://images.unsplash.com/..., financial stats, songs, products, tasks, metrics).

2. FULL-SCREEN MODERN UI/UX:
   - Design sleek, modern interfaces with Tailwind CSS (Dark/Modern theme with glassmorphism, rich color palettes, smooth hover states, gradients like from-indigo-500 to-purple-600, micro-interactions).
   - Ensure the layout fills the screen properly (e.g., 'min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col' or sidebar + header + main scrollable content).
   - Use Lucide React icons extensively for polished visuals (import from 'lucide-react').

3. MODULAR MULTI-FILE CODE STRUCTURE:
   - Split complex logic across well-organized modular files:
     * "/App.js": Main application shell, state management, top-level layout, notifications. Default export.
     * "/components/Navbar.js": Top navigation bar with branding, search, active tabs, profile.
     * "/components/Sidebar.js": Navigation links, quick stats, categories (if applicable).
     * "/components/...": Feature-specific views (e.g. Dashboard, DetailsModal, Card, Feed, Player, Charts).
     * "/data/mockData.js": Generous, realistic mock datasets and constants so the app feels alive immediately.
   - All files must use clean JavaScript/JSX (React hooks). Do NOT use TypeScript syntax in generated sandbox files.

4. DEPENDENCY & IMPORT SAFETY:
   - The React runtime supports packages like: "lucide-react", "recharts", "framer-motion", "clsx", "tailwind-merge", "date-fns".
   - Do NOT import non-existent packages or relative paths that are not included in the "files" map.
   - Entry point MUST always be "/App.js" and export a default component.

5. OUTPUT FORMAT (STRICT JSON ONLY):
   - Return ONLY a single raw JSON object (NO markdown backticks, NO surrounding text, NO explanations outside JSON):
{
  "assistantMessage": "<enthusiastic 1-2 sentence overview of what was created>",
  "title": "<short 2-4 word clean title for the project, e.g. 'Spotify Pulse Dashboard'>",
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
}

6. MULTI-TURN MODIFICATIONS:
   - When modifying existing code, retain all existing files, make requested modifications accurately, and return all files in the "files" object.`;

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

  const user = await db.user.findUnique({
    where: { id: userId, clerkId },
    select: { id: true, credits: true },
  });

  if (!user)
    return Response.json({ message: "User not found" }, { status: 404 });
  if (user.credits < CREDIT_COST_PER_GENERATION) {
    return Response.json({ message: "Insufficient credits" }, { status: 402 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: string) =>
        controller.enqueue(encoder.encode(chunk));

      try {
        const contents = buildContents(messages, fileData);

        const CANDIDATE_MODELS = [
          "gemini-3.7-flash",
          "gemini-3.6-flash",
          "gemini-3.5-flash-lite",
          "gemini-2.5-flash",
        ];

        let geminiStream = null;
        let lastError = null;

        for (const model of CANDIDATE_MODELS) {
          try {
            geminiStream = await ai.models.generateContentStream({
              model,
              contents,
              config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.7,
                responseMimeType: "application/json",
                thinkingConfig: {
                  includeThoughts: true,
                },
              },
            });
            break;
          } catch (err: any) {
            console.warn(`[gen-ai-code] model ${model} failed, trying next candidate:`, err?.message || err);
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

        // ── Parse the complete JSON response ──────────────────────────────────

        let parsed: {
          assistantMessage: string;
          title?: string;
          files: Record<string, { code: string }>;
          dependencies: Record<string, string>;
        };

        try {
          parsed = JSON.parse(accumulated);
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

        // ── Upsert workspace + deduct credit (single transaction) ──────────────

        enqueue(sseEvent("status", { message: "Saving…" }));

        const lastUserMessage = messages[messages.length - 1];
        const updatedMessages: Message[] = [
          ...messages,
          { role: "assistant", content: assistantMessage },
        ];

        const [workspace] = await db.$transaction([
          workspaceId
            ? db.workspace.update({
                where: { id: workspaceId, userId },
                data: {
                  message: updatedMessages as never,
                  fileData: newFileData as never,
                },
              })
            : db.workspace.create({
                data: {
                  userId,
                  name: aiTitle ?? "Workspace",
                  title: aiTitle ?? lastUserMessage.content.slice(0, 80),
                  message: updatedMessages as never,
                  fileData: newFileData as never,
                },
              }),
          db.user.update({
            where: { id: userId },
            data: { credits: { decrement: CREDIT_COST_PER_GENERATION } },
          }),
        ]);

        const updatedUser = await db.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

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