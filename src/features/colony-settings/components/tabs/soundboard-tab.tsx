import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, Trash2, Plus, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { colonyApi } from '@/chat/chat-api';
import type { Colony, ColonySound } from '@/chat/chat-types';

interface SoundboardTabProps {
  activeColony: Colony;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  t: (key: string) => string;
}

// Built-in synthesized web audio sound effects for instant interactive playback
function playSynthesizedSound(type: string) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'airhorn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(466.16, now); // Bb4
      osc.frequency.setValueAtTime(466.16, now + 0.15);
      osc.frequency.setValueAtTime(466.16, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'quack') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'tada') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'bonk') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'ding') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.error('Audio synthesis error', err);
  }
}

export function SoundboardTab({
  activeColony,
  onUpdateColony,
  t,
}: SoundboardTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sounds, setSounds] = useState<ColonySound[]>(
    activeColony.sounds || [],
  );
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);

  // Load soundboard items from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadSounds = async () => {
      try {
        const res = await colonyApi.getServerSounds(activeColony.id);
        if (isMounted && Array.isArray(res) && res.length > 0) {
          setSounds(res);
        }
      } catch {}
    };
    loadSounds();
    return () => {
      isMounted = false;
    };
  }, [activeColony.id]);

  // Default server community sounds
  const defaultSounds: ColonySound[] = [
    { id: 'def_airhorn', name: 'Airhorn', emoji: '🎺' },
    { id: 'def_quack', name: 'Quack', emoji: '🦆' },
    { id: 'def_tada', name: 'Tada 🎉', emoji: '🎉' },
    { id: 'def_bonk', name: 'Bonk', emoji: '💥' },
    { id: 'def_ding', name: 'Bell Ding', emoji: '🔔' },
  ];

  const handleUploadSound = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Ukuran file audio maksimal 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      if (url) {
        const rawName = file.name.split('.')[0] || 'sound';
        const cleanName = rawName.replace(/[^a-zA-Z0-9_ -]/g, '').slice(0, 32);
        try {
          const created = await colonyApi.addServerSound(activeColony.id, {
            name: cleanName,
            emoji: '🔊',
            url,
            soundType: 'audio',
            volume: 1.0,
          });
          const newSound: ColonySound = created || {
            id: `sound_${Date.now()}`,
            name: cleanName,
            emoji: '🔊',
            url,
            soundType: 'audio',
            volume: 1.0,
          };
          const next = [...sounds, newSound];
          setSounds(next);
          await onUpdateColony(activeColony.id, { sounds: next });
          toast.success(t(`Suara "${newSound.name}" berhasil diunggah! 🎵`));
        } catch {
          const fallback: ColonySound = {
            id: `sound_${Date.now()}`,
            name: cleanName,
            emoji: '🔊',
            url,
            soundType: 'audio',
            volume: 1.0,
          };
          const next = [...sounds, fallback];
          setSounds(next);
          await onUpdateColony(activeColony.id, { sounds: next });
          toast.success(t(`Suara "${fallback.name}" berhasil diunggah! 🎵`));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePlay = async (sound: ColonySound) => {
    setPlayingSoundId(sound.id);

    // Play locally
    if (sound.url) {
      const audio = new Audio(sound.url);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingSoundId(null);
    } else {
      if (sound.id.includes('airhorn')) playSynthesizedSound('airhorn');
      else if (sound.id.includes('quack')) playSynthesizedSound('quack');
      else if (sound.id.includes('tada')) playSynthesizedSound('tada');
      else if (sound.id.includes('bonk')) playSynthesizedSound('bonk');
      else if (sound.id.includes('ding')) playSynthesizedSound('ding');
      else playSynthesizedSound('default');

      setTimeout(() => setPlayingSoundId(null), 600);
    }

    // Broadcast in real-time to active colony / voice participants
    try {
      await colonyApi.playServerSound(activeColony.id, sound.id, {
        name: sound.name,
        emoji: sound.emoji,
        url: sound.url,
        soundType: sound.soundType,
        volume: sound.volume,
      });
    } catch {}
  };

  const handleDeleteSound = async (snd: ColonySound) => {
    try {
      await colonyApi.deleteServerSound(activeColony.id, snd.id);
    } catch {}
    const next = sounds.filter((s) => s.id !== snd.id);
    setSounds(next);
    await onUpdateColony(activeColony.id, { sounds: next });
    toast.success(t(`Suara "${snd.name}" dihapus.`));
  };

  const allSounds = [...defaultSounds, ...sounds];

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Hidden Audio File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/mp3,audio/wav,audio/ogg,audio/m4a"
        onChange={(e) => {
          handleUploadSound(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Header (Discord 1:1 Parity) */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Soundboard')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t(
              'Upload custom sound reactions that anyone in this server can use. Nitro members will be able to access these sounds in any server on Discord.',
            )}
          </p>
        </div>

        {allSounds.length > 0 && (
          <Button
            size="sm"
            variant="teal"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold px-4 h-9 rounded-lg cursor-pointer shrink-0"
          >
            {t('Upload Sound')}
          </Button>
        )}
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* Sounds Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span>
            {t('SOUNDS')} ({allSounds.length}/48)
          </span>
          <span className="text-[11px] text-muted-foreground">
            {48 - allSounds.length} {t('slots remaining')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allSounds.map((snd) => {
            const isPlaying = playingSoundId === snd.id;
            const isCustom = !snd.id.startsWith('def_');

            return (
              <div
                key={snd.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border bg-[#1e1f22] transition-all group',
                  isPlaying
                    ? 'border-teal-500 bg-[#2b2d31] shadow-md ring-1 ring-teal-500'
                    : 'border-border/70 hover:border-border hover:bg-[#2b2d31]/60',
                )}
              >
                <div
                  onClick={() => handlePlay(snd)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="size-10 rounded-xl bg-[#111214] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {snd.emoji || '🔊'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {snd.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      {isPlaying ? (
                        <span className="text-teal-400 font-semibold">
                          {t('Playing...')}
                        </span>
                      ) : (
                        <span>{t('Click to play')}</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <button
                    type="button"
                    onClick={() => handlePlay(snd)}
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer',
                      isPlaying
                        ? 'bg-teal-600 text-white'
                        : 'bg-[#2b2d31] text-muted-foreground hover:text-foreground hover:bg-[#35373c]',
                    )}
                    title={t('Putar Suara')}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSound(snd)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title={t('Hapus Suara')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
