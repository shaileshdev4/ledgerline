import type { MatchProposal, Transaction } from "@/types";
import { generateId } from "../engine/ledgerEngine";
import type { MessageBus } from "./messageBus";

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dateDiffDays(a: string, b: string): number {
  const ms = Math.abs(
    new Date(`${a}T00:00:00Z`).getTime() -
      new Date(`${b}T00:00:00Z`).getTime(),
  );
  return ms / (24 * 60 * 60 * 1000);
}

function scorePair(a: Transaction, b: Transaction): number {
  const amountScore = Math.abs(a.amount - b.amount) < 0.001 ? 0.6 : 0;
  const merchantScore = norm(a.merchant) === norm(b.merchant) ? 0.25 : 0;
  const dateScore = Math.max(0, 0.15 - dateDiffDays(a.date, b.date) * 0.03);
  return Math.max(0, Math.min(1, amountScore + merchantScore + dateScore));
}

export function runMatcherAgent(
  transactions: Transaction[],
  confidenceFloor: number,
  bus: MessageBus,
): MatchProposal[] {
  bus.start("matcher", "Matcher scoring cross-source transaction pairs");

  const proposals: MatchProposal[] = [];
  const used = new Set<string>();

  for (let i = 0; i < transactions.length; i++) {
    const a = transactions[i];
    if (used.has(a.id)) continue;

    for (let j = i + 1; j < transactions.length; j++) {
      const b = transactions[j];
      if (a.source === b.source) continue;
      if (used.has(b.id)) continue;

      const score = scorePair(a, b);
      if (score < confidenceFloor) continue;

      const proposal: MatchProposal = {
        id: generateId("match"),
        transactionIds: [a.id, b.id],
        amount: a.amount,
        confidence: Number(score.toFixed(2)),
        reason: `Matched by amount + merchant similarity (${a.merchant})`,
      };

      proposals.push(proposal);
      used.add(a.id);
      used.add(b.id);
      bus.addTrace(
        "matcher",
        "match_proposed",
        `Proposed ${a.id} <-> ${b.id}`,
        {
          transactionIds: proposal.transactionIds,
          confidence: proposal.confidence,
        },
      );
      bus.addProvenance(
        "matcher",
        "match_pair",
        `Confidence ${proposal.confidence.toFixed(2)} using deterministic amount/merchant/date scoring`,
        proposal.transactionIds,
      );
      break;
    }
  }

  bus.complete("matcher", `Matcher complete (${proposals.length} proposals)`);
  return proposals;
}
