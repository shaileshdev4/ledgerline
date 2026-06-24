import { TransactionSource } from '@/types';

export type ClassifiedFile = {
  source: TransactionSource;
  method: 'csv' | 'json' | 'ocr' | 'text';
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic)$/i;
const P2P_HINTS = /p2p|venmo|zelle|cashapp|cash.?app|paypal/i;
const BANK_HINTS = /bank|statement|checking|ach/i;
const RECEIPT_HINTS = /receipt|invoice|scan/i;
const LEDGER_HINTS = /ledger|sheet|accounting|chart/i;

export function classifyFile(filename: string, mimeType: string): ClassifiedFile | null {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.json')) {
    if (P2P_HINTS.test(lower)) return { source: 'p2p_screenshot', method: 'json' };
    if (RECEIPT_HINTS.test(lower)) return { source: 'receipt_image', method: 'json' };
    return { source: 'ledger_sheet', method: 'json' };
  }

  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) {
    if (BANK_HINTS.test(lower)) return { source: 'bank_csv', method: 'csv' };
    if (LEDGER_HINTS.test(lower)) return { source: 'ledger_sheet', method: 'csv' };
    // Default CSV to bank statement unless named like a ledger
    return { source: BANK_HINTS.test(lower) ? 'bank_csv' : 'ledger_sheet', method: 'csv' };
  }

  if (lower.endsWith('.txt')) {
    if (P2P_HINTS.test(lower)) return { source: 'p2p_screenshot', method: 'text' };
    if (RECEIPT_HINTS.test(lower) || lower.includes('ocr')) {
      return { source: 'receipt_image', method: 'text' };
    }
    return { source: 'receipt_image', method: 'text' };
  }

  if (mimeType.startsWith('image/') || IMAGE_EXT.test(lower) || lower.endsWith('.pdf')) {
    if (P2P_HINTS.test(lower)) return { source: 'p2p_screenshot', method: 'ocr' };
    return { source: 'receipt_image', method: 'ocr' };
  }

  return null;
}
