import { useEffect } from 'react';
import { type ColonyMessage, type ColonyChannel, type Colony, resolveChannelType } from '@/chat/chat-types';
import { saveStoredChannels, saveStoredMessages, loadStoredMessages, saveStoredDmChannels, saveStoredColonies, setClosedDmId } from '@/chat/chat-defaults';

export interface UseColonySocketOptions {
  socket: any;
  activeChannelId: string;
  setMessagesMap: React.Dispatch<React.SetStateAction<Record<string, ColonyMessage[]>>>;
  setChannels: React.Dispatch<React.SetStateAction<ColonyChannel[]>>;
  setActiveChannelId: React.Dispatch<React.SetStateAction<string>>;
  setActiveCallCounts?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setColonies?: React.Dispatch<React.SetStateAction<Colony[]>>;
  activeColonyId?: string;
  setActiveColonyId?: (id: string) => void;
  currentUser?: any;
}

export function useColonySocket({
  socket,
  activeChannelId,
  setMessagesMap,
  setChannels,
  setActiveChannelId,
  setActiveCallCounts,
  setColonies,
  activeColonyId,
  setActiveColonyId,
  currentUser,
}: UseColonySocketOptions) {
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

    const handleIncomingMessage = (newMsg: ColonyMessage) => {
      if (!newMsg?.channelId) return;
      setMessagesMap((prev) => {
        const keysToUpdate = new Set<string>([newMsg.channelId]);

        // If message is for a DM, also associate with participating user IDs & active channel if matching
        if (newMsg.channelId.startsWith('dm-')) {
          setClosedDmId(newMsg.channelId, false);
          setChannels((prev) => {
            if (prev.some((c) => c.id === newMsg.channelId)) return prev;
            const parts = newMsg.channelId.slice(3).split('-').filter(Boolean);
            const myId = currentUser?.id ? String(currentUser.id) : '';
            const peerUserId =
              parts.find((p) => p !== myId && p !== 'chat') ||
              (String(newMsg.senderId) !== myId ? String(newMsg.senderId) : parts[0]);
            const isFromPeer = String(newMsg.senderId) !== myId;
            const dmName = (isFromPeer ? newMsg.senderName : null) || 'Direct Message';
            const dmAvatar = isFromPeer ? newMsg.senderAvatar : undefined;
            const newDm: ColonyChannel = {
              id: newMsg.channelId,
              name: dmName,
              description: `Percakapan langsung dengan ${dmName}`,
              category: 'DIRECT MESSAGES',
              colonyId: 'anticeil',
              isDirectMessage: true,
              dmUserId: peerUserId,
              avatar: dmAvatar,
              recipientAvatar: dmAvatar,
              type: 'text',
            };
            const updated = [newDm, ...prev];
            try {
              saveStoredDmChannels(updated.filter((c) => c.category === 'DIRECT MESSAGES'));
            } catch {}
            return updated;
          });

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

    const handleChannelCreated = (rawCh: ColonyChannel) => {
      if (!rawCh?.id) return;
      const newCh: ColonyChannel = {
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

    const handleChannelUpdated = (rawCh: ColonyChannel) => {
      if (!rawCh?.id) return;
      const updatedCh: ColonyChannel = {
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

    const handleColonyDeleted = ({ colonyId }: { colonyId: string }) => {
      if (!colonyId) return;
      if (setColonies) {
        setColonies((prev) => {
          const next = prev.filter((c) => c.id !== colonyId);
          saveStoredColonies(next);
          return next;
        });
      }
      setChannels((prev) => {
        const next = prev.filter((c) => c.colonyId !== colonyId);
        try {
          saveStoredChannels(next);
        } catch {}
        return next;
      });
      if (activeColonyId === colonyId && setActiveColonyId) {
        setActiveColonyId('anticeil');
        setActiveChannelId('');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('anticeil_colonies_changed'));
        window.dispatchEvent(new Event('anticeil_channels_changed'));
      }
    };

    const handleDiscoverColonyUpdated = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('anticeil_colonies_changed'));
      }
    };

    socket.on('COMMUNITY_CALL_STATE', handleCallState);
    socket.on('COMMUNITY_CHAT_MESSAGE', handleIncomingMessage);
    socket.on('COMMUNITY_MESSAGE_DELETED', handleMessageDeleted);
    socket.on('COMMUNITY_REACTION_UPDATED', handleReactionUpdated);
    socket.on('COMMUNITY_CHANNEL_CREATED', handleChannelCreated);
    socket.on('COMMUNITY_CHANNEL_UPDATED', handleChannelUpdated);
    socket.on('COMMUNITY_CHANNEL_DELETED', handleChannelDeleted);
    socket.on('COMMUNITY_COLONY_DELETED', handleColonyDeleted);
    socket.on('COMMUNITY_COLONY_DISCOVER_UPDATED', handleDiscoverColonyUpdated);

    return () => {
      socket.off('COMMUNITY_CALL_STATE', handleCallState);
      socket.off('COMMUNITY_CHAT_MESSAGE', handleIncomingMessage);
      socket.off('COMMUNITY_MESSAGE_DELETED', handleMessageDeleted);
      socket.off('COMMUNITY_REACTION_UPDATED', handleReactionUpdated);
      socket.off('COMMUNITY_CHANNEL_CREATED', handleChannelCreated);
      socket.off('COMMUNITY_CHANNEL_UPDATED', handleChannelUpdated);
      socket.off('COMMUNITY_CHANNEL_DELETED', handleChannelDeleted);
      socket.off('COMMUNITY_COLONY_DELETED', handleColonyDeleted);
      socket.off('COMMUNITY_COLONY_DISCOVER_UPDATED', handleDiscoverColonyUpdated);
    };
  }, [socket, activeChannelId, setMessagesMap, setChannels, setActiveChannelId, setActiveCallCounts, setColonies, activeColonyId, setActiveColonyId]);
}
