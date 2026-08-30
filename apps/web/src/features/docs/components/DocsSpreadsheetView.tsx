'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useDocsStore } from '../store/useDocsStore';

// Load UniverSheetsCore client-side only (0 network lag, pre-bundled by Next.js Webpack)
const UniverSheetsCore = dynamic(() => import('./UniverSheetsCore'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--brand-primary)',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }}
      />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
        Membuka Univer Sheets...
      </span>
    </div>
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
      <UniverSheetsCore
        key={activeDocId ?? 'default'}
        initialContent={activeDoc?.content ?? ''}
        onContentChange={(md) => {
          if (activeDoc) updateDocumentContent(activeDoc.id, md);
        }}
      />
    </div>
  );
}
