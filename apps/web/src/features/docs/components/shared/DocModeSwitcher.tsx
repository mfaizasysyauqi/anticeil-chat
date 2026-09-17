'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Code2, Sparkles } from 'lucide-react';
import { useDocsStore } from '../../store/useDocsStore';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface DocModeSwitcherProps {
  currentMode?: 'landing' | 'editor';
  activeDocId?: string | null;
  onSwitchMode?: (mode: 'landing' | 'editor') => void;
  compact?: boolean;
}

export function DocModeSwitcher({
  currentMode,
  activeDocId: propDocId,
  onSwitchMode,
  compact = false,
}: DocModeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));
  const storeActiveDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);

  const effectiveDocId = propDocId || storeActiveDocId || documents[0]?.id;

  const mode =
    currentMode ||
    (pathname === '/docs' ? 'landing' : pathname.startsWith('/docs/') ? 'editor' : 'landing');

  const handleSelect = (targetMode: 'landing' | 'editor') => {
    if (onSwitchMode) { onSwitchMode(targetMode); return; }
    router.push(targetMode === 'landing' ? '/docs' : effectiveDocId ? `/docs/${effectiveDocId}` : '/docs');
  };

  const iconSize = compact ? 13 : 14;

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: active ? 'var(--bg-subtle)' : 'transparent',
    color: active ? 'var(--brand-primary, #0073EA)' : 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  });

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => handleSelect('landing')}
        title={language === 'id' ? 'Author Agent & Ringkasan' : 'Author Agent & Summary'}
        style={btnStyle(mode === 'landing')}
        className="hover-subtle"
      >
        <Sparkles size={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => handleSelect('editor')}
        title={language === 'id' ? 'Code Editor & IDE Lengkap' : 'Full Code Editor & IDE'}
        style={btnStyle(mode === 'editor')}
        className="hover-subtle"
      >
        <Code2 size={iconSize} />
      </button>
    </div>
  );
}
