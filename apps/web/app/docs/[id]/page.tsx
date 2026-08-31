'use client';

import React, { use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DocsView } from '../../../src/features/docs/components/DocsView';
import { useDocsStore, DocItem } from '../../../src/features/docs/store/useDocsStore';

interface DocsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DocsDetailPage({ params }: DocsDetailPageProps) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const documents = useDocsStore((s) => s.documents);
  const setActiveDocId = useDocsStore((s) => s.setActiveDocId);
  const setStudioPhase = useDocsStore((s) => s.setStudioPhase);
  const upsertDocument = useDocsStore((s) => s.upsertDocument);

  useEffect(() => {
    if (!docId) return;

    const existsLocally = documents.some((d) => d.id === docId);
    if (existsLocally) {
      setActiveDocId(docId);
      setStudioPhase('editor');
      return;
    }

    // Try fetching from sharing / document API
    const shareToken = token || docId;
    fetch(`/api/docs/share/${shareToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.document) {
          upsertDocument(data.document as DocItem);
        } else {
          setActiveDocId(docId);
          setStudioPhase('editor');
        }
      })
      .catch((err) => {
        console.warn('[DocPage] Could not load shared doc from API:', err);
        setActiveDocId(docId);
        setStudioPhase('editor');
      });
  }, [docId, token, documents, setActiveDocId, setStudioPhase, upsertDocument]);

  return <DocsView initialDocId={docId} />;
}
