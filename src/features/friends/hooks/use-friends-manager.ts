import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { CommunityMember } from '@/chat/chat-types';
import type { FriendRequest, FriendsTab } from '../types';

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

  const onlineFriends = useMemo(() => {
    return displayMembers.filter(
      (m) => m.id !== currentUser?.id && m.email !== currentUser?.email && m.status !== 'offline',
    );
  }, [displayMembers, currentUser]);

  const allFriends = useMemo(() => {
    return displayMembers.filter(
      (m) => m.id !== currentUser?.id && m.email !== currentUser?.email,
    );
  }, [displayMembers, currentUser]);

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

  const handleAddFriend = async (targetUsername?: string) => {
    const raw = typeof targetUsername === 'string' ? targetUsername : addFriendInput;
    if (!raw.trim()) return;
    setIsAddingFriend(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const cleanInput = raw.trim().replace(/^@/, '').toLowerCase();
      const found = members.find(
        (m) =>
          (m.username && m.username.toLowerCase() === cleanInput) ||
          m.name.toLowerCase() === cleanInput,
      );
      if (found) {
        if (found.id === currentUser?.id || found.email === currentUser?.email) {
          toast.error(t('Kamu tidak bisa menambahkan diri sendiri sebagai teman.'));
          return;
        }
        setFriendRequests((prev) => [
          ...prev.filter((r) => r.id !== found.id),
          {
            id: found.id,
            name: found.name,
            username: found.username || null,
            avatar: found.avatar || null,
            direction: 'outgoing' as const,
            status: 'pending' as const,
          },
        ]);
        toast.success(t('Permintaan pertemanan terkirim ke') + ` ${found.name}!`);
        setAddFriendInput('');
      } else {
        toast.error(t('Pengguna tidak ditemukan. Periksa username dan coba lagi.'));
      }
    } catch {
      toast.error(t('Gagal mengirim permintaan pertemanan.'));
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.success(t('Permintaan pertemanan dari') + ` ${req.name} ` + t('diterima!'));
  };

  const handleRejectRequest = (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast(t('Permintaan pertemanan ditolak.'));
  };

  const handleCancelRequest = (req: FriendRequest) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast(t('Permintaan pertemanan dibatalkan.'));
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
    onAddFriend: handleAddFriend,
    onAcceptRequest: handleAcceptRequest,
    onRejectRequest: handleRejectRequest,
    onCancelRequest: handleCancelRequest,
  };
}
