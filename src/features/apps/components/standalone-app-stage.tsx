import React, { useState } from 'react';
import {
  Share2,
  X,
  Maximize2,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColonyChannel } from '@/chat/chat-types';
import type { VoiceAppDefinition } from '@/features/voice/data/voice-activities';
import { ActivityStage } from '@/features/voice/components/activities/activity-stage';
import { YouTubeBadgeIcon } from '@/features/voice/components/call-stage';
import { MagneticFloatingCollapseButton } from '@/components/ui/magnetic-floating-collapse-button';
import { LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';

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
  onOpenSidebar: _onOpenSidebar,
  horizontalPadding = LAYOUT_PAGE_SPACING.HORIZONTAL,
}: StandaloneAppStageProps) {
  const [copied, setCopied] = useState(false);
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

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.pathname = '/applications';
    url.searchParams.set('activity', app.id);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    toast.success(`Tautan sesi standalone ${app.title} berhasil disalin!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const AppIcon = app.icon || Sparkles;

  return (
    <div
      className={cn(
        'flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none relative',
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
        <div
          className={cn(
            'h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-md z-20 gap-2',
            horizontalPadding
          )}
        >
          {/* Left: App info */}
          <div className="flex items-center gap-2 min-w-0">
            {app.id === 'watch-together' || app.id === 'youtube' ? (
              <YouTubeBadgeIcon className="w-5 h-3.5 shrink-0" />
            ) : (
              <div
                className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 shadow-xs',
                  app.iconBg || 'bg-primary'
                )}
              >
                <AppIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-sm font-bold text-foreground truncate max-w-[180px] sm:max-w-[280px]">
              {app.title}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              title="Salin Tautan Standalone"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsTheaterMode(true)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              title="Mode Sinematik (Layar Penuh)"
              aria-label="Mode Sinematik"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer ml-0.5"
              title="Tutup Aplikasi"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Activity Stage Body ────────────────────────── */}
      <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden relative">
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
