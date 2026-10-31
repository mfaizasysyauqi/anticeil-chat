import React from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunityAvatar } from '@/chat/chat-avatar';

export interface YouTubeHostPopoverProps {
  isMeHost: boolean;
  currentUser: any;
  currentUserName: string;
  hostUserAvatar?: string | null;
  hostUserName: string;
  hostUserId: string;
  isHostMenuOpen: boolean;
  setIsHostMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  allowEveryoneEdit: boolean;
  handleToggleAllowEveryone: () => void;
  participants: any[];
  handleTransferHost: (participant: any) => void;
  handleClaimHost: () => void;
  align?: 'left' | 'right';
}

export function YouTubeHostPopover({
  isMeHost,
  currentUser,
  currentUserName,
  hostUserAvatar,
  hostUserName,
  hostUserId,
  isHostMenuOpen,
  setIsHostMenuOpen,
  allowEveryoneEdit,
  handleToggleAllowEveryone,
  participants,
  handleTransferHost,
  handleClaimHost,
  align = 'left',
}: YouTubeHostPopoverProps) {
  const displayAvatar = isMeHost
    ? currentUser?.imageUrl || currentUser?.avatar
    : hostUserAvatar;
  const displayName = isMeHost ? currentUserName : hostUserName;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsHostMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border hover:border-border/80 text-foreground text-xs font-medium cursor-pointer transition-all shadow-xs"
      >
        <div className="shrink-0 overflow-hidden rounded-full">
          <CommunityAvatar
            name={displayName}
            imageUrl={displayAvatar}
            size={20}
            showStatus={false}
          />
        </div>
        <span className="truncate max-w-[130px] sm:max-w-none">
          {isMeHost ? (
            <>
              You are <strong className="font-semibold text-primary">hosting</strong>
            </>
          ) : (
            <>
              <strong className="font-semibold text-primary">{displayName}</strong> is hosting
            </>
          )}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0',
            isHostMenuOpen && 'rotate-180',
          )}
        />
      </button>

      {isHostMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsHostMenuOpen(false)}
          />
          <div
            className={cn(
              'absolute top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-card border border-border shadow-2xl p-4 z-50 text-foreground animate-in fade-in zoom-in-95 duration-150',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {/* Permission Card */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-foreground font-medium leading-tight">
                  Allow everyone to edit the playlist and video state
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allowEveryoneEdit}
                disabled={!isMeHost}
                onClick={handleToggleAllowEveryone}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  allowEveryoneEdit ? 'bg-primary' : 'bg-muted-foreground/30',
                  !isMeHost && 'opacity-60 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                    allowEveryoneEdit ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </button>
            </div>

            {/* Select new host */}
            <div className="mt-3.5 mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Select new host:</span>
            </div>

            {/* Participants List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto [scrollbar-width:thin]">
              {/* Current User Row */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0 rounded-full overflow-hidden">
                    <CommunityAvatar
                      name={currentUserName}
                      imageUrl={currentUser?.imageUrl || currentUser?.avatar}
                      size={28}
                      showStatus={false}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">
                    {currentUserName} (You)
                  </span>
                </div>
                {isMeHost ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] tracking-wide shrink-0 shadow-xs">
                    HOST
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleClaimHost}
                    className="px-2.5 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-foreground text-xs font-medium cursor-pointer shrink-0 transition-colors"
                  >
                    Make Host
                  </button>
                )}
              </div>

              {/* Remote Participants */}
              {participants.map((p) => {
                const isRemoteHost = hostUserId === p.userId || hostUserId === p.socketId;
                return (
                  <div
                    key={p.socketId}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 rounded-full overflow-hidden">
                        <CommunityAvatar
                          name={p.userName}
                          imageUrl={p.userAvatar}
                          size={28}
                          showStatus={false}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground truncate">
                        {p.userName}
                      </span>
                    </div>
                    {isRemoteHost ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] tracking-wide shrink-0 shadow-xs">
                        HOST
                      </span>
                    ) : isMeHost ? (
                      <button
                        type="button"
                        onClick={() => handleTransferHost(p)}
                        className="px-2.5 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-foreground text-xs font-medium cursor-pointer shrink-0 transition-colors"
                      >
                        Make Host
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
