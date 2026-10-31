import { useState, useEffect } from 'react';

interface UseVoiceCallStateOptions {
  socket?: any;
}

export function useVoiceCallState({ socket }: UseVoiceCallStateOptions = {}) {
  // Discord Voice & Video Call State (Anticeil Call & Activity)
  const [activeCallChannelId, setActiveCallChannelId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('activity') && p.get('channel') ? p.get('channel') : null;
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
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivity);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivity);
    };
  }, [socket]);

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
