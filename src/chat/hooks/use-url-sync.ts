import { useEffect } from 'react';

interface UseUrlSyncOptions {
  activeColonyId: string;
  activeChannelId: string;
  selectedActivityAppId: string | null;
  channelsCount: number;
  isActivityOpen: boolean;
  homeView?: string;
  setHomeView?: (view: any) => void;
  setActiveColonyId?: (id: string) => void;
  setActiveChannelId?: (id: string) => void;
}

export function useUrlSync({
  activeColonyId,
  activeChannelId,
  selectedActivityAppId,
  channelsCount,
  isActivityOpen,
  homeView,
  setHomeView,
  setActiveColonyId,
  setActiveChannelId,
}: UseUrlSyncOptions) {
  // 1. Broadcast activeColonyId to Unified Mini Rail
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('anticeil_active_colony_changed', { detail: activeColonyId }));
    window.dispatchEvent(new CustomEvent('anticeil_active_hub_changed', { detail: activeColonyId }));
  }, [activeColonyId]);

  // 2. Initial Route Parsing on Mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const pathname = window.location.pathname.toLowerCase();

      if (
        pathname === '/applications&activities' ||
        pathname === '/apps' ||
        pathname === '/applications' ||
        pathname === '/app-directory'
      ) {
        setHomeView?.('apps');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/message-requests') {
        setHomeView?.('message-requests');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/notifications') {
        setHomeView?.('notifications');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/calendar') {
        setHomeView?.('calendar');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/assignments') {
        setHomeView?.('assignments');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/calls') {
        setHomeView?.('calls');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/colonies') {
        setHomeView?.('colonies');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/shop' || pathname === '/store') {
        setHomeView?.('shop');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/friends') {
        setHomeView?.('friends');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname === '/' || pathname === '') {
        setHomeView?.('apps');
        setActiveColonyId?.('anticeil');
        setActiveChannelId?.('');
      } else if (pathname.startsWith('/channels/@me')) {
        const parts = pathname.split('/').filter(Boolean);
        setActiveColonyId?.('anticeil');
        if (parts[2]) {
          setActiveChannelId?.(parts[2]);
        }
      } else if (pathname.startsWith('/channels/')) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts[1]) {
          setActiveColonyId?.(parts[1]);
        }
        if (parts[2]) {
          setActiveChannelId?.(parts[2]);
        }
      }
    } catch {}
  }, []);

  // 2b. Listen for PopState (Back / Forward browser navigation)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const pathname = window.location.pathname.toLowerCase();
        if (
          pathname === '/applications&activities' ||
          pathname === '/apps' ||
          pathname === '/applications' ||
          pathname === '/app-directory'
        ) {
          setHomeView?.('apps');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/message-requests') {
          setHomeView?.('message-requests');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/notifications') {
          setHomeView?.('notifications');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/calendar') {
          setHomeView?.('calendar');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/assignments') {
          setHomeView?.('assignments');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/calls') {
          setHomeView?.('calls');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/colonies') {
          setHomeView?.('colonies');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/shop' || pathname === '/store') {
          setHomeView?.('shop');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/friends') {
          setHomeView?.('friends');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname === '/' || pathname === '') {
          setHomeView?.('apps');
          setActiveColonyId?.('anticeil');
          setActiveChannelId?.('');
        } else if (pathname.startsWith('/channels/@me')) {
          const parts = pathname.split('/').filter(Boolean);
          setActiveColonyId?.('anticeil');
          if (parts[2]) {
            setActiveChannelId?.(parts[2]);
          }
        } else if (pathname.startsWith('/channels/')) {
          const parts = pathname.split('/').filter(Boolean);
          if (parts[1]) {
            setActiveColonyId?.(parts[1]);
          }
          if (parts[2]) {
            setActiveChannelId?.(parts[2]);
          }
        }
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setHomeView, setActiveColonyId, setActiveChannelId]);

  // 3. Synchronize browser URL address bar with active view, colony, channel, and activity
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      let targetPath = '/applications&activities';

      if (activeColonyId && activeColonyId !== 'anticeil') {
        targetPath = `/channels/${activeColonyId}${activeChannelId ? '/' + activeChannelId : ''}`;
      } else if (activeChannelId) {
        targetPath = `/channels/@me/${activeChannelId}`;
      } else if (homeView) {
        switch (homeView) {
          case 'apps':
            targetPath = '/applications&activities';
            break;
          case 'message-requests':
            targetPath = '/message-requests';
            break;
          case 'notifications':
            targetPath = '/notifications';
            break;
          case 'calendar':
            targetPath = '/calendar';
            break;
          case 'assignments':
            targetPath = '/assignments';
            break;
          case 'calls':
            targetPath = '/calls';
            break;
          case 'colonies':
            targetPath = '/colonies';
            break;
          case 'friends':
            targetPath = '/friends';
            break;
          case 'shop':
            targetPath = '/shop';
            break;
          default:
            targetPath = '/applications&activities';
            break;
        }
      }

      const currentPath = window.location.pathname;
      const url = new URL(window.location.href);

      if (selectedActivityAppId) {
        url.searchParams.set('activity', selectedActivityAppId);
      } else {
        url.searchParams.delete('activity');
      }

      // Remove obsolete query params
      url.searchParams.delete('colony');
      url.searchParams.delete('hub');
      url.searchParams.delete('channel');

      const newSearch = url.search ? url.search : '';
      if (currentPath !== targetPath) {
        window.history.replaceState(null, '', targetPath + newSearch);
      }
    } catch {}
  }, [activeColonyId, activeChannelId, homeView, selectedActivityAppId, channelsCount, isActivityOpen]);
}
