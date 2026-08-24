import { AgentState, AgentEvent, AgentEventType } from "../ai/schemas";

export class AgentStateTracker {
  private currentState: AgentState = "idle";
  private agentRunId: string;
  private projectId: string;
  private listeners: Array<(event: AgentEvent) => void> = [];

  constructor(agentRunId: string, projectId: string) {
    this.agentRunId = agentRunId;
    this.projectId = projectId;
  }

  public getState(): AgentState {
    return this.currentState;
  }

  public setState(state: AgentState) {
    this.currentState = state;
    this.emit({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      agentRunId: this.agentRunId,
      projectId: this.projectId,
      type: "agent_status",
      status: this.currentState,
      payload: { status: this.currentState },
      timestamp: new Date().toISOString(),
    });
  }

  public emitEvent(type: AgentEventType, payload: any) {
    this.emit({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      agentRunId: this.agentRunId,
      projectId: this.projectId,
      type,
      status: this.currentState,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  public subscribe(listener: (event: AgentEvent) => void) {
    this.listeners.push(listener);
  }

  private emit(event: AgentEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in event listener:", err);
      }
    }
  }
}
