'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { DOC_CATEGORIES, ALL_DOC_SECTIONS } from '../data';
import { DocContentRenderer } from './DocContentRenderer';
import { DocSearchModal } from './DocSearchModal';

// Inner component that reads search params (must be inside Suspense)
function DocumentationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useSettingsStore((s) => s.language);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Derive active section from URL ?section= param
  const activeSectionId = searchParams?.get('section') || 'intro';

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeSection = ALL_DOC_SECTIONS.find((s) => s.id === activeSectionId) || ALL_DOC_SECTIONS[0];

  const handleSelectSection = (id: string) => {
    router.push(`/documentation?section=${id}`);
    setIsSearchOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        <DocContentRenderer
          section={activeSection}
          language={language}
          categories={DOC_CATEGORIES}
          allSections={ALL_DOC_SECTIONS}
          onSelectSection={handleSelectSection}
        />
      </div>

      {/* Command Palette Search Modal */}
      <DocSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSection={handleSelectSection}
        language={language}
      />
    </div>
  );
}

export function DocumentationView() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading...</div>}>
      <DocumentationInner />
    </Suspense>
  );
}

