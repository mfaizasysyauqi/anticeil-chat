import { useEffect } from 'react';
import type { CommunityMessage, CommunityChannel } from '@/chat/chat-types';

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
      setMessagesMap((prev) => {
        const list = prev[newMsg.channelId] || [];
        if (list.some((m) => m.id === newMsg.id)) return prev;
        return {
          ...prev,
          [newMsg.channelId]: [...list, newMsg],
        };
      });
    };

    const handleMessageDeleted = ({ id, channelId }: { id: string; channelId?: string }) => {
      setMessagesMap((prev) => {
        const ch = channelId || activeChannelId;
        const list = prev[ch] || [];
        return {
          ...prev,
          [ch]: list.filter((m) => m.id !== id),
        };
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
        return {
          ...prev,
          [ch]: list.map((m) => (m.id === id ? { ...m, reactions } : m)),
        };
      });
    };

    const handleChannelCreated = (newCh: CommunityChannel) => {
      setChannels((prev) => {
        if (prev.some((c) => c.id === newCh.id)) return prev;
        return [...prev, newCh];
      });
    };

    const handleChannelUpdated = (updatedCh: CommunityChannel) => {
      setChannels((prev) => prev.map((c) => (c.id === updatedCh.id ? { ...c, ...updatedCh } : c)));
    };

    const handleChannelDeleted = ({ id }: { id: string }) => {
      setChannels((prev) => prev.filter((c) => c.id !== id));
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
