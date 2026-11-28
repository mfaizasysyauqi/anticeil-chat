import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import {
  Sparkles,
  Bot,
  Terminal,
  Play,
  RotateCcw,
  Users,
  CheckCircle,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { ColonyChannel, Colony } from '@/chat/chat-types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ColonyAppStageProps {
  appId: string;
  channel: ColonyChannel;
  activeColony?: Colony | null;
  socket: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

export function ColonyAppStage({
  appId,
  channel,
  activeColony,
  socket,
  currentUserName = 'Pemain',
  currentUser,
  participants = [],
}: ColonyAppStageProps) {
  const [logs, setLogs] = useState<string[]>([
    `[SYS] Aktivitas ${appId} diinisialisasi di saluran suara #${channel.name}`,
    `[NET] WebRTC audio stream disinkronkan dengan panggung aktivitas`,
    `[INFO] Semua peserta channel otomatis terhubung ke sesi live`,
  ]);
  const [activeMembers, setActiveMembers] = useState<string[]>([currentUserName]);

  // Farm Merge Valley mini interactive state
  const [harvestCount, setHarvestCount] = useState(12);
  const [valleyLevel, setValleyLevel] = useState(3);

  const installedApp = activeColony?.installedApps?.find((a) => a.id === appId);
  const appTitle = installedApp?.name || (appId === 'farm-merge' ? 'Farm Merge Valley' : appId);

  const customApp = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('anticeil_my_custom_apps') || '[]');
      return saved.find((a: any) => a.id === appId);
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!socket) return;

    const handleColonyAppEvent = (data: {
      channelId?: string;
      action: string;
      payload?: any;
    }) => {
      if (!data || data.channelId !== channel.id) return;

      if (data.action === 'COLONY_APP_INTERACT') {
        const { senderName, actionType, count, level, logMsg } = data.payload || {};
        if (logMsg) {
          setLogs((prev) => [...prev.slice(-15), `[${senderName || 'Pemain'}] ${logMsg}`]);
        }
        if (typeof count === 'number') setHarvestCount(count);
        if (typeof level === 'number') setValleyLevel(level);
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleColonyAppEvent);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleColonyAppEvent);
    };
  }, [socket, channel.id]);

  const handleActionClick = (actionName: string) => {
    const nextHarvest = harvestCount + 1;
    let nextLvl = valleyLevel;
    if (nextHarvest % 10 === 0) {
      nextLvl += 1;
      toast.success(`🎉 Lembah naik level ke Level ${nextLvl}!`);
    } else {
      toast.info(`Berhasil memanen tanaman! Total panen: ${nextHarvest}`);
    }

    setHarvestCount(nextHarvest);
    setValleyLevel(nextLvl);
    const msg = `Memanen tanaman gandum emas (+1 panen)`;
    setLogs((prev) => [...prev.slice(-15), `[${currentUserName}] ${msg}`]);

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'COLONY_APP_INTERACT',
      payload: {
        senderName: currentUserName,
        actionType: actionName,
        count: nextHarvest,
        level: nextLvl,
        logMsg: msg,
      },
    });
  };

  if (customApp?.launchUrl) {
    return (
      <div className="w-full h-full flex flex-col bg-background text-foreground select-none overflow-hidden relative rounded-none border-0">
        <iframe
          src={customApp.launchUrl}
          title={customApp.title || appTitle}
          className="w-full h-full border-0 bg-background"
          allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground select-none overflow-y-auto custom-scrollbar p-4 sm:p-6 rounded-none border-0">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground capitalize">{appTitle}</h2>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                COLONY APP
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Aplikasi interaktif terhubung di server {activeColony?.name || 'Anticeil'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Terhubung Realtime</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 my-4 min-h-0 items-center justify-center">
        {/* Interactive Play Canvas / Game Board */}
        <div className="flex-1 max-w-[560px] w-full p-6 rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-md">
            <Flame className="w-10 h-10" />
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1">{appTitle} Co-Op Valley</h3>
          <p className="text-xs text-muted-foreground max-w-[360px] mb-6">
            Kelola pertanian dan kumpulkan hasil panen bersama rekan saluran suara secara realtime.
          </p>

          {/* Stats Badges */}
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-2 rounded-xl bg-muted/60 border border-border text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Tingkat Lembah</p>
              <p className="text-lg font-black text-primary">Level {valleyLevel}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-muted/60 border border-border text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Hasil Panen Bersama</p>
              <p className="text-lg font-black text-amber-500">{harvestCount} Unit</p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => handleActionClick('harvest')}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Panen Tanaman (+1)</span>
            </Button>
          </div>
        </div>

        {/* Live Activity Console Log */}
        <div className="w-full md:w-[280px] bg-card border border-border rounded-2xl p-4 flex flex-col h-[320px] shadow-xs">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/60">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Aktivitas Sesi
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 font-mono text-[11px] text-muted-foreground p-1">
            {logs.map((log, i) => (
              <div key={i} className="leading-relaxed break-words">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
