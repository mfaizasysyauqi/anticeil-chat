import React from 'react';
import {
  Pencil,
  Sparkles,
  Palette,
  ExternalLink,
  Shield,
  Layers,
  Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { useTranslation } from '@/core/i18n';

export interface ProfilesTabProps {
  currentUser: any;
  currentUserName: string;
  onNavigateSection?: (section: string) => void;
  onOpenEditProfile?: () => void;
}

export function ProfilesTab({
  currentUser,
  currentUserName,
  onNavigateSection,
  onOpenEditProfile,
}: ProfilesTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 pb-8 max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {t('Profil Pengguna')}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {t(
            'Kustomisasi profil Anda agar teman-teman di Anticeil dapat melihat identitas, dekorasi, dan aktivitas Anda.',
          )}
        </p>
      </div>

      {/* Featured Discord-style Profile Launcher Card */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        {/* Banner Preview */}
        <div className="h-28 bg-gradient-to-r from-teal-800/40 via-primary/30 to-purple-800/40 relative border-b border-border/60">
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white/90 font-semibold border border-white/10">
            <Palette className="w-3.5 h-3.5 text-primary" />
            <span>{t('Tema Profil')}</span>
          </div>
        </div>

        {/* Profile Info & CTA */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 -mt-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <CommunityAvatar
                name={currentUserName}
                email={currentUser?.email}
                imageUrl={currentUser?.imageUrl}
                size={76}
                showStatus
                status="online"
                className="rounded-full ring-4 ring-card bg-muted/60 shadow-md"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-bold text-foreground truncate">
                {currentUserName}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentUser?.email || `@${currentUserName.toLowerCase().replace(/\s+/g, '')}`}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                  {t('Profil Utama')}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={onOpenEditProfile}
            size="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 h-10 shadow-md cursor-pointer rounded-xl shrink-0"
          >
            <Pencil className="w-4 h-4 mr-2" />
            {t('Edit Profil (Dialog Baru)')}
          </Button>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Server Profiles */}
        <div
          onClick={onOpenEditProfile}
          className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-colors cursor-pointer group space-y-2 shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
            <Layers className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span>{t('Profil Khusus Colony')}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('Gunakan avatar, banner, dan nama panggilan unik untuk masing-masing colony yang Anda ikuti.')}
          </p>
        </div>

        {/* Card 2: Profile Effects & Widgets */}
        <div
          onClick={onOpenEditProfile}
          className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-colors cursor-pointer group space-y-2 shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>{t('Efek & Dekorasi Avatar')}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('Hiasi profil Anda dengan bingkai animasi, nameplate stylish, dan papan widget game.')}
          </p>
        </div>
      </div>
    </div>
  );
}
