import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMainView, type ChatMainViewProps } from './chat-main-view';

export interface ChatContentContainerProps extends ChatMainViewProps {
  isDmMode: boolean;
  activeDmUserId?: string | null;
  renderMembersSidebarContent: () => React.ReactNode;
}

export const ChatContentContainer: React.FC<ChatContentContainerProps> = (props) => {
  const {
    isDmMode,
    activeDmUserId,
    renderMembersSidebarContent,
    showMemberList,
    isFriendsView,
    activeChannel,
    activeCallChannelId,
    ...mainViewProps
  } = props;

  return (
    <>
      {/* MAIN CONTENT AREA */}
      <ChatMainView
        showMemberList={showMemberList}
        isFriendsView={isFriendsView}
        activeChannel={activeChannel}
        activeCallChannelId={activeCallChannelId}
        {...mainViewProps}
      />

      {/* DESKTOP MEMBERS / USER PROFILE SIDEBAR */}
      {showMemberList &&
        !isFriendsView &&
        activeChannel?.type !== 'voice' &&
        activeCallChannelId !== activeChannel?.id && (
          <div
            className={cn(
              'hidden lg:flex shrink-0',
              isDmMode && activeDmUserId ? 'w-80' : 'w-60',
            )}
          >
            {renderMembersSidebarContent()}
          </div>
        )}
    </>
  );
};
