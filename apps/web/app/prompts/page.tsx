'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { PromptsView } from '../../src/features/prompts/components/PromptsView';

export default function PromptsPage() {
  return (
    <AppShell showSidebar={true}>
      <PromptsView />
    </AppShell>
  );
}
