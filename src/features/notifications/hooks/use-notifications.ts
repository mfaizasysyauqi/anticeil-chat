import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { NotificationItem, NotificationsTab } from '../types';
import { notificationsApi } from '../api/notifications-api';

export function useNotifications(initialData: NotificationItem[] = [], userId?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialData);
  const [activeTab, setActiveTab] = useState<NotificationsTab>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getNotifications(userId);
      if (Array.isArray(data)) {
        setNotifications(data);
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
    window.addEventListener('anticeil_notification_updated', handleUpdate);
    return () => window.removeEventListener('anticeil_notification_updated', handleUpdate);
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
