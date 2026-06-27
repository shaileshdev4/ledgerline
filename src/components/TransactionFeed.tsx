import { SourcePill } from "./SourcePill";
import type { Anomaly, AnomalySeverity, AnomalyType, Transaction } from "@/types";

function fmtMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

const SEVERITY_RANK: Record<AnomalySeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const ANOMALY_TYPE_LABEL: Record<AnomalyType, string> = {
  duplicate_payment: "Duplicate payment",
  category_mismatch: "Category mismatch",
  missing_documentation: "Missing documentation",
};

const SEVERITY_STYLE: Record<
  AnomalySeverity,
  { border: string; background: string; color: string }
> = {
  high: {
    border: "var(--red)",
    background: "color-mix(in srgb, var(--red) 10%, var(--bg))",
    color: "var(--red)",
  },
  medium: {
    border: "var(--amber)",
    background: "color-mix(in srgb, var(--amber) 10%, var(--bg))",
    color: "var(--amber)",
  },
  low: {
    border: "var(--ink-dim)",
    background: "color-mix(in srgb, var(--ink-dim) 8%, var(--bg))",
    color: "var(--ink-dim)",
  },
};

function buildTxnAnomalyMeta(anomalies: Anomaly[]): {
  severityByTxn: Map<string, AnomalySeverity>;
  typesByTxn: Map<string, AnomalyType[]>;
} {
  const severityByTxn = new Map<string, AnomalySeverity>();
  const typesByTxn = new Map<string, Set<AnomalyType>>();

  for (const anomaly of anomalies) {
    for (const id of anomaly.transactionIds) {
      const current = severityByTxn.get(id);
      if (!current || SEVERITY_RANK[anomaly.severity] > SEVERITY_RANK[current]) {
        severityByTxn.set(id, anomaly.severity);
      }
      if (!typesByTxn.has(id)) typesByTxn.set(id, new Set());
      typesByTxn.get(id)!.add(anomaly.type);
    }
  }

  return {
    severityByTxn,
    typesByTxn: new Map(
      [...typesByTxn.entries()].map(([id, types]) => [id, [...types]]),
    ),
  };
}

function sortByFlagSeverity(
  transactions: Transaction[],
  severityByTxn: Map<string, AnomalySeverity>,
): Transaction[] {
  const originalIndex = new Map(transactions.map((t, i) => [t.id, i]));

  return [...transactions].sort((a, b) => {
    const rankA = severityByTxn.has(a.id) ? SEVERITY_RANK[severityByTxn.get(a.id)!] : 0;
    const rankB = severityByTxn.has(b.id) ? SEVERITY_RANK[severityByTxn.get(b.id)!] : 0;
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
  const { severityByTxn, typesByTxn } = buildTxnAnomalyMeta(anomalies);
  const sorted = sortByFlagSeverity(transactions, severityByTxn);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
      {sorted.map((t) => {
        const severity = severityByTxn.get(t.id);
        const anomalyTypes = typesByTxn.get(t.id) ?? [];
        const isFlagged = anomalyTypes.length > 0;
        const isScanning = scanningId === t.id;
        const severityStyle = severity ? SEVERITY_STYLE[severity] : null;

        return (
          <article
            key={t.id}
            style={{
              border: "1px solid var(--border)",
              borderLeft: isFlagged
                ? `3px solid ${severityStyle!.border}`
                : "3px solid transparent",
              borderRadius: 8,
              padding: "10px 10px 9px",
              background: isScanning
                ? "var(--blue-bg)"
                : isFlagged
                  ? severityStyle!.background
                  : "var(--bg)",
              boxShadow: isScanning
                ? "0 0 0 1px color-mix(in srgb, var(--blue) 25%, transparent)"
                : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 6,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <SourcePill source={t.source} />
                <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13 }}>{t.merchant}</span>
                {anomalyTypes.map((type) => (
                  <span
                    key={type}
                    style={{
                      flexShrink: 0,
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      color: severityStyle!.color,
                      border: `1px solid color-mix(in srgb, ${severityStyle!.border} 40%, var(--border))`,
                      background: "color-mix(in srgb, var(--bg) 75%, transparent)",
                      borderRadius: 4,
                      padding: "2px 6px",
                    }}
                  >
                    {ANOMALY_TYPE_LABEL[type]}
                  </span>
                ))}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink)",
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
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
