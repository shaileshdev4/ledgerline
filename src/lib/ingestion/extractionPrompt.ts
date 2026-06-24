import type { TransactionSource } from "@/types";

const SOURCE_HINTS: Record<TransactionSource, string> = {
  receipt_image: "printed or scanned store receipt",
  p2p_screenshot: "Venmo, Zelle, or Cash App payment screenshot",
  bank_csv: "bank statement export",
  ledger_sheet: "treasurer spreadsheet row",
};

export function buildExtractionPrompt(
  source: TransactionSource,
  filename: string,
  rawText: string,
): string {
  return `You are a nonprofit bookkeeper extracting structured transactions from ${SOURCE_HINTS[source]} text.

Source file: ${filename}

Return ONLY valid JSON — an array of transaction objects with these fields:
- date (YYYY-MM-DD)
- amount (number, positive for expenses)
- merchant (string)
- description (string)
- category (one of: program_supplies, program_services, administrative, fundraising, travel, technology, utilities, personnel, personal, uncategorized)
- referenceId (optional string)
- rawText (the key line(s) you used from the source)

Extract every distinct transaction visible. Normalize merchant names (e.g. "STPLS #4429" → "Staples").
If none found, return [].

--- OCR TEXT ---
${rawText}
--- END ---`;
}

export const VISION_EXTRACTION_PROMPT = `You are a nonprofit bookkeeper extracting structured transactions from receipt photos or P2P payment screenshots.

Return ONLY valid JSON — an array of transaction objects with these fields:
- date (YYYY-MM-DD)
- amount (number, positive for expenses)
- merchant (string)
- description (string)
- category (one of: program_supplies, program_services, administrative, fundraising, travel, technology, utilities, personnel, personal, uncategorized)
- referenceId (optional string)
- rawText (the key text you read from the image)

Extract every distinct transaction visible. If none found, return [].`;
