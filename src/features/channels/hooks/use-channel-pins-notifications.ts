import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { colonyApi } from '@/chat/chat-api';
import type {
  ColonyChannel,
  ColonyMessage,
  ColonyChannelNotification,
  ColonyChannelNotificationLevel,
} from '@/chat/chat-types';

interface UseChannelPinsNotificationsOptions {
  activeChannel: ColonyChannel | null;
  socket?: any;
}

export function useChannelPinsNotifications({
  activeChannel,
  socket,
}: UseChannelPinsNotificationsOptions) {
  const [isPinnedPopoverOpen, setIsPinnedPopoverOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ColonyMessage[]>([]);

  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [channelNotification, setChannelNotification] = useState<ColonyChannelNotification>({
    channelId: '',
    userId: 'me',
    level: 'default',
    isMuted: false,
    mutedUntil: null,
  });

  // 1. Fetch channel pinned messages on channel switch
  useEffect(() => {
    if (!activeChannel?.id) {
      setPinnedMessages([]);
      return;
    }
    let isMounted = true;
    colonyApi.getPinnedMessages(activeChannel.id).then((pins) => {
      if (isMounted && Array.isArray(pins)) {
        setPinnedMessages(pins);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeChannel?.id]);

  // 2. Realtime socket event listeners for pins
  useEffect(() => {
    if (!socket || !activeChannel?.id) return;

    const handlePinned = (msg: ColonyMessage) => {
      if (msg.channelId === activeChannel.id) {
        setPinnedMessages((prev) => {
          if (msg.isPinned) {
            const exists = prev.some((p) => p.id === msg.id);
            if (exists) {
              return prev.map((p) => (p.id === msg.id ? { ...p, ...msg } : p));
            }
            return [msg, ...prev];
          } else {
            return prev.filter((p) => p.id !== msg.id);
          }
        });
      }
    };

    const handleUnpinned = (msg: ColonyMessage) => {
      if (msg.channelId === activeChannel.id) {
        setPinnedMessages((prev) => prev.filter((p) => p.id !== msg.id));
      }
    };

    socket.on('COMMUNITY_MESSAGE_PINNED', handlePinned);
    socket.on('COMMUNITY_MESSAGE_UNPINNED', handleUnpinned);

    return () => {
      socket.off('COMMUNITY_MESSAGE_PINNED', handlePinned);
      socket.off('COMMUNITY_MESSAGE_UNPINNED', handleUnpinned);
    };
  }, [socket, activeChannel?.id]);

  const handleUpdateNotification = useCallback(
    async (
      level?: ColonyChannelNotificationLevel,
      muteState?: boolean,
      mutedUntil?: string | null,
    ) => {
      if (!activeChannel) return;
      const nextLevel = level !== undefined ? level : channelNotification.level;
      const nextMuted = muteState !== undefined ? muteState : channelNotification.isMuted;
      const nextUntil = mutedUntil !== undefined ? mutedUntil : channelNotification.mutedUntil;

      setChannelNotification((prev) => ({
        ...prev,
        level: nextLevel,
        isMuted: nextMuted,
        mutedUntil: nextUntil,
      }));

      try {
        await colonyApi.updateChannelNotification(activeChannel.id, {
          level: nextLevel,
          isMuted: nextMuted,
          mutedUntil: nextUntil,
        });
        if (muteState !== undefined) {
          toast.success(nextMuted ? 'Saluran dibisukan 🔕' : 'Saluran dibunyikan kembali 🔔');
        } else {
          toast.success(`Notifikasi saluran diatur ke: ${nextLevel}`);
        }
      } catch (err) {
        console.error('Failed to update notification settings', err);
        toast.error('Gagal memperbarui notifikasi saluran');
      }
    },
    [activeChannel, channelNotification],
  );

  return {
    isPinnedPopoverOpen,
    setIsPinnedPopoverOpen,
    pinnedMessages,
    setPinnedMessages,
    isNotificationDropdownOpen,
    setIsNotificationDropdownOpen,
    channelNotification,
    setChannelNotification,
    handleUpdateNotification,
  };
}
