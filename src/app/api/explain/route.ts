import { NextRequest } from "next/server";
import type { Anomaly } from "@/types";
import { explainAnomalyForBoard } from "@/lib/ingestion/llmAnomalyExplainer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { anomaly?: Anomaly };
    if (!body.anomaly?.type || !body.anomaly.evidence) {
      return Response.json(
        { success: false, error: "Missing anomaly payload" },
        { status: 400 },
      );
    }

    const explanation = await explainAnomalyForBoard(body.anomaly);
    return Response.json({ success: true, explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
