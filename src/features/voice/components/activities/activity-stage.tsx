import React from 'react';
import { Socket } from 'socket.io-client';
import { ColonyChannel, Colony } from '@/chat/chat-types';
import { DiscordAppDefinition } from '../../data/voice-activities';
import { YouTubeWatchTogether } from './youtube-watch-together';
import { WhiteboardCanvas } from './whiteboard-canvas';
import { ChessGame } from './chess-game';
import { ScreenShareView } from './screen-share-view';
import { WordleGame } from './wordle-game';
import { TriviaGame } from './trivia-game';
import { ColonyAppStage } from './colony-app-stage';

export interface ActivityStageProps {
  activeAppId: string;
  currentActiveApp?: DiscordAppDefinition | null;
  channel: ColonyChannel;
  activeColony?: Colony | null;
  currentUserName: string;
  currentUser?: any;
  participants?: any[];
  totalInCall: number;
  socket: Socket | null;
  onStopActivity: () => void;
  isScreenSharing?: boolean;
  screenStream?: MediaStream | null;
  onToggleScreenShare?: () => void;
}

export function ActivityStage({
  activeAppId,
  currentActiveApp,
  channel,
  activeColony,
  currentUserName,
  currentUser,
  participants,
  totalInCall,
  socket,
  onStopActivity,
  isScreenSharing,
  screenStream,
  onToggleScreenShare,
}: ActivityStageProps) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col bg-background">
      {activeAppId === 'watch-together' && (
        <YouTubeWatchTogether
          channel={channel}
          currentUserName={currentUserName}
          currentUser={currentUser}
          participants={participants}
          socket={socket}
        />
      )}

      {activeAppId === 'whiteboard' && (
        <WhiteboardCanvas
          channel={channel}
          socket={socket}
          currentUser={currentUser}
          currentUserName={currentUserName}
          participants={participants}
        />
      )}

      {activeAppId === 'chess' && (
        <ChessGame
          channel={channel}
          socket={socket}
          currentUserName={currentUserName}
          currentUser={currentUser}
          participants={participants}
        />
      )}

      {activeAppId === 'screenshare' && (
        <ScreenShareView
          channel={channel}
          isScreenSharing={isScreenSharing}
          screenStream={screenStream}
          currentUserName={currentUserName}
          onToggleScreenShare={onToggleScreenShare}
          onStopActivity={onStopActivity}
        />
      )}

      {activeAppId === 'wordle' && (
        <WordleGame
          channel={channel}
          socket={socket}
          currentUserName={currentUserName}
          currentUser={currentUser}
          participants={participants}
        />
      )}

      {activeAppId === 'trivia' && (
        <TriviaGame
          channel={channel}
          socket={socket}
          currentUserName={currentUserName}
          currentUser={currentUser}
          participants={participants}
        />
      )}

      {activeAppId !== 'watch-together' &&
        activeAppId !== 'whiteboard' &&
        activeAppId !== 'chess' &&
        activeAppId !== 'screenshare' &&
        activeAppId !== 'wordle' &&
        activeAppId !== 'trivia' && (
          <ColonyAppStage
            appId={activeAppId}
            channel={channel}
            activeColony={activeColony}
            socket={socket}
            currentUserName={currentUserName}
            currentUser={currentUser}
            participants={participants}
          />
        )}
    </div>
  );
}
