import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { AssignmentItem } from '../types';
import { assignmentsApi } from '../api/assignments-api';

export function useAssignments(initialData: AssignmentItem[] = []) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assignmentsApi.getAssignments();
      if (Array.isArray(data)) {
        setAssignments(data);
      }
    } catch {
      // Keep optimistic
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Listen for channel/colony deletions to automatically cascade-remove assignments
  useEffect(() => {
    const handleChannelDeleted = (e: any) => {
      const deletedChannelId = e?.detail?.channelId;
      if (deletedChannelId) {
        setAssignments((prev) => prev.filter((a) => a.channelId !== deletedChannelId));
      }
    };
    const handleColonyDeleted = (e: any) => {
      const deletedColonyId = e?.detail?.colonyId;
      if (deletedColonyId) {
        setAssignments((prev) =>
          prev.filter(
            (a) =>
              (a as any).colonyId !== deletedColonyId &&
              (a as any).hubId !== deletedColonyId
          )
        );
      }
    };

    window.addEventListener('anticeil_channel_deleted', handleChannelDeleted);
    window.addEventListener('anticeil_colony_deleted', handleColonyDeleted);
    return () => {
      window.removeEventListener('anticeil_channel_deleted', handleChannelDeleted);
      window.removeEventListener('anticeil_colony_deleted', handleColonyDeleted);
    };
  }, []);

  const handleToggleComplete = async (cardId: string) => {
    const target = assignments.find((c) => c.id === cardId);
    if (!target) return;

    const isDone = target.columnId === 'done';
    const nextCol = isDone ? 'todo' : 'done';
    const nextCompletedAt = isDone ? undefined : new Date().toISOString();

    setAssignments((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              columnId: nextCol,
              completedAt: nextCompletedAt,
            }
          : c,
      ),
    );

    try {
      await assignmentsApi.updateAssignment(cardId, {
        columnId: nextCol,
        completedAt: nextCompletedAt || null,
      });
      toast.success(isDone ? 'Tugas dipindahkan ke To Do.' : 'Tugas selesai!');
    } catch {
      toast.error('Gagal memperbarui status tugas.');
    }
  };

  const handleCreateAssignment = async (data: Partial<AssignmentItem>) => {
    try {
      const created = await assignmentsApi.createAssignment(data);
      if (created && created.id) {
        setAssignments((prev) => [created, ...prev]);
        toast.success(`Tugas "${created.title}" berhasil dibuat!`);
        return created;
      }
    } catch {
      toast.error('Gagal membuat tugas.');
    }
    return null;
  };

  const handleDeleteAssignment = async (cardId: string) => {
    setAssignments((prev) => prev.filter((c) => c.id !== cardId));
    try {
      await assignmentsApi.deleteAssignment(cardId);
      toast.success('Tugas dihapus.');
    } catch {
      // Ignored
    }
  };

  return {
    assignments,
    setAssignments,
    isLoading,
    handleToggleComplete,
    handleCreateAssignment,
    handleDeleteAssignment,
    refetch: fetchAssignments,
  };
}
