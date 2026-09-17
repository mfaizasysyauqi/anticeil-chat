'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Columns,
  Pencil,
  Sparkles,
  FileText,
  Check,
  ExternalLink,
  Maximize2,
  Eye,
} from 'lucide-react';
import { useDocsStore, DocsViewMode } from '../../store/useDocsStore';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';
import { buildDocumentPreviewHtml } from '../../utils/docPreviewBuilder';

export interface DocLayoutOptionsDropdownProps {
  mode?: 'code-editor' | 'ai-coauthor';
  compact?: boolean;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  onOpenSeparateTab?: () => void;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
}

export function DocLayoutOptionsDropdown({
  mode = 'code-editor',
  compact = false,
  buttonClassName = 'hover-subtle',
  buttonStyle,
  onOpenSeparateTab,
  onToggleFocusMode,
  isFocusMode = false,
}: DocLayoutOptionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const viewMode = useDocsStore((s) => s.viewMode);
  const setViewMode = useDocsStore((s) => s.setViewMode);
  const isCanvasOpen = useDocsStore((s) => s.isCanvasOpen);
  const setIsCanvasOpen = useDocsStore((s) => s.setIsCanvasOpen);
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0] || null;

  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));
  const theme = useSettingsStore((s) => s.theme);

  // Determine active view state based on mode
  const currentView: DocsViewMode =
    mode === 'ai-coauthor'
      ? !isCanvasOpen
        ? 'code'
        : viewMode === 'preview'
        ? 'preview'
        : 'split'
      : viewMode;

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        left: Math.max(10, rect.right - 235),
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectView = useCallback((newMode: DocsViewMode) => {
    // On mobile/tablet: split → fallback to preview
    const resolvedMode: DocsViewMode = (newMode === 'split' && isMobile) ? 'preview' : newMode;
    setViewMode(resolvedMode);
    if (mode === 'ai-coauthor') {
      if (resolvedMode === 'code') {
        setIsCanvasOpen(false);
      } else {
        setIsCanvasOpen(true);
      }
    }
    setIsOpen(false);
  }, [isMobile, mode, setViewMode, setIsCanvasOpen]);

  const handleOpenPdfTab = () => {
    if (onOpenSeparateTab) {
      onOpenSeparateTab();
    } else if (activeDoc) {
      const html = buildDocumentPreviewHtml({
        doc: activeDoc,
        theme,
        language,
      });
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(html);
        newWin.document.close();
      }
    }
    setIsOpen(false);
  };

  // Button icon based on active view mode
  const renderTriggerIcon = () => {
    // On mobile, split isn't available — use Eye as fallback
    if (currentView === 'split' && !isMobile) {
      return <Columns size={compact ? 14 : 16} />;
    }
    if (currentView === 'code') {
      return mode === 'ai-coauthor' ? (
        <Sparkles size={compact ? 14 : 15} />
      ) : (
        <Pencil size={compact ? 14 : 15} />
      );
    }
    return <Eye size={compact ? 14 : 16} />;
  };

  const singleModeLabel =
    mode === 'ai-coauthor'
      ? language === 'id'
        ? 'Hanya Author Agent'
        : 'Author Agent only'
      : language === 'id'
      ? 'Hanya Editor Kode'
      : 'Code editor only';

  const singleModeIcon =
    mode === 'ai-coauthor' ? (
      <Sparkles size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
    ) : (
      <Pencil size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
    );

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className={buttonClassName}
        style={{
          width: compact ? '28px' : '32px',
          height: compact ? '28px' : '32px',
          borderRadius: compact ? '6px' : '6px',
          backgroundColor: 'transparent',
          border: 'none',
          color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'color 0.15s ease',
          flexShrink: 0,
          ...buttonStyle,
        }}
        title={language === 'id' ? 'Opsi tata letak' : 'Layout options'}
      >
        {renderTriggerIcon()}
      </button>

      {isOpen && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: `${pos.top}px`,
            left: `${pos.left}px`,
            width: '235px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '8px',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-xl, 0 16px 36px rgba(0,0,0,0.35))',
            padding: '6px',
            zIndex: 999999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '4px 8px 6px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            {language === 'id' ? 'Opsi tata letak' : 'Layout options'}
          </div>

          {/* 1. Split view — hidden on mobile/tablet */}
          {!isMobile && (
            <button
              type="button"
              onClick={() => handleSelectView('split')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '7px 10px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: currentView === 'split' ? '#15803d' : 'transparent',
                color: currentView === 'split' ? '#ffffff' : 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: currentView === 'split' ? 600 : 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'split') e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'split') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {currentView === 'split' ? (
                <Check size={14} strokeWidth={2.6} style={{ flexShrink: 0 }} />
              ) : (
                <Columns size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
              )}
              <span>{language === 'id' ? 'Tampilan terpisah' : 'Split view'}</span>
            </button>
          )}

          {/* 2. Code Editor / AI Co-Author only */}
          <button
            type="button"
            onClick={() => handleSelectView('code')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '7px 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: currentView === 'code' ? '#15803d' : 'transparent',
              color: currentView === 'code' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: currentView === 'code' ? 600 : 500,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'code') e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'code') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {currentView === 'code' ? (
              <Check size={14} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            ) : (
              singleModeIcon
            )}
            <span>{singleModeLabel}</span>
          </button>

          {/* 3. PDF only */}
          <button
            type="button"
            onClick={() => handleSelectView('preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '7px 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: currentView === 'preview' ? '#15803d' : 'transparent',
              color: currentView === 'preview' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: currentView === 'preview' ? 600 : 500,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'preview') e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'preview') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {currentView === 'preview' ? (
              <Check size={14} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            ) : (
              <FileText size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
            )}
            <span>{language === 'id' ? 'Hanya PDF' : 'PDF only'}</span>
          </button>

          {/* 4. Open PDF in separate tab */}
          <button
            type="button"
            onClick={handleOpenPdfTab}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '7px 10px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ExternalLink size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
            <span>{language === 'id' ? 'Buka PDF di tab terpisah' : 'Open PDF in separate tab'}</span>
          </button>

          {onToggleFocusMode && (
            <>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              {/* 5. Focus mode */}
              <button
                type="button"
                onClick={() => {
                  onToggleFocusMode();
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: isFocusMode ? '#15803d' : 'transparent',
                  color: isFocusMode ? '#ffffff' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: isFocusMode ? 600 : 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isFocusMode) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }}
                onMouseLeave={(e) => {
                  if (!isFocusMode) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Maximize2 size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                  <span>{language === 'id' ? 'Mode fokus' : 'Focus mode'}</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: isFocusMode ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  Ctrl Shift M
                </span>
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
