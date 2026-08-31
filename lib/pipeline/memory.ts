import type {
  AppSpecification,

  AppPlan,
  DesignDNA,
  EvaluatedConcept,
  CritiqueEvaluation,
  ToolCallLog,
  GenerationReport,
  DesignHistoryRecord,
  UserDesignPreferences,
  ProjectMemory,
  MemoryRetrievalContext,
} from "@/types/pipeline";

// ─── Privacy & Security Sanitizer ─────────────────────────────────────────────

/**
 * Strips secrets, API keys, bearer tokens, passwords, and sensitive credentials
 * from prompts and reports before storing them into persistent memory.
 */
export function sanitizeTextForMemory(text: string): string {
  if (!text) return "";
  let sanitized = text;

  // Strip API keys (Stripe, OpenAI, Gemini, generic tokens)
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]");
  sanitized = sanitized.replace(/pk_[a-zA-Z0-9_-]{20,}/g, "[REDACTED_PUBLIC_KEY]");
  sanitized = sanitized.replace(/AIzaSy[a-zA-Z0-9_-]{20,}/g, "[REDACTED_GOOGLE_KEY]");
  sanitized = sanitized.replace(/AQ\.[a-zA-Z0-9_-]{20,}/g, "[REDACTED_GEMINI_KEY]");
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/gi, "Bearer [REDACTED_TOKEN]");

  // Strip passwords / credentials in prompts (e.g. password: "xyz")
  sanitized = sanitized.replace(/(password|passwd|secret|api_key|token)\s*[:=]\s*['"][^'"]+['"]/gi, "$1: [REDACTED]");

  return sanitized;
}

// ─── User Design Preference Extractor ─────────────────────────────────────────

const PREFERENCE_KEYWORDS = [
  "minimal", "minimalist", "clean",
  "colorful", "vibrant", "playful",
  "editorial", "magazine", "typography-focused",
  "dark mode", "dark theme", "light mode", "clean white",
  "high density", "swiss precision", "compact", "technical",
  "professional", "corporate", "enterprise",
  "retro", "cyberpunk", "arcade", "80s",
  "warm tactile", "soft", "organic", "pastel",
  "glassmorphism", "bento grid", "split-screen",
];

export function extractUserPreferences(
  prompt: string,
  existingPrefs?: UserDesignPreferences
): UserDesignPreferences {
  const lowerPrompt = prompt.toLowerCase();
  const foundKeywords: string[] = [];

  for (const kw of PREFERENCE_KEYWORDS) {
    if (lowerPrompt.includes(kw)) {
      foundKeywords.push(kw);
    }
  }

  const currentExplicit = new Set(existingPrefs?.explicitKeywords ?? []);
  foundKeywords.forEach((k) => currentExplicit.add(k));

  return {
    explicitKeywords: Array.from(currentExplicit).slice(0, 15),
    preferredThemes: existingPrefs?.preferredThemes ?? [],
    dislikedPatterns: existingPrefs?.dislikedPatterns ?? [],
    preferredColorTones: existingPrefs?.preferredColorTones ?? [],
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Relevant Memory Retrieval ────────────────────────────────────────────────

export function retrieveRelevantMemory(
  memory?: ProjectMemory | null,
  userPrefs?: UserDesignPreferences | null,
  currentPrompt?: string
): MemoryRetrievalContext {
  if (!memory && !userPrefs) {
    return {
      hasMemory: false,
      projectSummary: "",
      userPreferences: [],
      recentDesignFootprints: [],
      frequentlyUsedPatterns: [],
      repetitionAvoidanceAdvice: "",
      priorFixesToRemember: [],
    };
  }

  const reports = memory?.generationReports ?? [];
  const history = memory?.designHistory ?? [];

  // Recent design footprints (up to 3 recent runs)
  const recentDesignFootprints = history.slice(-3).map((h) => ({
    visualStyle: h.visualStyle,
    layoutStrategy: h.layoutStrategy,
    primaryColor: h.colors.primary,
  }));

  // Identify frequently used layouts & styles
  const styleCount: Record<string, number> = {};
  history.forEach((h) => {
    styleCount[h.visualStyle] = (styleCount[h.visualStyle] || 0) + 1;
    styleCount[h.layoutStrategy] = (styleCount[h.layoutStrategy] || 0) + 1;
  });

  const frequentlyUsedPatterns = Object.entries(styleCount)
    .filter(([_, count]) => count >= 2)
    .map(([pattern, count]) => `${pattern} (used ${count}x)`);

  // Repetition Avoidance Advice
  let repetitionAvoidanceAdvice = "";
  if (recentDesignFootprints.length > 0) {
    const lastStyles = recentDesignFootprints.map((f) => `"${f.visualStyle}" with layout "${f.layoutStrategy}"`).join(" and ");
    repetitionAvoidanceAdvice = `Recent generations in this workspace used ${lastStyles}. Avoid blindly duplicating these exact layout structures or color formulas UNLESS the current domain genuinely requires it. Explore fresh visual concepts.`;
  }

  // Prior fixes to remember
  const priorFixes = reports.flatMap((r) => r.fixesApplied).slice(-5);

  const userPrefKeywords = userPrefs?.explicitKeywords ?? memory?.userPreferences?.explicitKeywords ?? [];

  return {
    hasMemory: reports.length > 0 || userPrefKeywords.length > 0,
    projectSummary: memory?.compactHistorySummary || (reports.length > 0 ? `Project has ${reports.length} previous generation iterations.` : ""),
    userPreferences: userPrefKeywords,
    recentDesignFootprints,
    frequentlyUsedPatterns,
    repetitionAvoidanceAdvice,
    priorFixesToRemember: priorFixes,
  };
}

// ─── Generation Report Builder ────────────────────────────────────────────────

export function buildGenerationReport(params: {
  userPrompt: string;
  spec: AppSpecification;
  plan: AppPlan;
  designDNA: DesignDNA;
  exploredConcepts?: EvaluatedConcept[];
  toolLogs?: ToolCallLog[];
  evaluation: CritiqueEvaluation;
  fixesApplied?: string[];
  iterationsPerformed: number;
}): GenerationReport {
  const sanitizedPrompt = sanitizeTextForMemory(params.userPrompt);

  const rejectedConcepts = (params.exploredConcepts ?? [])
    .filter((c) => c.concept.name !== params.designDNA.conceptName)
    .map((c) => ({
      name: c.concept.name,
      styleDescription: c.concept.styleDescription,
      score: c.evaluation.weightedTotal,
    }));

  const toolUsage = (params.toolLogs ?? []).map((t) => ({
    tool: t.tool,
    success: t.success,
    durationMs: t.durationMs,
  }));

  return {
    generationId: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    userPrompt: sanitizedPrompt.slice(0, 500),
    appName: params.spec.appName,
    appType: params.spec.appType,
    coreFeatures: params.spec.coreFeatures.slice(0, 6),
    selectedDesignDNA: {
      conceptName: params.designDNA.conceptName,
      visualStyle: params.designDNA.visualStyle,
      designMood: params.designDNA.designMood,
      colorPalette: {
        primary: params.designDNA.colorStrategy.primary,
        secondary: params.designDNA.colorStrategy.secondary,
        accent: params.designDNA.colorStrategy.accent,
        background: params.designDNA.colorStrategy.background,
      },
      layoutStrategy: params.designDNA.layoutStrategy,
    },
    rejectedConcepts,
    toolUsage,
    iterationsPerformed: params.iterationsPerformed,
    issuesDiscovered: params.evaluation.criticalIssues,
    fixesApplied: params.fixesApplied ?? [],
    evaluationScores: {
      overall: params.evaluation.overallScore,
      functional: params.evaluation.functionalScore,
      visual: params.evaluation.visualDesignScore,
      stability: params.evaluation.stabilityScore,
    },
    passed: params.evaluation.passed,
  };
}

// ─── Memory Compactor & Updater ───────────────────────────────────────────────

const MAX_DETAILED_REPORTS = 5;
const MAX_DESIGN_HISTORY_RECORDS = 8;

export function updateProjectMemory(
  currentMemory: ProjectMemory | null | undefined,
  newReport: GenerationReport,
  designDNA: DesignDNA,
  userPrefs?: UserDesignPreferences
): ProjectMemory {
  const existingReports = currentMemory?.generationReports ?? [];
  const existingHistory = currentMemory?.designHistory ?? [];
  const totalCount = (currentMemory?.totalGenerationsCount ?? 0) + 1;

  // New design footprint
  const newDesignRecord: DesignHistoryRecord = {
    timestamp: newReport.timestamp,
    visualStyle: designDNA.visualStyle,
    designMood: designDNA.designMood,
    layoutStrategy: designDNA.layoutStrategy,
    colors: {
      primary: designDNA.colorStrategy.primary,
      secondary: designDNA.colorStrategy.secondary,
      accent: designDNA.colorStrategy.accent,
      background: designDNA.colorStrategy.background,
    },
    componentPatterns: [designDNA.componentShapeStrategy.cardStyle, designDNA.componentShapeStrategy.buttonStyle],
    navigationPattern: designDNA.navigationStrategy,
  };

  const updatedHistory = [...existingHistory, newDesignRecord].slice(-MAX_DESIGN_HISTORY_RECORDS);

  // Failure category frequency tracking
  const issueCounts = { ...(currentMemory?.commonIssuesEncountered ?? {}) };
  for (const issue of newReport.issuesDiscovered) {
    const key = issue.toLowerCase().includes("handler") || issue.toLowerCase().includes("click")
      ? "dead_handler"
      : issue.toLowerCase().includes("import")
      ? "missing_import"
      : issue.toLowerCase().includes("export")
      ? "missing_export"
      : "visual_inconsistency";
    issueCounts[key] = (issueCounts[key] || 0) + 1;
  }

  // Manage reports with compaction
  const allReports = [...existingReports, newReport];
  let compactSummary = currentMemory?.compactHistorySummary || "";

  if (allReports.length > MAX_DETAILED_REPORTS) {
    const compacted = allReports.slice(0, allReports.length - MAX_DETAILED_REPORTS);
    const compactSnippets = compacted.map(
      (r) => `[Gen: ${r.appName} (${r.appType}) | Style: "${r.selectedDesignDNA.visualStyle}" | Score: ${r.evaluationScores.overall}/10]`
    );
    compactSummary = `Historical Overview (${compacted.length} prior generations): ${compactSnippets.join("; ")}`;
  }

  const recentReports = allReports.slice(-MAX_DETAILED_REPORTS);

  return {
    workspaceId: currentMemory?.workspaceId ?? "",
    generationReports: recentReports,
    compactHistorySummary: compactSummary,
    designHistory: updatedHistory,
    commonIssuesEncountered: issueCounts,
    userPreferences: userPrefs ?? currentMemory?.userPreferences,
    totalGenerationsCount: totalCount,
  };
}
