import React from 'react';
import { Socket } from 'socket.io-client';
import { CommunityChannel } from '@/chat/messages-types';
import { DiscordAppDefinition } from '../../data/discord-activities';
import { YouTubeWatchTogether } from './youtube-watch-together';
import { VirtualFisher } from './virtual-fisher';
import { WordleGame } from './wordle-game';
import { MagicGarden } from './magic-garden';
import { FlowCanvas } from './flow-canvas';
import { WhiteboardCanvas } from './whiteboard-canvas';
import { CodeRunner } from './code-runner';
import { GenericAppView } from './generic-app-view';

export interface ActivityStageProps {
  activeAppId: string;
  currentActiveApp?: DiscordAppDefinition | null;
  channel: CommunityChannel;
  currentUserName: string;
  totalInCall: number;
  socket: Socket | null;
  onStopActivity: () => void;
}

export function ActivityStage({
  activeAppId,
  currentActiveApp,
  channel,
  currentUserName,
  totalInCall,
  socket,
  onStopActivity,
}: ActivityStageProps) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col bg-background">
      {activeAppId === 'watch-together' && (
        <YouTubeWatchTogether
          channel={channel}
          currentUserName={currentUserName}
          socket={socket}
        />
      )}

      {activeAppId === 'virtual-fisher' && (
        <VirtualFisher currentUserName={currentUserName} />
      )}

      {activeAppId === 'wordle' && (
        <WordleGame />
      )}

      {activeAppId === 'magic-garden' && (
        <MagicGarden />
      )}

      {activeAppId === 'flow-canvas' && (
        <FlowCanvas channel={channel} socket={socket} />
      )}

      {activeAppId === 'whiteboard' && (
        <WhiteboardCanvas channel={channel} socket={socket} />
      )}

      {activeAppId === 'code-runner' && (
        <CodeRunner channel={channel} socket={socket} />
      )}

      {activeAppId &&
        !['watch-together', 'virtual-fisher', 'wordle', 'magic-garden', 'flow-canvas', 'whiteboard', 'code-runner'].includes(activeAppId) &&
        currentActiveApp && (
          <GenericAppView
            currentActiveApp={currentActiveApp}
            totalInCall={totalInCall}
            onStopActivity={onStopActivity}
          />
        )}
    </div>
  );
}
