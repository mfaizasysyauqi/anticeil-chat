import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ColonyChannel } from '@/chat/chat-types';
import type { VoiceAppDefinition } from '@/features/voice/data/voice-activities';
import { ActivityStage } from '@/features/voice/components/activities/activity-stage';
import { MagneticFloatingCollapseButton } from '@/components/ui/magnetic-floating-collapse-button';
import { LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { ActivityAppBar } from './activity-app-bar';

export interface StandaloneAppStageProps {
  app: VoiceAppDefinition;
  onClose: () => void;
  onOpenSendToChannel?: () => void;
  currentUser?: any;
  socket?: any;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
}

export function StandaloneAppStage({
  app,
  onClose,
  onOpenSendToChannel: _onOpenSendToChannel,
  currentUser,
  socket,
  onOpenSidebar,
  horizontalPadding = LAYOUT_PAGE_SPACING.HORIZONTAL,
}: StandaloneAppStageProps) {
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const currentUserName =
    currentUser?.name ||
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    currentUser?.username ||
    'You';

  const standaloneChannel: ColonyChannel = {
    id: `standalone-${app.id}`,
    name: app.title,
    type: 'text',
    category: 'CHANNELS',
    colonyId: 'standalone',
    description: `Sesi Standalone ${app.title}`,
  };

  return (
    <div
      className={cn(
        'flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none relative rounded-none border-0',
        isTheaterMode && 'fixed inset-0 z-50 w-screen h-screen'
      )}
    >
      {/* Floating magnetic snap-to-edge collapse button when in theater mode */}
      {isTheaterMode && (
        <MagneticFloatingCollapseButton
          onCollapse={() => setIsTheaterMode(false)}
          tooltipText="Keluar Mode Sinematik (ESC)"
        />
      )}

      {/* ── Standalone App Bar (h-12) - Hidden in Theater Mode ────────────────── */}
      {!isTheaterMode && (
        <ActivityAppBar
          app={app}
          onClose={onClose}
          onToggleTheaterMode={() => setIsTheaterMode(true)}
          onOpenMobileChannels={onOpenSidebar}
          horizontalPadding={horizontalPadding}
        />
      )}

      {/* ── Main Activity Stage Body ────────────────────────── */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden relative rounded-none border-0">
        <ActivityStage
          activeAppId={app.id}
          currentActiveApp={app as any}
          channel={standaloneChannel}
          activeColony={null}
          currentUserName={currentUserName}
          currentUser={currentUser}
          participants={[]}
          totalInCall={1}
          socket={socket || null}
          onStopActivity={onClose}
          isScreenSharing={false}
          screenStream={null}
        />
      </div>
    </div>
  );
}
