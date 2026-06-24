"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  HiArrowRight,
  HiBolt,
  HiCheckBadge,
  HiDocumentMagnifyingGlass,
  HiShieldCheck,
} from "react-icons/hi2";
import { BrandMark } from "../BrandMark";
import { Logo } from "../Logo";

const PEAK_FLAGS = [
  {
    type: "Duplicate payment",
    detail: "Same $67.43 Staples charge — receipt and Venmo reimbursement, three minutes apart.",
    confidence: "94%",
  },
  {
    type: "Category mismatch",
    detail: "Spotify Premium filed under program supplies. Personal subscription, not a program expense.",
    confidence: "91%",
  },
  {
    type: "Missing documentation",
    detail: "$240 ledger entry with no matching receipt or bank line above the documentation threshold.",
    confidence: "88%",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Drop the shoebox",
    body: "Bank CSV, receipt photos, Venmo screenshots, treasurer spreadsheet — one folder, four sources, zero manual entry.",
  },
  {
    n: "02",
    title: "Watch the swarm argue",
    body: "Ingestion parses. Matcher proposes pairs. Skeptic challenges weak matches. You see every handoff — not a black box.",
  },
  {
    n: "03",
    title: "Export the trail",
    body: "Anomalies in plain English. Ledger math recomputed in code. One click to a board-ready PDF with full provenance.",
  },
];

const AGENTS = [
  { name: "Ingestion", role: "OCR + CSV → clean transactions", color: "var(--ing)" },
  { name: "Matcher", role: "Cross-source pairs + confidence", color: "var(--mat)" },
  { name: "Skeptic", role: "Challenges matches, runs anomaly taxonomy", color: "var(--sk)" },
  { name: "Reconciler", role: "Deterministic ledger verification", color: "var(--rec)" },
];

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal${visible ? " is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function ProductMock() {
  return (
    <div className="landing-mock" aria-hidden>
      <div className="landing-mock-chrome">
        <BrandMark size={22} href={null} showTagline={false} />
        <span className="landing-mock-pill">Q1 2026 · Reconciling</span>
      </div>
      <div className="landing-mock-lanes">
        {["Ingestion", "Matcher", "Skeptic", "Reconciler"].map((name, i) => (
          <div key={name} className="landing-mock-lane">
            <span className="landing-mock-dot" style={{ animationDelay: `${i * 0.4}s` }} />
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="landing-mock-trace">
        <div className="landing-mock-line landing-mock-line--ing">
          Parsed 41 transactions from 4 sources
        </div>
        <div className="landing-mock-line landing-mock-line--mat">
          Proposed match: Office Depot $89.99 · 97% confidence
        </div>
        <div className="landing-mock-line landing-mock-line--sk landing-mock-line--alert">
          Challenge: Costco amount mismatch — re-scoring
        </div>
        <div className="landing-mock-line landing-mock-line--sk landing-mock-line--flag">
          Flagged: duplicate payment · Staples $67.43
        </div>
        <div className="landing-mock-line landing-mock-line--rec">
          Ledger verified · $14,599.51 · 3 anomalies
        </div>
      </div>
      <div className="landing-mock-glow" />
    </div>
  );
}

export function LandingPage() {
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeroReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="landing-root">
      <div className="landing-pattern" aria-hidden />
      <div className="landing-grain" aria-hidden />
      <div className="landing-aurora" aria-hidden />

      <header className="landing-nav">
        <BrandMark size={30} href="/" />
        <nav className="landing-nav-links">
          <a href="#problem">Problem</a>
          <a href="#how-it-works">How it works</a>
          <a href="#swarm">Swarm</a>
        </nav>
        <Link href="/audit" className="landing-cta-nav">
          Open app
          <HiArrowRight size={14} />
        </Link>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className={`landing-hero-grid ${heroReady ? "is-visible" : ""}`}>
          <div className="landing-hero-copy">
            <p className="landing-kicker">Audit reconciliation for messy nonprofit books</p>

            <h1 className="landing-headline">
              The books are a mess.
              <br />
              The filing deadline <em>isn&apos;t</em>.
            </h1>

            <p className="landing-lede">
              Ledgerline runs a swarm of specialist agents on your real sources — receipt
              photos, P2P screenshots, bank CSV, chaotic spreadsheet — and reconciles them
              with an auditor-grade trail.{" "}
              <strong>AI proposes. Code verifies.</strong>
            </p>

            <div className="landing-hero-actions">
              <Link href="/audit" className="landing-cta-primary">
                Start reconciliation — free
                <HiArrowRight size={16} />
              </Link>
              <a href="#peak" className="landing-cta-ghost">
                See what it catches
              </a>
            </div>

            <div className="landing-stats">
              <div>
                <strong>4</strong>
                <span>agent roles</span>
              </div>
              <div>
                <strong>4</strong>
                <span>source types</span>
              </div>
              <div>
                <strong>0</strong>
                <span>trusted LLM math</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-visual">
            <ProductMock />
          </div>
        </section>

        {/* ── Problem ────────────────────────────────────────────────── */}
        <section id="problem" className="landing-section landing-problem">
          <Reveal>
            <p className="landing-kicker">The gap nobody builds for</p>
            <h2 className="landing-section-title">
              Budgeting apps categorize.
              <br />
              Ledgerline <em>reconciles</em>.
            </h2>
          </Reveal>

          <div className="landing-problem-grid">
            <Reveal delay={80}>
              <div className="landing-problem-copy">
                <p>
                  QuickBooks assumes clean entry. Monarch assumes one linked account.
                  Neither ingests a folder of Venmo screenshots and asks:{" "}
                  <em>does this actually match the ledger?</em>
                </p>
                <p>
                  Small nonprofits — youth clubs, community orgs, volunteer-run 501(c)(3)s —
                  keep books across four sources that never talk to each other. At year-end,
                  someone spends nights matching receipts by hand.
                </p>
                <blockquote className="landing-pullquote">
                  &ldquo;We need reconciliation, not another pie chart.&rdquo;
                </blockquote>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="landing-problem-visual">
                <div className="chaos-stack">
                  {["bank_statement.csv", "receipt_scan.jpg", "venmo_feb.png", "ledger_v3.xlsx"].map(
                    (f, i) => (
                      <div key={f} className="chaos-file" style={{ ["--i" as string]: i }}>
                        {f}
                      </div>
                    ),
                  )}
                </div>
                <div className="chaos-arrow">
                  <HiArrowRight size={28} />
                </div>
                <div className="chaos-result">
                  <Logo size={32} />
                  <span>One trail. Every decision proven.</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Peak moment ────────────────────────────────────────────── */}
        <section id="peak" className="landing-section landing-peak">
          <Reveal>
            <p className="landing-kicker landing-kicker--red">The forensic catch</p>
            <h2 className="landing-section-title">
              It finds what a tired treasurer would miss.
            </h2>
            <p className="landing-peak-lede">
              Three concrete anomaly classes — not vibes. Each flag ships with evidence,
              confidence, and a recommended action your board can act on.
            </p>
          </Reveal>

          <div className="landing-peak-grid">
            {PEAK_FLAGS.map((flag, i) => (
              <Reveal key={flag.type} delay={i * 100}>
                <article className="landing-peak-card">
                  <div className="landing-peak-card-head">
                    <span>{flag.type}</span>
                    <span className="landing-peak-conf">{flag.confidence}</span>
                  </div>
                  <p>{flag.detail}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────── */}
        <section id="how-it-works" className="landing-section landing-steps">
          <Reveal>
            <p className="landing-kicker">How it works</p>
            <h2 className="landing-section-title">Three steps. One reconciled ledger.</h2>
          </Reveal>

          <div className="landing-steps-grid">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <article className="landing-step">
                  <span className="landing-step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Swarm ──────────────────────────────────────────────────── */}
        <section id="swarm" className="landing-section landing-agents">
          <Reveal>
            <p className="landing-kicker">Architecture</p>
            <h2 className="landing-section-title">
              A swarm that argues — not a chatbot that guesses.
            </h2>
            <p className="landing-agents-lede">
              Four role-specialized agents with explicit handoffs. The Matcher proposes;
              the Skeptic challenges; the Reconciler never trusts AI for arithmetic.
              Every decision logged with provenance.
            </p>
          </Reveal>

          <div className="landing-agents-grid">
            {AGENTS.map((a, i) => (
              <Reveal key={a.name} delay={i * 70}>
                <div className="landing-agent-card">
                  <span className="landing-agent-dot" style={{ background: a.color }} />
                  <h3>{a.name}</h3>
                  <p>{a.role}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="landing-principles">
              <div>
                <HiShieldCheck size={18} />
                <span>Deterministic ledger backstop</span>
              </div>
              <div>
                <HiBolt size={18} />
                <span>Live agent trace playback</span>
              </div>
              <div>
                <HiDocumentMagnifyingGlass size={18} />
                <span>Board-ready PDF export</span>
              </div>
              <div>
                <HiCheckBadge size={18} />
                <span>Fixed anomaly taxonomy</span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────── */}
        <section className="landing-final-cta">
          <Reveal>
            <Logo size={48} />
            <h2>Your books are already messy enough.</h2>
            <p>
              Load our sample nonprofit dataset or upload your own.
              <br />
              No account. No bank linking. Just reconciliation.
            </p>
            <Link href="/audit" className="landing-cta-primary landing-cta-primary--large">
              Open Ledgerline
              <HiArrowRight size={18} />
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="landing-footer">
        <BrandMark size={22} href="/" />
        <span>AI proposes — code verifies.</span>
      </footer>
    </div>
  );
}
