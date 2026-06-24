import type {
  Anomaly,
  EngineConfig,
  MatchProposal,
  ReconciliationSummary,
  Transaction,
} from "@/types";
import { evaluateLedger } from "../engine/ledgerEngine";
import type { MessageBus } from "./messageBus";

function computeSummary(
  transactions: Transaction[],
  matches: MatchProposal[],
  anomalies: Anomaly[],
): ReconciliationSummary {
  const matched = new Set(matches.flatMap((m) => m.transactionIds)).size;
  const highSeverityCount = anomalies.filter((a) => a.severity === "high").length;
  const confidence = Math.max(0, Math.min(1, 1 - anomalies.length * 0.08));
  const requiresHumanReview = highSeverityCount > 0;

  return {
    totalTransactions: transactions.length,
    matchedTransactions: matched,
    unmatchedTransactions: Math.max(0, transactions.length - matched),
    anomalyCount: anomalies.length,
    highSeverityCount,
    confidence: Number(confidence.toFixed(2)),
    requiresHumanReview,
    reviewReason: requiresHumanReview
      ? "High-severity anomalies require treasurer sign-off."
      : undefined,
  };
}

export function runReconcilerAgent(
  transactions: Transaction[],
  matches: MatchProposal[],
  anomalies: Anomaly[],
  _config: EngineConfig,
  bus: MessageBus,
) {
  bus.start("reconciler", "Reconciler verifying ledger totals in pure code");

  const ledger = evaluateLedger(transactions, matches, anomalies);
  const summary = computeSummary(transactions, matches, anomalies);

  bus.addProvenance(
    "reconciler",
    "verify_ledger_math",
    `Computed deterministic totals on ${ledger.transactionCount} transactions`,
  );
  bus.addTrace("reconciler", "report_ready", "Reconciliation report ready", {
    anomalyCount: anomalies.length,
    matchedCount: ledger.matchedCount,
    totalDebits: ledger.totalDebits,
  });
  bus.complete("reconciler", "Reconciler complete");

  return { ledger, summary };
}

