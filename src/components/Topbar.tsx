'use client';

import { HiArrowDownTray, HiFolderPlus, HiPlay } from 'react-icons/hi2';
import { BrandMark } from './BrandMark';

type RunState = 'idle' | 'running' | 'done';

export function Topbar({
  org,
  period,
  runState,
  onRun,
  onNewBooks,
  onExportPdf,
  showRun = true,
  canRun = true,
}: {
  org: string;
  period: string;
  runState: RunState;
  onRun: () => void;
  onNewBooks?: () => void;
  onExportPdf?: () => void;
  showRun?: boolean;
  canRun?: boolean;
}) {
  return (
    <header className="topbar">
      <BrandMark size={28} href="/" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="topbar-org">{org} · {period}</div>

        {onNewBooks && (
          <button
            type="button"
            onClick={onNewBooks}
            disabled={runState === 'running'}
            className="topbar-ghost-btn"
          >
            <HiFolderPlus size={14} aria-hidden />
            New books
          </button>
        )}

        {onExportPdf && (
          <button type="button" onClick={onExportPdf} className="topbar-ghost-btn topbar-export-btn">
            <HiArrowDownTray size={14} aria-hidden />
            Export PDF
          </button>
        )}

        {showRun && (
          <button
            onClick={onRun}
            disabled={runState === 'running' || !canRun}
            className={`topbar-run-btn${runState === 'done' ? ' is-done' : ''}`}
          >
            <span
              className="topbar-run-dot"
              style={{
                animation: runState === 'running' ? 'pulse-opacity 0.9s ease-in-out infinite' : 'none',
              }}
            />
            {runState !== 'running' && <HiPlay size={12} aria-hidden />}
            {runState === 'idle' ? 'Run Reconciliation' : runState === 'running' ? 'Running…' : 'Run Again'}
          </button>
        )}
      </div>
    </header>
  );
}
