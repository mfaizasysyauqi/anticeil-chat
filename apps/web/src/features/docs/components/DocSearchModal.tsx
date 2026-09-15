'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  FileCode,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { DocItem, useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface DocSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocItem | null;
  onSelectResult?: (fileId: string, line: number) => void;
}

interface SearchMatch {
  fileId: string;
  fileName: string;
  line: number;
  snippet: string;
  matchStart: number;
  matchLength: number;
}

export function DocSearchModal({ isOpen, onClose, doc, onSelectResult }: DocSearchModalProps) {
  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));
  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);

  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!doc || !query.trim()) return [];

    const files =
      doc.files && doc.files.length > 0
        ? doc.files
        : [{ id: 'main', name: 'main', content: doc.content || '' }];

    const matches: SearchMatch[] = [];

    let pattern: RegExp | null = null;
    try {
      if (isRegex) {
        pattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const src = wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(src, caseSensitive ? 'g' : 'gi');
      }
    } catch {
      return [];
    }

    for (const file of files) {
      const lines = (file.content || '').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        pattern.lastIndex = 0;
        const match = pattern.exec(lineText);
        if (match) {
          matches.push({
            fileId: file.id,
            fileName: file.name,
            line: i + 1,
            snippet: lineText.trim(),
            matchStart: match.index,
            matchLength: match[0].length,
          });
        }
      }
    }

    return matches.slice(0, 100);
  }, [doc, query, caseSensitive, wholeWord, isRegex]);

  // Handle Result Selection
  const handleSelect = (match: SearchMatch) => {
    if (!doc) return;
    setActiveFileId(doc.id, match.fileId);
    if (onSelectResult) {
      onSelectResult(match.fileId, match.line);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((idx) => Math.min(searchResults.length - 1, idx + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx) => Math.max(0, idx - 1));
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(searchResults[selectedIndex]);
    }
  };

  if (!isOpen || !doc) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 16px 16px',
        animation: 'docs-fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: 'var(--bg-surface, #131722)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Search size={18} style={{ color: '#3B82F6', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder={language === 'id' ? 'Cari teks di seluruh berkas proyek... (Ctrl+Shift+F)' : 'Find text across all project files... (Ctrl+Shift+F)'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary, #ffffff)',
              fontSize: '14px',
              fontWeight: 500,
              outline: 'none',
            }}
          />

          {/* Search Modifiers: Aa, \b, .* */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setCaseSensitive((v) => !v)}
              style={{
                padding: '3px 6px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid transparent',
                backgroundColor: caseSensitive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: caseSensitive ? '#3B82F6' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
              }}
              title="Match Case (Aa)"
            >
              Aa
            </button>
            <button
              type="button"
              onClick={() => setWholeWord((v) => !v)}
              style={{
                padding: '3px 6px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid transparent',
                backgroundColor: wholeWord ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: wholeWord ? '#3B82F6' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
              }}
              title="Match Whole Word (\b)"
            >
              \b
            </button>
            <button
              type="button"
              onClick={() => setIsRegex((v) => !v)}
              style={{
                padding: '3px 6px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid transparent',
                backgroundColor: isRegex ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: isRegex ? '#3B82F6' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
              }}
              title="Use Regular Expression (.*)"
            >
              .*
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            className="hover-subtle"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {!query.trim() ? (
            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '13px',
              }}
            >
              {language === 'id'
                ? 'Ketik kata kunci untuk mencari di seluruh berkas proyek.'
                : 'Type a query to search across all project files.'}
            </div>
          ) : searchResults.length === 0 ? (
            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '13px',
              }}
            >
              {language === 'id'
                ? `Tidak ada hasil yang cocok untuk "${query}".`
                : `No results found matching "${query}".`}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted, #94a3b8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {searchResults.length} {language === 'id' ? 'Hasil Ditemukan' : 'Matches Found'}
              </div>

              {searchResults.map((match, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${match.fileId}_${match.line}_${idx}`}
                    type="button"
                    onClick={() => handleSelect(match)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      transition: 'background-color 0.1s ease',
                    }}
                  >
                    {/* File name & Line info */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileCode size={13} style={{ color: isSelected ? '#3B82F6' : 'var(--text-muted, #94a3b8)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-primary, #ffffff)' }}>
                          {match.fileName}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#3B82F6' }}>
                        :{match.line}
                      </span>
                    </div>

                    {/* Snippet */}
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary, #cbd5e1)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        paddingLeft: '19px',
                      }}
                    >
                      {match.snippet}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted, #94a3b8)',
          }}
        >
          <span>
            {language === 'id' ? 'Gunakan ↑ ↓ untuk navigasi, Enter untuk membuka' : 'Use ↑ ↓ to navigate, Enter to select'}
          </span>
          <span>ESC {language === 'id' ? 'untuk tutup' : 'to close'}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
