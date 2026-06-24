import type { Transaction, TransactionSource } from "@/types";
import {
  hasTextStructurer,
  structureOcrTextToRows,
} from "./llmTextStructurer";
import {
  parseTextFileToTransactions,
  parseRawTextToTransaction,
} from "./receiptTextParser";
import { rowsToTransactions } from "./transactionRows";

export type OcrTextExtractionMethod =
  | "heuristic"
  | "text_llm"
  | "puter_llm";

export async function extractFromOcrText(
  rawText: string,
  source: TransactionSource,
  filename: string,
  options?: { ocrProvider?: "puter" },
): Promise<{
  transactions: Transaction[];
  method: OcrTextExtractionMethod;
}> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("OCR returned no text");
  }

  if (hasTextStructurer()) {
    try {
      const rows = await structureOcrTextToRows(trimmed, source, filename);
      const transactions = rowsToTransactions(rows, source, trimmed);
      if (transactions.length > 0) {
        return {
          transactions,
          method: options?.ocrProvider === "puter" ? "puter_llm" : "text_llm",
        };
      }
    } catch {
      // Fall through to heuristics below.
    }
  }

  const heuristicBatch = parseTextFileToTransactions(trimmed, source, filename);
  if (heuristicBatch.length > 0) {
    return { transactions: heuristicBatch, method: "heuristic" };
  }

  const single = parseRawTextToTransaction(trimmed, source, filename);
  if (single) {
    return { transactions: [single], method: "heuristic" };
  }

  throw new Error(
    hasTextStructurer()
      ? "Could not structure OCR text into transactions"
      : "Could not parse OCR text (set GROQ_API_KEY for AI structuring)",
  );
}
