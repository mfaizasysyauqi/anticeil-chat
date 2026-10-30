import React, { useState } from 'react';
import {
  X,
  Mic,
  Headphones,
  Video,
  Volume2,
  Sliders,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { useVoiceSettings, InputProfile, NoiseSuppressionType } from '../hooks/use-voice-settings';

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
      <DialogContent className="sm:max-w-[760px] max-h-[85vh] p-0 overflow-hidden bg-[#1e1f22] border-[#2b2d31] text-foreground flex flex-col md:flex-row">
        {/* Left Navigation Sidebar */}
        <div className="w-full md:w-56 bg-[#2b2d31]/40 border-b md:border-b-0 md:border-r border-[#2b2d31] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
              Voice & Video
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left",
                  activeTab === 'voice' ? "bg-[#35373c] text-white" : "text-muted-foreground hover:bg-[#35373c]/50 hover:text-foreground"
                )}
              >
                <Mic className="w-4 h-4" />
                <span>Voice</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left",
                  activeTab === 'camera' ? "bg-[#35373c] text-white" : "text-muted-foreground hover:bg-[#35373c]/50 hover:text-foreground"
                )}
              >
                <Video className="w-4 h-4" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left",
                  activeTab === 'advanced' ? "bg-[#35373c] text-white" : "text-muted-foreground hover:bg-[#35373c]/50 hover:text-foreground"
                )}
              >
                <Sliders className="w-4 h-4" />
                <span>Advanced</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#35373c]/50">
            <span className="text-[10px] text-muted-foreground/60 leading-tight">
              WebRTC Audio/Video Engine • Anticeil Native
            </span>
          </div>
        </div>

        {/* Right Settings Content */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[75vh] [scrollbar-width:thin] space-y-6">
          <DialogHeader className="p-0 text-left border-b border-[#2b2d31] pb-3">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-indigo-400" />
              <span>Voice Settings</span>
            </DialogTitle>
          </DialogHeader>

          {/* Section: Device Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input Device (Microphone) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Microphone
              </label>
              <select
                value={settings.inputDeviceId}
                onChange={(e) => updateSetting('inputDeviceId', e.target.value)}
                className="w-full h-10 px-3 bg-[#111214] border border-[#2b2d31] rounded-lg text-xs text-foreground focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="default">Windows Default (Realtek Audio)</option>
                {audioInputDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))}
              </select>

              {/* Input Volume */}
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Microphone Volume</span>
                  <span className="font-mono">{settings.inputVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.inputVolume}
                  onChange={(e) => updateSetting('inputVolume', Number(e.target.value))}
                  className="w-full h-1.5 bg-[#2b2d31] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Output Device (Speaker) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Speaker
              </label>
              <select
                value={settings.outputDeviceId}
                onChange={(e) => updateSetting('outputDeviceId', e.target.value)}
                className="w-full h-10 px-3 bg-[#111214] border border-[#2b2d31] rounded-lg text-xs text-foreground focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="default">Windows Default (Realtek Audio)</option>
                {audioOutputDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Speaker ${i + 1}`}
                  </option>
                ))}
              </select>

              {/* Output Volume */}
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Speaker Volume</span>
                  <span className="font-mono">{settings.outputVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.outputVolume}
                  onChange={(e) => updateSetting('outputVolume', Number(e.target.value))}
                  className="w-full h-1.5 bg-[#2b2d31] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Real Mic Test Bar (Screenshot 4) */}
          <div className="p-4 bg-[#111214] rounded-xl border border-[#2b2d31] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">Mic Test</h4>
                <p className="text-[11px] text-muted-foreground">
                  Having mic issues? Test your microphone directly in real-time.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={isMicTesting ? stopMicTest : startMicTest}
                className={cn(
                  "font-bold text-xs h-8 px-4 cursor-pointer transition-colors shadow-xs",
                  isMicTesting
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                )}
              >
                {isMicTesting ? 'Stop Testing' : 'Mic Test'}
              </Button>
            </div>

            {/* Level indicator meter */}
            <div className="flex items-center gap-1 h-3.5 bg-[#1e1f22] p-1 rounded-md border border-[#2b2d31] overflow-hidden">
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
                        : "bg-[#2b2d31]"
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Input Profile (Voice Isolation, Studio, Custom) - Screenshot 4 */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Input Profile
            </label>
            <div className="space-y-2">
              <div
                onClick={() => updateSetting('inputProfile', 'voice-isolation')}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between",
                  settings.inputProfile === 'voice-isolation'
                    ? "bg-indigo-950/20 border-indigo-500/60"
                    : "bg-[#111214] border-[#2b2d31] hover:border-[#35373c]"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-foreground">Voice Isolation</div>
                  <div className="text-[11px] text-muted-foreground">
                    Just your beautiful voice: let Anticeil cut through background noise.
                  </div>
                </div>
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-0.5",
                  settings.inputProfile === 'voice-isolation' ? "border-indigo-500 bg-indigo-500" : "border-muted-foreground/40"
                )}>
                  {settings.inputProfile === 'voice-isolation' && <div className="size-1.5 rounded-full bg-white" />}
                </div>
              </div>

              <div
                onClick={() => updateSetting('inputProfile', 'studio')}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between",
                  settings.inputProfile === 'studio'
                    ? "bg-indigo-950/20 border-indigo-500/60"
                    : "bg-[#111214] border-[#2b2d31] hover:border-[#35373c]"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-foreground">Studio</div>
                  <div className="text-[11px] text-muted-foreground">
                    Pure audio: open mic with lossless processing for podcasts & instruments.
                  </div>
                </div>
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-0.5",
                  settings.inputProfile === 'studio' ? "border-indigo-500 bg-indigo-500" : "border-muted-foreground/40"
                )}>
                  {settings.inputProfile === 'studio' && <div className="size-1.5 rounded-full bg-white" />}
                </div>
              </div>

              <div
                onClick={() => updateSetting('inputProfile', 'custom')}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between",
                  settings.inputProfile === 'custom'
                    ? "bg-indigo-950/20 border-indigo-500/60"
                    : "bg-[#111214] border-[#2b2d31] hover:border-[#35373c]"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-foreground">Custom</div>
                  <div className="text-[11px] text-muted-foreground">
                    Advanced mode: give me all the sliders, sensitivity dials, and toggles.
                  </div>
                </div>
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-0.5",
                  settings.inputProfile === 'custom' ? "border-indigo-500 bg-indigo-500" : "border-muted-foreground/40"
                )}>
                  {settings.inputProfile === 'custom' && <div className="size-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Toggles (Krisp Noise Suppression, Echo Cancellation, Push to Talk) - Screenshot 5 */}
          <div className="space-y-4 pt-2 border-t border-[#2b2d31]">
            {/* Noise suppression dropdown */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Noise Suppression</span>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Reduces background noise and keyboard clicks from your microphone. Powered by Krisp Engine.
                </p>
              </div>
              <select
                value={settings.noiseSuppression}
                onChange={(e) => updateSetting('noiseSuppression', e.target.value as NoiseSuppressionType)}
                className="h-8 px-2.5 bg-[#111214] border border-[#2b2d31] rounded-lg text-xs font-semibold text-foreground focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="krisp">Krisp (AI Isolation)</option>
                <option value="standard">Standard</option>
                <option value="none">Off</option>
              </select>
            </div>

            {/* Echo cancellation toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">Echo Cancellation</h4>
                <p className="text-[11px] text-muted-foreground">
                  Prevents speaker audio feedback loops when you aren't wearing headphones.
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
                <h4 className="text-xs font-bold text-foreground">Push to Talk</h4>
                <p className="text-[11px] text-muted-foreground">
                  Hold a key to transmit your voice instead of automatic voice activation.
                </p>
              </div>
              <Switch
                checked={settings.pushToTalk}
                onCheckedChange={(val) => updateSetting('pushToTalk', val)}
              />
            </div>

            {/* Camera Preview Section */}
            <div className="pt-3 border-t border-[#2b2d31] space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Camera
              </label>
              <select
                value={settings.cameraDeviceId}
                onChange={(e) => updateSetting('cameraDeviceId', e.target.value)}
                className="w-full h-10 px-3 bg-[#111214] border border-[#2b2d31] rounded-lg text-xs text-foreground focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="default">Default Web Camera</option>
                {videoInputDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
