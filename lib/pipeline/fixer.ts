import { GoogleGenAI } from "@google/genai";
import type {
  AppSpecification,
  AppPlan,
  DesignDNA,
  CritiqueEvaluation,
  FixerResult,
} from "@/types/pipeline";
import { evaluateGeneratedApp } from "./evaluator";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});

const FIXER_SYSTEM_PROMPT = `You are an Elite React Bug Fixer and Code Optimizer.
Your job is to take generated React application files that received critical review issues from the Critic/Evaluator and FIX all issues completely.

FIXING RULES:
1. Fix EVERY critical issue and recommended fix listed by the Critic.
2. Ensure all buttons and inputs have functional state handlers ('useState', 'useEffect').
3. Keep the file structure intact (entry point /App.js with subcomponents).
4. Return ONLY a single raw JSON object containing the complete repaired files (NO markdown backticks, NO surrounding text):

JSON SCHEMA:
{
  "fixesApplied": ["<Fixed dead handler in X>", "<Fixed missing import in Y>"],
  "files": {
    "/App.js": { "code": "<complete valid javascript code>" },
    "/components/Navbar.js": { "code": "<complete valid javascript code>" }
  }
}`;

import { jsonrepair } from "jsonrepair";

function cleanAndParseJson(raw: string): any {
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
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const extracted = cleaned.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(extracted);
        } catch {
          return JSON.parse(jsonrepair(extracted));
        }
      }
      throw new Error("Unable to parse JSON from Fixer output");
    }
  }
}

export async function runSelfHealingFixer(
  files: Record<string, { code: string }>,
  evaluation: CritiqueEvaluation,
  spec: AppSpecification,
  plan: AppPlan,
  designDNA: DesignDNA,
  maxIterations: number = 1
): Promise<FixerResult> {
  let currentFiles = { ...files };
  const allFixesApplied: string[] = [];
  let currentEvaluation = evaluation;
  let attempts = 0;

  while (!currentEvaluation.passed && attempts < maxIterations) {
    attempts++;
    console.log(`[FIXER] Starting Self-Healing iteration ${attempts}/${maxIterations}...`);

    const filesOverview = Object.entries(currentFiles)
      .map(([path, { code }]) => `--- FILE: ${path} ---\n${code}`)
      .join("\n\n");

    const promptContent = `The Critic identified the following issues in the React application. Please repair the files to resolve all issues.

CRITICAL ISSUES TO FIX:
${currentEvaluation.criticalIssues.map((issue) => `- ${issue}`).join("\n")}

RECOMMENDED FIXES:
${currentEvaluation.recommendedFixes.map((fix) => `- ${fix}`).join("\n")}

CURRENT APPLICATION FILES:
${filesOverview}

Provide the complete repaired code files adhering strictly to the JSON schema.`;

    const CANDIDATE_MODELS = [
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-flash-latest",
    ];

    let rawOutput = "";

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: promptContent }] }],
          config: {
            systemInstruction: FIXER_SYSTEM_PROMPT,
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });

        rawOutput = response.text || "";
        if (rawOutput) break;
      } catch (err) {
        console.warn(`[FIXER] Model ${model} failed, trying fallback:`, err);
      }
    }

    if (!rawOutput) {
      console.warn("[FIXER] Fixer generation failed, retaining current files.");
      break;
    }

    try {
      const parsed = cleanAndParseJson(rawOutput);
      if (parsed.files && typeof parsed.files === "object") {
        currentFiles = {
          ...currentFiles,
          ...parsed.files,
        };

        if (Array.isArray(parsed.fixesApplied)) {
          allFixesApplied.push(...parsed.fixesApplied);
        }

        // Re-evaluate the fixed code
        currentEvaluation = await evaluateGeneratedApp(currentFiles, spec, plan, designDNA);
        console.log(`[FIXER] Iteration ${attempts} re-evaluation: Score: ${currentEvaluation.overallScore}/10 (Passed: ${currentEvaluation.passed})`);
      }
    } catch (parseError) {
      console.error("[FIXER] Failed to parse Fixer JSON output:", parseError);
      break;
    }
  }

  return {
    fixedFiles: currentFiles,
    fixesApplied: allFixesApplied,
    attemptCount: attempts,
    finalEvaluation: currentEvaluation,
  };
}
