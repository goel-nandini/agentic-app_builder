import { GoogleGenAI } from "@google/genai";
import type {
  AppSpecification,
  AppPlan,
  DesignExplorerResult,
  DesignDNA,
  EvaluatedConcept,
  MemoryRetrievalContext,
} from "@/types/pipeline";

import type { FileData } from "@/types/workspace";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});

// ─── Default Generic-Pattern Blacklist ─────────────────────────────────────────
export const GENERIC_PATTERN_BLACKLIST: string[] = [
  "Cliché default indigo/purple gradients (e.g. from-indigo-500 to-purple-600) on generic dark cards",
  "Generic SaaS dashboard blueprint (top stats row + chart + bottom table) for non-SaaS apps",
  "Repetitive uniform 3-card grid without visual weight, varied sizes, or clear hierarchy",
  "Generic centered hero section with 'The future of X' copy and 2 identical rounded buttons",
  "Unnecessary decorative floating blurry blobs that serve no UI purpose",
  "Overly rounded bubble containers (rounded-3xl everywhere) on serious or technical tools",
  "Gratuitous sparkle/magic wand icons unless directly representing an AI generation action",
  "Vague glassmorphism with low contrast text that fails accessibility readability standards",
  "Generic placeholder cards with lorem ipsum style repetitive content",
];

const DESIGN_EXPLORER_SYSTEM_PROMPT = `You are a World-Class Creative Director and Lead Design Systems Architect (inspired by Manus AI, Linear, Apple, Stripe, and Vercel).
Your mission is to invent a bespoke, distinctive, and domain-appropriate Design DNA for a React application running in a Sandpack browser environment.

ANTI-GENERIC MANDATE:
AI generators constantly output the exact same template: generic dark SaaS dashboard, purple/indigo gradient, 3 rounded cards, a mock chart, and floating blobs.
YOU MUST ACTIVELY BREAK THIS CYCLE. Every product deserves a tailored aesthetic derived directly from its domain and user emotional needs.

WORLD-CLASS DESIGN ARCHETYPES (Select & customize based on domain):
1. Linear / Raycast Dark Glassmorphism:
   - Deep obsidian/zinc background (#09090b / #0c0a09), razor-sharp borders (border-white/10), translucent glass cards (bg-zinc-900/70 backdrop-blur-xl), electric accents (emerald-400, cyan-400, violet-400), monospace micro-badges.
2. Apple / Vercel Minimalist Elegance:
   - High-contrast typography hierarchy, generous whitespace, crisp 1px neutral borders, subtle card elevations (shadow-sm to shadow-xl), monochromatic depth with a single razor-sharp primary accent.
3. Asymmetric Bento Grid Architecture:
   - Variable card spans (col-span-2, row-span-2, col-span-1), spotlight hero widgets, embedded mini-stats with sparklines, interactive search and filter bars.
4. Swiss High-Density FinTech & Data:
   - Razor-sharp borders (rounded-none or rounded-sm), tabular numbers, compact padding, deep slate/charcoal backgrounds with emerald/amber profit/loss indicators, instant keyboard/click shortcuts.
5. Warm Tactile Editorial & Lifestyle:
   - Warm stone/sand backgrounds, rich serif/editorial headings, warm terracotta/sage accents, magazine-style full-bleed photography cards, storytelling timeline layouts.
6. Cyberpunk / Arcade Tactile HUD:
   - High-contrast neon cyan/lime/magenta borders, scanline/grid textures, on-screen tactile arcade buttons, monospace counters, live glowing status indicators.

WORKFLOW:
1. Generate 3 substantially DIFFERENT design concepts tailored to this specific app domain.
   - Vary the layout structure (e.g. Asymmetric Bento Grid vs Split-Screen Studio vs Minimalist Sheet vs Horizontal Interactive Feed).
   - Vary the visual language & mood (e.g. Linear Dark Glassmorphism vs Editorial Warmth vs Swiss High-Density vs Modern Bento).
   - Vary color palette, typography hierarchy, and component shapes.
2. Rigorously evaluate each concept on:
   - domainRelevance (0-10)
   - usability (0-10)
   - visualQuality (0-10)
   - uniqueness (0-10)
   - consistency (0-10)
   - accessibility (0-10)
   - implementationFeasibility (0-10)
3. Select the winning concept and synthesize it into a complete, executable Design DNA.
4. Output STRICT JSON conforming to the schema below.

JSON SCHEMA:
{
  "exploredConcepts": [
    {
      "concept": {
        "name": "<Concept 1 Name>",
        "styleDescription": "<Detailed description of visual style & aesthetic>",
        "layoutRationale": "<Why this layout fits the domain better than a generic dashboard>",
        "interactionModel": "<How users interact with controls, filters, cards>",
        "visualLanguage": "<Design accents, borders, cards, surfaces>",
        "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
        "keyStrengths": ["<Strength 1>", "<Strength 2>"]
      },
      "evaluation": {
        "domainRelevance": 9,
        "usability": 9,
        "visualQuality": 9,
        "uniqueness": 9,
        "consistency": 9,
        "accessibility": 9,
        "implementationFeasibility": 9,
        "weightedTotal": 9.0,
        "critique": "<Specific constructive critique of this concept>"
      }
    }
    // Exactly 3 concepts
  ],
  "selectedConceptIndex": 0,
  "designDNA": {
    "conceptName": "<Selected Concept Name>",
    "visualStyle": "<e.g. Warm Tactile Editorial | Swiss High-Density FinTech | Cyberpunk HUD | Crisp Minimalist Utility>",
    "designMood": "<e.g. Trustworthy & Precise | Playful & Inviting | Immersive & Sleek>",
    "colorStrategy": {
      "primary": "#hex",
      "secondary": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "textPrimary": "#hex",
      "textMuted": "#hex",
      "accent": "#hex",
      "border": "#hex",
      "usageRules": "<Clear rules on how background, surface, text, and accent colors should be applied>"
    },
    "typographyStrategy": {
      "headingFont": "<Font family style or sans/serif/mono guidance>",
      "bodyFont": "<Font family style>",
      "scaleHierarchy": "<Clear heading vs body size progression>",
      "letterSpacing": "<e.g. tracking-tight for titles, tracking-wide for uppercase micro-badges>",
      "transformRule": "<e.g. uppercase for tags and labels, normal for headings>"
    },
    "layoutStrategy": "<Specific Tailwind layout blueprint: e.g. Left sticky summary + right interactive sheet | Asymmetric 3-column Bento | Centered focused workspace>",
    "spacingStrategy": "<e.g. Compact high-density px-3 py-2 | Expansive breathable gap-6 p-8>",
    "componentShapeStrategy": {
      "borderRadius": "<e.g. rounded-none | rounded-md | rounded-xl | rounded-2xl>",
      "borderStyle": "<e.g. border border-zinc-800 | border-2 border-amber-500/30 | border border-white/10>",
      "cardStyle": "<e.g. Solid high-contrast surface with crisp 1px borders and subtle shadow-sm>",
      "buttonStyle": "<e.g. Tactile solid pill with active:scale-95 transition>",
      "badgeStyle": "<e.g. Monospace tag with rounded-sm border px-2 py-0.5 text-xs>"
    },
    "interactionStrategy": "<Micro-interactions: hover highlights, active presses, instant feedback, optimistic updates>",
    "animationStrategy": "<Subtle CSS transitions (duration-150 / duration-200), zero distracting floating animations>",
    "imageryStrategy": "<Curated imagery treatment: high-res Unsplash URLs with matching aspect-ratios and subtle border frames>",
    "navigationStrategy": "<e.g. Top minimal command bar | Floating pill dock | Tabbed view switcher | Sidebar navigation>",
    "accessibilityStrategy": "<High contrast foreground/background, clear focus indicators, readable font sizes (>=13px)>",
    "avoidPatterns": ["<List of 4-6 specific generic patterns strictly forbidden for this project>"],
    "designQualityScore": 9.2,
    "uniquenessScore": 9.0,
    "designReasoning": "<1-2 concise sentences explaining why this bespoke design best fulfills the user's intent>"
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
      throw new Error("Unable to parse JSON from Design Explorer output");
    }
  }
}

function sanitizeDesignExplorerResult(parsed: any, spec: AppSpecification, plan: AppPlan): DesignExplorerResult {
  const defaultAvoidPatterns = [
    ...GENERIC_PATTERN_BLACKLIST.slice(0, 4),
    `Generic SaaS dashboard layout for ${spec.appName}`,
  ];

  const defaultDNA: DesignDNA = {
    conceptName: spec.appName + " Bespoke UI",
    visualStyle: plan.designDirection.uiTheme || "Modern High-Craft Aesthetic",
    designMood: "Distinctive, functional, and tailored to " + spec.appType,
    colorStrategy: {
      primary: plan.designDirection.colorPalette[0] || "#0f172a",
      secondary: plan.designDirection.colorPalette[1] || "#3b82f6",
      background: "#09090b",
      surface: "#18181b",
      textPrimary: "#fafafa",
      textMuted: "#a1a1aa",
      accent: plan.designDirection.colorPalette[2] || "#10b981",
      border: "rgba(255,255,255,0.1)",
      usageRules: "Use solid surface cards with subtle borders; use accent for primary action buttons and active indicators.",
    },
    typographyStrategy: {
      headingFont: "font-sans font-bold",
      bodyFont: "font-sans",
      scaleHierarchy: "text-2xl font-bold -> text-base -> text-xs uppercase tags",
      letterSpacing: "tracking-tight for headers, tracking-wider for tags",
      transformRule: "Uppercase for category chips and status badges",
    },
    layoutStrategy: "Responsive modular layout with clear visual hierarchy and domain-specific interactive panels",
    spacingStrategy: "p-4 sm:p-6 gap-4 sm:gap-6 fluid rhythm",
    componentShapeStrategy: {
      borderRadius: "rounded-xl",
      borderStyle: "border border-white/10",
      cardStyle: "bg-zinc-900/90 border border-white/10 backdrop-blur-md shadow-lg",
      buttonStyle: "px-4 py-2 rounded-lg font-medium transition-all active:scale-95",
      badgeStyle: "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
    },
    interactionStrategy: "Instant state updates with visual focus and transition feedback on all interactive elements",
    animationStrategy: "Fast subtle transitions (transition-all duration-200), no gratuitous floating elements",
    imageryStrategy: "Curated high-res Unsplash photography with clean rounded borders and subtle aspect ratios",
    navigationStrategy: "Header with integrated search and quick view switchers",
    accessibilityStrategy: "High contrast text colors on dark backgrounds with clear focus rings",
    avoidPatterns: defaultAvoidPatterns,
    designQualityScore: 9.0,
    uniquenessScore: 8.8,
    designReasoning: `Tailored uniquely for ${spec.appName} to avoid generic SaaS dashboard templates.`,
  };

  if (!parsed || typeof parsed !== "object") {
    return {
      exploredConcepts: [],
      selectedConceptIndex: 0,
      designDNA: defaultDNA,
    };
  }

  const rawDNA = parsed.designDNA || {};
  const sanitizedDNA: DesignDNA = {
    conceptName: rawDNA.conceptName || defaultDNA.conceptName,
    visualStyle: rawDNA.visualStyle || defaultDNA.visualStyle,
    designMood: rawDNA.designMood || defaultDNA.designMood,
    colorStrategy: {
      primary: rawDNA.colorStrategy?.primary || defaultDNA.colorStrategy.primary,
      secondary: rawDNA.colorStrategy?.secondary || defaultDNA.colorStrategy.secondary,
      background: rawDNA.colorStrategy?.background || defaultDNA.colorStrategy.background,
      surface: rawDNA.colorStrategy?.surface || defaultDNA.colorStrategy.surface,
      textPrimary: rawDNA.colorStrategy?.textPrimary || defaultDNA.colorStrategy.textPrimary,
      textMuted: rawDNA.colorStrategy?.textMuted || defaultDNA.colorStrategy.textMuted,
      accent: rawDNA.colorStrategy?.accent || defaultDNA.colorStrategy.accent,
      border: rawDNA.colorStrategy?.border || defaultDNA.colorStrategy.border,
      usageRules: rawDNA.colorStrategy?.usageRules || defaultDNA.colorStrategy.usageRules,
    },
    typographyStrategy: {
      headingFont: rawDNA.typographyStrategy?.headingFont || defaultDNA.typographyStrategy.headingFont,
      bodyFont: rawDNA.typographyStrategy?.bodyFont || defaultDNA.typographyStrategy.bodyFont,
      scaleHierarchy: rawDNA.typographyStrategy?.scaleHierarchy || defaultDNA.typographyStrategy.scaleHierarchy,
      letterSpacing: rawDNA.typographyStrategy?.letterSpacing || defaultDNA.typographyStrategy.letterSpacing,
      transformRule: rawDNA.typographyStrategy?.transformRule || defaultDNA.typographyStrategy.transformRule,
    },
    layoutStrategy: rawDNA.layoutStrategy || defaultDNA.layoutStrategy,
    spacingStrategy: rawDNA.spacingStrategy || defaultDNA.spacingStrategy,
    componentShapeStrategy: {
      borderRadius: rawDNA.componentShapeStrategy?.borderRadius || defaultDNA.componentShapeStrategy.borderRadius,
      borderStyle: rawDNA.componentShapeStrategy?.borderStyle || defaultDNA.componentShapeStrategy.borderStyle,
      cardStyle: rawDNA.componentShapeStrategy?.cardStyle || defaultDNA.componentShapeStrategy.cardStyle,
      buttonStyle: rawDNA.componentShapeStrategy?.buttonStyle || defaultDNA.componentShapeStrategy.buttonStyle,
      badgeStyle: rawDNA.componentShapeStrategy?.badgeStyle || defaultDNA.componentShapeStrategy.badgeStyle,
    },
    interactionStrategy: rawDNA.interactionStrategy || defaultDNA.interactionStrategy,
    animationStrategy: rawDNA.animationStrategy || defaultDNA.animationStrategy,
    imageryStrategy: rawDNA.imageryStrategy || defaultDNA.imageryStrategy,
    navigationStrategy: rawDNA.navigationStrategy || defaultDNA.navigationStrategy,
    accessibilityStrategy: rawDNA.accessibilityStrategy || defaultDNA.accessibilityStrategy,
    avoidPatterns: Array.isArray(rawDNA.avoidPatterns) && rawDNA.avoidPatterns.length > 0
      ? rawDNA.avoidPatterns
      : defaultAvoidPatterns,
    designQualityScore: typeof rawDNA.designQualityScore === "number" ? Math.min(10, Math.max(0, rawDNA.designQualityScore)) : 9.0,
    uniquenessScore: typeof rawDNA.uniquenessScore === "number" ? Math.min(10, Math.max(0, rawDNA.uniquenessScore)) : 8.8,
    designReasoning: rawDNA.designReasoning || defaultDNA.designReasoning,
  };

  const rawConcepts: EvaluatedConcept[] = Array.isArray(parsed.exploredConcepts)
    ? parsed.exploredConcepts.map((item: any) => ({
        concept: {
          name: item.concept?.name || "Design Concept",
          styleDescription: item.concept?.styleDescription || "Tailored visual concept",
          layoutRationale: item.concept?.layoutRationale || "Domain-specific layout",
          interactionModel: item.concept?.interactionModel || "Direct interactive controls",
          visualLanguage: item.concept?.visualLanguage || "Modern UI elements",
          colorPalette: Array.isArray(item.concept?.colorPalette) ? item.concept.colorPalette : defaultDNA.colorStrategy.primary,
          keyStrengths: Array.isArray(item.concept?.keyStrengths) ? item.concept.keyStrengths : ["Tailored aesthetic"],
        },
        evaluation: {
          domainRelevance: item.evaluation?.domainRelevance ?? 9,
          usability: item.evaluation?.usability ?? 9,
          visualQuality: item.evaluation?.visualQuality ?? 9,
          uniqueness: item.evaluation?.uniqueness ?? 9,
          consistency: item.evaluation?.consistency ?? 9,
          accessibility: item.evaluation?.accessibility ?? 9,
          implementationFeasibility: item.evaluation?.implementationFeasibility ?? 9,
          weightedTotal: item.evaluation?.weightedTotal ?? 9.0,
          critique: item.evaluation?.critique || "Strong concept",
        },
      }))
    : [];

  return {
    exploredConcepts: rawConcepts,
    selectedConceptIndex: typeof parsed.selectedConceptIndex === "number" ? parsed.selectedConceptIndex : 0,
    designDNA: sanitizedDNA,
  };
}

export async function exploreDesignDNA(
  spec: AppSpecification,
  plan: AppPlan,
  fileData: FileData | null,
  memoryContext?: MemoryRetrievalContext
): Promise<DesignExplorerResult> {
  let memoryDesignSection = "";
  if (memoryContext?.hasMemory) {
    memoryDesignSection = `\n\nDESIGN HISTORY & REPETITION AVOIDANCE RULES (CRITICAL):
${memoryContext.repetitionAvoidanceAdvice ? `- Repetition Guard: ${memoryContext.repetitionAvoidanceAdvice}` : ""}
${memoryContext.frequentlyUsedPatterns.length > 0 ? `- Heavily Used Patterns in Workspace: ${memoryContext.frequentlyUsedPatterns.join(", ")}` : ""}
${memoryContext.userPreferences.length > 0 ? `- User Explicit Style Preferences: ${memoryContext.userPreferences.join(", ")}` : ""}`;
  }

  const promptContent = `Execute the Design Explorer stage for this application.
Explore 3 diverse, creative, and domain-authentic design concepts that break away from cliché AI layouts, evaluate them, and output the winning Design DNA.

APP SPECIFICATION:
- App Name: ${spec.appName}
- App Type: ${spec.appType}
- Target Users: ${spec.targetUsers}
- Problem Statement: ${spec.problemStatement}
- Core Features: ${spec.coreFeatures.join(", ")}
- User Preferences: ${spec.explicitUserPreferences.join(", ") || "None"}
- Things to Avoid: ${spec.thingsToAvoid.join(", ") || "Generic dashboard defaults"}

ARCHITECTURAL PLAN SUMMARY:
- Planned Components: ${plan.componentArchitecture.map((c) => c.name).join(", ")}
- Current Theme: ${plan.designDirection.uiTheme}
- Color Palette: ${plan.designDirection.colorPalette.join(", ")}

GENERIC PATTERNS TO ACTIVELY AVOID:
${GENERIC_PATTERN_BLACKLIST.map((item) => `- ${item}`).join("\n")}${memoryDesignSection}

Ensure the 3 concepts are distinct in visual language, layout geometry, typography contrast, and interaction model. Output strict JSON matching the instructions.`;


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
          systemInstruction: DESIGN_EXPLORER_SYSTEM_PROMPT,
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      });

      rawOutput = response.text || "";
      if (rawOutput) break;
    } catch (err) {
      console.warn(`[DESIGN-EXPLORER] Model ${model} failed, trying fallback:`, err);
      lastError = err;
    }
  }

  if (!rawOutput) {
    console.error("[DESIGN-EXPLORER] Generation failed on all candidate models. Falling back to default DNA.");
    return sanitizeDesignExplorerResult({}, spec, plan);
  }

  try {
    const parsed = cleanAndParseJson(rawOutput);
    const result = sanitizeDesignExplorerResult(parsed, spec, plan);

    if (process.env.NODE_ENV !== "production") {
      console.log("[DESIGN-EXPLORER] Successfully synthesized Design DNA:", {
        conceptName: result.designDNA.conceptName,
        visualStyle: result.designDNA.visualStyle,
        designQualityScore: result.designDNA.designQualityScore,
        uniquenessScore: result.designDNA.uniquenessScore,
        borderRadius: result.designDNA.componentShapeStrategy.borderRadius,
        avoidPatternsCount: result.designDNA.avoidPatterns.length,
      });
    }

    return result;
  } catch (parseError) {
    console.error("[DESIGN-EXPLORER] Failed to parse model output JSON:", parseError, "\nRaw output:", rawOutput);
    return sanitizeDesignExplorerResult({}, spec, plan);
  }
}
