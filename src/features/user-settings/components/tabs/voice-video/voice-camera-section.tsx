import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface VoiceCameraSectionProps {
  settings: any;
  updateSetting: (key: any, val: any) => void;
  videoInputDevices: MediaDeviceInfo[];
}

export function VoiceCameraSection({
  settings,
  updateSetting,
  videoInputDevices,
}: VoiceCameraSectionProps) {
  const { t } = useTranslation();
  const [isCameraTesting, setIsCameraTesting] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [selectedVideoBackground, setSelectedVideoBackground] =
    useState('none');

  const startCameraTest = async () => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
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
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
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
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
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
                : 'bg-primary hover:bg-primary/90 text-primary-foreground',
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
          <div className="text-xs font-bold text-foreground">
            {t('Always preview video')}
          </div>
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
      <div className="max-w-md">
        <FormDropdown
          label={t('Camera')}
          value={settings.cameraDeviceId}
          onChange={(val) => updateSetting('cameraDeviceId', val)}
          options={
            videoInputDevices.length > 0
              ? videoInputDevices.map((d) => ({
                  value: d.deviceId,
                  label: `📷 ${d.label || `Camera (${d.deviceId.slice(0, 5)})`}`,
                }))
              : [
                  {
                    value: 'default',
                    label: '📷 HD User Facing (Integrated Webcam)',
                  },
                ]
          }
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          {t('Looking for more camera options? Check out your')}{' '}
          <span
            onClick={() =>
              toast.info(
                t(
                  'Buka Windows Settings > Bluetooth & Devices > Cameras untuk konfigurasi perangkat lanjutan.',
                ),
              )
            }
            className="text-primary hover:underline cursor-pointer font-medium"
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
            {
              id: 'blur',
              label: 'Blur',
              type: 'gradient',
              grad: 'from-zinc-700 via-zinc-800 to-zinc-900',
              icon: '👤',
            },
            {
              id: 'custom',
              label: 'Custom',
              type: 'gradient',
              grad: 'from-purple-800 via-indigo-900 to-purple-950',
              icon: '🖼️+',
            },
            {
              id: 'lilac-nebula',
              label: 'Lilac Planet',
              isVideo: true,
              grad: 'from-violet-900 via-purple-700 to-indigo-800',
            },
            {
              id: 'cosmic-world',
              label: 'Cosmic World',
              isNew: true,
              isVideo: true,
              grad: 'from-indigo-950 via-purple-900 to-pink-900',
            },
            {
              id: 'hacker-terminal',
              label: 'Hacker Grid',
              isVideo: true,
              grad: 'from-emerald-950 via-green-900 to-teal-950',
            },
            {
              id: 'lofi-room',
              label: 'Lofi Room',
              isVideo: true,
              grad: 'from-blue-950 via-indigo-950 to-slate-900',
            },
            {
              id: 'neon-cityscape',
              label: 'Neon Skyline',
              isVideo: true,
              grad: 'from-purple-950 via-fuchsia-900 to-indigo-950',
            },
            {
              id: 'sunny-cafe',
              label: 'Sunny Cafe',
              grad: 'from-amber-700 via-orange-800 to-yellow-900',
            },
            {
              id: 'tropical-beach',
              label: 'Tropical Beach',
              grad: 'from-cyan-800 via-teal-700 to-blue-900',
            },
            {
              id: 'synthwave',
              label: 'Retro Wave',
              grad: 'from-pink-900 via-purple-900 to-indigo-950',
            },
          ].map((bg) => {
            const isSelected = selectedVideoBackground === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => {
                  setSelectedVideoBackground(bg.id);
                  toast.success(
                    t(`Latar belakang video diatur ke ${bg.label}`),
                  );
                }}
                className={cn(
                  'relative aspect-video rounded-xl overflow-hidden border-2 transition-all p-2 flex flex-col justify-end cursor-pointer group',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 shadow-md'
                    : 'border-border/60 hover:border-border hover:shadow-xs',
                  bg.grad ? `bg-linear-to-br ${bg.grad}` : 'bg-[#1e1f22]',
                )}
              >
                {bg.isNew && (
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    NEW
                  </span>
                )}
                {bg.isVideo && (
                  <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] size-5 rounded-full flex items-center justify-center">
                    ▶
                  </span>
                )}
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
  );
}
