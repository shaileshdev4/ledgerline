import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "./Logo";

export function BrandMark({
  size = 28,
  showTagline = true,
  href = "/",
  style,
}: {
  size?: number;
  showTagline?: boolean;
  href?: string | null;
  style?: CSSProperties;
}) {
  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "var(--font-mono)",
        fontSize: size >= 36 ? 18 : 15,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        ...style,
      }}
    >
      <Logo size={size} style={{ flexShrink: 0 }} />
      <span style={{ color: "var(--ink)" }}>Ledgerline</span>
      {showTagline && (
        <span style={{ color: "var(--ink-ghost)", fontSize: size >= 36 ? 14 : 12 }}>
          / audit
        </span>
      )}
    </div>
  );

  if (href == null) return inner;

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      {inner}
    </Link>
  );
}
