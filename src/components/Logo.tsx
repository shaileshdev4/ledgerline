import type { CSSProperties } from "react";

interface LogoProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Ledgerline mark — diagonal rule + three ledger lines (center line in red). */
export function Logo({ size = 28, className, style }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden
    >
      <rect
        x="0.75"
        y="0.75"
        width="26.5"
        height="26.5"
        rx="5"
        fill="#FAF7F2"
        stroke="rgba(0,0,0,0.13)"
        strokeWidth="1.5"
      />
      <line
        x1="14"
        y1="-2"
        x2="14"
        y2="30"
        stroke="rgba(0,0,0,0.13)"
        strokeWidth="1"
        transform="rotate(18 14 14)"
      />
      <rect x="7" y="9" width="14" height="1.5" rx="0.75" fill="#B0A89E" />
      <rect x="9.5" y="13.25" width="9" height="1.5" rx="0.75" fill="#C0392B" />
      <rect x="7" y="17.5" width="14" height="1.5" rx="0.75" fill="#B0A89E" />
    </svg>
  );
}
