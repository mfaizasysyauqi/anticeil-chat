import React from 'react';
import { Users, Mic, Headphones, Pin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OverlayVoiceWidgetSectionProps {
  overlayAvatarSize: 'Large' | 'Small';
  setOverlayAvatarSize: (val: 'Large' | 'Small') => void;
  overlayDisplayNames: 'Always' | 'Only While Speaking' | 'Never';
  setOverlayDisplayNames: (val: 'Always' | 'Only While Speaking' | 'Never') => void;
  overlayDisplayUsers: 'Always' | 'Only While Speaking';
  setOverlayDisplayUsers: (val: 'Always' | 'Only While Speaking') => void;
  isVoiceWidgetPinned: boolean;
  setIsVoiceWidgetPinned: React.Dispatch<React.SetStateAction<boolean>>;
  t: (key: string) => string;
}

export function OverlayVoiceWidgetSection({
  overlayAvatarSize,
  setOverlayAvatarSize,
  overlayDisplayNames,
  setOverlayDisplayNames,
  overlayDisplayUsers,
  setOverlayDisplayUsers,
  isVoiceWidgetPinned,
  setIsVoiceWidgetPinned,
  t,
}: OverlayVoiceWidgetSectionProps) {
  return (
    <div id="overlay-voice-widget" className="scroll-mt-6 space-y-4 pt-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {t('Voice Widget')}
        </h2>
      </div>

      {/* Voice Widget Interactive Live Preview Container */}
      <div className="rounded-2xl border border-border/80 bg-[#1e1f22] p-8 flex items-center justify-center relative min-h-[260px] shadow-inner overflow-hidden">
        <div className="w-64 rounded-2xl bg-[#111214]/90 backdrop-blur-md border border-white/10 p-3.5 space-y-2.5 shadow-2xl">
          {/* Participant 1: zmsta */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'rounded-full bg-[#2b2d31] flex items-center justify-center text-xs overflow-hidden shrink-0 border border-border/60',
                overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
              )}
            >
              🐱
            </div>
            {overlayDisplayNames !== 'Never' && (
              <span className="text-xs font-semibold text-white/90 truncate">
                zmsta
              </span>
            )}
          </div>

          {/* Participant 2: Acetaminophen (Speaking state) */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0 ring-2 ring-emerald-500 shadow-sm shadow-emerald-500/50',
                overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
              )}
            >
              <Users className="w-3.5 h-3.5" />
            </div>
            {overlayDisplayNames !== 'Never' && (
              <span className="text-xs font-bold text-emerald-400 truncate">
                Acetaminophen
              </span>
            )}
            <Mic className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
          </div>

          {/* Participant 3: Kovanth */}
          {overlayDisplayUsers === 'Always' && (
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0',
                  overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                )}
              >
                <Users className="w-3.5 h-3.5" />
              </div>
              {overlayDisplayNames !== 'Never' && (
                <span className="text-xs font-semibold text-white/90 truncate">
                  Kovanth
                </span>
              )}
            </div>
          )}

          {/* Participant 4: Scynder (Deafened state) */}
          {overlayDisplayUsers === 'Always' && (
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0',
                  overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                )}
              >
                <Users className="w-3.5 h-3.5" />
              </div>
              {overlayDisplayNames !== 'Never' && (
                <span className="text-xs font-semibold text-white/90 truncate">
                  Scynder
                </span>
              )}
              <Headphones className="w-3.5 h-3.5 text-rose-500 ml-auto shrink-0" />
            </div>
          )}

          {/* Bottom Pill: Voice Channel & Pin */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-[11px] font-bold text-muted-foreground tracking-wide">
              {t('Voice Channel')}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsVoiceWidgetPinned(!isVoiceWidgetPinned);
                toast.success(
                  isVoiceWidgetPinned
                    ? t('Widget suara di-unpin')
                    : t('Widget suara di-pin ke overlay'),
                );
              }}
              className={cn(
                'size-6 rounded-full flex items-center justify-center transition-all cursor-pointer',
                isVoiceWidgetPinned
                  ? 'bg-[#5865F2] text-white shadow-sm'
                  : 'bg-white/10 text-muted-foreground hover:bg-white/20',
              )}
              title={isVoiceWidgetPinned ? t('Pinned') : t('Unpinned')}
            >
              <Pin className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="space-y-4 pt-2">
        {/* Avatar Size */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
          <span className="text-xs font-semibold text-foreground">
            {t('Avatar Size')}
          </span>
          <Select
            value={overlayAvatarSize}
            onValueChange={(val: 'Large' | 'Small') => {
              setOverlayAvatarSize(val);
              toast.success(t(`Ukuran avatar diubah ke ${val}`));
            }}
          >
            <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
              <SelectItem value="Large">{t('Large')}</SelectItem>
              <SelectItem value="Small">{t('Small')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display Names */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
          <span className="text-xs font-semibold text-foreground">
            {t('Display Names')}
          </span>
          <Select
            value={overlayDisplayNames}
            onValueChange={(val: any) => {
              setOverlayDisplayNames(val);
              toast.success(t(`Tampilan nama diubah ke ${val}`));
            }}
          >
            <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
              <SelectItem value="Always">{t('Always')}</SelectItem>
              <SelectItem value="Only While Speaking">
                {t('Only While Speaking')}
              </SelectItem>
              <SelectItem value="Never">{t('Never')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display Users */}
        <div className="flex items-center justify-between gap-4 py-2">
          <span className="text-xs font-semibold text-foreground">
            {t('Display Users')}
          </span>
          <Select
            value={overlayDisplayUsers}
            onValueChange={(val: any) => {
              setOverlayDisplayUsers(val);
              toast.success(t(`Tampilan user diubah ke ${val}`));
            }}
          >
            <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
              <SelectItem value="Always">{t('Always')}</SelectItem>
              <SelectItem value="Only While Speaking">
                {t('Only While Speaking')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
