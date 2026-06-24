"use client";

import type { LedgerSnapshot, ReconciliationSummary } from "@/types";

export function StatusBar({
  summary,
  loading,
}: {
  summary: ReconciliationSummary | null;
  loading: boolean;
}) {
  const mono: React.CSSProperties = {
    fontFamily: '"DM Mono", ui-monospace, monospace',
    fontSize: 12,
    fontWeight: 500,
  };

  const label: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "var(--ink-ghost)",
  };

  const stat = (lbl: string, val: React.ReactNode, color = "var(--ink)") => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "0 16px",
        height: "100%",
        borderRight: "1px solid var(--border)",
      }}
    >
      <span style={label}>{lbl}</span>
      <span style={{ ...mono, color }}>{val}</span>
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          height: 34,
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Mono", ui-monospace, monospace',
            fontSize: 10,
            color: "var(--ink-ghost)",
            animation: "pulse-opacity 1.2s ease-in-out infinite",
          }}
        >
          Swarm running...
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 34,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        flexShrink: 0,
        paddingLeft: 20,
      }}
    >
      {stat("Transactions", summary?.totalTransactions ?? "-")}
      {stat(
        "Matched",
        summary?.matchedTransactions ?? "-",
        summary ? "var(--green)" : "var(--ink)",
      )}
      {stat(
        "Anomalies",
        summary?.anomalyCount ?? "-",
        summary?.anomalyCount ? "var(--red)" : "var(--ink)",
      )}
      {stat(
        "Confidence",
        summary ? `${Math.round(summary.confidence * 100)}%` : "-",
        summary && summary.confidence < 0.8 ? "var(--amber)" : "var(--ink)",
      )}
      {summary &&
        stat(
          "Status",
          summary.requiresHumanReview ? "Review Required" : "Clean",
          summary.requiresHumanReview ? "var(--red)" : "var(--green)",
        )}
    </div>
  );
}

export function LedgerFooter({ ledger }: { ledger: LedgerSnapshot | null }) {
  const mono: React.CSSProperties = {
    fontFamily: '"DM Mono", ui-monospace, monospace',
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ink)",
  };

  const label: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "var(--ink-ghost)",
  };

  const stat = (lbl: string, val: React.ReactNode, color = "var(--ink)") => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "0 16px",
        height: "100%",
        borderRight: "1px solid var(--border)",
      }}
    >
      <span style={label}>{lbl}</span>
      <span style={{ ...mono, color }}>{val}</span>
    </div>
  );

  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        height: 40,
        borderTop: "1px solid var(--border)",
        background: "var(--bg-mid)",
        flexShrink: 0,
        paddingLeft: 20,
      }}
    >
      {ledger ? (
        <>
          {stat("Debits", `$${ledger.totalDebits.toFixed(2)}`)}
          {stat("Matched", ledger.matchedCount, "var(--green)")}
          {stat("Unmatched", ledger.unmatchedCount)}
          {stat("Flagged", ledger.flaggedCount, "var(--red)")}
        </>
      ) : (
        <span
          style={{
            fontFamily: '"DM Mono", ui-monospace, monospace',
            fontSize: 10,
            color: "var(--ink-ghost)",
          }}
        >
          Ledger totals appear after reconciliation
        </span>
      )}
    </footer>
  );
}
