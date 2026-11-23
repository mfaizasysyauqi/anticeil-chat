import React from 'react';
import {
  Hash,
  Plus,
  Pin,
  MessageSquare,
  Reply,
  Trash2,
  Paperclip,
  Check,
  ExternalLink,
  Layers,
  Pencil,
  Volume2,
  Megaphone,
  UserPlus,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { RoleBadge } from '@/features/members';
import { renderFormattedMessage, DecryptedMessageText } from '../utils/format-message';
import { colonyApi } from '@/chat/chat-api';
import { api } from '@/lib/api';
import { friendsApi } from '@/features/friends/api/friends-api';
import type { Colony, ColonyChannel, ColonyMessage, ColonyRole } from '@/chat/chat-types';
import { MessageItem } from './feed/message-item';
import dayjs from 'dayjs';

function formatDateDivider(dateStr?: string): string {
  if (!dateStr) return 'Hari ini';
  const d = dayjs(dateStr);
  const now = dayjs();
  if (d.isSame(now, 'day')) {
    return 'Hari ini';
  }
  if (d.isSame(now.subtract(1, 'day'), 'day')) {
    return 'Kemarin';
  }
  return d.format('D MMMM YYYY');
}

export interface MessagesFeedProps {
  activeChannel: ColonyChannel | null;
  channelPaddingClass?: string;
  filteredMessages: ColonyMessage[];
  currentUser: any;
  claimedGifts: Record<string, boolean>;
  setClaimedGifts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onOpenCreateChannel: () => void;
  onOpenEditChannel?: (channel: ColonyChannel) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onReply?: (message: ColonyMessage) => void;
  onStartThread: (initialName: string, initialContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onJoinActivity?: (appId: string, channelId?: string) => void;
  onJumpToMessage?: (messageId: string) => void;
  activeActivityAppId?: string | null;
  activeCallChannelId?: string | null;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  colonies?: Colony[];
  onAddMemberToGroup?: (memberId: string) => void;
  friends?: {
    allFriends?: any[];
    onDeleteFriend?: (id: string) => Promise<void> | void;
    onAddFriend?: (username?: string, userId?: string) => Promise<void> | void;
    [key: string]: any;
  };
  members?: any[];
  t: (key: string) => string;
}

export function MessagesFeed({
  activeChannel,
  channelPaddingClass = 'px-4 lg:px-6',
  filteredMessages,
  currentUser,
  claimedGifts,
  setClaimedGifts,
  onOpenCreateChannel,
  onOpenEditChannel,
  onToggleReaction,
  onTogglePin,
  onReply,
  onStartThread,
  onDeleteMessage,
  onJoinActivity,
  onJumpToMessage,
  activeActivityAppId,
  activeCallChannelId,
  messagesEndRef,
  colonies = [],
  onAddMemberToGroup,
  friends,
  members = [],
  t,
}: MessagesFeedProps) {
  const isGroupDm = Boolean(
    activeChannel?.isGroupDm ||
    activeChannel?.id?.startsWith('gdm-') ||
    (activeChannel?.dmUserIds && activeChannel.dmUserIds.length > 1)
  );
  const isDm = Boolean(
    activeChannel?.isDirectMessage ||
    activeChannel?.id?.startsWith('dm-') ||
    activeChannel?.dmUserId ||
    activeChannel?.category === 'DIRECT MESSAGES' ||
    activeChannel?.category?.toLowerCase()?.includes('direct') ||
    activeChannel?.description?.toLowerCase()?.includes('percakapan langsung') ||
    activeChannel?.colonyId === 'home' ||
    activeChannel?.colonyId === 'direct_messages' ||
    isGroupDm
  );

  // Group DM Invite Modal
  const [isInviteGroupDmOpen, setIsInviteGroupDmOpen] = React.useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = React.useState('');
  const [selectedInviteFriendId, setSelectedInviteFriendId] = React.useState<string | null>(null);

  const groupMemberIds = React.useMemo(() => activeChannel?.dmUserIds || [], [activeChannel?.dmUserIds]);

  const availableFriendsToAdd = React.useMemo(() => {
    const list =
      friends?.allFriends && friends.allFriends.length > 0
        ? friends.allFriends
        : members || [];
    const q = inviteSearchQuery.trim().toLowerCase();
    return list.filter((m: any) => {
      if (groupMemberIds.includes(m.id)) return false;
      if (currentUser?.id && m.id === currentUser.id) return false;
      if (!q) return true;
      return (
        (m.name || '').toLowerCase().includes(q) ||
        (m.username || '').toLowerCase().includes(q)
      );
    });
  }, [friends?.allFriends, members, groupMemberIds, currentUser?.id, inviteSearchQuery]);

  const handleExecuteInvite = () => {
    if (!selectedInviteFriendId) return;
    if (onAddMemberToGroup) {
      onAddMemberToGroup(selectedInviteFriendId);
    }
    toast.success(t('Teman berhasil ditambahkan ke grup!'));
    setSelectedInviteFriendId(null);
    setInviteSearchQuery('');
    setIsInviteGroupDmOpen(false);
  };

  // Block state
  const [blockedUsers, setBlockedUsers] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('anticeil_blocked_users') || '[]');
    } catch {
      return [];
    }
  });

  // Removed friends optimistic state
  const [removedFriendIds, setRemovedFriendIds] = React.useState<Set<string>>(new Set());

  // Helper to determine if an entity is the current logged-in user
  const isSelf = React.useCallback(
    (user: any): boolean => {
      if (!user || !currentUser) return false;
      const myId = currentUser.id ? String(currentUser.id) : '';
      const myEmail = (currentUser.email || '').toLowerCase().trim();
      const myName = (
        currentUser.name ||
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`
      )
        .toLowerCase()
        .trim();
      const myUsername = (currentUser.username || '').toLowerCase().trim();

      const uid = user.id ? String(user.id) : '';
      const uemail = (user.email || '').toLowerCase().trim();
      const uname = (user.name || user.displayName || user.firstName || '')
        .toLowerCase()
        .trim();
      const uusername = (user.username || '').toLowerCase().trim();

      if (myId && uid && myId === uid) return true;
      if (myEmail && uemail && myEmail === uemail) return true;
      if (myUsername && uusername && myUsername === uusername) return true;
      if (myName && uname && myName === uname) return true;
      return false;
    },
    [currentUser],
  );

  // Resolve DM peer friend info
  const dmFriend = React.useMemo(() => {
    if (!isDm || !activeChannel) return null;

    let otherUserId: string | null = null;
    if (activeChannel.dmUserId && !isSelf({ id: activeChannel.dmUserId })) {
      otherUserId = String(activeChannel.dmUserId);
    }
    if (!otherUserId && activeChannel.id?.startsWith('dm-')) {
      const parts = activeChannel.id.slice(3).split('-').filter(Boolean);
      const peerPart = parts.find((p: string) => !isSelf({ id: p }) && p !== 'chat');
      if (peerPart) otherUserId = peerPart;
    }

    const cleanChannelName = (activeChannel.name || '').replace(/^[@#]\s*/, '').trim();
    const isGenericChannelName =
      !cleanChannelName ||
      cleanChannelName.toLowerCase() === 'direct message' ||
      cleanChannelName.toLowerCase() === 'pesan langsung' ||
      isSelf({ name: cleanChannelName });

    const foundFriend = friends?.allFriends?.find((f: any) => {
      if (isSelf(f)) return false;
      if (otherUserId && String(f.id) === otherUserId) return true;
      if (!isGenericChannelName) {
        const fName = (f.name || '').toLowerCase();
        const fUser = (f.username || '').toLowerCase();
        const cName = cleanChannelName.toLowerCase();
        return fName === cName || fUser === cName;
      }
      return false;
    });

    const foundMember = members?.find((m: any) => {
      if (isSelf(m)) return false;
      if (otherUserId && String(m.id) === otherUserId) return true;
      if (!isGenericChannelName) {
        const mName = (m.name || '').toLowerCase();
        const mUser = (m.username || '').toLowerCase();
        const cName = cleanChannelName.toLowerCase();
        return mName === cName || mUser === cName;
      }
      return false;
    });

    // Look for peer sender info from messages in this DM
    const peerMessage = filteredMessages.find(
      (m: any) =>
        !isSelf({ id: m.senderId, name: m.senderName, username: (m as any).senderUsername }) &&
        (m.senderAvatar || m.senderName),
    );

    // Check localStorage cached message avatars for peer
    let cachedMessageAvatar: string | undefined;
    try {
      if (typeof window !== 'undefined') {
        const rawMsgs = localStorage.getItem('anticeil_colony_messages_v3');
        if (rawMsgs) {
          const msgsMap = JSON.parse(rawMsgs);
          const channelMsgs = msgsMap[activeChannel.id];
          if (Array.isArray(channelMsgs)) {
            for (let i = channelMsgs.length - 1; i >= 0; i--) {
              const msg = channelMsgs[i];
              if (
                msg?.senderAvatar &&
                !isSelf({ id: msg.senderId, name: msg.senderName, username: msg.senderUsername })
              ) {
                cachedMessageAvatar = msg.senderAvatar;
                break;
              }
            }
          }
          if (!cachedMessageAvatar && !isGenericChannelName) {
            const searchLower = cleanChannelName.toLowerCase();
            for (const list of Object.values(msgsMap) as any[]) {
              if (!Array.isArray(list)) continue;
              for (let i = list.length - 1; i >= 0; i--) {
                const msg = list[i];
                if (
                  msg?.senderAvatar &&
                  msg.senderName &&
                  !isSelf({ id: msg.senderId, name: msg.senderName, username: msg.senderUsername }) &&
                  (msg.senderName.toLowerCase() === searchLower ||
                    msg.senderName.toLowerCase().startsWith(searchLower) ||
                    searchLower.startsWith(msg.senderName.toLowerCase()))
                ) {
                  cachedMessageAvatar = msg.senderAvatar;
                  break;
                }
              }
              if (cachedMessageAvatar) break;
            }
          }
        }
      }
    } catch {}

    const myAvatar = currentUser?.imageUrl || currentUser?.avatar || null;
    const candidateAvatars = [
      foundFriend?.avatar,
      foundFriend?.imageUrl,
      foundMember?.avatar,
      foundMember?.imageUrl,
      peerMessage?.senderAvatar,
      cachedMessageAvatar,
      (activeChannel as any).recipientAvatar,
      (activeChannel as any).dmUserAvatar,
      activeChannel.avatar,
      (activeChannel as any).iconUrl,
      (activeChannel as any).imageUrl,
    ].filter(Boolean);

    // Filter out current user's avatar so peer never uses current user's avatar
    const resolvedAvatar =
      candidateAvatars.find((av) => !myAvatar || av !== myAvatar) || null;

    const candidateNames = [
      foundFriend?.name,
      foundMember?.name,
      peerMessage?.senderName,
      !isGenericChannelName ? cleanChannelName : null,
    ].filter(Boolean);

    const resolvedDisplayName =
      candidateNames.find((n) => !isSelf({ name: n })) ||
      (!isGenericChannelName ? cleanChannelName : 'Direct Message');

    const username =
      foundFriend?.username ||
      foundMember?.username ||
      (peerMessage as any)?.senderUsername ||
      (resolvedDisplayName !== cleanChannelName ? cleanChannelName : null) ||
      resolvedDisplayName.toLowerCase().replace(/[^a-z0-9_]/g, '');

    const resolvedId =
      (foundFriend?.id && !isSelf(foundFriend) ? foundFriend.id : null) ||
      (foundMember?.id && !isSelf(foundMember) ? foundMember.id : null) ||
      otherUserId ||
      activeChannel.id;

    return {
      id: resolvedId,
      name: resolvedDisplayName,
      username:
        username && username.toLowerCase() !== resolvedDisplayName.toLowerCase()
          ? username
          : foundFriend?.username || username,
      avatar: resolvedAvatar,
    };
  }, [
    isDm,
    activeChannel,
    friends?.allFriends,
    members,
    filteredMessages,
    currentUser,
    isSelf,
  ]);

  // Check if target is a friend
  const isFriend = Boolean(
    dmFriend?.id &&
      !removedFriendIds.has(dmFriend.id) &&
      (friends?.allFriends?.some((f: any) => f.id === dmFriend.id) ?? true)
  );

  const isBlocked = Boolean(dmFriend?.id && blockedUsers.includes(dmFriend.id));

  // Mutual colonies
  const mutualColonies = React.useMemo(() => {
    if (!colonies || colonies.length === 0) return [];
    return colonies.filter(
      (c) =>
        c &&
        c.id !== 'anticeil' &&
        c.id !== '@me' &&
        c.name?.toLowerCase().trim() !== 'pesan langsung' &&
        c.name?.toLowerCase().trim() !== 'direct messages'
    );
  }, [colonies]);

  const handleRemoveFriend = async () => {
    if (!dmFriend?.id) return;
    setRemovedFriendIds((prev) => new Set([...prev, dmFriend.id]));
    try {
      if (friends?.onDeleteFriend) {
        await friends.onDeleteFriend(dmFriend.id);
      } else {
        await friendsApi.deleteFriend(dmFriend.id);
      }
      toast.success(t('Teman dihapus'));
    } catch {
      toast.error(t('Gagal menghapus teman'));
    }
  };

  const handleAddFriend = async () => {
    if (!dmFriend) return;
    setRemovedFriendIds((prev) => {
      const next = new Set(prev);
      next.delete(dmFriend.id);
      return next;
    });
    try {
      if (friends?.onAddFriend) {
        await friends.onAddFriend(dmFriend.username || dmFriend.name, dmFriend.id);
      } else {
        await friendsApi.sendFriendRequest(dmFriend.username || dmFriend.name, dmFriend.id);
      }
      toast.success(t('Permintaan pertemanan terkirim!'));
    } catch {
      toast.error(t('Gagal mengirim permintaan pertemanan'));
    }
  };

  const handleToggleBlock = async () => {
    if (!dmFriend?.id) return;
    if (isBlocked) {
      const next = blockedUsers.filter((id) => id !== dmFriend.id);
      setBlockedUsers(next);
      localStorage.setItem('anticeil_blocked_users', JSON.stringify(next));
      toast.success(t('Pengguna telah dibuka blokirnya'));
    } else {
      const next = [...blockedUsers, dmFriend.id];
      setBlockedUsers(next);
      localStorage.setItem('anticeil_blocked_users', JSON.stringify(next));
      try {
        await api.post('/v1/community/users/block', { targetUserId: dmFriend.id });
      } catch {}
      toast.success(t('Pengguna berhasil diblokir'));
    }
  };
  return (
    <div
      className={cn(
        'flex-1 min-h-0 overflow-y-auto py-4 space-y-4 custom-scrollbar',
        channelPaddingClass === CHANNEL_HORIZONTAL_PADDING
          ? 'pl-3.5 sm:pl-4 md:pl-5 lg:pl-6 pr-3.5 sm:pr-4 md:pr-5 lg:pr-[18px]'
          : channelPaddingClass
      )}
    >
      {!activeChannel ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center text-muted-foreground mb-4">
            <Hash className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {t('Belum Ada Channel')}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
            {t('Workspace ini belum memiliki channel. Buat channel pertama untuk mulai berkolaborasi dan berkomunikasi dengan tim.')}
          </p>
          <Button onClick={onOpenCreateChannel} size="sm" className="gap-1.5 shadow-2xs">
            <Plus className="w-4 h-4" />
            {t('Buat Channel Baru')}
          </Button>
        </div>
      ) : (
        <>
          {/* Welcome banner at top of channel / Group DM / DM (Discord Style) */}
          {isGroupDm ? (
            <div className="mb-6 pt-4 pb-2">
              <CommunityAvatar
                name={activeChannel.name}
                imageUrl={activeChannel.avatar || (activeChannel as any).iconUrl}
                size={80}
                className="w-20 h-20 text-3xl font-bold mb-3 shadow-md"
              />
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {activeChannel.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
                {t('Welcome to the beginning of the')}{' '}
                <span className="font-semibold text-foreground">{activeChannel.name}</span>{' '}
                {t('group')}.
              </p>

              <div className="flex items-center gap-2 mt-4 pt-1">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setIsInviteGroupDmOpen(true)}
                  className="font-semibold text-xs shadow-2xs gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('Invite to Group DM')}</span>
                </Button>

                {onOpenEditChannel && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenEditChannel(activeChannel)}
                    className="font-semibold text-xs shadow-2xs gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>{t('Edit Group')}</span>
                  </Button>
                )}
              </div>
            </div>
          ) : isDm ? (
            <div className="mb-6 pt-4 pb-2">
              <CommunityAvatar
                name={dmFriend?.name || activeChannel.name}
                imageUrl={dmFriend?.avatar}
                size={80}
                className="w-20 h-20 text-3xl font-bold mb-3 shadow-md"
              />
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {dmFriend?.name || activeChannel.name}
              </h2>
              {dmFriend?.username && (
                <p className="text-base sm:text-lg font-medium text-foreground/80 mt-0.5">
                  {dmFriend.username}
                </p>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
                {t('This is the beginning of your direct message history with')}{' '}
                <span className="font-semibold text-foreground">
                  {dmFriend?.name || activeChannel.name}
                </span>
                .
              </p>

              <div className="flex items-center flex-wrap gap-2.5 mt-4 pt-1">
                <div className="flex items-center">
                  {mutualColonies.length > 0 && (
                    <div className="flex items-center -space-x-1.5 mr-2">
                      {mutualColonies.slice(0, 3).map((colony, idx) => (
                        <div
                          key={colony.id}
                          className="w-5 h-5 rounded-md border border-background bg-card flex items-center justify-center overflow-hidden shrink-0 shadow-2xs"
                          style={{ zIndex: 10 - idx }}
                          title={colony.name}
                        >
                          {colony.iconUrl ? (
                            <img src={colony.iconUrl} alt={colony.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-foreground">
                              {colony.initials || colony.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">
                    {mutualColonies.length} {t('Mutual Servers')}
                  </span>
                </div>

                <span className="text-muted-foreground/40">•</span>

                <div className="flex items-center gap-2">
                  {isFriend ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleRemoveFriend}
                      className="font-semibold text-xs shadow-2xs cursor-pointer active:scale-95"
                    >
                      {t('Remove Friend')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleAddFriend}
                      className="font-semibold text-xs shadow-2xs cursor-pointer active:scale-95"
                    >
                      {t('Add Friend')}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant={isBlocked ? 'destructive' : 'secondary'}
                    size="sm"
                    onClick={handleToggleBlock}
                    className="font-semibold text-xs shadow-2xs cursor-pointer active:scale-95"
                  >
                    {isBlocked ? t('Unblock') : t('Block')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 pt-4 pb-2">
              <div className="w-16 h-16 rounded-full bg-zinc-800/80 dark:bg-[#2b2d31] border border-border/50 flex items-center justify-center text-foreground mb-4">
                {activeChannel.type === 'voice' ? (
                  <Volume2 className="w-8 h-8" />
                ) : activeChannel.type === 'announcement' ? (
                  <Megaphone className="w-8 h-8" />
                ) : activeChannel.type === 'forum' ? (
                  <MessageSquare className="w-8 h-8" />
                ) : (
                  <Hash className="w-8 h-8" />
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Selamat datang di #{activeChannel.name}!
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
                {(activeChannel.description ||
                  `Ini adalah awal dari channel #${activeChannel.name}.`
                ).replace(/\s*\((?:Member|member)\)/gi, '')}
              </p>

              {onOpenEditChannel && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenEditChannel(activeChannel)}
                  className="mt-3.5 gap-2 shadow-2xs font-semibold text-xs cursor-pointer"
                  title={t('Edit Channel')}
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>{t('Edit Channel')}</span>
                </Button>
              )}
            </div>
          )}

          <Separator className="my-4 bg-border/40" />

          {/* Message List */}
          {filteredMessages.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Belum ada pesan di channel ini. Jadilah yang pertama mengirim pesan!
            </div>
          ) : (
            (() => {
              const unreadCount = activeChannel?.unreadCount || 0;
              const unreadStartIndex =
                unreadCount > 0 ? Math.max(0, filteredMessages.length - unreadCount) : -1;

              return filteredMessages.map((msg, index) => {
                const activityAtt = msg.attachments?.find((a) => a.type === 'activity');
                const act = activityAtt?.activityData;
                const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
                const isNewDay =
                  !prevMsg || !dayjs(msg.createdAt).isSame(dayjs(prevMsg.createdAt), 'day');
                const isUnreadDivider = index === unreadStartIndex && unreadStartIndex > 0;

                return (
                  <React.Fragment key={msg.id}>
                    {/* Date Section Divider (Sections per hari ala Discord) */}
                    {isNewDay && (
                      <div className="relative my-5 flex items-center justify-center select-none">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/40" />
                        </div>
                        <span className="relative px-3 py-0.5 text-[11px] font-bold text-muted-foreground/80 bg-background rounded-full border border-border/40 shadow-2xs">
                          {formatDateDivider(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Unread Section Divider (Sections unread ala Discord) */}
                    {isUnreadDivider && (
                      <div
                        className="relative my-4 flex items-center select-none"
                        id="anticeil-unread-divider"
                      >
                        <div className="w-full border-t border-[#da373c]/80" />
                        <span className="absolute right-4 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white bg-[#da373c] rounded-full shadow-xs leading-none">
                          BARU
                        </span>
                      </div>
                    )}

                    <MessageItem
                      msg={msg}
                      currentUser={currentUser}
                      activeChannel={activeChannel}
                      claimedGifts={claimedGifts}
                      setClaimedGifts={setClaimedGifts}
                      onToggleReaction={onToggleReaction}
                      onTogglePin={onTogglePin}
                      onReply={onReply}
                      onStartThread={onStartThread}
                      onDeleteMessage={onDeleteMessage}
                      onJoinActivity={onJoinActivity}
                      onJumpToMessage={onJumpToMessage}
                      activeActivityAppId={activeActivityAppId}
                      activeCallChannelId={activeCallChannelId}
                      t={t}
                    />
          
          </React.Fragment>
        );
      });
    })()
  )}
        </>
      )}
      {/* Group DM Invite Dialog */}
      <Dialog open={isInviteGroupDmOpen} onOpenChange={setIsInviteGroupDmOpen}>
        <DialogContent size="sm" className="p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-2 border-b border-border/40">
            <DialogTitle className="text-sm font-bold text-foreground">
              {t('Invite to Group DM')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {t('Pilih teman yang ingin Anda undang ke dalam obrolan grup ini.')}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-2.5 border-b border-border/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                placeholder={t('Cari teman...')}
                className="h-8 pl-8 text-xs bg-muted/40"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto px-2 py-1 custom-scrollbar divide-y divide-border/20">
            {availableFriendsToAdd.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {t('Semua teman Anda sudah berada di dalam grup ini.')}
              </div>
            ) : (
              availableFriendsToAdd.map((friend: any) => {
                const isSelected = selectedInviteFriendId === friend.id;
                return (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedInviteFriendId(friend.id)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer',
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CommunityAvatar
                        name={friend.name}
                        imageUrl={friend.avatar || friend.imageUrl}
                        size={28}
                        status={friend.status}
                        showStatus
                      />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {friend.name}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-2',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/40'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsInviteGroupDmOpen(false)}
              className="text-xs cursor-pointer"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedInviteFriendId}
              onClick={handleExecuteInvite}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-2xs"
            >
              {t('Tambahkan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div ref={messagesEndRef} />
    </div>
  );
}

// Domain alias (UI/UX alignment)
export const ChatFeed = MessagesFeed;
export type ChatFeedProps = MessagesFeedProps;
