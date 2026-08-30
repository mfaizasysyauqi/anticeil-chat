'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { DocsView } from '../../src/features/docs/components/DocsView';
import { useDocsStore } from '../../src/features/docs/store/useDocsStore';

export default function DocsPage() {
  const studioPhase = useDocsStore((s) => s.studioPhase);

  // In full editor mode, use the full immersive screen
  if (studioPhase === 'editor') {
    return <DocsView />;
  }

  // In landing or generating phase, keep the standard AppShell with Sidebar & Navbar
  return (
    <AppShell showSidebar={true}>
      <DocsView />
    </AppShell>
  );
}
