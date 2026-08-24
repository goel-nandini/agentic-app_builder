import { GoogleGenAI } from "@google/genai";

// ─── Client ────────────────────────────────────────────────────
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

// ─── Model List ─────────────────────────────────────────────────
export const PREFERRED_MODELS = ["gemini-3.6-flash"];

// ─── Output Schema ──────────────────────────────────────────────
export interface GeneratedFile {
  path: string;
  content: string;
}

export interface StructuredAppOutput {
  files: GeneratedFile[];
  explanation?: string;
  steps?: string[];
}

// ─── Gemini JSON Schema ─────────────────────────────────────────
export const APP_GENERATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    files: {
      type: "ARRAY",
      description: "All files needed for the application",
      items: {
        type: "OBJECT",
        properties: {
          path: {
            type: "STRING",
            description: "Relative file path, e.g. /App.tsx or /styles.css",
          },
          content: {
            type: "STRING",
            description: "Complete, runnable file content",
          },
        },
        required: ["path", "content"],
      },
    },
    explanation: {
      type: "STRING",
      description: "Brief description of what was generated",
    },
    steps: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Steps taken to generate the application",
    },
  },
  required: ["files"],
};

// ─── System Prompt ──────────────────────────────────────────────
export const MVP_SYSTEM_PROMPT = `You are an expert web application generator.

Generate a complete runnable web application from the user's request.

Generate actual source code, not a plan or task list.

The application must:
- directly implement the user's request
- include complete UI
- include required functionality
- include required styles
- include required dependencies
- have valid imports
- have valid package.json
- be buildable
- not contain TODO placeholders
- not return explanations outside JSON
- not return markdown
- return only structured application files matching the schema.

STRICT FORMAT & COMPONENT RULES:
1. Return ONLY valid JSON matching the schema. No markdown wrapping. No text outside JSON.
2. Always include /App.tsx as the main component file (export default function App).
3. Always include /styles.css for styling.
4. Use only standard React hooks (useState, useEffect, useMemo) and lucide-react icons.
5. Make the UI modern, beautiful, and fully interactive.
6. Include real working functionality (e.g. add, delete, toggle complete, filter, dark mode) — no placeholder code or TODOs.
7. Keep code clean and self-contained. Import styles in App.tsx with: import "./styles.css";`;

// ─── Sleep Helper ────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── JSON Cleaning & Auto-Repair ─────────────────────────────────
export function repairTruncatedJson(text: string): StructuredAppOutput | null {
  try {
    const files: GeneratedFile[] = [];

    // Pattern matching to recover complete file blocks from truncated JSON
    const fileRegex = /"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let match;
    while ((match = fileRegex.exec(text)) !== null) {
      const path = match[1];
      let content = match[2];
      try {
        content = JSON.parse(`"${content}"`);
      } catch {
        content = content.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
      files.push({ path, content });
    }

    if (files.length > 0) {
      const hasApp = files.some((f) => f.path.includes("App.tsx"));
      const hasCss = files.some((f) => f.path.includes("styles.css"));

      if (hasApp && !hasCss) {
        files.push({
          path: "/styles.css",
          content: "/* Recovered styling */\nbody { font-family: system-ui, sans-serif; background: #09090b; color: #fff; padding: 1rem; }",
        });
      }

      if (hasApp) {
        console.warn(`[Gemini JSON Repair] Recovered ${files.length} files from regex scan.`);
        return {
          files,
          explanation: "Recovered generated application files.",
          steps: ["Parsed partial Gemini response", "Extracted valid component files"],
        };
      }
    }

    // Attempt structural balancing of unclosed strings & brackets
    let repairedText = text.trim();

    let inString = false;
    let escapeNext = false;
    for (let i = 0; i < repairedText.length; i++) {
      const char = repairedText[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\") {
        escapeNext = true;
      } else if (char === '"') {
        inString = !inString;
      }
    }

    if (inString) {
      repairedText += '"';
    }

    const stack: string[] = [];
    inString = false;
    escapeNext = false;
    for (let i = 0; i < repairedText.length; i++) {
      const char = repairedText[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\") {
        escapeNext = true;
      } else if (char === '"') {
        inString = !inString;
      } else if (!inString) {
        if (char === "{" || char === "[") {
          stack.push(char);
        } else if (char === "}" && stack[stack.length - 1] === "{") {
          stack.pop();
        } else if (char === "]" && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }

    while (stack.length > 0) {
      const open = stack.pop();
      if (open === "{") repairedText += "}";
      else if (open === "[") repairedText += "]";
    }

    const parsed = JSON.parse(repairedText);
    if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
      console.warn("[Gemini JSON Repair] Successfully auto-balanced truncated JSON output.");
      return parsed;
    }
  } catch (err) {
    console.warn("[Gemini JSON Repair] Could not auto-balance truncated JSON:", err);
  }

  return null;
}

export function cleanAndParseJson<T = any>(text: string): T {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  // Direct JSON parse attempt
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // Sanitize control characters
    try {
      const sanitized = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
        if (match === "\n") return "\\n";
        if (match === "\r") return "\\r";
        if (match === "\t") return "\\t";
        return "";
      });
      return JSON.parse(sanitized);
    } catch (err2) {
      // Auto-repair truncated JSON
      const repaired = repairTruncatedJson(cleaned);
      if (repaired) {
        return repaired as T;
      }
      throw err1;
    }
  }
}

// ─── Primary Generator ───────────────────────────────────────────
export async function generateStructuredApp(
  userPrompt: string
): Promise<StructuredAppOutput> {
  const ai = getGeminiClient();

  const promptText = `USER REQUEST:\n${userPrompt}`;

  let lastError: any = null;

  for (const modelName of PREFERRED_MODELS) {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        console.log(`[Gemini] Request started — model: ${modelName}, attempt: ${retries + 1}`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ text: promptText }],
          config: {
            systemInstruction: MVP_SYSTEM_PROMPT,
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: APP_GENERATION_SCHEMA as any,
          },
        });

        const text = response.text;
        if (!text || text.trim().length < 10) {
          throw new Error("Empty response received from Gemini.");
        }

        console.log(`[Gemini] Response received, length: ${text.length}`);

        const parsed: StructuredAppOutput = cleanAndParseJson<StructuredAppOutput>(text);

        if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
          throw new Error("Gemini returned invalid or empty 'files' array.");
        }

        // Validate each file has path + content
        for (const f of parsed.files) {
          if (!f.path || typeof f.content !== "string") {
            throw new Error(`Invalid file entry: ${JSON.stringify(f)}`);
          }
        }

        console.log(`[Gemini] JSON validated. Files: ${parsed.files.map((f) => f.path).join(", ")}`);
        return parsed;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        retries++;

        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded")) {
          const delay = retries * 10000; // 10s, 20s, 30s
          console.warn(`[Gemini] Rate limit (429). Waiting ${delay / 1000}s before retry ${retries}/${maxRetries}...`);
          await sleep(delay);
        } else {
          console.warn(`[Gemini] Generation or JSON parse error on attempt ${retries}/${maxRetries}:`, msg);
          if (retries < maxRetries) {
            await sleep(2000);
          }
        }
      }
    }
  }

  throw new Error(
    `Gemini generation failed after all retries: ${lastError?.message || "Unknown error"}`
  );
}

// ─── Self-Healing Build Fix Generator ────────────────────────────
export const FIX_SYSTEM_PROMPT = `You are an expert software engineer fixing build errors in a web application.

The generated project failed to build.

Analyze the actual build error log, command, and existing workspace files.
Fix the existing application code to resolve the error.

Return ONLY the files that need to be created or modified as valid JSON matching the schema.`;

export async function generateFixForBuildError(options: {
  userPrompt: string;
  existingFiles: Record<string, string>;
  buildCommand: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}): Promise<StructuredAppOutput> {
  const ai = getGeminiClient();

  const promptText = `USER ORIGINAL REQUEST:
${options.userPrompt}

EXISTING PROJECT FILES:
${JSON.stringify(options.existingFiles, null, 2)}

FAILED BUILD COMMAND:
${options.buildCommand}

BUILD EXIT CODE:
${options.exitCode}

BUILD STDOUT:
${options.stdout}

BUILD STDERR:
${options.stderr}

INSTRUCTION:
The generated project failed to build.
Analyze the actual error and fix the existing application.
Return only the files that need to be created or modified.`;

  let lastError: any = null;

  for (const modelName of PREFERRED_MODELS) {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        console.log(`[Gemini Self-Healing] Requesting fix — model: ${modelName}, attempt: ${retries + 1}`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ text: promptText }],
          config: {
            systemInstruction: FIX_SYSTEM_PROMPT,
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: APP_GENERATION_SCHEMA as any,
          },
        });

        const text = response.text;
        if (!text || text.trim().length < 10) {
          throw new Error("Empty fix response received from Gemini.");
        }

        const parsed: StructuredAppOutput = cleanAndParseJson<StructuredAppOutput>(text);

        if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
          throw new Error("Gemini returned invalid or empty 'files' array in fix response.");
        }

        return parsed;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        retries++;
        if (msg.includes("429") || msg.includes("Quota exceeded")) {
          await sleep(10000);
        } else {
          if (retries < maxRetries) await sleep(2000);
        }
      }
    }
  }

  throw new Error(`Gemini build fix generation failed: ${lastError?.message || "Unknown error"}`);
}

// ─── Convert files array → Sandpack files map ───────────────────
export function filesToSandpackMap(
  files: GeneratedFile[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of files) {
    // Normalize path to start with /
    const normalizedPath = f.path.startsWith("/") ? f.path : `/${f.path}`;
    map[normalizedPath] = f.content;
  }
  return map;
}

// ─── Legacy compatibility ────────────────────────────────────────
export async function generateContentWithFallback(
  contents: any[],
  systemInstruction?: string,
  forceJson?: boolean
): Promise<string> {
  const ai = getGeminiClient();
  for (const modelName of PREFERRED_MODELS) {
    try {
      const config: any = { maxOutputTokens: 4096, temperature: 0.3 };
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (forceJson) config.responseMimeType = "application/json";
      const response = await ai.models.generateContent({ model: modelName, contents, config });
      const text = response.text;
      if (text && text.trim().length > 0) return text;
    } catch (err: any) {
      console.warn(`[Gemini] ${modelName} failed:`, err?.message || err);
    }
  }
  throw new Error("All Gemini models failed to generate content.");
}
