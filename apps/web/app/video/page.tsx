'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { VideoView } from '../../src/features/video/components/VideoView';

export default function VideoPage() {
  return (
    <AppShell showSidebar={true}>
      <VideoView />
    </AppShell>
  );
}
