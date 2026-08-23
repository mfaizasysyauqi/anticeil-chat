'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { PdfToolsView } from '../../src/features/pdf/components/PdfToolsView';

export default function PdfToolsPage() {
  return (
    <AppShell showSidebar={true}>
      <PdfToolsView />
    </AppShell>
  );
}
