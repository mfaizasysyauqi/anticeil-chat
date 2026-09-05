'use client';

import React, { Suspense } from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { MediaStudioView } from '../../src/features/media/components/MediaStudioView';

export default function AudioPage() {
  return (
    <AppShell showSidebar={true}>
      <Suspense fallback={<div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading...</div>}>
        <MediaStudioView />
      </Suspense>
    </AppShell>
  );
}
