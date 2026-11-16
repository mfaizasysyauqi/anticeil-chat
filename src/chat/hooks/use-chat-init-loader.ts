import { useEffect } from 'react';
import { colonyApi } from '../chat-api';
import { friendsApi } from '@/features/friends';
import {
  DEFAULT_COLONIES,
  loadStoredColonies,
  saveStoredColonies,
  getDmChannelId,
  loadStoredDmChannels,
  saveStoredDmChannels,
} from '../chat-defaults';
import type {
  Colony,
  ColonyChannel,
  ColonyMember,
  ColonyMessage,
  ColonyThread,
  ColonyChannelNotification,
} from '../chat-types';

export const authenticationSession: any = {
  getToken: () =>
    localStorage.getItem('token') || localStorage.getItem('ap_token'),
  getProjectId: () => localStorage.getItem('projectId') || 'default',
  getUser: () => {
    try {
      const raw =
        localStorage.getItem('user') ||
        localStorage.getItem('currentUser') ||
        localStorage.getItem('anticeil_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

export interface UseChatInitLoaderProps {
  currentUser: any;
  activeColonyId: string;
  activeChannelId: string;
  colonyChannels: ColonyChannel[];
  members: ColonyMember[];
  activeCallCounts: Record<string, number>;
  setChannels: React.Dispatch<React.SetStateAction<ColonyChannel[]>>;
  setMembers: React.Dispatch<React.SetStateAction<ColonyMember[]>>;
  setColonies: React.Dispatch<React.SetStateAction<Colony[]>>;
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: React.Dispatch<React.SetStateAction<string>>;
  setActiveCallChannelId: (id: string | null) => void;
  setIsCallPiP: (pip: boolean) => void;
  setSelectedActivityAppId: (appId: string | null) => void;
  setIsActivityOpen: (open: boolean) => void;
  setMessagesMap: React.Dispatch<
    React.SetStateAction<Record<string, ColonyMessage[]>>
  >;
  setPinnedMessages: React.Dispatch<React.SetStateAction<ColonyMessage[]>>;
  setChannelNotification: (notif: ColonyChannelNotification) => void;
  setChannelThreads: React.Dispatch<React.SetStateAction<ColonyThread[]>>;
  setThreadsMap: React.Dispatch<
    React.SetStateAction<Record<string, ColonyThread[]>>
  >;
  handleJoinColony: (inviteCode: string) => void;
}

export function useChatInitLoader({
  currentUser,
  activeColonyId,
  activeChannelId,
  colonyChannels,
  members,
  activeCallCounts,
  setChannels,
  setMembers,
  setColonies,
  setActiveColonyId,
  setActiveChannelId,
  setActiveCallChannelId,
  setIsCallPiP,
  setSelectedActivityAppId,
  setIsActivityOpen,
  setMessagesMap,
  setPinnedMessages,
  setChannelNotification,
  setChannelThreads,
  setThreadsMap,
  handleJoinColony,
}: UseChatInitLoaderProps) {
  // 1. Initial Load from Backend API
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const token = authenticationSession.getToken();
      if (!token) {
        if (mounted) {
          setChannels([]);
          setMembers([]);
          setColonies(DEFAULT_COLONIES);
          setActiveColonyId('anticeil');
          setActiveChannelId('');
        }
        return;
      }
      try {
        const currentProjectId = authenticationSession.getProjectId();
        const [channelsRes, membersRes, hubsRes, friendsRes] =
          await Promise.all([
            colonyApi.getChannels(),
            colonyApi.getMembers(currentProjectId || undefined),
            colonyApi.getColonies(),
            friendsApi.getFriends().catch(() => []),
          ]);
        if (mounted) {
          if (Array.isArray(channelsRes)) {
            const storedDms = loadStoredDmChannels();
            const serverChannels = channelsRes.filter(
              (c) =>
                c.category !== 'DIRECT MESSAGES' && !c.id.startsWith('dm-'),
            );
            const mergedAllChannels = [...storedDms, ...serverChannels];
            setChannels(mergedAllChannels);

            const targetChannelParam = new URLSearchParams(
              window.location.search,
            ).get('channel');
            const targetActivityParam = new URLSearchParams(
              window.location.search,
            ).get('activity');
            if (targetActivityParam) {
              const normalizedAct =
                targetActivityParam === 'youtube'
                  ? 'watch-together'
                  : targetActivityParam;
              setSelectedActivityAppId(normalizedAct);
              setIsActivityOpen(true);
            }
            if (targetChannelParam) {
              let matchedChannel = mergedAllChannels.find(
                (c) => c.id === targetChannelParam,
              );
              if (!matchedChannel && targetActivityParam) {
                matchedChannel = mergedAllChannels.find(
                  (c) =>
                    (c.colonyId || 'anticeil') === activeColonyId &&
                    c.type === 'voice',
                );
              }
              if (matchedChannel) {
                setActiveChannelId(matchedChannel.id);
                if (matchedChannel.type === 'voice') {
                  setActiveCallChannelId(matchedChannel.id);
                  setIsCallPiP(false);
                }
              }
            } else if (targetActivityParam) {
              const activeVoice = channelsRes.find(
                (c) =>
                  (c.colonyId || 'anticeil') === activeColonyId &&
                  c.type === 'voice',
              );
              if (activeVoice) {
                setActiveChannelId(activeVoice.id);
                setActiveCallChannelId(activeVoice.id);
                setIsCallPiP(false);
              }
            } else if (
              channelsRes.length > 0 &&
              activeColonyId !== 'anticeil'
            ) {
              const activeVoice = channelsRes.find(
                (c) =>
                  (c.colonyId || 'anticeil') === activeColonyId &&
                  c.type === 'voice' &&
                  (activeCallCounts[c.id] || 0) > 0,
              );
              if (activeVoice) {
                setActiveChannelId(activeVoice.id);
                setActiveCallChannelId(activeVoice.id);
                setIsCallPiP(false);
              } else {
                setActiveChannelId((curr) => curr || channelsRes[0].id);
              }
            }
          }
          if (Array.isArray(membersRes)) {
            setMembers(membersRes);
          }
          if (Array.isArray(hubsRes) && hubsRes.length > 0) {
            setColonies((prev) => {
              const home =
                prev.find((h) => h.id === 'anticeil') || DEFAULT_COLONIES[0];
              const merged = [
                home,
                ...hubsRes.filter((s) => s.id !== 'anticeil'),
              ];
              saveStoredColonies(merged);
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Initial community load fallback', err);
      }
    };
    loadData();

    // Check if user came from an invite link: /messages?invite=xyz
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    const activityParam = params.get('activity');
    if (activityParam) {
      setSelectedActivityAppId(activityParam);
      setIsActivityOpen(true);
    }
    if (inviteParam) {
      handleJoinColony(inviteParam);
    }

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load Messages, Pins, Notifications & Threads when Active Channel Changes
  useEffect(() => {
    if (!activeChannelId) return;
    let mounted = true;
    const loadChannelData = async () => {
      try {
        const [msgs, pins, notif, ths] = await Promise.all([
          colonyApi.getMessages(activeChannelId),
          colonyApi.getPinnedMessages(activeChannelId),
          colonyApi.getChannelNotification(activeChannelId),
          colonyApi.getThreads(activeChannelId),
        ]);
        if (mounted) {
          if (msgs) {
            setMessagesMap((prev) => ({
              ...prev,
              [activeChannelId]: msgs,
            }));
          }
          if (pins) {
            setPinnedMessages(pins);
          }
          if (notif) {
            setChannelNotification(notif);
          }
          if (ths) {
            setChannelThreads(ths);
            setThreadsMap((prev) => ({ ...prev, [activeChannelId]: ths }));
          }
        }
      } catch (err) {
        console.warn('Failed to load channel data', activeChannelId, err);
      }
    };
    loadChannelData();
    return () => {
      mounted = false;
    };
  }, [activeChannelId]);

  // 3. Canonicalize DM channel ID when opened with legacy single-user id (e.g. ?channel=dm-userId)
  useEffect(() => {
    if (!currentUser?.id || !activeChannelId?.startsWith('dm-')) return;
    const parts = activeChannelId.slice(3).split('-').filter(Boolean);
    if (parts.length === 1 && parts[0] && parts[0] !== currentUser.id) {
      const otherUserId = parts[0];
      const canonicalId = getDmChannelId(currentUser.id, otherUserId);
      const otherMember = members.find((m) => m.id === otherUserId);
      const dmName =
        otherMember?.name || otherMember?.username || 'Direct Message';

      setChannels((prev) => {
        const exists = prev.some((c) => c.id === canonicalId);
        if (exists) return prev;
        const newDm: ColonyChannel = {
          id: canonicalId,
          name: dmName,
          description: `Percakapan langsung dengan ${dmName}`,
          category: 'DIRECT MESSAGES',
          colonyId: 'anticeil',
          isDirectMessage: true,
          dmUserId: otherUserId,
          type: 'text',
        };
        const updated = [newDm, ...prev];
        saveStoredDmChannels(
          updated.filter((c) => c.category === 'DIRECT MESSAGES'),
        );
        return updated;
      });

      setActiveChannelId(canonicalId);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('channel', canonicalId);
        window.history.replaceState(null, '', url.pathname + url.search);
      } catch {}
    }
  }, [currentUser?.id, activeChannelId, members]);

  // 4. Load threads for all forum channels in the active hub so sidebar shows child threads
  useEffect(() => {
    if (!colonyChannels.length) return;
    const forumChannels = colonyChannels.filter((c) => c.type === 'forum');
    if (!forumChannels.length) return;

    forumChannels.forEach(async (fc) => {
      try {
        const ths = await colonyApi.getThreads(fc.id);
        if (ths) {
          setThreadsMap((prev) => ({ ...prev, [fc.id]: ths }));
        }
      } catch {}
    });
  }, [colonyChannels]);

  // 5. Auto-fetch and sync channels when switching to a colony
  useEffect(() => {
    if (!activeColonyId || activeColonyId === 'anticeil') return;
    let mounted = true;
    const loadColonyChannels = async () => {
      try {
        const res = await colonyApi.getChannels(activeColonyId);
        if (mounted && Array.isArray(res)) {
          setChannels((prev) => {
            const others = prev.filter(
              (c) => (c.colonyId || 'anticeil') !== activeColonyId,
            );
            return [...others, ...res];
          });
          const targetChannelParam = new URLSearchParams(
            window.location.search,
          ).get('channel');
          const targetActivityParam = new URLSearchParams(
            window.location.search,
          ).get('activity');
          if (targetActivityParam) {
            const normalizedAct =
              targetActivityParam === 'youtube'
                ? 'watch-together'
                : targetActivityParam;
            setSelectedActivityAppId(normalizedAct);
            setIsActivityOpen(true);
          }
          let matchedTarget = res.find((c) => c.id === targetChannelParam);
          if (!matchedTarget && targetActivityParam) {
            matchedTarget = res.find((c) => c.type === 'voice');
          }
          if (matchedTarget) {
            setActiveChannelId(matchedTarget.id);
            if (matchedTarget.type === 'voice') {
              setActiveCallChannelId(matchedTarget.id);
              setIsCallPiP(false);
            }
          } else {
            setActiveChannelId((curr) => {
              const exists = res.some((c) => c.id === curr);
              if (exists) return curr;
              if (targetActivityParam) {
                const voiceCh = res.find((c) => c.type === 'voice');
                if (voiceCh) {
                  setActiveCallChannelId(voiceCh.id);
                  setIsCallPiP(false);
                  return voiceCh.id;
                }
              }
              const activeVoice = res.find(
                (c) =>
                  c.type === 'voice' && (activeCallCounts[c.id] || 0) > 0,
              );
              if (activeVoice) {
                setActiveCallChannelId(activeVoice.id);
                setIsCallPiP(false);
                return activeVoice.id;
              }
              return res[0]?.id || '';
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load channels for colony', activeColonyId, err);
      }
    };
    loadColonyChannels();
    return () => {
      mounted = false;
    };
  }, [activeColonyId]);

  // 6. Mark channel read when opened
  useEffect(() => {
    if (activeChannelId && currentUser?.id) {
      colonyApi.markChannelRead(activeChannelId, currentUser.id);
    }
  }, [activeChannelId, currentUser?.id]);
}
