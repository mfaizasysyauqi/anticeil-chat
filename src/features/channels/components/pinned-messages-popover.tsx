import React from 'react';
import { Pin, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/messages-avatar';
import { CommunityMessage } from '@/chat/messages-types';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface PinnedMessagesPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pinnedMessages: CommunityMessage[];
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
              ? 'text-primary'
              : isOpen
                ? 'text-white bg-white/10'
                : 'text-[#b5bac1] hover:text-[#dbdee1] hover:bg-white/5',
          )}
          title="Pinned Messages"
        >
          <Pin className="w-5 h-5" />
          {pinnedMessages.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary text-primary-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[420px] max-w-[95vw] max-h-[500px] p-0 bg-[#111214] border border-[#2b2d31] text-[#dbdee1] shadow-2xl rounded-2xl select-none z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center gap-2 bg-[#18191c]">
          <Pin className="w-4 h-4 text-white" />
          <span className="font-bold text-white text-sm">Pinned Messages</span>
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

              <p className="text-sm font-semibold text-[#dbdee1] max-w-xs leading-snug mb-6">
                This channel doesn&apos;t have any pinned messages... yet.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2.5">
              {pinnedMessages.map((pMsg) => (
                <div
                  key={pMsg.id}
                  className="p-3 rounded-xl bg-[#1e1f22] border border-white/5 hover:border-white/15 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CommunityAvatar name={pMsg.senderName} imageUrl={pMsg.senderAvatar} size={24} />
                      <span className="text-xs font-bold text-white truncate">{pMsg.senderName}</span>
                      <span className="text-[10px] text-[#949ba4] shrink-0">
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
                        className="p-1 hover:bg-red-500/20 text-[#949ba4] hover:text-red-400 rounded transition-colors cursor-pointer"
                        title="Unpin message"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#dbdee1] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {pMsg.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Protip Box at bottom */}
          <div className="p-3.5 bg-[#18191c] border-t border-white/5 mt-auto">
            <span className="text-xs font-bold text-emerald-400 block mb-0.5">
              Protip:
            </span>
            <p className="text-[11px] text-[#949ba4] leading-normal">
              Users with the &apos;Pin Messages&apos; permission can pin a message from its context menu.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
