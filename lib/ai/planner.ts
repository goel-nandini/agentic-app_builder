import { generateContentWithFallback } from "./gemini";
import { PLANNER_SYSTEM_PROMPT } from "./prompts";
import { PlanResult } from "./schemas";

export async function generateProjectPlan(
  userPrompt: string,
  projectId: string,
  existingFilesSummary: string
): Promise<PlanResult> {
  const contents = [
    {
      text: `Project ID: ${projectId}
Existing Project Files:
${existingFilesSummary}

User Request:
${userPrompt}`,
    },
  ];

  try {
    const rawJson = await generateContentWithFallback(contents, PLANNER_SYSTEM_PROMPT);
    let cleaned = rawJson.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    const parsed = JSON.parse(cleaned) as PlanResult;
    if (!parsed.goal || !Array.isArray(parsed.tasks)) {
      throw new Error("Invalid plan schema returned by Gemini.");
    }
    return parsed;
  } catch (error: any) {
    console.warn("[Planner] Structured plan generation fallback used:", error?.message);
    // Smart fallback plan
    return {
      goal: `Build application for: "${userPrompt}"`,
      projectType: "web",
      framework: "react",
      tasks: [
        { type: "inspect_project", description: "Inspect project structure" },
        { type: "create_file", path: "src/App.tsx", description: "Generate application main component" },
        { type: "create_file", path: "src/styles.css", description: "Apply CSS styling" },
        { type: "run_build", description: "Verify application build" },
        { type: "start_preview", description: "Launch live preview environment" },
      ],
    };
  }
}
