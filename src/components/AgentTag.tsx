import type { AgentRole } from "@/types";

const COLORS: Record<AgentRole, string> = {
  ingestion: "var(--ing)",
  matcher: "var(--mat)",
  skeptic: "var(--sk)",
  reconciler: "var(--rec)",
};

export function AgentTag({ role }: { role: AgentRole }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--ink-dim)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: COLORS[role],
          boxShadow: `0 0 0 3px color-mix(in srgb, ${COLORS[role]} 20%, transparent)`,
        }}
      />
      {role}
    </span>
  );
}

