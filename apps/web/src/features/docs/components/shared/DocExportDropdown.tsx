'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, Archive } from 'lucide-react';
import { DocItem } from '../../store/useDocsStore';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';
import { printOrSavePdf } from '../../utils/docDownloadUtils';
import { downloadDocAsZip } from '../../utils/zipUtils';

export interface DocExportDropdownProps {
  doc: DocItem | null;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}

export function DocExportDropdown({
  doc,
  buttonClassName = 'hover-subtle',
  buttonStyle,
}: DocExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 230;
        let left = rect.left;
        if (left + menuWidth > window.innerWidth - 16) {
          left = Math.max(16, window.innerWidth - menuWidth - 16);
        }
        setPos({ top: rect.bottom + 4, left });
      }
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!doc) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '5px',
          backgroundColor: isOpen ? 'var(--bg-subtle)' : 'transparent',
          border: isOpen ? '1px solid var(--border-subtle)' : '1px solid transparent',
          color: isOpen ? 'var(--brand-primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          ...buttonStyle,
        }}
        className={buttonClassName}
        title={language === 'id' ? 'Unduh / Ekspor Dokumen' : 'Download / Export Document'}
      >
        <Download size={14} />
      </button>

      {isOpen &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              position: 'fixed',
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              width: '230px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
              padding: '5px',
              zIndex: 999999999,
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div
              style={{
                padding: '4px 8px 3px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {language === 'id' ? 'Opsi Unduh / Ekspor' : 'Download Options'}
            </div>

            {/* Option 1: PDF Export */}
            <button
              type="button"
              onClick={() => {
                printOrSavePdf(doc);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
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
                transition: 'background-color 0.12s ease',
              }}
              className="hover-subtle"
            >
              <Printer size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>
                  {language === 'id' ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {language === 'id' ? 'Kompilasi preview ke format PDF' : 'Compiled PDF output'}
                </div>
              </div>
            </button>

            {/* Option 2: Project ZIP Export */}
            <button
              type="button"
              onClick={() => {
                downloadDocAsZip(doc);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
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
                transition: 'background-color 0.12s ease',
              }}
              className="hover-subtle"
            >
              <Archive size={14} color="var(--accent-success, #10B981)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>
                  {language === 'id' ? 'Unduh Proyek ZIP (.zip)' : 'Download Project ZIP (.zip)'}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {language === 'id'
                    ? 'Semua berkas & struktur folder proyek'
                    : 'All project files & folders'}
                </div>
              </div>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
