'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Table,
  Presentation,
  Copy,
  Check,
  ArrowRight,
  Download,
  FileCode,
  Archive,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { DocFormat, DocItem } from '../../store/useDocsStore';
import { getFormatMeta } from '../../utils/docFormatUtils';
import {
  downloadDocSource,
  downloadDocZip,
  printOrSavePdf,
  getDocFileExtension,
} from '../../utils/docDownloadUtils';

export interface InteractiveDocCardProps {
  doc: {
    id?: string;
    title: string;
    format: DocFormat;
    content?: string;
    files?: Array<{ id: string; name: string; content: string; isMain?: boolean }>;
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
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

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

  // Close download menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    }
    if (isDownloadMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDownloadMenuOpen]);

  const docItem = doc as unknown as DocItem;
  const ext = getDocFileExtension(format);

  const handleDownloadPdfAction = () => {
    printOrSavePdf(docItem);
    setIsDownloadMenuOpen(false);
  };

  const handleDownloadSourceAction = () => {
    downloadDocSource(docItem);
    setIsDownloadMenuOpen(false);
  };

  const handleDownloadZipAction = () => {
    downloadDocZip(docItem);
    setIsDownloadMenuOpen(false);
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

        {/* Action Buttons — Download Preview & Open in Editor */}
        <div
          style={{
            marginTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left / Download Dropdown Menu */}
          <div style={{ position: 'relative' }} ref={downloadMenuRef}>
            <button
              type="button"
              onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
            >
              <Download size={13} color="var(--brand-primary, #0073EA)" />
              <span>{language === 'id' ? 'Download Hasil' : 'Download Output'}</span>
              <ChevronDown size={11} color="var(--text-muted)" />
            </button>

            {isDownloadMenuOpen && (
              <div
                className="animate-fade-in"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: 0,
                  width: '210px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                  padding: '5px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {/* 1. PDF / Print Option */}
                <button
                  type="button"
                  onClick={handleDownloadPdfAction}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 9px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Printer size={13} color="var(--brand-primary, #0073EA)" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{language === 'id' ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Kompilasi preview ke PDF' : 'Compiled PDF document'}
                    </div>
                  </div>
                </button>

                {/* 2. Source File Option */}
                <button
                  type="button"
                  onClick={handleDownloadSourceAction}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 9px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FileCode size={13} color="var(--brand-secondary, #8B5CF6)" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{language === 'id' ? `File Sumber (.${ext})` : `Source File (.${ext})`}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'File kode utama' : 'Primary code file'}
                    </div>
                  </div>
                </button>

                {/* 3. ZIP Full Bundle Option */}
                <button
                  type="button"
                  onClick={handleDownloadZipAction}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 9px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Archive size={13} color="var(--accent-success, #10B981)" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{language === 'id' ? 'Proyek ZIP (.zip)' : 'Project ZIP (.zip)'}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Semua berkas & modul' : 'All sub-files & assets'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Right / Open in Code Editor Button */}
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
                ? 'Buka di Code Editor'
                : 'Open in Code Editor'}
            </span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
