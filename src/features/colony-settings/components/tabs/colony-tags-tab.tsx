import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Pipette,
  Gem,
  CheckCircle2,
  Tag,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Colony } from '@/chat/chat-types';
import { colonyApi } from '@/features/colonies/api/colonies-api';
import {
  ALL_TAG_BADGES,
  TAG_COLOR_OPTIONS,
  type ServerTagBadge,
} from './colony-tags-badges';

export type { ServerTagBadge };

interface ColonyTagsTabProps {
  activeColony: Colony;
  serverTags: string[];
  setServerTags: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onNavigateSection?: (section: string) => void;
  onClose?: () => void;
  t: (key: string) => string;
}

export function ColonyTagsTab({
  activeColony,
  serverTags,
  setServerTags,
  onUpdateColony,
  onNavigateSection,
  onClose,
  t,
}: ColonyTagsTabProps) {
  const colorPickerInputRef = useRef<HTMLInputElement | null>(null);

  const allBadges = ALL_TAG_BADGES;
  const colorOptions = TAG_COLOR_OPTIONS;

  // Initial tag state from activeColony
  const initialTag = activeColony.serverTag;
  const [tagName, setTagName] = useState<string>(initialTag?.name || 'WUMP');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>(
    initialTag?.badge || 'sword',
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    initialTag?.color || '#14b8a6',
  );
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Colony category tags state
  const [currentTags, setCurrentTags] = useState<string[]>(
    activeColony.tags && activeColony.tags.length > 0 ? activeColony.tags : ['komunitas']
  );
  const [newTagInput, setNewTagInput] = useState('');

  // Fetch live tag on mount
  useEffect(() => {
    colonyApi.getColonyTag(activeColony.id).then((tag) => {
      if (tag) {
        if (tag.name) setTagName(tag.name);
        if (tag.badge) setSelectedBadgeId(tag.badge);
        if (tag.color) setSelectedColor(tag.color);
      }
    }).catch(() => {});
  }, [activeColony.id]);

  // Active badge object
  const activeBadge = useMemo(() => {
    return (
      allBadges.find((b) => b.id === selectedBadgeId) ||
      allBadges[1] /* sword */
    );
  }, [allBadges, selectedBadgeId]);

  // Badges to display (10 initially, all when expanded)
  const visibleBadges = useMemo(() => {
    return showAllBadges ? allBadges : allBadges.slice(0, 10);
  }, [allBadges, showAllBadges]);

  const handleAddTag = () => {
    const val = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!val) return;
    if (currentTags.includes(val)) {
      toast.info(t('Tag ini sudah ditambahkan.'));
      return;
    }
    if (currentTags.length >= 8) {
      toast.error(t('Maksimal 8 tag per server.'));
      return;
    }
    const updated = [...currentTags, val];
    setCurrentTags(updated);
    setServerTags(updated);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = currentTags.filter((t) => t !== tagToRemove);
    setCurrentTags(updated);
    setServerTags(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tagPayload = {
        name: tagName.trim() || 'WUMP',
        badge: selectedBadgeId,
        color: selectedColor,
      };
      await colonyApi.updateColonyTag(activeColony.id, tagPayload);
      await onUpdateColony(activeColony.id, {
        serverTag: tagPayload,
        tags: currentTags,
      } as any);
      toast.success(t('Server Tag & Lencana berhasil disimpan! 🎉'));
      onClose?.();
    } catch {
      toast.error(t('Gagal menyimpan server tag'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full text-foreground">
      {/* Hidden Color Picker for custom color */}
      <input
        type="color"
        ref={colorPickerInputRef}
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
        className="hidden"
      />

      <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-between">
        {/* LEFT COLUMN: CONTROLS */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">
                {t('Server Tag & Badges')}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Identity
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'Buat tag dan lencana unik yang dapat disematkan di samping nama anggota komunitas Anda dalam obrolan chat!'
              )}
            </p>
          </div>

          {/* Info Notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary/90">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span>
                {t(
                  'Tag dan lencana server akan terlihat di samping profil anggota ketika mereka mengirim pesan di server ini.'
                )}{' '}
              </span>
              <button
                type="button"
                onClick={() => onNavigateSection?.('profile')}
                className="text-primary hover:underline font-semibold cursor-pointer ml-1"
              >
                {t('Edit Profil Server')}
              </button>
            </div>
          </div>

          {/* Unlock with Boosting Pill Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                onNavigateSection?.('boost');
                toast.info(t('Server Tag memerlukan Colony Boost Level 2.'));
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 hover:opacity-95 transition-opacity cursor-pointer border border-white/20"
            >
              <Gem className="w-4 h-4 text-slate-950" />
              <span>{t('Unlocked via Server Boost Level 2')}</span>
            </button>
          </div>

          {/* Choose Name Section */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Nama Server Tag')}
              </label>
              <span className="text-[11px] text-muted-foreground">
                {t('Maksimal 4 karakter huruf & angka.')}
              </span>
            </div>

            <div className="relative flex items-center bg-card border border-border/80 rounded-xl px-3.5 h-12 focus-within:border-primary transition-colors">
              <div className="mr-3 flex items-center justify-center shrink-0">
                {activeBadge.icon(selectedColor, 'w-5 h-5')}
              </div>
              <input
                type="text"
                value={tagName}
                maxLength={4}
                onChange={(e) => {
                  const cleaned = e.target.value
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .slice(0, 4)
                    .toUpperCase();
                  setTagName(cleaned);
                }}
                placeholder="WUMP"
                className="bg-transparent text-sm font-bold tracking-wider text-foreground placeholder:text-muted-foreground/40 focus:outline-none w-full uppercase"
              />
            </div>
          </div>

          {/* Notice Box */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground leading-relaxed">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <span>
                {t(
                  'Mengubah Server Tag akan secara otomatis memperbarui lencana pada semua anggota komunitas.'
                )}
              </span>
            </div>
          </div>

          {/* Choose Badge Section */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                {t('Pilih Ikon Lencana (Badge)')}
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('Pilih simbol visual yang mewakili identitas komunitas Anda.')}
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {visibleBadges.map((badge) => {
                const isSelected = selectedBadgeId === badge.id;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelectedBadgeId(badge.id)}
                    className={cn(
                      'h-14 rounded-xl flex items-center justify-center border transition-all cursor-pointer bg-card',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/10 scale-105 shadow-md'
                        : 'border-border/60 hover:border-border hover:bg-muted/70',
                    )}
                    title={badge.name}
                  >
                    {badge.icon(
                      isSelected ? selectedColor : '#94a3b8',
                      'w-6 h-6 transition-transform group-hover:scale-110',
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowAllBadges((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold pt-1 transition-colors cursor-pointer"
            >
              <span>{showAllBadges ? t('Tampilkan lebih sedikit') : t('Tampilkan semua lencana')}</span>
              {showAllBadges ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Choose Color Section */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              {t('Pilih Warna Lencana & Tag')}
            </label>

            <div className="grid grid-cols-5 gap-2.5">
              {colorOptions.map((c) => {
                const isSelected =
                  selectedColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    className={cn(
                      'h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer bg-card',
                      isSelected
                        ? 'border-white ring-2 ring-primary bg-primary/10 scale-105'
                        : 'border-border/60 hover:border-border hover:bg-muted/70',
                    )}
                    title={c.name}
                  >
                    {activeBadge.icon(c.hex, 'w-5 h-5')}
                  </button>
                );
              })}

              {/* Custom Pipette Eyedropper */}
              <button
                type="button"
                onClick={() => colorPickerInputRef.current?.click()}
                className={cn(
                  'h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer bg-card',
                  !colorOptions.some(
                    (c) => c.hex.toLowerCase() === selectedColor.toLowerCase(),
                  )
                    ? 'border-white ring-2 ring-primary bg-primary/10'
                    : 'border-border/60 hover:border-border hover:bg-muted/70',
                )}
                title={t('Pilih Warna Kustom')}
              >
                <Pipette className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* Colony Category Tags (Discovery / Filter) */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                {t('Tag Kategori Server')}
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('Tag ini membantu pengguna menemukan server Anda di menu Eksplorasi Komunitas.')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="contoh: gaming, ai, dev, musik..."
                  className="pl-8 text-xs bg-card border-border/80 h-9 focus-visible:ring-primary/40"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddTag}
                className="h-9 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t('Tambah Tag')}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentTags.map((tVal) => (
                <span
                  key={tVal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary"
                >
                  <span>#{tVal}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tVal)}
                    className="text-primary/70 hover:text-primary transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer shadow-xs"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? t('Menyimpan...') : t('Simpan Perubahan')}
            </Button>
            {onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                className="text-xs h-9 px-4 rounded-lg cursor-pointer"
              >
                {t('Batal')}
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE CHAT PREVIEW */}
        <div className="w-full sm:w-80 shrink-0 sticky top-2">
          <div className="rounded-2xl border border-border/80 bg-card shadow-2xl p-4 overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              {t('Pratinjau Obrolan Live')}
            </div>

            <div className="space-y-4">
              {/* Message 1: Roka */}
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
                  🐱
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-rose-300">Roka</span>
                    <span className="text-[10px] text-muted-foreground">14:20</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    anyone down for aram
                  </div>
                </div>
              </div>

              {/* Message 2: hongo */}
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                  🐸
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-emerald-300">hongo</span>
                    <span className="text-[10px] text-muted-foreground">14:21</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    count me in
                  </div>
                </div>
              </div>

              {/* Message 3: Lily (WITH SERVER TAG) */}
              <div className="flex items-start gap-3 p-2 -mx-1.5 rounded-xl bg-primary/5 border border-primary/10">
                <div className="relative shrink-0">
                  <div className="size-9 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-xs font-bold text-primary shadow-md">
                    🐰
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-extrabold text-primary">Lily</span>

                    {/* LIVE SERVER TAG BADGE */}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-background border border-border text-[10px] font-bold shadow-xs">
                      {activeBadge.icon(selectedColor, 'w-3.5 h-3.5')}
                      <span
                        className="tracking-wider uppercase font-black"
                        style={{ color: selectedColor }}
                      >
                        {tagName || 'TAG'}
                      </span>
                    </span>

                    <span className="text-[10px] text-muted-foreground ml-auto">14:22</span>
                  </div>
                  <div className="text-xs text-foreground font-medium mt-0.5">
                    check out our new server tag!
                  </div>
                </div>
              </div>

              {/* Message 4: sharon */}
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300 shrink-0">
                  🦊
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-cyan-300">sharon</span>
                    <span className="text-[10px] text-muted-foreground">14:22</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    woah look at that badge!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
