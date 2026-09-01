'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useDocsStore } from '../store/useDocsStore';

import { SplashScreen } from '../../../shared/components/SplashScreen';

// Load FortuneSheetsCore client-side only (0 network lag, pre-bundled by Next.js Webpack)
const FortuneSheetsCore = dynamic(() => import('./FortuneSheetsCore'), {
  ssr: false,
  loading: () => (
    <SplashScreen
      title="Anticeil Sheets"
      subtitle="Memuat Grid & Spreadsheet Engine..."
    />
  ),
});

export function DocsSpreadsheetView() {
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const documents = useDocsStore((s) => s.documents);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);

  const activeDoc = documents.find((d) => d.id === activeDocId);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FortuneSheetsCore
        key={activeDocId ?? 'default'}
        initialContent={activeDoc?.content ?? ''}
        onContentChange={(md) => {
          if (activeDoc) updateDocumentContent(activeDoc.id, md);
        }}
      />
    </div>
  );
}
