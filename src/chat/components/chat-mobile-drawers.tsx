import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LAYOUT_SIZES } from '@/core';

interface ChatMobileDrawersProps {
  isMobileChannelsOpen: boolean;
  setIsMobileChannelsOpen: (open: boolean) => void;
  isMobileMembersOpen: boolean;
  setIsMobileMembersOpen: (open: boolean) => void;
  renderDiscordHubRail: () => React.ReactNode;
  renderChannelsSidebarContent: (onItemClick?: () => void) => React.ReactNode;
  renderMembersSidebarContent: () => React.ReactNode;
  renderUserBottomDock: () => React.ReactNode;
  t: (key: string) => string;
}

export function ChatMobileDrawers({
  isMobileChannelsOpen,
  setIsMobileChannelsOpen,
  isMobileMembersOpen,
  setIsMobileMembersOpen,
  renderDiscordHubRail,
  renderChannelsSidebarContent,
  renderMembersSidebarContent,
  renderUserBottomDock,
  t,
}: ChatMobileDrawersProps) {
  return (
    <>
      {/* MOBILE & TABLET CHANNELS DRAWER */}
      <Sheet open={isMobileChannelsOpen} onOpenChange={setIsMobileChannelsOpen}>
        <SheetContent
          side="left"
          hideCloseButton
          className={cn(
            'p-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border',
            LAYOUT_SIZES.DRAWER_WIDTH,
          )}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t('Navigasi Channel & Hub')}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 min-h-0 w-full overflow-hidden">
            <div className="w-14 shrink-0 h-full flex flex-col">
              {renderDiscordHubRail()}
            </div>
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
              {renderChannelsSidebarContent(() => setIsMobileChannelsOpen(false))}
            </div>
          </div>
          {/* Bottom Dock: Spans full drawer width including Mini Rail */}
          {renderUserBottomDock()}
        </SheetContent>
      </Sheet>

      {/* MOBILE MEMBERS DRAWER (Server Context) */}
      <Sheet open={isMobileMembersOpen} onOpenChange={setIsMobileMembersOpen}>
        <SheetContent
          side="right"
          hideCloseButton
          className={cn(
            'p-0 bg-sidebar border-l border-sidebar-border',
            LAYOUT_SIZES.MEMBERS_DRAWER_WIDTH,
          )}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t('Anggota Colony')}</SheetTitle>
          </SheetHeader>
          {renderMembersSidebarContent()}
        </SheetContent>
      </Sheet>
    </>
  );
}
