import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, Pencil, Upload, Sparkles, Smile, Eye, Palette, Zap, X,
  Heart, Check, MessageSquare, UserCheck, MoreHorizontal, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { availablePlatforms } from '../../data/platforms';

export interface ProfilesTabProps {
  currentUser: any;
  currentUserName: string;
  onNavigateSection?: (section: string) => void;
}

export function ProfilesTab({
  currentUser,
  currentUserName,
  onNavigateSection,
}: ProfilesTabProps) {
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


  return (
          <div className="flex flex-col xl:flex-row gap-6 pb-8 min-h-[620px]">
            {/* COLUMN 1: LEFT CUSTOMIZATION CONTROLS */}
            <div className="w-full xl:w-72 shrink-0 space-y-4 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Profile Switcher */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-[#1e1f22]">
                <span className="text-xs font-bold text-foreground">
                  {profileSelectedType === 'main' ? t('Main Profile') : t('Server Profile')}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* 1. Nameplate */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Nameplate')}
                </span>
                <div
                  onClick={() => toast.info(t('Pilih gaya nameplate favorit Anda di Shop!'))}
                  className="p-3 rounded-xl border border-border/70 bg-[#1e1f22] hover:border-border flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-md bg-[#5865F2] flex items-center justify-center text-white text-xs">
                      🤖
                    </div>
                    <div className="h-3 w-20 rounded-full bg-muted/60" />
                  </div>
                  <div className="size-6 rounded-full bg-muted/40 group-hover:bg-[#5865F2] text-muted-foreground group-hover:text-white flex items-center justify-center transition-colors">
                    +
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
                    className="p-3 rounded-xl border border-border/70 bg-[#1e1f22] hover:border-border flex items-center justify-center cursor-pointer group relative"
                  >
                    <div className="size-12 rounded-full overflow-hidden border border-border/60 bg-muted/40 flex items-center justify-center text-xl">
                      🐱
                    </div>
                  </div>
                  <div
                    onClick={() => toast.info(t('Jelajahi dekorasi avatar unik di Nitro Shop!'))}
                    className="p-3 rounded-xl border border-border/70 bg-[#1e1f22] hover:border-border flex items-center justify-center cursor-pointer group"
                  >
                    <div className="size-12 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground group-hover:text-[#5865F2] group-hover:border-[#5865F2] transition-colors">
                      +
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
                    className="flex-1 h-8 rounded-lg border border-border/70 flex items-center px-3 text-xs font-mono text-muted-foreground"
                    style={{ backgroundColor: profileBannerColor }}
                  >
                    <span className="bg-black/40 px-1.5 py-0.5 rounded text-white font-mono">
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
                    className="p-3 rounded-xl border border-border/70 bg-[#1e1f22] hover:border-border flex flex-col items-center justify-center gap-1 cursor-pointer group"
                  >
                    <Sparkles className="w-5 h-5 text-muted-foreground group-hover:text-[#5865F2]" />
                    <span className="text-[10px] text-muted-foreground">+ Effect</span>
                  </div>
                  <div
                    onClick={() => toast.info(t('Bingkai profil tersedia di Shop!'))}
                    className="p-3 rounded-xl border border-border/70 bg-[#1e1f22] hover:border-border flex flex-col items-center justify-center gap-1 cursor-pointer group"
                  >
                    <div className="size-6 rounded-md border border-dashed border-muted-foreground group-hover:border-[#5865F2] flex items-center justify-center text-xs text-muted-foreground group-hover:text-[#5865F2]">
                      +
                    </div>
                    <span className="text-[10px] text-muted-foreground">+ Frame</span>
                  </div>
                </div>
              </div>

              {/* 5. Nitro Promo Box */}
              <div className="p-3.5 rounded-xl border border-[#5865F2]/40 bg-gradient-to-r from-[#5865F2]/15 to-[#9b59b6]/15 space-y-2">
                <div className="text-xs font-semibold text-foreground leading-snug">
                  {t('Level up your look, only with Nitro')}
                </div>
                <Button
                  size="sm"
                  onClick={() => onNavigateSection?.('nitro')}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs h-8 font-semibold cursor-pointer"
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
                <div className="p-3 rounded-xl border border-border/70 bg-[#1e1f22] flex items-center justify-center">
                  <span className="text-base font-extrabold text-[#57f287] tracking-wide font-mono">
                    {currentUserName}
                  </span>
                </div>
              </div>

              {/* 7. Profile Theme */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Profile Theme')}
                </span>
                <div className="h-14 rounded-xl border border-border/70 bg-gradient-to-r from-[#d946ef] to-[#06b6d4] p-2 flex items-center justify-between">
                  <div className="size-5 rounded-full border-2 border-white bg-[#d946ef]" />
                  <div className="size-5 rounded-full border-2 border-white bg-[#06b6d4]" />
                </div>
              </div>

              {/* 8. Profile Banner */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Profile Banner')}
                </span>
                <div className="h-16 rounded-xl border border-border/70 bg-[#2b2d31] overflow-hidden relative flex items-center justify-center text-xs text-muted-foreground">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
                  <span className="relative z-10 font-medium">👾 Pixel Artwork Banner</span>
                </div>
              </div>

              {/* 9. Animated Avatar */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Animated Avatar')}
                </span>
                <div className="p-3 rounded-xl border border-border/70 bg-[#1e1f22] flex items-center gap-3">
                  <div className="size-10 rounded-full bg-black/40 border border-border/60 flex items-center justify-center text-lg animate-pulse">
                    🐱
                  </div>
                  <span className="text-xs text-muted-foreground">{t('GIF avatar active')}</span>
                </div>
              </div>

              {/* 10. Bottom Nitro CTA Button */}
              <Button
                onClick={() => onNavigateSection?.('nitro')}
                className="w-full bg-gradient-to-r from-[#5865F2] via-[#eb459e] to-[#fee75c] text-white hover:opacity-90 font-bold text-xs h-9 rounded-xl shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {t('Get Nitro')}
              </Button>
            </div>

            {/* COLUMN 2: MIDDLE LIVE PROFILE CARD PREVIEW */}
            <div className="w-full xl:w-80 shrink-0">
              <div className="rounded-2xl bg-[#111214] border border-border/80 shadow-2xl overflow-hidden">
                {/* Banner Area */}
                <div
                  className="h-28 relative transition-colors"
                  style={{ backgroundColor: profileBannerColor }}
                >
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white/80 font-semibold">
                    <Palette className="w-3 h-3" />
                    <span>Theme</span>
                  </div>
                </div>

                {/* Avatar & Status Cloud */}
                <div className="px-4 pb-4">
                  <div className="flex items-end justify-between -mt-10 relative">
                    <div className="relative">
                      <div className="size-20 rounded-full border-4 border-[#111214] overflow-hidden bg-[#2b2d31] flex items-center justify-center text-3xl shadow-md">
                        🐱
                      </div>
                      <div className="absolute bottom-0 right-0 size-5 rounded-full border-2 border-[#111214] bg-emerald-500 shadow-sm" />
                    </div>

                    {/* Status Cloud Bubble */}
                    <div
                      onClick={() => setIsEditingStatusThought(true)}
                      className="mb-1 px-3 py-1 rounded-full bg-[#1e1f22] border border-border/80 text-[11px] text-foreground flex items-center gap-1.5 hover:border-border cursor-pointer shadow-sm group"
                      title={t('Click to edit custom status')}
                    >
                      <span>💭</span>
                      {isEditingStatusThought ? (
                        <input
                          type="text"
                          value={profileStatusThought}
                          onChange={(e) => setProfileStatusThought(e.target.value)}
                          onBlur={() => setIsEditingStatusThought(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingStatusThought(false)}
                          autoFocus
                          className="w-24 bg-transparent border-b border-[#5865F2] text-[11px] text-foreground focus:outline-none"
                        />
                      ) : (
                        <span className="truncate max-w-[120px]">{profileStatusThought}</span>
                      )}
                    </div>
                  </div>

                  {/* Profile Header Details */}
                  <div className="mt-3 space-y-1">
                    <div className="text-lg font-bold text-white leading-tight">
                      {currentUserName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                      <span>{currentUserName.toLowerCase()}</span>
                      <span>•</span>
                      {isEditingPronouns ? (
                        <input
                          type="text"
                          value={profilePronouns}
                          onChange={(e) => setProfilePronouns(e.target.value)}
                          onBlur={() => setIsEditingPronouns(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingPronouns(false)}
                          autoFocus
                          placeholder="e.g. they/them"
                          className="w-20 bg-transparent border-b border-[#5865F2] text-xs text-foreground focus:outline-none"
                        />
                      ) : (
                        <span
                          onClick={() => setIsEditingPronouns(true)}
                          className="hover:underline cursor-pointer"
                        >
                          {profilePronouns || t('Add pronouns')}
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-[11px] bg-[#1e1f22] px-1.5 py-0.5 rounded border border-border/60">
                        Server Tag ⌵
                      </span>
                    </div>

                    {/* Badges Row */}
                    <div className="flex items-center gap-1.5 pt-1.5">
                      <span
                        className="size-5 rounded-full bg-[#9b59b6]/30 border border-[#9b59b6]/60 flex items-center justify-center text-xs"
                        title="HypeSquad Bravery"
                      >
                        🛡️
                      </span>
                      <span
                        className="size-5 rounded-full bg-emerald-500/30 border border-emerald-500/60 flex items-center justify-center text-xs"
                        title="Active Developer"
                      >
                        🌐
                      </span>
                      <span
                        className="size-5 rounded-full bg-[#5865F2]/30 border border-[#5865F2]/60 flex items-center justify-center text-xs"
                        title="Nitro Subscriber"
                      >
                        💎
                      </span>
                      <span
                        className="size-5 rounded-full bg-rose-500/30 border border-rose-500/60 flex items-center justify-center text-xs"
                        title="Early Supporter"
                      >
                        ⚔️
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs h-8 font-semibold cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      {t('Message')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2.5 bg-[#1e1f22] hover:bg-[#2b2d31] text-foreground border border-border/60 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2.5 bg-[#1e1f22] hover:bg-[#2b2d31] text-foreground border border-border/60 cursor-pointer"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Amp up your profile Promo banner */}
                  <div className="mt-4 p-3 rounded-xl border border-[#5865F2]/30 bg-gradient-to-r from-[#5865F2]/10 to-[#9b59b6]/10 space-y-2 relative">
                    <div className="text-xs font-bold text-foreground">
                      {t('Amp up your profile')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => onNavigateSection?.('nitro')}
                        className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-[11px] h-7 px-3 font-semibold cursor-pointer"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {t('Get Nitro')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigateSection?.('nitro')}
                        className="bg-[#1e1f22] hover:bg-[#2b2d31] text-foreground text-[11px] h-7 px-3 font-semibold border border-border/60 cursor-pointer"
                      >
                        {t('Shop')}
                      </Button>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mt-4 pt-3 border-t border-border/40 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('Bio')}
                    </div>
                    {isEditingBioText ? (
                      <textarea
                        value={profileBioText}
                        onChange={(e) => setProfileBioText(e.target.value)}
                        onBlur={() => setIsEditingBioText(false)}
                        autoFocus
                        rows={2}
                        className="w-full text-xs text-foreground bg-[#1e1f22] p-2 rounded-lg border border-[#5865F2] focus:outline-none resize-none"
                      />
                    ) : (
                      <p
                        onClick={() => setIsEditingBioText(true)}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        title={t('Click to edit bio')}
                      >
                        {profileBioText}
                      </p>
                    )}
                  </div>

                  {/* Member Since */}
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('Member Since')}
                    </div>
                    <div className="text-xs text-foreground font-medium">Jun 16, 2019</div>
                  </div>

                  {/* Connections */}
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('Connections')}
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1e1f22] border border-border/60">
                      <div className="size-5 rounded-full bg-[#1ed760] text-black flex items-center justify-center text-xs font-bold">
                        🟢
                      </div>
                      <span className="text-xs font-semibold text-foreground truncate">
                        ESTEFANO
                      </span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: RIGHT PROFILE TABS (Board / Activity / Wishlist) */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Top Tabs */}
              <div className="flex items-center border-b border-border/60 gap-6 text-xs font-bold pb-2">
                <button
                  type="button"
                  onClick={() => setProfileSubTab('board')}
                  className={cn(
                    'pb-2 transition-colors relative cursor-pointer',
                    profileSubTab === 'board'
                      ? 'text-foreground border-b-2 border-[#5865F2]'
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
                      ? 'text-foreground border-b-2 border-[#5865F2]'
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
                      ? 'text-foreground border-b-2 border-[#5865F2]'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t('Wishlist')}
                </button>
              </div>

              {/* TAB 1: BOARD (Screenshots 2 & 3) */}
              {profileSubTab === 'board' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{t('Your Widgets')}</span>
                    <Button
                      size="sm"
                      onClick={() => toast.info(t('Fitur penambahan widget baru segera hadir!'))}
                      className="bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-xs px-3 h-8 font-semibold cursor-pointer"
                    >
                      + {t('Add Widget')}
                    </Button>
                  </div>

                  {/* Suggested for you */}
                  {!profileWidgetsDismissed && (
                    <div className="p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {t('Suggested for you')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setProfileWidgetsDismissed(true)}
                          className="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => toast.success(t('Widget Favorite Game ditambahkan ke Board!'))}
                          className="h-24 rounded-xl border border-border/60 bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-3 flex flex-col justify-between hover:border-border cursor-pointer group"
                        >
                          <div className="size-6 rounded-full bg-white/10 group-hover:bg-[#5865F2] flex items-center justify-center text-xs text-white">
                            +
                          </div>
                          <span className="text-xs font-bold text-white/90">
                            {t('Favorite Game')}
                          </span>
                        </div>
                        <div
                          onClick={() => toast.success(t('Widget Games I Like ditambahkan ke Board!'))}
                          className="h-24 rounded-xl border border-border/60 bg-gradient-to-br from-[#3b1e2b] to-[#1f0f17] p-3 flex flex-col justify-between hover:border-border cursor-pointer group"
                        >
                          <div className="size-6 rounded-full bg-white/10 group-hover:bg-[#5865F2] flex items-center justify-center text-xs text-white">
                            +
                          </div>
                          <span className="text-xs font-bold text-white/90">
                            {t('Games I Like')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connected Game Card: Neverness to Everness (Screenshot 2 & 3) */}
                  <div className="rounded-2xl border border-border/80 bg-[#1e1f22] p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-sm">
                          🌸
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            Neverness to Everness
                          </div>
                          <div className="text-base font-extrabold text-white">DartX</div>
                          <div className="text-[10px] text-muted-foreground">SFA</div>
                        </div>
                      </div>
                      <div className="text-3xl">🧝‍♀️</div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
                      <div>
                        <div className="text-sm font-extrabold text-foreground">58</div>
                        <div className="text-[10px] text-muted-foreground">Hunter Lv.</div>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-foreground">2026-04-29</div>
                        <div className="text-[10px] text-muted-foreground">Appraiser Since</div>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-foreground">23</div>
                        <div className="text-[10px] text-muted-foreground">Characters</div>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-foreground">10</div>
                        <div className="text-[10px] text-muted-foreground">Vehicles</div>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-foreground">275</div>
                        <div className="text-[10px] text-muted-foreground">Achievements</div>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-foreground">45</div>
                        <div className="text-[10px] text-muted-foreground">City Tycoon Lv.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACTIVITY (Screenshot 4) */}
              {profileSubTab === 'activity' && (
                <div className="text-center py-10 space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">
                      {t("You don't have any activity here")}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {t(
                        "Connect your accounts to share your in-game status and activity. You're in control of what you share.",
                      )}
                    </p>
                  </div>

                  {/* Platforms Icon Grid */}
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs mx-auto py-2">
                    {availablePlatforms.slice(0, 12).map((p) => (
                      <div
                        key={p.id}
                        className="size-8 rounded-lg bg-[#2b2d31] flex items-center justify-center text-sm shadow-sm"
                        title={p.name}
                      >
                        {p.icon}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      size="sm"
                      onClick={() => onNavigateSection?.('connected_apps')}
                      className="bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-xs h-8 px-4 font-semibold cursor-pointer"
                    >
                      {t('Connect Accounts')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onNavigateSection?.('registered_games')}
                      className="bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-xs h-8 px-4 font-semibold cursor-pointer"
                    >
                      {t('Add Game')}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 3: WISHLIST (Screenshot 5) */}
              {profileSubTab === 'wishlist' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="text-center py-6 space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground">{t('No hearts yet 💔')}</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        {t('Browse the Shop and heart the items you love to add them here.')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onNavigateSection?.('nitro')}
                      className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs h-8 px-4 font-semibold cursor-pointer"
                    >
                      {t('Explore the Shop')}
                    </Button>
                  </div>

                  {/* Suggested items for you */}
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <span className="text-xs font-bold text-foreground">
                      {t('Suggested items for you')}
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { title: 'Monster Avatar Decor', tag: 'NITRO', icon: '👾' },
                        { title: 'Cyberpunk Frame', tag: 'FRAME', icon: '⚡' },
                        { title: 'Sakura Petals', tag: 'EFFECT', icon: '🌸' },
                        { title: 'Glitch Skull', tag: 'DECOR', icon: '💀' },
                        { title: 'Mystic Portal', tag: 'BANNER', icon: '🌀' },
                        { title: 'Dark Fantasy', tag: 'EFFECT', icon: '🔮' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toast.success(t(`${item.title} ditambahkan ke Wishlist!`))}
                          className="p-3 rounded-xl border border-border/70 bg-[#1e1f22] hover:border-[#5865F2] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 group"
                        >
                          <div className="size-10 rounded-full bg-black/40 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#5865F2]/20 text-[#5865F2]">
                              {item.tag}
                            </span>
                            <div className="text-[10px] font-semibold text-foreground mt-1 truncate max-w-[80px]">
                              {item.title}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

  );
}
