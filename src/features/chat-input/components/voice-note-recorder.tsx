import React, { useState, useEffect, useRef } from 'react';
import { Mic, Trash2, Send, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/core/i18n';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (blob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
  className?: string;
}

export function VoiceNoteRecorder({ onSendVoiceNote, onCancel, className }: VoiceNoteRecorderProps) {
  const { t } = useTranslation();
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function startRecording() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error(t('Browser Anda tidak mendukung perekaman mikrofon.'));
          onCancel();
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(100);

        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.error('Microphone access error:', err);
        toast.error('Gagal mengakses mikrofon. Pastikan izin mikrofon telah diberikan.');
        onCancel();
      }
    }

    startRecording();

    return () => {
      isCancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onCancel]);

  const handleStopAndSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      onCancel();
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    const finalSeconds = Math.max(1, recordingSeconds);

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      onSendVoiceNote(audioBlob, finalSeconds);
    };

    recorder.stop();
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={cn(
        'w-full min-h-[52px] flex items-center justify-between gap-3 px-3 py-2 rounded-[12px] bg-destructive/10 border border-destructive/30 animate-in fade-in zoom-in-95 duration-150',
        className
      )}
    >
      {/* Left: Pulsing Red Recording Indicator & Timer */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
        </span>
        <span className="font-mono text-xs font-bold text-destructive">
          {formatTimer(recordingSeconds)}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Merekam pesan suara...
        </span>
      </div>

      {/* Center: Animated Waveform Bars */}
      <div className="flex items-center gap-1 h-5 overflow-hidden">
        {[40, 75, 30, 90, 60, 100, 45, 80, 50, 85, 35, 70].map((h, i) => (
          <div
            key={i}
            style={{
              height: `${Math.max(25, (h * ((recordingSeconds % 3) + 1)) / 3)}%`,
            }}
            className="w-1 bg-destructive/70 rounded-full transition-all duration-300"
          />
        ))}
      </div>

      {/* Right: Cancel & Send Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer text-xs flex items-center gap-1.5"
          title={t('Batal merekam')}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('Batal')}</span>
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleStopAndSend}
          className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          title={t('Kirim pesan suara')}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t('Kirim')}</span>
        </Button>
      </div>
    </div>
  );
}
