import React from 'react';
import { cn } from '@/lib/utils';

interface ChatDesktopSidebarProps {
  sidebarWidth: number;
  isResizingSidebar: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
  onResizeReset: () => void;
  renderDiscordHubRail: () => React.ReactNode;
  renderChannelsSidebarContent: () => React.ReactNode;
  renderUserBottomDock: () => React.ReactNode;
  t: (key: string) => string;
}

export function ChatDesktopSidebar({
  sidebarWidth,
  isResizingSidebar,
  onResizeStart,
  onResizeReset,
  renderDiscordHubRail,
  renderChannelsSidebarContent,
  renderUserBottomDock,
  t,
}: ChatDesktopSidebarProps) {
  return (
    <div
      className="hidden md:flex flex-col h-full shrink-0 border-r border-sidebar-border bg-sidebar select-none relative group/sidebar"
      style={{ width: `${56 + sidebarWidth}px` }}
    >
      {/* Top/Middle Area: Mini Rail on left + Channels Sidebar on right */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <div className="w-14 shrink-0 h-full flex flex-col">
          {renderDiscordHubRail()}
        </div>
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          {renderChannelsSidebarContent()}
        </div>
      </div>

      {/* Bottom Dock: Spans across the entire left area including Mini Rail */}
      {renderUserBottomDock()}

      {/* Discord-Style Resize Handle on Right Border */}
      <div
        role="separator"
        aria-orientation="vertical"
        title={t('Tarik untuk mengubah ukuran sidebar (Double-klik untuk reset)')}
        onMouseDown={onResizeStart}
        onDoubleClick={onResizeReset}
        className={cn(
          'absolute top-0 right-[-3px] w-[6px] h-full cursor-col-resize z-30 transition-colors select-none',
          isResizingSidebar ? 'bg-primary/80' : 'hover:bg-primary/50 bg-transparent',
        )}
      />
    </div>
  );
}
