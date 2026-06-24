import { MOCK_TRANSACTIONS } from '../src/lib/data/mockDataset';
import { Transaction } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(__dirname, '../public/sample-books');

function csvHeader() {
  return 'id,date,amount,merchant,description,category,reference_id';
}

function toCsvRow(t: Transaction) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return [
    t.id,
    t.date,
    t.amount.toFixed(2),
    esc(t.merchant),
    esc(t.description),
    t.category,
    t.referenceId ?? '',
  ].join(',');
}

function bySource(source: Transaction['source']) {
  return MOCK_TRANSACTIONS.filter((t) => t.source === source);
}

fs.mkdirSync(OUT, { recursive: true });

const bank = bySource('bank_csv');
fs.writeFileSync(
  path.join(OUT, 'bank_statement_q1_2026.csv'),
  [csvHeader(), ...bank.map(toCsvRow)].join('\n')
);

const ledger = bySource('ledger_sheet');
fs.writeFileSync(
  path.join(OUT, 'ledger_q1_2026.csv'),
  [csvHeader(), ...ledger.map(toCsvRow)].join('\n')
);

const p2p = bySource('p2p_screenshot');
fs.writeFileSync(
  path.join(OUT, 'p2p_transfers.json'),
  JSON.stringify({ source: 'p2p_screenshot', transactions: p2p }, null, 2)
);

const receipts = bySource('receipt_image');
fs.writeFileSync(
  path.join(OUT, 'receipts.json'),
  JSON.stringify({ source: 'receipt_image', transactions: receipts }, null, 2)
);

fs.writeFileSync(
  path.join(OUT, 'README.txt'),
  `Ledgerline Sample Books — Youth Code Foundation Q1 2026

Drop all four files into Ledgerline, or click "Load sample books" in the app.

Files:
  bank_statement_q1_2026.csv  — Bank checking export
  ledger_q1_2026.csv          — Treasurer spreadsheet
  p2p_transfers.json          — Venmo/Zelle screenshots (structured)
  receipts.json               — Receipt OCR extracts (structured)

Contains 3 planted anomalies for demo reconciliation.
`
);

console.log(`Wrote sample books to ${OUT}`);
