import { SourcePill } from "./SourcePill";
import type { Anomaly, Transaction } from "@/types";

function fmtMoney(value: number): string {
  return `$${value.toFixed(2)}`;
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
      {transactions.map((t) => {
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

