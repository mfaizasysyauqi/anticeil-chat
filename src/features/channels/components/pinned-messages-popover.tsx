import React from 'react';
import { Pin, X, CornerDownRight, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ColonyMessage } from '@/chat/chat-types';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface PinnedMessagesPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pinnedMessages: ColonyMessage[];
  onJumpToMessage: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function PinnedMessagesPopover({
  isOpen,
  onOpenChange,
  pinnedMessages,
  onJumpToMessage,
  onTogglePin,
}: PinnedMessagesPopoverProps) {
  const { t } = useTranslation();

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 transition-colors cursor-pointer relative',
            pinnedMessages.length > 0
              ? 'text-sidebar-primary font-semibold'
              : isOpen
                ? 'text-foreground bg-accent'
                : 'text-foreground/70 hover:text-foreground hover:bg-accent/60',
          )}
          title={t('Pesan Tersemat')}
        >
          <Pin className="w-4 h-4" />
          {pinnedMessages.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sidebar-primary ring-1 ring-card animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[420px] max-w-[95vw] max-h-[520px] p-0 bg-card border border-border/80 text-foreground shadow-2xl rounded-2xl select-none z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-border/50 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
              <Pin className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-foreground text-xs">{t('Pesan Tersemat')}</span>
          </div>
          {pinnedMessages.length > 0 && (
            <span className="text-[10px] bg-sidebar-primary/10 text-sidebar-primary font-bold px-2 py-0.5 rounded-full border border-sidebar-primary/20">
              {pinnedMessages.length} {t('tersemat')}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] flex flex-col">
          {pinnedMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="relative w-20 h-20 rounded-2xl bg-secondary/50 border border-border/60 flex items-center justify-center shadow-inner">
                <Pin className="w-8 h-8 text-muted-foreground/40 rotate-12" />
              </div>

              <div className="space-y-1 max-w-xs">
                <p className="text-xs font-bold text-foreground">
                  {t('Belum ada pesan yang disematkan')}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('Sematkan pesan penting agar mudah ditemukan oleh semua anggota saluran ini.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2.5">
              {pinnedMessages.map((pMsg) => (
                <div
                  key={pMsg.id}
                  className="p-3 rounded-xl bg-secondary/40 border border-border/60 hover:border-sidebar-primary/40 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CommunityAvatar name={pMsg.senderName} imageUrl={pMsg.senderAvatar} size={24} />
                      <span className="text-xs font-bold text-foreground truncate">{pMsg.senderName}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {dayjs(pMsg.pinnedAt || pMsg.createdAt).fromNow()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        size="sm"
                        variant="teal"
                        onClick={() => {
                          onJumpToMessage(pMsg.id);
                          onOpenChange(false);
                        }}
                        className="h-6 px-2.5 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>{t('Lompat')}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onTogglePin(pMsg.id)}
                        className="h-6 w-6 p-0 hover:bg-destructive/15 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                        title={t('Lepas Sematan (Unpin)')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed whitespace-pre-wrap bg-background/40 p-2 rounded-lg border border-border/40">
                    {pMsg.content}
                  </p>

                  {pMsg.pinnedBy && (
                    <div className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                      <span>{t('Disematkan oleh')}</span>
                      <span className="font-semibold text-foreground">{pMsg.pinnedBy}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Protip Box at bottom */}
          <div className="p-3 bg-secondary/20 border-t border-border/50 mt-auto flex items-center gap-2 text-[11px] text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-sidebar-primary shrink-0" />
            <span>
              {t('Tips: Anggota dengan izin moderasi dapat menyematkan pesan langsung dari menu aksi.')}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
