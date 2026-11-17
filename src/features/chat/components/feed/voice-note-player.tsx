import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceNotePlayerProps {
  url: string;
  duration?: number;
  name?: string;
  className?: string;
}

export function VoiceNotePlayer({ url, duration: initialDuration, name, className }: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Generate a consistent pseudo waveform bar distribution based on the URL
  const barCount = 28;
  const waveformHeights = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = (hash << 5) - hash + url.charCodeAt(i);
      hash |= 0;
    }
    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const val = Math.abs(Math.sin((hash + i * 17) * 0.45));
      heights.push(Math.max(20, Math.floor(val * 100)));
    }
    return heights;
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const seekTime = (index / barCount) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleSpeed = () => {
    const audio = audioRef.current;
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audio) {
      audio.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        'my-1.5 flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 border border-border/50 max-w-sm sm:max-w-md select-none transition-colors shadow-2xs',
        className
      )}
    >
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play/Pause Button */}
      <Button
        type="button"
        size="icon"
        variant="default"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
        aria-label={isPlaying ? 'Jeda pesan suara' : 'Putar pesan suara'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </Button>

      {/* Center Waveform & Time */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Waveform Bar Track */}
        <div className="flex items-center gap-[3px] h-7 cursor-pointer" title="Klik untuk melompat">
          {waveformHeights.map((h, idx) => {
            const barPercent = (idx / barCount) * 100;
            const isFilled = barPercent <= currentPercent;
            return (
              <div
                key={idx}
                onClick={() => handleSeek(idx)}
                className="flex-1 flex items-center justify-center h-full group"
              >
                <div
                  style={{ height: `${h}%` }}
                  className={cn(
                    'w-full max-w-[4px] rounded-full transition-all duration-75',
                    isFilled
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Time and Info Row */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3 text-primary/80" />
            <span>{isPlaying ? formatTime(currentTime) : formatTime(duration || currentTime)}</span>
          </span>
          <span className="text-[10px] truncate max-w-[140px] text-muted-foreground/60">
            {name || 'Pesan Suara'}
          </span>
        </div>
      </div>

      {/* Speed Rate Pill (1x, 1.5x, 2x) */}
      <button
        type="button"
        onClick={toggleSpeed}
        className="px-2 py-1 rounded-md text-[11px] font-bold font-mono text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background border border-border/40 transition-colors cursor-pointer shrink-0"
        title="Ubah kecepatan putar"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
