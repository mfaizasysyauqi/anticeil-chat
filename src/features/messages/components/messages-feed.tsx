import React from 'react';
import {
  Hash,
  Plus,
  Pin,
  MessageSquare,
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
import { CommunityAvatar } from '@/chat/messages-avatar';
import { RoleBadge } from '@/features/members';
import { renderFormattedMessage } from '../utils/format-message';
import type { CommunityChannel, CommunityMessage, CommunityRole } from '@/chat/messages-types';

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
  onStartThread: (initialName: string, initialContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
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
  onStartThread,
  onDeleteMessage,
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
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={cn(
                  "group relative flex gap-3 px-2 py-1.5 -mx-2 rounded-lg hover:bg-muted/40 transition-colors",
                  msg.isPinned && "border-l-2 border-primary bg-primary/5"
                )}
              >
                {/* Sender Avatar */}
                <CommunityAvatar
                  name={msg.senderName}
                  email={msg.senderEmail}
                  imageUrl={msg.senderAvatar}
                  size={38}
                  className="shrink-0 mt-0.5"
                />

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer">
                      {msg.senderName}
                    </span>
                    <RoleBadge role={msg.senderRole as CommunityRole} />
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

                  <div className="text-xs leading-relaxed text-foreground/90 break-words">
                    {renderFormattedMessage(msg.content)}
                  </div>

                  {/* Attachments rendering */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att, attIdx) => {
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
                                  onClick={() => {
                                    setClaimedGifts((prev) => ({ ...prev, [msg.id]: true }));
                                    confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
                                    toast.success('🎉 Hadiah Nitro berhasil diklaim ke akun Anda!');
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
            ))
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
