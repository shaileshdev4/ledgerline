import type {
  Anomaly,
  AnomalyType,
  EngineConfig,
  LedgerSnapshot,
  MatchProposal,
  Transaction,
} from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dateDiffDays(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.abs(da - db) / DAY_MS;
}

function makeAnomaly(
  type: AnomalyType,
  severity: Anomaly["severity"],
  confidence: number,
  evidence: string,
  explanation: string,
  recommendedAction: string,
  transactionIds: string[],
): Anomaly {
  return {
    id: generateId("anomaly"),
    type,
    severity,
    confidence,
    evidence,
    explanation,
    recommendedAction,
    transactionIds,
  };
}

export function findDuplicatePayments(
  transactions: Transaction[],
  config: EngineConfig,
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i];
      const b = transactions[j];
      if (a.source === b.source) continue;
      if (Math.abs(a.amount - b.amount) > 0.0001) continue;
      if (norm(a.merchant) !== norm(b.merchant)) continue;
      if (dateDiffDays(a.date, b.date) > config.duplicateWindowDays) continue;

      const key = [a.id, b.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      anomalies.push(
        makeAnomaly(
          "duplicate_payment",
          "high",
          0.94,
          `Two sources report ${a.merchant} at $${a.amount.toFixed(2)} within ${Math.round(
            dateDiffDays(a.date, b.date),
          )} day(s): ${a.id} and ${b.id}.`,
          "Likely duplicate reimbursement or duplicate posting for the same spend.",
          "Verify whether both transactions are legitimate. Reverse or document one duplicate line before filing.",
          [a.id, b.id],
        ),
      );
    }
  }

  return anomalies;
}

export function findCategoryMismatches(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const personalHints = /spotify|netflix|hulu|apple music|personal/i;

  for (const t of transactions) {
    if (!personalHints.test(`${t.merchant} ${t.description}`)) continue;
    if (t.category === "personal") continue;

    anomalies.push(
      makeAnomaly(
        "category_mismatch",
        "medium",
        0.91,
        `${t.merchant} appears personal but is categorized as ${t.category}.`,
        "The spending pattern suggests a personal subscription misfiled as nonprofit expense.",
        "Request clarification and reclassify to personal/non-reimbursable if not mission-critical.",
        [t.id],
      ),
    );
  }

  return anomalies;
}

export function findMissingDocumentation(
  transactions: Transaction[],
  config: EngineConfig,
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const t of transactions) {
    if (t.source !== "ledger_sheet") continue;
    if (t.amount < config.documentationThreshold) continue;

    const hasNeighborEvidence = transactions.some((other) => {
      if (other.id === t.id) return false;
      if (other.source === "ledger_sheet") return false;
      if (Math.abs(other.amount - t.amount) > 0.0001) return false;
      if (dateDiffDays(other.date, t.date) > 5) return false;
      return norm(other.merchant) === norm(t.merchant);
    });

    if (hasNeighborEvidence) continue;

    anomalies.push(
      makeAnomaly(
        "missing_documentation",
        "high",
        0.88,
        `${t.id} is a $${t.amount.toFixed(2)} ledger entry without bank/receipt corroboration.`,
        "A high-value ledger transaction is missing external documentation in uploaded books.",
        "Collect receipt or bank proof. If unavailable, annotate board minutes and mark for manual review.",
        [t.id],
      ),
    );
  }

  return anomalies;
}

export function detectAnomalies(
  transactions: Transaction[],
  config: EngineConfig,
): Anomaly[] {
  const raw = [
    ...findDuplicatePayments(transactions, config),
    ...findCategoryMismatches(transactions),
    ...findMissingDocumentation(transactions, config),
  ];

  // Keep only one anomaly per taxonomy for deterministic demo output.
  const byType = new Map<AnomalyType, Anomaly>();
  for (const anomaly of raw) {
    if (!byType.has(anomaly.type)) {
      byType.set(anomaly.type, anomaly);
    }
  }
  return [...byType.values()];
}

export function evaluateLedger(
  transactions: Transaction[],
  matchProposals: MatchProposal[],
  anomalies: Anomaly[],
): LedgerSnapshot {
  const totalDebits = transactions.reduce((sum, t) => sum + t.amount, 0);
  const matchedCount = new Set(
    matchProposals.flatMap((proposal) => proposal.transactionIds),
  ).size;
  const unmatchedCount = Math.max(0, transactions.length - matchedCount);
  const flaggedTransactionCount = new Set(
    anomalies.flatMap((anomaly) => anomaly.transactionIds),
  ).size;

  return {
    totalDebits: Number(totalDebits.toFixed(2)),
    transactionCount: transactions.length,
    matchedCount,
    unmatchedCount,
    flaggedCount: flaggedTransactionCount,
    computedAt: new Date().toISOString(),
  };
}

