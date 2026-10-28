import { api } from '@/lib/api';
import type { AssignmentItem } from '../types';

export const assignmentsApi = {
  getAssignments: async (): Promise<AssignmentItem[]> => {
    try {
      const data = await api.get<AssignmentItem[]>('/v1/community/assignments');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  createAssignment: async (data: Partial<AssignmentItem>): Promise<AssignmentItem> => {
    return api.post('/v1/community/assignments', data);
  },

  updateAssignment: async (
    id: string,
    data: { columnId?: string; completedAt?: string | null },
  ): Promise<{ success: boolean; id: string }> => {
    return api.put(`/v1/community/assignments/${id}`, data);
  },

  deleteAssignment: async (id: string): Promise<{ success: boolean; id: string }> => {
    return api.delete(`/v1/community/assignments/${id}`);
  },
};
