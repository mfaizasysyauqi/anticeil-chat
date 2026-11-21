import React, { useEffect } from 'react';
import { toast } from 'sonner';

interface UseCallActivitySyncOptions {
  socket: any;
  channelId: string;
  activeAppIdRef: React.MutableRefObject<string | null>;
  currentActiveAppRef: React.MutableRefObject<any>;
  setActiveAppId: (appId: string | null) => void;
  onToggleActivity?: (open: boolean) => void;
  onActivityChange?: (appId: string | null) => void;
  currentUserId?: string;
  participantsCount: number;
}

export function useCallActivitySync({
  socket,
  channelId,
  activeAppIdRef,
  currentActiveAppRef,
  setActiveAppId,
  onToggleActivity,
  onActivityChange,
  currentUserId,
  participantsCount,
}: UseCallActivitySyncOptions) {
  useEffect(() => {
    if (!socket) return;
    const handleActivityEvent = (data: {
      fromSocketId?: string;
      channelId?: string;
      fromUserId?: string;
      action: string;
      payload?: any;
    }) => {
      if (!data) return;
      if (data.channelId && data.channelId !== channelId) return;
      if (data.action === 'ACTIVITY_LAUNCH' || data.action === 'START_ACTIVITY') {
        const { appId, appName, isSync } = data.payload || {};
        if (appId) {
          const isDifferentApp = appId !== activeAppIdRef.current;
          setActiveAppId(appId);
          onToggleActivity?.(true);
          onActivityChange?.(appId);

          const isLocal =
            (data.fromSocketId && data.fromSocketId === socket.id) ||
            (data.fromUserId && data.fromUserId === currentUserId);

          if (!isLocal && !isSync && isDifferentApp) {
            toast.info(`${appName || appId} aktif di panggung panggilan! 🚀`, {
              id: `activity-active-${channelId}`,
            });
          }
        }
      } else if (data.action === 'ACTIVITY_STOP') {
        const wasActive = !!activeAppIdRef.current;
        setActiveAppId(null);
        onToggleActivity?.(false);
        onActivityChange?.(null);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (url.searchParams.has('activity')) {
            url.searchParams.delete('activity');
            window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
          }
        }
        if (wasActive) {
          toast.info('Aktivitas dihentikan', {
            id: `activity-stop-${channelId}`,
          });
        }
      } else if (data.action === 'ACTIVITY_QUERY' || data.action === 'QUERY_ACTIVE_ACTIVITY') {
        if (activeAppIdRef.current) {
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId,
            action: 'ACTIVITY_LAUNCH',
            payload: {
              appId: activeAppIdRef.current,
              appName: currentActiveAppRef.current?.title || activeAppIdRef.current,
              isSync: true,
            },
          });
        }
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleActivityEvent);

    socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId,
      action: 'ACTIVITY_QUERY',
    });

    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleActivityEvent);
    };
  }, [socket, channelId, onToggleActivity, onActivityChange, currentUserId]);

  useEffect(() => {
    if (activeAppIdRef.current && socket && participantsCount > 0) {
      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId,
        action: 'ACTIVITY_LAUNCH',
        payload: {
          appId: activeAppIdRef.current,
          appName: currentActiveAppRef.current?.title || activeAppIdRef.current,
          isSync: true,
        },
      });
    }
  }, [participantsCount, socket, channelId]);
}
