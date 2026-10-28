import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { MessageRequestItem, MessageRequestsTab } from '../types';
import { messageRequestsApi } from '../api/message-requests-api';

export function useMessageRequests(initialData: MessageRequestItem[] = []) {
  const [requests, setRequests] = useState<MessageRequestItem[]>(initialData);
  const [activeTab, setActiveTab] = useState<MessageRequestsTab>('requests');
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await messageRequestsApi.getMessageRequests();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch {
      // Keep optimistic
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (item: MessageRequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== item.id));
    try {
      await messageRequestsApi.acceptMessageRequest(item.id);
      toast.success(`Permintaan pesan dari ${item.name} diterima.`);
    } catch {
      toast.error('Gagal menerima permintaan pesan.');
    }
  };

  const handleIgnore = async (item: MessageRequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== item.id));
    try {
      await messageRequestsApi.ignoreMessageRequest(item.id);
      toast('Permintaan pesan diabaikan.');
    } catch {
      // Ignored
    }
  };

  const handleSpam = async (item: MessageRequestItem) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, isSpam: true } : r)),
    );
    try {
      await messageRequestsApi.spamMessageRequest(item.id);
      toast('Pengguna ditandai sebagai spam.');
    } catch {
      // Ignored
    }
  };

  const pendingCount = useMemo(() => requests.filter((r) => !r.isSpam).length, [requests]);
  const spamCount = useMemo(() => requests.filter((r) => r.isSpam).length, [requests]);

  return {
    requests,
    setRequests,
    activeTab,
    setActiveTab,
    isLoading,
    handleAccept,
    handleIgnore,
    handleSpam,
    pendingCount,
    spamCount,
    refetch: fetchRequests,
  };
}
