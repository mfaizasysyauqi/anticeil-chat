'use client';

import React from 'react';
import { AppShell } from '../../src/shared/components/AppShell';
import { DocsLandingView } from '../../src/features/docs/components/DocsLandingView';
import { useDocsStore, DocFormat } from '../../src/features/docs/store/useDocsStore';
import { useRouter } from 'next/navigation';

import { useSettingsStore } from '../../src/features/settings/store/useSettingsStore';

export default function DocsPage() {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const createDocument = useDocsStore((s) => s.createDocument);
  const setCopilotPendingPrompt = useDocsStore((s) => s.setCopilotPendingPrompt);

  const handleStartGenerate = (prompt: string, format: DocFormat) => {
    const title = format === 'sheet'
      ? (language === 'id' ? 'Spreadsheet Baru' : 'New Spreadsheet')
      : format === 'slide'
      ? (language === 'id' ? 'Slide Baru' : 'New Slide')
      : (language === 'id' ? 'Dokumen Baru' : 'New Document');
    const newId = createDocument(title, '', format);
    setCopilotPendingPrompt(prompt);
    router.push(`/docs/${newId}`);
  };

  return (
    <AppShell showSidebar={true}>
      <DocsLandingView onStartGenerate={handleStartGenerate} />
    </AppShell>
  );
}
