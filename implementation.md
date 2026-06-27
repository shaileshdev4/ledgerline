# Ledgerline - Implementation Status

> **Audited against:** `Ledgerline_Project_Spec.md` (Youth Code x AI - Project 2, Track 01: Money, Jobs & AI)  
> **Code reference:** [github.com/shaileshdev4/ledgerline](https://github.com/shaileshdev4/ledgerline) `main`  
> **Live deployment:** [ledgerline-cyan.vercel.app](https://ledgerline-cyan.vercel.app/) → [/audit](https://ledgerline-cyan.vercel.app/audit)  
> **Audit date:** June 23, 2026

This document maps every major requirement in the project spec to what exists in the repo today - frontend, backend, agents, engine, ingestion, data, tests, deployment, and submission artifacts. Status keys: **Done** · **Partial** · **Not started** · **N/A (out of scope)**

---

## Executive summary

Ledgerline is a **working hackathon prototype**, not a production audit product. The spec’s core thesis - _“AI proposes, code verifies”_ with a visible multi-agent swarm - is implemented end-to-end and deployed.

| Area                         | Status          | Notes                                                             |
| ---------------------------- | --------------- | ----------------------------------------------------------------- |
| Multi-agent swarm + trace UI | **Done**        | Ingestion → Matcher → Skeptic → Reconciler with animated playback |
| Deterministic anomaly engine | **Done**        | 3 taxonomy checks; tuned to catch 3 planted anomalies             |
| File ingestion               | **Partial**     | CSV/JSON/images/PDF; no native `.xlsx`; hybrid Puter+Groq+vision  |
| Board-ready PDF              | **Done**        | Client-side jsPDF with summary + provenance                       |
| Mock dataset + sample books  | **Done**        | 41 transactions, 4 sources, 3 planted anomalies                   |
| Landing + audit app shell    | **Done**        | Marketing `/` + workspace `/audit`                                |
| Automated tests              | **Partial**     | Engine + swarm CLI tests only                                     |
| Submission packaging         | **Not started** | No demo video, no architecture writeup in repo                    |
| Full spec fidelity           | **Partial**     | Several spec items simplified (see gaps)                          |

**Rough completion:** ~80% of the _product build_ checklist (§2.17); ~50% of the full _hackathon submission_ package (§0.4 - video, writeup, supplementary deck).

---

## Spec checklist (§2.17) - line by line

| #   | Spec requirement                                                                           | Status          | How it was built                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mock nonprofit dataset: ~40 txns, 4 sources, exactly 3 planted anomalies                   | **Done**        | `src/lib/data/mockDataset.ts` - 41 transactions across `bank_csv`, `ledger_sheet`, `p2p_screenshot`, `receipt_image`. Planted: duplicate Staples $67.43, Spotify category mismatch, $240 Neighborhood Hardware missing docs.                   |
| 2   | Ingestion agent: vision OCR + CSV/spreadsheet parsing → `Transaction` objects              | **Partial**     | **Parsing:** `ingestFiles.ts` + `csvParser`, `jsonParser`, `receiptTextParser`, hybrid OCR pipeline. **Agent:** `ingestionAgent.ts` normalizes/validates already-parsed transactions (does not run OCR itself).                                |
| 3   | Matcher agent: cross-source match proposals + confidence                                   | **Done**        | `matcherAgent.ts` - greedy pairing, score = amount (0.6) + merchant norm (0.25) + date proximity (0.15). Floor from `EngineConfig.matcherConfidenceFloor` (default 0.65).                                                                      |
| 4   | Skeptic agent: fixed taxonomy (duplicate / round-number / missing-doc / category-mismatch) | **Partial**     | **3 of 4 types** in `ledgerEngine.ts`: `duplicate_payment`, `category_mismatch`, `missing_documentation`. **`round_number` not implemented** (not in `AnomalyType` union). Skeptic runs taxonomy via `detectAnomalies()`, not LLM.             |
| 5   | Propose/challenge loop: confidence-gated, bounded rounds, accept/re-match/flag             | **Partial**     | Matcher proposes → Skeptic **rejects** proposals with confidence &lt; 0.75 (drops them). **No bounded re-match loop** back to Matcher with reasons; no max-2-round protocol. Anomalies always flagged by deterministic checks.                 |
| 6   | Deterministic ledger: recomputes math, enforces balance                                    | **Partial**     | `evaluateLedger()` sums debits, counts matched/unmatched/flagged. **Does not enforce double-entry balance** or cross-source total reconciliation. Math is computed in code, not LLM - but “balances” in the accounting sense are not verified. |
| 7   | Provenance stored for every decision                                                       | **Done**        | `messageBus.ts` collects `ProvenanceRecord[]` from matcher, skeptic, reconciler. Included in `ReconciliationResult` and PDF (first 40 records).                                                                                                |
| 8   | Live-trace visualization (showpiece)                                                       | **Done**        | `AgentTrace.tsx` + `audit/page.tsx` `playTrace()` - lane chips, timed event playback, challenge/anomaly delays.                                                                                                                                |
| 9   | Anomaly report: evidence + confidence + recommended action                                 | **Done**        | `AnomalyReport.tsx` - type, explanation, evidence, action, `ConfidenceBar`, human-review banner. Optional **Board text** via `POST /api/explain` (Groq LLM).                                                                                   |
| 10  | Board-ready PDF export with full trail                                                     | **Done**        | `pdfReport.ts` - cover, executive summary, ledger verification, anomaly report, provenance trail, download as `ledgerline-{org}-{period}.pdf`.                                                                                                 |
| 11  | Tune against 3-anomaly set until all caught, zero spurious                                 | **Done**        | `testHarness.ts` + `testSwarm.ts` assert exactly 3 types found. `detectAnomalies()` dedupes to **one anomaly per type** (demo stability).                                                                                                      |
| 12  | 3-min demo with forensic-catch peak; pre-cached pass + labeled live re-run                 | **Partial**     | Landing page shows peak flags; `/audit` animates trace. **Load sample books** uses real ingest on bundled files. **No separate “cached pass” mode** or labeled encore toggle. GET `/api/ingest` returns in-memory mock (shortcut).             |
| 13  | Architecture diagram in MCP/A2A language for writeup                                       | **Not started** | Spec diagram exists in `Ledgerline_Project_Spec.md` only; not in repo README or a submission doc.                                                                                                                                              |
| 14  | Writeup citing pain sources + landscape + verification story                               | **Partial**     | `README.md` covers architecture and “AI proposes - code verifies.” **Does not** cite the three market-research sources from §2.2 or include judge-targeted framing.                                                                            |

---

## Product screens (§2.7)

### 1. Drop zone - **Done (with caveats)**

| Spec                                   | Implementation                                                                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag folder of mixed files             | **Partial** - multi-file drag-drop in `DropZone.tsx`; browser file picker, not true folder ingestion API                                                                    |
| Receipt images, PDFs, CSV, spreadsheet | **Partial** - accepts `.csv`, `.tsv`, `.json`, `.txt`, images, `.pdf`. **No `.xlsx` / `.xls` parser** (landing mock UI mentions `ledger_v3.xlsx` but parser does not exist) |
| Clear “what I accept” affordances      | **Done** - icon row for Bank CSV, Receipts, P2P, Ledger sheet; `ACCEPTED` attribute on input                                                                                |
| Org name + period before reconcile     | **Done** - inputs in DropZone, passed to `POST /api/reconcile` config                                                                                                       |

**Flow:** Images → client Puter OCR (`puterOcr.ts`) → `ocrTexts` JSON + file bytes → `POST /api/ingest`. Non-images parsed server-side.

### 2. Live reconciliation view - **Done**

| Spec                                           | Implementation                                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Real-time trace, agent lanes                   | `AgentTrace.tsx` - Ingestion / Matcher / Skeptic / Reconciler lanes                                                                     |
| Messages flowing (A2A handoffs visible)        | `TraceEvent` types: `agent_started`, `match_proposed`, `match_challenged`, `match_re_proposed`, `anomaly_flagged`, `report_ready`       |
| Matched green / challenged amber / flagged red | **Partial** - trace log + `TransactionFeed` highlights scanning/flagged txns; not full green/amber/red state machine on every match row |
| Animated playback                              | `playTrace()` in `audit/page.tsx` with 120–400ms delays                                                                                 |

**Layout:** 3-column workspace - Transaction feed (left) · Agent trace (center) · Anomaly report (right). `Topbar`, `StatusBar`, `LedgerFooter`.

### 3. Anomaly report - **Done**

Ranked cards with type, evidence, confidence bar, explanation, recommended action, transaction IDs. **Extra:** “Board text” button calls Groq for plainer board-language prose (`llmAnomalyExplainer.ts`).

### 4. Reconciliation output (PDF) - **Done**

One-click export from Topbar → `downloadReconciliationPdf(result)`.

---

## Architecture (§2.8–2.10) - as built

```
[User uploads files in browser]
        │
        ▼
┌─────────────────── INGESTION (hybrid) ───────────────────┐
│  classifyFile → csv/json/text parsers (deterministic)       │
│  images: Puter OCR (browser) → Groq text structurer       │
│          → vision fallback (Groq Llama 4 Scout / Claude)  │
│          → heuristic receiptTextParser (last resort)        │
└───────────────────────────┬──────────────────────────────┘
                            │ Transaction[]
                            ▼
┌─────────────────── SWARM (deterministic TS) ─────────────┐
│  ingestionAgent  → normalize + validate                   │
│  matcherAgent    → cross-source proposals + confidence    │
│  skepticAgent    → reject low-confidence; run taxonomy    │
│  reconcilerAgent → evaluateLedger + summary               │
│  messageBus      → trace + provenance snapshots           │
└───────────────────────────┬──────────────────────────────┘
                            │ ReconciliationResult
                            ▼
              [Live trace UI] + [Anomaly report] + [PDF]
```

### Hard 20% (§2.9) - honest assessment

| Spec solution                      | Built?      | Detail                                                                                                  |
| ---------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| Agents propose; code verifies math | **Partial** | Agents are deterministic TS, not LLM. Ledger recomputes sums in code. No full accounting balance proof. |
| Fixed anomaly taxonomy             | **Partial** | 3/4 classes; no round-number fraud check                                                                |
| Confidence-gated escalation        | **Partial** | Matcher floor 0.65; Skeptic challenge threshold 0.75 - but no iterative re-match                        |
| Provenance mandatory               | **Done**    | Every agent writes provenance records                                                                   |
| Planted test set tuning            | **Done**    | `npm run test:engine` and `npm run test:swarm`                                                          |

**Important deviation:** The spec imagines LLM agents for interpretation with a code verification backstop. The shipped product uses **deterministic agents for matching and anomaly detection**; LLMs are used only for **ingestion structuring** (OCR text → JSON) and **optional board-language explanations**. This is defensible (“code verifies”) but is not a literal LLM Matcher↔Skeptic debate.

---

## Frontend - file by file

| File                                        | Role                                                                                | Status   |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| `src/app/page.tsx`                          | Landing route `/`                                                                   | **Done** |
| `src/app/audit/page.tsx`                    | Main app `/audit` - upload phase + workspace phase, trace playback, reconcile + PDF | **Done** |
| `src/app/layout.tsx`                        | Fonts (Inter, DM Mono), global CSS                                                  | **Done** |
| `src/app/globals.css`                       | Ink-and-paper design system, landing animations, audit shell                        | **Done** |
| `src/components/landing/LandingPage.tsx`    | Marketing: hero, peak anomaly cards, how-it-works, CTA                              | **Done** |
| `src/components/DropZone.tsx`               | Upload UI, Puter OCR orchestration, sample books loader                             | **Done** |
| `src/components/Topbar.tsx`                 | Org display, New books, Export PDF, Run Reconciliation                              | **Done** |
| `src/components/TransactionFeed.tsx`        | Scrollable transaction cards + source pills                                         | **Done** |
| `src/components/AgentTrace.tsx`             | Agent lane status + event log                                                       | **Done** |
| `src/components/AnomalyReport.tsx`          | Flagged anomaly cards + board text                                                  | **Done** |
| `src/components/StatusBar.tsx`              | Run state + summary stats                                                           | **Done** |
| `src/components/ConfidenceBar.tsx`          | 0–100% confidence visualization                                                     | **Done** |
| `src/components/SourcePill.tsx`             | bank / ledger / P2P / receipt badges                                                | **Done** |
| `src/components/AgentTag.tsx`               | Colored agent role pills                                                            | **Done** |
| `src/components/BrandMark.tsx` / `Logo.tsx` | Branding                                                                            | **Done** |

**Not built:** Settings page, user auth, persistent storage, multi-org history, mobile-native app, dark/light theme toggle.

---

## Backend / API routes

### `POST /api/ingest` - **Done**

- **Input:** `multipart/form-data` - `files[]`, optional `ocrTexts` JSON array `{ name, source, text, ocrProvider? }`
- **Output:** `{ success, transactions, filesProcessed[], warnings[], totalCount }`
- **Calls:** `ingestFiles()` in `src/lib/ingestion/ingestFiles.ts`
- **Runtime:** `nodejs` (Buffer for file bytes)

### `GET /api/ingest` - **Done (demo shortcut)**

- Returns `MOCK_TRANSACTIONS` directly with hardcoded `filesProcessed` counts
- `sample: true` flag - **does not re-parse** `public/sample-books/` files
- Used when client wants instant dataset without parsing

### `GET /api/reconcile` - **Done (demo)**

- Runs `runSwarm(MOCK_TRANSACTIONS)` - no upload required

### `POST /api/reconcile` - **Done**

- **Input:** `{ transactions?: Transaction[], config?: Partial<EngineConfig> }`
- **Output:** `{ success, result: ReconciliationResult }`
- **Calls:** `runSwarm(transactions, { config })`

### `POST /api/explain` - **Done (optional LLM)**

- **Input:** `{ anomaly: Anomaly }`
- **Output:** `{ success, explanation: string }`
- **Calls:** `explainAnomalyForBoard()` - Groq, board-friendly rewrite
- Not required for core audit path

---

## Agent swarm (`src/lib/agents/`)

| Agent        | File                 | LLM? | What it does                                                                     |
| ------------ | -------------------- | ---- | -------------------------------------------------------------------------------- |
| Message bus  | `messageBus.ts`      | No   | Collects `TraceEvent[]` + `ProvenanceRecord[]`                                   |
| Ingestion    | `ingestionAgent.ts`  | No   | Trim/validate transactions; count by source                                      |
| Matcher      | `matcherAgent.ts`    | No   | Greedy cross-source pairing with confidence score                                |
| Skeptic      | `skepticAgent.ts`    | No   | Drop matches &lt; 0.75 confidence; run `detectAnomalies()`                       |
| Reconciler   | `reconcilerAgent.ts` | No   | `evaluateLedger()` + summary; `requiresHumanReview` if any high-severity anomaly |
| Orchestrator | `orchestrator.ts`    | No   | Sequential pipeline; returns `ReconciliationResult`                              |

**Test:** `testSwarm.ts` - `npm run test:swarm` - full E2E on mock data.

---

## Deterministic engine (`src/lib/engine/`)

### `ledgerEngine.ts`

| Function                     | Purpose                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `findDuplicatePayments()`    | Same amount + merchant across different sources within `duplicateWindowDays` (7)                      |
| `findCategoryMismatches()`   | Personal merchants (Spotify, Netflix, etc.) in non-personal categories                                |
| `findMissingDocumentation()` | Ledger entries ≥ `documentationThreshold` ($200) without bank/receipt/P2P corroboration within 5 days |
| `detectAnomalies()`          | Runs all checks; **keeps one anomaly per type** for stable demo output                                |
| `evaluateLedger()`           | Sums debits, match/unmatch counts, flagged count                                                      |

### `testHarness.ts`

- `npm run test:engine`
- Asserts 3 anomaly types, exactly 3 anomalies, 41 transactions, $14,129.75 total debits

### Anomaly types in code vs spec

| Spec (§2.9)            | In `AnomalyType`?       | Implemented? |
| ---------------------- | ----------------------- | ------------ |
| Duplicate              | `duplicate_payment`     | Yes          |
| Round-number signature | -                       | **No**       |
| Missing documentation  | `missing_documentation` | Yes          |
| Category mismatch      | `category_mismatch`     | Yes          |

---

## Ingestion pipeline (`src/lib/ingestion/`)

| Module                   | Role                                                      |
| ------------------------ | --------------------------------------------------------- |
| `classifyFile.ts`        | Route file to source + method by extension/filename hints |
| `csvParser.ts`           | Parse bank/ledger CSV → transactions                      |
| `jsonParser.ts`          | Parse structured JSON exports                             |
| `receiptTextParser.ts`   | Heuristic text/OCR dump parser                            |
| `puterOcr.ts`            | **Client-side** Puter.js → AWS Textract OCR (no API key)  |
| `extractionPrompt.ts`    | Shared LLM extraction prompt                              |
| `llmTextStructurer.ts`   | Groq text → JSON rows                                     |
| `transactionRows.ts`     | Validate/normalize LLM rows → `Transaction`               |
| `extractFromOcrText.ts`  | OCR text structuring orchestration                        |
| `llmVision.ts`           | Groq Llama 4 Scout or Anthropic Sonnet image → JSON       |
| `ocrExtractor.ts`        | Full image pipeline: text path → vision → heuristics      |
| `ingestFiles.ts`         | Top-level multi-file ingest                               |
| `llmAnomalyExplainer.ts` | Board-language anomaly explanations                       |

### Supported file types (actual)

| Type                                              | Support                                       |
| ------------------------------------------------- | --------------------------------------------- |
| `.csv`, `.tsv`                                    | Yes                                           |
| `.json`                                           | Yes                                           |
| `.txt`                                            | Yes                                           |
| `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic` | Yes (OCR pipeline)                            |
| `.pdf`                                            | Classified as OCR; depends on vision/OCR path |
| `.xlsx`, `.xls`                                   | **No**                                        |

### Ingest methods tracked

`csv` · `json` · `text` · `puter_llm` · `text_llm` · `vision` · `heuristic`

---

## Data & sample books

| Asset                        | Location                           | Status                                     |
| ---------------------------- | ---------------------------------- | ------------------------------------------ |
| In-memory mock dataset       | `src/lib/data/mockDataset.ts`      | **Done** - 41 txns                         |
| Bundled sample files         | `public/sample-books/`             | **Done**                                   |
| `bank_statement_q1_2026.csv` | 13 bank lines                      | **Done**                                   |
| `ledger_q1_2026.csv`         | 7 ledger lines                     | **Done**                                   |
| `p2p_transfers.json`         | 7 P2P records                      | **Done**                                   |
| `receipts.json`              | 14 receipt records                 | **Done**                                   |
| Generator script             | `scripts/generate-sample-books.ts` | **Done** - `npm run generate:sample-books` |

### Planted anomalies (demo peak moment)

1. **Duplicate payment** - `bank-006` + `p2p-002`: Staples $67.43 across sources
2. **Category mismatch** - `p2p-005`: Spotify Premium as `program_supplies`
3. **Missing documentation** - `ledger-006`: $240 Neighborhood Hardware, no corroborating receipt/bank line

`_plantedAnomaly` field on transactions is **metadata only** - detection uses rule engine, not this flag.

---

## Export (`src/lib/export/pdfReport.ts`) - **Done**

- Library: `jspdf` + `date-fns`
- Runs entirely in browser (no server PDF route)
- Sections: cover, executive summary, ledger verification, anomaly report, provenance trail (capped at 40 records), footer tagline

---

## Tests

| Command               | File             | Coverage                              |
| --------------------- | ---------------- | ------------------------------------- |
| `npm run test:engine` | `testHarness.ts` | Anomaly detection on mock dataset     |
| `npm run test:swarm`  | `testSwarm.ts`   | Full orchestrator + human-review flag |
| `npm run lint`        | ESLint           | Static analysis                       |

**Not present:** Jest/Vitest unit tests, Playwright e2e, API route tests, ingestion parser tests, CI workflow in repo.

---

## Environment & configuration

From `.env.example`:

| Variable            | Required for                                           | Default                                     |
| ------------------- | ------------------------------------------------------ | ------------------------------------------- |
| `GROQ_API_KEY`      | Image text structuring, board explain, vision fallback | -                                           |
| `LLM_PROVIDER`      | Force `groq` or `anthropic`                            | Auto-detect from keys                       |
| `GROQ_TEXT_MODEL`   | OCR text → JSON                                        | `llama-3.1-8b-instant`                      |
| `GROQ_VISION_MODEL` | Image vision fallback                                  | `meta-llama/llama-4-scout-17b-16e-instruct` |
| `ANTHROPIC_API_KEY` | Higher-quality vision fallback                         | -                                           |
| `ANTHROPIC_MODEL`   | Vision                                                 | `claude-sonnet-4-20250514`                  |

**Works without any API key:** CSV/JSON sample books, full swarm on mock data, deterministic matching/anomalies, PDF export, landing page.

**Puter OCR:** Browser-only; no server key.

---

## Deployment & DevOps - **Done**

| Item                     | Status                                                                |
| ------------------------ | --------------------------------------------------------------------- |
| Vercel deployment        | [ledgerline-cyan.vercel.app](https://ledgerline-cyan.vercel.app/)     |
| `vercel.json`            | `iad1` region, standard Next.js build                                 |
| GitHub repo              | [shaileshdev4/ledgerline](https://github.com/shaileshdev4/ledgerline) |
| `scripts/git-publish.sh` | Maintainer publish helper                                             |
| MIT `LICENSE`            | **Done**                                                              |
| `AGENTS.md`              | Project guide for AI assistants                                       |

**Stack:** Next.js 16, React 19, TypeScript, Node ≥ 20.

---

## Submission deliverables (§0.4) - hackathon packaging

| Deliverable                        | Status          | Notes                                                                             |
| ---------------------------------- | --------------- | --------------------------------------------------------------------------------- |
| Demo video (3 min, cinematic peak) | **Not started** | Spec script in §2.6; landing UI previews peak flags but no recorded video in repo |
| Source code that runs              | **Done**        | Deployed + README quick start                                                     |
| Writeup / documentation            | **Partial**     | README + this file; missing judge-targeted architecture essay with cited sources  |
| Supplementary (deck, brand kit)    | **Not started** | -                                                                                 |
| Opening ceremony attendance        | **N/A**         | Event logistics, not code                                                         |

---

## Known gaps, risks & deviations

### Not implemented (from spec)

1. **`round_number` anomaly class** - mentioned in §2.9 taxonomy; never added to types or engine
2. **Bounded Matcher↔Skeptic re-match loop** (max 2 rounds, hand back with reason) - Skeptic only drops weak matches
3. **Native Excel (`.xlsx`) ingestion** - landing marketing mentions it; parser does not exist
4. **True folder drop** - multi-file only
5. **LLM-based Matcher/Skeptic debate** - replaced with deterministic scoring (stronger “code verifies,” weaker “agent argues”)
6. **Full ledger balance enforcement** - totals computed but not balanced against a chart of accounts
7. **Pre-cached demo mode + labeled live encore** - sample shortcut exists (GET ingest) but not UX-labeled per §2.15
8. **Architecture diagram / MCP-A2A writeup artifact** in repo
9. **Demo video**
10. **Multiple duplicate anomalies** - `detectAnomalies()` dedupes to one per type

### Partial / simplified (acceptable for hackathon)

- GET `/api/ingest` returns mock memory instead of parsing bundled files (DropZone “Load sample books” does parse real files via POST)
- Board text explanation is optional LLM sugar on top of deterministic explanations
- `framer-motion` listed in dependencies but unused
- Tailwind in toolchain; UI is mostly custom CSS + inline styles

### Local workspace note

The parent folder `Ledgerline_Project_Spec.md` and some local `ledgerline/` copies have suffered **null-byte file corruption**. **Canonical source is GitHub `main`** (verified via `git show HEAD:...`). If local files read as empty, clone fresh or run `scripts/recover-from-transcript.mjs`.

---

## How to verify everything works

```bash
git clone https://github.com/shaileshdev4/ledgerline.git
cd ledgerline
npm install
cp .env.example .env.local   # optional - add GROQ_API_KEY for image OCR

npm run test:engine        # expect: 3 anomalies, 41 transactions
npm run test:swarm         # expect: swarm E2E pass
npm run build              # production build
npm run dev                # http://localhost:3000
```

**Manual demo path:**

1. Open `/audit`
2. Click **Load sample books** (runs real ingest on 4 files in `public/sample-books/`)
3. Click **Run Reconciliation** - watch agent trace animate
4. Confirm 3 anomalies in right panel
5. Click **Export PDF**

**With API key:** Upload receipt/P2P **images** to exercise Puter OCR → Groq structuring pipeline.

---

## Priority backlog (to close spec gaps)

| Priority        | Item                                                         | Effort |
| --------------- | ------------------------------------------------------------ | ------ |
| P0 (submission) | Record 3-minute demo video per §2.6 script                   | Medium |
| P0 (submission) | Architecture writeup + diagram (MCP/A2A framing)             | Medium |
| P1              | Add `round_number` anomaly check                             | Small  |
| P1              | Implement bounded Skeptic→Matcher re-match loop              | Medium |
| P2              | `.xlsx` parser (e.g. `sheetjs`)                              | Medium |
| P2              | True balance verification across sources                     | Large  |
| P3              | Jest tests for parsers + engine edge cases                   | Medium |
| P3              | CI (GitHub Actions) running test:engine + test:swarm + build | Small  |

---

## Related documents

| Document                      | Location                        | Notes                                                                                     |
| ----------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| Master build spec (Project 2) | `../Ledgerline_Project_Spec.md` | **Local copy may be corrupted**; recover from Cursor history `6021a8a5/FwC3.md` if needed |
| README                        | `README.md`                     | Setup, deploy, architecture summary                                                       |
| Agent guide                   | `AGENTS.md`                     | For AI coding assistants                                                                  |

---

_This file should be updated whenever a spec checklist item ships or a deliberate deviation is introduced._
