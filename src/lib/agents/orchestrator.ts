import {
  DEFAULT_ENGINE_CONFIG,
  type EngineConfig,
  type ReconciliationResult,
  type Transaction,
} from "@/types";
import { generateId } from "../engine/ledgerEngine";
import { runIngestionAgent } from "./ingestionAgent";
import { runMatcherAgent } from "./matcherAgent";
import { MessageBus } from "./messageBus";
import { runReconcilerAgent } from "./reconcilerAgent";
import { runSkepticAgent } from "./skepticAgent";

export async function runSwarm(
  transactions: Transaction[],
  options?: { config?: EngineConfig },
): Promise<ReconciliationResult> {
  const config = options?.config ?? DEFAULT_ENGINE_CONFIG;
  const bus = new MessageBus();

  const cleaned = runIngestionAgent(transactions, bus);
  const proposals = runMatcherAgent(cleaned, config.matcherConfidenceFloor, bus);
  const skeptical = runSkepticAgent(cleaned, proposals, config, bus);
  const reconciled = runReconcilerAgent(
    cleaned,
    skeptical.acceptedMatches,
    skeptical.anomalies,
    config,
    bus,
  );

  const snapshot = bus.snapshot();
  return {
    id: generateId("report"),
    organizationName: config.organizationName,
    period: config.period,
    generatedAt: new Date().toISOString(),
    transactions: cleaned,
    anomalies: skeptical.anomalies,
    trace: snapshot.trace,
    provenance: snapshot.provenance,
    ledger: reconciled.ledger,
    summary: reconciled.summary,
  };
}

