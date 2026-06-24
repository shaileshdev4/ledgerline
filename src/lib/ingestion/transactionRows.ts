import type { Transaction, TransactionSource } from "@/types";
import { generateId } from "../engine/ledgerEngine";

const VALID_CATEGORIES = new Set([
  "program_supplies",
  "program_services",
  "administrative",
  "fundraising",
  "travel",
  "technology",
  "utilities",
  "personnel",
  "personal",
  "uncategorized",
]);

export function parseTransactionsJson(
  text: string,
): Array<Record<string, unknown>> {
  const clean = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const arrayMatch = clean.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]) as Array<Record<string, unknown>>;
  }

  const objectMatch = clean.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const obj = JSON.parse(objectMatch[0]) as Record<string, unknown>;
    if (Array.isArray(obj.transactions)) {
      return obj.transactions as Array<Record<string, unknown>>;
    }
    if (Array.isArray(obj.items)) {
      return obj.items as Array<Record<string, unknown>>;
    }
  }

  throw new Error("Model did not return valid transaction JSON");
}

export function rowsToTransactions(
  rows: Array<Record<string, unknown>>,
  source: TransactionSource,
  fallbackRawText?: string,
): Transaction[] {
  return rows
    .map((row) => rowToTransaction(row, source, fallbackRawText))
    .filter((txn): txn is Transaction => txn !== null);
}

function rowToTransaction(
  row: Record<string, unknown>,
  source: TransactionSource,
  fallbackRawText?: string,
): Transaction | null {
  const amount = Number(row.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const date = String(row.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const merchant = String(row.merchant ?? "").trim();
  if (!merchant) return null;

  const category = String(row.category ?? "uncategorized");
  const safeCategory = VALID_CATEGORIES.has(category)
    ? (category as Transaction["category"])
    : "uncategorized";

  return {
    id: generateId("txn"),
    source,
    date,
    amount,
    merchant: merchant.slice(0, 80),
    description: String(row.description ?? merchant).slice(0, 200),
    category: safeCategory,
    referenceId: row.referenceId ? String(row.referenceId) : undefined,
    rawText: row.rawText
      ? String(row.rawText)
      : fallbackRawText?.slice(0, 500),
  };
}
