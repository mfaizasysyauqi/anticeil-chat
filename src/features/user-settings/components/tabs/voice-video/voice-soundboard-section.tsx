import React from 'react';
import { Check, ChevronDown, Pencil } from 'lucide-react';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface VoiceSoundboardSectionProps {
  t: (key: string) => string;
  soundboardVolume: number;
  setSoundboardVolume: (val: number) => void;
  entranceServer: string;
  setEntranceServer: (val: string) => void;
  entranceSound: string;
  setEntranceSound: (val: string) => void;
  isChoosingEntranceSound: boolean;
  setIsChoosingEntranceSound: (val: boolean) => void;
  playPreviewSound: (soundType: string) => void;
}

const SOUND_OPTIONS = [
  { id: 'none', label: 'None', sound: '' },
  { id: 'quack', label: '🦆 Quack', sound: 'quack' },
  { id: 'airhorn', label: '🎺 Airhorn', sound: 'airhorn' },
  { id: 'badum', label: '🥁 Ba-Dum-Tss', sound: 'deafen' },
  { id: 'golfclap', label: '👏 Golf Clap', sound: 'message' },
];

export const VoiceSoundboardSection: React.FC<VoiceSoundboardSectionProps> = ({
  t,
  soundboardVolume,
  setSoundboardVolume,
  entranceServer,
  setEntranceServer,
  entranceSound,
  setEntranceSound,
  isChoosingEntranceSound,
  setIsChoosingEntranceSound,
  playPreviewSound,
}) => {
  const getEntranceSoundLabel = () => {
    switch (entranceSound) {
      case 'none':
        return 'None';
      case 'quack':
        return '🦆 Quack';
      case 'airhorn':
        return '🎺 Airhorn';
      case 'badum':
        return '🥁 Ba-Dum-Tss';
      default:
        return '👏 Golf Clap';
    }
  };

  return (
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
          className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <p className="text-[11px] text-muted-foreground">
          {t('Control how loud sounds are for you personally.')}{' '}
          <span
            onClick={() => toast.info(t('Soundboard Volume hanya memengaruhi volume yang Anda dengar, bukan pengguna lain.'))}
            className="text-primary hover:underline cursor-pointer font-medium"
          >
            {t('Learn more about Soundboard volume.')}
          </span>
        </p>
      </div>

      {/* Entrance Sounds */}
      <div className="space-y-3 pt-2">
        <div>
          <div className="text-xs font-bold text-foreground">{t('Entrance Sounds')}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {t(
              'Choose a Soundboard sound to automatically play whenever you join a voice channel. Right-click on a voice channel to join without playing your entrance sound.',
            )}{' '}
            <span
              onClick={() => toast.info(t('Fitur Entrance Sounds memainkan sound effect kustom secara otomatis ketika Anda masuk ke room suara.'))}
              className="text-primary hover:underline cursor-pointer font-medium"
            >
              {t('Learn More.')}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Choose a Server */}
          <div>
            <FormDropdown
              label={t('Choose a Server')}
              value={entranceServer}
              onChange={(val) => setEntranceServer(val)}
              options={[
                { value: 'all', label: 'All Servers' },
                { value: 's1', label: "zmsta's server" },
                { value: 's2', label: 'Anticeil Official Community' },
                { value: 's3', label: 'Developer Hub Colony' },
              ]}
            />
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
                <span>{getEntranceSoundLabel()}</span>
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
              {SOUND_OPTIONS.map((snd) => (
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
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card border-border/60 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span>{snd.label}</span>
                  {entranceSound === snd.id && <Check className="w-3 h-3 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
