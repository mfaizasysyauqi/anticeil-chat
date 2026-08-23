'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { AutomationsView } from '../../src/features/automations/components/AutomationsView';

export default function AutomationsPage() {
  return (
    <AppShell showSidebar={true}>
      <AutomationsView />
    </AppShell>
  );
}
