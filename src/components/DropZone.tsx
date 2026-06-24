'use client';

import { useCallback, useRef, useState } from 'react';
import {
  HiBuildingLibrary,
  HiDevicePhoneMobile,
  HiDocumentText,
  HiFolderOpen,
  HiTableCells,
} from 'react-icons/hi2';
import type { IconType } from 'react-icons';
import { classifyFile } from '@/lib/ingestion/classifyFile';
import { extractTextWithPuter, isImageUpload } from '@/lib/ingestion/puterOcr';
import { Transaction, TransactionSource } from '@/types';

const ACCEPTED = '.csv,.tsv,.json,.txt,.jpg,.jpeg,.png,.webp,.pdf';

const FILE_TYPES: { icon: IconType; label: string; hint: string }[] = [
  { icon: HiBuildingLibrary, label: 'Bank CSV', hint: 'bank_statement.csv' },
  { icon: HiDocumentText, label: 'Receipts', hint: 'photos or receipts.json' },
  { icon: HiDevicePhoneMobile, label: 'P2P screenshots', hint: 'Venmo / Zelle images or JSON' },
  { icon: HiTableCells, label: 'Ledger sheet', hint: 'ledger.csv or spreadsheet export' },
];

export interface IngestSummary {
  filesProcessed: { name: string; source: string; count: number; method: string }[];
  warnings: string[];
  totalCount: number;
}

interface DropZoneProps {
  organizationName: string;
  period: string;
  onOrganizationNameChange: (v: string) => void;
  onPeriodChange: (v: string) => void;
  onIngested: (transactions: Transaction[], summary: IngestSummary) => void;
  loading?: boolean;
}

export function DropZone({
  organizationName,
  period,
  onOrganizationNameChange,
  onPeriodChange,
  onIngested,
  loading = false,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setIngesting(true);
    setError(null);

    try {
      const formData = new FormData();
      const ocrTexts: {
        name: string;
        source: TransactionSource;
        text: string;
        ocrProvider: 'puter';
      }[] = [];

      for (const file of list) {
        if (isImageUpload(file)) {
          setStatus(`Puter OCR: ${file.name}`);
          const classified = classifyFile(file.name, file.type || 'application/octet-stream');
          const source = classified?.source ?? 'receipt_image';
          const text = await extractTextWithPuter(file);
          ocrTexts.push({ name: file.name, source, text, ocrProvider: 'puter' });
          formData.append('files', file);
        } else {
          formData.append('files', file);
        }
      }

      if (ocrTexts.length > 0) {
        formData.append('ocrTexts', JSON.stringify(ocrTexts));
      }

      setStatus('Structuring transactions...');

      const res = await fetch('/api/ingest', { method: 'POST', body: formData });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error ?? 'Ingestion failed');
      }

      onIngested(data.transactions, {
        filesProcessed: data.filesProcessed,
        warnings: data.warnings ?? [],
        totalCount: data.totalCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus(null);
    } finally {
      setIngesting(false);
    }
  }, [onIngested]);

  const loadSampleBooks = useCallback(async () => {
    setIngesting(true);
    setError(null);
    setStatus('Loading sample books…');

    try {
      const names = [
        'bank_statement_q1_2026.csv',
        'ledger_q1_2026.csv',
        'p2p_transfers.json',
        'receipts.json',
      ];

      const files = await Promise.all(
        names.map(async (name) => {
          const res = await fetch(`/sample-books/${name}`);
          if (!res.ok) throw new Error(`Missing sample file: ${name}`);
          const blob = await res.blob();
          return new File([blob], name, { type: blob.type || 'application/octet-stream' });
        })
      );

      await uploadFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sample books');
      setStatus(null);
      setIngesting(false);
    }
  }, [uploadFiles]);

  const busy = loading || ingesting;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      overflowY: 'auto',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Org settings */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>Organization</span>
            <input
              value={organizationName}
              onChange={(e) => onOrganizationNameChange(e.target.value)}
              disabled={busy}
              style={inputStyle}
              placeholder="Youth Code Foundation"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>Period</span>
            <input
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              disabled={busy}
              style={inputStyle}
              placeholder="Q1 2026"
            />
          </label>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!busy && e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
          }}
          onClick={() => !busy && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--blue)' : 'var(--border-mid)'}`,
            borderRadius: 10,
            padding: '40px 28px',
            textAlign: 'center',
            cursor: busy ? 'not-allowed' : 'pointer',
            background: dragOver ? 'var(--blue-bg)' : 'var(--bg-mid)',
            transition: 'border-color 0.2s, background 0.2s',
            opacity: busy ? 0.7 : 1,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 12,
            opacity: 0.35,
            color: 'var(--ink-dim)',
          }}>
            <HiFolderOpen size={28} />
          </div>

          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
            Drop your books here
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.5, marginBottom: 16 }}>
            Receipt photos, bank CSV, P2P screenshots, ledger spreadsheet — mixed folders welcome.
            Images are OCR&apos;d in-browser via Puter.
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginTop: 8,
          }}>
            {FILE_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} style={{
                  padding: '10px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  fontSize: 10,
                  color: 'var(--ink-dim)',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: 4,
                    color: 'var(--ink-mid)',
                  }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--ink-mid)', marginBottom: 2 }}>{t.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-ghost)' }}>{t.hint}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); loadSampleBooks(); }}
            disabled={busy}
            style={secondaryBtn}
          >
            Load sample books
          </button>
          <a
            href="/sample-books/bank_statement_q1_2026.csv"
            download
            onClick={(e) => e.stopPropagation()}
            style={{ ...secondaryBtn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            Download sample pack
          </a>
        </div>

        {status && (
          <p style={{
            marginTop: 14,
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--blue)',
            animation: 'pulse-opacity 1.2s ease-in-out infinite',
          }}>
            {status}
          </p>
        )}

        {error && (
          <p style={{
            marginTop: 14,
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--red)',
            lineHeight: 1.5,
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--ink-dim)',
};

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  padding: '8px 12px',
  borderRadius: 5,
  border: '1px solid var(--border-mid)',
  background: 'var(--bg-mid)',
  color: 'var(--ink)',
};

const secondaryBtn: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 500,
  padding: '8px 16px',
  borderRadius: 5,
  border: '1px solid var(--border-mid)',
  background: 'var(--bg-mid)',
  color: 'var(--ink-mid)',
  cursor: 'pointer',
};
