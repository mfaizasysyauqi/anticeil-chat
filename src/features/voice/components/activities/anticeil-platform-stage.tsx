import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import {
  ExternalLink,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const ssoUrl = getPlatformSsoUrl();

  const handleOpenExternal = () => {
    window.open(ssoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div
      className={`w-full h-full flex flex-col bg-background text-foreground select-none relative ${
        isFullscreen ? 'fixed inset-0 z-50 p-0' : ''
      }`}
    >
      {/* Top Action & Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card/70 backdrop-blur-md border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground truncate">
                Anticeil Platform
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 h-4 bg-primary/10 text-primary border-primary/30 hidden sm:inline-flex"
              >
                OFFICIAL
              </Badge>
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="w-2.5 h-2.5 hidden sm:inline" />
                <span>SSO Aktif</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground truncate hidden md:block">
              Platform alur kerja, otomasi & ekosistem terpadu Anticeil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReload}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Muat Ulang"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleOpenExternal}
            className="h-8 gap-1.5 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka di Tab Baru</span>
          </Button>
        </div>
      </div>

      {/* Embedded Platform IFrame Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-card">
        <iframe
          key={iframeKey}
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
