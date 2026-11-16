import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import type { NoiseSuppressionType } from '@/features/voice/hooks/use-voice-settings';

export interface VoiceAudioSectionProps {
  settings: any;
  updateSetting: (key: any, val: any) => void;
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  isMicTesting: boolean;
  micVolumeLevel: number;
  startMicTest: () => void;
  stopMicTest: () => void;
}

export function VoiceAudioSection({
  settings,
  updateSetting,
  audioInputDevices,
  audioOutputDevices,
  isMicTesting,
  micVolumeLevel,
  startMicTest,
  stopMicTest,
}: VoiceAudioSectionProps) {
  const { t } = useTranslation();
  const [showAdvancedVoice, setShowAdvancedVoice] = useState(false);

  return (
    <div id="voice-voice" className="scroll-mt-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Voice')}</h2>
      </div>

      {/* Input & Output Devices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Microphone Select */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            {t('Microphone')}
          </label>
          <div className="relative">
            <select
              value={settings.inputDeviceId}
              onChange={(e) => updateSetting('inputDeviceId', e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
            >
              {audioInputDevices.length > 0 ? (
                audioInputDevices.map((d) => (
                  <option
                    key={d.deviceId}
                    value={d.deviceId}
                    className="bg-[#2b2d31] text-foreground"
                  >
                    {d.label || `Microphone (${d.deviceId.slice(0, 5)})`}
                  </option>
                ))
              ) : (
                <option value="default" className="bg-[#2b2d31] text-foreground">
                  Windows Default (Realtek(R) Audio)
                </option>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Speaker Select */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            {t('Speaker')}
          </label>
          <div className="relative">
            <select
              value={settings.outputDeviceId}
              onChange={(e) => updateSetting('outputDeviceId', e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
            >
              {audioOutputDevices.length > 0 ? (
                audioOutputDevices.map((d) => (
                  <option
                    key={d.deviceId}
                    value={d.deviceId}
                    className="bg-[#2b2d31] text-foreground"
                  >
                    {d.label || `Speaker (${d.deviceId.slice(0, 5)})`}
                  </option>
                ))
              ) : (
                <option value="default" className="bg-[#2b2d31] text-foreground">
                  Windows Default (soundcore R50i)
                </option>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Volume Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Microphone Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">
              {t('Microphone Volume')}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {settings.inputVolume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.inputVolume}
            onChange={(e) =>
              updateSetting('inputVolume', Number(e.target.value))
            }
            className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
          />
        </div>

        {/* Speaker Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">
              {t('Speaker Volume')}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {settings.outputVolume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.outputVolume}
            onChange={(e) =>
              updateSetting('outputVolume', Number(e.target.value))
            }
            className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
          />
        </div>
      </div>

      {/* Mic Test Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={isMicTesting ? stopMicTest : startMicTest}
            className={cn(
              'px-5 py-2 h-9 text-xs font-bold rounded-md transition-all shrink-0 cursor-pointer shadow-sm',
              isMicTesting
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
            )}
          >
            {isMicTesting ? t('Stop Testing') : t('Mic Test')}
          </Button>

          {/* Visual equalizer bars meter */}
          <div className="flex-1 flex items-center gap-[3px] h-7 px-3 py-1 bg-[#1e1f22] rounded-lg border border-border/60 overflow-hidden">
            {Array.from({ length: 48 }).map((_, i) => {
              const barThreshold = (i / 48) * 100;
              const isLit = isMicTesting && micVolumeLevel >= barThreshold;
              return (
                <span
                  key={i}
                  className={cn(
                    'flex-1 h-full rounded-[1px] transition-colors duration-75',
                    isLit
                      ? i > 36
                        ? 'bg-rose-500'
                        : i > 24
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      : 'bg-muted/40',
                  )}
                />
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t('Need help? Check out our')}{' '}
          <span
            onClick={() =>
              toast.info(
                t('Troubleshooting: Pastikan izin mikrofon browser Anda aktif.'),
              )
            }
            className="text-[#5865F2] hover:underline cursor-pointer font-medium"
          >
            {t('troubleshooting guide')}
          </span>
          .
        </p>
      </div>

      <div className="h-px bg-border/60 my-6" />

      {/* Input Profile */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          {t('Input Profile')}
        </label>
        <div className="space-y-2.5">
          {[
            {
              id: 'voice-isolation',
              title: 'Voice Isolation',
              desc: 'Just your beautiful voice: let Discord cut through the noise',
            },
            {
              id: 'studio',
              title: 'Studio',
              desc: 'Pure audio: open mic with no processing',
            },
            {
              id: 'custom',
              title: 'Custom',
              desc: 'Advanced mode: give me all the buttons and dials!',
            },
          ].map((prof) => {
            const isSelected = settings.inputProfile === prof.id;
            return (
              <div
                key={prof.id}
                onClick={() => updateSetting('inputProfile', prof.id as any)}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-[#5865F2]/5 border-[#5865F2] shadow-xs'
                    : 'bg-card border-border/70 hover:bg-muted/30',
                )}
              >
                <div className="mt-0.5 shrink-0">
                  <div
                    className={cn(
                      'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'border-[#5865F2]'
                        : 'border-muted-foreground/50',
                    )}
                  >
                    {isSelected && (
                      <div className="size-2 rounded-full bg-[#5865F2]" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-foreground">
                    {prof.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {prof.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automatically Adjust Input Sensitivity */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-foreground">
              {t('Automatically Adjust Input Sensitivity')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
              {t(
                'Controls how much sound Discord transmits from your mic. Speak to test your mic — if the meter is filled, Discord is transmitting your beautiful voice.',
              )}
            </div>
          </div>
          <Switch
            checked={settings.autoSensitivity}
            onCheckedChange={(val) => updateSetting('autoSensitivity', val)}
          />
        </div>

        {/* Horizontal Sensitivity Meter */}
        <div className="relative w-full h-3 bg-[#1e1f22] rounded-full overflow-hidden border border-border/60">
          <div
            className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-[#5865F2] transition-all duration-75"
            style={{
              width: `${isMicTesting ? Math.min(100, micVolumeLevel) : 35}%`,
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-sm"
            style={{ left: `${settings.sensitivityThreshold || 50}%` }}
          />
        </div>
      </div>

      {/* Noise Suppression (Krisp) */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card">
        <div>
          <div className="text-xs font-bold text-foreground">
            {t('Noise Suppression')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {t('Reduces background noise from your mic. Powered by')}{' '}
            <span className="text-[#5865F2] font-semibold">Krisp</span>.
          </div>
          <div className="mt-1 font-black text-sm tracking-tight text-foreground lowercase flex items-center gap-1">
            krisp
          </div>
        </div>
        <div className="relative shrink-0">
          <select
            value={settings.noiseSuppression}
            onChange={(e) =>
              updateSetting(
                'noiseSuppression',
                e.target.value as NoiseSuppressionType,
              )
            }
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
          >
            <option value="krisp" className="bg-[#2b2d31] text-foreground">
              Krisp
            </option>
            <option value="standard" className="bg-[#2b2d31] text-foreground">
              Standard
            </option>
            <option value="none" className="bg-[#2b2d31] text-foreground">
              None
            </option>
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Echo Cancellation */}
      <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
        <div>
          <div className="text-xs font-bold text-foreground">
            {t('Echo Cancellation')}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {t(
              'Mencegah feedback suara dari speaker masuk kembali ke mikrofon Anda.',
            )}
          </div>
        </div>
        <Switch
          checked={settings.echoCancellation}
          onCheckedChange={(val) => updateSetting('echoCancellation', val)}
        />
      </div>

      {/* Push to Talk */}
      <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
        <div>
          <div className="text-xs font-bold text-foreground">
            {t('Push to Talk')}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {t('Mikrofon hanya akan aktif saat tombol pintasan ditekan.')}
          </div>
        </div>
        <Switch
          checked={settings.pushToTalk}
          onCheckedChange={(val) => updateSetting('pushToTalk', val)}
        />
      </div>

      {/* Show Advanced Voice Settings Accordion */}
      <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
        <button
          type="button"
          onClick={() => setShowAdvancedVoice(!showAdvancedVoice)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div>
            <div className="text-xs font-bold text-foreground">
              {t('Show Advanced Voice Settings')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t(
                'Automatic Gain Control, Advanced Voice Activity, Bypass System Audio Input Processing, and more',
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
              showAdvancedVoice && 'rotate-180',
            )}
          />
        </button>

        {showAdvancedVoice && (
          <div className="p-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t('Automatic Gain Control')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Menstabilkan volume mikrofon secara dinamis')}
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t('Advanced Voice Activity')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Pendeteksian aktivitas suara cerdas')}
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t('Bypass System Audio Input Processing')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Langsung memproses audio mentah tanpa filter OS')}
                </div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t('Quality of Service High Packet Priority')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Memprioritaskan paket suara WebRTC di jaringan router')}
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
