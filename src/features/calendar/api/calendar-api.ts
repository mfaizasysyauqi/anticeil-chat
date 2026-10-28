import { api } from '@/lib/api';
import type { CalendarEvent } from '../types';

export const calendarApi = {
  getCalendarEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const data = await api.get<CalendarEvent[]>('/v1/community/calendar/events');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  createCalendarEvent: async (event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    return api.post('/v1/community/calendar/events', event);
  },

  deleteCalendarEvent: async (id: string): Promise<{ success: boolean; id: string }> => {
    return api.delete(`/v1/community/calendar/events/${id}`);
  },
};
