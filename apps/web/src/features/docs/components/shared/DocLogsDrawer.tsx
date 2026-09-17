'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DocDiagnostic, LintResult } from '../../utils/docLinter';

export type LogTabType = 'all' | 'errors' | 'warnings' | 'info';

export interface DocLogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lintResults: LintResult;
  language?: 'id' | 'en';
  onJumpToLine?: (line: number, fileName?: string) => void;
  onSendSingleToAI?: (diagnostic: DocDiagnostic) => void;
  onSendAllToAI?: () => void;
}

export function DocLogsDrawer({
  isOpen,
  onClose,
  lintResults,
  language = 'id',
  onJumpToLine,
  onSendSingleToAI,
  onSendAllToAI,
}: DocLogsDrawerProps) {
  const [activeLogTab, setActiveLogTab] = useState<LogTabType>('all');

  if (!isOpen) return null;

  const tabs: Array<{ id: LogTabType; label: string; count: number; color?: string }> = [
    { id: 'all', label: language === 'id' ? 'Semua' : 'All', count: lintResults.totalLogs },
    { id: 'errors', label: 'Errors', count: lintResults.errors.length, color: '#EF4444' },
    { id: 'warnings', label: 'Warnings', count: lintResults.warnings.length, color: '#F59E0B' },
    { id: 'info', label: 'Info', count: lintResults.infos.length, color: 'var(--brand-primary)' },
  ];

  const displayedDiagnostics =
    activeLogTab === 'errors'
      ? lintResults.errors
      : activeLogTab === 'warnings'
      ? lintResults.warnings
      : activeLogTab === 'info'
      ? lintResults.infos
      : [...lintResults.errors, ...lintResults.warnings, ...lintResults.infos];

  return (
    <div
      style={{
        maxHeight: '260px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        padding: '10px 12px',
        zIndex: 20,
        boxSizing: 'border-box',
        width: '100%',
        flexShrink: 0,
      }}
    >
      {/* Filter Tabs Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          marginBottom: '8px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLogTab(tab.id)}
              style={{
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: activeLogTab === tab.id ? 700 : 500,
                backgroundColor: activeLogTab === tab.id ? 'var(--bg-subtle)' : 'transparent',
                border: `1px solid ${activeLogTab === tab.id ? 'var(--border-strong)' : 'transparent'}`,
                color: activeLogTab === tab.id ? tab.color || 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '0 4px',
                  borderRadius: '10px',
                  backgroundColor: activeLogTab === tab.id ? 'var(--border-subtle)' : 'rgba(0,0,0,0.05)',
                  color: tab.color || 'inherit',
                  fontWeight: 650,
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {lintResults.totalLogs > 0 && onSendAllToAI && (
            <button
              type="button"
              onClick={onSendAllToAI}
              style={{
                padding: '3px 9px',
                borderRadius: '5px',
                backgroundColor: 'rgba(0, 115, 234, 0.12)',
                border: '1px solid rgba(0, 115, 234, 0.3)',
                color: 'var(--brand-primary)',
                fontSize: '11px',
                fontWeight: 650,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
              title={
                language === 'id'
                  ? 'Kirim seluruh log output ke Author Agent untuk perbaikan otomatis'
                  : 'Send all output logs to Author Agent'
              }
            >
              <Sparkles size={12} />
              <span>{language === 'id' ? 'Kirim Semua Log ke AI' : 'Send All Logs to AI'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
            title={language === 'id' ? 'Tutup Panel' : 'Close Panel'}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Diagnostics List */}
      {displayedDiagnostics.length === 0 ? (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#10B981',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <CheckCircle2 size={15} color="#10B981" />
          <span>
            {language === 'id'
              ? 'Tidak ada masalah ditemukan. Dokumen bersih!'
              : 'No issues found. Document is clean!'}
          </span>
        </div>
      ) : (
        displayedDiagnostics.map((d, index) => (
          <div
            key={d.id ? `${d.id}_${index}` : `${d.fileName || 'file'}_${d.line}_${d.type}_${index}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '8px 10px',
              borderRadius: '6px',
              backgroundColor:
                d.type === 'error'
                  ? 'rgba(239, 68, 68, 0.08)'
                  : d.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.08)'
                  : 'var(--bg-subtle)',
              border: `1px solid ${
                d.type === 'error'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : d.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'var(--border-subtle)'
              }`,
              borderLeft: `3px solid ${
                d.type === 'error' ? '#EF4444' : d.type === 'warning' ? '#F59E0B' : 'var(--brand-primary)'
              }`,
              marginBottom: '6px',
              gap: '6px',
              boxSizing: 'border-box',
              width: '100%',
              minWidth: 0,
            }}
          >
            {/* Card Top Row: Badge + Location + Quick Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color:
                      d.type === 'error'
                        ? '#EF4444'
                        : d.type === 'warning'
                        ? '#F59E0B'
                        : 'var(--brand-primary)',
                    backgroundColor:
                      d.type === 'error'
                        ? 'rgba(239, 68, 68, 0.12)'
                        : d.type === 'warning'
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(0, 115, 234, 0.12)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}
                >
                  {d.type}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Baris {d.line} ({d.fileName || 'main.tex'})
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, flexWrap: 'wrap' }}>
                {onJumpToLine && (
                  <button
                    type="button"
                    onClick={() => onJumpToLine(d.line, d.fileName)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    className="hover-subtle"
                  >
                    {language === 'id' ? 'Lompat ke Baris' : 'Jump to Line'}
                  </button>
                )}
                {onSendSingleToAI && (
                  <button
                    type="button"
                    onClick={() => onSendSingleToAI(d)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 115, 234, 0.12)',
                      border: '1px solid rgba(0, 115, 234, 0.3)',
                      color: 'var(--brand-primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Sparkles size={11} />
                    <span>{language === 'id' ? 'Kirim ke AI' : 'Send to AI'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card Body: Full width message and suggestion */}
            <div style={{ width: '100%', minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  lineHeight: '1.45',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                {d.message}
              </div>
              {d.suggestion && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: '1px dashed var(--border-subtle)',
                  }}
                >
                  💡 {d.suggestion}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
