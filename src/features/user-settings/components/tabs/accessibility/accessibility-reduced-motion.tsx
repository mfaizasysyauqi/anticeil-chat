import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface AccessibilityReducedMotionProps {
  enableReducedMotion: boolean;
  setEnableReducedMotion: (v: boolean) => void;
  syncReducedMotionComputer: boolean;
  setSyncReducedMotionComputer: (v: boolean) => void;
  notificationDuration: number;
  setNotificationDuration: (v: number) => void;
  playGifsFocused: boolean;
  setPlayGifsFocused: (v: boolean) => void;
  playAnimatedEmoji: boolean;
  setPlayAnimatedEmoji: (v: boolean) => void;
  stickerAnimationMode: 'always' | 'interaction' | 'never';
  setStickerAnimationMode: (v: 'always' | 'interaction' | 'never') => void;
}

export function AccessibilityReducedMotion({
  enableReducedMotion,
  setEnableReducedMotion,
  syncReducedMotionComputer,
  setSyncReducedMotionComputer,
  notificationDuration,
  setNotificationDuration,
  playGifsFocused,
  setPlayGifsFocused,
  playAnimatedEmoji,
  setPlayAnimatedEmoji,
  stickerAnimationMode,
  setStickerAnimationMode,
}: AccessibilityReducedMotionProps) {
  const { t } = useTranslation();

  return (
    <div id="accessibility-reduced-motion" className="scroll-mt-[230px] space-y-6 pt-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Reduced Motion')}</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div>
            <div className="text-xs font-bold text-foreground">{t('Enable Reduced Motion')}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t('Reduce the amount and intensity of animations, hover effects, and other moving effects. Learn more.')}
            </div>
          </div>
          <Switch checked={enableReducedMotion} onCheckedChange={setEnableReducedMotion} />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground">
            {t('Sync with computer setting')}
          </div>
          <Switch checked={syncReducedMotionComputer} onCheckedChange={setSyncReducedMotionComputer} />
        </div>
      </div>

      {/* Minimum notification duration slider */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground">{t('Minimum notification duration')}</span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold">{notificationDuration}s</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {t('Keep pop up notifications on screen for at least this long. Notifications that already stay longer are unaffected.')}
        </div>
        <div className="pt-2">
          <input
            type="range"
            min="3"
            max="20"
            step="1"
            value={notificationDuration}
            onChange={(e) => setNotificationDuration(Number(e.target.value))}
            className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
            <span className="text-emerald-400 font-bold">3s</span>
            <span>5s</span>
            <span>10s</span>
            <span>15s</span>
            <span>20s</span>
          </div>
        </div>
      </div>

      {/* GIF & Animated Emoji switches */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground">
            {t('Play GIFs when Anticeil is focused')}
          </div>
          <Switch checked={playGifsFocused} onCheckedChange={setPlayGifsFocused} />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground">
            {t('Play animated emoji')}
          </div>
          <Switch checked={playAnimatedEmoji} onCheckedChange={setPlayAnimatedEmoji} />
        </div>
      </div>

      {/* Play sticker animations radio group */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-foreground">{t('Play sticker animations')}</div>
        <div className="space-y-2">
          {[
            { id: 'always', title: 'Always animate' },
            {
              id: 'interaction',
              title: 'Animate on interaction',
              desc: 'On the desktop client, stickers will animate on hover or focus. On mobile clients, stickers will animate on long-press.',
            },
            { id: 'never', title: 'Never animate' },
          ].map((st) => {
            const isSelected = stickerAnimationMode === st.id;
            return (
              <div
                key={st.id}
                onClick={() => setStickerAnimationMode(st.id as any)}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-primary/5 border-primary'
                    : 'bg-card border-border/70 hover:bg-muted/30',
                )}
              >
                <div className="mt-0.5 shrink-0">
                  <div
                    className={cn(
                      'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected ? 'border-primary' : 'border-muted-foreground/50',
                    )}
                  >
                    {isSelected && <div className="size-2 rounded-full bg-primary" />}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{st.title}</div>
                  {st.desc && <div className="text-[11px] text-muted-foreground mt-0.5">{st.desc}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
