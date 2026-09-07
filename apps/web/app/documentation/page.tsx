'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { DocumentationView } from '../../src/features/documentation/components/DocumentationView';

export default function DocumentationPage() {
  return (
    <AppShell showSidebar={true}>
      <DocumentationView />
    </AppShell>
  );
}
