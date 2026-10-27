import React from 'react';
import { Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export interface ChannelThreadItem {
  id: string;
  name: string;
  creatorName: string;
  lastMessageAt: string | Date;
  messageCount?: number;
}

export interface ThreadsPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelThreads: ChannelThreadItem[];
  threadSearchQuery: string;
  setThreadSearchQuery: (query: string) => void;
  onOpenCreateThreadModal: () => void;
  onSelectThread: (thread: ChannelThreadItem) => void;
}

export function ThreadsPopover({
  open,
  onOpenChange,
  channelThreads,
  threadSearchQuery,
  setThreadSearchQuery,
  onOpenCreateThreadModal,
  onSelectThread,
}: ThreadsPopoverProps) {
  const filteredThreads = channelThreads.filter((t) =>
    !threadSearchQuery || t.name.toLowerCase().includes(threadSearchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 transition-colors cursor-pointer",
            open ? "text-foreground bg-accent" : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
          )}
          title="Threads"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M5.5 4a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 18.5 4h-13zm2 3h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h5a1 1 0 1 1 0 2h-5a1 1 0 1 1 0-2z" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[440px] max-w-[95vw] h-[480px] p-0 bg-popover border border-border text-popover-foreground shadow-2xl rounded-2xl select-none z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-border/40 flex items-center gap-2.5 bg-muted/30">
          <div className="flex items-center gap-2 shrink-0">
            <svg className="w-5 h-5 text-foreground fill-current" viewBox="0 0 24 24">
              <path d="M5.5 4a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 18.5 4h-13zm2 3h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h5a1 1 0 1 1 0 2h-5a1 1 0 1 1 0-2z" />
            </svg>
            <span className="font-bold text-foreground text-sm">Threads</span>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#949ba4] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={threadSearchQuery}
              onChange={(e) => setThreadSearchQuery(e.target.value)}
              placeholder="Search for Thread Name"
              className="w-full bg-[#1e1f22] border border-[#35373c] focus:border-primary rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-[#949ba4] focus:outline-none transition-colors"
            />
          </div>

          {/* Create Thread button */}
          <button
            type="button"
            onClick={onOpenCreateThreadModal}
            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            Create
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col overflow-y-auto [scrollbar-width:thin]">
          {filteredThreads.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="relative w-44 h-32 mb-4 flex items-center justify-center">
                <div className="absolute left-3 top-3 w-16 h-16 rounded-full bg-gradient-to-br from-[#5865f2] to-[#404eed] border-2 border-[#7983f5] shadow-lg flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-cyan-300 flex items-center justify-center">
                    <span className="text-cyan-200 text-xs font-bold">~</span>
                  </div>
                </div>
                <div className="absolute right-4 top-2 w-16 h-16 rounded-full bg-gradient-to-br from-[#7983f5] to-[#5865f2] border-2 border-cyan-400 shadow-lg flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-cyan-300 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">~</span>
                  </div>
                </div>
                <div className="absolute bottom-1 w-20 h-16 rounded-3xl bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] border-2 border-pink-400 shadow-xl flex items-center justify-center z-10">
                  <div className="w-10 h-7 rounded-2xl border-2 border-cyan-300 flex items-center justify-center">
                    <span className="text-cyan-200 text-sm font-bold">🧵</span>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-black text-white mb-2">There are no threads.</h3>
              <p className="text-xs text-[#949ba4] max-w-xs mb-6 leading-relaxed">
                Stay focused on a conversation with a thread - a temporary text channel.
              </p>

              <button
                type="button"
                onClick={onOpenCreateThreadModal}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                Create Thread
              </button>
            </div>
          ) : (
            /* Thread List */
            <div className="p-3 space-y-1.5">
              {filteredThreads.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    onSelectThread(th);
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1e1f22]/70 hover:bg-[#2b2d31] border border-white/5 hover:border-white/10 transition-all text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M5.5 4a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 18.5 4h-13zm2 3h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h9a1 1 0 1 1 0 2h-9a1 1 0 1 1 0-2zm0 4h5a1 1 0 1 1 0 2h-5a1 1 0 1 1 0-2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                        {th.name}
                      </span>
                      <span className="text-[10px] text-[#949ba4] shrink-0 font-mono">
                        {dayjs(th.lastMessageAt).fromNow()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#949ba4]">
                      <span>Oleh {th.creatorName}</span>
                      <span>•</span>
                      <span className="bg-white/10 px-1.5 py-0.2 rounded-full font-mono text-[9px]">
                        {th.messageCount || 1} pesan
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
