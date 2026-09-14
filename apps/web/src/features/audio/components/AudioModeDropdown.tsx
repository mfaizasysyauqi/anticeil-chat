'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Music,
  Mic,
  Ear,
  Check,
} from 'lucide-react';
import { useAudioStore, AudioTab } from '../store/useAudioStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface AudioModeDropdownProps {
  compact?: boolean;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}

export function AudioModeDropdown({
  compact = false,
  buttonClassName = 'hover-subtle',
  buttonStyle,
}: AudioModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeTab = useAudioStore((s) => s.activeTab);
  const setActiveTab = useAudioStore((s) => s.setActiveTab);
  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));

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

  const handleSelectTab = (tab: AudioTab) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const renderTriggerIcon = () => {
    if (activeTab === 'tts') {
      return <Mic size={compact ? 14 : 16} />;
    }
    if (activeTab === 'stt') {
      return <Ear size={compact ? 14 : 16} />;
    }
    return <Music size={compact ? 14 : 16} />;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className={buttonClassName}
        title={language === 'id' ? 'Mode Audio' : 'Audio Mode'}
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
              {language === 'id' ? 'Mode Audio' : 'Audio Mode'}
            </div>

            {/* Music */}
            <button
              type="button"
              onClick={() => handleSelectTab('music')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'music' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                color: activeTab === 'music' ? 'var(--brand-primary)' : 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: activeTab === 'music' ? 650 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s',
              }}
              className={activeTab !== 'music' ? 'hover-subtle' : ''}
            >
              <Music size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{language === 'id' ? 'Musik' : 'Music'}</span>
              {activeTab === 'music' && <Check size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
            </button>

            {/* TTS (Text to Speech) */}
            <button
              type="button"
              onClick={() => handleSelectTab('tts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'tts' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                color: activeTab === 'tts' ? 'var(--brand-primary)' : 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: activeTab === 'tts' ? 650 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s',
              }}
              className={activeTab !== 'tts' ? 'hover-subtle' : ''}
            >
              <Mic size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Text→Speech (TTS)</span>
              {activeTab === 'tts' && <Check size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
            </button>

            {/* STT (Speech to Text) */}
            <button
              type="button"
              onClick={() => handleSelectTab('stt')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'stt' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                color: activeTab === 'stt' ? 'var(--brand-primary)' : 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: activeTab === 'stt' ? 650 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.12s',
              }}
              className={activeTab !== 'stt' ? 'hover-subtle' : ''}
            >
              <Ear size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Speech→Text (STT)</span>
              {activeTab === 'stt' && <Check size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
