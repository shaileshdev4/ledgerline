import { DEFAULT_ENGINE_CONFIG, type AnomalyType } from "@/types";
import { MOCK_TRANSACTIONS } from "../data/mockDataset";
import { detectAnomalies, evaluateLedger } from "./ledgerEngine";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const anomalies = detectAnomalies(MOCK_TRANSACTIONS, DEFAULT_ENGINE_CONFIG);
  const found = new Set(anomalies.map((a) => a.type));
  const expected: AnomalyType[] = [
    "duplicate_payment",
    "category_mismatch",
    "missing_documentation",
  ];

  for (const type of expected) {
    assert(found.has(type), `Missing expected anomaly: ${type}`);
  }
  assert(anomalies.length === 3, `Expected exactly 3 anomalies, got ${anomalies.length}`);

  const ledger = evaluateLedger(MOCK_TRANSACTIONS, [], anomalies);
  assert(ledger.transactionCount === 41, `Expected 41 transactions, got ${ledger.transactionCount}`);
  assert(ledger.flaggedCount === 4, `Expected 4 flagged transactions, got ${ledger.flaggedCount}`);

  console.log("Engine harness passed");
  console.log(`Transactions: ${ledger.transactionCount}`);
  console.log(`Total debits: $${ledger.totalDebits.toFixed(2)}`);
  console.log(`Detected anomalies: ${anomalies.map((a) => a.type).join(", ")}`);
}

main();

