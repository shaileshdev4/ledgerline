# Ledgerline

Multi-agent audit reconciliation for nonprofit bookkeeping. Ingest messy books (bank CSV, receipts, P2P screenshots, ledger sheets), run a specialist agent swarm, flag anomalies with evidence, and export a board-ready PDF.

**AI proposes — code verifies.** Matching and anomaly detection use deterministic rules; ledger math is recomputed in code, not trusted to the LLM.

## Features

- **File upload** — drag-and-drop mixed files (CSV, JSON, images)
- **Ingestion** — hybrid pipeline: Puter.js OCR in browser → Groq text structuring on server → vision fallback
- **Agent swarm** — Ingestion → Matcher → Skeptic challenge loop → Reconciler
- **Live trace UI** — animated agent handoffs and anomaly catches
- **PDF export** — reconciliation report with provenance trail
- **Sample books** — bundled demo dataset with 3 planted anomalies

## Quick start

```bash
git clone https://github.com/shaileshdev4/ledgerline.git
cd ledgerline
npm install
cp .env.example .env.local   # optional — only needed for image OCR
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Load sample books**, then **Run Reconciliation**.

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shaileshdev4/ledgerline)

1. Import [shaileshdev4/ledgerline](https://github.com/shaileshdev4/ledgerline) on Vercel (Next.js auto-detected).
2. Add environment variables in the Vercel dashboard:

| Variable | Required | Notes |
|----------|----------|-------|
| `GROQ_API_KEY` | For image structuring + board notes | Free tier works for demos |
| `GROQ_TEXT_MODEL` | Optional | Default: `llama-3.1-8b-instant` |
| `GROQ_VISION_MODEL` | Optional | Vision fallback only |
| `LLM_PROVIDER` | Optional | Default: `groq` |

3. Deploy. CSV/JSON sample books work without keys; image uploads need `GROQ_API_KEY`.

Puter OCR runs in the browser (no server key). See `.env.example` for all options.

## Environment (local)

Image OCR requires one vision provider. CSV/JSON uploads work without any API key.

```env
# Groq — fast, free-tier friendly for testing
LLM_PROVIDER=groq
GROQ_API_KEY=your_key
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Anthropic — higher-quality OCR
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=your_key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test:engine` | Validate anomaly detection on sample dataset |
| `npm run test:swarm` | End-to-end swarm integration test |
| `npm run generate:sample-books` | Regenerate files in `public/sample-books/` |

## Project structure

```
src/
  app/              Next.js routes + API (ingest, reconcile)
  components/       UI (upload, trace, anomaly report)
  lib/
    agents/         Multi-agent swarm orchestration
    engine/         Deterministic ledger + anomaly rules
    ingestion/      CSV/JSON/OCR parsers
    export/         PDF report generation
    data/           Sample transaction dataset
public/
  sample-books/     Downloadable demo files
```

## Architecture

```
[Uploaded files]
      ↓
 Ingestion Agent  → normalized transactions
      ↓
 Matcher Agent    → cross-source match proposals + confidence
      ↕  (challenge loop)
 Skeptic Agent    → anomaly taxonomy checks
      ↓
 Reconciler Agent → ledger verification + report
      ↓
 [Live UI trace] + [Anomaly report] + [PDF]
```

## Sample data

`public/sample-books/` contains a full Q1 2026 nonprofit book split by source:

- `bank_statement_q1_2026.csv`
- `ledger_q1_2026.csv`
- `p2p_transfers.json`
- `receipts.json`

Three planted anomalies: duplicate payment, category mismatch, missing documentation.

## License

MIT
