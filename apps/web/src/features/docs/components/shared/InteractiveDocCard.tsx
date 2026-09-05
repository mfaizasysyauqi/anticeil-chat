'use client';

import React, { useState } from 'react';
import {
  FileText,
  Table,
  Presentation,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Layers,
  FileCode,
} from 'lucide-react';
import { DocFormat } from '../../store/useDocsStore';
import { getFormatMeta } from '../../utils/docFormatUtils';

export interface InteractiveDocCardProps {
  doc: {
    id?: string;
    title: string;
    format: DocFormat;
    content?: string;
  };
  onOpenEditor: () => void;
  language?: 'id' | 'en';
  isGenerating?: boolean;
}

export function InteractiveDocCard({
  doc,
  onOpenEditor,
  language = 'id',
  isGenerating = false,
}: InteractiveDocCardProps) {
  const [copied, setCopied] = useState(false);

  const format = doc.format || 'latex';
  const isSheet = format === 'sheet';
  const isSlide = format === 'slide';

  const { brandColor, bgBadge, borderBadge, formatLabel } = getFormatMeta(format, language);
  const FormatIcon = isSheet ? Table : isSlide ? Presentation : format === 'typst' ? FileCode : FileText;

  // Derive stats / outline summary
  const content = doc.content || '';
  const linesCount = content.split('\n').length;
  const slideCount = isSlide ? Math.max(1, content.split(/^---$/m).length) : 0;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const summaryPill = isSlide
    ? language === 'id'
      ? `${slideCount} Slide Terbentuk`
      : `${slideCount} Slides Generated`
    : isSheet
    ? language === 'id'
      ? `${Math.max(1, linesCount)} Baris Data`
      : `${Math.max(1, linesCount)} Data Rows`
    : language === 'id'
    ? `${wordCount} Kata • ${linesCount} Baris TeX`
    : `${wordCount} Words • ${linesCount} TeX Lines`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: '8px',
        width: '100%',
        maxWidth: '560px',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: `1px solid ${borderBadge}`,
        boxShadow: 'var(--inner-glow), 0 4px 16px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: bgBadge,
          borderBottom: `1px solid ${borderBadge}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              background: 'var(--bg-surface)',
              color: brandColor,
            }}
          >
            <FormatIcon size={12} />
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: brandColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {formatLabel}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10.5px',
              fontWeight: 600,
              color: isGenerating ? 'var(--accent-warning, #F59E0B)' : 'var(--accent-success, #10B981)',
              background: 'var(--bg-surface)',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: isGenerating ? 'var(--accent-warning, #F59E0B)' : 'var(--accent-success, #10B981)',
              }}
            />
            <span>
              {isGenerating
                ? language === 'id'
                  ? 'Menyusun...'
                  : 'Drafting...'
                : language === 'id'
                ? 'Siap di Editor'
                : 'Ready to Edit'}
            </span>
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <h4
              style={{
                fontSize: '13.5px',
                fontWeight: 650,
                color: 'var(--text-primary)',
                margin: '0 0 4px 0',
                lineHeight: 1.35,
              }}
            >
              {doc.title || (language === 'id' ? 'Dokumen Baru' : 'Untitled Document')}
            </h4>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {summaryPill}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title={language === 'id' ? 'Salin Kode' : 'Copy Content'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              color: copied ? 'var(--accent-success, #10B981)' : 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            className="hover-subtle"
          >
            {copied ? <Check size={11} color="var(--accent-success, #10B981)" /> : <Copy size={11} />}
            <span>{copied ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
          </button>
        </div>

        {/* Action Button — Open in Editor */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onOpenEditor}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: brandColor,
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 2px 8px ${bgBadge}`,
              transition: 'all 0.15s ease',
            }}
            className="hover-subtle"
          >
            <span>
              {isSheet
                ? language === 'id'
                  ? 'Buka di Spreadsheet Studio'
                  : 'Open in Spreadsheet'
                : isSlide
                ? language === 'id'
                  ? 'Buka di Slide Studio'
                  : 'Open in Slide Studio'
                : language === 'id'
                ? 'Buka di Document Editor'
                : 'Open in Document Editor'}
            </span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
