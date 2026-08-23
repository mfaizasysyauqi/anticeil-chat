'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { ImagineView } from '../../src/features/imagine/components/ImagineView';

export default function ImaginePage() {
  return (
    <AppShell showSidebar={true}>
      <ImagineView />
    </AppShell>
  );
}
