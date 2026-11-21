import React, { useState, useEffect, useMemo } from 'react';
import {
  Pin,
  MessageSquare,
  Reply,
  Trash2,
  Paperclip,
  Check,
  ExternalLink,
  Layers,
  Palette,
  Crown,
  ScreenShare,
  Sparkles,
  Gamepad2,
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
import { renderFormattedMessage, DecryptedMessageText } from '../../utils/format-message';
import { VoiceNotePlayer } from './voice-note-player';
import { DiscordPollCard } from './discord-poll-card';
import { colonyApi } from '@/chat/chat-api';
import type { ColonyChannel, ColonyMessage, ColonyRole, DiscordPollData } from '@/chat/chat-types';

export interface MessageItemProps {
  msg: ColonyMessage;
  currentUser: any;
  activeChannel: ColonyChannel | null;
  claimedGifts: Record<string, boolean>;
  setClaimedGifts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onReply?: (message: ColonyMessage) => void;
  onStartThread: (initialName: string, initialContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onJoinActivity?: (appId: string, channelId?: string) => void;
  onJumpToMessage?: (messageId: string) => void;
  activeActivityAppId?: string | null;
  activeCallChannelId?: string | null;
  t: (key: string) => string;
}

interface AppVisualInfo {
  name: string;
  bg: string;
  gradient: string;
  type: 'youtube' | 'tradingview' | 'whiteboard' | 'chess' | 'screenshare' | 'platform' | 'wordle' | 'default';
}

function getAppVisualInfo(appId?: string): AppVisualInfo {
  const id = appId?.toLowerCase() || '';
  if (id === 'watch-together' || id === 'youtube' || id.includes('youtube')) {
    return {
      name: 'Watch Together',
      bg: 'bg-[#ff0000]',
      gradient: 'from-[#4d1014] via-[#330c0f] to-[#1f0709] border-red-500/30',
      type: 'youtube',
    };
  }
  if (id === 'tradingview' || id.includes('trading') || id.includes('chart')) {
    return {
      name: 'TradingView Charts',
      bg: 'bg-[#131722]',
      gradient: 'from-[#131722] via-[#0d1017] to-[#080a0f] border-blue-500/30',
      type: 'tradingview',
    };
  }
  if (id === 'whiteboard' || id.includes('jamspace') || id.includes('whiteboard')) {
    return {
      name: 'Jamspace Whiteboard',
      bg: 'bg-[#2563eb]',
      gradient: 'from-[#1e3a8a] via-[#172554] to-[#0f172a] border-blue-500/30',
      type: 'whiteboard',
    };
  }
  if (id === 'chess' || id.includes('chess')) {
    return {
      name: 'Anticeil Chess',
      bg: 'bg-[#b45309]',
      gradient: 'from-[#451a03] via-[#291002] to-[#120701] border-amber-500/30',
      type: 'chess',
    };
  }
  if (id === 'screenshare' || id.includes('screen')) {
    return {
      name: 'Share Screen',
      bg: 'bg-[#7c3aed]',
      gradient: 'from-[#4c1d95] via-[#2e1065] to-[#170733] border-purple-500/30',
      type: 'screenshare',
    };
  }
  if (id === 'platform' || id.includes('platform') || id.includes('anticeil')) {
    return {
      name: 'Anticeil Platform',
      bg: 'bg-blue-600',
      gradient: 'from-blue-600 via-indigo-800 to-zinc-950 border-blue-500/30',
      type: 'platform',
    };
  }
  if (id === 'wordle') {
    return {
      name: 'Wordle',
      bg: 'bg-[#123824]',
      gradient: 'from-[#123824] via-[#0c2417] to-[#08180e] border-emerald-500/30',
      type: 'wordle',
    };
  }
  return {
    name: 'App Activity',
    bg: 'bg-primary',
    gradient: 'from-[#2b2d31] via-[#1e1f22] to-[#111214] border-border/80',
    type: 'default',
  };
}

function renderAppIcon(type: AppVisualInfo['type'], size: 'xs' | 'sm' | 'md' | 'lg' = 'md') {
  if (type === 'youtube') {
    const svgClass = size === 'xs' ? 'w-2.5 h-2' : size === 'sm' ? 'w-4 h-3' : size === 'lg' ? 'w-8 h-6' : 'w-5 h-4';
    return (
      <svg className={cn(svgClass, 'fill-white')} viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (type === 'tradingview') {
    const svgClass = size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return (
      <svg className={cn(svgClass, 'text-white fill-current')} viewBox="0 0 24 24">
        <path d="M15.865 8.279a2.452 2.452 0 1 1-4.904 0a2.452 2.452 0 0 1 4.904 0M9.75 6H0v4.904h4.846v7.269H9.75Zm8.596 0H24l-5.106 12.173H13.24z" />
      </svg>
    );
  }
  if (type === 'whiteboard') {
    const iconClass = size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return <Palette className={cn(iconClass, 'text-white')} />;
  }
  if (type === 'chess') {
    const iconClass = size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return <Crown className={cn(iconClass, 'text-white')} />;
  }
  if (type === 'screenshare') {
    const iconClass = size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return <ScreenShare className={cn(iconClass, 'text-white')} />;
  }
  if (type === 'platform') {
    const iconClass = size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return <Sparkles className={cn(iconClass, 'text-white')} />;
  }
  if (type === 'wordle') {
    if (size === 'xs') {
      return (
        <div className="w-2.5 h-2.5 grid grid-cols-2 gap-0.5 p-0.5 bg-black rounded-[2px]">
          <div className="bg-[#538d4e]" />
          <div className="bg-[#b59f3b]" />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 grid grid-cols-3 gap-0.5 p-0.5 bg-black rounded-[3px]">
        <div className="bg-[#538d4e] rounded-[0.5px]" />
        <div className="bg-[#538d4e] rounded-[0.5px]" />
        <div className="bg-[#538d4e] rounded-[0.5px]" />
        <div className="bg-[#b59f3b] rounded-[0.5px]" />
        <div className="bg-[#3a3a3c] rounded-[0.5px]" />
        <div className="bg-[#538d4e] rounded-[0.5px]" />
      </div>
    );
  }
  const defaultClass = size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return <Gamepad2 className={cn(defaultClass, 'text-white')} />;
}

export function MessageItem({
  msg,
  currentUser,
  activeChannel,
  claimedGifts,
  setClaimedGifts,
  onToggleReaction,
  onTogglePin,
  onReply,
  onStartThread,
  onDeleteMessage,
  onJoinActivity,
  onJumpToMessage,
  activeActivityAppId,
  activeCallChannelId,
  t,
}: MessageItemProps) {
  const activityAtt = msg.attachments?.find((a) => a.type === 'activity');
  const act = activityAtt?.activityData;
  const actInfo = useMemo(() => (act ? getAppVisualInfo(act.appId) : null), [act]);

  // Detect Discord poll data or parse legacy poll text
  const pollData = useMemo<DiscordPollData | null>(() => {
    if (msg.poll) return msg.poll;
    const pollAtt = msg.attachments?.find((a) => a.type === 'poll' && a.pollData);
    if (pollAtt?.pollData) return pollAtt.pollData;

    // Backward-compatibility: parse legacy text polls (📊 **POLL: Question**)
    if (msg.content && msg.content.includes('POLL:')) {
      const lines = msg.content.split('\n').map((l) => l.trim()).filter(Boolean);
      const qLine = lines.find((l) => l.includes('POLL:'));
      if (qLine) {
        const qMatch = qLine.match(/📊?\s*\*\*?POLL:\s*(.*?)\*\*?/i);
        const question = qMatch ? qMatch[1].trim() : 'Jajak Pendapat';
        const answerLines = lines.filter((l) => /^[0-9️⃣🔟▫️]+\s+/.test(l));
        if (answerLines.length >= 2) {
          const answers = answerLines.map((l, i) => {
            const clean = l.replace(/^[0-9️⃣🔟▫️]+\s+/, '').trim();
            return { id: i + 1, text: clean, votes: [] };
          });
          return {
            question,
            answers,
            allowMultiselect: false,
            durationHours: 24,
          };
        }
      }
    }
    return null;
  }, [msg.poll, msg.attachments, msg.content]);

  const [currentPoll, setCurrentPoll] = useState<DiscordPollData | null>(pollData);

  useEffect(() => {
    setCurrentPoll(pollData);
  }, [pollData]);

  return (
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
                        {msg.replyTo.content ? (
                          <DecryptedMessageText content={msg.replyTo.content} channelId={msg.channelId} />
                        ) : (
                          '[Lampiran]'
                        )}
                      </span>
                    </div>
                  )}

                  {/* Discord Command Header / Interaction spine with Click to see command */}
                  {act && actInfo && (
                    <div
                      onClick={() => onJumpToMessage?.(msg.id)}
                      className="group/cmd flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 select-none pl-6 relative cursor-pointer hover:text-foreground transition-colors"
                      title="Klik untuk melihat pesan command"
                    >
                      {/* Curved spine connector line */}
                      <div className="absolute left-2.5 top-2 w-3.5 h-3 rounded-tl-md border-t-2 border-l-2 border-border/80 pointer-events-none group-hover/cmd:border-foreground/60 transition-colors" />
                      {/* App icon badge */}
                      <div className={cn('w-4 h-4 rounded-md flex items-center justify-center shrink-0 shadow-2xs overflow-hidden text-white', actInfo.bg)}>
                        {renderAppIcon(actInfo.type, 'xs')}
                      </div>
                      <span className="bg-primary text-white text-[9px] font-bold px-1 py-0.2 rounded-[3px] flex items-center gap-0.5 leading-none shadow-2xs">
                        <Check className="w-2 h-2 stroke-[3]" />
                        <span>APP</span>
                      </span>
                      <span className="font-semibold text-foreground/90 group-hover/cmd:underline">
                        {act.name}
                      </span>
                      <span className="font-semibold text-primary group-hover/cmd:underline flex items-center gap-1">
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
                    {act && actInfo ? (
                      <div
                        className={cn(
                          'w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-md text-white border border-white/10 overflow-hidden',
                          actInfo.bg,
                        )}
                        title={act.name}
                      >
                        {renderAppIcon(actInfo.type, 'md')}
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
                          <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] flex items-center gap-0.5 leading-none shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>APP</span>
                          </span>
                        ) : (
                          <RoleBadge role={msg.senderRole as ColonyRole} />
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

                      {msg.content && (!currentPoll || !msg.content.includes('POLL:')) ? (
                        <div className="text-xs leading-relaxed text-foreground/90 break-words">
                          <DecryptedMessageText content={msg.content} channelId={msg.channelId} />
                        </div>
                      ) : null}

                      {/* Discord Interactive Poll Card */}
                      {currentPoll && (
                        <DiscordPollCard
                          messageId={msg.id}
                          channelId={msg.channelId}
                          poll={currentPoll}
                          currentUser={currentUser}
                          onUpdatePoll={(updated) => setCurrentPoll(updated)}
                          t={t}
                        />
                      )}

                      {/* Attachments rendering */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att, attIdx) => {
                            if (att.type === 'poll') return null;
                            if (att.type === 'activity' && att.activityData) {
                              const itemAct = att.activityData;
                              const itemActInfo = getAppVisualInfo(itemAct.appId);
                              const gradientClass = itemActInfo.gradient;

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

                              const isAlreadyPlaying = isActivityCurrentlyActive;

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
                                    {/* App Icon in White/Brand Rounded Square */}
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
                                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-xs', itemActInfo.bg)}>
                                        {renderAppIcon(itemActInfo.type, 'md')}
                                      </div>
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
                              const isRoyalGift = att.giftData?.tier === 'royal';
                              return (
                                <div key={attIdx} className={cn(
                                  "my-2 max-w-sm rounded-2xl shadow-2xl p-4 relative overflow-hidden border",
                                  isRoyalGift
                                    ? "border-amber-500/50 bg-gradient-to-b from-[#2a1705] to-[#120a02]"
                                    : "border-primary/40 bg-gradient-to-b from-[#202225] to-[#18191c]"
                                )}>
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg text-2xl shrink-0",
                                      isRoyalGift
                                        ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-black"
                                        : "bg-gradient-to-tr from-[#5865f2] to-[#eb459e]"
                                    )}>
                                      {isRoyalGift ? '👑' : '🎁'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className={cn(
                                        "text-[10px] font-black tracking-wider uppercase block",
                                        isRoyalGift ? "text-amber-400" : "text-[#eb459e]"
                                      )}>
                                        {isRoyalGift ? 'ROYAL ENTERPRISE GIFT!' : 'A WILD GIFT APPEARS!'}
                                      </span>
                                      <h4 className="text-xs font-black text-white italic tracking-wide">
                                        {att.name || (isRoyalGift ? 'Anticeil Royal Enterprise Gift' : 'Anticeil Nectar Gift')}
                                      </h4>
                                      <p className="text-[10px] text-[#949ba4] truncate">
                                        {att.giftData?.price || (isRoyalGift ? 'IDR 499,000' : 'IDR 142,714')} • Hadiah Komunitas
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
                                        toast.success(`🎉 Hadiah ${isRoyalGift ? 'Royal Enterprise 👑' : 'Nectar / Pollen'} berhasil diklaim ke akun Anda!`);
                                        await colonyApi.claimGift(msg.id, currentUser?.firstName || currentUser?.name || 'User');
                                      }}
                                      className={cn(
                                        "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer",
                                        isClaimed
                                          ? "bg-white/10 text-[#949ba4] cursor-not-allowed"
                                          : isRoyalGift
                                          ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black"
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
                            if (att.type === 'audio' || att.type === 'voice-note') {
                              return (
                                <VoiceNotePlayer
                                  key={attIdx}
                                  url={att.url}
                                  name={att.name}
                                  duration={att.duration}
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
  );
}
