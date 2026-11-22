import { useMemo, useEffect } from 'react';
import type { ColonyChannel, ColonyMember, ColonyRole, Colony } from '../chat-types';
import { getDmChannelId, saveStoredDmChannels, setClosedDmId } from '../chat-defaults';

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
    setClosedDmId(dmId, false);
    const dmAvatar = member.avatar || (member as any)?.imageUrl || null;
    setChannels((prev) => {
      const existing = prev.find((c) => c.id === dmId);
      const updated = existing
        ? prev.map((c) =>
            c.id === dmId
              ? {
                  ...c,
                  dmUserId: member.id,
                  name: dmName,
                  description: `Percakapan langsung dengan ${dmName}`,
                  avatar: dmAvatar || c.avatar,
                  recipientAvatar: dmAvatar || c.recipientAvatar,
                }
              : c,
          )
        : [
            {
              id: dmId,
              name: dmName,
              description: `Percakapan langsung dengan ${dmName}`,
              category: 'DIRECT MESSAGES' as const,
              colonyId: 'anticeil',
              isDirectMessage: true,
              dmUserId: member.id,
              avatar: dmAvatar,
              recipientAvatar: dmAvatar,
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

  // Create Group DM handler
  const handleCreateGroupDM = (name: string, memberIds: string[]) => {
    if (!memberIds || memberIds.length === 0) return;
    const gdmId = `gdm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const allMemberIds = Array.from(
      new Set([...(currentUser?.id ? [currentUser.id] : []), ...memberIds]),
    );

    let gdmName = name?.trim();
    if (!gdmName) {
      const memberNames = allMemberIds
        .map((id) => {
          if (currentUser?.id && id === currentUser.id) return currentUser.name || 'Anda';
          const found = members.find((m) => m.id === id);
          return found?.name || found?.username || id;
        })
        .slice(0, 3)
        .join(', ');
      gdmName = memberNames || 'Grup DM';
    }

    const newGroupChannel: ColonyChannel = {
      id: gdmId,
      name: gdmName,
      description: `Grup DM dengan ${allMemberIds.length} anggota`,
      category: 'DIRECT MESSAGES',
      colonyId: 'anticeil',
      isDirectMessage: true,
      isGroupDm: true,
      dmUserIds: allMemberIds,
      ownerId: currentUser?.id || 'u1',
      type: 'text',
    };

    setChannels((prev) => {
      const updated = [newGroupChannel, ...prev];
      saveStoredDmChannels(
        updated.filter((c) => c.category === 'DIRECT MESSAGES'),
      );
      return updated;
    });

    setActiveColonyId('anticeil');
    setActiveChannelId(gdmId);
    setHomeView('friends');
    setIsMobileChannelsOpen(false);
    setIsMobileMembersOpen(false);
  };

  // Add friend to existing Group DM
  const handleAddMemberToGroupDM = (memberId: string) => {
    if (!activeChannel || !activeChannel.isGroupDm || !memberId) return;
    const currentMembers = activeChannel.dmUserIds || [];
    if (currentMembers.includes(memberId)) return;
    const nextMembers = [...currentMembers, memberId];

    setChannels((prev) => {
      const updated = prev.map((c) => {
        if (c.id === activeChannel.id) {
          return {
            ...c,
            dmUserIds: nextMembers,
            description: `Grup DM dengan ${nextMembers.length} anggota`,
          };
        }
        return c;
      });
      saveStoredDmChannels(
        updated.filter((c) => c.category === 'DIRECT MESSAGES'),
      );
      return updated;
    });
  };

  // Close / remove DM channel from sidebar
  const handleCloseDM = (dmId: string) => {
    setClosedDmId(dmId, true);
    setChannels((prev) => {
      const updated = prev.filter((c) => c.id !== dmId);
      saveStoredDmChannels(
        updated.filter((c) => c.category === 'DIRECT MESSAGES'),
      );
      return updated;
    });
    if (activeChannel?.id === dmId) {
      setActiveChannelId('');
      setHomeView('friends');
    }
  };

  // Comprehensive directory of all known members (friends + server members + current user + message authors)
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

    // Also populate with authors from locally stored messages so DM partners always have their avatars
    try {
      if (typeof window !== 'undefined') {
        const rawMsgs = localStorage.getItem('anticeil_colony_messages_v3');
        if (rawMsgs) {
          const msgsMap = JSON.parse(rawMsgs);
          if (msgsMap && typeof msgsMap === 'object') {
            for (const list of Object.values(msgsMap) as any[]) {
              if (!Array.isArray(list)) continue;
              for (const msg of list) {
                if (msg && msg.senderId) {
                  const existing = map.get(msg.senderId);
                  if (!existing) {
                    map.set(msg.senderId, {
                      id: msg.senderId,
                      name: msg.senderName || 'Member',
                      email: '',
                      avatar: msg.senderAvatar || null,
                      username: msg.senderUsername || null,
                      role: 'member',
                      status: 'online',
                    });
                  } else if (!existing.avatar && msg.senderAvatar) {
                    existing.avatar = msg.senderAvatar;
                  }
                }
              }
            }
          }
        }
      }
    } catch {}

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
    handleCloseDM,
    handleCreateGroupDM,
    handleAddMemberToGroupDM,
    allKnownMembers,
    isDmMode,
    activeDmUserId,
    activeDmMember,
  };
}
