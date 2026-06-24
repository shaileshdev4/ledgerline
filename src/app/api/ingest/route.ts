import { NextRequest } from "next/server";
import { ingestFiles, type OcrTextInput } from "@/lib/ingestion/ingestFiles";
import { MOCK_TRANSACTIONS } from "@/lib/data/mockDataset";

export const runtime = "nodejs";

function parseOcrTextsField(raw: FormDataEntryValue | null): OcrTextInput[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  const parsed = JSON.parse(raw) as OcrTextInput[];
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item) =>
      item &&
      typeof item.name === "string" &&
      typeof item.text === "string" &&
      typeof item.source === "string",
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    const ocrTexts = parseOcrTextsField(formData.get("ocrTexts"));

    if (files.length === 0 && ocrTexts.length === 0) {
      return Response.json(
        { success: false, error: "No files uploaded" },
        { status: 400 },
      );
    }

    const inputs = await Promise.all(
      files
        .filter((f): f is File => f instanceof File)
        .map(async (file) => ({
          name: file.name,
          buffer: Buffer.from(await file.arrayBuffer()),
          mimeType: file.type || "application/octet-stream",
        })),
    );

    const result = await ingestFiles(inputs, ocrTexts);

    if (result.transactions.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Could not extract any transactions from the uploaded files",
          warnings: result.warnings,
        },
        { status: 422 },
      );
    }

    return Response.json({
      success: true,
      transactions: result.transactions,
      filesProcessed: result.filesProcessed,
      warnings: result.warnings,
      totalCount: result.transactions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

/** Load the bundled sample books (same dataset as mock, split by source file). */
export async function GET() {
  return Response.json({
    success: true,
    transactions: MOCK_TRANSACTIONS,
    filesProcessed: [
      {
        name: "bank_statement_q1_2026.csv",
        source: "bank_csv",
        count: 13,
        method: "csv",
      },
      {
        name: "ledger_q1_2026.csv",
        source: "ledger_sheet",
        count: 7,
        method: "csv",
      },
      {
        name: "p2p_transfers.json",
        source: "p2p_screenshot",
        count: 7,
        method: "json",
      },
      {
        name: "receipts.json",
        source: "receipt_image",
        count: 14,
        method: "json",
      },
    ],
    warnings: [],
    totalCount: MOCK_TRANSACTIONS.length,
    sample: true,
  });
}
