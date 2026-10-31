import { channelsApi } from '@/features/channels/api/channels-api';
import { messagesApi } from '@/features/chat/api/messages-api';
import { membersApi } from '@/features/members/api/members-api';
import { coloniesApi } from '@/features/colonies/api/colonies-api';
import { threadsApi } from '@/features/threads/api/threads-api';

/**
 * Unified Chat API client for backward compatibility.
 * Composes domain-specific APIs from Feature-First modules:
 * - channelsApi: '@/features/channels'
 * - messagesApi: '@/features/chat'
 * - membersApi:  '@/features/members'
 * - coloniesApi: '@/features/colonies'
 * - threadsApi:  '@/features/threads'
 */
export const chatApi = {
  ...channelsApi,
  ...messagesApi,
  ...membersApi,
  ...coloniesApi,
  ...threadsApi,
};

export const colonyApi = chatApi;
export { channelsApi, messagesApi, membersApi, coloniesApi, threadsApi };
