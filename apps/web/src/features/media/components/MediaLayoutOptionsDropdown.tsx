'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Columns,
  Sparkles,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useMediaEditorStore, MediaViewMode } from '../store/useMediaEditorStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface MediaLayoutOptionsDropdownProps {
  compact?: boolean;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}

export function MediaLayoutOptionsDropdown({
  compact = false,
  buttonClassName = 'hover-subtle',
  buttonStyle,
}: MediaLayoutOptionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    viewMode,
    setViewMode,
    isCanvasOpen,
    setIsCanvasOpen,
    projects,
    activeProjectId,
  } = useMediaEditorStore();

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  const activeRevision =
    activeProject?.revisions.find((r) => r.id === activeProject.activeRevisionId) ||
    activeProject?.revisions[activeProject.revisions.length - 1] ||
    null;

  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));

  const currentView: MediaViewMode = !isCanvasOpen
    ? 'coeditor'
    : viewMode === 'canvas'
    ? 'canvas'
    : 'split';

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

  const handleSelectView = useCallback((newMode: MediaViewMode) => {
    // On mobile/tablet: split → fallback to canvas (preview only)
    const resolvedMode: MediaViewMode = (newMode === 'split' && isMobile) ? 'canvas' : newMode;
    setViewMode(resolvedMode);
    if (resolvedMode === 'coeditor') {
      setIsCanvasOpen(false);
    } else {
      setIsCanvasOpen(true);
    }
    setIsOpen(false);
  }, [isMobile, setViewMode, setIsCanvasOpen]);

  const handleOpenMediaTab = () => {
    if (activeRevision?.url) {
      window.open(activeRevision.url, '_blank');
    }
    setIsOpen(false);
  };

  const renderTriggerIcon = () => {
    // On mobile, split isn't available — show Eye as fallback
    if (currentView === 'split' && !isMobile) {
      return <Columns size={compact ? 14 : 16} />;
    }
    if (currentView === 'coeditor') {
      return <Sparkles size={compact ? 14 : 15} />;
    }
    return <Eye size={compact ? 14 : 16} />;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className={buttonClassName}
        title={language === 'id' ? 'Opsi tata letak' : 'Layout options'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: compact ? '28px' : '32px',
          height: compact ? '28px' : '32px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: 'transparent',
          color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'color 0.15s ease',
          flexShrink: 0,
          ...buttonStyle,
        }}
      >
        {renderTriggerIcon()}
      </button>

      {isOpen &&
        pos &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="animate-fade-in"
            style={{
              position: 'fixed',
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              width: '235px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-xl)',
              padding: '6px',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                padding: '4px 8px 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {language === 'id' ? 'Opsi tata letak' : 'Layout options'}
            </div>

            {/* Split View — hidden on mobile/tablet */}
            {!isMobile && (
              <button
                type="button"
                onClick={() => handleSelectView('split')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: currentView === 'split' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                  color: currentView === 'split' ? 'var(--brand-primary)' : 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: currentView === 'split' ? 650 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background-color 0.12s',
                }}
                className={currentView !== 'split' ? 'hover-subtle' : ''}
              >
                <Columns size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{language === 'id' ? 'Tampilan terpisah' : 'Split view'}</span>
                {currentView === 'split' && <Check size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
              </button>
            )}

            {/* Only AI Co-Editor */}
            <button
              type="button"
              onClick={() => handleSelectView('coeditor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: currentView === 'coeditor' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                color: currentView === 'coeditor' ? 'var(--brand-primary)' : 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: currentView === 'coeditor' ? 650 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s',
              }}
              className={currentView !== 'coeditor' ? 'hover-subtle' : ''}
            >
              <Sparkles size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{language === 'id' ? 'Hanya AI Co-Editor' : 'AI Co-Editor only'}</span>
              {currentView === 'coeditor' && <Check size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
            </button>

            {/* Only Canvas Preview */}
            <button
              type="button"
              onClick={() => handleSelectView('canvas')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: currentView === 'canvas' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                color: currentView === 'canvas' ? 'var(--brand-primary)' : 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: currentView === 'canvas' ? 650 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s',
              }}
              className={currentView !== 'canvas' ? 'hover-subtle' : ''}
            >
              <ImageIcon size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{language === 'id' ? 'Hanya Canvas Preview' : 'Canvas Preview only'}</span>
              {currentView === 'canvas' && <Check size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

            {/* Open Media in Separate Tab */}
            <button
              type="button"
              onClick={handleOpenMediaTab}
              disabled={!activeRevision?.url}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: !activeRevision?.url ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: !activeRevision?.url ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                width: '100%',
                opacity: !activeRevision?.url ? 0.5 : 1,
                transition: 'background-color 0.12s',
              }}
              className={activeRevision?.url ? 'hover-subtle' : ''}
            >
              <ExternalLink size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                {language === 'id' ? 'Buka media di tab terpisah' : 'Open media in new tab'}
              </span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
