import type { TransactionSource } from "@/types";

const LABELS: Record<TransactionSource, string> = {
  bank_csv: "Bank CSV",
  ledger_sheet: "Ledger",
  p2p_screenshot: "P2P",
  receipt_image: "Receipt",
};

const COLORS: Record<TransactionSource, string> = {
  bank_csv: "#2563eb",
  ledger_sheet: "#6b7280",
  p2p_screenshot: "#7c3aed",
  receipt_image: "#16a34a",
};

export function SourcePill({ source }: { source: TransactionSource }) {
  const color = COLORS[source];
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "3px 7px",
        borderRadius: 999,
        border: `1px solid color-mix(in srgb, ${color} 35%, var(--border))`,
        color: color,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      {LABELS[source]}
    </span>
  );
}

