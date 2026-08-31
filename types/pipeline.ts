// ─── Agentic Pipeline Types (Phase 1) ─────────────────────────────────────────

export interface AppSpecification {
  appName: string;
  appType: string;
  targetUsers: string;
  problemStatement: string;
  coreFeatures: string[];
  secondaryFeatures: string[];
  requiredPages: string[];
  navigationStructure: string;
  importantUserFlows: string[];
  dataEntities: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  responsiveRequirements: string;
  accessibilityRequirements: string;
  designRequirements: string;
  explicitUserPreferences: string[];
  thingsToAvoid: string[];
}

export interface ComponentSpec {
  name: string;
  filePath: string;
  purpose: string;
  props: string[];
  state: string[];
  dependencies: string[];
}

export interface PageSpec {
  name: string;
  path: string;
  purpose: string;
  components: string[];
}

export interface FeatureImplementationSpec {
  feature: string;
  description: string;
  implementationSteps: string[];
}

export interface InteractionSpec {
  userAction: string;
  expectedBehavior: string;
  feedbackMechanism: string;
}

export interface AppPlan {
  pageArchitecture: PageSpec[];
  componentArchitecture: ComponentSpec[];
  featureImplementationPlan: FeatureImplementationSpec[];
  dataFlow: {
    stateManagement: string;
    dataSources: string[];
    flowDescription: string;
  };
  interactionPlan: InteractionSpec[];
  responsiveStrategy: {
    desktop: string;
    tablet: string;
    mobile: string;
    breakpoints: string;
  };
  designDirection: {
    colorPalette: string[];
    typography: string;
    uiTheme: string;
    layoutStyle: string;
    motionAndEffects: string;
  };
}

// ─── Design DNA & Explorer Types (Phase 2) ───────────────────────────────────

export interface ColorStrategy {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  border: string;
  usageRules: string;
}

export interface TypographyStrategy {
  headingFont: string;
  bodyFont: string;
  scaleHierarchy: string;
  letterSpacing: string;
  transformRule: string;
}

export interface ComponentShapeStrategy {
  borderRadius: string; // e.g. "rounded-none", "rounded-xl", "rounded-2xl"
  borderStyle: string;   // e.g. "border border-white/10", "border-2 border-zinc-800"
  cardStyle: string;     // e.g. "Solid high-contrast surface with crisp 1px borders"
  buttonStyle: string;   // e.g. "Pill-shaped vibrant accent with hover bounce"
  badgeStyle: string;    // e.g. "Monospace tag with subtle glow"
}

export interface DesignDNA {
  conceptName: string;
  visualStyle: string;
  designMood: string;
  colorStrategy: ColorStrategy;
  typographyStrategy: TypographyStrategy;
  layoutStrategy: string;
  spacingStrategy: string;
  componentShapeStrategy: ComponentShapeStrategy;
  interactionStrategy: string;
  animationStrategy: string;
  imageryStrategy: string;
  navigationStrategy: string;
  accessibilityStrategy: string;
  avoidPatterns: string[];
  designQualityScore: number; // 0 - 10
  uniquenessScore: number;    // 0 - 10
  designReasoning: string;
}

export interface DesignConcept {
  name: string;
  styleDescription: string;
  layoutRationale: string;
  interactionModel: string;
  visualLanguage: string;
  colorPalette: string[];
  keyStrengths: string[];
}

export interface DesignEvaluation {
  domainRelevance: number; // 0 - 10
  usability: number;       // 0 - 10
  visualQuality: number;   // 0 - 10
  uniqueness: number;      // 0 - 10
  consistency: number;     // 0 - 10
  accessibility: number;   // 0 - 10
  implementationFeasibility: number; // 0 - 10
  weightedTotal: number;   // 0 - 10
  critique: string;
}

export interface EvaluatedConcept {
  concept: DesignConcept;
  evaluation: DesignEvaluation;
}

export interface DesignExplorerResult {
  exploredConcepts: EvaluatedConcept[];
  selectedConceptIndex: number;
  designDNA: DesignDNA;
}

// ─── Critic & Self-Healing Loop Types (Phase 3) ──────────────────────────────


export type IssueSeverity = "critical" | "warning" | "suggestion";

export interface InspectionIssue {
  severity: IssueSeverity;
  filePath: string;
  category: "syntax" | "imports" | "interactivity" | "design_dna" | "responsive";
  description: string;
  suggestedFix?: string;
}

export interface CodeInspectionResult {
  passedStaticAnalysis: boolean;
  issues: InspectionIssue[];
  metrics: {
    totalFiles: number;
    totalLines: number;
    deadHandlerCount: number;
    missingExportCount: number;
  };
}

export interface CritiqueEvaluation {
  overallScore: number;       // 0.0 - 10.0
  functionalScore: number;    // 0.0 - 10.0
  visualDesignScore: number;  // 0.0 - 10.0
  stabilityScore: number;     // 0.0 - 10.0
  passed: boolean;            // true if overallScore >= threshold (e.g. 8.5)
  critiqueSummary: string;
  criticalIssues: string[];
  recommendedFixes: string[];
}

export interface FixerResult {
  fixedFiles: Record<string, { code: string }>;
  fixesApplied: string[];
  attemptCount: number;
  finalEvaluation: CritiqueEvaluation;
}
