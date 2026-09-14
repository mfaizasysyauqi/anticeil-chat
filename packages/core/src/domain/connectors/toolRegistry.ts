import {
  ConnectorId,
  ConnectorToolDefinition,
  ToolCallRequest,
  ToolCallResult,
} from './types';
import { GmailConnectorClient } from './gmailClient';
import { CalendarConnectorClient } from './calendarClient';
import { GoogleDriveConnectorClient } from './driveClient';
import { NotionConnectorClient } from './notionClient';
import { GitHubConnectorClient } from './githubClient';

export const CONNECTOR_TOOLS: ConnectorToolDefinition[] = [
  // --- GMAIL TOOLS (CRUD) ---
  {
    name: 'gmail_list_emails',
    connectorId: 'gmail',
    description: 'Search and list emails from the user\'s Gmail inbox or specific query.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g. "from:sarah", "subject:budget", "invoice", "urgent")',
        },
        unreadOnly: {
          type: 'boolean',
          description: 'Filter only unread emails',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of emails to retrieve (default 5)',
        },
      },
    },
  },
  {
    name: 'gmail_list_messages',
    connectorId: 'gmail',
    description: 'Search and list emails from the user\'s Gmail inbox or specific query (alias of gmail_list_emails).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g. "from:sarah", "subject:budget", "invoice", "urgent")',
        },
        unreadOnly: {
          type: 'boolean',
          description: 'Filter only unread emails',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of emails to retrieve (default 5)',
        },
      },
    },
  },
  {
    name: 'gmail_get_message',
    connectorId: 'gmail',
    description: 'Retrieve full email content, thread, and sender info by email ID.',
    parameters: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'The unique message ID to fetch',
          required: true,
        },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_send_message',
    connectorId: 'gmail',
    description: 'Send an email directly from the user\'s Gmail account.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address',
          required: true,
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
          required: true,
        },
        body: {
          type: 'string',
          description: 'Body text content of the email',
          required: true,
        },
        cc: {
          type: 'string',
          description: 'Optional CC email address',
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_create_draft',
    connectorId: 'gmail',
    description: 'Create a draft email without sending it immediately.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address',
          required: true,
        },
        subject: {
          type: 'string',
          description: 'Draft subject line',
          required: true,
        },
        body: {
          type: 'string',
          description: 'Draft content body',
          required: true,
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_trash_message',
    connectorId: 'gmail',
    description: 'Move an email to the Trash folder by message ID.',
    parameters: {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          description: 'The ID of the email to delete/trash',
          required: true,
        },
      },
      required: ['messageId'],
    },
  },

  // --- CALENDAR TOOLS (CRUD) ---
  {
    name: 'calendar_list_events',
    connectorId: 'calendar',
    description: 'List upcoming events and meetings from Google Calendar.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Free-text search terms to match (e.g. "Sprint", "Sync", "Demo")',
        },
        timeMin: {
          type: 'string',
          description: 'ISO 8601 start time (default: current time)',
        },
        timeMax: {
          type: 'string',
          description: 'ISO 8601 end time boundary',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum events to return (default 5)',
        },
      },
    },
  },
  {
    name: 'calendar_get_event',
    connectorId: 'calendar',
    description: 'Get full details of a specific calendar event by ID.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'The unique ID of the calendar event',
          required: true,
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'calendar_create_event',
    connectorId: 'calendar',
    description: 'Schedule and create a new event or meeting in Google Calendar.',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Event or meeting title',
          required: true,
        },
        description: {
          type: 'string',
          description: 'Agenda, description, or notes for the meeting',
        },
        location: {
          type: 'string',
          description: 'Meeting room or virtual link (e.g. "Google Meet")',
        },
        startDateTime: {
          type: 'string',
          description: 'ISO 8601 formatted start time (e.g. "2026-08-24T14:00:00+07:00")',
          required: true,
        },
        endDateTime: {
          type: 'string',
          description: 'ISO 8601 formatted end time (e.g. "2026-08-24T15:00:00+07:00")',
          required: true,
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of attendee email addresses to invite',
        },
      },
      required: ['summary', 'startDateTime', 'endDateTime'],
    },
  },
  {
    name: 'calendar_update_event',
    connectorId: 'calendar',
    description: 'Update or reschedule an existing calendar event.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to modify',
          required: true,
        },
        summary: {
          type: 'string',
          description: 'Updated meeting title',
        },
        description: {
          type: 'string',
          description: 'Updated description',
        },
        location: {
          type: 'string',
          description: 'Updated location',
        },
        startDateTime: {
          type: 'string',
          description: 'New start time (ISO 8601)',
        },
        endDateTime: {
          type: 'string',
          description: 'New end time (ISO 8601)',
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated list of attendee emails',
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'calendar_delete_event',
    connectorId: 'calendar',
    description: 'Cancel or delete an event from Google Calendar by ID.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'The ID of the event to delete/cancel',
          required: true,
        },
      },
      required: ['eventId'],
    },
  },

  // --- GOOGLE DRIVE TOOLS (CRUD) ---
  {
    name: 'drive_list_files',
    connectorId: 'google_drive',
    description: 'Search, list, and filter documents, sheets, and files stored in Google Drive.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Filename keyword or content search query (e.g. "Roadmap", "Financial", "Design")',
        },
        mimeType: {
          type: 'string',
          description: 'Filter by file type (e.g. "text/markdown", "text/csv", "pdf", "document")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum files to return (default 5)',
        },
      },
    },
  },
  {
    name: 'drive_get_file_content',
    connectorId: 'google_drive',
    description: 'Read the full text content, document body, or spreadsheet data of a Google Drive file.',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The unique ID of the Google Drive file',
          required: true,
        },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'drive_create_file',
    connectorId: 'google_drive',
    description: 'Create and upload a new document, note, or file in Google Drive.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Filename including extension (e.g. "Meeting_Notes.md", "Project_Brief.txt")',
          required: true,
        },
        content: {
          type: 'string',
          description: 'Text content to save in the document',
          required: true,
        },
        mimeType: {
          type: 'string',
          description: 'MIME type of the document (default: text/plain)',
        },
      },
      required: ['name', 'content'],
    },
  },
  {
    name: 'drive_update_file',
    connectorId: 'google_drive',
    description: 'Update or replace the text content of an existing Google Drive document.',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The ID of the file to update',
          required: true,
        },
        name: {
          type: 'string',
          description: 'Optional new filename',
        },
        content: {
          type: 'string',
          description: 'New file content to replace existing body',
        },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'drive_delete_file',
    connectorId: 'google_drive',
    description: 'Move a Google Drive file to the Trash / delete it.',
    parameters: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The ID of the file to trash',
          required: true,
        },
      },
      required: ['fileId'],
    },
  },

  // --- NOTION TOOLS (CRUD) ---
  {
    name: 'notion_search',
    connectorId: 'notion',
    description: 'Search pages and databases in the connected Notion workspace.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text (e.g. "Meeting Notes", "Roadmap", "Sprint")',
        },
        filter: {
          type: 'string',
          description: 'Filter results by type: "page" or "database"',
          enum: ['page', 'database'],
        },
        maxResults: {
          type: 'number',
          description: 'Maximum results to return (default 10)',
        },
      },
    },
  },
  {
    name: 'notion_get_page',
    connectorId: 'notion',
    description: 'Get the full content of a Notion page by its ID.',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The unique ID of the Notion page',
          required: true,
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'notion_create_page',
    connectorId: 'notion',
    description: 'Create a new page in Notion under a parent page or database.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the new page',
          required: true,
        },
        content: {
          type: 'string',
          description: 'Markdown-style body content for the page',
          required: true,
        },
        parentPageId: {
          type: 'string',
          description: 'ID of the parent page (use this OR parentDatabaseId)',
        },
        parentDatabaseId: {
          type: 'string',
          description: 'ID of the parent database (use this OR parentPageId)',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'notion_update_page',
    connectorId: 'notion',
    description: 'Update a Notion page title and/or append new content blocks.',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the page to update',
          required: true,
        },
        title: {
          type: 'string',
          description: 'New title for the page (optional)',
        },
        appendContent: {
          type: 'string',
          description: 'Text to append as new blocks at the bottom of the page',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'notion_archive_page',
    connectorId: 'notion',
    description: 'Archive (soft-delete) a Notion page by its ID.',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the Notion page to archive',
          required: true,
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'notion_query_database',
    connectorId: 'notion',
    description: 'Query rows from a Notion database with optional filters.',
    parameters: {
      type: 'object',
      properties: {
        databaseId: {
          type: 'string',
          description: 'The ID of the Notion database to query',
          required: true,
        },
        maxResults: {
          type: 'number',
          description: 'Maximum rows to return (default 10)',
        },
      },
      required: ['databaseId'],
    },
  },

  // --- GITHUB TOOLS (CRUD) ---
  {
    name: 'github_list_repos',
    connectorId: 'github',
    description: 'List the authenticated user\'s GitHub repositories.',
    parameters: {
      type: 'object',
      properties: {
        sort: {
          type: 'string',
          description: 'Sort by: "updated" (default), "created", "pushed", "full_name"',
          enum: ['updated', 'created', 'pushed', 'full_name'],
        },
        visibility: {
          type: 'string',
          description: 'Filter by visibility: "all" (default), "public", "private"',
          enum: ['all', 'public', 'private'],
        },
        maxResults: {
          type: 'number',
          description: 'Maximum repos to return (default 10)',
        },
      },
    },
  },
  {
    name: 'github_list_issues',
    connectorId: 'github',
    description: 'List issues in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or org)',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        state: {
          type: 'string',
          description: 'Filter by state: "open" (default), "closed", "all"',
          enum: ['open', 'closed', 'all'],
        },
        labels: {
          type: 'string',
          description: 'Comma-separated labels to filter by (e.g. "bug,enhancement")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum issues to return (default 10)',
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_create_issue',
    connectorId: 'github',
    description: 'Create a new issue in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          required: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          required: true,
        },
        title: {
          type: 'string',
          description: 'Issue title',
          required: true,
        },
        body: {
          type: 'string',
          description: 'Issue body/description (markdown supported)',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to apply (e.g. ["bug", "help wanted"])',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'GitHub usernames to assign',
        },
      },
      required: ['owner', 'repo', 'title'],
    },
  },
  {
    name: 'github_update_issue',
    connectorId: 'github',
    description: 'Update an existing GitHub issue (title, body, state, or labels).',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner', required: true },
        repo: { type: 'string', description: 'Repository name', required: true },
        issueNumber: { type: 'number', description: 'Issue number to update', required: true },
        title: { type: 'string', description: 'New title (optional)' },
        body: { type: 'string', description: 'New body text (optional)' },
        state: { type: 'string', description: '"open" or "closed"', enum: ['open', 'closed'] },
        labels: { type: 'array', items: { type: 'string' }, description: 'New labels list' },
      },
      required: ['owner', 'repo', 'issueNumber'],
    },
  },
  {
    name: 'github_list_pull_requests',
    connectorId: 'github',
    description: 'List pull requests in a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner', required: true },
        repo: { type: 'string', description: 'Repository name', required: true },
        state: {
          type: 'string',
          description: 'Filter by state: "open" (default), "closed", "all"',
          enum: ['open', 'closed', 'all'],
        },
        maxResults: { type: 'number', description: 'Maximum PRs to return (default 10)' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_list_commits',
    connectorId: 'github',
    description: 'List recent commits on a branch of a GitHub repository.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner', required: true },
        repo: { type: 'string', description: 'Repository name', required: true },
        branch: { type: 'string', description: 'Branch name (defaults to default branch)' },
        maxResults: { type: 'number', description: 'Maximum commits to return (default 10)' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_close_issue',
    connectorId: 'github',
    description: 'Close an open GitHub issue.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner', required: true },
        repo: { type: 'string', description: 'Repository name', required: true },
        issueNumber: { type: 'number', description: 'Issue number to close', required: true },
      },
      required: ['owner', 'repo', 'issueNumber'],
    },
  },

  // --- ANTICEIL MEDIA TOOLS ---
  {
    name: 'anticeil_generate_image',
    connectorId: 'anticeil_image',
    description: 'Generate high-quality AI images, photos, illustrations, or document graphics based on a text prompt.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed prompt for image generation', required: true },
        aspectRatio: { type: 'string', description: 'Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4', enum: ['1:1', '16:9', '9:16', '4:3', '3:4'] },
        style: { type: 'string', description: 'Visual style (e.g. photorealistic, anime, 3d render, vector, oil painting)' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'anticeil_generate_video',
    connectorId: 'anticeil_video',
    description: 'Generate AI video clips, motion animations, or video sequences based on a text prompt.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt for video generation', required: true },
        duration: { type: 'number', description: 'Video duration in seconds (default 4)' },
        aspectRatio: { type: 'string', description: 'Aspect ratio: 16:9, 9:16, 1:1', enum: ['16:9', '9:16', '1:1'] },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'anticeil_generate_audio',
    connectorId: 'anticeil_audio',
    description: 'Generate AI voice speech, narration, background music, or sound effects.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Text to speak or sound/music description', required: true },
        audioMode: { type: 'string', description: 'Type: speech, music, sound_effects', enum: ['speech', 'music', 'sound_effects'] },
        voice: { type: 'string', description: 'Voice profile name for speech' },
      },
      required: ['prompt'],
    },
  },

  // --- CUSTOM WEBHOOK TOOLS ---
  {
    name: 'custom_webhook_send',
    connectorId: 'custom_webhook',
    description: 'Send an HTTP request (POST, GET, PUT, DELETE, PATCH) to a custom REST API or webhook endpoint.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The target webhook or REST API URL',
          required: true,
        },
        method: {
          type: 'string',
          description: 'HTTP method: GET, POST, PUT, DELETE, PATCH (default POST)',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        },
        headers: {
          type: 'object',
          description: 'Optional custom headers key-value map (e.g. {"Authorization": "Bearer ...", "X-Custom": "..."})',
        },
        payload: {
          type: 'object',
          description: 'JSON request payload body for POST/PUT/PATCH',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'custom_webhook_trigger',
    connectorId: 'custom_webhook',
    description: 'Trigger the configured default workspace webhook endpoint with custom event and data payload.',
    parameters: {
      type: 'object',
      properties: {
        event: {
          type: 'string',
          description: 'Event name or action type (e.g. "deploy", "notify", "sync")',
        },
        data: {
          type: 'object',
          description: 'Event data / payload to transmit',
        },
      },
    },
  },
];

export async function executeConnectorTool(
  toolCall: ToolCallRequest,
  clients: {
    gmail?: GmailConnectorClient;
    calendar?: CalendarConnectorClient;
    drive?: GoogleDriveConnectorClient;
    notion?: NotionConnectorClient;
    github?: GitHubConnectorClient;
    customWebhookUrl?: string;
    customWebhookToken?: string;
    customWebhookHeaders?: Record<string, string>;
  }
): Promise<ToolCallResult> {
  const { id, name, arguments: args } = toolCall;
  const toolDef = CONNECTOR_TOOLS.find((t) => t.name === name);

  if (!toolDef) {
    return {
      toolCallId: id,
      toolName: name,
      connectorId: 'custom_webhook',
      status: 'error',
      error: `Unknown tool: ${name}`,
      summary: `Failed: Tool ${name} not found`,
      executedAt: Date.now(),
    };
  }

  try {
    // Media tools handling
    if (toolDef.connectorId === 'anticeil_image') {
      const prompt = args.prompt || 'Generated image';
      const aspectRatio = args.aspectRatio || '1:1';
      return {
        toolCallId: id,
        toolName: name,
        connectorId: 'anticeil_image',
        status: 'success',
        data: { prompt, aspectRatio, mediaType: 'image' },
        summary: `Anticeil Image: Generated image for "${prompt}" (${aspectRatio})`,
        executedAt: Date.now(),
      };
    }

    if (toolDef.connectorId === 'anticeil_video') {
      const prompt = args.prompt || 'Generated video';
      return {
        toolCallId: id,
        toolName: name,
        connectorId: 'anticeil_video',
        status: 'success',
        data: { prompt, mediaType: 'video' },
        summary: `Anticeil Video: Generated video clip for "${prompt}"`,
        executedAt: Date.now(),
      };
    }

    if (toolDef.connectorId === 'anticeil_audio') {
      const prompt = args.prompt || 'Generated audio';
      return {
        toolCallId: id,
        toolName: name,
        connectorId: 'anticeil_audio',
        status: 'success',
        data: { prompt, mediaType: 'audio' },
        summary: `Anticeil Audio: Generated audio for "${prompt}"`,
        executedAt: Date.now(),
      };
    }

    // 1. Gmail Tools
    if (toolDef.connectorId === 'gmail') {
      const gmail = clients.gmail || new GmailConnectorClient({});

      switch (name) {
        case 'gmail_list_emails':
        case 'gmail_list_messages': {
          const res = await gmail.listMessages(args);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'gmail',
            status: 'success',
            data: res,
            summary: `Found ${res.messages.length} email(s) in Gmail inbox.`,
            executedAt: Date.now(),
          };
        }
        case 'gmail_get_message': {
          const res = await gmail.getMessage(args.messageId);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'gmail',
            status: 'success',
            data: res,
            summary: `Retrieved email from ${res.from}: "${res.subject}"`,
            executedAt: Date.now(),
          };
        }
        case 'gmail_send_message': {
          const res = await gmail.sendMessage(args as any);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'gmail',
            status: 'success',
            data: res,
            summary: `Email sent to ${args.to} ("${args.subject}")`,
            executedAt: Date.now(),
          };
        }
        case 'gmail_create_draft': {
          const res = await gmail.createDraft(args as any);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'gmail',
            status: 'success',
            data: res,
            summary: `Draft created for ${args.to}: "${args.subject}"`,
            executedAt: Date.now(),
          };
        }
        case 'gmail_trash_message': {
          const res = await gmail.trashMessage(args.messageId);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'gmail',
            status: 'success',
            data: res,
            summary: `Email moved to Trash.`,
            executedAt: Date.now(),
          };
        }
      }
    }

    // 2. Calendar Tools
    if (toolDef.connectorId === 'calendar') {
      const calendar = clients.calendar || new CalendarConnectorClient({});

      switch (name) {
        case 'calendar_list_events': {
          const res = await calendar.listEvents(args);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'calendar',
            status: 'success',
            data: res,
            summary: `Found ${res.events.length} calendar event(s).`,
            executedAt: Date.now(),
          };
        }
        case 'calendar_get_event': {
          const res = await calendar.getEvent(args.eventId);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'calendar',
            status: 'success',
            data: res,
            summary: `Retrieved event details: "${res.summary}"`,
            executedAt: Date.now(),
          };
        }
        case 'calendar_create_event': {
          const res = await calendar.createEvent(args as any);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'calendar',
            status: 'success',
            data: res,
            summary: `Meeting scheduled: "${res.event.summary}" for ${new Date(res.event.start.dateTime || '').toLocaleString()}`,
            executedAt: Date.now(),
          };
        }
        case 'calendar_update_event': {
          const res = await calendar.updateEvent(args as any);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'calendar',
            status: 'success',
            data: res,
            summary: `Meeting "${res.event.summary}" updated.`,
            executedAt: Date.now(),
          };
        }
        case 'calendar_delete_event': {
          const res = await calendar.deleteEvent(args.eventId);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'calendar',
            status: 'success',
            data: res,
            summary: `Calendar event cancelled and removed.`,
            executedAt: Date.now(),
          };
        }
      }
    }

    // 3. Google Drive Tools
    if (toolDef.connectorId === 'google_drive') {
      const drive = clients.drive || new GoogleDriveConnectorClient({});

      switch (name) {
        case 'drive_list_files': {
          const res = await drive.listFiles(args);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'google_drive',
            status: 'success',
            data: res,
            summary: `Found ${res.files.length} file(s) in Google Drive.`,
            executedAt: Date.now(),
          };
        }
        case 'drive_get_file_content': {
          const res = await drive.getFileContent(args.fileId);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'google_drive',
            status: 'success',
            data: res,
            summary: `Retrieved content of "${res.file.name}" (${res.content.length} characters).`,
            executedAt: Date.now(),
          };
        }
        case 'drive_create_file': {
          const res = await drive.createFile(args as any);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'google_drive',
            status: 'success',
            data: res,
            summary: `Document "${res.file.name}" created in Google Drive.`,
            executedAt: Date.now(),
          };
        }
        case 'drive_update_file': {
          const res = await drive.updateFile(args as any);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'google_drive',
            status: 'success',
            data: res,
            summary: `Document "${res.file.name}" updated.`,
            executedAt: Date.now(),
          };
        }
        case 'drive_delete_file': {
          const res = await drive.deleteFile(args.fileId);
          return {
            toolCallId: id,
            toolName: name,
            connectorId: 'google_drive',
            status: 'success',
            data: res,
            summary: `File deleted from Google Drive.`,
            executedAt: Date.now(),
          };
        }
      }
    }

    // 4. Notion Tools
    if (toolDef.connectorId === 'notion') {
      if (!clients.notion) throw new Error('Notion connector is not connected. Please connect Notion first.');
      const notion = clients.notion;

      switch (name) {
        case 'notion_search': {
          const res = await notion.search(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'notion', status: 'success',
            data: res,
            summary: `Found ${res.results.length} result(s) in Notion.`,
            executedAt: Date.now(),
          };
        }
        case 'notion_get_page': {
          const res = await notion.getPageContent(args.pageId);
          return {
            toolCallId: id, toolName: name, connectorId: 'notion', status: 'success',
            data: res,
            summary: `Retrieved Notion page "${res.page.title}" (${res.content.length} chars).`,
            executedAt: Date.now(),
          };
        }
        case 'notion_create_page': {
          const res = await notion.createPage(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'notion', status: 'success',
            data: res,
            summary: res.message,
            executedAt: Date.now(),
          };
        }
        case 'notion_update_page': {
          const res = await notion.updatePage(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'notion', status: 'success',
            data: res,
            summary: res.message,
            executedAt: Date.now(),
          };
        }
        case 'notion_archive_page': {
          const res = await notion.archivePage(args.pageId);
          return {
            toolCallId: id, toolName: name, connectorId: 'notion', status: 'success',
            data: res,
            summary: res.message,
            executedAt: Date.now(),
          };
        }
        case 'notion_query_database': {
          const res = await notion.queryDatabase(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'notion', status: 'success',
            data: res,
            summary: `Queried Notion database: ${res.results.length} row(s) found.`,
            executedAt: Date.now(),
          };
        }
      }
    }

    // 5. GitHub Tools
    if (toolDef.connectorId === 'github') {
      if (!clients.github) throw new Error('GitHub connector is not connected. Please connect GitHub first.');
      const github = clients.github;

      switch (name) {
        case 'github_list_repos': {
          const res = await github.listRepos(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'github', status: 'success',
            data: res,
            summary: `Found ${res.repos.length} GitHub repo(s).`,
            executedAt: Date.now(),
          };
        }
        case 'github_list_issues': {
          const res = await github.listIssues(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'github', status: 'success',
            data: res,
            summary: `Found ${res.issues.length} issue(s) in ${args.owner}/${args.repo}.`,
            executedAt: Date.now(),
          };
        }
        case 'github_create_issue': {
          const res = await github.createIssue(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'github', status: 'success',
            data: res,
            summary: res.message,
            executedAt: Date.now(),
          };
        }
        case 'github_update_issue': {
          const res = await github.updateIssue(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'github', status: 'success',
            data: res,
            summary: res.message,
            executedAt: Date.now(),
          };
        }
        case 'github_list_pull_requests': {
          const res = await github.listPullRequests(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'github', status: 'success',
            data: res,
            summary: `Found ${res.pullRequests.length} PR(s) in ${args.owner}/${args.repo}.`,
            executedAt: Date.now(),
          };
        }
        case 'github_list_commits': {
          const res = await github.listCommits(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'github', status: 'success',
            data: res,
            summary: `Found ${res.commits.length} commit(s) in ${args.owner}/${args.repo}.`,
            executedAt: Date.now(),
          };
        }
        case 'github_close_issue': {
          const res = await github.closeIssue(args as any);
          return {
            toolCallId: id, toolName: name, connectorId: 'github', status: 'success',
            data: res,
            summary: res.message,
            executedAt: Date.now(),
          };
        }
      }
    }

    // 6. Anticeil Media Tools
    const _cid = toolDef.connectorId as string;
    if (
      _cid === 'anticeil_image' ||
      _cid === 'anticeil_video' ||
      _cid === 'anticeil_audio'
    ) {
      const cleanPrompt = String(args.prompt || 'illustration').trim();
      const encodedPrompt = encodeURIComponent(cleanPrompt);
      const seed = Math.floor(Math.random() * 100000);

      if (name === 'anticeil_generate_image') {
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true&model=flux`;
        return {
          toolCallId: id,
          toolName: name,
          connectorId: 'anticeil_image',
          status: 'success',
          data: {
            url: imageUrl,
            prompt: cleanPrompt,
            typstSnippet: `#align(center)[#image("${imageUrl}", width: 60%)]`,
            latexSnippet: `\\begin{figure}[htbp]\\centering\\includegraphics[width=0.6\\textwidth]{${imageUrl}}\\end{figure}`,
          },
          summary: `Berhasil membuat gambar AI untuk prompt "${cleanPrompt}". URL: ${imageUrl}`,
          executedAt: Date.now(),
        };
      } else if (name === 'anticeil_generate_video') {
        const videoUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1280&height=720&nologo=true&model=flux`;
        return {
          toolCallId: id,
          toolName: name,
          connectorId: 'anticeil_video',
          status: 'success',
          data: { url: videoUrl, prompt: cleanPrompt },
          summary: `Berhasil membuat video AI untuk prompt "${cleanPrompt}".`,
          executedAt: Date.now(),
        };
      } else if (name === 'anticeil_generate_audio') {
        return {
          toolCallId: id,
          toolName: name,
          connectorId: 'anticeil_audio',
          status: 'success',
          data: { prompt: cleanPrompt },
          summary: `Berhasil menghasilkan audio AI untuk prompt "${cleanPrompt}".`,
          executedAt: Date.now(),
        };
      }
    }

    // 7. Custom Webhook Tools
    if (toolDef.connectorId === 'custom_webhook') {
      const targetUrl = args.url || clients.customWebhookUrl;
      if (!targetUrl) {
        throw new Error('No webhook URL specified. Please provide a url or configure the Custom Webhook connector.');
      }

      const method = (args.method || 'POST').toUpperCase();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(clients.customWebhookHeaders || {}),
        ...(clients.customWebhookToken ? { Authorization: `Bearer ${clients.customWebhookToken}` } : {}),
        ...(args.headers || {}),
      };

      const payload = args.payload ?? (args.event || args.data ? { event: args.event, data: args.data } : args);
      const body = ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(payload);

      let resData: any;
      try {
        const response = await fetch(targetUrl, {
          method,
          headers,
          body,
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          resData = await response.json();
        } else {
          resData = await response.text();
        }

        return {
          toolCallId: id,
          toolName: name,
          connectorId: 'custom_webhook',
          status: response.ok ? 'success' : 'error',
          data: resData,
          summary: response.ok
            ? `Webhook [${method}] to ${targetUrl} succeeded with status ${response.status}.`
            : `Webhook [${method}] to ${targetUrl} failed with status ${response.status}.`,
          executedAt: Date.now(),
        };
      } catch (fetchErr: any) {
        throw new Error(`Failed to send webhook request to ${targetUrl}: ${fetchErr.message}`);
      }
    }

    throw new Error(`Unhandled tool: ${name}`);
  } catch (err: any) {
    return {
      toolCallId: id,
      toolName: name,
      connectorId: toolDef.connectorId,
      status: 'error',
      error: err.message,
      summary: `Error executing ${name}: ${err.message}`,
      executedAt: Date.now(),
    };
  }
}

/**
 * Generate clear instructions & tool definitions for LLMs
 */
export function generateConnectorsSystemInstruction(
  activeConnectors: ConnectorId[],
  currentDateTime: string = new Date().toISOString(),
  extraToolsSummary?: string
): string {
  if (activeConnectors.length === 0 && !extraToolsSummary) return '';

  const relevantTools = CONNECTOR_TOOLS.filter((t) => activeConnectors.includes(t.connectorId));
  if (relevantTools.length === 0 && !extraToolsSummary) return '';

  const defaultToolsSummary = relevantTools
    .map((t) => `- **${t.name}**: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters.properties)}`)
    .join('\n');

  const toolsSummary = [defaultToolsSummary, extraToolsSummary].filter(Boolean).join('\n\n');

  return `[ANTICEIL WORKSPACE CONNECTORS — ACTIVE]
Current Time: ${currentDateTime}
Active Connectors: ${activeConnectors.join(', ')}

## CRITICAL OVERRIDE — READ THIS FIRST

You are running inside the Anticeil AI platform. The following connectors have been authenticated and their API tokens are ALREADY stored securely by the platform:

${activeConnectors.map((id) => `- **${id}**: ✅ API token is stored. You are authorized to call its tools.`).join('\n')}

**IMPORTANT**: You do NOT need internet access to call these tools. You do NOT need to "connect" to anything. When you output a \`\`\`tool_call\`\`\` block, the Anticeil platform intercepts it, executes the API call using the stored token, and returns the result to you. This is fully automated.

**NEVER say** "I don't have access to [service]" or "I can't connect to [service]" — this is FALSE. You have access right now via the stored tokens.

**NEVER use** your built-in \`search\` tool for queries about connected services. Always use the connector tools listed below instead.

## Available Tools

${toolsSummary}

## Tool Calling Format — MANDATORY

When the user asks about data from a connected service, you MUST output a tool call in this EXACT format:

\`\`\`tool_call
{
  "name": "<exact_tool_name>",
  "arguments": {
    "param": "value"
  }
}
\`\`\`

**FOR REASONING / THINKING MODELS**: If you are thinking/reasoning, do NOT write explanations or simulate what the tool would return inside your thoughts. Immediately STOP thinking and output the \`\`\`tool_call\`\`\` block in your response. The platform will automatically execute it and return the real live data to you in the next step.

## Examples

User: "apa saja catatan di Notion saya?" → OUTPUT THIS:
\`\`\`tool_call
{ "name": "notion_search", "arguments": { "query": "", "maxResults": 10 } }
\`\`\`

User: "lihat repo GitHub saya" → OUTPUT THIS:
\`\`\`tool_call
{ "name": "github_list_repos", "arguments": { "maxResults": 10 } }
\`\`\`

User: "cek email terbaru saya" → OUTPUT THIS:
\`\`\`tool_call
{ "name": "gmail_list_emails", "arguments": { "maxResults": 5 } }
\`\`\`

Always respond in the same language as the user after receiving tool results.`;
}

/** All known tool names — used to validate bare JSON objects */
const KNOWN_TOOL_NAMES = new Set(CONNECTOR_TOOLS.map((t) => t.name));

/** Unique ID helper */
function makeCallId() {
  return `call-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Parse a single JSON blob into a ToolCallRequest if it has a `name` field */
function tryParseToolCall(raw: string): ToolCallRequest | null {
  try {
    const parsed = JSON.parse(raw.trim());
    const name = parsed.name as string | undefined;
    if (!name) return null;
    return {
      id: makeCallId(),
      name,
      arguments: parsed.arguments ?? parsed.params ?? parsed.args ?? parsed.input ?? {},
    };
  } catch {
    return null;
  }
}

/**
 * Scan `text` for top-level JSON objects `{...}` using balanced-brace counting.
 * Returns an array of { start, end, raw } where raw is the full object string.
 * This correctly handles nested objects like { "arguments": { "key": "val" } }.
 */
function extractTopLevelJsonObjects(text: string): Array<{ start: number; end: number; raw: string }> {
  const results: Array<{ start: number; end: number; raw: string }> = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '{') {
      let depth = 0;
      let inString = false;
      let escape = false;
      const start = i;
      for (let j = i; j < text.length; j++) {
        const ch = text[j];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            results.push({ start, end: j + 1, raw: text.slice(start, j + 1) });
            i = j + 1;
            break;
          }
        }
      }
      if (depth !== 0) break; // unterminated object — stop scanning
    } else {
      i++;
    }
  }
  return results;
}

/**
 * Robust parser for extracting tool calls from LLM generation.
 * Handles:
 *   1. ```tool_call / ```tool / ```json:tool_call blocks
 *   2. ```json blocks whose content contains a "name" matching a known tool
 *   3. <tool_call>...</tool_call> XML-style tags
 *   4. Bare top-level JSON objects { "name": "<known_tool>", ... }
 */
export function parseToolCallsFromLLM(text: string): { toolCalls: ToolCallRequest[]; cleanText: string } {
  const toolCalls: ToolCallRequest[] = [];
  const removedRanges: Array<[number, number]> = [];

  // 1. ```tool_call | ```tool | ```json:tool_call blocks
  const fencedToolRegex = /```(?:tool_call|json:tool_call|tool)[ \t]*\n?([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fencedToolRegex.exec(text)) !== null) {
    const tc = tryParseToolCall(m[1]);
    if (tc) {
      toolCalls.push(tc);
      removedRanges.push([m.index, m.index + m[0].length]);
    }
  }

  // 2. ```json blocks — only if body has a known tool name
  const fencedJsonRegex = /```json[ \t]*\n?([\s\S]*?)```/gi;
  while ((m = fencedJsonRegex.exec(text)) !== null) {
    // skip if already captured by rule 1
    const alreadyCaptured = removedRanges.some(([s, e]) => m!.index >= s && m!.index < e);
    if (alreadyCaptured) continue;
    const tc = tryParseToolCall(m[1]);
    if (tc && KNOWN_TOOL_NAMES.has(tc.name)) {
      toolCalls.push(tc);
      removedRanges.push([m.index, m.index + m[0].length]);
    }
  }

  // 3. <tool_call>...</tool_call> XML tags
  const xmlToolRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  while ((m = xmlToolRegex.exec(text)) !== null) {
    const tc = tryParseToolCall(m[1]);
    if (tc) {
      toolCalls.push(tc);
      removedRanges.push([m.index, m.index + m[0].length]);
    }
  }

  // 4. Bare top-level JSON objects that have a "name" matching a known tool.
  // Only try this if nothing found yet (expensive and noisy).
  if (toolCalls.length === 0) {
    const topLevelObjects = extractTopLevelJsonObjects(text);
    for (const { start, end, raw } of topLevelObjects) {
      const tc = tryParseToolCall(raw);
      if (tc && KNOWN_TOOL_NAMES.has(tc.name)) {
        toolCalls.push(tc);
        removedRanges.push([start, end]);
      }
    }
  }

  // Build cleanText by removing matched ranges (sort descending to preserve indices)
  let cleanText = text;
  if (removedRanges.length > 0) {
    const sorted = removedRanges.sort((a, b) => b[0] - a[0]);
    for (const [start, end] of sorted) {
      cleanText = cleanText.slice(0, start) + cleanText.slice(end);
    }
    cleanText = cleanText.trim();
  }

  return { toolCalls, cleanText };
}
