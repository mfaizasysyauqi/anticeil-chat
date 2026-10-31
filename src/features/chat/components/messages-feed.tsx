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
import { CommunityAvatar } from '@/chat/chat-avatar';
import { RoleBadge } from '@/features/members';
import { renderFormattedMessage } from '../utils/format-message';
import { communityApi } from '@/chat/chat-api';
import type { CommunityChannel, CommunityMessage, CommunityRole } from '@/chat/chat-types';
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
  activeChannel: CommunityChannel | null;
  channelPaddingClass?: string;
  filteredMessages: CommunityMessage[];
  currentUser: any;
  claimedGifts: Record<string, boolean>;
  setClaimedGifts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onOpenCreateChannel: () => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onReply?: (message: CommunityMessage) => void;
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
    <div className={`flex-1 min-h-0 overflow-y-auto ${channelPaddingClass} py-4 space-y-4 [scrollbar-width:thin]`}>
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
                        id="discord-unread-divider"
                      >
                        <div className="w-full border-t border-[#da373c]/80" />
                        <span className="absolute right-4 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white bg-[#da373c] rounded-full shadow-xs leading-none">
                          BARU
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col">
                  {/* Discord Reply Quote Spine */}
                  {msg.replyTo && (
                    <div
                      onClick={() => msg.replyTo?.id && onJumpToMessage?.(msg.replyTo.id)}
                      className="group/reply flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 select-none pl-6 relative cursor-pointer hover:text-foreground transition-colors max-w-full"
                      title="Klik untuk melompat ke pesan yang dibalas"
                    >
                      <div className="absolute left-2.5 top-2 w-3.5 h-3 rounded-tl-md border-t-2 border-l-2 border-muted-foreground/40 pointer-events-none group-hover/reply:border-foreground/60 transition-colors" />
                      <CommunityAvatar
                        name={msg.replyTo.senderName || 'Pengguna'}
                        imageUrl={msg.replyTo.senderAvatar}
                        size={16}
                        className="shrink-0"
                        showStatus={false}
                      />
                      <span className="font-semibold text-foreground/90 shrink-0 group-hover/reply:underline">@{msg.replyTo.senderName}</span>
                      <span className="truncate max-w-[320px] sm:max-w-[480px] md:max-w-[650px] pr-1.5 text-muted-foreground/80 group-hover/reply:text-foreground/90 transition-colors">
                        {msg.replyTo.content || '[Lampiran]'}
                      </span>
                    </div>
                  )}

                  {/* Discord Command Header / Interaction spine with Click to see command */}
                  {act && (
                    <div
                      onClick={() => onJumpToMessage?.(msg.id)}
                      className="group/cmd flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 select-none pl-6 relative cursor-pointer hover:text-foreground transition-colors"
                      title="Klik untuk melihat pesan command"
                    >
                      {/* Curved spine connector line */}
                      <div className="absolute left-2.5 top-2 w-3.5 h-3 rounded-tl-md border-t-2 border-l-2 border-border/80 pointer-events-none group-hover/cmd:border-foreground/60 transition-colors" />
                      {/* App icon badge */}
                      <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        {act.appId === 'watch-together' || act.appId === 'youtube' ? (
                          <svg className="w-2.5 h-2 fill-[#ff0000]" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        ) : (
                          <span className="text-[10px] leading-none">{act.icon || '🚀'}</span>
                        )}
                      </div>
                      <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-0.2 rounded-[3px] flex items-center gap-0.5 leading-none shadow-2xs">
                        <Check className="w-2 h-2 stroke-[3]" />
                        <span>APP</span>
                      </span>
                      <span className="font-semibold text-foreground/90 group-hover/cmd:underline">
                        {act.name}
                      </span>
                      <span className="font-semibold text-[#5865f2] group-hover/cmd:underline flex items-center gap-1">
                        <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M7 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm10 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm-10 10a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm10 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
                        </svg>
                        Launch
                      </span>
                    </div>
                  )}

                  <div
                    id={`msg-${msg.id}`}
                    className={cn(
                      'group relative flex gap-3 px-2 py-1.5 -mx-2 rounded-lg hover:bg-muted/40 transition-colors',
                      msg.isPinned && 'border-l-2 border-primary bg-primary/5',
                    )}
                  >
                    {/* Sender Avatar: If Activity, show App Logo */}
                    {act ? (
                      <div
                        className={cn(
                          'w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-md text-white',
                          act.appId === 'watch-together' || act.appId === 'youtube'
                            ? 'bg-[#ff0000]'
                            : act.iconBg || 'bg-primary',
                        )}
                      >
                        {act.appId === 'watch-together' || act.appId === 'youtube' ? (
                          <svg className="w-5 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        ) : (
                          <span className="text-xl">{act.icon || '🚀'}</span>
                        )}
                      </div>
                    ) : (
                      <CommunityAvatar
                        name={msg.senderName}
                        email={msg.senderEmail}
                        imageUrl={msg.senderAvatar}
                        size={38}
                        className="shrink-0 mt-0.5"
                      />
                    )}

                    {/* Message Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer">
                          {act ? act.name : msg.senderName}
                        </span>
                        {act ? (
                          <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] flex items-center gap-0.5 leading-none shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>APP</span>
                          </span>
                        ) : (
                          <RoleBadge role={msg.senderRole as CommunityRole} />
                        )}
                        {msg.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">
                            <Pin className="w-2.5 h-2.5" /> Tersemat
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {msg.content ? (
                        <div className="text-xs leading-relaxed text-foreground/90 break-words">
                          {renderFormattedMessage(msg.content)}
                        </div>
                      ) : null}

                      {/* Attachments rendering */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att, attIdx) => {
                            if (att.type === 'activity' && att.activityData) {
                              const itemAct = att.activityData;
                              const isYoutube = itemAct.appId === 'watch-together' || itemAct.appId === 'youtube';
                              const isWordle = itemAct.appId === 'wordle';
                              const isPoker = itemAct.appId === 'poker-night' || itemAct.appId === 'erth-poker';
                              const isMagicGarden = itemAct.appId === 'magic-garden';

                              const gradientClass = isYoutube
                                ? 'from-[#4d1014] via-[#330c0f] to-[#1f0709] border-red-500/30'
                                : isWordle
                                  ? 'from-[#123824] via-[#0c2417] to-[#08180e] border-emerald-500/30'
                                  : isPoker
                                    ? 'from-[#1b254b] via-[#111730] to-[#0b0e1e] border-blue-500/30'
                                    : isMagicGarden
                                      ? 'from-[#3d240d] via-[#261608] to-[#140b04] border-amber-500/30'
                                      : 'from-[#2b2d31] via-[#1e1f22] to-[#111214] border-border/80';

                              const currentUserName =
                                `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
                                currentUser?.name ||
                                currentUser?.email?.split('@')[0] ||
                                '';
                              const isActivityCurrentlyActive = Boolean(
                                activeActivityAppId &&
                                (activeActivityAppId === itemAct.appId ||
                                 (activeActivityAppId === 'watch-together' && itemAct.appId === 'youtube') ||
                                 (activeActivityAppId === 'youtube' && itemAct.appId === 'watch-together')) &&
                                (!itemAct.channelId || !activeCallChannelId || itemAct.channelId === activeCallChannelId)
                              );

                              const isAlreadyPlaying = isActivityCurrentlyActive && (
                                (currentUser?.id && (itemAct.startedById === currentUser.id || msg.senderId === currentUser.id)) ||
                                (currentUserName && itemAct.startedBy === currentUserName)
                              );

                              return (
                                <div
                                  key={attIdx}
                                  className={cn(
                                    'my-2 max-w-sm sm:max-w-md rounded-2xl border bg-gradient-to-b shadow-2xl p-4 sm:p-5 relative overflow-hidden select-none',
                                    gradientClass,
                                  )}
                                >
                                  {/* Invitation Header Label */}
                                  <span className="text-[11px] font-bold text-white/75 tracking-wider uppercase block mb-3.5">
                                    App Invitation
                                  </span>

                                  {/* Main App Info Row */}
                                  <div className="flex items-center gap-3.5 mb-4">
                                    {/* App Icon in White Rounded Square */}
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-white/20 flex items-center justify-center shrink-0 shadow-xl">
                                      {isYoutube ? (
                                        <svg className="w-8 h-6 fill-[#ff0000]" viewBox="0 0 24 24">
                                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                      ) : isWordle ? (
                                        <div className="w-8 h-8 grid grid-cols-3 gap-0.5 p-1 bg-black rounded-md">
                                          <div className="bg-[#538d4e] rounded-[1px]" />
                                          <div className="bg-[#538d4e] rounded-[1px]" />
                                          <div className="bg-[#538d4e] rounded-[1px]" />
                                          <div className="bg-[#b59f3b] rounded-[1px]" />
                                          <div className="bg-[#3a3a3c] rounded-[1px]" />
                                          <div className="bg-[#538d4e] rounded-[1px]" />
                                          <div className="bg-[#538d4e] rounded-[1px]" />
                                          <div className="bg-[#538d4e] rounded-[1px]" />
                                          <div className="bg-[#538d4e] rounded-[1px]" />
                                        </div>
                                      ) : (
                                        <span className="text-2xl">{itemAct.icon || '🚀'}</span>
                                      )}
                                    </div>

                                    {/* Title & Playing Status */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                                        {itemAct.name}
                                      </h4>
                                      {isActivityCurrentlyActive ? (
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                          <CommunityAvatar
                                            name={itemAct.startedBy || 'Player'}
                                            imageUrl={itemAct.startedByAvatar}
                                            size={16}
                                            className="shrink-0"
                                            showStatus={false}
                                          />
                                          <span className="text-xs text-white/90 font-medium">1 Using</span>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-white/70 mt-1 truncate font-medium">
                                          App ended. Start a new one?
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Full-width Join/Joined Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
                                      onJoinActivity?.(itemAct.appId, itemAct.channelId);
                                    }}
                                    className={cn(
                                      'w-full py-2.5 px-4 rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2',
                                      isAlreadyPlaying
                                        ? 'bg-white/20 hover:bg-white/25 text-white backdrop-blur-xs'
                                        : 'bg-white hover:bg-zinc-200 text-zinc-950',
                                    )}
                                  >
                                    <span>{isAlreadyPlaying ? 'Joined' : isActivityCurrentlyActive ? 'Join' : 'Play'}</span>
                                  </button>
                                </div>
                              );
                            }
                            if (att.type === 'template' && att.templateData) {
                              return (
                                <Card
                                  key={attIdx}
                                  className="p-3 max-w-md bg-sidebar border-border/80 rounded-lg shadow-xs hover:border-primary/50 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                        <Layers className="w-4 h-4" />
                                      </div>
                                      <span className="text-xs font-semibold">{att.templateData.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                      {att.templateData.price || 'Free'}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                                    {att.templateData.description}
                                  </p>
                                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/40">
                                    <span className="text-[10px] text-muted-foreground">
                                      {att.templateData.pieceCount} Langkah Alur
                                    </span>
                                    <Button size="sm" variant="default" className="h-7 text-xs px-2.5" asChild>
                                      <Link to="/templates">
                                        {t('Gunakan Template')}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                      </Link>
                                    </Button>
                                  </div>
                                </Card>
                              );
                            }
                            if (att.type === 'sticker') {
                              return (
                                <div key={attIdx} className="my-1 inline-block select-none group/sticker" title={att.name}>
                                  <img
                                    src={att.url}
                                    alt={att.name}
                                    className="w-36 h-36 object-contain drop-shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer"
                                  />
                                </div>
                              );
                            }
                            if (att.type === 'gif') {
                              return (
                                <div key={attIdx} className="my-1.5 max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/40">
                                  <img
                                    src={att.url}
                                    alt={att.name}
                                    className="max-h-72 w-full object-cover rounded-t-xl"
                                  />
                                  <div className="px-2.5 py-1 bg-[#111214] flex items-center justify-between text-[10px] text-[#949ba4]">
                                    <span className="font-bold tracking-wider text-primary uppercase">GIF via Klipy</span>
                                    <span className="truncate max-w-[200px]">{att.name}</span>
                                  </div>
                                </div>
                              );
                            }
                            if (att.type === 'gift') {
                              const isClaimed = claimedGifts[msg.id] || att.giftData?.claimed;
                              return (
                                <div key={attIdx} className="my-2 max-w-sm rounded-2xl border border-primary/40 bg-gradient-to-b from-[#202225] to-[#18191c] shadow-2xl p-4 relative overflow-hidden">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5865f2] to-[#eb459e] flex items-center justify-center text-white shadow-lg text-2xl shrink-0">
                                      🎁
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[10px] font-black tracking-wider text-[#eb459e] uppercase block">
                                        A WILD GIFT APPEARS!
                                      </span>
                                      <h4 className="text-xs font-black text-white italic tracking-wide">
                                        {att.name || 'Discord Nitro Gift'}
                                      </h4>
                                      <p className="text-[10px] text-[#949ba4] truncate">
                                        {att.giftData?.price || 'IDR 142,714'} • Hadiah Komunitas
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                                    {isClaimed ? (
                                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" /> Telah Diklaim
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-[#949ba4] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Siap diklaim
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      disabled={isClaimed}
                                      onClick={async () => {
                                        setClaimedGifts((prev) => ({ ...prev, [msg.id]: true }));
                                        confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
                                        toast.success('🎉 Hadiah Nitro berhasil diklaim ke akun Anda!');
                                        await communityApi.claimGift(msg.id, currentUser?.firstName || currentUser?.name || 'User');
                                      }}
                                      className={cn(
                                        "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer",
                                        isClaimed
                                          ? "bg-white/10 text-[#949ba4] cursor-not-allowed"
                                          : "bg-[#248046] hover:bg-[#1a6334] text-white hover:shadow-emerald-900/30"
                                      )}
                                    >
                                      {isClaimed ? 'Diklaim' : 'Klaim Hadiah'}
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            if (att.type === 'image') {
                              return (
                                <img
                                  key={attIdx}
                                  src={att.url}
                                  alt={att.name}
                                  className="max-h-60 rounded-md border border-border/60 object-cover"
                                />
                              );
                            }
                            if (att.type === 'video') {
                              return (
                                <video
                                  key={attIdx}
                                  src={att.url}
                                  controls
                                  className="max-h-72 max-w-md rounded-md border border-border/60"
                                />
                              );
                            }
                            if (att.type === 'audio') {
                              return (
                                <audio
                                  key={attIdx}
                                  src={att.url}
                                  controls
                                  className="max-w-md my-1"
                                />
                              );
                            }
                        return (
                          <div
                            key={attIdx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/60 border border-border/40 text-xs"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="truncate">{att.name}</span>
                            {att.size && <span className="text-[10px] text-muted-foreground">({att.size})</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reactions Row */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                        const isReacted = userIds.includes(currentUser?.id || 'me');
                        return (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border transition-colors cursor-pointer',
                              isReacted
                                ? 'bg-primary/15 border-primary/40 text-primary font-medium'
                                : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted',
                            )}
                          >
                            <span>{emoji}</span>
                            <span className="text-[11px] font-semibold">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Discord Hover Action Bar */}
                <div className="absolute right-3 -top-3.5 hidden group-hover:flex items-center bg-background border border-border/80 shadow-md rounded-md p-0.5 gap-0.5 z-10">
                  <button
                    onClick={() => onToggleReaction(msg.id, '👍')}
                    className="p-1 hover:bg-muted rounded text-xs transition-colors"
                    title="Like"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => onToggleReaction(msg.id, '❤️')}
                    className="p-1 hover:bg-muted rounded text-xs transition-colors"
                    title="Love"
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => onToggleReaction(msg.id, '🔥')}
                    className="p-1 hover:bg-muted rounded text-xs transition-colors"
                    title="Fire"
                  >
                    🔥
                  </button>
                  <button
                    onClick={() => onToggleReaction(msg.id, '🎉')}
                    className="p-1 hover:bg-muted rounded text-xs transition-colors"
                    title="Party"
                  >
                    🎉
                  </button>

                  <Separator orientation="vertical" className="h-4 mx-0.5" />

                  {/* Reply to Message Button */}
                  {onReply && (
                    <button
                      onClick={() => onReply(msg)}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                      title="Balas Pesan (Reply)"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Pin/Unpin Message Button */}
                  <button
                    onClick={() => onTogglePin(msg.id)}
                    className={cn(
                      "p-1 rounded text-xs transition-colors",
                      msg.isPinned
                        ? "text-primary bg-primary/10 hover:bg-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={msg.isPinned ? "Lepas Sematan (Unpin)" : "Sematkan Pesan (Pin)"}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  {/* Start Thread from Message */}
                  <button
                    onClick={() => onStartThread(`Diskusi: ${msg.content.slice(0, 30)}`, msg.content)}
                    className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="Mulai Thread Baru"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  <Separator orientation="vertical" className="h-4 mx-0.5" />

                  {/* Delete Message button */}
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded transition-colors"
                    title="Hapus Pesan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
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
