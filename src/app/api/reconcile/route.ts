import { NextRequest } from 'next/server';
import { runSwarm } from '@/lib/agents/orchestrator';
import { MOCK_TRANSACTIONS } from '@/lib/data/mockDataset';
import { Transaction, EngineConfig } from '@/types';
import { DEFAULT_ENGINE_CONFIG } from '@/types';

export async function GET() {
  try {
    const result = await runSwarm(MOCK_TRANSACTIONS);
    return Response.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactions: Transaction[] = body.transactions ?? MOCK_TRANSACTIONS;
    const config: Partial<EngineConfig> = body.config ?? {};

    if (!Array.isArray(transactions)) {
      return Response.json(
        { success: false, error: 'transactions must be an array' },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      return Response.json(
        { success: false, error: 'No transactions to reconcile' },
        { status: 400 }
      );
    }

    const mergedConfig: EngineConfig = {
      ...DEFAULT_ENGINE_CONFIG,
      ...config,
    };

    const result = await runSwarm(transactions, { config: mergedConfig });
    return Response.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
