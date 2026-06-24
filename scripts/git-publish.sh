#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GIT="git -c safe.directory=$ROOT"
export GIT_SSH_COMMAND="ssh -F $HOME/.ssh/config -o IdentitiesOnly=yes"

# Ensure clean slate on main
if $GIT rev-parse --verify HEAD >/dev/null 2>&1; then
  $GIT checkout --orphan temp-main 2>/dev/null || true
  $GIT reset --hard
fi

$GIT rm -rf --cached . 2>/dev/null || true

commit() {
  local msg="$1"
  shift
  if [ $# -eq 0 ]; then return 0; fi
  $GIT add "$@"
  if $GIT diff --cached --quiet; then
    echo "skip (empty): $msg"
  else
    $GIT commit -m "$msg"
    echo "committed: $msg"
  fi
}

commit "chore: bootstrap Next.js project and tooling" \
  LICENSE .gitignore package.json package-lock.json \
  tsconfig.json tsconfig.test.json next-env.d.ts \
  eslint.config.mjs postcss.config.mjs next.config.ts

commit "feat: define core domain types for audit reconciliation" \
  src/types/index.ts

commit "feat: add deterministic ledger engine with anomaly taxonomy" \
  src/lib/engine/ledgerEngine.ts

commit "feat: add mock dataset and engine validation harness" \
  src/lib/data/mockDataset.ts src/lib/engine/testHarness.ts

commit "feat: add agent message bus and swarm orchestrator" \
  src/lib/agents/messageBus.ts src/lib/agents/orchestrator.ts

commit "feat: implement ingestion matcher skeptic and reconciler agents" \
  src/lib/agents/ingestionAgent.ts src/lib/agents/matcherAgent.ts \
  src/lib/agents/skepticAgent.ts src/lib/agents/reconcilerAgent.ts \
  src/lib/agents/testSwarm.ts

commit "feat: add CSV JSON and text file ingestion parsers" \
  src/lib/ingestion/classifyFile.ts src/lib/ingestion/csvParser.ts \
  src/lib/ingestion/jsonParser.ts src/lib/ingestion/receiptTextParser.ts

commit "feat: add Groq text structuring and vision OCR fallback" \
  src/lib/ingestion/extractionPrompt.ts src/lib/ingestion/transactionRows.ts \
  src/lib/ingestion/llmTextStructurer.ts src/lib/ingestion/llmVision.ts \
  src/lib/ingestion/extractFromOcrText.ts src/lib/ingestion/ocrExtractor.ts \
  src/lib/ingestion/llmAnomalyExplainer.ts

commit "feat: add Puter client OCR and hybrid ingest orchestration" \
  src/lib/ingestion/puterOcr.ts src/lib/ingestion/ingestFiles.ts

commit "feat: expose ingest reconcile and explain API routes" \
  src/app/api/ingest/route.ts src/app/api/reconcile/route.ts \
  src/app/api/explain/route.ts

commit "feat: add brand mark and shared audit UI primitives" \
  src/components/Logo.tsx src/components/BrandMark.tsx \
  src/components/AgentTag.tsx src/components/SourcePill.tsx \
  src/components/ConfidenceBar.tsx

commit "feat: build upload workspace trace feed and anomaly panels" \
  src/components/Topbar.tsx src/components/StatusBar.tsx \
  src/components/TransactionFeed.tsx src/components/AgentTrace.tsx \
  src/components/AnomalyReport.tsx src/components/DropZone.tsx

commit "feat: add audit workspace route and app shell layout" \
  src/app/layout.tsx src/app/page.tsx src/app/icon.svg src/app/audit/page.tsx

commit "feat: add marketing landing page and ink-paper theme" \
  src/components/landing/LandingPage.tsx src/app/globals.css

commit "feat: bundle sample nonprofit books and generator script" \
  public/sample-books scripts/generate-sample-books.ts

commit "feat: add board-ready PDF export for reconciliation reports" \
  src/lib/export/pdfReport.ts

commit "docs: document setup architecture and Vercel deployment" \
  README.md AGENTS.md .env.example

commit "chore: add Vercel deployment configuration" vercel.json

# Rename branch to main
$GIT branch -M main

# Remote + push
if $GIT remote | grep -q '^origin$'; then
  $GIT remote set-url origin git@github-dev:shaileshdev4/ledgerline.git
else
  $GIT remote add origin git@github-dev:shaileshdev4/ledgerline.git
fi

echo ""
echo "Commit log:"
$GIT log --oneline

echo ""
echo "Pushing to origin main..."
$GIT push -u origin main

echo "Done."
