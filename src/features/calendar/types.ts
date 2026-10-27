export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'task' | 'activity';
  startTime: string; // ISO string (e.g. 2026-10-28T14:00:00)
  endTime?: string;
  hubId?: string;
  hubName?: string;
  channelId?: string;
  channelName?: string;
  isAllDay?: boolean;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  attendees?: Array<{
    id: string;
    name: string;
    avatar?: string | null;
  }>;
}

export type CalendarViewMode = 'month' | 'agenda';
export type CalendarFilterType = 'all' | 'meeting' | 'task' | 'activity';
