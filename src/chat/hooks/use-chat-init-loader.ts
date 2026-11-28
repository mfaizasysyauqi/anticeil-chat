import { useEffect, useRef } from 'react';
import { colonyApi } from '../chat-api';
import { friendsApi } from '@/features/friends';
import {
  DEFAULT_COLONIES,
  DUMMY_COLONY_IDS,
  loadStoredColonies,
  saveStoredColonies,
  getDmChannelId,
  loadStoredDmChannels,
  saveStoredDmChannels,
  getClosedDmIds,
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
  const initialTargetChannelRef = useRef<string | null>(null);
  if (initialTargetChannelRef.current === null && typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const pathChannel =
      pathParts[0] === 'channels'
        ? pathParts[1] === '@me'
          ? pathParts[2]
          : pathParts[2]
        : null;
    initialTargetChannelRef.current =
      new URLSearchParams(window.location.search).get('channel') || pathChannel || null;
  }

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
        const effectiveUser = currentUser || authenticationSession.getUser();
        const [channelsRes, membersRes, hubsRes, friendsRes] =
          await Promise.all([
            colonyApi.getChannels(),
            colonyApi.getMembers(currentProjectId || undefined),
            colonyApi.getColonies(effectiveUser?.id),
            friendsApi.getFriends().catch(() => []),
          ]);
        if (mounted) {
          if (Array.isArray(channelsRes)) {
            const storedDms = loadStoredDmChannels();
            const effectiveUser = currentUser || authenticationSession.getUser();
            if (Array.isArray(friendsRes) && effectiveUser?.id) {
              const closedDmIds = getClosedDmIds();
              friendsRes.forEach((f: any) => {
                if (!f || !f.id || f.id === effectiveUser.id) return;
                const canonicalDmId = getDmChannelId(effectiveUser.id, f.id);
                if (closedDmIds.has(canonicalDmId)) return;
                const alreadyExists = storedDms.some(
                  (c) => c.id === canonicalDmId || c.dmUserId === f.id || c.id === `dm-${f.id}`,
                );
                const dmAvatar = f.avatar || f.imageUrl || null;
                if (!alreadyExists) {
                  const dmName = f.name || f.username || 'Direct Message';
                  storedDms.push({
                    id: canonicalDmId,
                    name: dmName,
                    description: `Percakapan langsung dengan ${dmName}`,
                    category: 'DIRECT MESSAGES',
                    colonyId: 'anticeil',
                    isDirectMessage: true,
                    dmUserId: f.id,
                    avatar: dmAvatar,
                    recipientAvatar: dmAvatar,
                    type: 'text',
                  });
                } else if (dmAvatar) {
                  const existingDm = storedDms.find(
                    (c) => c.id === canonicalDmId || c.dmUserId === f.id || c.id === `dm-${f.id}`,
                  );
                  if (existingDm && !existingDm.avatar) {
                    existingDm.avatar = dmAvatar;
                    existingDm.recipientAvatar = dmAvatar;
                  }
                }
              });
              saveStoredDmChannels(storedDms);
            }

            // Sync server-persisted group DMs for effective user
            channelsRes.forEach((c: any) => {
              if (c.isGroupDm || (c.category === 'DIRECT MESSAGES' && c.id?.startsWith('gdm-'))) {
                const isMember =
                  !c.dmUserIds ||
                  !effectiveUser?.id ||
                  c.dmUserIds.includes(effectiveUser.id) ||
                  c.ownerId === effectiveUser.id;
                if (isMember && !storedDms.some((d) => d.id === c.id)) {
                  storedDms.push(c);
                }
              }
            });
            saveStoredDmChannels(storedDms);

            const serverChannels = channelsRes.filter(
              (c) =>
                c.category !== 'DIRECT MESSAGES' && !c.id.startsWith('dm-') && !c.id.startsWith('gdm-'),
            );
            const mergedAllChannels = [...storedDms, ...serverChannels];
            setChannels(mergedAllChannels);

            const pathParts = window.location.pathname.split('/').filter(Boolean);
            const pathChannelId =
              pathParts[0] === 'channels'
                ? pathParts[1] === '@me'
                  ? pathParts[2]
                  : pathParts[2]
                : null;
            const targetChannelParam =
              pathChannelId ||
              new URLSearchParams(window.location.search).get('channel');
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
              const matchedChannel = mergedAllChannels.find(
                (c) => c.id === targetChannelParam,
              );
              if (matchedChannel) {
                setActiveChannelId(matchedChannel.id);
                if (matchedChannel.type === 'voice') {
                  setActiveCallChannelId(matchedChannel.id);
                  setIsCallPiP(false);
                }
              }
            } else if (
              mergedAllChannels.length > 0 &&
              activeColonyId &&
              activeColonyId !== 'anticeil'
            ) {
              const generalCh = mergedAllChannels.find(
                (c) => (c.colonyId || 'anticeil') === activeColonyId && c.name === 'general'
              );
              const firstTextChannel =
                generalCh ||
                mergedAllChannels.find(
                  (c) =>
                    (c.colonyId || 'anticeil') === activeColonyId &&
                    (c.type === 'text' || !c.type) &&
                    !c.isDirectMessage,
                ) ||
                mergedAllChannels.find(
                  (c) => (c.colonyId || 'anticeil') === activeColonyId,
                );
              if (firstTextChannel) {
                setActiveChannelId((curr) => curr || firstTextChannel.id);
              }
            }
          }
          if (Array.isArray(membersRes)) {
            setMembers(membersRes);
          }
          if (Array.isArray(hubsRes)) {
            setColonies(() => {
              const home =
                hubsRes.find((h) => h.id === 'anticeil') || DEFAULT_COLONIES[0];
              const userColonies = [
                home,
                ...hubsRes.filter((s) => s.id !== 'anticeil' && !DUMMY_COLONY_IDS.has(s.id)),
              ];
              saveStoredColonies(userColonies);
              return userColonies;
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

  // 1b. Reactive Colony Sync when currentUser is populated or switched
  useEffect(() => {
    const uid = currentUser?.id || authenticationSession.getUser()?.id;
    if (!uid) return;
    let mounted = true;
    colonyApi.getColonies(uid).then((res) => {
      if (mounted && Array.isArray(res) && res.length > 0) {
        setColonies(() => {
          const home = res.find((h) => h.id === 'anticeil') || DEFAULT_COLONIES[0];
          const userColonies = [
            home,
            ...res.filter((s) => s.id !== 'anticeil' && !DUMMY_COLONY_IDS.has(s.id)),
          ];
          saveStoredColonies(userColonies);
          return userColonies;
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

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

  // 4. Dynamically synchronize accepted friends into direct message channels
  useEffect(() => {
    const syncFriendsToDm = (friendsList?: any[]) => {
      const effectiveUser = currentUser || authenticationSession.getUser();
      if (!effectiveUser?.id) return;

      const processFriends = (friends: any[]) => {
        if (!Array.isArray(friends) || friends.length === 0) return;
        const closedDmIds = getClosedDmIds();
        setChannels((prev) => {
          let hasChange = false;
          const updated = [...prev];
          friends.forEach((f) => {
            if (!f || !f.id || f.id === effectiveUser.id) return;
            const canonicalDmId = getDmChannelId(effectiveUser.id, f.id);
            if (closedDmIds.has(canonicalDmId)) return;
            const exists = updated.some(
              (c) => c.id === canonicalDmId || c.dmUserId === f.id || c.id === `dm-${f.id}`,
            );
            if (!exists) {
              const dmName = f.name || f.username || 'Direct Message';
              updated.unshift({
                id: canonicalDmId,
                name: dmName,
                description: `Percakapan langsung dengan ${dmName}`,
                category: 'DIRECT MESSAGES',
                colonyId: 'anticeil',
                isDirectMessage: true,
                dmUserId: f.id,
                type: 'text',
              });
              hasChange = true;
            }
          });
          if (hasChange) {
            saveStoredDmChannels(updated.filter((c) => c.category === 'DIRECT MESSAGES'));
            return updated;
          }
          return prev;
        });
      };

      if (friendsList) {
        processFriends(friendsList);
      } else {
        friendsApi.getFriends().then(processFriends).catch(() => {});
      }
    };

    syncFriendsToDm();

    const handleFriendsUpdated = (e: any) => {
      syncFriendsToDm(e?.detail);
    };
    window.addEventListener('anticeil_friends_updated', handleFriendsUpdated);
    return () => {
      window.removeEventListener('anticeil_friends_updated', handleFriendsUpdated);
    };
  }, [currentUser?.id, setChannels]);

  // 5. Load threads for all forum channels in the active hub so sidebar shows child threads
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
          const validColonyChannels = res
            .map((c) => ({
              ...c,
              colonyId: c.colonyId || (c as any).hubId || activeColonyId,
            }))
            .filter((c) => (c.colonyId || 'anticeil') === activeColonyId);

          setChannels((prev) => {
            const others = prev.filter(
              (c) => (c.colonyId || 'anticeil') !== activeColonyId,
            );
            const seenIds = new Set(others.map((c) => c.id));
            const fresh = validColonyChannels.filter((c) => !seenIds.has(c.id));
            return [...others, ...fresh];
          });
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          const pathChannel =
            pathParts[0] === 'channels' && pathParts[2] && pathParts[2] !== '@me'
              ? pathParts[2]
              : null;
          const targetChannelParam =
            initialTargetChannelRef.current ||
            new URLSearchParams(window.location.search).get('channel') ||
            pathChannel ||
            activeChannelId;
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
          let matchedTarget = targetChannelParam
            ? res.find((c) => c.id === targetChannelParam)
            : null;
          if (matchedTarget) {
            setActiveChannelId(matchedTarget.id);
            if (matchedTarget.type === 'voice') {
              setActiveCallChannelId(matchedTarget.id);
              setIsCallPiP(false);
            }
            initialTargetChannelRef.current = null;
          } else {
            setActiveChannelId((curr) => {
              const exists = res.find((c) => c.id === curr);
              if (exists) {
                if (exists.type === 'voice') {
                  setActiveCallChannelId(exists.id);
                  setIsCallPiP(false);
                }
                return curr;
              }
              const defaultText = res.find(
                (c) => (c.type === 'text' || !c.type) && !c.isDirectMessage,
              );
              return defaultText?.id || res[0]?.id || '';
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
