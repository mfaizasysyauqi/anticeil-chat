import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatDesktopSidebar } from './chat-desktop-sidebar';
import { ChatMobileDrawers } from './chat-mobile-drawers';
import { ChatContentContainer, type ChatContentContainerProps } from './chat-content-container';
import { ChatModalsCoordinator, type ChatModalsCoordinatorProps } from './chat-modals-coordinator';
import { AppTopTitleBar } from './app-top-title-bar';
import {
  ColonyRailWrapper,
  type ColonyRailWrapperProps,
  ChannelsSidebarWrapper,
  type ChannelsSidebarWrapperProps,
  UserBottomDockWrapper,
  type UserBottomDockWrapperProps,
  FriendsMainPageWrapper,
  type FriendsMainPageWrapperProps,
  MembersSidebarContentWrapper,
  type MembersSidebarContentWrapperProps,
} from './chat-sidebar-views';

export interface ChatPageContentProps {
  sidebarWidth: number;
  isResizingSidebar: boolean;
  handleSidebarResizeStart: (e: React.MouseEvent) => void;
  handleSidebarResizeReset: () => void;
  isMobileChannelsOpen: boolean;
  setIsMobileChannelsOpen: (open: boolean) => void;
  isMobileMembersOpen: boolean;
  setIsMobileMembersOpen: (open: boolean) => void;
  isDesktopSidebarCollapsed?: boolean;
  toggleDesktopSidebarCollapsed?: () => void;

  railProps: ColonyRailWrapperProps;
  channelsSidebarProps: Omit<ChannelsSidebarWrapperProps, 'onItemClick'>;
  userDockProps: UserBottomDockWrapperProps;
  friendsProps: FriendsMainPageWrapperProps;
  membersSidebarProps: MembersSidebarContentWrapperProps;

  contentProps: Omit<ChatContentContainerProps, 'renderMembersSidebarContent' | 'renderFriendsMainPage'>;
  modalProps: ChatModalsCoordinatorProps;
  t: (key: string, params?: Record<string, any>) => string;
}

const LockedFeatureGuard: any = ({ children }: any) => <>{children}</>;

export const ChatPageContent: React.FC<ChatPageContentProps> = ({
  sidebarWidth,
  isResizingSidebar,
  handleSidebarResizeStart,
  handleSidebarResizeReset,
  isMobileChannelsOpen,
  setIsMobileChannelsOpen,
  isMobileMembersOpen,
  setIsMobileMembersOpen,
  isDesktopSidebarCollapsed = false,
  railProps,
  channelsSidebarProps,
  userDockProps,
  friendsProps,
  membersSidebarProps,
  contentProps,
  modalProps,
  t,
}) => {
  const renderDiscordHubRail = () => <ColonyRailWrapper {...railProps} />;

  const renderChannelsSidebarContent = (onItemClick?: () => void) => (
    <ChannelsSidebarWrapper {...channelsSidebarProps} onItemClick={onItemClick} />
  );

  const renderUserBottomDock = () => <UserBottomDockWrapper {...userDockProps} />;

  const renderFriendsMainPage = () => <FriendsMainPageWrapper {...friendsProps} />;

  const renderMembersSidebarContent = () => (
    <MembersSidebarContentWrapper {...membersSidebarProps} />
  );

  return (
    <LockedFeatureGuard
      locked={false}
      lockTier="Plus"
      lockTitle={t('Unlock Chat & Collaboration')}
      lockDescription={t(
        'Berkomunikasi secara real-time, berbagi template otomatisasi instan, dan kolaborasi terpadu dengan rekan tim kerja Anda. Buka fitur ini dengan upgrade ke paket Plus (hingga 5 pengguna) atau Team.',
      )}
    >
      <TooltipProvider delayDuration={200}>
        <div
          className="flex flex-col h-full w-full overflow-hidden bg-background"
          data-sidebar-collapsed={isDesktopSidebarCollapsed ? 'true' : 'false'}
        >
          {/* TOP GLOBAL TITLE BAR (Discord-style) */}
          <AppTopTitleBar
            activeColony={channelsSidebarProps.activeColony || (contentProps as any).activeColony}
            activeChannel={(contentProps as any).activeChannel}
            homeView={channelsSidebarProps.homeView}
            isHome={channelsSidebarProps.isHome}
            isFriendsView={(contentProps as any).isFriendsView}
            isAiCommandCenterView={(contentProps as any).isAiCommandCenterView}
          />

          <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
            {/* DESKTOP & TABLET COMBINED LEFT COLUMN */}
            <ChatDesktopSidebar
              sidebarWidth={sidebarWidth}
              isResizingSidebar={isResizingSidebar}
              onResizeStart={handleSidebarResizeStart}
              onResizeReset={handleSidebarResizeReset}
              renderDiscordHubRail={renderDiscordHubRail}
              renderChannelsSidebarContent={renderChannelsSidebarContent}
              renderUserBottomDock={renderUserBottomDock}
              isSidebarCollapsed={isDesktopSidebarCollapsed}
              t={t}
            />

            {/* MOBILE & TABLET DRAWERS */}
            <ChatMobileDrawers
              isMobileChannelsOpen={isMobileChannelsOpen}
              setIsMobileChannelsOpen={setIsMobileChannelsOpen}
              isMobileMembersOpen={isMobileMembersOpen}
              setIsMobileMembersOpen={setIsMobileMembersOpen}
              renderDiscordHubRail={renderDiscordHubRail}
              renderChannelsSidebarContent={renderChannelsSidebarContent}
              renderMembersSidebarContent={renderMembersSidebarContent}
              renderUserBottomDock={renderUserBottomDock}
              t={t}
            />

            {/* MAIN CONTENT & MEMBERS CONTAINER */}
            <ChatContentContainer
              {...contentProps}
              renderFriendsMainPage={renderFriendsMainPage}
              renderMembersSidebarContent={renderMembersSidebarContent}
            />

            {/* Community Dialogs & Modals Coordinator */}
            <ChatModalsCoordinator {...modalProps} />
          </div>
        </div>
      </TooltipProvider>
    </LockedFeatureGuard>
  );
};
