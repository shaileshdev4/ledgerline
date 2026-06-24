# Ledgerline — agent notes

Standalone Next.js 16 app. No monorepo or sibling-project dependencies.

## Stack

- Next.js App Router, React 19, TypeScript
- Deterministic reconciliation engine in `src/lib/engine/`
- Multi-agent swarm in `src/lib/agents/` (in-process message bus)
- Optional vision OCR: Groq (`LLM_PROVIDER=groq`) or Anthropic

## Conventions

- Domain types live in `src/types/index.ts`
- UI uses inline styles + CSS variables in `globals.css` (ink & paper theme)
- Icons: `react-icons/hi2` — no emojis in UI
- Logo: `src/components/Logo.tsx` + `src/app/icon.svg`

## Before shipping

1. `npm run test:engine` — all 3 planted anomalies caught
2. `npm run test:swarm` — full pipeline passes
3. `npm run build`
