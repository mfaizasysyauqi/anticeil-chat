import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CommunityMember, CommunityChannel } from '@/chat/chat-types';
import type { FriendMember, FriendRequest, FriendsTab } from '../types';
import { friendsApi } from '../api/friends-api';

export interface UseFriendsManagerOptions {
  displayMembers: CommunityMember[];
  currentUser: any;
  members: CommunityMember[];
  dmChannels?: CommunityChannel[];
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
    try {
      const [reqs, friends] = await Promise.all([
        friendsApi.getFriendRequests(),
        friendsApi.getFriends(),
      ]);
      setFriendRequests(reqs);
      setPersistedFriends(friends);
    } catch {
      // Keep optimistic state
    }
  }, []);

  useEffect(() => {
    fetchFriendRequests();
  }, [fetchFriendRequests]);

  const allFriends = useMemo(() => {
    const friendMap = new Map<string, FriendMember>();

    // 1. Other real workspace members (not current user)
    displayMembers
      .concat(members)
      .filter(
        (m) =>
          m.id !== currentUser?.id &&
          (!currentUser?.email || m.email?.toLowerCase() !== currentUser?.email?.toLowerCase()) &&
          (!currentUser?.name || m.name?.toLowerCase() !== currentUser?.name?.toLowerCase()),
      )
      .forEach((m) => {
        const isGeneric = !m.name || m.name.toLowerCase() === 'pengguna' || m.name.toLowerCase() === 'pengguna anticeil';
        if (isGeneric) return;
        const key = m.id || m.email || m.name;
        if (!friendMap.has(key)) {
          friendMap.set(key, {
            id: m.id,
            name: m.name,
            username: m.username || m.email?.split('@')[0] || null,
            avatar: m.avatar || null,
            email: m.email || '',
            status: (m.status || 'online') as any,
          });
        }
      });

    // 2. Friends from active DM channels in sidebar
    (dmChannels || [])
      .filter((dm) => {
        const name = (dm.name || '').toLowerCase().trim();
        return (
          typeof dm.id === 'string' &&
          dm.id.startsWith('dm-') &&
          dm.type !== 'voice' &&
          name &&
          name !== 'pengguna' &&
          name !== 'pengguna anticeil' &&
          name !== 'general voice' &&
          name !== 'general' &&
          name !== 'forum-diskusi'
        );
      })
      .forEach((dm) => {
        const member = members
          .concat(displayMembers)
          .find(
            (m) =>
              m.id === dm.dmUserId ||
              (m.id && dm.id.includes(m.id)) ||
              (m.name && m.name.toLowerCase() === dm.name.toLowerCase()),
          );
        const name = member?.name || dm.name;
        const isSelf =
          (currentUser?.id && (dm.dmUserId === currentUser.id || member?.id === currentUser.id)) ||
          (currentUser?.name && name.toLowerCase() === currentUser.name.toLowerCase()) ||
          (currentUser?.email && member?.email?.toLowerCase() === currentUser.email.toLowerCase());
        const isGeneric = name.toLowerCase() === 'pengguna' || name.toLowerCase() === 'pengguna anticeil';
        if (isSelf || isGeneric) return;

        const key = member?.id || dm.dmUserId || dm.name;
        if (friendMap.has(key)) {
          const existing = friendMap.get(key)!;
          friendMap.set(key, {
            ...existing,
            avatar: member?.avatar || existing.avatar,
            username: member?.username || existing.username,
          });
        } else {
          friendMap.set(key, {
            id: member?.id || dm.dmUserId || dm.id,
            name,
            username: member?.username || null,
            avatar: member?.avatar || null,
            email: member?.email || '',
            status: (member?.status || 'online') as any,
          });
        }
      });

    // 3. Persisted friends from database
    persistedFriends
      .filter((f) => {
        const isSelf =
          (currentUser?.id && f.id === currentUser.id) ||
          (currentUser?.email && f.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser?.username && f.username?.toLowerCase() === currentUser.username.toLowerCase()) ||
          (currentUser?.name && f.name?.toLowerCase() === currentUser.name.toLowerCase());
        return !isSelf;
      })
      .forEach((f) => {
        let match = members
          .concat(displayMembers)
          .find(
            (m) =>
              (f.id && m.id === f.id) ||
              (f.email && m.email && m.email.toLowerCase() === f.email.toLowerCase()) ||
              (f.username && m.username && m.username.toLowerCase() === f.username.toLowerCase()) ||
              (f.name && m.name && m.name.toLowerCase() === f.name.toLowerCase()),
          );
        const isGeneric =
          !f.name ||
          f.name.toLowerCase() === 'pengguna' ||
          f.name.toLowerCase() === 'pengguna anticeil' ||
          f.name.toLowerCase() === 'user' ||
          f.name.toLowerCase() === 'teman';
        if (isGeneric && !match) {
          const other = displayMembers.concat(members).find((m) => m.id !== currentUser?.id);
          if (other) match = other;
        }

        const name = isGeneric && match?.name ? match.name : f.name || match?.name || '';
        const finalGeneric = !name || name.toLowerCase() === 'pengguna' || name.toLowerCase() === 'pengguna anticeil';
        if (finalGeneric) return;

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

    return Array.from(friendMap.values());
  }, [persistedFriends, currentUser, members, displayMembers, dmChannels]);

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
