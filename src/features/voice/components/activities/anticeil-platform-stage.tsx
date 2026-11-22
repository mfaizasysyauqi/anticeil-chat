import React from 'react';
import { Socket } from 'socket.io-client';
import type { ColonyChannel } from '@/chat/chat-types';
import { getPlatformSsoUrl } from '../../utils/platform-sso';

export interface AnticeilPlatformStageProps {
  channel: ColonyChannel;
  socket?: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

export function AnticeilPlatformStage({
  channel: _channel,
  socket: _socket,
  currentUserName: _currentUserName,
  currentUser: _currentUser,
  participants: _participants = [],
}: AnticeilPlatformStageProps) {
  const ssoUrl = getPlatformSsoUrl();

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground select-none relative overflow-hidden">
      {/* Embedded Platform IFrame Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-card">
        <iframe
          src={ssoUrl}
          title="Anticeil Platform"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </div>
    </div>
  );
}
