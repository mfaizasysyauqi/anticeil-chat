import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonySticker } from '@/chat/chat-types';
import { colonyApi } from '@/features/colonies/api/colonies-api';

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

  useEffect(() => {
    let isMounted = true;
    const fetchStickers = async () => {
      try {
        const dbStickers = await colonyApi.getServerStickers(activeColony.id);
        if (isMounted && Array.isArray(dbStickers) && dbStickers.length > 0) {
          const mapped: ColonySticker[] = dbStickers.map((s) => ({
            id: s.id,
            name: s.name,
            url: s.url,
          }));
          setStickers(mapped);
        }
      } catch (err) {
        console.error('Failed to load server stickers:', err);
      }
    };
    fetchStickers();
    return () => {
      isMounted = false;
    };
  }, [activeColony.id]);

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
        const cleanName = rawName.replace(/[^a-zA-Z0-9_ -]/g, '').slice(0, 30);

        try {
          const created = await colonyApi.addServerSticker(activeColony.id, {
            name: cleanName,
            url,
          });

          const newSticker: ColonySticker = {
            id: created?.id || `sticker_${Date.now()}`,
            name: cleanName,
            url,
          };
          const next = [...stickers, newSticker];
          setStickers(next);
          await onUpdateColony(activeColony.id, { stickers: next });
          toast.success(t(`Stiker "${newSticker.name}" berhasil diunggah! 🎨`));
        } catch {
          toast.error(t('Gagal mengunggah stiker ke server.'));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteSticker = async (sticker: ColonySticker) => {
    try {
      await colonyApi.deleteServerSticker(activeColony.id, sticker.id);
      const next = stickers.filter((s) => s.id !== sticker.id);
      setStickers(next);
      await onUpdateColony(activeColony.id, { stickers: next });
      toast.success(t(`Stiker "${sticker.name}" dihapus.`));
    } catch {
      toast.error(t('Gagal menghapus stiker.'));
    }
  };

  return (
    <div className="w-full space-y-6">
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

      {/* Top Banner: Get Boosted */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900/80 via-sidebar-primary/40 to-slate-900 border border-sidebar-primary/40 p-6 text-white relative overflow-hidden shadow-xl">
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
              variant="teal"
              onClick={() => onNavigateSection?.('boost')}
              className="font-bold text-xs h-9 px-5 rounded-lg cursor-pointer shadow-md"
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

      {/* Progression Timeline */}
      <div className="relative pl-6 pt-2 space-y-8 before:absolute before:left-2.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
        {/* TIER 0: FREE SLOTS */}
        <div className="relative space-y-3">
          {/* Timeline Dot Indicator */}
          <div className="absolute -left-6 top-1 size-5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-md">
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
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
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
                variant="teal"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold h-8 px-3.5 rounded-lg cursor-pointer"
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
                    className="h-28 rounded-xl bg-secondary border border-border/50 flex flex-col items-center justify-center p-2 relative group overflow-hidden"
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
                          onClick={() => handleDeleteSticker(sticker)}
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
          <div className="absolute -left-6 top-1 size-5 rounded-full bg-secondary border border-border text-muted-foreground flex items-center justify-center text-[10px]">
            💎
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
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
                variant="teal"
                onClick={() => onNavigateSection?.('boost')}
                className="text-xs font-bold px-4 h-8 rounded-lg cursor-pointer"
              >
                {t('Buy Level')}
              </Button>
            </div>
          </div>
        </div>

        {/* TIER 2 */}
        <div className="relative space-y-3">
          <div className="absolute -left-6 top-1 size-5 rounded-full bg-secondary border border-border text-muted-foreground flex items-center justify-center text-[10px]">
            💎
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
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
                variant="teal"
                onClick={() => onNavigateSection?.('boost')}
                className="text-xs font-bold px-4 h-8 rounded-lg cursor-pointer"
              >
                {t('Buy Level')}
              </Button>
            </div>
          </div>
        </div>

        {/* TIER 3 */}
        <div className="relative space-y-3">
          <div className="absolute -left-6 top-1 size-5 rounded-full bg-secondary border border-border text-muted-foreground flex items-center justify-center text-[10px]">
            💎
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
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
                variant="teal"
                onClick={() => onNavigateSection?.('boost')}
                className="text-xs font-bold px-4 h-8 rounded-lg cursor-pointer"
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
