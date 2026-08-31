'use client';

import React, { use, useEffect } from 'react';
import { DocsView } from '../../../src/features/docs/components/DocsView';
import { useDocsStore } from '../../../src/features/docs/store/useDocsStore';

interface DocsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DocsDetailPage({ params }: DocsDetailPageProps) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;
  const setActiveDocId = useDocsStore((s) => s.setActiveDocId);
  const setStudioPhase = useDocsStore((s) => s.setStudioPhase);

  useEffect(() => {
    if (docId) {
      setActiveDocId(docId);
      setStudioPhase('editor');
    }
  }, [docId, setActiveDocId, setStudioPhase]);

  return <DocsView initialDocId={docId} />;
}
