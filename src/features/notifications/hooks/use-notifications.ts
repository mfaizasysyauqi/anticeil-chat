import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { NotificationItem, NotificationsTab } from '../types';
import { notificationsApi } from '../api/notifications-api';

export function useNotifications(initialData: NotificationItem[] = [], userId?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialData);
  const [activeTab, setActiveTab] = useState<NotificationsTab>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await notificationsApi.getNotifications(userId);
      if (Array.isArray(data)) {
        const filtered = data.filter((n) => {
          // Never show a notification where current user is the sender/actor
          if (n.actorId === userId) {
            return false;
          }
          const targets = n.targetUserIds || (n.targetUserId ? [n.targetUserId] : []);
          if (targets.length > 0) {
            return targets.includes(userId);
          }
          return true;
        });
        setNotifications(filtered);
      }
    } catch {
      // Keep optimistic
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    const handleLogout = () => setNotifications([]);
    window.addEventListener('anticeil_notification_updated', handleUpdate);
    window.addEventListener('anticeil_logout', handleLogout);
    return () => {
      window.removeEventListener('anticeil_notification_updated', handleUpdate);
      window.removeEventListener('anticeil_logout', handleLogout);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      // Ignored
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllAsRead();
      toast.success('Semua notifikasi telah ditandai dibaca.');
    } catch {
      // Ignored
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  return {
    notifications,
    setNotifications,
    activeTab,
    setActiveTab,
    isLoading,
    unreadCount,
    handleMarkAsRead,
    handleMarkAllAsRead,
    refetch: fetchNotifications,
  };
}
