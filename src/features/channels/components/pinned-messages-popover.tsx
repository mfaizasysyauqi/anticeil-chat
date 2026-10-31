import React from 'react';
import { Pin, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ColonyMessage } from '@/chat/chat-types';
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
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 transition-colors cursor-pointer relative',
            pinnedMessages.length > 0
              ? 'text-foreground font-semibold'
              : isOpen
                ? 'text-foreground bg-accent'
                : 'text-foreground/70 hover:text-foreground hover:bg-accent/60',
          )}
          title="Pinned Messages"
        >
          <Pin className="w-5 h-5" />
          {pinnedMessages.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-card" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[420px] max-w-[95vw] max-h-[500px] p-0 bg-background border border-border text-foreground shadow-2xl rounded-2xl select-none z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-border/40 flex items-center gap-2 bg-muted/30">
          <Pin className="w-4 h-4 text-foreground" />
          <span className="font-bold text-foreground text-sm">Pinned Messages</span>
          {pinnedMessages.length > 0 && (
            <span className="ml-auto text-[10px] text-[#949ba4] font-mono">
              {pinnedMessages.length} tersemat
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] flex flex-col">
          {pinnedMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-[#35373c] border-2 border-[#404249] flex items-center justify-center relative shadow-inner">
                  <div className="flex items-center gap-5 -mt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1e1f22]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1e1f22]" />
                  </div>
                  <div className="absolute bottom-5 w-6 h-2.5 border-t-2 border-[#1e1f22] rounded-t-full" />
                  <div className="absolute -top-3.5 -right-1 rotate-45 text-2xl filter drop-shadow">
                    📌
                  </div>
                </div>
              </div>

              <p className="text-sm font-semibold text-foreground max-w-xs leading-snug mb-6">
                This channel doesn&apos;t have any pinned messages... yet.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2.5">
              {pinnedMessages.map((pMsg) => (
                <div
                  key={pMsg.id}
                  className="p-3 rounded-xl bg-card border border-border hover:border-border/80 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CommunityAvatar name={pMsg.senderName} imageUrl={pMsg.senderAvatar} size={24} />
                      <span className="text-xs font-bold text-foreground truncate">{pMsg.senderName}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {dayjs(pMsg.pinnedAt || pMsg.createdAt).fromNow()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onJumpToMessage(pMsg.id)}
                        className="px-2 py-0.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[10px] rounded transition-colors cursor-pointer"
                      >
                        Jump
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePin(pMsg.id)}
                        className="p-1 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded transition-colors cursor-pointer"
                        title="Unpin message"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {pMsg.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Protip Box at bottom */}
          <div className="p-3.5 bg-card/60 border-t border-border mt-auto">
            <span className="text-xs font-bold text-emerald-500 block mb-0.5">
              Protip:
            </span>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Users with the &apos;Pin Messages&apos; permission can pin a message from its context menu.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
