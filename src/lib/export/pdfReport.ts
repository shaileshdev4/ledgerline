import { jsPDF } from "jspdf";
import type {
  Anomaly,
  AnomalySeverity,
  ReconciliationResult,
  Transaction,
} from "@/types";
import { format } from "date-fns";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 287;

const C = {
  ink: [31, 26, 23] as const,
  inkMid: [74, 67, 61] as const,
  inkGhost: [157, 148, 138] as const,
  bg: [250, 247, 242] as const,
  border: [220, 212, 200] as const,
  red: [192, 57, 43] as const,
  amber: [194, 120, 3] as const,
  green: [21, 128, 61] as const,
  teal: [15, 118, 110] as const,
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildPdfFilename(result: ReconciliationResult): string {
  const org = slugify(result.organizationName);
  const period = slugify(result.period);
  const reportId = result.id.replace(/^report_/, "").slice(0, 8);

  if (org && period) return `${org}-reconciliation-${period}.pdf`;
  if (org) return `${org}-reconciliation-report.pdf`;
  if (period) return `reconciliation-${period}.pdf`;
  return `reconciliation-report-${reportId}.pdf`;
}

function fmtMoney(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function severityColor(
  severity: AnomalySeverity,
): readonly [number, number, number] {
  if (severity === "high") return C.red;
  if (severity === "medium") return C.amber;
  return C.inkGhost;
}

function wrapText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 4.8,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function drawPageChrome(
  doc: jsPDF,
  org: string,
  period: string,
  pageNum: number,
): void {
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 14, PAGE_W - MARGIN, 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.teal);
  doc.text("LEDGERLINE", MARGIN, 9);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.inkGhost);
  doc.text(`${org} · ${period}`, PAGE_W - MARGIN, 9, { align: "right" });

  doc.setDrawColor(...C.border);
  doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...C.inkGhost);
  doc.text(
    "AI proposes - code verifies. Ledger math recomputed deterministically.",
    MARGIN,
    FOOTER_Y,
  );
  doc.setFont("helvetica", "normal");
  doc.text(`Page ${pageNum}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
}

export function downloadReconciliationPdf(result: ReconciliationResult): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 22;
  let pageNum = 1;

  const flaggedIds = new Set(result.anomalies.flatMap((a) => a.transactionIds));

  const ensureSpace = (needed: number) => {
    if (y + needed > FOOTER_Y - 8) {
      drawPageChrome(doc, result.organizationName, result.period, pageNum);
      doc.addPage();
      pageNum += 1;
      y = 22;
    }
  };

  const sectionTitle = (text: string) => {
    ensureSpace(14);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...C.ink);
    doc.text(text, MARGIN, y);
    y += 3;
    doc.setDrawColor(...C.border);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 8;
  };

  const bodyText = (text: string, indent = 0) => {
    ensureSpace(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...C.inkMid);
    y = wrapText(doc, text, MARGIN + indent, y, CONTENT_W - indent, 4.8);
    y += 6;
  };

  const drawStatBox = (
    x: number,
    label: string,
    value: string,
    accent: readonly [number, number, number],
  ) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...C.border);
    doc.roundedRect(x, y, 41, 20, 2, 2, "FD");
    doc.setFillColor(...accent);
    doc.rect(x, y, 41, 2.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.inkGhost);
    doc.text(label.toUpperCase(), x + 4, y + 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...C.ink);
    doc.text(value, x + 4, y + 16);
  };

  const drawAnomalyCard = (anomaly: Anomaly) => {
    const pad = 6;
    const innerW = CONTENT_W - pad * 2 - 3;
    const lineH = 4.8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const bodyLines = doc.splitTextToSize(
      anomaly.explanation,
      innerW,
    ) as string[];
    const actionLines = doc.splitTextToSize(
      `Action: ${anomaly.recommendedAction}`,
      innerW,
    ) as string[];
    const evidenceLines = doc.splitTextToSize(
      `Evidence: ${anomaly.evidence}`,
      innerW,
    ) as string[];
    const cardH =
      26 +
      bodyLines.length * lineH +
      actionLines.length * lineH +
      evidenceLines.length * lineH;

    ensureSpace(cardH + 8);
    const top = y;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...C.border);
    doc.roundedRect(MARGIN, top, CONTENT_W, cardH, 2, 2, "FD");

    const accent = severityColor(anomaly.severity);
    doc.setFillColor(...accent);
    doc.roundedRect(MARGIN, top, 2.5, cardH, 1, 1, "F");

    let cy = top + pad + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...accent);
    doc.text(
      anomaly.type.replace(/_/g, " ").toUpperCase(),
      MARGIN + pad + 3,
      cy,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.inkGhost);
    doc.text(
      `${anomaly.severity.toUpperCase()} · ${Math.round(anomaly.confidence * 100)}% confidence`,
      PAGE_W - MARGIN - pad,
      cy,
      { align: "right" },
    );

    cy += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...C.inkMid);
    doc.text(bodyLines, MARGIN + pad + 3, cy);
    cy += bodyLines.length * lineH + 2;
    doc.text(actionLines, MARGIN + pad + 3, cy);
    cy += actionLines.length * lineH + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.inkGhost);
    doc.text(evidenceLines, MARGIN + pad + 3, cy);
    cy += evidenceLines.length * lineH + 2;
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    doc.text(`IDs: ${anomaly.transactionIds.join(", ")}`, MARGIN + pad + 3, cy);

    y = top + cardH + 8;
  };

  const drawTxnRow = (t: Transaction, shaded: boolean) => {
    const rowH = 8;
    ensureSpace(rowH + 2);
    if (shaded) {
      doc.setFillColor(252, 249, 245);
      doc.rect(MARGIN, y - 4.5, CONTENT_W, rowH, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.ink);
    doc.text(t.date, MARGIN + 1, y);
    doc.text(t.merchant.slice(0, 22), MARGIN + 24, y);
    doc.text(t.source.replace(/_/g, " "), MARGIN + 78, y);
    doc.text(fmtMoney(t.amount), MARGIN + 118, y);
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.inkGhost);
    doc.text(t.id, MARGIN + 142, y);
    y += rowH;
  };

  // ── Cover block ──
  doc.setFillColor(...C.teal);
  doc.rect(0, 0, PAGE_W, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...C.ink);
  doc.text("Reconciliation Report", MARGIN, y);
  y += 11;

  if (result.organizationName.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...C.ink);
    doc.text(result.organizationName.trim(), MARGIN, y);
    y += 8;
  }

  if (result.period.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...C.inkMid);
    doc.text(result.period.trim(), MARGIN, y);
    y += 8;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.inkGhost);
  doc.text(
    `Generated ${format(result.generatedAt, "MMMM d, yyyy 'at' h:mm a")}`,
    MARGIN,
    y,
  );
  y += 6;
  doc.text(`Report ID: ${result.id}`, MARGIN, y);
  y += 10;

  const s = result.summary;
  const statusLabel = s.requiresHumanReview
    ? "REVIEW REQUIRED"
    : "READY TO FILE";
  const statusColor: [number, number, number] = s.requiresHumanReview
    ? [C.red[0], C.red[1], C.red[2]]
    : [C.green[0], C.green[1], C.green[2]];
  doc.setFillColor(...statusColor);
  doc.roundedRect(MARGIN, y, 38, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel, MARGIN + 3, y + 4.8);
  y += 14;

  // ── KPI row ──
  drawStatBox(MARGIN, "Transactions", String(s.totalTransactions), C.teal);
  drawStatBox(MARGIN + 44, "Matched", String(s.matchedTransactions), C.green);
  drawStatBox(MARGIN + 88, "Anomalies", String(s.anomalyCount), C.red);
  drawStatBox(
    MARGIN + 132,
    "Confidence",
    `${Math.round(s.confidence * 100)}%`,
    C.amber,
  );
  y += 28;

  bodyText(
    s.requiresHumanReview
      ? (s.reviewReason ?? "Human review required before filing.")
      : "No blocking issues detected. Books reconcile with verified ledger math.",
  );

  // ── Ledger verification ──
  sectionTitle("Ledger Verification (Deterministic)");
  const l = result.ledger;
  bodyText(
    `Total expenses ${fmtMoney(l.totalDebits)} across ${l.transactionCount} transactions. ` +
      `Matched ${l.matchedCount}, unmatched ${l.unmatchedCount}, flagged ${l.flaggedCount}. ` +
      `Verified at ${format(l.computedAt, "h:mm:ss a")}.`,
  );

  // ── Anomalies ──
  sectionTitle(`Anomaly Report (${result.anomalies.length})`);
  if (result.anomalies.length === 0) {
    bodyText("No anomalies flagged.");
  } else {
    for (const anomaly of result.anomalies) {
      drawAnomalyCard(anomaly);
    }
  }

  // ── Flagged transactions appendix ──
  const flaggedTxns = result.transactions.filter((t) => flaggedIds.has(t.id));
  if (flaggedTxns.length > 0) {
    sectionTitle(`Flagged Transactions (${flaggedTxns.length})`);
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.inkGhost);
    doc.text("DATE", MARGIN + 1, y);
    doc.text("MERCHANT", MARGIN + 24, y);
    doc.text("SOURCE", MARGIN + 78, y);
    doc.text("AMOUNT", MARGIN + 118, y);
    doc.text("ID", MARGIN + 142, y);
    y += 6;
    doc.setDrawColor(...C.border);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;

    flaggedTxns.forEach((t, i) => drawTxnRow(t, i % 2 === 0));
  }

  // ── Provenance ──
  sectionTitle(`Provenance Trail (${result.provenance.length} records)`);
  const provenanceSlice = result.provenance.slice(0, 50);
  for (const [i, p] of provenanceSlice.entries()) {
    const rowH = 6.5;
    ensureSpace(rowH + 2);
    if (i % 2 === 0) {
      doc.setFillColor(252, 249, 245);
      doc.rect(MARGIN, y - 4, CONTENT_W, rowH, "F");
    }
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.inkGhost);
    doc.text(format(p.timestamp, "HH:mm:ss"), MARGIN + 1, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.teal);
    doc.text(p.agentRole, MARGIN + 22, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.inkMid);
    const line = `${p.action}: ${p.reason}`;
    doc.text(line.slice(0, 95), MARGIN + 44, y);
    y += rowH + 1;
  }
  if (result.provenance.length > 50) {
    bodyText(
      `… and ${result.provenance.length - 50} additional provenance records.`,
    );
  }

  drawPageChrome(doc, result.organizationName, result.period, pageNum);

  const filename = buildPdfFilename(result);
  doc.save(filename);
}
