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
import type { ColonyChannel, ColonyMessage, ColonyRole } from '@/chat/chat-types';
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
  t,
}: MessagesFeedProps) {
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
          {/* Welcome banner at top of channel */}
          <div className="mb-6 pt-4 pb-2">
            <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary mb-3">
              <Hash className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Selamat datang di #{activeChannel.name}!
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              {activeChannel.description ||
                'Ruang obrolan tim Anticeil. Mulai percakapan, bagikan template otomatisasi, atau koordinasikan alur kerja tim.'}
            </p>
          </div>

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
