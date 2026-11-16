import React, { useState } from 'react';
import {
  ChevronDown,
  Pencil,
  Sparkles,
  Eye,
  Palette,
  X,
  Plus,
  Gamepad2,
  ExternalLink,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { ProfilePreviewCard } from '@/features/user-settings/components/tabs/profiles/profile-preview-card';

export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  currentUserName: string;
  onNavigateSection?: (section: string) => void;
  onOpenUserSettings?: (section?: string) => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  currentUser,
  currentUserName,
  onNavigateSection,
  onOpenUserSettings,
}: EditProfileDialogProps) {
  const { t } = useTranslation();
  const [profileSubTab, setProfileSubTab] = useState<'board' | 'activity' | 'wishlist'>('board');
  const [profileSelectedType, setProfileSelectedType] = useState<'main' | 'server'>('main');
  const [profileBannerColor, setProfileBannerColor] = useState('#5c4d44');
  const [profileStatusThought, setProfileStatusThought] = useState('Shower thought?');
  const [isEditingStatusThought, setIsEditingStatusThought] = useState(false);
  const [profileBioText, setProfileBioText] = useState('Your life in one sentence');
  const [isEditingBioText, setIsEditingBioText] = useState(false);
  const [profilePronouns, setProfilePronouns] = useState('');
  const [isEditingPronouns, setIsEditingPronouns] = useState(false);
  const [profileWidgetsDismissed, setProfileWidgetsDismissed] = useState(false);

  const handleNitroCta = () => {
    onOpenChange(false);
    if (onOpenUserSettings) {
      onOpenUserSettings('nitro');
    } else if (onNavigateSection) {
      onNavigateSection('nitro');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 w-[90vw] sm:w-[90vw] max-w-[90vw] sm:max-w-[90vw] h-[90vh] sm:h-[90dvh] max-h-[90vh] sm:max-h-[90dvh] overflow-hidden bg-card border border-border flex flex-col rounded-2xl shadow-2xl relative gap-0 select-none"
      >
        <DialogTitle className="sr-only">{t('Edit Profiles')}</DialogTitle>

        {/* Discord-style Close Button Top-Right (with ESC hint) */}
        <div className="absolute top-3.5 right-4 z-50 flex flex-col items-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-full border border-border/80 bg-background/90 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer shadow-sm group"
            title={t('Tutup (ESC)')}
            aria-label={t('Tutup')}
          >
            <X className="size-4 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mt-1">
            ESC
          </span>
        </div>

        {/* Main 3-Column Profile Editor Body */}
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col lg:flex-row">
          {/* COLUMN 1: LEFT CUSTOMIZATION CONTROLS */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border/60 bg-background/30 p-4 sm:p-5 overflow-y-auto [scrollbar-width:thin] space-y-4">
            {/* Profile Switcher (Main Profile / Colony Profile) */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setProfileSelectedType((prev) => (prev === 'main' ? 'server' : 'main'))
                }
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    {t('Profiles')}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {profileSelectedType === 'main' ? t('Main Profile') : t('Server Profile')}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* 1. Nameplate */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Nameplate')}
              </span>
              <div
                onClick={() => toast.info(t('Pilih gaya nameplate favorit Anda di Shop!'))}
                className="p-3 rounded-xl border border-border/70 bg-card hover:border-border flex items-center justify-between cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-6 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-foreground text-xs font-bold">
                    👾
                  </div>
                  <div className="h-3 w-24 rounded-full bg-muted/70" />
                </div>
                <div className="size-6 rounded-full bg-muted/60 group-hover:bg-primary text-muted-foreground group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* 2. Avatar & Decoration */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Avatar & Decoration')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => toast.info(t('Klik pada avatar untuk mengganti foto'))}
                  className="p-3 rounded-xl border border-border/70 bg-card hover:border-border flex items-center justify-center cursor-pointer group relative transition-colors"
                >
                  <div className="size-12 rounded-full overflow-hidden border border-border/80 bg-muted/40 flex items-center justify-center text-xl shadow-inner">
                    🐱
                  </div>
                </div>
                <div
                  onClick={() => toast.info(t('Jelajahi dekorasi avatar unik di Nitro Shop!'))}
                  className="p-3 rounded-xl border border-border/70 bg-card hover:border-border flex items-center justify-center cursor-pointer group transition-colors"
                >
                  <div className="size-12 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Banner Color */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Banner Color')}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profileBannerColor}
                  onChange={(e) => setProfileBannerColor(e.target.value)}
                  className="size-8 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <div
                  className="flex-1 h-8 rounded-lg border border-border/70 flex items-center px-3 text-xs font-mono text-muted-foreground shadow-xs"
                  style={{ backgroundColor: profileBannerColor }}
                >
                  <span className="bg-black/60 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">
                    {profileBannerColor}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Profile Effect & Frame */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Profile Effect & Frame')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => toast.info(t('Efek profil tersedia di Shop!'))}
                  className="p-3 rounded-xl border border-border/70 bg-card hover:border-border flex flex-col items-center justify-center gap-1 cursor-pointer group transition-colors"
                >
                  <Sparkles className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[10px] text-muted-foreground font-medium">+ Effect</span>
                </div>
                <div
                  onClick={() => toast.info(t('Bingkai profil tersedia di Shop!'))}
                  className="p-3 rounded-xl border border-border/70 bg-card hover:border-border flex flex-col items-center justify-center gap-1 cursor-pointer group transition-colors"
                >
                  <div className="size-6 rounded-md border border-dashed border-muted-foreground/60 group-hover:border-primary flex items-center justify-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">+ Frame</span>
                </div>
              </div>
            </div>

            {/* 5. Nitro Promo Box */}
            <div className="p-3.5 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 to-purple-500/15 space-y-2.5">
              <div className="text-xs font-semibold text-foreground leading-snug">
                {t('Level up your look, only with Nitro')}
              </div>
              <Button
                size="sm"
                onClick={handleNitroCta}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 font-semibold cursor-pointer shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                {t('Preview Nitro')}
              </Button>
            </div>

            {/* 6. Display Name Style */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Display Name Style')}
              </span>
              <div className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-center">
                <span className="text-sm font-extrabold text-emerald-400 tracking-wide font-mono">
                  {currentUserName}
                </span>
              </div>
            </div>

            {/* 7. Profile Theme */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Profile Theme')}
              </span>
              <div className="h-12 rounded-xl border border-border/70 bg-gradient-to-r from-pink-500/80 to-cyan-500/80 p-2 flex items-center justify-between">
                <div className="size-5 rounded-full border-2 border-white bg-pink-500 shadow-sm" />
                <div className="size-5 rounded-full border-2 border-white bg-cyan-500 shadow-sm" />
              </div>
            </div>
          </div>

          {/* COLUMN 2: MIDDLE LIVE PROFILE CARD PREVIEW */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-border/60 bg-muted/20 p-4 sm:p-5 flex items-start justify-center overflow-y-auto [scrollbar-width:thin]">
            <ProfilePreviewCard
              currentUserName={currentUserName}
              profileBannerColor={profileBannerColor}
              profileStatusThought={profileStatusThought}
              setProfileStatusThought={setProfileStatusThought}
              isEditingStatusThought={isEditingStatusThought}
              setIsEditingStatusThought={setIsEditingStatusThought}
              profilePronouns={profilePronouns}
              setProfilePronouns={setProfilePronouns}
              isEditingPronouns={isEditingPronouns}
              setIsEditingPronouns={setIsEditingPronouns}
              profileBioText={profileBioText}
              setProfileBioText={setProfileBioText}
              isEditingBioText={isEditingBioText}
              setIsEditingBioText={setIsEditingBioText}
              onNavigateSection={handleNitroCta}
            />
          </div>

          {/* COLUMN 3: RIGHT PROFILE TABS (Board / Activity / Wishlist) */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto [scrollbar-width:thin] space-y-4">
            {/* Top Navigation Tabs */}
            <div className="flex items-center border-b border-border/60 gap-6 text-xs font-bold pb-2">
              <button
                type="button"
                onClick={() => setProfileSubTab('board')}
                className={cn(
                  'pb-2 transition-colors relative cursor-pointer',
                  profileSubTab === 'board'
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('Board')}
              </button>
              <button
                type="button"
                onClick={() => setProfileSubTab('activity')}
                className={cn(
                  'pb-2 transition-colors relative cursor-pointer',
                  profileSubTab === 'activity'
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('Activity')}
              </button>
              <button
                type="button"
                onClick={() => setProfileSubTab('wishlist')}
                className={cn(
                  'pb-2 transition-colors relative cursor-pointer',
                  profileSubTab === 'wishlist'
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('Wishlist')}
              </button>
            </div>

            {/* TAB 1: BOARD */}
            {profileSubTab === 'board' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{t('Your Widgets')}</span>
                  <Button
                    size="sm"
                    onClick={() => toast.info(t('Fitur penambahan widget baru segera hadir!'))}
                    className="bg-secondary hover:bg-secondary/80 text-foreground text-xs px-3 h-8 font-semibold cursor-pointer shadow-xs"
                  >
                    + {t('Add Widget')}
                  </Button>
                </div>

                {/* Suggested for you */}
                {!profileWidgetsDismissed && (
                  <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-3 relative shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {t('Suggested for you')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setProfileWidgetsDismissed(true)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
                        title={t('Tutup')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => toast.success(t('Widget Favorite Game ditambahkan ke Board!'))}
                        className="h-24 rounded-xl border border-border/60 bg-gradient-to-br from-slate-900 to-slate-950 p-3 flex flex-col justify-between hover:border-border cursor-pointer group shadow-sm transition-colors"
                      >
                        <div className="size-6 rounded-full bg-white/10 group-hover:bg-primary flex items-center justify-center text-xs text-white">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white/90">
                          {t('Favorite Game')}
                        </span>
                      </div>
                      <div
                        onClick={() => toast.success(t('Widget Games I Like ditambahkan ke Board!'))}
                        className="h-24 rounded-xl border border-border/60 bg-gradient-to-br from-rose-950/60 to-slate-950 p-3 flex flex-col justify-between hover:border-border cursor-pointer group shadow-sm transition-colors"
                      >
                        <div className="size-6 rounded-full bg-white/10 group-hover:bg-primary flex items-center justify-center text-xs text-white">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white/90">
                          {t('Games I Like')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connected Game Card */}
                <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-sm">
                        🌸
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Neverness to Everness
                        </div>
                        <div className="text-sm font-bold text-foreground">DartX</div>
                        <div className="text-[11px] text-muted-foreground">SEA</div>
                      </div>
                    </div>
                    <div className="size-14 rounded-xl overflow-hidden bg-muted/40 border border-border/60 hidden sm:flex items-center justify-center text-2xl">
                      🧙‍♀️
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-border/50 text-center">
                    <div>
                      <div className="text-base font-extrabold text-foreground">58</div>
                      <div className="text-[10px] text-muted-foreground">Hunter Lv.</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-foreground font-mono">
                        2026-04-29
                      </div>
                      <div className="text-[10px] text-muted-foreground">Appraiser Since</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-foreground">23</div>
                      <div className="text-[10px] text-muted-foreground">Characters</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-foreground">10</div>
                      <div className="text-[10px] text-muted-foreground">Vehicles</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">275</div>
                      <div className="text-[10px] text-muted-foreground">Achievements</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">45</div>
                      <div className="text-[10px] text-muted-foreground">City Tycoon Lv.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACTIVITY */}
            {profileSubTab === 'activity' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl border border-border/70 bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {t('Sedang Bermain Game')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Neverness to Everness • 2 {t('jam yang lalu')}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info(t('Fitur gabung game segera hadir!'))}
                    className="text-xs h-7 cursor-pointer"
                  >
                    {t('Gabung')}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: WISHLIST */}
            {profileSubTab === 'wishlist' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="p-6 rounded-xl border border-dashed border-border/80 text-center space-y-2">
                  <div className="text-2xl">🎁</div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Wishlist Anda Kosong')}
                  </div>
                  <div className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    {t('Tambahkan game atau dekorasi profil dari Shop ke wishlist Anda!')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
