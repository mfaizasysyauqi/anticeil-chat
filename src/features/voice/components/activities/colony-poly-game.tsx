import React, { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import {
  Dices,
  RotateCcw,
  Maximize2,
  Minimize2,
  Info,
  ExternalLink,
  ShieldCheck,
  Bot,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { ColonyChannel } from '@/chat/chat-types';

export interface ColonyPolyGameProps {
  channel: ColonyChannel;
  socket: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

export function ColonyPolyGame({
  channel,
  currentUserName,
  currentUser,
}: ColonyPolyGameProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-scale board based on container width (standard board is ~1080px wide)
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      // Target board dimension: 1080w x 780h
      const scaleX = (clientWidth - 24) / 1080;
      const scaleY = (clientHeight - 24) / 780;
      const calculated = Math.min(1.05, Math.max(0.45, Math.min(scaleX, scaleY)));
      setScale(calculated);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [isFullscreen]);

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
    toast.info('Game Monopoly dimulai ulang.');
  };

  const handleOpenExternal = () => {
    window.open('/activities/monopoly/index.html', '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#070b14] text-foreground overflow-hidden select-none">
      {/* Top Bar Navigation */}
      <div className="h-11 px-3 border-b border-white/10 bg-[#0a1120] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Dices className="w-4 h-4 text-emerald-400" />
            <span>COLONY POLY</span>
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-bold border-emerald-500/40 text-emerald-300 bg-emerald-500/15 hidden sm:inline-flex"
          >
            Classic Engine (MIT)
          </Badge>
          <span className="text-[11px] text-muted-foreground hidden md:inline">
            • 2-8 Pemain & Bot AI
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReload}
            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
            title="Muat Ulang Permainan"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
            title="Buka di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Game Stage - Centered & Auto-Scaled */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative flex items-center justify-center p-2 overflow-hidden bg-[#070b14]"
      >
        <div
          style={{
            width: 1080,
            height: 780,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.8)] bg-[#080e1a]"
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src="/activities/monopoly/index.html"
            title="Colony Poly - Classic Edition"
            className="w-full h-full border-0 rounded-xl"
            allow="fullscreen; autoplay"
          />
        </div>
      </div>
    </div>
  );
}
