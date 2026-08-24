export interface PlanTask {
  type:
    | "inspect_project"
    | "create_file"
    | "update_file"
    | "delete_file"
    | "install_package"
    | "run_command"
    | "run_build"
    | "start_preview";
  path?: string;
  package?: string;
  command?: string;
  description?: string;
}

export interface PlanResult {
  goal: string;
  projectType: "web" | "node" | "react";
  framework: string;
  tasks: PlanTask[];
}

export type AgentState =
  | "idle"
  | "planning"
  | "inspecting"
  | "writing"
  | "installing"
  | "running"
  | "building"
  | "fixing"
  | "starting_preview"
  | "completed"
  | "failed";

export type AgentEventType =
  | "agent_status"
  | "plan"
  | "tool_call"
  | "tool_result"
  | "build"
  | "fix_attempt"
  | "preview_ready"
  | "message"
  | "error";

export interface AgentEvent {
  id: string;
  agentRunId: string;
  projectId: string;
  type: AgentEventType;
  status?: AgentState;
  payload: any;
  timestamp: string;
}

export interface CommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs?: number;
}

export interface ToolResult<T = any> {
  success: boolean;
  tool: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}
