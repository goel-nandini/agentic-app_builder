import { AgentStateTracker } from "./agentState";
import { runCodingAgent } from "../ai/codingAgent";
import { preparePreview } from "../sandbox/previewManager";
import { getWorkspaceFilesMap } from "../sandbox/fileTools";
import { buildSmartFallbackApp } from "../ai/smartFallback";

export interface RunAgentPipelineOptions {
  agentRunId: string;
  projectId: string;
  prompt: string;
  attachments?: any[];
  onEvent?: (event: any) => void;
}

export interface RunAgentPipelineResult {
  success: boolean;
  agentRunId: string;
  projectId: string;
  explanation: string;
  steps: string[];
  previewUrl?: string;
  files?: Record<string, string>;
  error?: string;
}

export async function runAgentPipeline({
  agentRunId,
  projectId,
  prompt,
  attachments,
  onEvent,
}: RunAgentPipelineOptions): Promise<RunAgentPipelineResult> {
  const stateTracker = new AgentStateTracker(agentRunId, projectId);

  if (onEvent) {
    stateTracker.subscribe(onEvent);
  }

  try {
    // ── STAGE 1: PLANNING & INSPECTION ────────────────────────────────
    stateTracker.setState("planning");
    stateTracker.emitEvent("message", { text: `Planning application build for: "${prompt}"` });

    // ── STAGE 2: EXECUTE MULTI-TURN CODING AGENT ───────────────────────
    const agentResult = await runCodingAgent({
      projectId,
      userPrompt: prompt,
      plan: { goal: prompt },
      attachments,
      stateTracker,
    });

    // ── STAGE 3: PREPARE PREVIEW ──────────────────────────────────────
    stateTracker.setState("building");
    const preview = await preparePreview(projectId);

    stateTracker.setState("completed");
    stateTracker.emitEvent("preview_ready", {
      url: preview.previewUrl,
    });

    const workspaceFiles = await getWorkspaceFilesMap(projectId);
    return {
      success: true,
      agentRunId,
      projectId,
      explanation: agentResult.explanation,
      steps: agentResult.steps,
      previewUrl: preview.previewUrl,
      files: workspaceFiles,
    };
  } catch (error: any) {
    console.error("[AgentLoop] Pipeline error:", error?.message || error);
    stateTracker.setState("failed");

    const fallback = buildSmartFallbackApp(prompt);
    return {
      success: false,
      agentRunId,
      projectId,
      explanation: "Pipeline encountered an error, reverted to fallback view.",
      steps: ["Encountered pipeline error", "Generated safe fallback components"],
      files: fallback.files,
      error: error?.message || "Unknown execution error",
    };
  }
}
