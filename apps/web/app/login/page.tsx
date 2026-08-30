'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams?.get('next');
    // Redirect to the destination (or /chat) with ?auth=login so AppShell opens the modal
    const dest = next && next.startsWith('/') ? next : '/chat';
    const url = new URL(dest, window.location.origin);
    url.searchParams.set('auth', 'login');
    router.replace(url.pathname + url.search);
  }, [router, searchParams]);

  return null;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginRedirect />
    </Suspense>
  );
}
