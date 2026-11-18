import React from 'react';
import { Bell, ChevronDown, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface VoiceSoundsSectionProps {
  t: (key: string) => string;
  soundDeafen: boolean;
  setSoundDeafen: (val: boolean) => void;
  soundUndeafen: boolean;
  setSoundUndeafen: (val: boolean) => void;
  soundMute: boolean;
  setSoundMute: (val: boolean) => void;
  soundUnmute: boolean;
  setSoundUnmute: (val: boolean) => void;
  playPreviewSound: (soundType: string) => void;
  showMoreSounds: boolean;
  setShowMoreSounds: (val: boolean) => void;
  moreSoundsState: Record<string, boolean>;
  setMoreSoundsState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onNavigateSection?: (section: string) => void;
}

const MORE_SOUNDS = [
  { key: 'cameraOn', label: 'Camera On', sound: 'cameraOn' },
  { key: 'cameraOff', label: 'Camera Off', sound: 'cameraOff' },
  { key: 'voiceConnected', label: 'Voice Connected', sound: 'voiceConnected' },
  { key: 'voiceDisconnected', label: 'Voice Disconnected', sound: 'voiceDisconnected' },
  { key: 'userJoin', label: 'User Join Voice', sound: 'userJoin' },
  { key: 'userLeave', label: 'User Leave Voice', sound: 'userLeave' },
  { key: 'screenShareStart', label: 'Screen Share Started', sound: 'screenShareStart' },
  { key: 'screenShareStop', label: 'Screen Share Stopped', sound: 'screenShareStop' },
  { key: 'pttActivate', label: 'Push to Talk Activate', sound: 'pttActivate' },
  { key: 'pttDeactivate', label: 'Push to Talk Deactivate', sound: 'pttDeactivate' },
  { key: 'streamStart', label: 'Stream Started', sound: 'streamStart' },
  { key: 'streamStop', label: 'Stream Stopped', sound: 'streamStop' },
  { key: 'activityLaunch', label: 'Activity Launch', sound: 'activityLaunch' },
  { key: 'activityEnd', label: 'Activity End', sound: 'activityEnd' },
  { key: 'muteMember', label: 'Mute Member', sound: 'muteMember' },
  { key: 'deafenMember', label: 'Deafen Member', sound: 'deafenMember' },
  { key: 'ringingOutgoing', label: 'Ringing Outgoing', sound: 'ring' },
  { key: 'soundboardQuack', label: 'Soundboard Quack', sound: 'quack' },
];

export const VoiceSoundsSection: React.FC<VoiceSoundsSectionProps> = ({
  t,
  soundDeafen,
  setSoundDeafen,
  soundUndeafen,
  setSoundUndeafen,
  soundMute,
  setSoundMute,
  soundUnmute,
  setSoundUnmute,
  playPreviewSound,
  showMoreSounds,
  setShowMoreSounds,
  moreSoundsState,
  setMoreSoundsState,
  onNavigateSection,
}) => {
  return (
    <div id="voice-sounds" className="scroll-mt-6 space-y-6 pt-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Sounds')}</h2>
      </div>

      {/* Core 4 sound rows */}
      <div className="space-y-3">
        {[
          { key: 'deafen', label: t('Deafen'), val: soundDeafen, set: setSoundDeafen },
          { key: 'undeafen', label: t('Undeafen'), val: soundUndeafen, set: setSoundUndeafen },
          { key: 'mute', label: t('Mute'), val: soundMute, set: setSoundMute },
          { key: 'unmute', label: t('Unmute'), val: soundUnmute, set: setSoundUnmute },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <div className="text-xs font-bold text-foreground">{item.label}</div>
              <button
                type="button"
                onClick={() => playPreviewSound(item.key)}
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer block mt-0.5"
              >
                {t('Preview Sound')}
              </button>
            </div>
            <Switch checked={item.val} onCheckedChange={item.set} />
          </div>
        ))}
      </div>

      {/* Accordion: Show 18 more sounds */}
      <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
        <button
          type="button"
          onClick={() => setShowMoreSounds(!showMoreSounds)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div>
            <div className="text-xs font-bold text-foreground">{t('Show 18 more sounds')}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t('Camera On, Camera Off, Voice Disconnected, and more')}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
              showMoreSounds && 'rotate-180',
            )}
          />
        </button>

        {showMoreSounds && (
          <div className="p-4 pt-1 space-y-3 border-t border-border/60 bg-muted/10">
            {MORE_SOUNDS.map((snd) => (
              <div key={snd.key} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-none">
                <div>
                  <div className="text-xs font-semibold text-foreground">{snd.label}</div>
                  <button
                    type="button"
                    onClick={() => playPreviewSound(snd.sound)}
                    className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    {t('Preview Sound')}
                  </button>
                </div>
                <Switch
                  checked={moreSoundsState[snd.key]}
                  onCheckedChange={(val) => setMoreSoundsState((prev) => ({ ...prev, [snd.key]: val }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Settings card */}
      <div className="space-y-2 pt-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t('Related Settings')}
        </div>
        <div
          onClick={() => {
            onNavigateSection?.('notifications');
            setTimeout(() => {
              document.getElementById('notifications-sounds')?.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          }}
          className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                {t('Notifications')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('Enable/disable sounds for new messages and incoming calls.')}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
};
