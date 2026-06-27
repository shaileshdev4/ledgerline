import { SourcePill } from "./SourcePill";
import type { Anomaly, AnomalySeverity, Transaction } from "@/types";

function fmtMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

const SEVERITY_RANK: Record<AnomalySeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function sortByFlagSeverity(transactions: Transaction[], anomalies: Anomaly[]): Transaction[] {
  const originalIndex = new Map(transactions.map((t, i) => [t.id, i]));
  const severityByTxn = new Map<string, number>();

  for (const anomaly of anomalies) {
    const rank = SEVERITY_RANK[anomaly.severity];
    for (const id of anomaly.transactionIds) {
      severityByTxn.set(id, Math.max(severityByTxn.get(id) ?? 0, rank));
    }
  }

  return [...transactions].sort((a, b) => {
    const rankA = severityByTxn.get(a.id) ?? 0;
    const rankB = severityByTxn.get(b.id) ?? 0;
    if (rankA !== rankB) return rankB - rankA;
    return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
  });
}

export function TransactionFeed({
  transactions,
  anomalies,
  scanningId,
}: {
  transactions: Transaction[];
  anomalies: Anomaly[];
  scanningId?: string;
}) {
  const flagged = new Set(anomalies.flatMap((a) => a.transactionIds));
  const sorted = sortByFlagSeverity(transactions, anomalies);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
      {sorted.map((t) => {
        const isFlagged = flagged.has(t.id);
        const isScanning = scanningId === t.id;

        return (
          <article
            key={t.id}
            style={{
              border: "1px solid var(--border)",
              borderLeft: isFlagged ? "3px solid var(--red)" : "3px solid transparent",
              borderRadius: 8,
              padding: "10px 10px 9px",
              background: isScanning ? "var(--blue-bg)" : "var(--bg)",
              boxShadow: isScanning ? "0 0 0 1px color-mix(in srgb, var(--blue) 25%, transparent)" : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SourcePill source={t.source} />
                <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13 }}>{t.merchant}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", fontSize: 12 }}>
                {fmtMoney(t.amount)}
              </span>
            </div>
            <div style={{ marginTop: 7, fontSize: 11, color: "var(--ink-mid)" }}>{t.description}</div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ink-ghost)",
              }}
            >
              <span>{t.date}</span>
              <span>{t.id}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

