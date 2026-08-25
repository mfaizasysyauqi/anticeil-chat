import { GmailMessage, GmailDraft } from './types';

// Mock Initial Gmail Database for Demo Sandbox
const INITIAL_SANDBOX_MESSAGES: GmailMessage[] = [
  {
    id: 'msg-gmail-001',
    threadId: 'th-001',
    from: 'sarah.connor@acmecorp.com',
    to: 'me@company.com',
    subject: 'Urgent: Q3 Budget Review & Team Planning',
    snippet: 'Hi team, please find attached the revised Q3 projections. We need all department heads to finalize their allocations by Thursday.',
    body: 'Hi team,\n\nPlease find attached the revised Q3 projections.\nWe need all department heads to finalize their headcount allocations and cloud infrastructure budgets by this Thursday at 5 PM.\n\nLet me know if you need any adjustments before the final executive meeting.\n\nBest,\nSarah Connor\nVP of Operations',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    isUnread: true,
    isStarred: true,
    labels: ['INBOX', 'IMPORTANT', 'UNREAD'],
  },
  {
    id: 'msg-gmail-002',
    threadId: 'th-002',
    from: 'alex.tan@techventure.io',
    to: 'me@company.com',
    subject: 'Follow up: AI Assistant Architecture & Demo',
    snippet: 'Hey! Loved the demo today. Can you send over the API documentation and pricing breakdown when you get a chance?',
    body: 'Hey,\n\nLoved the demo session today! The BYOK architecture and sub-second response times are super impressive.\n\nCould you send over the detailed API documentation and enterprise pricing breakdown when you have a moment?\n\nThanks,\nAlex Tan\nHead of Engineering',
    date: new Date(Date.now() - 3600000 * 6).toISOString(),
    isUnread: true,
    isStarred: false,
    labels: ['INBOX', 'UNREAD'],
  },
  {
    id: 'msg-gmail-003',
    threadId: 'th-003',
    from: 'billing@cloudservices.net',
    to: 'me@company.com',
    subject: 'Your Monthly Invoice for July 2026',
    snippet: 'Your invoice for July 2026 is now available. Amount due: $245.80. Payment will be processed automatically.',
    body: 'Hello,\n\nYour monthly statement for July 2026 is ready.\n\nAmount: $245.80\nStatus: Paid via Corporate Card ending in 4242\nInvoice ID: #INV-2026-07-8821\n\nThank you for choosing CloudServices.',
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    isUnread: false,
    isStarred: false,
    labels: ['INBOX', 'INVOICES'],
  },
];

// In-memory / client-side sandbox cache
let sandboxMessages: GmailMessage[] = [...INITIAL_SANDBOX_MESSAGES];
let sandboxDrafts: GmailDraft[] = [];

export interface GmailClientOptions {
  accessToken?: string;
  isSandboxMode?: boolean;
}

export class GmailConnectorClient {
  private accessToken?: string;
  private isSandbox: boolean;

  constructor(options: GmailClientOptions) {
    this.accessToken = options.accessToken;
    this.isSandbox = options.isSandboxMode ?? false;
  }

  /**
   * List / Search Gmail Messages (CRUD - Read)
   */
  async listMessages(params: {
    query?: string;
    maxResults?: number;
    unreadOnly?: boolean;
  }): Promise<{ messages: GmailMessage[]; totalCount: number }> {
    const { query = '', maxResults = 10, unreadOnly = false } = params;

    if (this.isSandbox) {
      let filtered = [...sandboxMessages];
      if (unreadOnly) {
        filtered = filtered.filter((m) => m.isUnread);
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.subject.toLowerCase().includes(q) ||
            m.from.toLowerCase().includes(q) ||
            m.snippet.toLowerCase().includes(q) ||
            m.body.toLowerCase().includes(q)
        );
      }
      return {
        messages: filtered.slice(0, maxResults),
        totalCount: filtered.length,
      };
    }

    // Live Google Gmail REST API
    try {
      let qParam = query;
      if (unreadOnly) {
        qParam = qParam ? `${qParam} is:unread` : 'is:unread';
      }

      const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
      if (qParam) url.searchParams.set('q', qParam);
      url.searchParams.set('maxResults', String(Math.min(maxResults, 20)));

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Gmail API error: ${res.status} ${res.statusText}`);
      }

      const listData = await res.json();
      if (!listData.messages || listData.messages.length === 0) {
        return { messages: [], totalCount: 0 };
      }

      // Fetch message summaries
      const fetched: GmailMessage[] = [];
      for (const msgRef of listData.messages.slice(0, maxResults)) {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=full`,
          { headers: { Authorization: `Bearer ${this.accessToken}` } }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          fetched.push({
            id: detail.id,
            threadId: detail.threadId,
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject') || '(No Subject)',
            snippet: detail.snippet || '',
            body: detail.snippet || '',
            date: getHeader('Date') || new Date().toISOString(),
            isUnread: detail.labelIds?.includes('UNREAD') ?? false,
            isStarred: detail.labelIds?.includes('STARRED') ?? false,
            labels: detail.labelIds || [],
          });
        }
      }

      return { messages: fetched, totalCount: listData.resultSizeEstimate || fetched.length };
    } catch (err: any) {
      throw new Error(`Failed to list Gmail messages: ${err.message}`);
    }
  }

  /**
   * Get Single Email Details (CRUD - Read)
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    if (this.isSandbox) {
      const found = sandboxMessages.find((m) => m.id === messageId);
      if (!found) throw new Error(`Message ${messageId} not found in sandbox`);
      // Auto-mark as read when opened
      found.isUnread = false;
      return found;
    }

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    if (!res.ok) throw new Error(`Failed to fetch message ${messageId}: ${res.statusText}`);
    const detail = await res.json();
    const headers = detail.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      id: detail.id,
      threadId: detail.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject') || '(No Subject)',
      snippet: detail.snippet || '',
      body: detail.snippet || '',
      date: getHeader('Date') || new Date().toISOString(),
      isUnread: detail.labelIds?.includes('UNREAD') ?? false,
      isStarred: detail.labelIds?.includes('STARRED') ?? false,
      labels: detail.labelIds || [],
    };
  }

  /**
   * Send Email (CRUD - Create)
   */
  async sendMessage(params: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
  }): Promise<{ success: boolean; messageId: string; message: string }> {
    const { to, subject, body, cc } = params;
    if (!to || !subject) throw new Error('Recipient (to) and Subject are required to send an email');

    if (this.isSandbox) {
      const newId = `msg-sent-${Date.now()}`;
      const sentMsg: GmailMessage = {
        id: newId,
        threadId: `th-${Date.now()}`,
        from: 'me@company.com (You)',
        to,
        cc,
        subject,
        snippet: body.slice(0, 100),
        body,
        date: new Date().toISOString(),
        isUnread: false,
        labels: ['SENT'],
      };
      sandboxMessages.unshift(sentMsg);
      return {
        success: true,
        messageId: newId,
        message: `Email successfully sent to ${to} with subject "${subject}" (Sandbox Mode)`,
      };
    }

    // Google API raw RFC 2822 format
    const emailLines = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : '',
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].filter(Boolean).join('\r\n');

    const rawBase64 = btoa(unescape(encodeURIComponent(emailLines)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawBase64 }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to send email: ${err}`);
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.id,
      message: `Email successfully delivered to ${to}`,
    };
  }

  /**
   * Create Draft (CRUD - Create)
   */
  async createDraft(params: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ success: boolean; draftId: string; message: string }> {
    const { to, subject, body } = params;

    if (this.isSandbox) {
      const draftId = `draft-${Date.now()}`;
      sandboxDrafts.push({
        id: draftId,
        to,
        subject,
        body,
        updatedAt: new Date().toISOString(),
      });
      return {
        success: true,
        draftId,
        message: `Draft created for ${to}: "${subject}" (Sandbox Mode)`,
      };
    }

    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n');

    const rawBase64 = btoa(unescape(encodeURIComponent(emailLines)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { raw: rawBase64 } }),
    });

    if (!res.ok) throw new Error(`Failed to create draft: ${res.statusText}`);
    const data = await res.json();
    return {
      success: true,
      draftId: data.id,
      message: `Draft created successfully with ID ${data.id}`,
    };
  }

  /**
   * Trash / Delete Email (CRUD - Delete)
   */
  async trashMessage(messageId: string): Promise<{ success: boolean; message: string }> {
    if (this.isSandbox) {
      const idx = sandboxMessages.findIndex((m) => m.id === messageId);
      if (idx !== -1) {
        const removed = sandboxMessages.splice(idx, 1)[0];
        return {
          success: true,
          message: `Email "${removed.subject}" moved to trash (Sandbox Mode)`,
        };
      }
      return { success: true, message: `Email ${messageId} deleted.` };
    }

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );

    if (!res.ok) throw new Error(`Failed to trash message: ${res.statusText}`);
    return { success: true, message: `Message ${messageId} moved to Trash.` };
  }

  /**
   * Modify Message Labels / Mark Read (CRUD - Update)
   */
  async modifyMessage(params: {
    messageId: string;
    markAsRead?: boolean;
    star?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const { messageId, markAsRead, star } = params;

    if (this.isSandbox) {
      const msg = sandboxMessages.find((m) => m.id === messageId);
      if (msg) {
        if (markAsRead !== undefined) msg.isUnread = !markAsRead;
        if (star !== undefined) msg.isStarred = star;
      }
      return {
        success: true,
        message: `Message ${messageId} updated successfully (Sandbox Mode)`,
      };
    }

    const removeLabelIds: string[] = [];
    const addLabelIds: string[] = [];

    if (markAsRead) removeLabelIds.push('UNREAD');
    if (star) addLabelIds.push('STARRED');

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addLabelIds, removeLabelIds }),
      }
    );

    if (!res.ok) throw new Error(`Failed to modify message: ${res.statusText}`);
    return { success: true, message: `Message labels updated.` };
  }
}
