"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useRef } from "react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import {
  ReconciliationResult,
  TraceEvent,
  AgentRole,
  Anomaly,
  Transaction,
} from "@/types";
import { Topbar } from "@/components/Topbar";
import { StatusBar, LedgerFooter } from "@/components/StatusBar";
import { TransactionFeed } from "@/components/TransactionFeed";
import { AgentTrace } from "@/components/AgentTrace";
import { AnomalyReport } from "@/components/AnomalyReport";
import type { IngestSummary } from "@/components/DropZone";
import { downloadReconciliationPdf } from "@/lib/export/pdfReport";

const DropZone = dynamic(
  () => import("@/components/DropZone").then((m) => m.DropZone),
  {
    ssr: false,
    loading: () => <div className="audit-loading">Loading upload…</div>,
  },
);

type RunState = "idle" | "running" | "done";
type Phase = "upload" | "workspace";

const PANEL: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

function deriveAgentStatuses(
  trace: TraceEvent[],
): Partial<Record<AgentRole, { status: string; active: boolean }>> {
  const statuses: Partial<
    Record<AgentRole, { status: string; active: boolean }>
  > = {};
  for (const e of trace) {
    if (e.type === "agent_started") {
      statuses[e.agentRole] = { status: "Running", active: true };
    }
    if (e.type === "agent_completed") {
      statuses[e.agentRole] = { status: "Complete", active: false };
    }
    if (e.type === "match_challenged") {
      statuses["skeptic"] = { status: "Challenging", active: true };
      statuses["matcher"] = { status: "Re-scoring", active: true };
    }
    if (e.type === "anomaly_flagged" && e.agentRole === "skeptic") {
      statuses["skeptic"] = { status: "Flagging", active: true };
    }
    if (e.type === "report_ready") {
      statuses["reconciler"] = { status: "Complete", active: false };
    }
  }
  return statuses;
}

async function playTrace(
  full: ReconciliationResult,
  callbacks: {
    onEvent: (event: TraceEvent) => void;
    onAnomaly: (anomaly: Anomaly) => void;
    onScanning: (id: string | undefined) => void;
    shouldAbort: () => boolean;
  },
) {
  const DELAY_BASE = 120;
  const DELAY_ANOMALY = 320;
  const DELAY_CHALLENGE = 400;

  for (const event of full.trace) {
    if (callbacks.shouldAbort()) break;
    if (event.type === "message_sent") continue;

    const delay =
      event.type === "anomaly_flagged"
        ? DELAY_ANOMALY
        : event.type === "match_challenged"
          ? DELAY_CHALLENGE
          : event.type === "match_re_proposed"
            ? DELAY_CHALLENGE
            : DELAY_BASE;

    await new Promise((r) => setTimeout(r, delay));
    if (callbacks.shouldAbort()) break;

    callbacks.onEvent(event);

    if (event.type === "anomaly_flagged" && event.data?.anomalyId) {
      const anomalyId = event.data.anomalyId as string;
      const anomaly = full.anomalies.find((a) => a.id === anomalyId);
      if (anomaly) {
        await new Promise((r) => setTimeout(r, 150));
        callbacks.onAnomaly(anomaly);
      }
    }

    if (event.type === "match_proposed" && event.data?.transactionIds) {
      const ids = event.data.transactionIds as string[];
      callbacks.onScanning(ids[0]);
      await new Promise((r) => setTimeout(r, 300));
      callbacks.onScanning(undefined);
    }
  }
}

function IngestBanner({ summary }: { summary: IngestSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ingest-banner">
      <button
        type="button"
        className="ingest-banner-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ingest-banner-label">Ingested</span>
        <span>
          {summary.totalCount} transactions · {summary.filesProcessed.length}{" "}
          files
        </span>
        {summary.warnings.length > 0 && (
          <span className="ingest-banner-warn">
            {summary.warnings.length} warning
            {summary.warnings.length > 1 ? "s" : ""}
          </span>
        )}
        {open ? <HiChevronUp size={14} /> : <HiChevronDown size={14} />}
      </button>
      {open && (
        <div className="ingest-banner-details">
          {summary.filesProcessed.map((f) => (
            <span key={f.name} className="ingest-file-chip">
              {f.name} ({f.count})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [organizationName, setOrganizationName] = useState("");
  const [period, setPeriod] = useState("");
  const [loadedTransactions, setLoadedTransactions] = useState<Transaction[]>(
    [],
  );
  const [ingestSummary, setIngestSummary] = useState<IngestSummary | null>(
    null,
  );

  const [runState, setRunState] = useState<RunState>("idle");
  const [visibleTrace, setVisibleTrace] = useState<TraceEvent[]>([]);
  const [visibleAnomalies, setVisibleAnomalies] = useState<Anomaly[]>([]);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [scanningId, setScanningId] = useState<string | undefined>(undefined);
  const abortRef = useRef(false);

  const handleIngested = useCallback(
    (transactions: Transaction[], summary: IngestSummary) => {
      setLoadedTransactions(transactions);
      setIngestSummary(summary);
      setPhase("workspace");
      setRunState("idle");
      setVisibleTrace([]);
      setVisibleAnomalies([]);
      setResult(null);
      setScanningId(undefined);
    },
    [],
  );

  const handleNewBooks = useCallback(() => {
    abortRef.current = true;
    setPhase("upload");
    setRunState("idle");
    setVisibleTrace([]);
    setVisibleAnomalies([]);
    setResult(null);
    setLoadedTransactions([]);
    setIngestSummary(null);
  }, []);

  const runReconciliation = useCallback(async () => {
    if (runState === "running" || loadedTransactions.length === 0) return;

    abortRef.current = false;
    setRunState("running");
    setVisibleTrace([]);
    setVisibleAnomalies([]);
    setResult(null);
    setScanningId(undefined);

    try {
      const res = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: loadedTransactions,
          config: { organizationName, period },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const full: ReconciliationResult = data.result;

      await playTrace(full, {
        onEvent: (event) => setVisibleTrace((prev) => [...prev, event]),
        onAnomaly: (anomaly) =>
          setVisibleAnomalies((prev) => {
            if (prev.find((a) => a.id === anomaly.id)) return prev;
            return [...prev, anomaly];
          }),
        onScanning: setScanningId,
        shouldAbort: () => abortRef.current,
      });

      if (!abortRef.current) {
        setResult(full);
        setVisibleAnomalies(full.anomalies);
        setScanningId(undefined);
        setRunState("done");
      }
    } catch (err) {
      console.error("Reconciliation failed:", err);
      setRunState("idle");
    }
  }, [runState, loadedTransactions, organizationName, period]);

  const handleExportPdf = useCallback(() => {
    if (result) downloadReconciliationPdf(result);
  }, [result]);

  const agentStatuses = deriveAgentStatuses(visibleTrace);
  const summary = result?.summary ?? null;
  const ledger = result?.ledger ?? null;
  const transactions = result?.transactions ?? loadedTransactions;

  const panelHeader = (title: string, count?: React.ReactNode) => (
    <div className="panel-header">
      <span>{title}</span>
      {count}
    </div>
  );

  const countBadge = (n: number | string, red = false) => (
    <span className={`count-badge${red ? " count-badge-red" : ""}`}>{n}</span>
  );

  if (phase === "upload") {
    return (
      <div className="audit-shell">
        <Topbar
          org={organizationName}
          period={period}
          runState="idle"
          onRun={() => {}}
          showRun={false}
        />
        <DropZone
          organizationName={organizationName}
          period={period}
          onOrganizationNameChange={setOrganizationName}
          onPeriodChange={setPeriod}
          onIngested={handleIngested}
        />
      </div>
    );
  }

  return (
    <div className="audit-shell audit-shell--workspace">
      <Topbar
        org={organizationName}
        period={period}
        runState={runState}
        onRun={runReconciliation}
        onNewBooks={handleNewBooks}
        onExportPdf={runState === "done" ? handleExportPdf : undefined}
        canRun={loadedTransactions.length > 0}
      />

      {ingestSummary && <IngestBanner summary={ingestSummary} />}

      <StatusBar summary={summary} loading={runState === "running"} />

      <div className="audit-grid">
        <div
          className="audit-panel"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          {panelHeader("Transaction Feed", countBadge(transactions.length))}
          <div className="scroll-panel ledger-grid audit-panel-body">
            <TransactionFeed
              transactions={transactions}
              anomalies={visibleAnomalies}
              scanningId={scanningId}
            />
          </div>
        </div>

        <div
          className="audit-panel"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          {panelHeader("Live Agent Trace")}
          <div className="audit-panel-body">
            <AgentTrace trace={visibleTrace} agentStatuses={agentStatuses} />
          </div>
        </div>

        <div className="audit-panel audit-panel-anomalies">
          {panelHeader(
            "Anomaly Report",
            visibleAnomalies.length > 0
              ? countBadge(
                  (() => {
                    const txnCount = new Set(
                      visibleAnomalies.flatMap((a) => a.transactionIds),
                    ).size;
                    return txnCount > visibleAnomalies.length
                      ? `${visibleAnomalies.length} flags · ${txnCount} txns`
                      : `${visibleAnomalies.length} flags`;
                  })(),
                  true,
                )
              : countBadge("—"),
          )}
          <div className="audit-panel-body">
            <AnomalyReport
              anomalies={visibleAnomalies}
              requiresHumanReview={summary?.requiresHumanReview ?? false}
            />
          </div>
        </div>
      </div>

      <LedgerFooter ledger={ledger} />
    </div>
  );
}
