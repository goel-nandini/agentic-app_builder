import { getGeminiClient, PREFERRED_MODELS } from "./gemini";
import { CODING_AGENT_SYSTEM_PROMPT } from "./prompts";
import { getGeminiToolDeclarations } from "../agent/toolRegistry";
import { AgentStateTracker } from "../agent/agentState";
import { executeToolCall } from "../agent/toolExecutor";
import { writeFile, getWorkspaceFilesMap } from "../sandbox/fileTools";
import { runCommand } from "../sandbox/commandTools";
import { buildSmartFallbackApp } from "./smartFallback";

export interface CodingAgentOptions {
  projectId: string;
  userPrompt: string;
  plan: any;
  attachments?: any[];
  stateTracker: AgentStateTracker;
}

const MAX_AGENT_ITERATIONS = 20;
const MAX_FIX_ATTEMPTS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runCodingAgent({
  projectId,
  userPrompt,
  plan,
  attachments,
  stateTracker,
}: CodingAgentOptions): Promise<{ explanation: string; steps: string[]; files: Record<string, string> }> {
  stateTracker.setState("inspecting");

  const ai = getGeminiClient();
  const tools = getGeminiToolDeclarations();

  const existingFiles = await getWorkspaceFilesMap(projectId);

  const contents: any[] = [];

  if (attachments && Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att.type === "image" && att.url) {
        const match = att.url.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          contents.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
    }
  }

  const initialUserPrompt = `USER REQUEST: ${userPrompt}

EXISTING WORKSPACE FILES:
${JSON.stringify(Object.keys(existingFiles), null, 2)}

Instructions:
1. Write or update /App.tsx and /styles.css to create the requested interactive React UI.
2. Use write_file or return JSON with { "files": { "/App.tsx": "...", "/styles.css": "..." } } immediately.
3. Keep code under 250 lines for App.tsx and styles.css.`;

  contents.push({
    role: "user",
    parts: [{ text: initialUserPrompt }],
  });

  const systemInstruction = `${CODING_AGENT_SYSTEM_PROMPT}

You are an expert AI software engineer building apps in an isolated sandbox.
Respond using tool calls or return a JSON object with:
{
  "files": {
    "/App.tsx": "...",
    "/styles.css": "..."
  },
  "explanation": "Description of what was built",
  "steps": ["Step 1", "Step 2"]
}`;

  stateTracker.setState("writing");

  let iterations = 0;
  let isComplete = false;
  let finalExplanation = "";
  let finalSteps: string[] = [];
  let modelName = PREFERRED_MODELS[0] || "gemini-3.6-flash";

  // ── MULTI-TURN AGENT LOOP ──────────────────────────────────────────────────
  while (iterations < MAX_AGENT_ITERATIONS && !isComplete) {
    iterations++;
    console.log(`[AgentLoop] Iteration ${iterations}/${MAX_AGENT_ITERATIONS}`);

    let response: any = null;
    let retries = 0;

    // Smart Retry loop for 429 Rate Limits / Quotas with 10s backoff
    while (retries < 3) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 8192,
            tools: [{ functionDeclarations: tools as any }],
          },
        });
        break; // Success!
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota exceeded")) {
          retries++;
          console.warn(`[CodingAgent] Rate limit hit (429). Retrying in 10s... (Attempt ${retries}/3)`);
          await sleep(10000);
        } else {
          console.error(`[CodingAgent] Iteration ${iterations} error:`, errMsg);
          break;
        }
      }
    }

    if (!response) {
      console.warn(`[CodingAgent] No response received in iteration ${iterations}`);
      break;
    }

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    if (parts.length === 0) {
      break;
    }

    contents.push({
      role: "model",
      parts,
    });

    let hasToolCalls = false;
    const toolResultsParts: any[] = [];

    for (const part of parts) {
      if (part.functionCall) {
        hasToolCalls = true;
        const fc = part.functionCall;
        const toolName = fc.name;
        const toolArgs = (fc.args as Record<string, any>) || {};

        console.log(`[AgentLoop] Tool Call: ${toolName}`, toolArgs);
        stateTracker.emitEvent("tool_call", { tool: toolName, args: toolArgs });

        if (toolName === "install_package") stateTracker.setState("installing");
        if (toolName === "run_command") stateTracker.setState("running");

        const toolRes = await executeToolCall(projectId, toolName, toolArgs);
        stateTracker.emitEvent("tool_result", toolRes);

        toolResultsParts.push({
          functionResponse: {
            name: toolName,
            response: { result: toolRes },
          },
        });
      }
    }

    if (hasToolCalls) {
      contents.push({
        role: "user",
        parts: toolResultsParts,
      });
      continue;
    }

    const responseText = response.text || "";
    if (responseText) {
      let cleaned = responseText.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        try {
          const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
          if (parsed.files && typeof parsed.files === "object") {
            for (const [filePath, content] of Object.entries(parsed.files)) {
              if (typeof content === "string") {
                await writeFile(projectId, filePath, content);
                stateTracker.emitEvent("tool_call", { tool: "write_file", path: filePath });
              }
            }
            finalExplanation = parsed.explanation || `Successfully built workspace for: "${userPrompt}"`;
            finalSteps = parsed.steps || ["Parsed prompt", "Generated components", "Applied styles"];
            isComplete = true;
            break;
          }
        } catch {
          // Continuation if parse failed
        }
      }
    }

    isComplete = true;
    finalExplanation = responseText || `Completed task for: "${userPrompt}"`;
  }

  // ── SELF-HEALING BUILD VERIFICATION LOOP ──────────────────────────────────
  stateTracker.setState("building");
  let fixAttempts = 0;

  while (fixAttempts < MAX_FIX_ATTEMPTS) {
    fixAttempts++;
    console.log(`[AgentLoop] Build Verification Attempt ${fixAttempts}/${MAX_FIX_ATTEMPTS}`);

    const currentFiles = await getWorkspaceFilesMap(projectId);
    if (!currentFiles["/App.tsx"] && !currentFiles["/App.jsx"] && !currentFiles["/src/App.tsx"]) {
      break;
    }

    const buildRes = await runCommand(projectId, "npm run build");

    if (buildRes.success) {
      stateTracker.emitEvent("build", { status: "success", output: buildRes.stdout });
      break;
    } else {
      console.warn(`[AgentLoop] Build Failed (Attempt ${fixAttempts}):`, buildRes.stderr);
      stateTracker.setState("fixing");
      stateTracker.emitEvent("build", { status: "failed", error: buildRes.stderr });

      contents.push({
        role: "user",
        parts: [
          {
            text: `BUILD FAILED on attempt ${fixAttempts}/${MAX_FIX_ATTEMPTS}.
Stderr / Error:
${buildRes.stderr}

Please fix the files (use write_file tool or return corrected JSON files) so the build succeeds.`,
          },
        ],
      });

      try {
        const fixResponse = await ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction, temperature: 0.1 },
        });

        const fixText = fixResponse.text || "";
        if (fixText) {
          const cleaned = fixText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          const s = cleaned.indexOf("{");
          const e = cleaned.lastIndexOf("}");
          if (s !== -1 && e > s) {
            try {
              const parsed = JSON.parse(cleaned.slice(s, e + 1));
              if (parsed.files) {
                for (const [filePath, content] of Object.entries(parsed.files)) {
                  if (typeof content === "string") {
                    await writeFile(projectId, filePath, content);
                  }
                }
              }
            } catch {}
          }
        }
      } catch (fixErr) {
        console.error("[AgentLoop] Self-healing call failed:", fixErr);
        break;
      }
    }
  }

  const finalWorkspaceFiles = await getWorkspaceFilesMap(projectId);

  if (Object.keys(finalWorkspaceFiles).length === 0 || (!finalWorkspaceFiles["/App.tsx"] && !finalWorkspaceFiles["/App.jsx"])) {
    const fallback = buildSmartFallbackApp(userPrompt);
    for (const [filePath, content] of Object.entries(fallback.files)) {
      await writeFile(projectId, filePath, content);
    }
    return {
      explanation: fallback.explanation,
      steps: fallback.steps,
      files: fallback.files,
    };
  }

  return {
    explanation: finalExplanation || `Successfully generated app for: "${userPrompt}"`,
    steps: finalSteps.length > 0 ? finalSteps : ["Verified workspace files", "Executed build check", "Loaded preview"],
    files: finalWorkspaceFiles,
  };
}
