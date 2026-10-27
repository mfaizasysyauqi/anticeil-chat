import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

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
  isMuted = false,
  className,
}: RemoteVideoViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch((err) => {
        console.warn('Remote video play error:', err);
      });
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
