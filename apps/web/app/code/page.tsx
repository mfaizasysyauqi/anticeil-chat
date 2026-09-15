'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { CodeLandingView } from '../../src/features/code/components/CodeLandingView';

export default function CodePage() {
  return (
    <AppShell showSidebar={true}>
      <CodeLandingView />
    </AppShell>
  );
}
