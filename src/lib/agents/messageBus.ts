import type { AgentRole, ProvenanceRecord, TraceEvent } from "@/types";
import { generateId } from "../engine/ledgerEngine";

export class MessageBus {
  private trace: TraceEvent[] = [];
  private provenance: ProvenanceRecord[] = [];

  addTrace(
    agentRole: AgentRole,
    type: TraceEvent["type"],
    message: string,
    data?: Record<string, unknown>,
  ): void {
    this.trace.push({
      id: generateId("trace"),
      timestamp: new Date().toISOString(),
      type,
      agentRole,
      message,
      data,
    });
  }

  addProvenance(
    agentRole: AgentRole,
    action: string,
    reason: string,
    transactionIds?: string[],
  ): void {
    this.provenance.push({
      id: generateId("prov"),
      timestamp: new Date().toISOString(),
      agentRole,
      action,
      reason,
      transactionIds,
    });
  }

  start(agentRole: AgentRole, message: string): void {
    this.addTrace(agentRole, "agent_started", message);
  }

  complete(agentRole: AgentRole, message: string): void {
    this.addTrace(agentRole, "agent_completed", message);
  }

  snapshot(): { trace: TraceEvent[]; provenance: ProvenanceRecord[] } {
    return { trace: [...this.trace], provenance: [...this.provenance] };
  }
}

