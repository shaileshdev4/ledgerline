// Server-side vision OCR — Groq (cheap testing) or Anthropic (production quality).

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL_DEFAULT = "meta-llama/llama-4-scout-17b-16e-instruct";
const ANTHROPIC_MODEL_DEFAULT = "claude-sonnet-4-20250514";

export type VisionProvider = "groq" | "anthropic";

export function resolveVisionProvider(): VisionProvider | null {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === "groq") return "groq";
  if (explicit === "anthropic") return "anthropic";

  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  return null;
}

export function parseTransactionsJson(text: string): Array<Record<string, unknown>> {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const arrayMatch = clean.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]) as Array<Record<string, unknown>>;
  }

  const objectMatch = clean.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const obj = JSON.parse(objectMatch[0]) as Record<string, unknown>;
    if (Array.isArray(obj.transactions)) {
      return obj.transactions as Array<Record<string, unknown>>;
    }
    if (Array.isArray(obj.items)) {
      return obj.items as Array<Record<string, unknown>>;
    }
  }

  throw new Error("Vision model did not return valid transaction JSON");
}

async function callGroqVision(
  base64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const model =
    process.env.GROQ_VISION_MODEL?.trim() || GROQ_VISION_MODEL_DEFAULT;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Groq vision API ${res.status}: ${detail.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq vision returned empty response");
  return content;
}

async function callAnthropicVision(
  base64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || ANTHROPIC_MODEL_DEFAULT;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic vision returned no text");
  }
  return textBlock.text;
}

export async function extractTransactionsWithVision(
  base64: string,
  mimeType: string,
  prompt: string,
): Promise<{ rows: Array<Record<string, unknown>>; provider: VisionProvider }> {
  const provider = resolveVisionProvider();
  if (!provider) {
    throw new Error(
      "No vision API key set. Add GROQ_API_KEY (testing) or ANTHROPIC_API_KEY to .env.local, or upload JSON/CSV exports instead.",
    );
  }

  const text =
    provider === "groq"
      ? await callGroqVision(base64, mimeType, prompt)
      : await callAnthropicVision(base64, mimeType, prompt);

  return { rows: parseTransactionsJson(text), provider };
}
