import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/core/i18n';

export interface StreamerModeSectionProps {
  streamerModeEnabled: boolean;
  setStreamerModeEnabled: (v: boolean) => void;
  autoStreamerModeObs: boolean;
  setAutoStreamerModeObs: (v: boolean) => void;
  streamerHidePersonalInfo: boolean;
  setStreamerHidePersonalInfo: (v: boolean) => void;
  streamerHideInviteLinks: boolean;
  setStreamerHideInviteLinks: (v: boolean) => void;
  streamerDisableSounds: boolean;
  setStreamerDisableSounds: (v: boolean) => void;
  streamerDisableNotifications: boolean;
  setStreamerDisableNotifications: (v: boolean) => void;
  streamerHideWindowCapture: boolean;
  setStreamerHideWindowCapture: (v: boolean) => void;
}

export function StreamerModeSection({
  streamerModeEnabled,
  setStreamerModeEnabled,
  autoStreamerModeObs,
  setAutoStreamerModeObs,
  streamerHidePersonalInfo,
  setStreamerHidePersonalInfo,
  streamerHideInviteLinks,
  setStreamerHideInviteLinks,
  streamerDisableSounds,
  setStreamerDisableSounds,
  streamerDisableNotifications,
  setStreamerDisableNotifications,
  streamerHideWindowCapture,
  setStreamerHideWindowCapture,
}: StreamerModeSectionProps) {
  const { t } = useTranslation();

  return (
    <div id="appearance-streamer-mode" className="scroll-mt-6 space-y-6 pt-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Streamer Mode')}</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div>
            <div className="text-xs font-bold text-foreground">{t('Enable Streamer Mode')}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t("Streamer Mode hides your personal info so others watching your stream can't see it.")}
            </div>
          </div>
          <Switch checked={streamerModeEnabled} onCheckedChange={setStreamerModeEnabled} />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground">
            {t('Automatically enable Streamer Mode if OBS or XSplit are running')}
          </div>
          <Switch checked={autoStreamerModeObs} onCheckedChange={setAutoStreamerModeObs} />
        </div>
      </div>

      {/* If Streamer Mode is enabled... */}
      <div className="space-y-3 pt-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t('If Streamer Mode is enabled...')}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <div className="text-xs font-semibold text-foreground">
              {t('Hide my personal information, such as email, connected accounts, and notes')}
            </div>
            <Switch checked={streamerHidePersonalInfo} onCheckedChange={setStreamerHidePersonalInfo} />
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <div className="text-xs font-semibold text-foreground">
              {t('Hide invite links to my Discord servers')}
            </div>
            <Switch checked={streamerHideInviteLinks} onCheckedChange={setStreamerHideInviteLinks} />
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <div className="text-xs font-semibold text-foreground">
              {t('Disable all sound effects')}
            </div>
            <Switch checked={streamerDisableSounds} onCheckedChange={setStreamerDisableSounds} />
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/50">
            <div className="text-xs font-semibold text-foreground">
              {t('Disable notifications')}
            </div>
            <Switch checked={streamerDisableNotifications} onCheckedChange={setStreamerDisableNotifications} />
          </div>
        </div>
      </div>

      {/* Hide window from screen capture */}
      <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
        <div>
          <div className="text-xs font-bold text-foreground">
            {t('Hide Discord Window from Screen Capture')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {t('Hides most Discord windows from most screen capture software.')}
          </div>
        </div>
        <Switch checked={streamerHideWindowCapture} onCheckedChange={setStreamerHideWindowCapture} />
      </div>
    </div>
  );
}
