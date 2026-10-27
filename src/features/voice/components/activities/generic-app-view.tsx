import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DiscordAppDefinition } from '../../data/discord-activities';

export interface GenericAppViewProps {
  currentActiveApp: DiscordAppDefinition;
  totalInCall: number;
  onStopActivity: () => void;
}

export function GenericAppView({
  currentActiveApp,
  totalInCall,
  onStopActivity,
}: GenericAppViewProps) {
  return (
    <div className="h-full min-h-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#111214] via-[#18191c] to-[#0f1012] overflow-y-auto select-none">
      <div className="w-full max-w-2xl bg-[#1e1f22] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-black">
          {currentActiveApp.bannerImage && (
            <img
              src={currentActiveApp.bannerImage}
              alt={currentActiveApp.title}
              className="w-full h-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f22] via-transparent to-black/40" />
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider text-black bg-white uppercase shadow-md">
              PROMOTED
            </span>
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg', currentActiveApp.iconBg)}>
              <currentActiveApp.icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white drop-shadow">{currentActiveApp.title}</h2>
              <span className="text-xs text-white/70">{currentActiveApp.developer}</span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#dbdee1] leading-relaxed">
            {currentActiveApp.description}
          </p>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Aktif bersama {totalInCall} peserta di saluran suara</span>
            </div>
            <Button
              size="sm"
              onClick={onStopActivity}
              variant="ghost"
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
            >
              Tutup Aktivitas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
