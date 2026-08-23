'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../src/shared/components/AppShell';
import { ChatView } from '../../src/features/chat/components/ChatView';
import { useSettingsStore } from '../../src/features/settings/store/useSettingsStore';

export default function SettingsPage() {
  const router = useRouter();
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);

  useEffect(() => {
    setSettingsOpen(true);
  }, [setSettingsOpen]);

  return (
    <AppShell showSidebar={true}>
      <ChatView />
    </AppShell>
  );
}
