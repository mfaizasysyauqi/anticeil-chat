export interface CallParticipant {
  socketId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  hasVideo: boolean;
  hasAudio: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
  stream?: MediaStream;
}

export type { DiscordAppDefinition } from './data/discord-activities';
