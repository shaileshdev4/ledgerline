"use client";

import { useState } from "react";
import { HiExclamationTriangle, HiSparkles } from "react-icons/hi2";
import type { Anomaly } from "@/types";
import { ConfidenceBar } from "./ConfidenceBar";

type ExplanationMap = Record<string, string>;

export function AnomalyReport({
  anomalies,
  requiresHumanReview,
}: {
  anomalies: Anomaly[];
  requiresHumanReview: boolean;
}) {
  const [explanations, setExplanations] = useState<ExplanationMap>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const askForBoardText = async (anomaly: Anomaly) => {
    setLoadingId(anomaly.id);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anomaly }),
      });
      const data = await res.json();
      if (data.success && typeof data.explanation === "string") {
        setExplanations((prev) => ({ ...prev, [anomaly.id]: data.explanation }));
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (anomalies.length === 0) {
    return (
      <div className="scroll-panel" style={{ padding: 14 }}>
        <p style={{ color: "var(--ink-ghost)", fontSize: 12 }}>
          No high-severity anomalies surfaced yet.
        </p>
      </div>
    );
  }

  return (
    <div className="scroll-panel anomaly-scroll" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      {requiresHumanReview && (
        <div
          style={{
            border: "1px solid color-mix(in srgb, var(--red) 45%, var(--border))",
            background: "color-mix(in srgb, var(--red) 10%, var(--bg))",
            borderRadius: 8,
            padding: "9px 10px",
            color: "var(--red)",
            fontSize: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <HiExclamationTriangle size={14} />
          Human review required before filing.
        </div>
      )}

      {anomalies.map((a) => (
        <article
          key={a.id}
          style={{
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--red)",
            borderRadius: 8,
            padding: "10px 10px 9px",
            background: "var(--bg)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong style={{ fontSize: 13, color: "var(--ink)" }}>
              {a.type.replace(/_/g, " ")}
            </strong>
            <ConfidenceBar confidence={a.confidence} compact />
          </div>
          <p style={{ marginTop: 7, marginBottom: 0, color: "var(--ink-mid)", fontSize: 12 }}>
            {a.explanation}
          </p>
          <p style={{ marginTop: 7, marginBottom: 0, color: "var(--ink-ghost)", fontSize: 11 }}>
            Evidence: {a.evidence}
          </p>
          <p style={{ marginTop: 5, marginBottom: 0, color: "var(--ink-mid)", fontSize: 11 }}>
            Action: {a.recommendedAction}
          </p>
          <div style={{ marginTop: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-ghost)" }}>
              {a.transactionIds.join(", ")}
            </span>
            <button
              type="button"
              onClick={() => askForBoardText(a)}
              disabled={loadingId === a.id}
              className="topbar-ghost-btn"
              style={{ padding: "4px 8px", fontSize: 10 }}
            >
              <HiSparkles size={12} />
              {loadingId === a.id ? "Generating..." : "Board text"}
            </button>
          </div>
          {explanations[a.id] && (
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                padding: "7px 8px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-mid)",
                fontSize: 11,
                color: "var(--ink-mid)",
              }}
            >
              {explanations[a.id]}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

