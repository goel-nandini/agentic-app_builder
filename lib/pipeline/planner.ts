import { GoogleGenAI } from "@google/genai";
import type { AppPlan, AppSpecification } from "@/types/pipeline";
import type { FileData } from "@/types/workspace";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});

const PLANNER_SYSTEM_PROMPT = `You are a World-Class Principal Software Architect and UI/UX Lead (inspired by Manus AI).
Your mission is to take a structured App Specification and formulate a comprehensive, modular Architecture & Implementation Plan for a high-performance, visually stunning React application running in a Sandpack browser preview sandbox.

MANUS-GRADE ARCHITECTURE PRINCIPLES:
1. NON-GENERIC, MULTI-DIMENSIONAL LAYOUTS:
   - Plan rich layouts matching the domain: Bento Grids (asymmetrical col-span-2/row-span-2 cards), Split-Screen Views, Dynamic Command Bars, Floating Action Docks, or Interactive Studio Canvases.
   - Avoid monotonous single-row 3-card grids.
2. RICH MODULAR ARCHITECTURE:
   - Root entry point is ALWAYS /App.js (global state hub, navigation/tab orchestration, notification toasts, modal controllers).
   - Component sub-files in /components/ (e.g. /components/Header.js, /components/HeroShowcase.js, /components/InteractiveGrid.js, /components/DetailModal.js, /components/StatsView.js, /components/ControlDrawer.js).
   - Comprehensive domain dataset in /data/mockData.js with 8-15 rich realistic items (including real high-res Unsplash photo URLs, tags, badges, metrics, author info, timestamps).
3. COMPLETE INTERACTION COVERAGE:
   - Plan working state for every interactive element (search filtering, category toggling, modal opening/closing, sorting, CRUD actions, bookmarking).
4. Output STRICT JSON conforming to the schema below. Never return markdown backticks or commentary outside JSON.

JSON SCHEMA:
{
  "pageArchitecture": [
    {
      "name": "<View/Page Name>",
      "path": "<Route/Tab path, e.g. / or /analytics or /settings>",
      "purpose": "<Purpose of this page/view>",
      "components": ["<Component 1>", "<Component 2>"]
    }
  ],
  "componentArchitecture": [
    {
      "name": "App",
      "filePath": "/App.js",
      "purpose": "Root application container, global state hub, routing/tab orchestration",
      "props": [],
      "state": ["<State variable 1>", "<State variable 2>"],
      "dependencies": ["<Child Component 1>", "<Child Component 2>"]
    },
    {
      "name": "<ComponentName>",
      "filePath": "/components/<ComponentName>.js",
      "purpose": "<What this component renders and manages>",
      "props": ["<prop1>", "<prop2>"],
      "state": ["<local state if any>"],
      "dependencies": ["lucide-react"]
    }
  ],
  "featureImplementationPlan": [
    {
      "feature": "<Feature Name>",
      "description": "<Detailed feature explanation>",
      "implementationSteps": ["<Step 1>", "<Step 2>", "<Step 3>"]
    }
  ],
  "dataFlow": {
    "stateManagement": "<Description of React state architecture (useState, useMemo, custom hooks)>",
    "dataSources": ["<Initial mock dataset in /data/mockData.js>", "<User action state mutators>"],
    "flowDescription": "<How data flows down via props and updates propagate up via callbacks>"
  },
  "interactionPlan": [
    {
      "userAction": "<e.g. Click 'Start Game' or Filter by Category>",
      "expectedBehavior": "<Specific state transition and UI update>",
      "feedbackMechanism": "<Toast notification, animated badge, visual highlight>"
    }
  ],
  "responsiveStrategy": {
    "desktop": "<Bento Grid / Multi-pane layout on 1024px+>",
    "tablet": "<Adaptive 2-column or stacked layout on 768px>",
    "mobile": "<Bottom command bar, swipeable tabs, stacked cards on 390px>",
    "breakpoints": "<Key Tailwind breakpoint classes to use (sm:, md:, lg:, xl:)>"
  },
  "designDirection": {
    "colorPalette": ["#09090b", "#3b82f6", "#10b981", "#f59e0b"],
    "typography": "Modern clean sans-serif with strong hierarchy (Outfit/Inter/Plus Jakarta Sans vibes)",
    "uiTheme": "<e.g. Sleek Obsidian Glassmorphism with Electric Emerald Accents>",
    "layoutStyle": "<e.g. Asymmetric Bento grid with translucent cards, 1px subtle borders and backdrop blur>",
    "motionAndEffects": "<Hover scale, active press feedback, smooth tab crossfade, status glow>"
  }
}`;

import { jsonrepair } from "jsonrepair";

function cleanAndParseJson(raw: string): unknown {
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
      throw new Error("Unable to parse JSON from Planner output");
    }
  }
}

function sanitizePlan(parsed: any, spec: AppSpecification): AppPlan {
  return {
    pageArchitecture: Array.isArray(parsed.pageArchitecture) && parsed.pageArchitecture.length > 0
      ? parsed.pageArchitecture
      : [{ name: "Main View", path: "/", purpose: "Primary application screen", components: ["App", "MainView"] }],
    componentArchitecture: Array.isArray(parsed.componentArchitecture) && parsed.componentArchitecture.length > 0
      ? parsed.componentArchitecture
      : [
          {
            name: "App",
            filePath: "/App.js",
            purpose: "Main state container and view renderer",
            props: [],
            state: ["activeView", "items", "searchQuery"],
            dependencies: ["Header", "MainView"],
          },
          {
            name: "Header",
            filePath: "/components/Header.js",
            purpose: "Navigation, branding, search bar, and action triggers",
            props: ["title", "onSearch"],
            state: [],
            dependencies: ["lucide-react"],
          },
          {
            name: "MainView",
            filePath: "/components/MainView.js",
            purpose: "Core interactive experience and feature components",
            props: ["items", "onAction"],
            state: [],
            dependencies: ["lucide-react"],
          },
          {
            name: "mockData",
            filePath: "/data/mockData.js",
            purpose: "Rich initial realistic dataset and configuration constants",
            props: [],
            state: [],
            dependencies: [],
          },
        ],
    featureImplementationPlan: Array.isArray(parsed.featureImplementationPlan) && parsed.featureImplementationPlan.length > 0
      ? parsed.featureImplementationPlan
      : spec.coreFeatures.map((feat) => ({
          feature: feat,
          description: `Implementation of ${feat} with interactive state handling`,
          implementationSteps: ["Define state and action handlers", "Connect to UI controls", "Provide immediate visual feedback"],
        })),
    dataFlow: parsed.dataFlow && typeof parsed.dataFlow === "object"
      ? {
          stateManagement: parsed.dataFlow.stateManagement || "React useState and useEffect for reactive updates",
          dataSources: Array.isArray(parsed.dataFlow.dataSources) ? parsed.dataFlow.dataSources : ["/data/mockData.js"],
          flowDescription: parsed.dataFlow.flowDescription || "Unidirectional data flow with top-level state in /App.js",
        }
      : {
          stateManagement: "React useState with modular callback props",
          dataSources: ["/data/mockData.js"],
          flowDescription: "State lives in /App.js and passes down to child components with callback mutators",
        },
    interactionPlan: Array.isArray(parsed.interactionPlan) && parsed.interactionPlan.length > 0
      ? parsed.interactionPlan
      : [
          {
            userAction: "Filter items by category or keyword",
            expectedBehavior: "Live update displayed cards immediately",
            feedbackMechanism: "Active chip highlight and count badge update",
          },
          {
            userAction: "Click item card for details",
            expectedBehavior: "Open rich modal with full specifications and actions",
            feedbackMechanism: "Smooth modal fade-in with backdrop blur",
          },
        ],
    responsiveStrategy: parsed.responsiveStrategy && typeof parsed.responsiveStrategy === "object"
      ? {
          desktop: parsed.responsiveStrategy.desktop || "Bento grid layout with sticky control header",
          tablet: parsed.responsiveStrategy.tablet || "2-column fluid grid",
          mobile: parsed.responsiveStrategy.mobile || "Stacked cards with bottom navigation bar",
          breakpoints: parsed.responsiveStrategy.breakpoints || "sm: md: lg: xl:",
        }
      : {
          desktop: "Asymmetric Bento grid with sticky navigation",
          tablet: "2-column responsive layout",
          mobile: "Single column scrollable feed with touch targets",
          breakpoints: "sm: md: lg: xl:",
        },
    designDirection: parsed.designDirection && typeof parsed.designDirection === "object"
      ? {
          colorPalette: Array.isArray(parsed.designDirection.colorPalette) ? parsed.designDirection.colorPalette : ["#09090b", "#6366f1", "#10b981", "#f43f5e"],
          typography: parsed.designDirection.typography || "Plus Jakarta Sans / Inter modern typography",
          uiTheme: parsed.designDirection.uiTheme || "Sleek Obsidian Glassmorphism with vivid accents",
          layoutStyle: parsed.designDirection.layoutStyle || "Glassmorphism with backdrop blur and border-white/10",
          motionAndEffects: parsed.designDirection.motionAndEffects || "Smooth hover transitions and active states",
        }
      : {
          colorPalette: ["#09090b", "#3b82f6", "#10b981", "#e11d48"],
          typography: "Clean modern sans-serif",
          uiTheme: "Dark modern palette",
          layoutStyle: "Card-based glassmorphism",
          motionAndEffects: "Fast responsive transitions",
        },
  };
}

export async function generatePlan(
  spec: AppSpecification,
  fileData: FileData | null
): Promise<AppPlan> {
  const promptContent = `Generate the comprehensive Architecture and Implementation Plan based on this App Specification.

APP SPECIFICATION:
${JSON.stringify(spec, null, 2)}

${fileData ? `\n\nEXISTING WORKSPACE FILES:\n${JSON.stringify(Object.keys(fileData.files))}` : ""}

Ensure the component architecture explicitly lists /App.js and all needed subcomponents (e.g. in /components/ and /data/mockData.js). Remember: DO NOT write final code, write the structured architectural plan.`;

  const CANDIDATE_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
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
          systemInstruction: PLANNER_SYSTEM_PROMPT,
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      rawOutput = response.text || "";
      if (rawOutput) break;
    } catch (err) {
      console.warn(`[PLANNER] Model ${model} failed, trying fallback:`, err);
      lastError = err;
    }
  }

  if (!rawOutput) {
    console.error("[PLANNER] Generation failed on all candidate models. Falling back to default plan.");
    return sanitizePlan({}, spec);
  }

  try {
    const parsed = cleanAndParseJson(rawOutput);
    const plan = sanitizePlan(parsed, spec);

    if (process.env.NODE_ENV !== "production") {
      console.log("[PLANNER] Successfully generated App Plan:", {
        componentsPlanned: plan.componentArchitecture.map((c) => c.filePath),
        theme: plan.designDirection.uiTheme,
        featuresPlanned: plan.featureImplementationPlan.length,
      });
    }

    return plan;
  } catch (parseError) {
    console.error("[PLANNER] Failed to parse model output JSON:", parseError, "\nRaw output:", rawOutput);
    return sanitizePlan({}, spec);
  }
}
