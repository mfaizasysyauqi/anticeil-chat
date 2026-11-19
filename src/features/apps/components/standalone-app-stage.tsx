import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Send,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  Radio,
  Tv,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColonyChannel } from '@/chat/chat-types';
import type { VoiceAppDefinition } from '@/features/voice/data/voice-activities';
import { ActivityStage } from '@/features/voice/components/activities/activity-stage';
import { YouTubeBadgeIcon } from '@/features/voice/components/call-stage';

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
  onOpenSendToChannel,
  currentUser,
  socket,
  onOpenSidebar,
  horizontalPadding = 'px-4 sm:px-6',
}: StandaloneAppStageProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const AppIcon = app.icon || Sparkles;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none relative">
      {/* ── Standalone App Bar (h-12) ────────────────────────── */}
      <div
        className={cn(
          'h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-md z-20 gap-2',
          horizontalPadding
        )}
      >
        {/* Left: Back button & App info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 rounded-lg -ml-1 cursor-pointer"
            title="Kembali ke Katalog Aplikasi"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Katalog</span>
          </Button>

          <div className="h-4 w-px bg-border/80 hidden sm:block" />

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
            <span className="text-sm font-bold text-foreground truncate max-w-[160px] sm:max-w-[240px]">
              {app.title}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenSendToChannel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenSendToChannel}
              className="h-8 text-xs font-medium gap-1.5 rounded-lg border-border hover:bg-muted text-foreground cursor-pointer"
              title="Bagikan atau buka bersama di channel / DM"
            >
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Kirim ke Saluran</span>
            </Button>
          )}

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
            onClick={handleToggleFullscreen}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg hidden sm:flex cursor-pointer"
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
