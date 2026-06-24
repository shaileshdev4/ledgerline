// Board-facing plain-English explanations for flagged anomalies (post-reconcile only).

import type { Anomaly } from "@/types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TEXT_MODEL_DEFAULT = "llama-3.1-8b-instant";

export function hasAnomalyExplainer(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export async function explainAnomalyForBoard(anomaly: Anomaly): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return anomaly.recommendedAction;
  }

  const model =
    process.env.GROQ_TEXT_MODEL?.trim() || GROQ_TEXT_MODEL_DEFAULT;

  const prompt = `You are advising a volunteer nonprofit treasurer and their board.

Write 2 short sentences explaining why this audit flag matters and what to do next.
Be specific, calm, and non-alarmist. Do not invent facts beyond the evidence.

Anomaly type: ${anomaly.type}
Severity: ${anomaly.severity}
Evidence: ${anomaly.evidence}
Recommended action: ${anomaly.recommendedAction}

Return plain text only — no markdown, no bullet points.`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return anomaly.recommendedAction;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  return content || anomaly.recommendedAction;
}
