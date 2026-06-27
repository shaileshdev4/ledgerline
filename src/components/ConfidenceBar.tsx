import type { AnomalySeverity } from "@/types";

const SEVERITY_TONE: Record<AnomalySeverity, string> = {
  high: "var(--red)",
  medium: "var(--amber)",
  low: "var(--ink-dim)",
};

export function ConfidenceBar({
  confidence,
  compact = false,
  severity,
}: {
  confidence: number;
  compact?: boolean;
  severity?: AnomalySeverity;
}) {
  const safe = Math.max(0, Math.min(1, confidence));
  const pct = Math.round(safe * 100);
  const tone = severity
    ? SEVERITY_TONE[severity]
    : pct >= 90
      ? "var(--green)"
      : pct >= 75
        ? "var(--amber)"
        : "var(--red)";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minWidth: compact ? 84 : 120,
      }}
    >
      <div
        style={{
          width: compact ? 60 : 86,
          height: 7,
          borderRadius: 999,
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: tone,
            transition: "width 180ms ease",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ink-dim)",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

