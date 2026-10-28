import { useEffect } from 'react';
import { type CommunityMessage, type CommunityChannel, resolveChannelType } from '@/chat/chat-types';
import { saveStoredChannels, saveStoredMessages, loadStoredMessages } from '@/chat/chat-defaults';

export interface UseCommunitySocketOptions {
  socket: any;
  activeChannelId: string;
  setMessagesMap: React.Dispatch<React.SetStateAction<Record<string, CommunityMessage[]>>>;
  setChannels: React.Dispatch<React.SetStateAction<CommunityChannel[]>>;
  setActiveChannelId: React.Dispatch<React.SetStateAction<string>>;
  setActiveCallCounts?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function useCommunitySocket({
  socket,
  activeChannelId,
  setMessagesMap,
  setChannels,
  setActiveChannelId,
  setActiveCallCounts,
}: UseCommunitySocketOptions) {
  useEffect(() => {
    if (!socket) return;

    const handleCallState = (data: { channelId: string; active: boolean; participantCount: number }) => {
      if (data?.channelId && setActiveCallCounts) {
        setActiveCallCounts((prev) => ({
          ...prev,
          [data.channelId]: data.active ? data.participantCount : 0,
        }));
      }
    };

    const handleIncomingMessage = (newMsg: CommunityMessage) => {
      if (!newMsg?.channelId) return;
      setMessagesMap((prev) => {
        const keysToUpdate = new Set<string>([newMsg.channelId]);

        // If message is for a DM, also associate with participating user IDs & active channel if matching
        if (newMsg.channelId.startsWith('dm-')) {
          const parts = newMsg.channelId.slice(3).split('-').filter(Boolean);
          if (parts.length === 2) {
            keysToUpdate.add(`dm-${parts[0]}`);
            keysToUpdate.add(`dm-${parts[1]}`);
          }
          if (activeChannelId?.startsWith('dm-')) {
            const activeParts = activeChannelId.slice(3).split('-').filter(Boolean);
            const matchesActive = parts.some((p) => activeParts.includes(p)) || activeParts.some((ap) => newMsg.channelId.includes(ap));
            if (matchesActive) {
              keysToUpdate.add(activeChannelId);
            }
          }
        }

        const updated = { ...prev };
        let hasChange = false;
        keysToUpdate.forEach((key) => {
          const list = updated[key] || [];
          if (!list.some((m) => m.id === newMsg.id)) {
            updated[key] = [...list, newMsg];
            hasChange = true;
          }
        });

        if (!hasChange) return prev;

        try {
          saveStoredMessages(updated);
        } catch {}
        return updated;
      });
    };

    const handleMessageDeleted = ({ id, channelId }: { id: string; channelId?: string }) => {
      setMessagesMap((prev) => {
        const ch = channelId || activeChannelId;
        const list = prev[ch] || [];
        const updated = {
          ...prev,
          [ch]: list.filter((m) => m.id !== id),
        };
        try {
          saveStoredMessages(updated);
        } catch {}
        return updated;
      });
    };

    const handleReactionUpdated = ({
      id,
      channelId,
      reactions,
    }: {
      id: string;
      channelId?: string;
      reactions: Record<string, string[]>;
    }) => {
      setMessagesMap((prev) => {
        const ch = channelId || activeChannelId;
        const list = prev[ch] || [];
        const updated = {
          ...prev,
          [ch]: list.map((m) => (m.id === id ? { ...m, reactions } : m)),
        };
        try {
          saveStoredMessages(updated);
        } catch {}
        return updated;
      });
    };

    const handleChannelCreated = (rawCh: CommunityChannel) => {
      if (!rawCh?.id) return;
      const newCh: CommunityChannel = {
        ...rawCh,
        type: resolveChannelType(rawCh),
      };
      setChannels((prev) => {
        if (prev.some((c) => c.id === newCh.id)) {
          return prev.map((c) => (c.id === newCh.id ? { ...c, ...newCh } : c));
        }
        const updated = [...prev, newCh];
        try {
          saveStoredChannels(updated);
        } catch {}
        return updated;
      });
    };

    const handleChannelUpdated = (rawCh: CommunityChannel) => {
      if (!rawCh?.id) return;
      const updatedCh: CommunityChannel = {
        ...rawCh,
        type: resolveChannelType(rawCh),
      };
      setChannels((prev) => {
        const updated = prev.map((c) => (c.id === updatedCh.id ? { ...c, ...updatedCh } : c));
        try {
          saveStoredChannels(updated);
        } catch {}
        return updated;
      });
    };

    const handleChannelDeleted = ({ id }: { id: string }) => {
      setChannels((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        try {
          saveStoredChannels(updated);
        } catch {}
        return updated;
      });
      setActiveChannelId((current) => (current === id ? '' : current));
    };

    socket.on('COMMUNITY_CALL_STATE', handleCallState);
    socket.on('COMMUNITY_CHAT_MESSAGE', handleIncomingMessage);
    socket.on('COMMUNITY_MESSAGE_DELETED', handleMessageDeleted);
    socket.on('COMMUNITY_REACTION_UPDATED', handleReactionUpdated);
    socket.on('COMMUNITY_CHANNEL_CREATED', handleChannelCreated);
    socket.on('COMMUNITY_CHANNEL_UPDATED', handleChannelUpdated);
    socket.on('COMMUNITY_CHANNEL_DELETED', handleChannelDeleted);

    return () => {
      socket.off('COMMUNITY_CALL_STATE', handleCallState);
      socket.off('COMMUNITY_CHAT_MESSAGE', handleIncomingMessage);
      socket.off('COMMUNITY_MESSAGE_DELETED', handleMessageDeleted);
      socket.off('COMMUNITY_REACTION_UPDATED', handleReactionUpdated);
      socket.off('COMMUNITY_CHANNEL_CREATED', handleChannelCreated);
      socket.off('COMMUNITY_CHANNEL_UPDATED', handleChannelUpdated);
      socket.off('COMMUNITY_CHANNEL_DELETED', handleChannelDeleted);
    };
  }, [socket, activeChannelId, setMessagesMap, setChannels, setActiveChannelId, setActiveCallCounts]);
}
