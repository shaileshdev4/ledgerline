import { jsPDF } from 'jspdf';
import { ReconciliationResult } from '@/types';
import { format } from 'date-fns';

const MARGIN = 18;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function downloadReconciliationPdf(result: ReconciliationResult): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const setTitle = (text: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 23, 20);
    doc.text(text, MARGIN, y);
    y += 8;
  };

  const setSub = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(122, 116, 108);
    doc.text(text, MARGIN, y);
    y += 6;
  };

  const setSection = (text: string) => {
    if (y > 265) { doc.addPage(); y = MARGIN; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 23, 20);
    doc.text(text, MARGIN, y);
    y += 7;
  };

  const setBody = (text: string) => {
    if (y > 270) { doc.addPage(); y = MARGIN; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(61, 58, 54);
    y = addWrappedText(doc, text, MARGIN, y, CONTENT_W);
    y += 3;
  };

  // Cover
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(26, 23, 20);
  doc.text('Ledgerline', MARGIN, y);
  y += 10;

  setTitle('Reconciliation Report');
  setSub(`${result.organizationName} · ${result.period}`);
  setSub(`Generated ${format(result.generatedAt, 'MMMM d, yyyy h:mm a')}`);
  setSub(`Report ID: ${result.id}`);
  y += 4;

  // Summary
  setSection('Executive Summary');
  const s = result.summary;
  setBody(
    `Transactions: ${s.totalTransactions} · Matched: ${s.matchedTransactions} · ` +
    `Unmatched: ${s.unmatchedTransactions} · Anomalies: ${s.anomalyCount} ` +
    `(${s.highSeverityCount} high severity) · Swarm confidence: ${Math.round(s.confidence * 100)}%`
  );
  setBody(
    s.requiresHumanReview
      ? `⚠ ${s.reviewReason ?? 'Human review required before filing.'}`
      : 'No blocking issues detected. Books reconcile with verified ledger math.'
  );

  // Ledger verification
  setSection('Ledger Verification (Deterministic)');
  const l = result.ledger;
  setBody(
    `Total expenses: $${l.totalDebits.toFixed(2)} · Transactions counted: ${l.transactionCount} · ` +
    `Matched: ${l.matchedCount} · Unmatched: ${l.unmatchedCount} · Flagged: ${l.flaggedCount} · ` +
    `Verified at runtime: ${format(l.computedAt, 'h:mm:ss a')}`
  );

  // Anomalies
  setSection(`Anomaly Report (${result.anomalies.length})`);
  if (result.anomalies.length === 0) {
    setBody('No anomalies flagged.');
  } else {
    for (const a of result.anomalies) {
      if (y > 250) { doc.addPage(); y = MARGIN; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(192, 57, 43);
      doc.text(`${a.type.replace(/_/g, ' ').toUpperCase()} — ${Math.round(a.confidence * 100)}% confidence`, MARGIN, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(61, 58, 54);
      y = addWrappedText(doc, a.explanation, MARGIN, y, CONTENT_W);
      y = addWrappedText(doc, `Action: ${a.recommendedAction}`, MARGIN, y, CONTENT_W);
      y = addWrappedText(doc, `Transactions: ${a.transactionIds.join(', ')}`, MARGIN, y, CONTENT_W);
      y += 4;
    }
  }

  // Provenance trail
  setSection(`Provenance Trail (${result.provenance.length} records)`);
  const provenanceSlice = result.provenance.slice(0, 40);
  for (const p of provenanceSlice) {
    if (y > 275) { doc.addPage(); y = MARGIN; }
    setBody(
      `[${format(p.timestamp, 'HH:mm:ss')}] ${p.agentRole} · ${p.action}: ${p.reason}`
    );
  }
  if (result.provenance.length > 40) {
    setBody(`… and ${result.provenance.length - 40} additional provenance records.`);
  }

  // Footer on last page
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(122, 116, 108);
  doc.text(
    'AI proposes — code verifies. Ledger math recomputed deterministically at report generation.',
    MARGIN,
    290
  );

  const filename = `ledgerline-${result.organizationName.replace(/\s+/g, '-').toLowerCase()}-${result.period.replace(/\s+/g, '-')}.pdf`;
  doc.save(filename);
}
