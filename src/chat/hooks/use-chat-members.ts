import { useMemo, useEffect } from 'react';
import type { ColonyChannel, ColonyMember, ColonyRole, Colony } from '../chat-types';
import { getDmChannelId, saveStoredDmChannels } from '../chat-defaults';

export interface UseChatMembersProps {
  members: ColonyMember[];
  currentUser: any;
  activeColony: Colony | null;
  activeChannel: ColonyChannel | null;
  isHome: boolean;
  friendsList: any[];
  setChannels: React.Dispatch<React.SetStateAction<ColonyChannel[]>>;
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  setHomeView: (view: any) => void;
  setIsMobileChannelsOpen: (open: boolean) => void;
  setIsMobileMembersOpen: (open: boolean) => void;
}

export function useChatMembers({
  members,
  currentUser,
  activeColony,
  activeChannel,
  isHome,
  friendsList,
  setChannels,
  setActiveColonyId,
  setActiveChannelId,
  setHomeView,
  setIsMobileChannelsOpen,
  setIsMobileMembersOpen,
}: UseChatMembersProps) {
  const currentUserName =
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    currentUser?.email?.split('@')[0] ||
    'Pengguna Anticeil';

  const displayMembers: ColonyMember[] = useMemo(() => {
    const isOwner = activeColony?.role === 'owner';
    const isAdmin = activeColony?.role === 'admin';
    const list = members.map((m) => {
      if (m.id === currentUser?.id || m.email === currentUser?.email) {
        return {
          ...m,
          username: m.username || currentUser?.username || null,
          role: isOwner
            ? ('owner' as ColonyRole)
            : isAdmin
              ? ('admin' as ColonyRole)
              : (m.role || 'member'),
          roleLabel: isOwner ? 'Pemilik' : isAdmin ? 'Admin' : undefined,
        };
      }
      return m;
    });

    if (
      currentUser &&
      !list.some(
        (m) => m.id === currentUser.id || m.email === currentUser.email,
      )
    ) {
      const currentRole: ColonyRole = isOwner
        ? 'owner'
        : isAdmin
          ? 'admin'
          : 'member';
      const currentLabel = isOwner ? 'Pemilik' : isAdmin ? 'Admin' : undefined;
      list.unshift({
        id: currentUser.id,
        name:
          `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
          currentUser.email,
        email: currentUser.email,
        username: currentUser.username || null,
        avatar: currentUser.imageUrl ?? null,
        role: currentRole,
        roleLabel: currentLabel,
        platformRole: currentUser.platformRole,
        status: 'online',
        customStatus: undefined,
      });
    }
    return list;
  }, [members, currentUser, activeColony]);

  // Start DM handler
  const handleStartDM = (member: any) => {
    if (!member) return;
    const dmId = currentUser?.id
      ? getDmChannelId(currentUser.id, member.id)
      : `dm-${member.id}`;
    const dmName =
      member.name || member.username || member.firstName || 'Direct Message';
    setChannels((prev) => {
      const existing = prev.find((c) => c.id === dmId);
      const updated = existing
        ? prev.map((c) =>
            c.id === dmId ? { ...c, dmUserId: member.id, name: dmName } : c,
          )
        : [
            {
              id: dmId,
              name: dmName,
              description: `Percakapan langsung dengan ${dmName} (${member.customStatus || member.role || 'Member'})`,
              category: 'DIRECT MESSAGES' as const,
              colonyId: 'anticeil',
              isDirectMessage: true,
              dmUserId: member.id,
              type: 'text' as const,
            },
            ...prev,
          ];
      saveStoredDmChannels(
        updated.filter((c) => c.category === 'DIRECT MESSAGES'),
      );
      return updated;
    });
    // DMs live in Home hub, auto-switch
    setActiveColonyId('anticeil');
    setActiveChannelId(dmId);
    setHomeView('friends');
    setIsMobileChannelsOpen(false);
    setIsMobileMembersOpen(false);
  };

  // Auto-sync DM channels for friends so they appear in Direct Messages sidebar by default
  useEffect(() => {
    if (!currentUser?.id) return;
    if (friendsList.length === 0) return;

    setChannels((prev) => {
      let changed = false;
      const currentList = prev.filter((c) => {
        if (c.category !== 'DIRECT MESSAGES') return true;
        const name = (c.name || '').toLowerCase().trim();
        return (
          name !== 'pengguna' &&
          name !== 'pengguna anticeil' &&
          name !== 'general voice'
        );
      });
      if (currentList.length !== prev.length) {
        changed = true;
      }
      friendsList.forEach((friend) => {
        if (!friend.id || friend.id === currentUser.id) return;
        const dmName = friend.name || friend.username || 'Direct Message';
        if (
          dmName.toLowerCase() === 'pengguna' ||
          dmName.toLowerCase() === 'pengguna anticeil'
        )
          return;
        const dmId = getDmChannelId(currentUser.id, friend.id);
        const exists = currentList.some((c) => c.id === dmId);
        if (!exists) {
          const newDm: ColonyChannel = {
            id: dmId,
            name: dmName,
            description: `Percakapan langsung dengan ${dmName}`,
            category: 'DIRECT MESSAGES',
            colonyId: 'anticeil',
            isDirectMessage: true,
            dmUserId: friend.id,
            type: 'text',
          };
          currentList.unshift(newDm);
          changed = true;
        }
      });
      if (changed) {
        saveStoredDmChannels(
          currentList.filter((c) => c.category === 'DIRECT MESSAGES'),
        );
        return currentList;
      }
      return prev;
    });
  }, [currentUser?.id, friendsList, setChannels]);

  // Comprehensive directory of all known members (friends + server members + current user)
  const allKnownMembers = useMemo(() => {
    const map = new Map<string, ColonyMember>();
    members.forEach((m) => map.set(m.id, m));
    displayMembers.forEach((m) => map.set(m.id, m));
    friendsList.forEach((f) => {
      const existing = map.get(f.id);
      map.set(f.id, {
        id: f.id,
        name: f.name || existing?.name || 'Member',
        email: f.email || existing?.email || '',
        avatar: f.avatar || existing?.avatar || null,
        username: f.username || existing?.username || null,
        role: existing?.role || 'member',
        status: (f.status as any) || existing?.status || 'online',
      });
    });
    return Array.from(map.values());
  }, [members, displayMembers, friendsList]);

  // Active DM partner resolution for user profile sidebar
  const isDmMode = Boolean(
    isHome ||
      activeChannel?.category === 'DIRECT MESSAGES' ||
      activeChannel?.isDirectMessage ||
      activeChannel?.id?.startsWith('dm-'),
  );

  const activeDmUserId = useMemo(() => {
    if (!activeChannel) return undefined;
    if (activeChannel.dmUserId) return activeChannel.dmUserId;
    if (activeChannel.id?.startsWith('dm-')) {
      const parts = activeChannel.id.slice(3).split('-').filter(Boolean);
      return parts.find((p) => p !== currentUser?.id) || parts[0];
    }
    return undefined;
  }, [activeChannel, currentUser?.id]);

  const activeDmMember = useMemo(() => {
    if (!activeDmUserId) return undefined;
    return allKnownMembers.find((m) => m.id === activeDmUserId);
  }, [activeDmUserId, allKnownMembers]);

  return {
    currentUserName,
    displayMembers,
    handleStartDM,
    allKnownMembers,
    isDmMode,
    activeDmUserId,
    activeDmMember,
  };
}
