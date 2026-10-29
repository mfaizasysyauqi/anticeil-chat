import { useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import {
  CommunityChannel,
  CommunityHub,
  CommunityMember,
  CommunityMessage,
  CommunityRole,
} from '@/chat/chat-types';
import { EXTENDED_DISCORD_APPS } from '@/lib/constants';
import { communityApi } from '@/lib/api';

export interface UseActivityLauncherOptions {
  channels: CommunityChannel[];
  setChannels: React.Dispatch<React.SetStateAction<CommunityChannel[]>>;
  dmChannels: CommunityChannel[];
  activeChannel: CommunityChannel | null;
  activeCallChannelId: string | null;
  activeHubId: string;
  activeHub: CommunityHub | null;
  currentUser: any;
  members: CommunityMember[];
  socket?: Socket | null;
  t: (key: string) => string;
  setSelectedActivityAppId: (appId: string) => void;
  setIsTemplatePopoverOpen: (open: boolean) => void;
  setActiveHubId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  setActiveCallChannelId: (id: string | null) => void;
  setIsCallPiP: (pip: boolean) => void;
  setIsActivityOpen: (open: boolean) => void;
  setMessagesMap: React.Dispatch<React.SetStateAction<Record<string, CommunityMessage[]>>>;
}

export function useActivityLauncher(options: UseActivityLauncherOptions) {
  const {
    channels,
    setChannels,
    dmChannels,
    activeChannel,
    activeCallChannelId,
    activeHubId,
    activeHub,
    currentUser,
    members,
    socket,
    t,
    setSelectedActivityAppId,
    setIsTemplatePopoverOpen,
    setActiveHubId,
    setActiveChannelId,
    setActiveCallChannelId,
    setIsCallPiP,
    setIsActivityOpen,
    setMessagesMap,
  } = options;

  const handleLaunchActivity = useCallback(
    async (
      appId: string,
      fromChatInvite: boolean = false,
      targetChannelId?: string,
    ) => {
      setSelectedActivityAppId(appId);
      setIsTemplatePopoverOpen(false);

      // 1. Determine target channel and whether it's a DM
      const targetChannel =
        (targetChannelId ? channels.find((c) => c.id === targetChannelId) : null) ||
        activeChannel;
      const isDM = targetChannelId?.startsWith('dm-') || targetChannel?.isDirectMessage;

      // 2. Resolve destination channel for voice/activity stage:
      let voiceDest: CommunityChannel | null = null;

      if (isDM) {
        // In DM, the DM channel itself is the call/activity stage
        const dmId = targetChannelId || targetChannel?.id || 'dm-chat';
        let dmCh = channels.find((c) => c.id === dmId);
        if (!dmCh) {
          const fallbackDM: CommunityChannel = {
            id: dmId,
            name: targetChannel?.name || 'Direct Message',
            description: `Direct Message (${dmId})`,
            category: 'DIRECT MESSAGES',
            hubId: 'anticeil',
            isDirectMessage: true,
            type: 'text',
          };
          dmCh = dmChannels.find((c) => c.id === dmId) || fallbackDM;
          setChannels((prev) => (prev.some((c) => c.id === dmId) ? prev : [...prev, dmCh!]));
        }
        voiceDest = dmCh || null;
      } else {
        // In Server: if already in / already have a voice call active, attach activity there.
        // If the current channel is a text channel (NOT voice), keep the activity
        // inline in that text channel — do NOT jump to a voice channel.
        if (targetChannelId) {
          voiceDest = channels.find((c) => c.id === targetChannelId) || null;
        }
        if (!voiceDest && activeCallChannelId) {
          voiceDest = channels.find((c) => c.id === activeCallChannelId) || null;
        }
        if (!voiceDest && targetChannel) {
          voiceDest = targetChannel;
        }
        if (!voiceDest && activeChannel) {
          voiceDest = activeChannel;
        }
      }

      const app = EXTENDED_DISCORD_APPS.find((a) => a.id === appId) || {
        id: appId,
        title: appId === 'watch-together' || appId === 'youtube' ? 'Watch Together' : appId,
        developer: appId === 'watch-together' || appId === 'youtube' ? 'YouTube' : 'Community App',
        description: 'Tonton video YouTube bersama rekan secara sinkron realtime tanpa delay.',
        icon: '▶️',
        iconBg: 'bg-red-600',
        bannerGradient: 'bg-white',
      };

      if (voiceDest) {
        if (voiceDest.hubId && voiceDest.hubId !== activeHubId) {
          setActiveHubId(voiceDest.hubId);
        }
        setActiveChannelId(voiceDest.id);
        setActiveCallChannelId(voiceDest.id);
        setIsCallPiP(false);
        setIsActivityOpen(true);
        socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
          channelId: voiceDest.id,
          action: 'START_ACTIVITY',
          payload: { appId },
        });

        toast.success(t(`Aktivitas ${app.title} diluncurkan! 🚀`));
      }

      // 3. Post Discord-like Bot Invitation Message in the destination text channel (DM or Server)
      if (!fromChatInvite) {
        let textChannelToSendId: string | null = null;
        if (isDM) {
          textChannelToSendId = targetChannelId || voiceDest?.id || null;
        } else if (targetChannel && targetChannel.type !== 'voice') {
          textChannelToSendId = targetChannel.id;
        } else if (
          targetChannelId &&
          !channels.find((c) => c.id === targetChannelId && c.type === 'voice')
        ) {
          textChannelToSendId = targetChannelId;
        } else {
          // Voice channel selected in server: post to the hub's main text channel or to the voice channel's chat
          const hubId = voiceDest?.hubId || activeHubId;
          const hubTextCh = channels.find(
            (c) => (c.hubId || 'anticeil') === hubId && (c.type === 'text' || !c.type),
          );
          textChannelToSendId = hubTextCh?.id || targetChannelId || voiceDest?.id || null;
        }

        if (textChannelToSendId) {
          const currentUserId = currentUser?.id || 'anon-user';
          const currentUserName =
            `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
            currentUser?.name ||
            currentUser?.email?.split('@')[0] ||
            'Pengguna Anticeil';

          const myMemberInfo = members.find(
            (m) => m.id === currentUserId || m.email === currentUser?.email,
          );
          let myRole: CommunityRole = myMemberInfo?.role || 'member';
          if (activeHub?.role === 'owner') myRole = 'owner';
          else if (activeHub?.role === 'admin') myRole = 'admin';

          const payload: Partial<CommunityMessage> = {
            channelId: textChannelToSendId,
            senderId: currentUserId,
            senderName: currentUserName,
            senderEmail: currentUser?.email || 'user@anticeil.com',
            senderAvatar: currentUser?.imageUrl ?? null,
            senderRole: myRole,
            content: '',
            attachments: [
              {
                type: 'activity',
                url: '',
                name: app.title,
                activityData: {
                  appId,
                  name: app.title,
                  developer: app.developer,
                  description: app.description,
                  icon: app.icon,
                  iconBg: app.iconBg,
                  bannerGradient: app.bannerGradient,
                  startedBy: currentUserName,
                  startedById: currentUserId,
                  startedByAvatar: currentUser?.imageUrl ?? null,
                  channelId: voiceDest?.id || textChannelToSendId,
                  channelName: voiceDest?.name || 'Call Stage',
                },
              },
            ],
          };

          try {
            const saved = await communityApi.sendMessage(textChannelToSendId, payload);
            setMessagesMap((prev) => {
              const list = prev[textChannelToSendId!] || [];
              if (list.some((m) => m.id === saved.id)) return prev;
              return { ...prev, [textChannelToSendId!]: [...list, saved] };
            });
          } catch (err) {
            console.error('Failed to send activity invite message', err);
            const optimisticMsg: CommunityMessage = {
              id: `msg-act-${Date.now()}`,
              channelId: textChannelToSendId,
              senderId: currentUserId,
              senderName: currentUserName,
              senderEmail: currentUser?.email || 'user@anticeil.com',
              senderAvatar: currentUser?.imageUrl ?? null,
              senderRole: myRole,
              content: '',
              createdAt: new Date().toISOString(),
              attachments: payload.attachments,
            };
            setMessagesMap((prev) => {
              const list = prev[textChannelToSendId!] || [];
              return { ...prev, [textChannelToSendId!]: [...list, optimisticMsg] };
            });
          }
        }
      }
    },
    [
      setSelectedActivityAppId,
      setIsTemplatePopoverOpen,
      channels,
      setChannels,
      dmChannels,
      activeChannel,
      activeCallChannelId,
      activeHubId,
      setActiveHubId,
      setActiveChannelId,
      setActiveCallChannelId,
      setIsCallPiP,
      setIsActivityOpen,
      socket,
      t,
      currentUser,
      members,
      activeHub,
      setMessagesMap,
    ],
  );

  return { handleLaunchActivity };
}
