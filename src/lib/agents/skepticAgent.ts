import type { Anomaly, EngineConfig, MatchProposal, Transaction } from "@/types";
import { detectAnomalies } from "../engine/ledgerEngine";
import type { MessageBus } from "./messageBus";

export interface SkepticOutcome {
  acceptedMatches: MatchProposal[];
  anomalies: Anomaly[];
}

export function runSkepticAgent(
  transactions: Transaction[],
  matchProposals: MatchProposal[],
  config: EngineConfig,
  bus: MessageBus,
): SkepticOutcome {
  bus.start("skeptic", "Skeptic challenging weak matches and taxonomy checks");

  const acceptedMatches: MatchProposal[] = [];
  for (const proposal of matchProposals) {
    if (proposal.confidence < 0.75) {
      bus.addTrace(
        "skeptic",
        "match_challenged",
        `Challenged low-confidence proposal ${proposal.id}`,
        {
          transactionIds: proposal.transactionIds,
          confidence: proposal.confidence,
        },
      );
      bus.addTrace("matcher", "match_re_proposed", `Dropped ${proposal.id} after skeptic challenge`, {
        transactionIds: proposal.transactionIds,
      });
      bus.addProvenance(
        "skeptic",
        "reject_match",
        `Rejected pair below challenge threshold (${proposal.confidence.toFixed(2)})`,
        proposal.transactionIds,
      );
      continue;
    }
    acceptedMatches.push(proposal);
  }

  const anomalies = detectAnomalies(transactions, config);
  for (const anomaly of anomalies) {
    bus.addTrace(
      "skeptic",
      "anomaly_flagged",
      `Flagged ${anomaly.type.replace(/_/g, " ")}`,
      { anomalyId: anomaly.id, transactionIds: anomaly.transactionIds },
    );
    bus.addProvenance(
      "skeptic",
      "flag_anomaly",
      anomaly.evidence,
      anomaly.transactionIds,
    );
  }

  bus.complete("skeptic", `Skeptic complete (${anomalies.length} anomalies)`);
  return { acceptedMatches, anomalies };
}

