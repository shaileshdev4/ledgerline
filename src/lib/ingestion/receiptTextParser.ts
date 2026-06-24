import { ExpenseCategory, Transaction, TransactionSource } from '@/types';
import { generateId } from '../engine/ledgerEngine';

function guessCategory(merchant: string, text: string): ExpenseCategory {
  const blob = `${merchant} ${text}`.toLowerCase();
  if (/spotify|netflix|hulu|personal/.test(blob)) return 'personal';
  if (/airline|united|delta|travel|hotel|westview/.test(blob)) return 'travel';
  if (/aws|zoom|software|tech/.test(blob)) return 'technology';
  if (/eventbrite|donor|fundraising/.test(blob)) return 'fundraising';
  if (/fedex|usps|admin|office/.test(blob)) return 'administrative';
  if (/venue|workshop|program/.test(blob)) return 'program_services';
  return 'program_supplies';
}

/** Heuristic parser for raw OCR / P2P screenshot text when no vision API is available. */
export function parseRawTextToTransaction(
  text: string,
  source: TransactionSource,
  filename?: string
): Transaction | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Amount — $XX.XX or "TOTAL $XX.XX" or "paid ... $XX.XX"
  const amountMatch =
    trimmed.match(/\$\s*([\d,]+\.\d{2})/i) ??
    trimmed.match(/(?:paid|payment|total|amount)[:\s]*\$?\s*([\d,]+\.\d{2})/i);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

  // Date — MM/DD/YYYY or YYYY-MM-DD
  const dateMatch =
    trimmed.match(/(\d{4}-\d{2}-\d{2})/) ??
    trimmed.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  let date = dateMatch?.[1] ?? new Date().toISOString().split('T')[0];
  if (date.includes('/')) {
    const [m, d, y] = date.split('/');
    date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Merchant — first ALL CAPS token sequence or known brand
  const merchantMatch =
    trimmed.match(/^([A-Z][A-Z0-9\s&'.-]{2,40}?)(?:\s+#|\s+STORE|\s+RECEIPT|\s+\d{2}\/)/m) ??
    trimmed.match(/(?:paid @[\w-]+\s+\$[\d.]+ for\s+")([^"]+)"/i) ??
    trimmed.match(/(?:Memo:\s*)([^$\n]{3,40})/i);
  const merchant = (merchantMatch?.[1] ?? filename?.replace(/\.[^.]+$/, '') ?? 'Unknown Vendor')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 60);

  return {
    id: generateId('txn'),
    source,
    date,
    amount,
    merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
    description: trimmed.slice(0, 120),
    category: guessCategory(merchant, trimmed),
    rawText: trimmed,
  };
}

export function parseTextFileToTransactions(
  content: string,
  source: TransactionSource,
  filename?: string
): Transaction[] {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const results: Transaction[] = [];

  for (const block of blocks) {
    const txn = parseRawTextToTransaction(block, source, filename);
    if (txn) results.push(txn);
  }

  if (results.length === 0) {
    const single = parseRawTextToTransaction(content, source, filename);
    if (single) results.push(single);
  }

  return results;
}
