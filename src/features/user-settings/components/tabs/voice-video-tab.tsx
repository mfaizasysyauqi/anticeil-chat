import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, Video, Volume2, VolumeX, Sliders, Radio, Camera, RotateCcw,
  Sparkles, Check, ChevronDown, ChevronRight, MonitorPlay, Tv, Flame, Play, HelpCircle, Bell, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { useVoiceSettings, NoiseSuppressionType } from '@/features/voice/hooks/use-voice-settings';
import { toast } from 'sonner';
import { playPreviewSound } from '../../utils/sound-preview';

export interface VoiceVideoTabProps {
  onNavigateSection?: (section: string) => void;
}

export function VoiceVideoTab({ onNavigateSection }: VoiceVideoTabProps) {
  const { t } = useTranslation();
  // Voice & Video settings
  const {
    settings,
    updateSetting,
    resetSettings,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    isMicTesting,
    micVolumeLevel,
    startMicTest,
    stopMicTest,
  } = useVoiceSettings();

  // Voice & Video Discord Parity States
  const [showAdvancedVoice, setShowAdvancedVoice] = useState(false);
  const [isCameraTesting, setIsCameraTesting] = useState(false);
  const cameraVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = React.useRef<MediaStream | null>(null);
  const [selectedVideoBackground, setSelectedVideoBackground] = useState('none');
  const [showStreamPreviews, setShowStreamPreviews] = useState(true);
  const [showAdvancedStream, setShowAdvancedStream] = useState(false);

  // Voice Call Sound switches
  const [soundDeafen, setSoundDeafen] = useState(true);
  const [soundUndeafen, setSoundUndeafen] = useState(true);
  const [soundMute, setSoundMute] = useState(true);
  const [soundUnmute, setSoundUnmute] = useState(true);
  const [showMoreSounds, setShowMoreSounds] = useState(false);
  const [moreSoundsState, setMoreSoundsState] = useState<Record<string, boolean>>({
    cameraOn: true,
    cameraOff: true,
    voiceConnected: true,
    voiceDisconnected: true,
    userJoin: true,
    userLeave: true,
    screenShareStart: true,
    screenShareStop: true,
    pttActivate: true,
    pttDeactivate: true,
    streamStart: true,
    streamStop: true,
    activityLaunch: true,
    activityEnd: true,
    muteMember: true,
    deafenMember: true,
    ringingOutgoing: true,
    soundboardQuack: true,
  });

  // Soundboard states
  const [soundboardVolume, setSoundboardVolume] = useState(100);
  const [entranceServer, setEntranceServer] = useState('all');
  const [entranceSound, setEntranceSound] = useState('none');
  const [isChoosingEntranceSound, setIsChoosingEntranceSound] = useState(false);

  // Diagnostic states
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [debugLogging, setDebugLogging] = useState(false);
  const [audioSubsystem, setAudioSubsystem] = useState('standard');
  const [webrtcQos, setWebrtcQos] = useState(true);
  const [diagnosticPacketCapture, setDiagnosticPacketCapture] = useState(false);

  // Real Camera Preview Test
  const startCameraTest = async () => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video:
          settings.cameraDeviceId && settings.cameraDeviceId !== 'default'
            ? { deviceId: { exact: settings.cameraDeviceId } }
            : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play().catch(() => {});
      }
      setIsCameraTesting(true);
    } catch {
      toast.error(t('Kamera tidak ditemukan atau izin akses ditolak'));
      setIsCameraTesting(false);
    }
  };

  const stopCameraTest = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setIsCameraTesting(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);



  return (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: VOICE */}
            <div id="voice-voice" className="scroll-mt-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Voice')}
                </h2>
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
                          <option key={d.deviceId} value={d.deviceId} className="bg-[#2b2d31] text-foreground">
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
                          <option key={d.deviceId} value={d.deviceId} className="bg-[#2b2d31] text-foreground">
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
                    <span className="font-bold text-foreground">{t('Microphone Volume')}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{settings.inputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.inputVolume}
                    onChange={(e) => updateSetting('inputVolume', Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                </div>

                {/* Speaker Volume */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{t('Speaker Volume')}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{settings.outputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.outputVolume}
                    onChange={(e) => updateSetting('outputVolume', Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                </div>
              </div>

              {/* Mic Test Section (Discord Blurple button + Equalizer bars) */}
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
                    onClick={() => toast.info(t('Troubleshooting: Pastikan izin mikrofon browser Anda aktif.'))}
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
                              isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                            )}
                          >
                            {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-foreground">{prof.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{prof.desc}</div>
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
                    style={{ width: `${isMicTesting ? Math.min(100, micVolumeLevel) : 35}%` }}
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
                  <div className="text-xs font-bold text-foreground">{t('Noise Suppression')}</div>
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
                    onChange={(e) => updateSetting('noiseSuppression', e.target.value as NoiseSuppressionType)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    <option value="krisp" className="bg-[#2b2d31] text-foreground">Krisp</option>
                    <option value="standard" className="bg-[#2b2d31] text-foreground">Standard</option>
                    <option value="none" className="bg-[#2b2d31] text-foreground">None</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Echo Cancellation */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Echo Cancellation')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Mencegah feedback suara dari speaker masuk kembali ke mikrofon Anda.')}
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
                  <div className="text-xs font-bold text-foreground">{t('Push to Talk')}</div>
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
                    <div className="text-xs font-bold text-foreground">{t('Show Advanced Voice Settings')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Automatic Gain Control, Advanced Voice Activity, Bypass System Audio Input Processing, and more')}
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
                        <div className="text-xs font-bold text-foreground">{t('Automatic Gain Control')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Menstabilkan volume mikrofon secara dinamis')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Advanced Voice Activity')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Pendeteksian aktivitas suara cerdas')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Bypass System Audio Input Processing')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Langsung memproses audio mentah tanpa filter OS')}</div>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Quality of Service High Packet Priority')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Memprioritaskan paket suara WebRTC di jaringan router')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 2: CAMERA */}
            <div id="voice-camera" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Camera')}</h2>
              </div>

              {/* Test Video Button & Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={isCameraTesting ? stopCameraTest : startCameraTest}
                    className={cn(
                      'px-6 py-2.5 h-10 text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm',
                      isCameraTesting
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
                    )}
                  >
                    {isCameraTesting ? t('Stop Video') : t('Test Video')}
                  </Button>
                </div>

                {isCameraTesting && (
                  <div className="w-full max-w-lg aspect-video rounded-xl bg-black border border-border/80 overflow-hidden relative shadow-lg">
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-white flex items-center gap-1.5 border border-white/10">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Camera Active Preview</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Always preview video switch */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Always preview video')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Pops up preview modal every time you turn on video')}
                  </div>
                </div>
                <Switch
                  checked={settings.alwaysPreviewVideo}
                  onCheckedChange={(val) => updateSetting('alwaysPreviewVideo', val)}
                />
              </div>

              {/* Camera dropdown */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Camera')}
                </label>
                <div className="relative max-w-md">
                  <select
                    value={settings.cameraDeviceId}
                    onChange={(e) => updateSetting('cameraDeviceId', e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    {videoInputDevices.length > 0 ? (
                      videoInputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId} className="bg-[#2b2d31] text-foreground">
                          📷 {d.label || `Camera (${d.deviceId.slice(0, 5)})`}
                        </option>
                      ))
                    ) : (
                      <option value="default" className="bg-[#2b2d31] text-foreground">
                        📷 HD User Facing (Integrated Webcam)
                      </option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t('Looking for more camera options? Check out your')}{' '}
                  <span
                    onClick={() => toast.info(t('Buka Windows Settings > Bluetooth & Devices > Cameras untuk konfigurasi perangkat lanjutan.'))}
                    className="text-[#5865F2] hover:underline cursor-pointer font-medium"
                  >
                    {t('system camera settings')}
                  </span>
                  .
                </p>
              </div>

              {/* Video Background Picker Grid */}
              <div className="space-y-3 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Video Background')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'none', label: 'None', type: 'icon', icon: '⊘' },
                    { id: 'blur', label: 'Blur', type: 'gradient', grad: 'from-zinc-700 via-zinc-800 to-zinc-900', icon: '👤' },
                    { id: 'custom', label: 'Custom', type: 'gradient', grad: 'from-purple-800 via-indigo-900 to-purple-950', icon: '🖼️+' },
                    { id: 'lilac-nebula', label: 'Lilac Planet', isVideo: true, grad: 'from-violet-900 via-purple-700 to-indigo-800' },
                    { id: 'cosmic-world', label: 'Cosmic World', isNew: true, isVideo: true, grad: 'from-indigo-950 via-purple-900 to-pink-900' },
                    { id: 'hacker-terminal', label: 'Hacker Grid', isVideo: true, grad: 'from-emerald-950 via-green-900 to-teal-950' },
                    { id: 'lofi-room', label: 'Lofi Room', isVideo: true, grad: 'from-blue-950 via-indigo-950 to-slate-900' },
                    { id: 'neon-cityscape', label: 'Neon Skyline', isVideo: true, grad: 'from-purple-950 via-fuchsia-900 to-indigo-950' },
                    { id: 'sunny-cafe', label: 'Sunny Cafe', grad: 'from-amber-700 via-orange-800 to-yellow-900' },
                    { id: 'tropical-beach', label: 'Tropical Beach', grad: 'from-cyan-800 via-teal-700 to-blue-900' },
                    { id: 'synthwave', label: 'Retro Wave', grad: 'from-pink-900 via-purple-900 to-indigo-950' },
                  ].map((bg) => {
                    const isSelected = selectedVideoBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => {
                          setSelectedVideoBackground(bg.id);
                          toast.success(t(`Latar belakang video diatur ke ${bg.label}`));
                        }}
                        className={cn(
                          'relative aspect-video rounded-xl overflow-hidden border-2 transition-all p-2 flex flex-col justify-end cursor-pointer group',
                          isSelected
                            ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 shadow-md'
                            : 'border-border/60 hover:border-border hover:shadow-xs',
                          bg.grad ? `bg-linear-to-br ${bg.grad}` : 'bg-[#1e1f22]',
                        )}
                      >
                        {/* Badges */}
                        {bg.isNew && (
                          <span className="absolute top-2 left-2 bg-[#5865F2] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                            NEW
                          </span>
                        )}
                        {bg.isVideo && (
                          <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] size-5 rounded-full flex items-center justify-center">
                            ▶
                          </span>
                        )}

                        {/* Center icon if any */}
                        {bg.icon && (
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-muted-foreground/80 group-hover:scale-110 transition-transform">
                            {bg.icon}
                          </div>
                        )}

                        <span className="relative z-10 text-[11px] font-bold text-white drop-shadow-md text-left">
                          {bg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: STREAMING */}
            <div id="voice-streaming" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Streaming')}</h2>
              </div>

              {/* Show Stream Previews switch */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Show Stream Previews')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Allows others to see a preview of your stream before they join.')}
                  </div>
                </div>
                <Switch
                  checked={showStreamPreviews}
                  onCheckedChange={setShowStreamPreviews}
                />
              </div>

              {/* Show Advanced Stream Settings Accordion */}
              <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowAdvancedStream(!showAdvancedStream)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Show Advanced Stream Settings')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Stream Attenuation, Stream Attenuation Strength, and more')}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                      showAdvancedStream && 'rotate-180',
                    )}
                  />
                </button>

                {showAdvancedStream && (
                  <div className="p-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Stream Attenuation')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Menurunkan volume game saat Anda berbicara saat live stream')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="space-y-1.5 py-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{t('Stream Attenuation Strength')}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">75%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue={75}
                        className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Hardware Acceleration for Screen Capture')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Menggunakan akselerasi GPU untuk screen sharing tanpa lag')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Use OpenH264 Video Codec by Cisco')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Codec kompresi video standar berkinerja tinggi')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 4: SOUNDS */}
            <div id="voice-sounds" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Sounds')}</h2>
              </div>

              {/* Core 4 sound rows */}
              <div className="space-y-3">
                {/* Deafen */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Deafen')}</div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('deafen')}
                      className="text-[11px] text-[#5865F2] hover:underline font-semibold cursor-pointer block mt-0.5"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch checked={soundDeafen} onCheckedChange={setSoundDeafen} />
                </div>

                {/* Undeafen */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Undeafen')}</div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('undeafen')}
                      className="text-[11px] text-[#5865F2] hover:underline font-semibold cursor-pointer block mt-0.5"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch checked={soundUndeafen} onCheckedChange={setSoundUndeafen} />
                </div>

                {/* Mute */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Mute')}</div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('mute')}
                      className="text-[11px] text-[#5865F2] hover:underline font-semibold cursor-pointer block mt-0.5"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch checked={soundMute} onCheckedChange={setSoundMute} />
                </div>

                {/* Unmute */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Unmute')}</div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('unmute')}
                      className="text-[11px] text-[#5865F2] hover:underline font-semibold cursor-pointer block mt-0.5"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch checked={soundUnmute} onCheckedChange={setSoundUnmute} />
                </div>
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
                    {[
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
                    ].map((snd) => (
                      <div key={snd.key} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-none">
                        <div>
                          <div className="text-xs font-semibold text-foreground">{snd.label}</div>
                          <button
                            type="button"
                            onClick={() => playPreviewSound(snd.sound)}
                            className="text-[10px] text-[#5865F2] hover:underline font-medium cursor-pointer"
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

              {/* Related Settings card (Screenshot 4) */}
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

            {/* SUB-SECTION 5: SOUNDBOARD */}
            <div id="voice-soundboard" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Soundboard')}</h2>
              </div>

              {/* Soundboard Volume Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Soundboard Volume')}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">{soundboardVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundboardVolume}
                  onChange={(e) => setSoundboardVolume(Number(e.target.value))}
                  className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t('Control how loud sounds are for you personally.')}{' '}
                  <span
                    onClick={() => toast.info(t('Soundboard Volume hanya memengaruhi volume yang Anda dengar, bukan pengguna lain.'))}
                    className="text-[#5865F2] hover:underline cursor-pointer font-medium"
                  >
                    {t('Learn more about Soundboard volume.')}
                  </span>
                </p>
              </div>

              {/* Entrance Sounds (Screenshot 5) */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Entrance Sounds')}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t(
                      'Choose a Soundboard sound to automatically play whenever you join a voice channel. Right-click on a voice channel to join without playing your entrance sound.',
                    )}{' '}
                    <span
                      onClick={() => toast.info(t('Fitur Entrance Sounds memainkan sound effect kustom secara otomatis ketika Anda masuk ke room suara.'))}
                      className="text-[#5865F2] hover:underline cursor-pointer font-medium"
                    >
                      {t('Learn More.')}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Choose a Server */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {t('Choose a Server')}
                    </label>
                    <div className="relative">
                      <select
                        value={entranceServer}
                        onChange={(e) => setEntranceServer(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                      >
                        <option value="all" className="bg-[#2b2d31] text-foreground">All Servers</option>
                        <option value="s1" className="bg-[#2b2d31] text-foreground">zmsta's server</option>
                        <option value="s2" className="bg-[#2b2d31] text-foreground">Anticeil Official Community</option>
                        <option value="s3" className="bg-[#2b2d31] text-foreground">Developer Hub Colony</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Choose a Sound */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {t('Choose a sound')}
                    </label>
                    <div
                      onClick={() => setIsChoosingEntranceSound(!isChoosingEntranceSound)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 hover:border-border text-foreground cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span>🔊</span>
                        <span>
                          {entranceSound === 'none'
                            ? 'None'
                            : entranceSound === 'quack'
                              ? '🦆 Quack'
                              : entranceSound === 'airhorn'
                                ? '🎺 Airhorn'
                                : entranceSound === 'badum'
                                  ? '🥁 Ba-Dum-Tss'
                                  : '👏 Golf Clap'}
                        </span>
                      </div>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </div>
                  </div>
                </div>

                {/* Entrance Sound Picker Popover */}
                {isChoosingEntranceSound && (
                  <div className="p-3 rounded-xl border border-border/80 bg-card space-y-2 shadow-md">
                    <div className="text-[11px] font-bold text-muted-foreground">{t('Pilih Suara Masuk (Entrance Sound):')}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'None', sound: '' },
                        { id: 'quack', label: '🦆 Quack', sound: 'quack' },
                        { id: 'airhorn', label: '🎺 Airhorn', sound: 'airhorn' },
                        { id: 'badum', label: '🥁 Ba-Dum-Tss', sound: 'deafen' },
                        { id: 'golfclap', label: '👏 Golf Clap', sound: 'message' },
                      ].map((snd) => (
                        <button
                          key={snd.id}
                          type="button"
                          onClick={() => {
                            setEntranceSound(snd.id);
                            setIsChoosingEntranceSound(false);
                            if (snd.sound) playPreviewSound(snd.sound);
                            toast.success(t(`Entrance sound diubah ke ${snd.label}`));
                          }}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer',
                            entranceSound === snd.id
                              ? 'bg-[#5865F2]/10 border-[#5865F2] text-[#5865F2]'
                              : 'bg-[#1e1f22] border-border/60 text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <span>{snd.label}</span>
                          {entranceSound === snd.id && <Check className="w-3 h-3 text-[#5865F2]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 6: ADVANCED */}
            <div id="voice-advanced" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Advanced')}</h2>
              </div>

              {/* Accordion: Show Diagnostic Settings (Screenshot 6) */}
              <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Show Diagnostic Settings')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t(
                        'Settings that collect technical data for Discord Support to analyze, such as debug logging and audio recording',
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                      showDiagnostics && 'rotate-180',
                    )}
                  />
                </button>

                {showDiagnostics && (
                  <div className="p-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Debug Logging')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Mencatat log koneksi WebRTC secara detail ke console')}</div>
                      </div>
                      <Switch checked={debugLogging} onCheckedChange={setDebugLogging} />
                    </div>

                    <div className="space-y-1.5 py-1">
                      <label className="text-xs font-bold text-foreground block">{t('Audio Subsystem')}</label>
                      <div className="relative max-w-xs">
                        <select
                          value={audioSubsystem}
                          onChange={(e) => setAudioSubsystem(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none cursor-pointer pr-8"
                        >
                          <option value="standard" className="bg-[#2b2d31]">Standard (Recommended)</option>
                          <option value="legacy" className="bg-[#2b2d31]">Legacy Audio Stack</option>
                          <option value="experimental" className="bg-[#2b2d31]">Experimental Low-Latency</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('WebRTC High Priority QoS')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Mengaktifkan DSCP Expedited Forwarding packet tagging')}</div>
                      </div>
                      <Switch checked={webrtcQos} onCheckedChange={setWebrtcQos} />
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Diagnostic Packet Capture')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Simpan dump statistik RTC untuk investigasi masalah jaringan')}</div>
                      </div>
                      <Switch checked={diagnosticPacketCapture} onCheckedChange={setDiagnosticPacketCapture} />
                    </div>
                  </div>
                )}
              </div>

              {/* Reset all Voice & Video settings (Screenshot 6) */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Reset all Voice & Video settings')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Return to the default set of Voice & Video settings.')}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetSettings();
                    stopCameraTest();
                    setSelectedVideoBackground('none');
                    setShowStreamPreviews(true);
                    setSoundDeafen(true);
                    setSoundUndeafen(true);
                    setSoundMute(true);
                    setSoundUnmute(true);
                    setSoundboardVolume(100);
                    setEntranceServer('all');
                    setEntranceSound('none');
                    toast.success(t('Semua pengaturan Voice & Video telah diatur ulang ke default'));
                  }}
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-bold text-xs px-4 py-2 rounded-md shrink-0 cursor-pointer transition-colors"
                >
                  {t('Reset')}
                </Button>
              </div>
            </div>
          </div>

  );
}
