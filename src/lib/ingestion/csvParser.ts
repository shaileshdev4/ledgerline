import { ExpenseCategory, Transaction, TransactionSource } from '@/types';
import { generateId } from '../engine/ledgerEngine';

const VALID_CATEGORIES: ExpenseCategory[] = [
  'program_supplies', 'program_services', 'administrative', 'fundraising',
  'travel', 'technology', 'utilities', 'personnel', 'personal', 'uncategorized',
];

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s-]+/g, '_').replace(/#/g, '');
}

function parseCategory(raw: string | undefined): ExpenseCategory {
  const c = (raw ?? 'uncategorized').toLowerCase().replace(/[\s-]+/g, '_') as ExpenseCategory;
  return VALID_CATEGORIES.includes(c) ? c : 'uncategorized';
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) throw new Error(`Invalid amount: ${raw}`);
  return n;
}

export function parseCsvToTransactions(
  content: string,
  source: TransactionSource
): Transaction[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));

  const col = {
    id: idx(['id', 'transaction_id', 'txn_id']),
    date: idx(['date', 'transaction_date', 'posted_date']),
    amount: idx(['amount', 'debit', 'expense', 'total']),
    merchant: idx(['merchant', 'vendor', 'payee', 'name']),
    description: idx(['description', 'memo', 'notes', 'detail']),
    category: idx(['category', 'account', 'expense_category']),
    reference: idx(['reference_id', 'reference', 'ref', 'check_number', 'invoice']),
  };

  if (col.date < 0 || col.amount < 0 || col.merchant < 0) {
    throw new Error('CSV must include date, amount, and merchant columns');
  }

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.every((c) => !c)) continue;

    const get = (index: number) => (index >= 0 ? cells[index] ?? '' : '');

    const amountRaw = get(col.amount);
    if (!amountRaw) continue;

    const txn: Transaction = {
      id: get(col.id) || generateId('txn'),
      source,
      date: get(col.date),
      amount: parseAmount(amountRaw),
      merchant: get(col.merchant),
      description: get(col.description) || get(col.merchant),
      category: parseCategory(get(col.category)),
      referenceId: get(col.reference) || undefined,
      rawText: lines[i],
    };

    transactions.push(txn);
  }

  return transactions;
}
