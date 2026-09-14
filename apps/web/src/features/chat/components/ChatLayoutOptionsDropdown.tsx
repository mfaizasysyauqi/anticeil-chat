'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Columns,
  Sparkles,
  Check,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useBuildStore } from '../store/useBuildStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface ChatLayoutOptionsDropdownProps {
  compact?: boolean;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}

export type ChatViewMode = 'split' | 'chat' | 'canvas';

export function ChatLayoutOptionsDropdown({
  compact = false,
  buttonClassName = 'hover-subtle',
  buttonStyle,
}: ChatLayoutOptionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isBuildOpen = useBuildStore((s) => s.isOpen);
  const isFullscreen = useBuildStore((s) => s.isFullscreen);
  const activeArtifact = useBuildStore((s) => s.activeArtifact);
  const artifacts = useBuildStore((s) => s.artifacts);
  const close = useBuildStore((s) => s.close);
  const openArtifact = useBuildStore((s) => s.openArtifact);
  const toggleFullscreen = useBuildStore((s) => s.toggleFullscreen);

  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));

  const currentView: ChatViewMode = !isBuildOpen
    ? 'chat'
    : isFullscreen
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

  const handleSelectView = useCallback((newMode: ChatViewMode) => {
    // On mobile/tablet: split → fallback to canvas
    const resolvedMode: ChatViewMode = (newMode === 'split' && isMobile) ? 'canvas' : newMode;

    if (resolvedMode === 'chat') {
      close();
    } else if (resolvedMode === 'split') {
      if (!isBuildOpen) {
        if (activeArtifact) {
          useBuildStore.setState({ isOpen: true, isFullscreen: false });
        } else if (artifacts.length > 0) {
          useBuildStore.setState({ isOpen: true, activeArtifact: artifacts[0], isFullscreen: false });
        } else {
          openArtifact(
            '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#090d16;color:#fff;"><h2>Canvas Preview</h2><p>Anticeil Live Sandbox siap digunakan.</p></body></html>',
            'html',
            'Canvas Sandbox'
          );
          useBuildStore.setState({ isFullscreen: false });
        }
      } else if (isFullscreen) {
        toggleFullscreen();
      }
    } else if (resolvedMode === 'canvas') {
      if (!isBuildOpen) {
        if (activeArtifact) {
          useBuildStore.setState({ isOpen: true, isFullscreen: true });
        } else if (artifacts.length > 0) {
          useBuildStore.setState({ isOpen: true, activeArtifact: artifacts[0], isFullscreen: true });
        } else {
          openArtifact(
            '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#090d16;color:#fff;"><h2>Canvas Preview</h2><p>Anticeil Live Sandbox siap digunakan.</p></body></html>',
            'html',
            'Canvas Sandbox'
          );
          useBuildStore.setState({ isFullscreen: true });
        }
      } else if (!isFullscreen) {
        toggleFullscreen();
      }
    }
    setIsOpen(false);
  }, [isMobile, isBuildOpen, isFullscreen, activeArtifact, artifacts, close, openArtifact, toggleFullscreen]);

  const handleOpenNewTab = () => {
    if (activeArtifact?.code) {
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.open();
        newWin.document.write(activeArtifact.code);
        newWin.document.close();
      }
    }
    setIsOpen(false);
  };

  const renderTriggerIcon = () => {
    // On mobile, split isn't available — use fallback icon
    if (currentView === 'split' && !isMobile) {
      return <Columns size={compact ? 14 : 16} />;
    }
    if (currentView === 'chat') {
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

            {/* Only Chat */}
            <button
              type="button"
              onClick={() => handleSelectView('chat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: currentView === 'chat' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                color: currentView === 'chat' ? 'var(--brand-primary)' : 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: currentView === 'chat' ? 650 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s',
              }}
              className={currentView !== 'chat' ? 'hover-subtle' : ''}
            >
              <Sparkles size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{language === 'id' ? 'Hanya Chat' : 'Chat only'}</span>
              {currentView === 'chat' && <Check size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
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
              <Eye size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{language === 'id' ? 'Hanya Canvas' : 'Canvas only'}</span>
              {currentView === 'canvas' && <Check size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

            {/* Open in Separate Tab */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              disabled={!activeArtifact?.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: !activeArtifact?.code ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: !activeArtifact?.code ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                width: '100%',
                opacity: !activeArtifact?.code ? 0.5 : 1,
                transition: 'background-color 0.12s',
              }}
              className={activeArtifact?.code ? 'hover-subtle' : ''}
            >
              <ExternalLink size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                {language === 'id' ? 'Buka di tab terpisah' : 'Open in new tab'}
              </span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
