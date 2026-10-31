import { useEffect } from 'react';

interface UseUrlSyncOptions {
  activeColonyId: string;
  activeChannelId: string;
  selectedActivityAppId: string | null;
  channelsCount: number;
  isActivityOpen: boolean;
}

export function useUrlSync({
  activeColonyId,
  activeChannelId,
  selectedActivityAppId,
  channelsCount,
  isActivityOpen,
}: UseUrlSyncOptions) {
  // Broadcast activeColonyId to Unified Mini Rail
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('anticeil_active_colony_changed', { detail: activeColonyId }));
    window.dispatchEvent(new CustomEvent('anticeil_active_hub_changed', { detail: activeColonyId }));
  }, [activeColonyId]);

  // Synchronize browser URL address bar with active colony, channel, and activity
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      let changed = false;

      if (activeColonyId && activeColonyId !== 'anticeil') {
        if (url.searchParams.get('colony') !== activeColonyId) {
          url.searchParams.set('colony', activeColonyId);
          url.searchParams.delete('hub');
          changed = true;
        }
      } else if (url.searchParams.has('colony') || url.searchParams.has('hub')) {
        url.searchParams.delete('colony');
        url.searchParams.delete('hub');
        changed = true;
      }

      if (activeChannelId) {
        if (url.searchParams.get('channel') !== activeChannelId) {
          url.searchParams.set('channel', activeChannelId);
          changed = true;
        }
      } else if (url.searchParams.has('channel') && channelsCount > 0) {
        url.searchParams.delete('channel');
        changed = true;
      }

      if (selectedActivityAppId) {
        if (url.searchParams.get('activity') !== selectedActivityAppId) {
          url.searchParams.set('activity', selectedActivityAppId);
          changed = true;
        }
      } else if (url.searchParams.has('activity') && channelsCount > 0 && !isActivityOpen) {
        url.searchParams.delete('activity');
        changed = true;
      }

      if (changed) {
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch {}
  }, [activeColonyId, activeChannelId, selectedActivityAppId, channelsCount, isActivityOpen]);
}

