'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { ImageView } from '../../src/features/image/components/ImageView';

export default function ImagePage() {
  return (
    <AppShell showSidebar={true}>
      <ImageView />
    </AppShell>
  );
}
