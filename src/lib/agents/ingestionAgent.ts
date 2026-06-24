import type { Transaction } from "@/types";
import type { MessageBus } from "./messageBus";

export function runIngestionAgent(
  transactions: Transaction[],
  bus: MessageBus,
): Transaction[] {
  bus.start("ingestion", "Ingestion agent parsing unified transaction stream");

  const cleaned = transactions
    .map((t) => ({
      ...t,
      merchant: t.merchant.trim(),
      description: t.description.trim(),
      date: t.date.slice(0, 10),
    }))
    .filter((t) => t.amount > 0 && t.merchant.length > 0 && t.date.length === 10);

  const sourceCounts = cleaned.reduce<Record<string, number>>((acc, t) => {
    acc[t.source] = (acc[t.source] ?? 0) + 1;
    return acc;
  }, {});

  bus.addTrace("ingestion", "message_sent", "Broadcasting normalized transactions", {
    transactionCount: cleaned.length,
    sourceCounts,
  });
  bus.addProvenance(
    "ingestion",
    "normalize_transactions",
    "Trimmed and validated parsed records before matching",
  );
  bus.complete("ingestion", `Ingestion complete (${cleaned.length} transactions)`);

  return cleaned;
}

