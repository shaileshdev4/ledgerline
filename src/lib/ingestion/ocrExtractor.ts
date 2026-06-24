import { Transaction, TransactionSource } from "@/types";
import { extractFromOcrText } from "./extractFromOcrText";
import { VISION_EXTRACTION_PROMPT } from "./extractionPrompt";
import { extractTransactionsWithVision } from "./llmVision";
import { rowsToTransactions } from "./transactionRows";

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function resolveMediaType(mimeType: string): ImageMediaType {
  if (mimeType === "image/png") return "image/png";
  if (mimeType === "image/gif") return "image/gif";
  if (mimeType === "image/webp") return "image/webp";
  return "image/jpeg";
}

export type ImageExtractionMethod =
  | "puter_llm"
  | "text_llm"
  | "heuristic"
  | "vision";

/** Hybrid path: pre-extracted OCR text → text LLM → heuristics. */
export async function extractTransactionsFromOcrText(
  rawText: string,
  source: TransactionSource,
  filename: string,
  options?: { ocrProvider?: "puter" },
): Promise<{ transactions: Transaction[]; method: ImageExtractionMethod }> {
  const result = await extractFromOcrText(rawText, source, filename, options);
  return { transactions: result.transactions, method: result.method };
}

/** Vision fallback when OCR text structuring fails or no client OCR was run. */
export async function extractTransactionsFromImageVision(
  buffer: Buffer,
  mimeType: string,
  source: TransactionSource,
): Promise<{ transactions: Transaction[]; method: "vision" }> {
  const mediaType = resolveMediaType(
    mimeType.startsWith("image/") ? mimeType : "image/jpeg",
  );
  const base64 = buffer.toString("base64");

  const { rows } = await extractTransactionsWithVision(
    base64,
    mediaType,
    VISION_EXTRACTION_PROMPT,
  );

  const transactions = rowsToTransactions(rows, source);
  if (transactions.length === 0) {
    throw new Error("No transactions found in image");
  }

  return { transactions, method: "vision" };
}

/**
 * Full image pipeline: optional pre-extracted text first, then vision fallback.
 */
export async function extractTransactionsFromImage(
  buffer: Buffer,
  mimeType: string,
  source: TransactionSource,
  filename: string,
  preExtractedText?: string,
): Promise<{ transactions: Transaction[]; method: ImageExtractionMethod }> {
  const isImage =
    mimeType.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(filename);

  if (preExtractedText?.trim()) {
    try {
      return await extractTransactionsFromOcrText(
        preExtractedText,
        source,
        filename,
        { ocrProvider: "puter" },
      );
    } catch {
      // Fall through to vision if text path failed.
    }
  }

  if (!isImage) {
    throw new Error(`${filename}: not an image and no OCR text provided`);
  }

  try {
    return await extractTransactionsFromImageVision(buffer, mimeType, source);
  } catch (visionErr) {
    if (preExtractedText?.trim()) {
      throw new Error(
        `${filename}: OCR text structuring and vision fallback both failed`,
      );
    }
    throw visionErr;
  }
}
