'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { GatewayView } from '../../src/features/gateway/components/GatewayView';

export default function GatewayPage() {
  return (
    <AppShell showSidebar={true}>
      <GatewayView />
    </AppShell>
  );
}
