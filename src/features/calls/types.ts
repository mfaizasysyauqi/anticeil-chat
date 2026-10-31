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
  colonyId?: string;
  hubName?: string;
  hubIcon?: string | null;
  isDm?: boolean;
}

export type CallsTab = 'all' | 'missed';
