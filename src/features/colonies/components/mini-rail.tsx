import React, { useState, useMemo } from 'react';
import { Plus, Users, Globe, UserPlus, Compass, LayoutGrid, Sparkles, PanelLeftOpen, Folder, FolderOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { Colony } from '@/lib/colony';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ServerIcon } from './colony-icon';
import { toast } from 'sonner';
import { loadStoredDmChannels } from '@/chat/chat-defaults';

export interface RailFolder {
  id: string;
  name?: string;
  color?: string;
  itemIds: string[];
  expanded?: boolean;
}

export interface MiniRailProps {
  currentUser?: any;
  servers?: Colony[];
  colonies?: Colony[];
  activeServerId?: string;
  activeColonyId?: string;
  unreadCounts?: Record<string, number | string>;
  onSelectServer?: (serverId: string) => void;
  onSelectHub?: (colonyId: string) => void;
  onOpenCreateServer?: () => void;
  onOpenCreateHub?: () => void;
  platformName?: string;
  renderServerIcon?: (server: Colony) => React.ReactNode;
  renderHubIcon?: (hub: Colony) => React.ReactNode;
  railMode?: 'colonies' | 'servers' | 'friends';
  onToggleRailMode?: () => void;
  friends?: any[];
  dmChannels?: any[];
  members?: any[];
  activeChannelId?: string;
  onSelectFriend?: (friend: any) => void;
  onOpenAddFriend?: () => void;
  isAiActive?: boolean;
  onSelectAiCenter?: () => void;
  homeView?: string;
  isSidebarCollapsed?: boolean;
  onToggleCollapseSidebar?: () => void;
}

export type ColonyRailProps = MiniRailProps;
export type ServerRailProps = MiniRailProps;

function formatUnreadBadge(count: number | string | undefined): string | null {
  if (count === undefined || count === null || count === 0 || count === '0' || count === '') return null;
  const num = typeof count === 'string' ? Number(count) : count;
  if (!isNaN(num)) {
    if (num >= 9000) return '9K+';
    if (num >= 1000) return `${Math.floor(num / 1000)}K+`;
    return String(num);
  }
  return String(count);
}

/** Sum all server (non-DM, non-anticeil) unread counts */
function sumServerUnread(counts: Record<string, number | string> | undefined, servers: Colony[]): string | null {
  if (!counts) return null;
  let total = 0;
  for (const srv of servers) {
    const v = counts[srv.id];
    if (!v) continue;
    const n = typeof v === 'string' ? parseInt(v, 10) || 0 : v;
    total += n;
  }
  return formatUnreadBadge(total);
}

/** Sum all DM/friend unread counts */
function sumFriendUnread(counts: Record<string, number | string> | undefined, friends: any[]): string | null {
  if (!counts) return null;
  let total = 0;
  const countedKeys = new Set<string>();

  for (const f of friends) {
    const directKey = f.id;
    const dmKey = `dm-${f.id}`;
    const v = counts[directKey] ?? counts[dmKey];
    if (counts[directKey] !== undefined) countedKeys.add(directKey);
    if (counts[dmKey] !== undefined) countedKeys.add(dmKey);
    if (v) {
      const n = typeof v === 'string' ? parseInt(v, 10) || 0 : v;
      total += n;
    }
  }

  // Also catch any other 'dm-*' unread keys
  for (const [k, v] of Object.entries(counts)) {
    if (k.startsWith('dm-') && !countedKeys.has(k)) {
      const n = typeof v === 'string' ? parseInt(v, 10) || 0 : v;
      total += n;
    }
  }

  return formatUnreadBadge(total);
}

export function MiniRail({
  currentUser,
  servers,
  colonies,
  activeServerId,
  activeColonyId,
  unreadCounts,
  onSelectServer,
  onSelectHub,
  onOpenCreateServer,
  onOpenCreateHub,
  platformName,
  renderServerIcon,
  renderHubIcon,
  railMode,
  onToggleRailMode,
  friends = [],
  dmChannels = [],
  members = [],
  activeChannelId,
  onSelectFriend,
  onOpenAddFriend,
  isAiActive,
  onSelectAiCenter,
  homeView,
  isSidebarCollapsed,
  onToggleCollapseSidebar,
}: ColonyRailProps) {
  const { t } = useTranslation();

  const [internalMode, setInternalMode] = useState<'colonies' | 'servers' | 'friends'>(() => {
    try {
      return (localStorage.getItem('anticeil_rail_mode') as any) || 'colonies';
    } catch {
      return 'servers';
    }
  });

  const mode = railMode || internalMode;
  const isFriendsMode = mode === 'friends';

  const handleToggleMode = () => {
    if (onToggleRailMode) {
      onToggleRailMode();
    } else {
      const next = isFriendsMode ? 'servers' : 'friends';
      setInternalMode(next);
      try {
        localStorage.setItem('anticeil_rail_mode', next);
      } catch {}
      toast.info(next === 'friends' ? t('Beralih ke Mode Teman') : t('Beralih ke Mode Colony'));
    }
  };

  const serverList = servers || colonies || [];
  const currentActiveId = activeServerId || activeColonyId || '';
  const handleSelect = onSelectServer || onSelectHub || (() => {});
  const handleCreate = onOpenCreateServer || onOpenCreateHub || (() => {});
  const renderIcon = (srv: Colony, active?: boolean) => {
    if (renderServerIcon) return renderServerIcon(srv);
    if (renderHubIcon) return renderHubIcon(srv);
    return <ServerIcon hub={srv} isActive={active} />;
  };

  const mainServer = serverList.find((s) => s.id === 'anticeil') || serverList[0];
  const otherServers = serverList.filter((s) => s.id !== 'anticeil');

  // Derive friends: use friends prop, or if empty, extract active DM contacts from dmChannels / stored DMs / members
  const friendList = useMemo(() => {
    if (!currentUser?.id) return [];
    const list: any[] = [];
    const seen = new Set<string>();

    const currentUserId = currentUser?.id;
    const currentUserName = currentUser?.name?.toLowerCase().trim();

    const isSelfUser = (id?: string | null, name?: string | null) => {
      if (!id && !name) return false;
      if (currentUserId && id === currentUserId) return true;
      if (currentUserName && name && name.toLowerCase().trim() === currentUserName) return true;
      return false;
    };

    // 1. Explicit friends list (from database or props)
    if (Array.isArray(friends) && friends.length > 0) {
      for (const f of friends) {
        if (!f || !f.id || seen.has(f.id)) continue;
        if (isSelfUser(f.id, f.name || f.username)) continue;
        seen.add(f.id);
        list.push(f);
      }
    }

    // 2. Derive from active / stored DM channels
    const allDms = (Array.isArray(dmChannels) && dmChannels.length > 0)
      ? dmChannels
      : (typeof window !== 'undefined' ? loadStoredDmChannels() : []);

    for (const dm of allDms) {
      if (!dm?.id || dm.isGroupDm || dm.id.startsWith('gdm-') || dm.type === 'voice' || dm.type === 'forum' || dm.type === 'kanban') continue;
      
      let otherId = dm.dmUserId || null;
      if (!otherId && dm.id.startsWith('dm-')) {
        const parts = dm.id.slice(3).split('-').filter(Boolean);
        otherId = parts.find((p: string) => p !== currentUserId) || parts[0] || null;
      }

      if (isSelfUser(otherId, dm.name)) continue;

      const otherMember = members?.find((m: any) => {
        if (isSelfUser(m.id, m.name || m.username)) return false;
        if (otherId && m.id === otherId) return true;
        if (m.name && dm.name && m.name.toLowerCase() === dm.name.toLowerCase()) return true;
        if (m.id && dm.id.includes(m.id)) return true;
        return false;
      });

      const resolvedName = (otherMember?.name || dm.name || '').trim();
      const lowerName = resolvedName.toLowerCase();
      const lowerUsername = (otherMember?.username || (dm as any)?.username || '').toLowerCase();
      if (
        !resolvedName ||
        lowerName === 'pengguna' ||
        lowerName === 'pengguna anticeil' ||
        lowerName === 'user' ||
        lowerName === 'direct message' ||
        lowerName.includes('probe x') ||
        lowerUsername.includes('apcheck')
      ) {
        continue;
      }

      const friendId = otherMember?.id || otherId || dm.id.replace('dm-', '');
      if (isSelfUser(friendId, resolvedName)) continue;
      if (seen.has(friendId)) continue;
      seen.add(friendId);

      list.push({
        id: friendId,
        dmChannelId: dm.id,
        name: resolvedName,
        username: otherMember?.username || null,
        imageUrl: otherMember?.avatar || (otherMember as any)?.imageUrl || (dm as any).avatar || (dm as any).imageUrl || null,
        status: otherMember?.status || (dm as any).status || 'online',
        unreadCount: unreadCounts?.[dm.id] ?? 0,
      });
    }

    // 3. Fallback: If list is still empty, populate from colony members (excluding self & test accounts) so the friends rail is never empty!
    if (list.length === 0 && Array.isArray(members) && members.length > 0) {
      for (const m of members) {
        const name = (m.name || '').trim();
        const lowerName = name.toLowerCase();
        if (
          !m.id ||
          m.id === 'u1' ||
          isSelfUser(m.id, name) ||
          seen.has(m.id) ||
          lowerName === 'pengguna' ||
          lowerName === 'pengguna anticeil' ||
          lowerName === 'user' ||
          lowerName.includes('probe x') ||
          (m.username || '').toLowerCase().includes('apcheck')
        ) {
          continue;
        }
        seen.add(m.id);
        list.push({
          id: m.id,
          dmChannelId: `dm-${m.id}`,
          name: m.name,
          username: m.username || null,
          imageUrl: m.avatar || (m as any).imageUrl || null,
          status: m.status || 'online',
          unreadCount: 0,
        });
      }
    }

    return list;
  }, [friends, dmChannels, members, unreadCounts, currentUser]);

  // Logo Anticeil: ONLY notification count, not chat messages
  const mainUnread = formatUnreadBadge(unreadCounts?.['anticeil'] ?? 0);

  // Switcher badges: total server chats vs total DM chats
  const serverModeBadge = sumServerUnread(unreadCounts, otherServers);
  const friendModeBadge = sumFriendUnread(unreadCounts, friendList);

  const isAiCurrentlyActive =
    Boolean(isAiActive) ||
    (currentActiveId === 'anticeil' && (homeView === 'ai' || !homeView) && !activeChannelId);

  const activeFriendSelected =
    isFriendsMode &&
    friendList.some(
      (f) =>
        activeChannelId === f.dmChannelId ||
        activeChannelId === `dm-${f.id}` ||
        activeChannelId === f.id ||
        (Boolean(activeChannelId?.startsWith('dm-')) && Boolean(activeChannelId?.includes(f.id))),
    );

  const isDirectMessagesActive =
    currentActiveId === 'anticeil' &&
    (homeView !== 'ai' || Boolean(activeChannelId)) &&
    !activeFriendSelected;

  // Folders state (persisted in localStorage)
  const [colonyFolders, setColonyFolders] = useState<RailFolder[]>(() => {
    try {
      const saved = localStorage.getItem('anticeil_colony_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [friendFolders, setFriendFolders] = useState<RailFolder[]>(() => {
    try {
      const saved = localStorage.getItem('anticeil_friend_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const updateColonyFolders = (newFolders: RailFolder[]) => {
    setColonyFolders(newFolders);
    try {
      localStorage.setItem('anticeil_colony_folders', JSON.stringify(newFolders));
    } catch {}
  };

  const updateFriendFolders = (newFolders: RailFolder[]) => {
    setFriendFolders(newFolders);
    try {
      localStorage.setItem('anticeil_friend_folders', JSON.stringify(newFolders));
    } catch {}
  };

  const currentFolders = isFriendsMode ? friendFolders : colonyFolders;
  const updateCurrentFolders = isFriendsMode ? updateFriendFolders : updateColonyFolders;

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedFromFolderId, setDraggedFromFolderId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const allCurrentItems = isFriendsMode ? friendList : otherServers;

  const validFolders = useMemo(() => {
    return currentFolders
      .map((f) => ({
        ...f,
        itemIds: f.itemIds.filter((id) => allCurrentItems.some((it) => it.id === id)),
      }))
      .filter((f) => f.itemIds.length > 0);
  }, [currentFolders, allCurrentItems]);

  const handleDropOnItem = (sourceId: string, targetId: string, sourceFolderId: string | null) => {
    setDragOverTargetId(null);
    setDragOverFolderId(null);
    setDraggedItemId(null);
    setDraggedFromFolderId(null);
    if (!sourceId || !targetId || sourceId === targetId) return;

    // Check if target is inside an existing folder
    const targetFolder = currentFolders.find((f) => f.itemIds.includes(targetId));
    if (targetFolder) {
      handleDropOnFolder(sourceId, targetFolder.id, sourceFolderId);
      return;
    }

    // Both are standalone or source is from folder
    let nextFolders = currentFolders
      .map((f) => {
        if (sourceFolderId && f.id === sourceFolderId) {
          return { ...f, itemIds: f.itemIds.filter((id) => id !== sourceId) };
        }
        return f;
      })
      .filter((f) => f.itemIds.length > 0);

    const sourceItem = allCurrentItems.find((x) => x.id === sourceId);
    const targetItem = allCurrentItems.find((x) => x.id === targetId);
    const folderName = targetItem && sourceItem ? `${targetItem.name}, ${sourceItem.name}` : t('Folder');

    const newFolder: RailFolder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      itemIds: [targetId, sourceId],
      expanded: false,
    };

    nextFolders.push(newFolder);
    updateCurrentFolders(nextFolders);
    toast.success(isFriendsMode ? t('Folder Teman dibuat') : t('Folder Colony dibuat'));
  };

  const handleDropOnFolder = (sourceId: string, folderId: string, sourceFolderId: string | null) => {
    setDragOverTargetId(null);
    setDragOverFolderId(null);
    setDraggedItemId(null);
    setDraggedFromFolderId(null);
    if (!sourceId || !folderId) return;

    let nextFolders = currentFolders
      .map((f) => {
        if (sourceFolderId && f.id === sourceFolderId && f.id !== folderId) {
          return { ...f, itemIds: f.itemIds.filter((id) => id !== sourceId) };
        }
        if (f.id === folderId) {
          const nextIds = f.itemIds.includes(sourceId) ? f.itemIds : [...f.itemIds, sourceId];
          return { ...f, itemIds: nextIds };
        }
        return f;
      })
      .filter((f) => f.itemIds.length > 0);

    updateCurrentFolders(nextFolders);
    toast.success(t('Ditambahkan ke folder'));
  };

  const handleRemoveFromFolder = (sourceId: string, folderId: string) => {
    const nextFolders = currentFolders
      .map((f) => {
        if (f.id === folderId) {
          return { ...f, itemIds: f.itemIds.filter((id) => id !== sourceId) };
        }
        return f;
      })
      .filter((f) => f.itemIds.length > 0);

    updateCurrentFolders(nextFolders);
    toast.info(t('Dikeluarkan dari folder'));
  };

  const toggleFolderExpanded = (folderId: string) => {
    const nextFolders = currentFolders.map((f) =>
      f.id === folderId ? { ...f, expanded: !f.expanded } : f
    );
    updateCurrentFolders(nextFolders);
  };

  const handleDissolveFolder = (folderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextFolders = currentFolders.filter((f) => f.id !== folderId);
    updateCurrentFolders(nextFolders);
    toast.success(t('Folder dibongkar'));
  };

  const getFolderUnreadBadge = (itemIds: string[]) => {
    if (!unreadCounts) return null;
    let total = 0;
    for (const id of itemIds) {
      const v = unreadCounts[id] ?? unreadCounts[`dm-${id}`];
      if (v) {
        const n = typeof v === 'string' ? parseInt(v, 10) || 0 : v;
        total += n;
      }
    }
    return formatUnreadBadge(total);
  };

  const railEntries = useMemo(() => {
    const folderByItemId = new Map<string, RailFolder>();
    validFolders.forEach((f) => {
      f.itemIds.forEach((id) => folderByItemId.set(id, f));
    });

    const emittedFolderIds = new Set<string>();
    const entries: (
      | { type: 'item'; item: any }
      | { type: 'folder'; folder: RailFolder; items: any[] }
    )[] = [];

    for (const it of allCurrentItems) {
      const folder = folderByItemId.get(it.id);
      if (folder) {
        if (!emittedFolderIds.has(folder.id)) {
          emittedFolderIds.add(folder.id);
          const fItems = folder.itemIds
            .map((id) => allCurrentItems.find((x) => x.id === id))
            .filter(Boolean);
          entries.push({ type: 'folder', folder, items: fItems });
        }
      } else {
        entries.push({ type: 'item', item: it });
      }
    }

    for (const f of validFolders) {
      if (!emittedFolderIds.has(f.id)) {
        emittedFolderIds.add(f.id);
        const fItems = f.itemIds
          .map((id) => allCurrentItems.find((x) => x.id === id))
          .filter(Boolean);
        if (fItems.length > 0) {
          entries.push({ type: 'folder', folder: f, items: fItems });
        }
      }
    }

    return entries;
  }, [allCurrentItems, validFolders]);

  const renderRailFriendItem = (f: any, parentFolderId?: string) => {
    const isDmActive =
      activeChannelId === `dm-${f.id}` ||
      activeChannelId === f.id ||
      (Boolean(activeChannelId?.startsWith('dm-')) && Boolean(activeChannelId?.includes(f.id)));
    const friendUnread = formatUnreadBadge(
      unreadCounts?.[f.id] ?? unreadCounts?.[`dm-${f.id}`] ?? f.unreadCount,
    );
    const hasProfileImage = Boolean(f.imageUrl || f.avatar);
    const isBeingDragged = draggedItemId === f.id;
    const isTargetOfDrag = dragOverTargetId === f.id;

    return (
      <div
        key={f.id}
        className={cn(
          'relative group w-full flex items-center justify-center transition-all',
          isBeingDragged && 'opacity-40 scale-95'
        )}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', f.id);
          e.dataTransfer.effectAllowed = 'move';
          setDraggedItemId(f.id);
          setDraggedFromFolderId(parentFolderId || null);
        }}
        onDragEnd={() => {
          setDraggedItemId(null);
          setDraggedFromFolderId(null);
          setDragOverTargetId(null);
          setDragOverFolderId(null);
        }}
        onDragOver={(e) => {
          if (!draggedItemId || draggedItemId === f.id) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (dragOverTargetId !== f.id) setDragOverTargetId(f.id);
        }}
        onDragLeave={() => {
          if (dragOverTargetId === f.id) setDragOverTargetId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!draggedItemId || draggedItemId === f.id) return;
          handleDropOnItem(draggedItemId, f.id, draggedFromFolderId);
        }}
      >
        <span
          className={cn(
            'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
            isDmActive
              ? 'h-10'
              : friendUnread
              ? 'h-2 group-hover:h-5'
              : 'h-0 group-hover:h-3.5 opacity-80',
          )}
        />

        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onSelectFriend?.(f)}
              className={cn(
                'relative size-10 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                isTargetOfDrag
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar scale-105 shadow-md'
                  : isDmActive
                  ? hasProfileImage
                    ? 'ring-1 ring-primary/30 shadow-xs'
                    : 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                  : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
              )}
            >
              <CommunityAvatar
                name={f.name}
                imageUrl={f.imageUrl || f.avatar}
                size={40}
                isActive={isDmActive}
                className="rounded-[14px]"
              />

              {/* Online Status Dot */}
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar',
                  f.status === 'online'
                    ? 'bg-emerald-500'
                    : f.status === 'idle'
                    ? 'bg-amber-500'
                    : f.status === 'dnd'
                    ? 'bg-red-500'
                    : 'bg-muted-foreground/40',
                )}
              />

              {/* Discord-style bottom-right unread badge pill for friend */}
              {friendUnread && (
                <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight animate-in zoom-in-75">
                  {friendUnread}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
            <div>
              <div className="font-bold">{f.name}</div>
              <div className="text-[10px] text-muted-foreground capitalize">
                {f.status || 'Offline'}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  };

  const renderRailServerItem = (srv: Colony, parentFolderId?: string) => {
    const isActive = currentActiveId === srv.id;
    const serverUnread = formatUnreadBadge(unreadCounts?.[srv.id] ?? srv.unreadCount);
    const hasCustomIcon = Boolean(srv.iconUrl);
    const isBeingDragged = draggedItemId === srv.id;
    const isTargetOfDrag = dragOverTargetId === srv.id;

    return (
      <div
        key={srv.id}
        className={cn(
          'relative group w-full flex items-center justify-center transition-all',
          isBeingDragged && 'opacity-40 scale-95'
        )}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', srv.id);
          e.dataTransfer.effectAllowed = 'move';
          setDraggedItemId(srv.id);
          setDraggedFromFolderId(parentFolderId || null);
        }}
        onDragEnd={() => {
          setDraggedItemId(null);
          setDraggedFromFolderId(null);
          setDragOverTargetId(null);
          setDragOverFolderId(null);
        }}
        onDragOver={(e) => {
          if (!draggedItemId || draggedItemId === srv.id) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (dragOverTargetId !== srv.id) setDragOverTargetId(srv.id);
        }}
        onDragLeave={() => {
          if (dragOverTargetId === srv.id) setDragOverTargetId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!draggedItemId || draggedItemId === srv.id) return;
          handleDropOnItem(draggedItemId, srv.id, draggedFromFolderId);
        }}
      >
        <span
          className={cn(
            'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
            isActive
              ? 'h-10'
              : serverUnread
              ? 'h-2 group-hover:h-5'
              : 'h-0 group-hover:h-3.5 opacity-80',
          )}
        />

        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleSelect(srv.id)}
              className={cn(
                'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                isTargetOfDrag
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar scale-105 shadow-md'
                  : isActive
                  ? hasCustomIcon
                    ? 'ring-1 ring-primary/30 shadow-xs'
                    : 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                  : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
              )}
            >
              {renderIcon(srv, isActive)}

              {/* Discord-style bottom-right unread badge pill for server */}
              {serverUnread && (
                <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight animate-in zoom-in-75">
                  {serverUnread}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
            {srv.name}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  };

  return (
    <div id="anticeil-mini-rail" className="w-14 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center select-none z-10 h-full overflow-hidden">
      {/* 1. Fixed top buttons: AI Command Center (Logo), Hub Fitur (LayoutGrid) with symmetrical gap-2 */}
      <div className="w-full flex flex-col items-center gap-2 pt-2 shrink-0">
        {/* 1. Top Button: Logo Anticeil -> AI Command Center (Halaman Utama) */}
        <div className="relative group w-full flex items-center justify-center">
          <span
            className={cn(
              'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
              isAiCurrentlyActive
                ? 'h-10'
                : 'h-0 group-hover:h-3.5 opacity-80',
            )}
          />

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (onSelectAiCenter) {
                    onSelectAiCenter();
                  } else {
                    handleSelect('ai-center');
                  }
                }}
                className={cn(
                  'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                  isAiCurrentlyActive
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                    : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                )}
              >
                <img src="/logo.png" alt="Anticeil" className="size-6 object-contain" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {t('Atlas Agent')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 2. Dedicated Button: Direct Messages & Home Activities (Pesan Langsung & Aktivitas) */}
        <div className="relative group w-full flex items-center justify-center">
          <span
            className={cn(
              'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
              isDirectMessagesActive
                ? 'h-10'
                : mainUnread
                ? 'h-2 group-hover:h-5'
                : 'h-0 group-hover:h-3.5 opacity-80',
            )}
          />

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleSelect('anticeil')}
                className={cn(
                  'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                  isDirectMessagesActive
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                    : 'bg-sidebar-accent text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                )}
              >
                <LayoutGrid className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />

                {/* Discord-style bottom-right unread badge pill */}
                {mainUnread && (
                  <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight animate-in zoom-in-75">
                    {mainUnread}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {t('Hub Fitur & Pesan Langsung')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 3. Button Expand Sidebar (Ditaruh tepat di bawah tombol 4 kotak dan di atas button switch colony/teman) */}
        {isSidebarCollapsed && onToggleCollapseSidebar && (
          <div className="relative group w-full flex items-center justify-center animate-in fade-in zoom-in-75 duration-150">
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapseSidebar}
                  className="group relative size-10 rounded-[14px] bg-sidebar-accent hover:bg-sidebar-accent/80 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold text-muted-foreground hover:text-foreground shadow-xs"
                  aria-label={t('Buka Sidebar (Ctrl+B)')}
                >
                  <PanelLeftOpen className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
                {t('Buka Sidebar')} <kbd className="ml-1 text-[10px] text-muted-foreground font-mono">Ctrl+B</kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Scrollable lower rail: Switcher, Add (+), then list */}
      <div
        className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden flex flex-col items-center gap-2 pt-2 pb-16"
        onDragOver={(e) => {
          if (draggedItemId && draggedFromFolderId) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={(e) => {
          if (draggedItemId && draggedFromFolderId) {
            e.preventDefault();
            handleRemoveFromFolder(draggedItemId, draggedFromFolderId);
            setDraggedItemId(null);
            setDraggedFromFolderId(null);
          }
        }}
      >
        {/* Switcher Button: Servers vs Friends (matches standard server icon aesthetic) */}
        <div className="relative group w-full flex items-center justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleToggleMode}
                className={cn(
                  'group relative size-10 rounded-[14px] bg-sidebar-accent hover:bg-sidebar-accent/80 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold',
                  isFriendsMode ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                aria-label={isFriendsMode ? 'Mode Teman. Klik untuk ganti ke Mode Colony' : 'Mode Colony. Klik untuk ganti ke Mode Teman'}
              >
                {isFriendsMode ? (
                  <Users className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-foreground" />
                ) : (
                  <Compass className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-muted-foreground group-hover:text-foreground" />
                )}

                {/* Badge: total server unreads (when in server mode) or total DM unreads (when in friend mode) */}
                {isFriendsMode
                  ? friendModeBadge && (
                      <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight">
                        {friendModeBadge}
                      </span>
                    )
                  : serverModeBadge && (
                      <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight">
                        {serverModeBadge}
                      </span>
                    )
                }
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {isFriendsMode ? t('Mode: Teman (Klik untuk Mode Colony)') : t('Mode: Colony (Klik untuk Mode Teman)')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Add (+) Button: Add Server vs Add Friend */}
        <div className="relative group w-full flex items-center justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={isFriendsMode ? onOpenAddFriend : handleCreate}
                className="group relative size-10 rounded-[14px] bg-sidebar-accent hover:bg-sidebar-accent/80 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 font-bold text-muted-foreground hover:text-foreground"
              >
                {isFriendsMode ? (
                  <UserPlus className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 text-muted-foreground group-hover:text-foreground" />
                ) : (
                  <Plus className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90 text-muted-foreground group-hover:text-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
              {isFriendsMode ? t('Tambah Teman Baru') : t('Buat Colony Baru')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Separator before list */}
        {railEntries.length > 0 && (
          <div className="w-8 h-[2px] bg-border rounded-full my-0.5 shrink-0" />
        )}

        {/* Mode-specific list: Folders and Standalone Items */}
        {railEntries.map((entry) => {
          if (entry.type === 'item') {
            return isFriendsMode
              ? renderRailFriendItem(entry.item)
              : renderRailServerItem(entry.item);
          }

          const folder = entry.folder;
          const items = entry.items;
          const isAnyChildActive = items.some((it) =>
            isFriendsMode
              ? activeChannelId === `dm-${it.id}` ||
                activeChannelId === it.id ||
                (Boolean(activeChannelId?.startsWith('dm-')) && Boolean(activeChannelId?.includes(it.id)))
              : currentActiveId === it.id,
          );
          const folderUnread = getFolderUnreadBadge(folder.itemIds);
          const folderTooltipText = items.map((it) => it.name).join(', ');

          if (!folder.expanded) {
            return (
              <div
                key={folder.id}
                className="relative group w-full flex items-center justify-center"
                onDragOver={(e) => {
                  if (!draggedItemId || folder.itemIds.includes(draggedItemId)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverFolderId !== folder.id) setDragOverFolderId(folder.id);
                }}
                onDragLeave={() => {
                  if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedItemId) return;
                  handleDropOnFolder(draggedItemId, folder.id, draggedFromFolderId);
                }}
              >
                <span
                  className={cn(
                    'absolute left-0 w-[4px] bg-foreground rounded-r-full transition-all duration-200',
                    isAnyChildActive
                      ? 'h-10'
                      : folderUnread
                      ? 'h-2 group-hover:h-5'
                      : 'h-0 group-hover:h-3.5 opacity-80',
                  )}
                />

                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggleFolderExpanded(folder.id)}
                      onContextMenu={(e) => handleDissolveFolder(folder.id, e)}
                      className={cn(
                        'relative size-10 flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shrink-0 rounded-[14px]',
                        dragOverFolderId === folder.id
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar bg-primary/20 scale-105 shadow-md'
                          : isAnyChildActive
                          ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                          : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-foreground',
                      )}
                    >
                      <Folder className="size-5 fill-[#5865F2] text-[#5865F2] transition-transform duration-200 group-hover:scale-110" />

                      {folderUnread && (
                        <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#da373c] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-sidebar z-20 shadow-md pointer-events-none leading-none tracking-tight animate-in zoom-in-75">
                          {folderUnread}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs max-w-[220px]">
                    <div>
                      <div className="font-bold line-clamp-3">{folderTooltipText}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {t('Klik untuk membuka, klik kanan untuk membongkar')}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          }

          // Expanded folder
          return (
            <div
              key={folder.id}
              className={cn(
                'w-12 py-1.5 px-0.5 rounded-3xl bg-sidebar-accent/50 dark:bg-zinc-800/50 border border-sidebar-border/40 flex flex-col items-center gap-2 transition-all duration-200 animate-in fade-in zoom-in-95',
                dragOverFolderId === folder.id && 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar bg-primary/10',
              )}
              onDragOver={(e) => {
                if (!draggedItemId || folder.itemIds.includes(draggedItemId)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverFolderId !== folder.id) setDragOverFolderId(folder.id);
              }}
              onDragLeave={() => {
                if (dragOverFolderId === folder.id) setDragOverFolderId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!draggedItemId) return;
                handleDropOnFolder(draggedItemId, folder.id, draggedFromFolderId);
              }}
            >
              {/* Folder header toggle */}
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleFolderExpanded(folder.id)}
                    onContextMenu={(e) => handleDissolveFolder(folder.id, e)}
                    className="relative size-10 rounded-[14px] flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-sidebar-accent/80 text-primary"
                  >
                    <FolderOpen className="size-5 fill-[#5865F2]/40 text-[#5865F2] transition-transform duration-200 hover:scale-110" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
                  <div>
                    <div className="font-bold">{folder.name || t('Folder')}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t('Klik untuk menutup folder, klik kanan untuk membongkar')}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Items inside folder */}
              {items.map((it) =>
                isFriendsMode
                  ? renderRailFriendItem(it, folder.id)
                  : renderRailServerItem(it, folder.id),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Backward-compatible aliases
export const ColonyRail = MiniRail;
export const ServerRail = MiniRail;
