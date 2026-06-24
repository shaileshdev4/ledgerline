import type { AnomalyType } from "@/types";
import { MOCK_TRANSACTIONS } from "../data/mockDataset";
import { runSwarm } from "./orchestrator";

async function main() {
  const result = await runSwarm(MOCK_TRANSACTIONS);

  const expected: AnomalyType[] = [
    "duplicate_payment",
    "category_mismatch",
    "missing_documentation",
  ];
  const found = new Set(result.anomalies.map((a) => a.type));

  for (const type of expected) {
    if (!found.has(type)) {
      throw new Error(`Swarm missing expected anomaly: ${type}`);
    }
  }

  if (result.anomalies.length !== 3) {
    throw new Error(`Expected exactly 3 anomalies, found ${result.anomalies.length}`);
  }

  if (!result.summary.requiresHumanReview) {
    throw new Error("Expected human review to be required");
  }

  console.log("Swarm test passed");
  console.log(`Transactions: ${result.transactions.length}`);
  console.log(`Anomalies: ${result.anomalies.map((a) => a.type).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

