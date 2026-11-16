import React from 'react';
import {
  Palette,
  Sparkles,
  Pencil,
  Smile,
  Heart,
  MessageSquare,
  UserCheck,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface ProfilePreviewCardProps {
  currentUserName: string;
  profileBannerColor: string;
  profileStatusThought: string;
  setProfileStatusThought: (s: string) => void;
  isEditingStatusThought: boolean;
  setIsEditingStatusThought: (b: boolean) => void;
  profilePronouns: string;
  setProfilePronouns: (s: string) => void;
  isEditingPronouns: boolean;
  setIsEditingPronouns: (b: boolean) => void;
  profileBioText: string;
  setProfileBioText: (s: string) => void;
  isEditingBioText: boolean;
  setIsEditingBioText: (b: boolean) => void;
  onNavigateSection?: (section: string) => void;
}

export function ProfilePreviewCard({
  currentUserName,
  profileBannerColor,
  profileStatusThought,
  setProfileStatusThought,
  isEditingStatusThought,
  setIsEditingStatusThought,
  profilePronouns,
  setProfilePronouns,
  isEditingPronouns,
  setIsEditingPronouns,
  profileBioText,
  setProfileBioText,
  isEditingBioText,
  setIsEditingBioText,
  onNavigateSection,
}: ProfilePreviewCardProps) {
  const { t } = useTranslation();

  return (
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
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-[#5865F2]/20 to-[#9b59b6]/20 border border-[#5865F2]/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Amp up your profile</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Unlock special profile badges, custom themes, larger banners, and animated avatars with Nitro.
            </p>
            <Button
              size="sm"
              onClick={() => {
                onNavigateSection?.('nitro');
                toast.success('Navigasi ke Nitro Showcase!');
              }}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-[11px] h-7 font-bold cursor-pointer mt-1"
            >
              Get Nitro
            </Button>
          </div>

          {/* Bio / About me preview */}
          <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>{t('About Me')}</span>
              <Pencil
                className="w-3 h-3 hover:text-foreground cursor-pointer"
                onClick={() => setIsEditingBioText(true)}
              />
            </div>
            {isEditingBioText ? (
              <textarea
                value={profileBioText}
                onChange={(e) => setProfileBioText(e.target.value)}
                onBlur={() => setIsEditingBioText(false)}
                rows={2}
                autoFocus
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
  );
}
