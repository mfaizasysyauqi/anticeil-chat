import { useState, useEffect, useMemo } from 'react';
import { useCalendarEvents } from '@/features/calendar';
import { useAssignments } from '@/features/assignments';
import { useCallLogs } from '@/features/calls';
import { useMessageRequests } from '@/features/message-requests';
import { useNotifications } from '@/features/notifications';
import { useFriendsManager } from '@/features/friends';

export interface UseChatSubsystemsOptions {
  currentUser: any;
  members: any[];
  dmChannels: any[];
  t: (key: string, params?: Record<string, any>) => string;
}

export function useChatSubsystems({
  currentUser,
  members,
  dmChannels,
  t,
}: UseChatSubsystemsOptions) {
  // 1. Calendar Events
  const {
    events: calendarEvents,
    handleCreateEvent: createCalendarEvent,
    handleUpdateEvent: updateCalendarEvent,
    handleDeleteEvent: deleteCalendarEvent,
  } = useCalendarEvents();
  const [isColonyEventsModalOpen, setIsColonyEventsModalOpen] = useState(false);

  // 2. Assignments
  const { assignments, setAssignments, handleToggleComplete, handleDeleteAssignment } = useAssignments();

  // 3. Call Logs
  const { calls: callLogs, handleCreateCallLog } = useCallLogs();

  // 4. Message Requests
  const {
    requests: messageRequests,
    handleAccept: handleAcceptMessageRequestRaw,
    handleIgnore: handleIgnoreMessageRequest,
    handleSpam: handleReportSpamMessageRequest,
  } = useMessageRequests();

  // 5. Notifications
  const {
    notifications,
    handleMarkAsRead: handleMarkNotificationRead,
    handleMarkAllAsRead: handleMarkAllNotificationsRead,
  } = useNotifications([], currentUser?.id);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  // 6. Friends Manager
  const friends = useFriendsManager({
    displayMembers: members,
    currentUser,
    members,
    dmChannels,
    t,
  });

  // 7. Modals / Search state
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [userSettingsInitialSection, setUserSettingsInitialSection] = useState<string>('account');
  const handleOpenUserSettings = (section: string = 'account') => {
    setUserSettingsInitialSection(section);
    setIsUserSettingsOpen(true);
  };

  useEffect(() => {
    const handleOpenSettingsEvent = (e: any) => {
      const section = e?.detail?.section || 'nitro';
      handleOpenUserSettings(section);
    };
    window.addEventListener('anticeil_open_user_settings', handleOpenSettingsEvent);
    return () => {
      window.removeEventListener('anticeil_open_user_settings', handleOpenSettingsEvent);
    };
  }, []);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const handleOpenEditProfile = () => {
    setIsEditProfileOpen(true);
  };

  const [isDmSearchOpen, setIsDmSearchOpen] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [isCreateGroupDmOpen, setIsCreateGroupDmOpen] = useState(false);

  return {
    calendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    isColonyEventsModalOpen,
    setIsColonyEventsModalOpen,
    assignments,
    setAssignments,
    handleToggleComplete,
    handleDeleteAssignment,
    callLogs,
    handleCreateCallLog,
    messageRequests,
    handleAcceptMessageRequestRaw,
    handleIgnoreMessageRequest,
    handleReportSpamMessageRequest,
    notifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    unreadNotifCount,
    friends,
    isUserSettingsOpen,
    setIsUserSettingsOpen,
    userSettingsInitialSection,
    handleOpenUserSettings,
    isEditProfileOpen,
    setIsEditProfileOpen,
    handleOpenEditProfile,
    isDmSearchOpen,
    setIsDmSearchOpen,
    dmSearchQuery,
    setDmSearchQuery,
    isCreateGroupDmOpen,
    setIsCreateGroupDmOpen,
  };
}
