'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { ImageView } from '../../image/components/ImageView';
import { VideoView } from '../../video/components/VideoView';
import { AudioView } from '../../audio/components/AudioView';
import { MediaLandingView } from './MediaLandingView';
import { useMediaEditorStore } from '../store/useMediaEditorStore';

export type MediaStudioTab = 'canvas' | 'video' | 'audio';

function resolveTab(tab: string | null, pathname: string): MediaStudioTab {
  if (tab === 'audio' || pathname === '/audio') return 'audio';
  return 'canvas';
}

export function MediaStudioView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tabParam = searchParams.get('tab');
  const initialTab = resolveTab(tabParam, pathname);

  const [activeTab, setActiveTab] = useState<MediaStudioTab>(initialTab);

  useEffect(() => {
    const resolved = resolveTab(tabParam, pathname);
    setActiveTab(resolved);
  }, [tabParam, pathname]);

  // Auto-switch from split → canvas-only on mobile/tablet (< 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        const { isCanvasOpen, viewMode, setViewMode, projects, activeProjectId } = useMediaEditorStore.getState();
        const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];
        // Split = canvas open + viewMode not 'canvas'
        if (isCanvasOpen && viewMode !== 'canvas' && activeProj && activeProj.revisions.length > 0) {
          setViewMode('canvas');
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // run on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        {activeTab === 'canvas' && <MediaLandingView />}
        {activeTab === 'video' && <VideoView />}
        {activeTab === 'audio' && <AudioView />}
      </div>
    </div>
  );
}
