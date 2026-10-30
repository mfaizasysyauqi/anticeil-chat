import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CommunityMember } from '@/chat/chat-types';
import type { FriendRequest, FriendsTab } from '../types';
import { friendsApi } from '../api/friends-api';

export interface UseFriendsManagerOptions {
  displayMembers: CommunityMember[];
  currentUser: any;
  members: CommunityMember[];
  t: (key: string) => string;
}

export function useFriendsManager({
  displayMembers,
  currentUser,
  members,
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

  const effectiveMembers = useMemo(() => {
    if (persistedFriends.length === 0) return displayMembers;
    const map = new Map<string, any>();
    displayMembers.forEach((m) => map.set(m.id, m));
    persistedFriends.forEach((f) => {
      if (!map.has(f.id)) {
        map.set(f.id, {
          id: f.id,
          name: f.name,
          username: f.username || f.name.toLowerCase().replace(/\s+/g, ''),
          avatar: f.avatar || null,
          status: 'online',
          role: 'member',
        });
      }
    });
    return Array.from(map.values());
  }, [displayMembers, persistedFriends]);

  const onlineFriends = useMemo(() => {
    return effectiveMembers.filter(
      (m) => m.id !== currentUser?.id && m.email !== currentUser?.email && m.status !== 'offline',
    );
  }, [effectiveMembers, currentUser]);

  const allFriends = useMemo(() => {
    return effectiveMembers.filter(
      (m) => m.id !== currentUser?.id && m.email !== currentUser?.email,
    );
  }, [effectiveMembers, currentUser]);

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
