import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Copy,
  Check,
  Calendar,
  ShieldCheck,
  Crown,
  Sparkles,
  Smile,
  Settings,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { TEXT_STYLES, BUTTON_STYLES } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { profileApi, type UserProfileData } from '../api/profile-api';
import type { Colony } from '@/chat/chat-types';

export type UserPresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  currentUserName: string;
  onOpenEditProfile?: () => void;
  onOpenSettings?: (section?: string) => void;
  colonies?: Colony[];
}

const PRESENCE_OPTIONS: Array<{
  id: UserPresenceStatus;
  label: string;
  desc: string;
  dotColor: string;
}> = [
  {
    id: 'online',
    label: 'Online',
    desc: 'Bisa dihubungi dan aktif',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'idle',
    label: 'Tidak Aktif (Idle)',
    desc: 'Sedang jauh dari perangkat',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'dnd',
    label: 'Jangan Ganggu (DND)',
    desc: 'Bungkam semua notifikasi desktop & suara',
    dotColor: 'bg-rose-500',
  },
  {
    id: 'offline',
    label: 'Tidak Terlihat (Invisible)',
    desc: 'Tampil offline bagi kawan, tapi tetap bisa chat',
    dotColor: 'bg-zinc-500',
  },
];

export function UserProfileDialog({
  isOpen,
  onClose,
  currentUser,
  currentUserName,
  onOpenEditProfile,
  onOpenSettings,
  colonies = [],
}: UserProfileDialogProps) {
  const { t } = useTranslation();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Presence status
  const [presence, setPresence] = useState<UserPresenceStatus>(() => {
    try {
      return (localStorage.getItem('anticeil_user_presence') as UserPresenceStatus) || 'online';
    } catch {
      return 'online';
    }
  });

  // Custom status inline editing
  const [isEditingThought, setIsEditingThought] = useState(false);
  const [statusThoughtInput, setStatusThoughtInput] = useState('');
  const [isSavingThought, setIsSavingThought] = useState(false);

  // Copy states
  const [isCopiedUsername, setIsCopiedUsername] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);

  // Fetch fullstack profile from DB
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingProfile(true);

    profileApi
      .getProfile(currentUser?.id)
      .then((data) => {
        if (isMounted && data) {
          setProfileData(data);
          setStatusThoughtInput(data.statusThought || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser?.id]);

  // Handle presence status change
  const handleSelectPresence = (newPresence: UserPresenceStatus) => {
    setPresence(newPresence);
    try {
      localStorage.setItem('anticeil_user_presence', newPresence);
      window.dispatchEvent(
        new CustomEvent('anticeil_presence_change', { detail: newPresence })
      );
    } catch {}

    // Persist to backend
    profileApi
      .updateProfile({ customStatus: newPresence })
      .catch(() => {});

    toast.success(
      `Status diubah menjadi: ${
        newPresence === 'online'
          ? 'Online'
          : newPresence === 'idle'
          ? 'Tidak Aktif'
          : newPresence === 'dnd'
          ? 'Jangan Ganggu'
          : 'Tidak Terlihat'
      }`
    );
  };

  // Handle save custom status thought
  const handleSaveThought = async () => {
    setIsSavingThought(true);
    try {
      const updated = await profileApi.updateProfile({
        statusThought: statusThoughtInput.trim(),
      });
      setProfileData(updated);
      setIsEditingThought(false);
      toast.success(t('Status kustom diperbarui'));
    } catch {
      toast.error(t('Gagal menyimpan status kustom'));
    } finally {
      setIsSavingThought(false);
    }
  };

  // Resolved user identity
  const username =
    currentUser?.username ||
    (currentUser?.email
      ? currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
      : 'pengguna');

  const bannerColor = profileData?.bannerColor || '#5c4d44';
  const bannerUrl = profileData?.bannerUrl || null;
  const avatarUrl = profileData?.avatarUrl || currentUser?.imageUrl || currentUser?.avatar || null;
  const bio = profileData?.bio || '';
  const pronouns = profileData?.pronouns || '';
  const currentThought = profileData?.statusThought || '';

  // Registered date (Fullstack)
  const memberSinceRaw = currentUser?.created || currentUser?.createdAt || profileData?.createdAt;
  const memberSinceFormatted = memberSinceRaw
    ? dayjs(memberSinceRaw).locale('id').format('D MMMM YYYY')
    : 'Anggota Aktif';

  // Badges (Real, Non-Dummy)
  const isOwner = currentUser?.role === 'owner' || currentUser?.role === 'ADMIN' || currentUser?.platformRole === 'ADMIN';
  const isSubscriber = Boolean(currentUser?.isNectarSubscriber || profileData?.widgets?.displayNameStyle === 'sparkle');
  const isEmailVerified = Boolean(currentUser?.emailVerified || currentUser?.email);

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${username}`);
    setIsCopiedUsername(true);
    toast.success(`Username @${username} berhasil disalin!`);
    setTimeout(() => setIsCopiedUsername(false), 2000);
  };

  const handleCopyId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id);
      setIsCopiedId(true);
      toast.success('ID Pengguna berhasil disalin!');
      setTimeout(() => setIsCopiedId(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-[#111214] text-foreground shadow-2xl w-full max-w-[390px] sm:max-w-[420px] max-h-[92vh] flex flex-col select-none">
        <DialogTitle className="sr-only">Profil Pengguna Anticeil</DialogTitle>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
          {/* 1. Header Banner */}
          <div
            className="h-28 sm:h-32 w-full relative flex items-start justify-end p-2.5 transition-all"
            style={{
              backgroundColor: bannerUrl ? undefined : bannerColor,
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Action Buttons on Banner */}
            <div className="flex items-center gap-1.5 z-10">
              {onOpenEditProfile && (
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        onClose();
                        onOpenEditProfile();
                      }}
                      className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/75 text-white/90 border border-white/20 backdrop-blur-xs cursor-pointer shadow-xs"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {t('Edit Profil')}
                  </TooltipContent>
                </Tooltip>
              )}

              <Button
                variant="secondary"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/75 text-white/90 border border-white/20 backdrop-blur-xs cursor-pointer shadow-xs"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* 2. Avatar & Badge Row */}
          <div className="px-4 pb-2 relative">
            <div className="-mt-11 mb-2.5 flex items-end justify-between">
              {/* Avatar with Status Ring */}
              <div className="relative rounded-full ring-4 ring-[#111214] bg-[#111214] shrink-0">
                <CommunityAvatar
                  name={currentUserName}
                  imageUrl={avatarUrl}
                  size={80}
                  showStatus
                  status={presence}
                />
              </div>

              {/* Badges Container (Top Right under Banner) */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-card/60 border border-border/50 backdrop-blur-xs">
                {isOwner && (
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div className="p-1 rounded bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-semibold">
                      Pengembang / Administrator Anticeil
                    </TooltipContent>
                  </Tooltip>
                )}

                {isSubscriber && (
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div className="p-1 rounded bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors cursor-pointer">
                        <Crown className="w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-semibold">
                      Langganan Nectar Aktif
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div className="p-1 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-semibold">
                    Early Supporter Anticeil
                  </TooltipContent>
                </Tooltip>

                {isEmailVerified && (
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div className="p-1 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors cursor-pointer">
                        <Check className="w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-semibold">
                      Email Terverifikasi
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* 3. Display Name & Username */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground leading-tight truncate">
                  {currentUserName}
                </h2>
                {pronouns && (
                  <span className="text-xs text-muted-foreground/80 font-normal">
                    ({pronouns})
                  </span>
                )}
              </div>

              <div
                onClick={handleCopyUsername}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono hover:text-foreground cursor-pointer transition-colors group/copy"
                title="Klik untuk menyalin username"
              >
                <span>@{username}</span>
                {isCopiedUsername ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                )}
              </div>
            </div>

            {/* 4. Custom Status Thought Card */}
            <div className="mt-3">
              {isEditingThought ? (
                <div className="flex items-center gap-1.5 bg-card/80 p-2 rounded-xl border border-primary/50 shadow-inner">
                  <Smile className="w-4 h-4 text-primary shrink-0" />
                  <Input
                    value={statusThoughtInput}
                    onChange={(e) => setStatusThoughtInput(e.target.value)}
                    placeholder="Apa yang sedang Anda pikirkan?"
                    maxLength={100}
                    className="h-7 text-xs bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 text-foreground"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveThought();
                      if (e.key === 'Escape') setIsEditingThought(false);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveThought}
                    disabled={isSavingThought}
                    className="h-6 px-2 text-[10px] bg-primary text-primary-foreground font-semibold shrink-0 cursor-pointer"
                  >
                    {isSavingThought ? '...' : 'Simpan'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingThought(false)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : currentThought ? (
                <div
                  onClick={() => setIsEditingThought(true)}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card/60 hover:bg-card/90 border border-border/50 text-xs text-foreground cursor-pointer transition-colors group/thought"
                  title="Klik untuk mengubah status"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Smile className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate italic">"{currentThought}"</span>
                  </div>
                  <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/thought:opacity-100 transition-opacity shrink-0" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingThought(true)}
                  className="w-full flex items-center gap-2 p-2 rounded-xl border border-dashed border-border/60 hover:border-primary/50 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors text-left"
                >
                  <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>+ Pasang status kustom...</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/60 my-3.5" />

            {/* 5. Quick Presence Status Switcher */}
            <div className="space-y-1.5">
              <span className={cn(TEXT_STYLES.SECTION_MUTED, 'block mb-2')}>
                Status Kehadiran
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESENCE_OPTIONS.map((opt) => {
                  const isSelected = presence === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectPresence(opt.id)}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer text-left',
                        isSelected
                          ? 'bg-card border-primary/60 text-foreground shadow-xs ring-1 ring-primary/40'
                          : 'bg-card/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-card/70'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full shrink-0', opt.dotColor)} />
                      <span className="truncate">{opt.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/60 my-3.5" />

            {/* 6. About Me / Bio */}
            <div className="space-y-1.5">
              <span className={cn(TEXT_STYLES.SECTION_MUTED, 'block')}>
                Tentang Saya
              </span>
              {bio ? (
                <p className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap bg-card/40 p-2.5 rounded-lg border border-border/40">
                  {bio}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">
                  Belum ada bio yang ditulis.
                </p>
              )}
            </div>

            {/* 7. Member Since */}
            <div className="mt-3.5 space-y-1.5">
              <span className={cn(TEXT_STYLES.SECTION_MUTED, 'block')}>
                Anggota Sejak
              </span>
              <div className="flex items-center gap-2 text-xs text-foreground/90">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{memberSinceFormatted}</span>
              </div>
            </div>

            {/* 8. Mutual Colonies */}
            {colonies.length > 0 && (
              <div className="mt-3.5 space-y-2">
                <span className={cn(TEXT_STYLES.SECTION_MUTED, 'block')}>
                  Colony Anda ({colonies.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {colonies.slice(0, 6).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card/60 border border-border/40 text-[11px] text-foreground font-medium truncate max-w-[170px]"
                      title={c.name}
                    >
                      <div className="size-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}
                  {colonies.length > 6 && (
                    <span className="text-[11px] text-muted-foreground self-center px-1">
                      +{colonies.length - 6} lainnya
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 9. Bottom Footer Actions */}
        <div className="p-3 bg-card/90 border-t border-border/60 flex items-center gap-2 shrink-0">
          {onOpenEditProfile && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onOpenEditProfile();
              }}
              className="flex-1 h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profil</span>
            </Button>
          )}

          {onOpenSettings && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onOpenSettings('account');
              }}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              title="Buka Pengaturan Akun"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}

          {currentUser?.id && (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyId}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {isCopiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Salin ID Pengguna
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
