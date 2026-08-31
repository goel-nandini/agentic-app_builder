// ─── Central types barrel ─────────────────────────────────────────────────────
// Import from here for convenience: import type { Message, FileData } from "@/types"

export type {
  MessageRole,
  Message,
  FileData,
  StatusStep,
  WorkspaceData,
  WorkspaceUser,
} from "./workspace";
export type { ProjectSummary } from "./project";
export type { Plan } from "./plans";
export type {
  AppSpecification,
  AppPlan,
  ComponentSpec,
  PageSpec,
  FeatureImplementationSpec,
  InteractionSpec,
  DesignDNA,
  DesignConcept,
  DesignEvaluation,
  EvaluatedConcept,
  DesignExplorerResult,
  ColorStrategy,
  TypographyStrategy,
  ComponentShapeStrategy,
  IssueSeverity,
  InspectionIssue,
  CodeInspectionResult,
  CritiqueEvaluation,
  FixerResult,
  ToolCategory,
  ToolSafetyLevel,
  ToolExecutionContext,
  ToolParameter,
  ToolDefinition,
  ToolCallLog,
  ToolResearchContext,
  AgentToolCall,
  AgentToolDecision,
} from "./pipeline";

