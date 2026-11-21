export type AiToolName =
  | 'launch_application'
  | 'send_direct_message'
  | 'send_colony_channel_message';

export interface LaunchAppArgs {
  appId: string;
  appName?: string;
  mode?: 'standalone' | 'channel' | 'navigation';
  colonyName?: string;
  channelName?: string;
}

export interface SendDirectMessageArgs {
  recipient: string;
  content: string;
}

export interface SendColonyChannelMessageArgs {
  colonyName: string;
  channelName: string;
  content: string;
}

export type AiToolArgs =
  | LaunchAppArgs
  | SendDirectMessageArgs
  | SendColonyChannelMessageArgs;

export interface AiToolCall {
  id: string;
  type: 'function';
  function: {
    name: AiToolName;
    arguments: string; // JSON string
  };
  parsedArgs?: AiToolArgs;
  status: 'pending' | 'executed' | 'cancelled';
  result?: {
    success: boolean;
    message: string;
    targetId?: string;
  };
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  toolCalls?: AiToolCall[];
}

export interface AiSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  messages: AiMessage[];
}

export interface GroqConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

export interface AiSystemContext {
  colonies: Array<{ id: string; name: string }>;
  channels: Array<{ id: string; name: string; colonyId?: string; type?: string }>;
  friends: Array<{ id: string; name: string; username?: string }>;
  apps: Array<{ id: string; name: string; description?: string }>;
  currentUser?: { id: string; name?: string; username?: string; email?: string };
}
