import { ExpenseCategory, Transaction, TransactionSource } from '@/types';
import { generateId } from '../engine/ledgerEngine';

const VALID_CATEGORIES: ExpenseCategory[] = [
  'program_supplies', 'program_services', 'administrative', 'fundraising',
  'travel', 'technology', 'utilities', 'personnel', 'personal', 'uncategorized',
];

function parseCategory(raw: unknown): ExpenseCategory {
  const c = String(raw ?? 'uncategorized').toLowerCase().replace(/[\s-]+/g, '_') as ExpenseCategory;
  return VALID_CATEGORIES.includes(c) ? c : 'uncategorized';
}

function normalizeTransaction(raw: Record<string, unknown>, defaultSource: TransactionSource): Transaction {
  const amount = typeof raw.amount === 'number' ? raw.amount : parseFloat(String(raw.amount ?? '0'));
  if (Number.isNaN(amount)) throw new Error('Invalid amount in JSON transaction');

  return {
    id: String(raw.id ?? generateId('txn')),
    source: (raw.source as TransactionSource) ?? defaultSource,
    date: String(raw.date ?? ''),
    amount,
    merchant: String(raw.merchant ?? 'Unknown'),
    description: String(raw.description ?? raw.merchant ?? ''),
    category: parseCategory(raw.category),
    referenceId: raw.referenceId ? String(raw.referenceId) : undefined,
    rawText: raw.rawText ? String(raw.rawText) : undefined,
    _plantedAnomaly: raw._plantedAnomaly as Transaction['_plantedAnomaly'],
  };
}

export function parseJsonToTransactions(content: string, defaultSource: TransactionSource): Transaction[] {
  const parsed = JSON.parse(content) as unknown;

  if (Array.isArray(parsed)) {
    return parsed.map((row) => normalizeTransaction(row as Record<string, unknown>, defaultSource));
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const source = (obj.source as TransactionSource) ?? defaultSource;
    const rows = obj.transactions;
    if (!Array.isArray(rows)) {
      throw new Error('JSON must be an array of transactions or { transactions: [...] }');
    }
    return rows.map((row) => normalizeTransaction(row as Record<string, unknown>, source));
  }

  throw new Error('Unrecognized JSON format');
}
