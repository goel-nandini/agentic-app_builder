import { GoogleGenAI } from "@google/genai";
import type { AppSpecification, MemoryRetrievalContext } from "@/types/pipeline";
import type { Message, FileData } from "@/types/workspace";


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});

const ANALYZER_SYSTEM_PROMPT = `You are a Principal Product Architect and System Requirements Analyst.
Your mission is to deeply analyze the user's natural language request (supporting English, Hindi, Hinglish, casual prompts, or complex specifications) and construct a complete, crystal-clear, structured App Specification.

CRITICAL RULES:
1. Prioritize explicit user requirements above all else. If the user mentions specific fields, names, flows, or design preferences, capture them precisely.
2. Support ANY application domain seamlessly (SaaS dashboards, e-commerce, interactive games, productivity utilities, social feeds, media players, educational tools, calculators, portfolios, etc.). Do not force non-dashboard requests into generic dashboards.
3. Infer necessary implied functional requirements (e.g. state persistence, search/filtering, validation, responsive layouts, realistic initial datasets).
4. Output STRICT JSON conforming to the schema below. Never return markdown backticks or commentary outside JSON.

JSON SCHEMA:
{
  "appName": "<Crisp descriptive name>",
  "appType": "<e.g., Interactive Game | SaaS Dashboard | Productivity Tool | E-Commerce Platform | Creative Utility>",
  "targetUsers": "<Description of intended users>",
  "problemStatement": "<Core problem or use case this application solves>",
  "coreFeatures": ["<Feature 1>", "<Feature 2>", "<Feature 3>"],
  "secondaryFeatures": ["<Secondary/supporting feature 1>", "<Secondary/supporting feature 2>"],
  "requiredPages": ["<Main view or page 1>", "<View/Modal 2>"],
  "navigationStructure": "<Description of how users navigate between views/tabs/modals>",
  "importantUserFlows": ["<Step-by-step user journey 1>", "<Step-by-step user journey 2>"],
  "dataEntities": ["<Entity 1 with key fields>", "<Entity 2 with key fields>"],
  "functionalRequirements": ["<Specific working interactive requirement 1>", "<Specific interactive requirement 2>"],
  "nonFunctionalRequirements": ["<Performance, real-time interactivity, instant visual feedback>"],
  "responsiveRequirements": "<Mobile, tablet, and desktop layout adaptation strategy>",
  "accessibilityRequirements": "<Keyboard navigation, contrast, clear button states, readable text>",
  "designRequirements": "<Visual tone, color palette direction, glassmorphism/cards, micro-interactions>",
  "explicitUserPreferences": ["<Any specific constraint or preference requested by the user>"],
  "thingsToAvoid": ["<Dead buttons, placeholder-only inputs, broken non-reactive handlers, missing empty states>"]
}`;

function cleanAndParseJson(raw: string): unknown {
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
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Unable to parse JSON from Analyzer output");
  }
}

function sanitizeSpecification(parsed: any, userPrompt: string): AppSpecification {
  return {
    appName: typeof parsed.appName === "string" && parsed.appName ? parsed.appName : "Dynamic React App",
    appType: typeof parsed.appType === "string" && parsed.appType ? parsed.appType : "Interactive Web Application",
    targetUsers: typeof parsed.targetUsers === "string" ? parsed.targetUsers : "End users seeking high quality web experience",
    problemStatement: typeof parsed.problemStatement === "string" ? parsed.problemStatement : userPrompt.slice(0, 150),
    coreFeatures: Array.isArray(parsed.coreFeatures) && parsed.coreFeatures.length > 0 ? parsed.coreFeatures : ["Interactive Core Experience", "Dynamic State Management", "Responsive UI"],
    secondaryFeatures: Array.isArray(parsed.secondaryFeatures) ? parsed.secondaryFeatures : [],
    requiredPages: Array.isArray(parsed.requiredPages) && parsed.requiredPages.length > 0 ? parsed.requiredPages : ["Main Dashboard/View"],
    navigationStructure: typeof parsed.navigationStructure === "string" ? parsed.navigationStructure : "Tabbed / View switcher navigation",
    importantUserFlows: Array.isArray(parsed.importantUserFlows) ? parsed.importantUserFlows : ["User interacts with UI controls and sees real-time updates"],
    dataEntities: Array.isArray(parsed.dataEntities) ? parsed.dataEntities : ["Primary Data Model"],
    functionalRequirements: Array.isArray(parsed.functionalRequirements) ? parsed.functionalRequirements : ["Fully functional stateful components"],
    nonFunctionalRequirements: Array.isArray(parsed.nonFunctionalRequirements) ? parsed.nonFunctionalRequirements : ["Fast UI response, zero dead clicks"],
    responsiveRequirements: typeof parsed.responsiveRequirements === "string" ? parsed.responsiveRequirements : "Fluid responsive layout for mobile, tablet, and desktop",
    accessibilityRequirements: typeof parsed.accessibilityRequirements === "string" ? parsed.accessibilityRequirements : "High contrast text, interactive focus indicators",
    designRequirements: typeof parsed.designRequirements === "string" ? parsed.designRequirements : "Modern aesthetic, tailored color palette, glassmorphism polish",
    explicitUserPreferences: Array.isArray(parsed.explicitUserPreferences) ? parsed.explicitUserPreferences : [],
    thingsToAvoid: Array.isArray(parsed.thingsToAvoid) ? parsed.thingsToAvoid : ["Dead buttons", "Missing state"],
  };
}

export async function analyzeRequirements(
  messages: Message[],
  fileData: FileData | null,
  memoryContext?: MemoryRetrievalContext
): Promise<AppSpecification> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const conversationSummary = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  let memoryPromptSection = "";
  if (memoryContext?.hasMemory) {
    memoryPromptSection = `\n\nHISTORICAL PROJECT & USER MEMORY CONTEXT:
${memoryContext.projectSummary ? `- Project History: ${memoryContext.projectSummary}` : ""}
${memoryContext.userPreferences.length > 0 ? `- Known User Design Preferences: ${memoryContext.userPreferences.join(", ")}` : ""}`;
  }

  const promptContent = `Analyze the following user request and conversation history, and extract the complete App Specification according to your instructions.
  
USER REQUEST & CONVERSATION:
${conversationSummary}
${fileData ? `\n\nEXISTING WORKSPACE CONTEXT:\n${JSON.stringify({ title: fileData.title, existingFiles: Object.keys(fileData.files) })}` : ""}${memoryPromptSection}`;


  const CANDIDATE_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
  ];

  let rawOutput = "";
  let lastError: unknown = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: promptContent }] }],
        config: {
          systemInstruction: ANALYZER_SYSTEM_PROMPT,
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      rawOutput = response.text || "";
      if (rawOutput) break;
    } catch (err) {
      console.warn(`[ANALYZER] Model ${model} failed, trying fallback:`, err);
      lastError = err;
    }
  }

  if (!rawOutput) {
    console.error("[ANALYZER] Generation failed on all candidate models. Falling back to default spec.");
    return sanitizeSpecification({}, lastUserMessage);
  }

  try {
    const parsed = cleanAndParseJson(rawOutput);
    const spec = sanitizeSpecification(parsed, lastUserMessage);
    
    if (process.env.NODE_ENV !== "production") {
      console.log("[ANALYZER] Successfully generated App Specification:", {
        appName: spec.appName,
        appType: spec.appType,
        coreFeaturesCount: spec.coreFeatures.length,
        requiredPagesCount: spec.requiredPages.length,
      });
    }
    
    return spec;
  } catch (parseError) {
    console.error("[ANALYZER] Failed to parse model output JSON:", parseError, "\nRaw output:", rawOutput);
    return sanitizeSpecification({}, lastUserMessage);
  }
}
