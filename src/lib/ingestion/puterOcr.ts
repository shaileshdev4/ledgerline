"use client";

import type { Puter } from "@heyputer/puter.js";

let puterInstance: Puter | null = null;

async function getPuter(): Promise<Puter> {
  if (typeof window === "undefined") {
    throw new Error("Puter OCR runs in the browser only");
  }
  if (!puterInstance) {
    const mod = await import("@heyputer/puter.js");
    puterInstance = mod.puter ?? (mod as { default: Puter }).default;
  }
  return puterInstance;
}

export function isImageUpload(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|heic|pdf)$/i.test(file.name)
  );
}

/**
 * Client-side OCR via Puter.js (AWS Textract by default).
 * Future: move this step to a backend worker; API shape stays the same.
 */
export async function extractTextWithPuter(file: File): Promise<string> {
  const puter = await getPuter();
  const text = await puter.ai.img2txt({
    source: file,
    provider: "aws-textract",
  });
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    throw new Error(`Puter OCR found no text in ${file.name}`);
  }
  return trimmed;
}
