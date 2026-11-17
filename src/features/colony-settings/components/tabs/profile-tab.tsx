import React, { useState, useRef, useMemo } from 'react';
import { Camera, Smile, CheckCircle2, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColonyInitials } from '@/features/colonies/components/colony-icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Colony, ColonyMember } from '@/chat/chat-types';

interface ProfileTabProps {
  activeColony: Colony;
  members: ColonyMember[];
  serverTags: string[];
  serverSettingsEditName: string;
  setServerSettingsEditName: (val: string) => void;
  serverSettingsEditDesc: string;
  setServerSettingsEditDesc: (val: string) => void;
  serverSettingsEditColor: string;
  setServerSettingsEditColor: (val: string) => void;
  serverSettingsEditIconUrl: string;
  setServerSettingsEditIconUrl: (val: string) => void;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose: () => void;
  t: (key: string) => string;
}

export function ProfileTab({
  activeColony,
  members,
  serverTags,
  serverSettingsEditName,
  setServerSettingsEditName,
  serverSettingsEditDesc,
  setServerSettingsEditDesc,
  serverSettingsEditColor,
  setServerSettingsEditColor,
  serverSettingsEditIconUrl,
  setServerSettingsEditIconUrl,
  onUpdateColony,
  onClose,
  t,
}: ProfileTabProps) {
  const serverIconFileInputRef = useRef<HTMLInputElement | null>(null);

  // 10 Preset Banner Gradients (Matching Discord Screenshots)
  const bannerGradients = useMemo(
    () => [
      { id: 'dark', name: 'Dark Noir', cls: 'from-[#111214] via-[#1a1b1e] to-[#2b2d31]' },
      { id: 'pink', name: 'Electric Pink', cls: 'from-[#f43f5e] via-[#e11d48] to-[#be123c]' },
      { id: 'red', name: 'Crimson Ember', cls: 'from-[#ef4444] via-[#dc2626] to-[#b91c1c]' },
      { id: 'orange', name: 'Sunset Orange', cls: 'from-[#f97316] via-[#ea580c] to-[#c2410c]' },
      { id: 'yellow', name: 'Warm Gold', cls: 'from-[#eab308] via-[#ca8a04] to-[#a16207]' },
      { id: 'purple', name: 'Mystic Purple', cls: 'from-[#a855f7] via-[#9333ea] to-[#7e22ce]' },
      { id: 'blue', name: 'Ocean Sky', cls: 'from-[#0ea5e9] via-[#0284c7] to-[#0369a1]' },
      { id: 'teal', name: 'Turquoise Mint', cls: 'from-[#14b8a6] via-[#0d9488] to-[#0f766e]' },
      { id: 'green', name: 'Olive Forest', cls: 'from-[#84cc16] via-[#65a30d] to-[#4d7c0f]' },
      { id: 'gray', name: 'Monochrome Steel', cls: 'from-[#64748b] via-[#475569] to-[#334155]' },
    ],
    [],
  );

  const [selectedGradientId, setSelectedGradientId] = useState<string>(() => {
    const match = bannerGradients.find((b) => b.cls === serverSettingsEditColor);
    return match ? match.id : 'dark';
  });

  // Up to 5 Traits
  const [traits, setTraits] = useState<string[]>(() => {
    if (serverTags && serverTags.length > 0) {
      return [...serverTags].slice(0, 5);
    }
    return ['Gaming', 'Hangout'];
  });

  const onlineMembersCount = useMemo(() => {
    return members.filter((m) => m.status === 'online').length;
  }, [members]);

  const activeGradient = useMemo(() => {
    return (
      bannerGradients.find((b) => b.id === selectedGradientId) ||
      bannerGradients[0]
    );
  }, [bannerGradients, selectedGradientId]);

  return (
    <div className="w-full">
      {/* Hidden File Input for Server Settings Icon Upload */}
      <input
        type="file"
        ref={serverIconFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            toast.error(t('Ukuran file maksimal 5 MB.'));
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = event.target?.result as string;
            if (res) {
              setServerSettingsEditIconUrl(res);
              toast.success(
                t(
                  'Foto colony berhasil dimuat! Klik "Simpan Perubahan" untuk menerapkan.',
                ),
              );
            }
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Main 2-Column Discord Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN: EDIT FORM */}
        <div className="flex-1 space-y-6 max-w-xl">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {t('Server Profile')}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t(
                'Customize how your server appears in invite links and, if enabled, in Server Discovery and Announcement Channel messages',
              )}
            </p>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('Name')}
            </label>
            <Input
              value={serverSettingsEditName}
              onChange={(e) => setServerSettingsEditName(e.target.value)}
              placeholder="e.g. zmsta's server"
              className="h-10 text-sm bg-[#1e1f22] border-border/80 text-foreground"
            />
          </div>

          {/* Icon Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('Icon')}
            </label>
            <div className="text-xs text-muted-foreground">
              {t('We recommend an image of at least 512x512.')}
            </div>
            <Button
              type="button"
              onClick={() => serverIconFileInputRef.current?.click()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 h-9 rounded-lg cursor-pointer"
            >
              {t('Change Server Icon')}
            </Button>
          </div>

          <div className="border-b border-border/50 my-6" />

          {/* Banner Field (10 Swatches) */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              {t('Banner')}
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {bannerGradients.map((b) => {
                const isSelected = selectedGradientId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedGradientId(b.id);
                      setServerSettingsEditColor(b.cls);
                    }}
                    className={cn(
                      'h-12 rounded-xl transition-all relative overflow-hidden border cursor-pointer group shadow-sm bg-gradient-to-br',
                      b.cls,
                      isSelected
                        ? 'border-white ring-2 ring-primary scale-105'
                        : 'border-white/10 hover:border-white/40 hover:scale-105',
                    )}
                    title={b.name}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Traits Field (Up to 5) */}
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Traits')}
              </label>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t(
                  "Add up to 5 traits to show off your server's interests and personality.",
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card focus-within:border-primary transition-colors"
                >
                  <Smile className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder={t('Add a trait...')}
                    value={traits[idx] || ''}
                    onChange={(e) => {
                      const next = [...traits];
                      next[idx] = e.target.value;
                      setTraits(next);
                    }}
                    className="text-xs bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:outline-none w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-b border-border/50 my-6" />

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('Description')}
            </label>
            <div className="text-xs text-muted-foreground mb-1.5">
              {t('How did your server get started? Why should people join?')}
            </div>
            <textarea
              value={serverSettingsEditDesc}
              onChange={(e) => setServerSettingsEditDesc(e.target.value)}
              placeholder={t('Tell the world a bit about this server.')}
              rows={3}
              className="w-full text-xs text-foreground bg-card border border-border rounded-xl p-3 focus:outline-none focus:border-primary min-h-[90px] resize-none leading-relaxed"
            />
          </div>

          {/* Footer Save & Cancel Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
              onClick={async () => {
                const cleanedTraits = traits.filter((t) => t && t.trim().length > 0);
                await onUpdateColony(activeColony.id, {
                  name: serverSettingsEditName,
                  description: serverSettingsEditDesc,
                  color: activeGradient.cls,
                  iconUrl: serverSettingsEditIconUrl || undefined,
                  tags: cleanedTraits,
                } as any);
                toast.success(t('Profil colony berhasil diperbarui! ✅'));
                onClose();
              }}
            >
              {t('Simpan Perubahan')}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-lg cursor-pointer"
            >
              {t('Batal')}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE SERVER CARD PREVIEW (Discord Parity) */}
        <div className="w-full sm:w-80 shrink-0 sticky top-2">
          <div className="rounded-2xl border border-border/80 bg-[#111214] shadow-2xl overflow-hidden">
            {/* Top Banner with live gradient */}
            <div
              className={cn(
                'h-32 bg-gradient-to-r relative transition-all duration-300',
                activeGradient.cls,
              )}
            />

            {/* Content overlapping banner */}
            <div className="px-4 pb-5">
              <div
                onClick={() => serverIconFileInputRef.current?.click()}
                className="relative group w-16 h-16 rounded-[18px] border-4 border-[#111214] bg-[#2b2d31] flex items-center justify-center -mt-8 text-xl font-bold text-white shadow-lg overflow-hidden cursor-pointer"
                title={t('Klik untuk mengganti foto server')}
              >
                {serverSettingsEditIconUrl ? (
                  <img
                    src={serverSettingsEditIconUrl}
                    alt="Server icon"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {getColonyInitials(serverSettingsEditName || activeColony?.name)}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-semibold transition-opacity">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>{t('Ganti')}</span>
                </div>
              </div>

              {/* Server Name & Badges */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-extrabold text-white leading-tight">
                  {serverSettingsEditName || activeColony?.name || 'Server'}
                </span>
                <span
                  className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold"
                  title="Verified Server"
                >
                  ✓
                </span>
              </div>

              {/* Online status & members */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                  {onlineMembersCount} {t('Online')}
                </span>
                <span>•</span>
                <span>
                  {members.length > 0 ? members.length : 1} {t('Member')}
                </span>
              </div>

              {/* Est. date */}
              <div className="text-xs text-muted-foreground/80 mt-1">
                Est. Oct 2026
              </div>

              {/* Traits Badges Preview */}
              {traits.filter((tr) => tr && tr.trim()).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {traits
                    .filter((tr) => tr && tr.trim())
                    .map((tr, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e1f22] border border-border/60 text-foreground"
                      >
                        #{tr.trim()}
                      </span>
                    ))}
                </div>
              )}

              {/* Description Preview */}
              {(serverSettingsEditDesc || activeColony?.description) && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed border-t border-border/40 pt-2">
                  {serverSettingsEditDesc || activeColony?.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
