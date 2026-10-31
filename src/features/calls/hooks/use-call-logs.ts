import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CallLogItem } from '../types';
import { callsApi } from '../api/calls-api';

export function useCallLogs(initialData: CallLogItem[] = []) {
  const [calls, setCalls] = useState<CallLogItem[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCalls = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callsApi.getCallLogs();
      if (Array.isArray(data)) {
        setCalls(data);
      }
    } catch {
      // Keep optimistic
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const handleCreateCallLog = async (logData: Partial<CallLogItem>) => {
    try {
      const res = await callsApi.createCallLog(logData);
      if (res && res.id) {
        const item: CallLogItem = {
          id: res.id,
          peerId: logData.peerId || 'unknown',
          peerName: logData.peerName || 'User',
          peerAvatar: logData.peerAvatar || null,
          type: logData.type || 'outgoing',
          isVideo: Boolean(logData.isVideo),
          timestamp: new Date().toISOString(),
          duration: logData.duration,
          colonyId: logData.colonyId,
          hubName: logData.hubName,
          hubIcon: logData.hubIcon,
          isDm: logData.isDm,
        };
        setCalls((prev) => [item, ...prev]);
        return item;
      }
    } catch {
      // Ignored
    }
    return null;
  };

  const handleDeleteCallLog = async (id: string) => {
    setCalls((prev) => prev.filter((c) => c.id !== id));
    try {
      await callsApi.deleteCallLog(id);
      toast.success('Riwayat panggilan dihapus.');
    } catch {
      // Ignored
    }
  };

  return {
    calls,
    setCalls,
    isLoading,
    handleCreateCallLog,
    handleDeleteCallLog,
    refetch: fetchCalls,
  };
}
