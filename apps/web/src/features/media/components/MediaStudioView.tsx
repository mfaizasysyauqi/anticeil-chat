'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { ImageView } from '../../image/components/ImageView';
import { VideoView } from '../../video/components/VideoView';
import { AudioView } from '../../audio/components/AudioView';

export type MediaStudioTab = 'image' | 'video' | 'audio';

export function MediaStudioView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Tab from search params or default to 'image'
  const tabParam = searchParams.get('tab') as MediaStudioTab | null;
  const initialTab: MediaStudioTab =
    tabParam === 'video' || tabParam === 'audio' || tabParam === 'image'
      ? tabParam
      : pathname === '/video'
      ? 'video'
      : pathname === '/audio'
      ? 'audio'
      : 'image';

  const [activeTab, setActiveTab] = useState<MediaStudioTab>(initialTab);

  useEffect(() => {
    if (tabParam && (tabParam === 'image' || tabParam === 'video' || tabParam === 'audio')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'image' && <ImageView />}
        {activeTab === 'video' && <VideoView />}
        {activeTab === 'audio' && <AudioView />}
      </div>
    </div>
  );
}
