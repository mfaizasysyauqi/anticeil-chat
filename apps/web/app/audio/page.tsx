'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { AudioView } from '../../src/features/audio/components/AudioView';

export default function AudioPage() {
  return (
    <AppShell showSidebar={true}>
      <AudioView />
    </AppShell>
  );
}
