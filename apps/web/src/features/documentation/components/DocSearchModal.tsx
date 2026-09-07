'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, ArrowRight, CornerDownLeft } from 'lucide-react';
import { ALL_DOC_SECTIONS, DOC_CATEGORIES } from '../data';

export interface DocSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (id: string) => void;
  language: 'id' | 'en';
}

export function DocSearchModal({
  isOpen,
  onClose,
  onSelectSection,
  language,
}: DocSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isId = language === 'id';

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredResults = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return ALL_DOC_SECTIONS.slice(0, 6);
    }
    return ALL_DOC_SECTIONS.filter((sec) => {
      const title = (isId ? sec.titleId : sec.titleEn).toLowerCase();
      const summary = (isId ? sec.summaryId || '' : sec.summaryEn || '').toLowerCase();
      const content = (isId ? sec.contentId || '' : sec.contentEn || '').toLowerCase();
      return title.includes(q) || summary.includes(q) || content.includes(q);
    }).slice(0, 10);
  }, [query, isId]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          onSelectSection(filteredResults[selectedIndex].id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose, onSelectSection]);

  if (!isOpen) return null;

  const getCategoryTitle = (sectionId: string) => {
    for (const cat of DOC_CATEGORIES) {
      if (cat.sections.some((s) => s.id === sectionId)) {
        return isId ? cat.titleId : cat.titleEn;
      }
    }
    return 'Documentation';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: '14px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={18} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isId ? 'Cari di seluruh dokumentasi...' : 'Search all documentation...'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--text-primary)',
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          ) : (
            <kbd
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {filteredResults.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13.5px',
              }}
            >
              {isId
                ? `Tidak ada hasil yang ditemukan untuk "${query}"`
                : `No results found for "${query}"`}
            </div>
          ) : (
            filteredResults.map((sec, idx) => {
              const isSelected = idx === selectedIndex;
              const catTitle = getCategoryTitle(sec.id);
              const title = isId ? sec.titleId : sec.titleEn;
              const summary = isId ? sec.summaryId : sec.summaryEn;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    onSelectSection(sec.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected
                      ? 'var(--brand-primary)'
                      : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
                    <BookOpen
                      size={16}
                      style={{
                        marginTop: '3px',
                        flexShrink: 0,
                        color: isSelected ? '#FFFFFF' : 'var(--brand-primary)',
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {title}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 500,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isSelected
                              ? 'rgba(255, 255, 255, 0.2)'
                              : 'var(--bg-subtle)',
                            color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                          }}
                        >
                          {catTitle}
                        </span>
                      </div>
                      {summary && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: isSelected ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {summary}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: '12px', flexShrink: 0 }}>
                    {isSelected ? (
                      <CornerDownLeft size={14} style={{ color: '#FFFFFF' }} />
                    ) : (
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span>↑↓ {isId ? 'Navigasi' : 'Navigate'}</span>
            <span>↵ {isId ? 'Pilih' : 'Select'}</span>
            <span>ESC {isId ? 'Tutup' : 'Close'}</span>
          </div>
          <span>Anticeil Docs Engine</span>
        </div>
      </div>
    </div>
  );
}
