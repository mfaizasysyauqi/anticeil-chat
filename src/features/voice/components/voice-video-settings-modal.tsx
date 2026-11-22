import React, { useState } from 'react';
import {
  Mic,
  Video,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { useVoiceSettings, NoiseSuppressionType } from '../hooks/use-voice-settings';
import { LAYOUT_DIALOG_SPACING } from '@/lib/layout-constants';

export interface VoiceVideoSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceVideoSettingsModal({
  open,
  onOpenChange,
}: VoiceVideoSettingsModalProps) {
  const { t } = useTranslation();
  const {
    settings,
    updateSetting,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    isMicTesting,
    micVolumeLevel,
    startMicTest,
    stopMicTest,
  } = useVoiceSettings();

  const [activeTab, setActiveTab] = useState<'voice' | 'camera' | 'advanced'>('voice');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="two-pane" showCloseButton={false} className={cn('overflow-hidden text-foreground flex flex-col md:flex-row', LAYOUT_DIALOG_SPACING.TWO_PANE_CONTAINER)}>
        {/* Left Navigation Sidebar */}
        <div className={cn('w-full md:w-56 bg-muted/40 border-b md:border-b-0 md:border-r border-border flex flex-col justify-between shrink-0', LAYOUT_DIALOG_SPACING.SIDEBAR_PADDING)}>
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
              {t('Voice & Video')}
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left",
                  activeTab === 'voice' ? "bg-accent text-foreground font-bold shadow-xs" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Mic className="w-4 h-4 text-primary" />
                <span>{t('Voice')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left",
                  activeTab === 'camera' ? "bg-accent text-foreground font-bold shadow-xs" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Video className="w-4 h-4 text-primary" />
                <span>{t('Camera')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left",
                  activeTab === 'advanced' ? "bg-accent text-foreground font-bold shadow-xs" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Sliders className="w-4 h-4 text-primary" />
                <span>{t('Advanced')}</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <span className="text-[10px] text-muted-foreground/70 leading-tight">
              {t('WebRTC Audio/Video Engine • Anticeil Native')}
            </span>
          </div>
        </div>

        {/* Right Settings Content */}
        <div className={cn('flex-1 overflow-y-auto h-full max-md:scrollbar-none custom-scrollbar space-y-6', LAYOUT_DIALOG_SPACING.PANE_HORIZONTAL, LAYOUT_DIALOG_SPACING.PANE_VERTICAL)}>
          <DialogHeader className="p-0 text-left border-b border-border pb-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              <span>{t('Voice Settings')}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Section: Device Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input Device (Microphone) */}
            <div className="space-y-2">
              <FormDropdown
                label={t('Microphone')}
                value={settings.inputDeviceId}
                onChange={(val) => updateSetting('inputDeviceId', val)}
                options={[
                  { value: 'default', label: t('Windows Default (Realtek Audio)') },
                  ...audioInputDevices.map((d, i) => ({
                    value: d.deviceId,
                    label: d.label || `${t('Microphone')} ${i + 1}`,
                  })),
                ]}
              />

              {/* Input Volume */}
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{t('Microphone Volume')}</span>
                  <span className="font-mono">{settings.inputVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.inputVolume}
                  onChange={(e) => updateSetting('inputVolume', Number(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Output Device (Speaker) */}
            <div className="space-y-2">
              <FormDropdown
                label={t('Speaker')}
                value={settings.outputDeviceId}
                onChange={(val) => updateSetting('outputDeviceId', val)}
                options={[
                  { value: 'default', label: t('Windows Default (Realtek Audio)') },
                  ...audioOutputDevices.map((d, i) => ({
                    value: d.deviceId,
                    label: d.label || `${t('Speaker')} ${i + 1}`,
                  })),
                ]}
              />

              {/* Output Volume */}
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{t('Speaker Volume')}</span>
                  <span className="font-mono">{settings.outputVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.outputVolume}
                  onChange={(e) => updateSetting('outputVolume', Number(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Real Mic Test Bar */}
          <div className="p-4 bg-card rounded-xl border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">{t('Mic Test')}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {t('Having mic issues? Test your microphone directly in real-time.')}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={isMicTesting ? stopMicTest : startMicTest}
                className={cn(
                  "font-bold text-xs h-8 px-4 cursor-pointer transition-colors shadow-xs",
                  isMicTesting
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {isMicTesting ? t('Stop Testing') : t('Mic Test')}
              </Button>
            </div>

            {/* Level indicator meter */}
            <div className="flex items-center gap-1 h-3.5 bg-muted p-1 rounded-md border border-border overflow-hidden">
              {Array.from({ length: 48 }).map((_, idx) => {
                const threshold = (idx / 48) * 100;
                const isLit = isMicTesting && micVolumeLevel >= threshold;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex-1 h-full rounded-2xs transition-colors duration-75",
                      isLit
                        ? idx > 36
                          ? "bg-rose-500"
                          : idx > 24
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                        : "bg-muted-foreground/20"
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Input Profile (Voice Isolation, Studio, Custom) */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Input Profile')}
            </label>
            <div className="space-y-2">
              <div
                onClick={() => updateSetting('inputProfile', 'voice-isolation')}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between",
                  settings.inputProfile === 'voice-isolation'
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-border/80"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Voice Isolation')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Just your beautiful voice: let Anticeil cut through background noise.')}
                  </div>
                </div>
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-0.5",
                  settings.inputProfile === 'voice-isolation' ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}>
                  {settings.inputProfile === 'voice-isolation' && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                </div>
              </div>

              <div
                onClick={() => updateSetting('inputProfile', 'studio')}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between",
                  settings.inputProfile === 'studio'
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-border/80"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Studio')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Pure audio: open mic with lossless processing for podcasts & instruments.')}
                  </div>
                </div>
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-0.5",
                  settings.inputProfile === 'studio' ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}>
                  {settings.inputProfile === 'studio' && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                </div>
              </div>

              <div
                onClick={() => updateSetting('inputProfile', 'custom')}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between",
                  settings.inputProfile === 'custom'
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-border/80"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Custom')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Advanced mode: give me all the sliders, sensitivity dials, and toggles.')}
                  </div>
                </div>
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-0.5",
                  settings.inputProfile === 'custom' ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}>
                  {settings.inputProfile === 'custom' && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Toggles */}
          <div className="space-y-4 pt-2 border-t border-border">
            {/* Noise suppression dropdown */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('Noise Suppression')}</span>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {t('Reduces background noise and keyboard clicks from your microphone. Powered by Krisp Engine.')}
                </p>
              </div>
              <div className="w-44 shrink-0">
                <FormDropdown
                  size="sm"
                  value={settings.noiseSuppression}
                  onChange={(val) => updateSetting('noiseSuppression', val as NoiseSuppressionType)}
                  options={[
                    { value: 'krisp', label: t('Krisp (AI Isolation)') },
                    { value: 'standard', label: t('Standard') },
                    { value: 'none', label: t('Off') },
                  ]}
                />
              </div>
            </div>

            {/* Echo cancellation toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">{t('Echo Cancellation')}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {t("Prevents speaker audio feedback loops when you aren't wearing headphones.")}
                </p>
              </div>
              <Switch
                checked={settings.echoCancellation}
                onCheckedChange={(val) => updateSetting('echoCancellation', val)}
              />
            </div>

            {/* Push to talk toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">{t('Push to Talk')}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {t('Hold a key to transmit your voice instead of automatic voice activation.')}
                </p>
              </div>
              <Switch
                checked={settings.pushToTalk}
                onCheckedChange={(val) => updateSetting('pushToTalk', val)}
              />
            </div>

            {/* Camera Preview Section */}
            <div className="pt-3 border-t border-border">
              <FormDropdown
                label={t('Camera')}
                value={settings.cameraDeviceId}
                onChange={(val) => updateSetting('cameraDeviceId', val)}
                options={[
                  { value: 'default', label: t('Default Web Camera') },
                  ...videoInputDevices.map((d, i) => ({
                    value: d.deviceId,
                    label: d.label || `${t('Camera')} ${i + 1}`,
                  })),
                ]}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
