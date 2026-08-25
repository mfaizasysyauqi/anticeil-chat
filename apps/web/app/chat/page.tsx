'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '../../src/shared/components/AppShell';
import { ChatView } from '../../src/features/chat/components/ChatView';
import { useConnectorsStore } from '../../src/features/connectors/store/useConnectorsStore';

function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handleOAuthCallback = useConnectorsStore((s) => s.handleOAuthCallback);

  useEffect(() => {
    if (!searchParams) return;

    const hasSuccess = searchParams.get('connector_connected');
    const hasError = searchParams.get('connector_error');

    if (hasSuccess || hasError) {
      // handleOAuthCallback now handles both success tokens and errors
      handleOAuthCallback(searchParams);

      // Clean sensitive params from the URL
      const clean = new URL(window.location.href);
      ['connector_connected', 'connector_token', 'connector_email', 'connector_name',
       'connector_error', 'reason'].forEach((k) => clean.searchParams.delete(k));
      router.replace(clean.pathname);
    }
  }, [searchParams, handleOAuthCallback, router]);

  return null;
}

export default function ChatWorkspacePage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <OAuthCallbackHandler />
      </Suspense>
      <ChatView />
    </AppShell>
  );
}
