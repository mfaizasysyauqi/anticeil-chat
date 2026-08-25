import { CalendarEvent } from './types';

// Helper for dates relative to now
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
const dayAfter = new Date(now.getTime() + 48 * 3600 * 1000);

const setHour = (d: Date, hour: number, minute: number = 0) => {
  const c = new Date(d);
  c.setHours(hour, minute, 0, 0);
  return c.toISOString();
};

const INITIAL_SANDBOX_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-event-001',
    summary: '🚀 Product Launch Strategy & AI Roadmap',
    description: 'Quarterly review of our multi-modal AI model rollout, latency benchmarks, and enterprise BYOK features.',
    location: 'Google Meet (meet.google.com/abc-defg-hij)',
    start: {
      dateTime: setHour(tomorrow, 10, 0),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: setHour(tomorrow, 11, 0),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: [
      { email: 'me@company.com', responseStatus: 'accepted' },
      { email: 'sarah.connor@acmecorp.com', responseStatus: 'accepted' },
      { email: 'alex.tan@techventure.io', responseStatus: 'tentative' },
    ],
    htmlLink: 'https://calendar.google.com',
    status: 'confirmed',
    meetLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'cal-event-002',
    summary: '☕ 1-on-1 Coffee Sync with Engineering Lead',
    description: 'Weekly catchup regarding sprint deliverables, agent tooling architecture, and UI polish.',
    location: 'Third Wave Coffee / Virtual',
    start: {
      dateTime: setHour(tomorrow, 15, 30),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: setHour(tomorrow, 16, 0),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: [
      { email: 'me@company.com', responseStatus: 'accepted' },
      { email: 'dev.lead@company.com', responseStatus: 'accepted' },
    ],
    htmlLink: 'https://calendar.google.com',
    status: 'confirmed',
  },
  {
    id: 'cal-event-003',
    summary: '📊 Weekly Executive Sprint Review',
    description: 'Sprint demo and blocker resolution with senior leadership team.',
    location: 'Boardroom A & Google Meet',
    start: {
      dateTime: setHour(dayAfter, 14, 0),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: setHour(dayAfter, 15, 0),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: [
      { email: 'me@company.com', responseStatus: 'accepted' },
      { email: 'management@company.com', responseStatus: 'needsAction' },
    ],
    htmlLink: 'https://calendar.google.com',
    status: 'confirmed',
  },
];

let sandboxEvents: CalendarEvent[] = [...INITIAL_SANDBOX_EVENTS];

export interface CalendarClientOptions {
  accessToken?: string;
  isSandboxMode?: boolean;
}

export class CalendarConnectorClient {
  private accessToken?: string;
  private isSandbox: boolean;

  constructor(options: CalendarClientOptions) {
    this.accessToken = options.accessToken;
    this.isSandbox = options.isSandboxMode ?? false;
  }

  /**
   * List / Search Calendar Events (CRUD - Read)
   */
  async listEvents(params: {
    timeMin?: string;
    timeMax?: string;
    query?: string;
    maxResults?: number;
  }): Promise<{ events: CalendarEvent[]; totalCount: number }> {
    const { timeMin, timeMax, query = '', maxResults = 10 } = params;

    if (this.isSandbox) {
      let filtered = [...sandboxEvents];

      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.summary.toLowerCase().includes(q) ||
            (e.description && e.description.toLowerCase().includes(q)) ||
            (e.location && e.location.toLowerCase().includes(q))
        );
      }

      if (timeMin) {
        const minDate = new Date(timeMin).getTime();
        filtered = filtered.filter((e) => {
          const start = new Date(e.start.dateTime || e.start.date || 0).getTime();
          return start >= minDate;
        });
      }

      if (timeMax) {
        const maxDate = new Date(timeMax).getTime();
        filtered = filtered.filter((e) => {
          const end = new Date(e.end.dateTime || e.end.date || 0).getTime();
          return end <= maxDate;
        });
      }

      // Sort by start time ascending
      filtered.sort((a, b) => {
        const tA = new Date(a.start.dateTime || a.start.date || 0).getTime();
        const tB = new Date(b.start.dateTime || b.start.date || 0).getTime();
        return tA - tB;
      });

      return {
        events: filtered.slice(0, maxResults),
        totalCount: filtered.length,
      };
    }

    // Google Calendar REST API
    try {
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('maxResults', String(Math.min(maxResults, 50)));

      if (timeMin) url.searchParams.set('timeMin', timeMin);
      else url.searchParams.set('timeMin', new Date().toISOString());

      if (timeMax) url.searchParams.set('timeMax', timeMax);
      if (query) url.searchParams.set('q', query);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!res.ok) throw new Error(`Calendar API error: ${res.status} ${res.statusText}`);
      const data = await res.json();

      const events: CalendarEvent[] = (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || '(Untitled Event)',
        description: item.description,
        location: item.location,
        start: item.start || {},
        end: item.end || {},
        attendees: item.attendees || [],
        htmlLink: item.htmlLink,
        status: item.status,
        meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri,
      }));

      return { events, totalCount: events.length };
    } catch (err: any) {
      throw new Error(`Failed to list calendar events: ${err.message}`);
    }
  }

  /**
   * Get Event Details (CRUD - Read)
   */
  async getEvent(eventId: string): Promise<CalendarEvent> {
    if (this.isSandbox) {
      const found = sandboxEvents.find((e) => e.id === eventId);
      if (!found) throw new Error(`Calendar event ${eventId} not found in sandbox.`);
      return found;
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    if (!res.ok) throw new Error(`Failed to get calendar event: ${res.statusText}`);
    const item = await res.json();
    return {
      id: item.id,
      summary: item.summary || '(Untitled Event)',
      description: item.description,
      location: item.location,
      start: item.start || {},
      end: item.end || {},
      attendees: item.attendees || [],
      htmlLink: item.htmlLink,
      status: item.status,
      meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri,
    };
  }

  /**
   * Create Calendar Event (CRUD - Create)
   */
  async createEvent(params: {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string; // ISO string
    endDateTime: string;   // ISO string
    attendees?: string[];  // Email list
  }): Promise<{ success: boolean; event: CalendarEvent; message: string }> {
    const { summary, description, location, startDateTime, endDateTime, attendees } = params;

    if (!summary || !startDateTime || !endDateTime) {
      throw new Error('Summary, startDateTime, and endDateTime are required to create a calendar event.');
    }

    const formattedAttendees = (attendees || []).map((email) => ({
      email,
      responseStatus: 'needsAction' as const,
    }));

    if (this.isSandbox) {
      const newEvent: CalendarEvent = {
        id: `cal-sandbox-${Date.now()}`,
        summary,
        description,
        location,
        start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        attendees: [{ email: 'me@company.com', responseStatus: 'accepted' }, ...formattedAttendees],
        htmlLink: 'https://calendar.google.com',
        status: 'confirmed',
        meetLink: 'https://meet.google.com/new',
      };
      sandboxEvents.unshift(newEvent);
      return {
        success: true,
        event: newEvent,
        message: `Event "${summary}" successfully scheduled for ${new Date(startDateTime).toLocaleString()} (Sandbox Mode)`,
      };
    }

    const payload = {
      summary,
      description,
      location,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      attendees: formattedAttendees,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create calendar event: ${err}`);
    }

    const item = await res.json();
    const createdEvent: CalendarEvent = {
      id: item.id,
      summary: item.summary,
      description: item.description,
      location: item.location,
      start: item.start,
      end: item.end,
      attendees: item.attendees,
      htmlLink: item.htmlLink,
      status: item.status,
      meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri,
    };

    return {
      success: true,
      event: createdEvent,
      message: `Event "${summary}" created successfully.`,
    };
  }

  /**
   * Update Calendar Event (CRUD - Update)
   */
  async updateEvent(params: {
    eventId: string;
    summary?: string;
    description?: string;
    location?: string;
    startDateTime?: string;
    endDateTime?: string;
    attendees?: string[];
  }): Promise<{ success: boolean; event: CalendarEvent; message: string }> {
    const { eventId, summary, description, location, startDateTime, endDateTime, attendees } = params;

    if (this.isSandbox) {
      const event = sandboxEvents.find((e) => e.id === eventId);
      if (!event) throw new Error(`Event ${eventId} not found in sandbox.`);

      if (summary) event.summary = summary;
      if (description !== undefined) event.description = description;
      if (location !== undefined) event.location = location;
      if (startDateTime) event.start.dateTime = startDateTime;
      if (endDateTime) event.end.dateTime = endDateTime;
      if (attendees) {
        event.attendees = attendees.map((email) => ({ email, responseStatus: 'needsAction' }));
      }

      return {
        success: true,
        event,
        message: `Event "${event.summary}" updated successfully (Sandbox Mode)`,
      };
    }

    // Fetch existing first
    const existing = await this.getEvent(eventId);
    const payload = {
      summary: summary ?? existing.summary,
      description: description ?? existing.description,
      location: location ?? existing.location,
      start: startDateTime ? { dateTime: startDateTime } : existing.start,
      end: endDateTime ? { dateTime: endDateTime } : existing.end,
      attendees: attendees ? attendees.map((email) => ({ email })) : existing.attendees,
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) throw new Error(`Failed to update calendar event: ${res.statusText}`);
    const item = await res.json();
    return {
      success: true,
      event: {
        id: item.id,
        summary: item.summary,
        description: item.description,
        location: item.location,
        start: item.start,
        end: item.end,
        attendees: item.attendees,
        htmlLink: item.htmlLink,
        status: item.status,
      },
      message: `Event updated successfully.`,
    };
  }

  /**
   * Delete Calendar Event (CRUD - Delete)
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    if (this.isSandbox) {
      const idx = sandboxEvents.findIndex((e) => e.id === eventId);
      if (idx !== -1) {
        const removed = sandboxEvents.splice(idx, 1)[0];
        return {
          success: true,
          message: `Event "${removed.summary}" has been cancelled and removed from calendar (Sandbox Mode)`,
        };
      }
      return { success: true, message: `Event ${eventId} deleted.` };
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );

    if (!res.ok) throw new Error(`Failed to delete event: ${res.statusText}`);
    return { success: true, message: `Calendar event cancelled.` };
  }
}
