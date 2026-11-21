import { useState, useEffect } from 'react';

interface UseVoiceCallStateOptions {
  socket?: any;
}

export function useVoiceCallState({ socket }: UseVoiceCallStateOptions = {}) {
  // Discord Voice & Video Call State (Anticeil Call & Activity)
  const [activeCallChannelId, setActiveCallChannelId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const chParam = p.get('channel');
      if (chParam && (chParam.includes('voice') || p.get('activity'))) {
        return chParam;
      }
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const pathChannel =
        pathParts[0] === 'channels' && pathParts[2] && pathParts[2] !== '@me'
          ? pathParts[2]
          : null;
      if (pathChannel && (pathChannel.includes('voice') || p.get('activity'))) {
        return pathChannel;
      }
      return p.get('activity') && chParam ? chParam : null;
    }
    return null;
  });

  const [isCallPiP, setIsCallPiP] = useState(false);

  const [isActivityOpen, setIsActivityOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(new URLSearchParams(window.location.search).get('activity'));
    }
    return false;
  });

  const [activeCallCounts, setActiveCallCounts] = useState<Record<string, number>>({});

  const [selectedActivityAppId, setSelectedActivityAppId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const act = new URLSearchParams(window.location.search).get('activity');
      if (act === 'youtube') return 'watch-together';
      return act || null;
    }
    return null;
  });

  const [appsSearchQuery, setAppsSearchQuery] = useState('');

  // Auto-sync active voice channel activity across peers
  useEffect(() => {
    if (!socket) return;
    const handleRemoteActivity = (data: any) => {
      if (!data) return;
      if (data.action === 'ACTIVITY_LAUNCH' || data.action === 'START_ACTIVITY') {
        const appId = data.payload?.appId;
        if (appId) {
          setSelectedActivityAppId(appId);
          setIsActivityOpen(true);
        }
      } else if (data.action === 'ACTIVITY_STOP') {
        setSelectedActivityAppId(null);
        setIsActivityOpen(false);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (url.searchParams.has('activity')) {
            url.searchParams.delete('activity');
            window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
          }
        }
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivity);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivity);
    };
  }, [socket]);

  // Global activity close event listener to purge URL and state
  useEffect(() => {
    const handleClose = () => {
      setSelectedActivityAppId(null);
      setIsActivityOpen(false);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.has('activity')) {
          url.searchParams.delete('activity');
          window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
        }
      }
    };
    window.addEventListener('anticeil_activity_close', handleClose);
    return () => window.removeEventListener('anticeil_activity_close', handleClose);
  }, []);

  return {
    activeCallChannelId,
    setActiveCallChannelId,
    isCallPiP,
    setIsCallPiP,
    isActivityOpen,
    setIsActivityOpen,
    activeCallCounts,
    setActiveCallCounts,
    selectedActivityAppId,
    setSelectedActivityAppId,
    appsSearchQuery,
    setAppsSearchQuery,
  };
}
