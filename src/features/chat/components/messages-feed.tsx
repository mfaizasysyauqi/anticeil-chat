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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  friends,
  members = [],
  t,
}: MessagesFeedProps) {
  const isDm = Boolean(activeChannel?.isDirectMessage || activeChannel?.id?.startsWith('dm-') || activeChannel?.dmUserId);

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

  // Resolve DM peer friend info
  const dmFriend = React.useMemo(() => {
    if (!isDm || !activeChannel) return null;
    const dmUserId =
      activeChannel.dmUserId ||
      (activeChannel.id.startsWith('dm-') ? activeChannel.id.replace('dm-', '') : null);

    const foundFriend = friends?.allFriends?.find(
      (f: any) =>
        (dmUserId && f.id === dmUserId) ||
        (activeChannel.name &&
          (f.name?.toLowerCase() === activeChannel.name.toLowerCase() ||
            f.username?.toLowerCase() === activeChannel.name.toLowerCase()))
    );

    const foundMember = members?.find(
      (m: any) =>
        (dmUserId && m.id === dmUserId) ||
        (activeChannel.name &&
          (m.name?.toLowerCase() === activeChannel.name.toLowerCase() ||
            m.username?.toLowerCase() === activeChannel.name.toLowerCase()))
    );

    const displayName =
      foundFriend?.name ||
      foundMember?.name ||
      activeChannel.name?.replace(/^@/, '') ||
      'Pengguna Anticeil';

    const username =
      foundFriend?.username ||
      foundMember?.username ||
      (displayName !== activeChannel.name?.replace(/^@/, '') ? activeChannel.name?.replace(/^@/, '') : null) ||
      displayName.toLowerCase().replace(/[^a-z0-9_]/g, '');

    const avatar =
      foundFriend?.avatar ||
      foundFriend?.imageUrl ||
      foundMember?.avatar ||
      foundMember?.imageUrl ||
      activeChannel.avatar ||
      (activeChannel as any).iconUrl ||
      null;

    const id = foundFriend?.id || foundMember?.id || dmUserId || activeChannel.id;

    return {
      id,
      name: displayName,
      username: username && username.toLowerCase() !== displayName.toLowerCase() ? username : (foundFriend?.username || username),
      avatar,
    };
  }, [isDm, activeChannel, friends?.allFriends, members]);

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
    const nonDefault = colonies.filter((c) => c.id !== 'anticeil');
    return nonDefault.length > 0 ? nonDefault : colonies;
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
          {/* Welcome banner at top of channel / DM (Discord Style) */}
          {isDm ? (
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
                    <button
                      type="button"
                      onClick={handleRemoveFriend}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      {t('Remove Friend')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddFriend}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      {t('Add Friend')}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleBlock}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95',
                      isBlocked
                        ? 'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/20'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    )}
                  >
                    {isBlocked ? t('Unblock') : t('Block')}
                  </button>
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
                <button
                  type="button"
                  onClick={() => onOpenEditChannel(activeChannel)}
                  className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/80 hover:bg-muted text-foreground transition-all cursor-pointer border border-border/60 hover:border-border shadow-2xs group"
                  title={t('Edit Channel')}
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>{t('Edit Channel')}</span>
                </button>
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
      <div ref={messagesEndRef} />
    </div>
  );
}

// Domain alias (UI/UX alignment)
export const ChatFeed = MessagesFeed;
export type ChatFeedProps = MessagesFeedProps;
