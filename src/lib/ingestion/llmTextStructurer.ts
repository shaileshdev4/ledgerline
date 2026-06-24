// Server-side text structuring — cheap Groq text model turns OCR text into JSON.

import type { TransactionSource } from "@/types";
import { buildExtractionPrompt } from "./extractionPrompt";
import { parseTransactionsJson } from "./transactionRows";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TEXT_MODEL_DEFAULT = "llama-3.1-8b-instant";

export function hasTextStructurer(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export async function structureOcrTextToRows(
  rawText: string,
  source: TransactionSource,
  filename: string,
): Promise<Array<Record<string, unknown>>> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set (required for text structuring)");
  }

  const model =
    process.env.GROQ_TEXT_MODEL?.trim() || GROQ_TEXT_MODEL_DEFAULT;
  const prompt = buildExtractionPrompt(source, filename, rawText);

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Groq text API ${res.status}: ${detail.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq text model returned empty response");

  return parseTransactionsJson(content);
}
