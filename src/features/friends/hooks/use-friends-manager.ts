import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { ColonyMember, ColonyChannel } from '@/chat/chat-types';
import type { FriendMember, FriendRequest, FriendsTab } from '../types';
import { friendsApi } from '../api/friends-api';

export interface UseFriendsManagerOptions {
  displayMembers: ColonyMember[];
  currentUser: any;
  members: ColonyMember[];
  dmChannels?: ColonyChannel[];
  t: (key: string) => string;
}

export function useFriendsManager({
  displayMembers,
  currentUser,
  members,
  dmChannels,
  t,
}: UseFriendsManagerOptions) {
  const [friendsTab, setFriendsTab] = useState<FriendsTab>('online');
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [persistedFriends, setPersistedFriends] = useState<any[]>([]);

  const fetchFriendRequests = useCallback(async () => {
    if (!currentUser?.id) {
      setFriendRequests([]);
      setPersistedFriends([]);
      return;
    }
    try {
      const uid = currentUser.id;
      const [reqs, friends] = await Promise.all([
        friendsApi.getFriendRequests(uid),
        friendsApi.getFriends(uid),
      ]);
      setFriendRequests(reqs);
      setPersistedFriends(friends);
      if (typeof window !== 'undefined' && Array.isArray(friends)) {
        window.dispatchEvent(new CustomEvent('anticeil_friends_updated', { detail: friends }));
      }
    } catch {
      // Keep optimistic state
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handleLogout = () => {
      setFriendRequests([]);
      setPersistedFriends([]);
    };
    window.addEventListener('anticeil_logout', handleLogout);
    return () => window.removeEventListener('anticeil_logout', handleLogout);
  }, []);

  useEffect(() => {
    fetchFriendRequests();
  }, [fetchFriendRequests]);

  const allFriends = useMemo(() => {
    if (!currentUser?.id) return [];
    const friendMap = new Map<string, FriendMember>();

    // 1. Persisted friends from database (accepted friend relationships)
    persistedFriends
      .filter((f) => {
        const name = (f?.name || '').toLowerCase().trim();
        const username = (f?.username || '').toLowerCase().trim();
        const id = String(f?.id || '');

        // Exclude test mock seed
        if (id === 'u1') return false;

        // Exclude generic placeholder labels & internal check probe accounts
        const isGeneric =
          !name ||
          name === 'pengguna' ||
          name === 'pengguna anticeil' ||
          name === 'user' ||
          name === 'direct message' ||
          name === 'teman' ||
          name.includes('probe x') ||
          username.includes('apcheck');
        if (isGeneric) return false;

        const isSelf =
          (currentUser?.id && f.id === currentUser.id) ||
          (currentUser?.email && f.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser?.username && f.username?.toLowerCase() === currentUser.username.toLowerCase()) ||
          (currentUser?.name && f.name?.toLowerCase() === currentUser.name.toLowerCase());
        return !isSelf;
      })
      .forEach((f) => {
        const match = members
          .concat(displayMembers)
          .find(
            (m) =>
              (f.id && m.id === f.id) ||
              (f.email && m.email && m.email.toLowerCase() === f.email.toLowerCase()) ||
              (f.username && m.username && m.username.toLowerCase() === f.username.toLowerCase()) ||
              (f.name && m.name && m.name.toLowerCase() === f.name.toLowerCase()),
          );

        const name = f.name || match?.name || '';
        if (!name) return;

        const friendItem: FriendMember = {
          id: match?.id || f.id,
          name,
          username: match?.username || f.username || match?.email?.split('@')[0] || null,
          avatar: match?.avatar || f.avatar || null,
          email: match?.email || f.email || '',
          status: (f.status || match?.status || 'online') as any,
        };

        const key = friendItem.id || friendItem.email || friendItem.name;
        friendMap.set(key, friendItem);
      });

    // 2. Also populate friends from active direct message channels (DMs)
    if (Array.isArray(dmChannels)) {
      dmChannels.forEach((dm) => {
        if (dm.isGroupDm || dm.id?.startsWith('gdm-')) return;
        const name = (dm.name || '').trim();
        if (!name) return;
        const lowerName = name.toLowerCase();
        if (
          lowerName === 'pengguna' ||
          lowerName === 'pengguna anticeil' ||
          lowerName === 'user' ||
          lowerName === 'direct message' ||
          lowerName === 'general voice' ||
          lowerName.includes('probe x') ||
          (dm as any)?.username?.toLowerCase()?.includes('apcheck')
        ) {
          return;
        }

        const match = members.concat(displayMembers).find((m) => {
          if (currentUser?.id && m.id === currentUser.id) return false;
          return (
            (dm.dmUserId && m.id === dm.dmUserId) ||
            (dm.id && m.id && dm.id.includes(m.id)) ||
            (m.name && m.name.toLowerCase() === lowerName) ||
            (m.username && m.username.toLowerCase() === lowerName)
          );
        });

        const friendId = dm.dmUserId || match?.id || dm.id.replace(/^dm-/, '');
        if (currentUser?.id && friendId === currentUser.id) return;
        if (friendId === 'u1') return;

        const friendItem: FriendMember = {
          id: friendId,
          name: match?.name || name,
          username: match?.username || name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          avatar: match?.avatar || (dm as any).avatar || (dm as any).imageUrl || null,
          email: match?.email || '',
          status: (match?.status || 'online') as any,
        };

        const key = friendItem.id || friendItem.name;
        if (!friendMap.has(key)) {
          friendMap.set(key, friendItem);
        }
      });
    }

    return Array.from(friendMap.values());
  }, [persistedFriends, dmChannels, currentUser, members, displayMembers]);

  const onlineFriends = useMemo(() => {
    return allFriends.filter((f) => f.status !== 'offline');
  }, [allFriends]);

  const effectiveMembers = useMemo(() => {
    return allFriends;
  }, [allFriends]);

  const filteredFriends = useMemo(() => {
    const list = friendsTab === 'online' ? onlineFriends : allFriends;
    if (!friendsSearchQuery.trim()) return list;
    const q = friendsSearchQuery.toLowerCase();
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.username && f.username.toLowerCase().includes(q)),
    );
  }, [friendsTab, onlineFriends, allFriends, friendsSearchQuery]);

  const handleAddFriend = async (targetUsername?: string, targetUserId?: string) => {
    const raw = typeof targetUsername === 'string' ? targetUsername : addFriendInput;
    if (!raw.trim()) return;
    setIsAddingFriend(true);
    try {
      const cleanInput = raw.trim().replace(/^@/, '');
      const found = members.find(
        (m) =>
          (targetUserId && m.id === targetUserId) ||
          (m.username && m.username.toLowerCase() === cleanInput.toLowerCase()) ||
          m.name.toLowerCase() === cleanInput.toLowerCase(),
      );

      const resolvedUserId = targetUserId || found?.id;

      if ((found && (found.id === currentUser?.id || found.email === currentUser?.email)) || (resolvedUserId && resolvedUserId === currentUser?.id)) {
        toast.error(t('Kamu tidak bisa menambahkan diri sendiri sebagai teman.'));
        return;
      }

      await friendsApi.sendFriendRequest(cleanInput, resolvedUserId, {
        senderName: currentUser?.name,
        senderUsername: currentUser?.username || currentUser?.email?.split('@')[0],
        senderAvatar: currentUser?.imageUrl || currentUser?.avatar || null,
      });

      // Optimistic update
      setFriendRequests((prev) => [
        ...prev.filter((r) => r.name.toLowerCase() !== cleanInput.toLowerCase()),
        {
          id: `freq_${Date.now()}`,
          name: found ? found.name : cleanInput,
          username: found?.username || cleanInput.toLowerCase(),
          avatar: found?.avatar || null,
          direction: 'outgoing' as const,
          status: 'pending' as const,
        },
      ]);
      toast.success(t('Permintaan pertemanan terkirim ke') + ` ${found ? found.name : cleanInput}!`);
      setAddFriendInput('');
      fetchFriendRequests();
    } catch {
      toast.error(t('Gagal mengirim permintaan pertemanan.'));
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleAcceptRequest = async (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    try {
      await friendsApi.acceptFriendRequest(req.id);
      toast.success(t('Permintaan pertemanan dari') + ` ${req.name} ` + t('diterima!'));
      fetchFriendRequests();
    } catch {
      toast.error(t('Gagal menerima permintaan.'));
    }
  };

  const handleRejectRequest = async (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    try {
      await friendsApi.ignoreFriendRequest(req.id);
      toast(t('Permintaan pertemanan ditolak.'));
    } catch {
      // Ignored
    }
  };

  const handleCancelRequest = async (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    try {
      await friendsApi.ignoreFriendRequest(req.id);
      toast(t('Permintaan pertemanan dibatalkan.'));
    } catch {
      // Ignored
    }
  };

  const handleDeleteFriend = async (friendId: string) => {
    setPersistedFriends((prev) => prev.filter((f) => f.id !== friendId));
    try {
      await friendsApi.deleteFriend(friendId);
      toast.success(t('Teman dihapus.'));
    } catch {
      // Ignored
    }
  };

  return {
    friendsTab,
    setFriendsTab,
    onTabChange: setFriendsTab,
    friendsSearchQuery,
    setFriendsSearchQuery,
    onSearchChange: setFriendsSearchQuery,
    addFriendInput,
    setAddFriendInput,
    isAddingFriend,
    friendRequests,
    setFriendRequests,
    onlineFriends,
    allFriends,
    filteredFriends,
    effectiveMembers,
    onAddFriend: handleAddFriend,
    onAcceptRequest: handleAcceptRequest,
    onRejectRequest: handleRejectRequest,
    onCancelRequest: handleCancelRequest,
    onDeleteFriend: handleDeleteFriend,
    refetch: fetchFriendRequests,
  };
}
