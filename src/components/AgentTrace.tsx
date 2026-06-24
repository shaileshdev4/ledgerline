import { HiArrowPath, HiCheckCircle, HiExclamationTriangle } from "react-icons/hi2";
import type { AgentRole, TraceEvent } from "@/types";
import { AgentTag } from "./AgentTag";

export function AgentTrace({
  trace,
  agentStatuses,
}: {
  trace: TraceEvent[];
  agentStatuses: Partial<Record<AgentRole, { status: string; active: boolean }>>;
}) {
  return (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(["ingestion", "matcher", "skeptic", "reconciler"] as AgentRole[]).map((role) => {
            const state = agentStatuses[role];
            return (
              <span
                key={role}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  padding: "5px 8px",
                  background: state?.active ? "var(--blue-bg)" : "var(--bg-mid)",
                }}
              >
                <AgentTag role={role} />
                <span style={{ fontSize: 10, color: "var(--ink-ghost)" }}>{state?.status ?? "Waiting"}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="scroll-panel" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {trace.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--ink-ghost)", padding: 8 }}>
            Trace will appear here once reconciliation starts.
          </div>
        ) : (
          trace.map((event) => {
            const icon =
              event.type === "anomaly_flagged" ? (
                <HiExclamationTriangle size={14} />
              ) : event.type === "agent_completed" || event.type === "report_ready" ? (
                <HiCheckCircle size={14} />
              ) : (
                <HiArrowPath size={14} />
              );
            return (
              <div
                key={event.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 9px",
                  background: "var(--bg)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-mid)" }}>
                    {icon}
                    <AgentTag role={event.agentRole} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--ink-ghost)", fontFamily: "var(--font-mono)" }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--ink)" }}>{event.message}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

