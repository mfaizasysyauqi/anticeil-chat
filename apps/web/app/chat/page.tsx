'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { ChatView } from '../../src/features/chat/components/ChatView';

export default function ChatWorkspacePage() {
  return (
    <AppShell>
      <ChatView />
    </AppShell>
  );
}
