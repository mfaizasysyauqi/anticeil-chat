import React, { useRef, useEffect } from 'react';
import { ScreenShare, StopCircle, Maximize2, Monitor, ShieldCheck, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ColonyChannel } from '@/chat/chat-types';

export interface ScreenShareViewProps {
  channel: ColonyChannel;
  isScreenSharing?: boolean;
  screenStream?: MediaStream | null;
  currentUserName?: string;
  onToggleScreenShare?: () => void;
  onStopActivity?: () => void;
}

export function ScreenShareView({
  channel,
  isScreenSharing,
  screenStream,
  currentUserName,
  onToggleScreenShare,
  onStopActivity,
}: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const handleStart = async () => {
    if (onToggleScreenShare) {
      onToggleScreenShare();
    } else {
      toast.error('Koneksi panggilan suara tidak aktif.');
    }
  };

  const handleStop = () => {
    if (isScreenSharing && onToggleScreenShare) {
      onToggleScreenShare();
    }
    if (onStopActivity) {
      onStopActivity();
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-3 lg:p-6 bg-zinc-950 text-foreground overflow-hidden select-none">
      {screenStream ? (
        /* Active Screen Share Video Stage */
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />

          {/* Top Overlay Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
            <Radio className="size-3 text-red-500 animate-pulse" />
            <span className="font-semibold text-white">Live Screen Share</span>
            <span className="text-[10px] text-zinc-400">1080p @ 60fps</span>
          </div>

          {/* Bottom Control Bar on Hover */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-700/80 shadow-lg opacity-90 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              className="h-8 gap-1.5 text-xs bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-white"
            >
              <Maximize2 className="size-3.5" />
              Layar Penuh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <StopCircle className="size-3.5" />
              Hentikan Berbagi
            </Button>
          </div>
        </div>
      ) : (
        /* Empty / Prompt Stage */
        <div className="max-w-md w-full flex flex-col items-center text-center p-6 lg:p-8 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-5">
          <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
            <Monitor className="size-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold tracking-tight text-white">
              Berbagi Layar (Share Screen)
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bagikan presentasi, jendela IDE kode, tab browser, atau seluruh layar monitor Anda secara real-time ke rekan satu channel #{channel.name}.
            </p>
          </div>

          <div className="w-full flex flex-col gap-2 pt-2">
            <Button
              size="default"
              onClick={handleStart}
              className="w-full h-10 gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
            >
              <ScreenShare className="size-4" />
              Mulai Bagikan Layar Sekarang
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 pt-1">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Transmisi WebRTC terenkripsi end-to-end tanpa rekaman colony</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
