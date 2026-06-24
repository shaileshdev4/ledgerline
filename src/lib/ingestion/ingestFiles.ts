import { Transaction, TransactionSource } from "@/types";
import { classifyFile } from "./classifyFile";
import { parseCsvToTransactions } from "./csvParser";
import { parseJsonToTransactions } from "./jsonParser";
import { parseTextFileToTransactions } from "./receiptTextParser";
import {
  extractTransactionsFromImage,
  extractTransactionsFromOcrText,
  type ImageExtractionMethod,
} from "./ocrExtractor";

export interface IngestFileInput {
  name: string;
  buffer: Buffer;
  mimeType: string;
}

/** Client-side Puter OCR text, structured on the server. */
export interface OcrTextInput {
  name: string;
  source: TransactionSource;
  text: string;
  ocrProvider?: "puter";
}

export type IngestMethod =
  | "csv"
  | "json"
  | "text"
  | "heuristic"
  | "puter_llm"
  | "text_llm"
  | "vision";

export interface FileIngestSummary {
  name: string;
  source: TransactionSource;
  count: number;
  method: IngestMethod;
}

export interface IngestFilesResult {
  transactions: Transaction[];
  filesProcessed: FileIngestSummary[];
  warnings: string[];
}

function methodLabel(method: ImageExtractionMethod): IngestMethod {
  return method;
}

export async function ingestFiles(
  files: IngestFileInput[],
  ocrTexts: OcrTextInput[] = [],
): Promise<IngestFilesResult> {
  const transactions: Transaction[] = [];
  const filesProcessed: FileIngestSummary[] = [];
  const warnings: string[] = [];

  const ocrByName = new Map(ocrTexts.map((o) => [o.name, o]));
  const consumedOcr = new Set<string>();

  for (const file of files) {
    const classification = classifyFile(file.name, file.mimeType);
    if (!classification) {
      warnings.push(`Skipped unsupported file: ${file.name}`);
      continue;
    }

    const { source, method } = classification;
    const content = file.buffer.toString("utf-8");
    let parsed: Transaction[] = [];
    let usedMethod: IngestMethod = method as IngestMethod;

    try {
      if (method === "csv") {
        parsed = parseCsvToTransactions(content, source);
      } else if (method === "json") {
        parsed = parseJsonToTransactions(content, source);
      } else if (method === "text") {
        parsed = parseTextFileToTransactions(content, source, file.name);
        usedMethod = "text";
      } else if (method === "ocr") {
        const ocrPayload = ocrByName.get(file.name);
        if (ocrPayload) consumedOcr.add(file.name);

        const result = await extractTransactionsFromImage(
          file.buffer,
          file.mimeType,
          source,
          file.name,
          ocrPayload?.text,
        );
        parsed = result.transactions;
        usedMethod = methodLabel(result.method);

        if (result.method === "vision" && ocrPayload) {
          warnings.push(
            `${file.name}: used vision fallback after Puter OCR structuring failed`,
          );
        } else if (result.method === "heuristic" && ocrPayload) {
          warnings.push(
            `${file.name}: structured with heuristics (no GROQ_API_KEY or LLM parse failed)`,
          );
        }
      }

      if (parsed.length === 0) {
        warnings.push(`No transactions found in ${file.name}`);
        continue;
      }

      transactions.push(...parsed);
      filesProcessed.push({
        name: file.name,
        source,
        count: parsed.length,
        method: usedMethod,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown parse error";
      warnings.push(`${file.name}: ${msg}`);
    }
  }

  // OCR-only payloads (text sent without re-uploading the image bytes)
  for (const ocr of ocrTexts) {
    if (consumedOcr.has(ocr.name)) continue;

    try {
      const result = await extractTransactionsFromOcrText(
        ocr.text,
        ocr.source,
        ocr.name,
        { ocrProvider: ocr.ocrProvider },
      );
      if (result.transactions.length === 0) {
        warnings.push(`No transactions found in ${ocr.name}`);
        continue;
      }

      transactions.push(...result.transactions);
      filesProcessed.push({
        name: ocr.name,
        source: ocr.source,
        count: result.transactions.length,
        method: methodLabel(result.method),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown parse error";
      warnings.push(`${ocr.name}: ${msg}`);
    }
  }

  return { transactions, filesProcessed, warnings };
}
