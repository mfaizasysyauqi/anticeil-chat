'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { DocsLandingView } from '../../src/features/docs/components/DocsLandingView';
import { useDocsStore, DocFormat } from '../../src/features/docs/store/useDocsStore';
import { useRouter } from 'next/navigation';

export default function DocsPage() {
  const router = useRouter();
  const createDocument = useDocsStore((s) => s.createDocument);

  const handleStartGenerate = (prompt: string, format: DocFormat) => {
    const newId = createDocument('Generated Document', '', format);
    router.push(`/docs/${newId}`);
  };

  return (
    <AppShell showSidebar={true}>
      <DocsLandingView onStartGenerate={handleStartGenerate} />
    </AppShell>
  );
}
