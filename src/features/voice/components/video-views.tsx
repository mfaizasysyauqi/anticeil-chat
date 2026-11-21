import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { loadVoiceSettings } from '../hooks/use-voice-settings';

export interface LocalVideoViewProps {
  stream: MediaStream | null;
  className?: string;
}

export function LocalVideoView({ stream, className }: LocalVideoViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch((err) => {
        console.warn('Local video play error:', err);
      });
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn('w-full h-full object-cover -scale-x-100', className)}
    />
  );
}

export interface RemoteVideoViewProps {
  stream: MediaStream;
  isMuted?: boolean;
  className?: string;
}

export function RemoteVideoView({
  stream,
  isMuted = true,
  className,
}: RemoteVideoViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch((err) => {
        console.warn('Remote video play error:', err);
      });

      const handleTrackChange = () => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      };
      stream.addEventListener('addtrack', handleTrackChange);
      stream.addEventListener('removetrack', handleTrackChange);

      return () => {
        stream.removeEventListener('addtrack', handleTrackChange);
        stream.removeEventListener('removetrack', handleTrackChange);
      };
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className={cn('w-full h-full object-cover', className)}
    />
  );
}

export interface RemoteAudioViewProps {
  stream: MediaStream | null | undefined;
  isMuted?: boolean;
}

export function RemoteAudioView({ stream, isMuted = false }: RemoteAudioViewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && stream) {
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
      audio.play().catch((err) => {
        console.warn('Remote audio play error:', err);
      });

      const applyAudioOutputSettings = () => {
        try {
          const vs = loadVoiceSettings();
          if (typeof (audio as any).setSinkId === 'function') {
            const sink =
              vs.outputDeviceId && vs.outputDeviceId !== 'default' && !vs.outputDeviceId.startsWith('hw-')
                ? vs.outputDeviceId
                : '';
            (audio as any).setSinkId(sink).catch(console.warn);
          }
          if (typeof vs.outputVolume === 'number') {
            audio.volume = Math.max(0, Math.min(1, vs.outputVolume / 100));
          }
        } catch {}
      };

      applyAudioOutputSettings();
      window.addEventListener('anticeil_voice_settings_changed', applyAudioOutputSettings);

      const handleTrackChange = () => {
        audioRef.current?.play().catch(() => {});
      };
      stream.addEventListener('addtrack', handleTrackChange);
      stream.addEventListener('removetrack', handleTrackChange);

      return () => {
        window.removeEventListener('anticeil_voice_settings_changed', applyAudioOutputSettings);
        stream.removeEventListener('addtrack', handleTrackChange);
        stream.removeEventListener('removetrack', handleTrackChange);
      };
    }
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="hidden"
      aria-hidden="true"
    />
  );
}

export interface ScreenVideoViewProps {
  stream: MediaStream | null;
  className?: string;
}

export function ScreenVideoView({ stream, className }: ScreenVideoViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch((err) => {
        console.warn('Screen video play error:', err);
      });
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn('w-full h-full object-contain bg-black/95', className)}
    />
  );
}
