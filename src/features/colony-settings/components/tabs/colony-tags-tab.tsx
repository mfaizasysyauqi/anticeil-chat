import React, { useState, useRef, useMemo } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Pipette,
  Gem,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Colony } from '@/chat/chat-types';
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
  // Color picker hidden input ref
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
    initialTag?.color || '#ec4899',
  );
  const [showAllBadges, setShowAllBadges] = useState(false);

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

  return (
    <div className="w-full">
      {/* Hidden Color Picker for custom color */}
      <input
        type="color"
        ref={colorPickerInputRef}
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
        className="hidden"
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN: CONTROLS */}
        <div className="flex-1 space-y-6 max-w-xl">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {t('Server Tag')}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t(
                'Create a tag that your server members can display next to their name! Anyone outside your server can view your Server Profile through the Server Tag, and if applications are enabled, they can apply to join.',
              )}
            </p>
          </div>

          {/* Blue Info Notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#1e293b]/70 border border-blue-500/30 text-xs text-blue-200">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span>
                {t(
                  'Your Server Profile is private. Users will not be able to see it from a Server Tag.',
                )}{' '}
              </span>
              <button
                type="button"
                onClick={() => onNavigateSection?.('profile')}
                className="text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                {t('Edit Setting')}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5865F2] via-[#8b5cf6] to-[#ec4899] text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:opacity-95 transition-opacity cursor-pointer border border-white/20"
            >
              <Gem className="w-4 h-4 text-white" />
              <span>{t('Unlock with Boosting')}</span>
            </button>
          </div>

          {/* Choose Name Section */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Choose Name')}
              </label>
              <span className="text-[11px] text-muted-foreground">
                {t('You may use max 4 characters, alphabet and numbers.')}
              </span>
            </div>

            <div className="relative flex items-center bg-[#1e1f22] border border-border/80 rounded-xl px-3.5 h-12 focus-within:border-[#5865F2] transition-colors">
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

          {/* Gray Warning Box */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#1e1f22] border border-border/60 text-xs text-muted-foreground leading-relaxed">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <span>
                {t(
                  'Updating your Server Tag will require all of your members to manually reapply the tag to their profile. We do this to prevent abuse.',
                )}{' '}
              </span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info(
                    t('Server tag adalah lencana identitas untuk para anggota server.'),
                  );
                }}
                className="text-blue-400 hover:underline font-semibold"
              >
                {t('Learn more')}
              </a>
            </div>
          </div>

          {/* Choose Badge Section */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                {t('Choose Badge')}
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("Changing just the badge won't remove the Server Tag from members.")}
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
                      'h-14 rounded-xl flex items-center justify-center border transition-all cursor-pointer bg-[#1e1f22]',
                      isSelected
                        ? 'border-[#5865F2] ring-2 ring-[#5865F2] bg-[#2b2d31] scale-105 shadow-md'
                        : 'border-border/60 hover:border-border hover:bg-[#2b2d31]/70',
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
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold pt-1 transition-colors cursor-pointer"
            >
              <span>{showAllBadges ? t('Show fewer badges') : t('Show all badges')}</span>
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
              {t('Choose Color')}
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
                      'h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer bg-[#1e1f22]',
                      isSelected
                        ? 'border-white ring-2 ring-[#5865F2] bg-[#2b2d31] scale-105'
                        : 'border-border/60 hover:border-border hover:bg-[#2b2d31]/70',
                    )}
                    title={c.name}
                  >
                    {activeBadge.icon(c.hex, 'w-5 h-5')}
                  </button>
                );
              })}

              {/* 15th: Custom Pipette Eyedropper */}
              <button
                type="button"
                onClick={() => colorPickerInputRef.current?.click()}
                className={cn(
                  'h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer bg-[#1e1f22]',
                  !colorOptions.some(
                    (c) => c.hex.toLowerCase() === selectedColor.toLowerCase(),
                  )
                    ? 'border-white ring-2 ring-[#5865F2] bg-[#2b2d31]'
                    : 'border-border/60 hover:border-border hover:bg-[#2b2d31]/70',
                )}
                title={t('Pilih Warna Kustom')}
              >
                <Pipette className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <Button
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
              onClick={async () => {
                await onUpdateColony(activeColony.id, {
                  serverTag: {
                    name: tagName,
                    badge: selectedBadgeId,
                    color: selectedColor,
                  },
                } as any);
                toast.success(t('Server Tag berhasil disimpan! 🎉'));
                onClose?.();
              }}
            >
              {t('Simpan Perubahan')}
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

        {/* RIGHT COLUMN: DISCORD LIVE CHAT PREVIEW */}
        <div className="w-full sm:w-80 shrink-0 sticky top-2">
          <div className="rounded-2xl border border-border/80 bg-[#111214] shadow-2xl p-4 overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              {t('Chat Preview')}
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
              <div className="flex items-start gap-3 p-1.5 -mx-1.5 rounded-xl bg-white/[0.03]">
                <div className="relative shrink-0">
                  <div className="size-9 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-xs font-bold text-amber-300 shadow-md">
                    🐰
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-extrabold text-amber-300">Lily</span>

                    {/* LIVE SERVER TAG BADGE */}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-[#1e1f22] border border-white/10 text-[10px] font-bold shadow-xs">
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
                    check out my tag!
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
                    woah how did you get that
                  </div>
                </div>
              </div>

              {/* Message 5: Lily */}
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                  🐰
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-extrabold text-amber-300">Lily</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-[#1e1f22] border border-white/10 text-[10px] font-bold shadow-xs">
                      {activeBadge.icon(selectedColor, 'w-3.5 h-3.5')}
                      <span
                        className="tracking-wider uppercase font-black"
                        style={{ color: selectedColor }}
                      >
                        {tagName || 'TAG'}
                      </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">14:23</span>
                  </div>
                  <div className="text-xs text-foreground font-medium mt-0.5">
                    anyone here can get it!
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
