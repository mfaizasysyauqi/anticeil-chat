export interface CallLogItem {
  id: string;
  peerId: string;
  peerName: string;
  peerAvatar?: string | null;
  type: 'incoming' | 'outgoing' | 'missed';
  isVideo: boolean;
  channelId?: string;
  timestamp: string;
  duration?: string;
}

export type CallsTab = 'all' | 'missed';
