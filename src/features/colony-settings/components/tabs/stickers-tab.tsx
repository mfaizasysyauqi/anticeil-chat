import React, { useState, useRef } from 'react';
import {
  Lock,
  Sparkles,
  Gem,
  Check,
  Upload,
  Trash2,
  Sticker as StickerIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonySticker } from '@/chat/chat-types';

interface StickersTabProps {
  activeColony: Colony;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onNavigateSection?: (section: string) => void;
  t: (key: string) => string;
}

export function StickersTab({
  activeColony,
  onUpdateColony,
  onNavigateSection,
  t,
}: StickersTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stickers, setStickers] = useState<ColonySticker[]>(
    activeColony.stickers || [],
  );

  const boostTier = activeColony.boostTier || 0;

  // Max free slots is 5; higher levels add more slots
  const totalSlots =
    boostTier >= 3 ? 60 : boostTier === 2 ? 30 : boostTier === 1 ? 15 : 5;
  const availableSlots = Math.max(0, totalSlots - stickers.length);

  const handleUploadSticker = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (stickers.length >= totalSlots) {
      toast.error(t('Batas slot stiker untuk tingkat saat ini telah penuh.'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('Ukuran stiker maksimal 512 KB / 2 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      if (url) {
        const rawName = file.name.split('.')[0] || 'sticker';
        const newSticker: ColonySticker = {
          id: `sticker_${Date.now()}`,
          name: rawName.replace(/[^a-zA-Z0-9_ -]/g, '').slice(0, 30),
          url,
        };
        const next = [...stickers, newSticker];
        setStickers(next);
        await onUpdateColony(activeColony.id, { stickers: next });
        toast.success(t(`Stiker "${newSticker.name}" berhasil diunggah! 🎨`));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/apng,image/gif,image/webp"
        onChange={(e) => {
          handleUploadSticker(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Stickers')}</h2>
      </div>

      {/* Top Banner: Get Boosted (Discord 1:1 Parity) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#c026d3] p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-xl text-center mx-auto space-y-3">
          <h3 className="text-xl font-extrabold tracking-tight">
            {t('Get Boosted')}
          </h3>
          <p className="text-xs text-white/90 leading-relaxed max-w-md mx-auto">
            {t(
              'Enjoy more stickers and other perks by boosting your server to Level 1. Each Level unlocks more sticker slots and new benefits for everyone.',
            )}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              type="button"
              onClick={() => onNavigateSection?.('boost')}
              className="bg-white hover:bg-white/90 text-slate-900 font-bold text-xs h-9 px-5 rounded-lg cursor-pointer shadow-md"
            >
              {t('Boost Server')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.info(t('Server Boosting membuka slot stiker ekstra.'))
              }
              className="bg-transparent hover:bg-white/10 text-white border-white/40 text-xs h-9 px-4 rounded-lg cursor-pointer"
            >
              {t('Learn More')}
            </Button>
          </div>
        </div>

        {/* Decorative Floating Crystal Emojis */}
        <div className="absolute top-4 left-6 text-2xl opacity-60">💎</div>
        <div className="absolute bottom-4 left-16 text-xl opacity-40">✨</div>
        <div className="absolute top-6 right-10 text-3xl opacity-70">💎</div>
        <div className="absolute bottom-4 right-20 text-xl opacity-50">✨</div>
      </div>

      {/* Progression Timeline (Discord 1:1 Parity) */}
      <div className="relative pl-6 pt-2 space-y-8 before:absolute before:left-2.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
        {/* TIER 0: FREE SLOTS */}
        <div className="relative space-y-3">
          {/* Timeline Dot Indicator */}
          <div className="absolute -left-6 top-1 size-5 rounded-full bg-[#ec4899] text-white flex items-center justify-center text-[10px] font-bold shadow-md">
            ✓
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground">
              {t('No Server Boost')}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                'No one has bestowed Boosts to this server yet. See if any members would kindly bless your server for server-wide Boost Perks!',
              )}
            </p>
          </div>

          {/* Free Slots Card */}
          <div className="rounded-xl border border-border/80 bg-[#1e1f22] p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-foreground">
                  {t('Free Slots')}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {availableSlots} {t('of 5 slots available')}
                </span>
              </div>

              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold h-8 px-3.5 rounded-lg cursor-pointer"
              >
                {t('Upload Sticker')}
              </Button>
            </div>

            {/* Grid of 5 Sticker Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const sticker = stickers[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    className="h-28 rounded-xl bg-[#2b2d31]/70 border border-border/50 flex flex-col items-center justify-center p-2 relative group overflow-hidden"
                  >
                    {sticker ? (
                      <>
                        <img
                          src={sticker.url}
                          alt={sticker.name}
                          className="w-14 h-14 object-contain mb-1 transition-transform group-hover:scale-105"
                        />
                        <span className="text-[10px] font-medium text-foreground truncate max-w-full px-1">
                          {sticker.name}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            const next = stickers.filter(
                              (s) => s.id !== sticker.id,
                            );
                            setStickers(next);
                            await onUpdateColony(activeColony.id, {
                              stickers: next,
                            });
                            toast.success(
                              t(`Stiker "${sticker.name}" dihapus.`),
                            );
                          }}
                          className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center text-center cursor-pointer w-full h-full"
                      >
                        {/* Discord gray wumpus/hair-dryer sticker placeholder */}
                        <div className="text-2xl opacity-30 mb-1">🏷️</div>
                        <span className="text-[9px] text-muted-foreground/60 font-semibold">
                          {t('Empty Slot')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TIER 1 */}
        <div className="relative space-y-3">
          <div className="absolute -left-6 top-1 size-5 rounded-full bg-[#2b2d31] border border-border text-muted-foreground flex items-center justify-center text-[10px]">
            💎
          </div>

          <div className="rounded-xl border border-border/80 bg-[#1e1f22] p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span className="text-sm font-bold text-foreground">
                {t('Level 1')}
              </span>
              <div className="flex items-center gap-1.5">
                <span>2 Boosts</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-3xl opacity-40">🏷️</div>
              <div className="text-xs font-semibold text-muted-foreground">
                +10 Sticker Slots
              </div>
              <Button
                type="button"
                onClick={() => onNavigateSection?.('boost')}
                className="bg-[#23a55a] hover:bg-[#1d8b4c] text-white text-xs font-bold px-4 h-8 rounded-lg cursor-pointer"
              >
                {t('Buy Level')}
              </Button>
            </div>
          </div>
        </div>

        {/* TIER 2 */}
        <div className="relative space-y-3">
          <div className="absolute -left-6 top-1 size-5 rounded-full bg-[#2b2d31] border border-border text-muted-foreground flex items-center justify-center text-[10px]">
            💎
          </div>

          <div className="rounded-xl border border-border/80 bg-[#1e1f22] p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span className="text-sm font-bold text-foreground">
                {t('Level 2')}
              </span>
              <div className="flex items-center gap-1.5">
                <span>7 Boosts</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-3xl opacity-40">🏷️</div>
              <div className="text-xs font-semibold text-muted-foreground">
                +15 Sticker Slots (30 total)
              </div>
              <Button
                type="button"
                onClick={() => onNavigateSection?.('boost')}
                className="bg-[#23a55a] hover:bg-[#1d8b4c] text-white text-xs font-bold px-4 h-8 rounded-lg cursor-pointer"
              >
                {t('Buy Level')}
              </Button>
            </div>
          </div>
        </div>

        {/* TIER 3 */}
        <div className="relative space-y-3">
          <div className="absolute -left-6 top-1 size-5 rounded-full bg-[#2b2d31] border border-border text-muted-foreground flex items-center justify-center text-[10px]">
            💎
          </div>

          <div className="rounded-xl border border-border/80 bg-[#1e1f22] p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span className="text-sm font-bold text-foreground">
                {t('Level 3')}
              </span>
              <div className="flex items-center gap-1.5">
                <span>14 Boosts</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-3xl opacity-40">🏷️</div>
              <div className="text-xs font-semibold text-muted-foreground">
                +30 Sticker Slots (60 total)
              </div>
              <Button
                type="button"
                onClick={() => onNavigateSection?.('boost')}
                className="bg-[#23a55a] hover:bg-[#1d8b4c] text-white text-xs font-bold px-4 h-8 rounded-lg cursor-pointer"
              >
                {t('Buy Level')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
