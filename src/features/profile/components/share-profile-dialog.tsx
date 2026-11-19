import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Send,
  Check,
  Hash,
  Smile,
  Paperclip,
  Loader2,
  X,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { messagesApi } from '@/features/chat/api/messages-api';
import { friendsApi } from '@/features/friends/api/friends-api';
import { loadStoredChannels, loadStoredDmChannels, loadStoredColonies } from '@/chat/chat-defaults';
import type { ColonyChannel, Colony } from '@/chat/chat-types';
import type { FriendMember } from '@/features/friends/types';

export interface ShareDestinationItem {
  id: string; // channelId
  name: string;
  subtitle: string;
  type: 'channel' | 'dm';
  avatar?: string | null;
  colonyName?: string;
}

export interface ShareProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileUser: {
    id?: string;
    name: string;
    username?: string | null;
    avatar?: string | null;
  };
}

export function ShareProfileDialog({
  open,
  onOpenChange,
  profileUser,
}: ShareProfileDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [optionalMessage, setOptionalMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [destinations, setDestinations] = useState<ShareDestinationItem[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setOptionalMessage('');
      setSearchQuery('');
      return;
    }

    const loadDestinations = async () => {
      const items: ShareDestinationItem[] = [];
      const colonies = loadStoredColonies();
      const coloniesMap = new Map<string, Colony>();
      colonies.forEach((c) => coloniesMap.set(c.id, c));

      // 1. Text channels from colonies
      const channels = loadStoredChannels();
      channels
        .filter((ch) => ch.type === 'text' || !ch.type)
        .forEach((ch) => {
          const col = ch.colonyId ? coloniesMap.get(ch.colonyId) : null;
          items.push({
            id: ch.id,
            name: ch.name,
            subtitle: col ? col.name : t('Saluran Obrolan'),
            type: 'channel',
            colonyName: col?.name,
          });
        });

      // 2. DM Channels and Friends
      const dmChannels = loadStoredDmChannels();
      dmChannels.forEach((dm) => {
        items.push({
          id: dm.id,
          name: dm.name,
          subtitle: `@${dm.name.toLowerCase().replace(/\s+/g, '_')}`,
          type: 'dm',
          avatar: dm.dmIcon || (dm as any).avatar || null,
        });
      });

      // 3. Additional Friends list if not in DM yet
      try {
        const liveFriends = await friendsApi.getFriends();
        if (Array.isArray(liveFriends)) {
          liveFriends.forEach((f: FriendMember) => {
            const alreadyInDm = items.some(
              (it) => it.id === f.id || it.name.toLowerCase() === f.name.toLowerCase()
            );
            if (!alreadyInDm) {
              items.push({
                id: f.id,
                name: f.name,
                subtitle: f.username ? `@${f.username}` : (f.email ? f.email.split('@')[0] : t('Teman')),
                type: 'dm',
                avatar: f.avatar || null,
              });
            }
          });
        }
      } catch {}

      setDestinations(items);
    };

    loadDestinations();
  }, [open, t]);

  const filteredDestinations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return destinations;
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q) ||
        (d.colonyName && d.colonyName.toLowerCase().includes(q))
    );
  }, [destinations, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0 || isSending) return;
    setIsSending(true);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dev-chat.anticeil.com';
      const profileLink = `${origin}/users/${profileUser.id || 'me'}`;
      const headerText = `🔗 **Profil ${profileUser.name}**${profileUser.username ? ` (@${profileUser.username})` : ''}`;
      const finalContent = optionalMessage.trim()
        ? `${optionalMessage.trim()}\n\n${headerText}\n${profileLink}`
        : `${headerText}\n${profileLink}`;

      const targetChannelIds = Array.from(selectedIds);

      // Fullstack message sending to each selected destination
      const sendPromises = targetChannelIds.map((channelId) =>
        messagesApi.sendMessage(channelId, {
          content: finalContent,
          senderName: profileUser.name,
          senderAvatar: profileUser.avatar,
        })
      );

      await Promise.allSettled(sendPromises);

      // Trigger chat update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('anticeil_chat_messages_changed'));
      }

      toast.success(
        t('Profil berhasil dibagikan ke {{count}} percakapan! 🎉', {
          count: targetChannelIds.length,
        })
      );
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to share profile', err);
      toast.error(t('Gagal membagikan profil'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[92vw] sm:w-[460px] p-0 gap-0 overflow-hidden rounded-2xl bg-[#111214] border border-border/80 shadow-2xl z-[120]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="p-4 pb-3 flex items-start justify-between border-b border-border/50">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              {t('Bagikan Profil')}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('Pilih ke mana Anda ingin membagikan pesan ini.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2.5 border-b border-border/40 bg-muted/10">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Cari')}
              className="h-8 pl-8 text-xs bg-[#1e1f22] border-transparent focus-visible:ring-1 focus-visible:ring-sidebar-primary rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Scrollable Destination List */}
        <div className="max-h-[300px] min-h-[180px] overflow-y-auto [scrollbar-width:thin] p-2 space-y-1">
          {filteredDestinations.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>{t('Tidak ada saluran atau obrolan ditemukan.')}</span>
            </div>
          ) : (
            filteredDestinations.map((dest) => {
              const isSelected = selectedIds.has(dest.id);
              return (
                <div
                  key={dest.id}
                  onClick={() => toggleSelect(dest.id)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors select-none group',
                    isSelected ? 'bg-sidebar-primary/15' : 'hover:bg-[#232428]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {dest.type === 'channel' ? (
                      <div className="size-8 rounded-lg bg-secondary/80 border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground">
                        <Hash className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="size-8 rounded-full bg-secondary border border-border/60 flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-foreground">
                        {dest.avatar ? (
                          <img
                            src={dest.avatar}
                            alt={dest.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          dest.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {dest.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {dest.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Custom Square Checkbox (1:1 Discord) */}
                  <div
                    className={cn(
                      'size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'bg-sidebar-primary border-sidebar-primary text-white shadow-xs'
                        : 'border-border/80 bg-background/50 group-hover:border-foreground/40'
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar: Message input + Send button (1:1 Discord) */}
        <div className="p-3 bg-[#1e1f22] border-t border-border/50 flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={optionalMessage}
              onChange={(e) => setOptionalMessage(e.target.value)}
              placeholder={t('Tambahkan pesan opsional...')}
              className="h-9 pr-16 text-xs bg-[#2b2d31] border-transparent focus-visible:ring-1 focus-visible:ring-sidebar-primary rounded-xl text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
              <button
                type="button"
                onClick={() => setOptionalMessage((prev) => `${prev} ✨`)}
                className="p-1 hover:text-foreground cursor-pointer rounded transition-colors"
                title="Tambahkan emoji"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/users/${profileUser.id || 'me'}` : '';
                  setOptionalMessage((prev) => `${prev} ${url}`.trim());
                }}
                className="p-1 hover:text-foreground cursor-pointer rounded transition-colors"
                title="Sematkan tautan profil"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="teal"
            disabled={selectedIds.size === 0 || isSending}
            onClick={handleSend}
            className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>{t('Kirim')}</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
