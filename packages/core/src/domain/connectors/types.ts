export type ConnectorId =
  | 'gmail'
  | 'calendar'
  | 'google_drive'
  | 'notion'
  | 'github'
  | 'custom_webhook'
  | 'anticeil_image'
  | 'anticeil_video'
  | 'anticeil_audio';

export type ConnectorStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface ConnectorAccount {
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export interface ConnectorConfig {
  id: ConnectorId;
  name: string;
  description: string;
  icon: string;
  status: ConnectorStatus;
  isEnabled: boolean;
  isSandboxMode: boolean; // 1-Click Interactive Demo Sandbox
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  scopes: string[];
  account?: ConnectorAccount;
  lastSyncedAt?: number;
  selectedModelId?: string;
  error?: string;
}

export interface ConnectorToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  items?: { type: string };
  default?: any;
}

export interface ConnectorToolDefinition {
  name: string;
  connectorId: ConnectorId;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ConnectorToolParameter>;
    required?: string[];
  };
}

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolCallResult {
  toolCallId: string;
  toolName: string;
  connectorId: ConnectorId;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  summary: string;
  executedAt: number;
}

// Gmail Domain Models
export interface GmailMessage {
  id: string;
  threadId?: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isUnread: boolean;
  isStarred?: boolean;
  labels?: string[];
}

export interface GmailDraft {
  id: string;
  to: string;
  subject: string;
  body: string;
  updatedAt: string;
}

// Calendar Domain Models
export interface CalendarAttendee {
  email: string;
  name?: string;
  responseStatus?: 'accepted' | 'tentative' | 'needsAction' | 'declined';
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string; // ISO 8601
    date?: string;     // YYYY-MM-DD
    timeZone?: string;
  };
  end: {
    dateTime?: string; // ISO 8601
    date?: string;     // YYYY-MM-DD
    timeZone?: string;
  };
  attendees?: CalendarAttendee[];
  htmlLink?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  meetLink?: string;
}

// Google Drive Domain Models
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  iconLink?: string;
  content?: string;
  modifiedTime: string;
  starred?: boolean;
  trashed?: boolean;
}
