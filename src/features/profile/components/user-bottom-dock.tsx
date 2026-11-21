import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Settings,
  Radio,
  Maximize2,
  PhoneOff,
  LogOut,
  Play,
  ChevronUp,
  LogIn,
} from 'lucide-react';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { AudioDeviceMenu } from '@/features/voice';
import { UserProfileDialog, type UserPresenceStatus } from './user-profile-dialog';

interface UserBottomDockProps {
  currentUser: any;
  currentUserName: string;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isDeafened: boolean;
  setIsDeafened: (deafened: boolean) => void;
  onOpenSettings?: (section?: string) => void;
  onOpenEditProfile?: () => void;
  onLogout?: () => void;
  onGoogleSignIn?: () => void;
  onOpenLoginDialog?: () => void;
  activeCallChannelId?: string | null;
  activeCallChannelName?: string;
  activeColonyName?: string;
  /** True when the active call is a text-channel activity, not a voice channel call */
  isActivityChannel?: boolean;
  selectedActivityAppId?: string | null;
  isActivityOpen?: boolean;
  isCallPiP?: boolean;
  onReturnToCall?: () => void;
  onDisconnectCall?: () => void;
  className?: string;
  colonies?: any[];
}

export function UserBottomDock({
  currentUser,
  currentUserName,
  isMuted,
  setIsMuted,
  isDeafened,
  setIsDeafened,
  onOpenSettings,
  onOpenEditProfile,
  onLogout,
  onGoogleSignIn,
  onOpenLoginDialog,
  activeCallChannelId,
  activeCallChannelName,
  activeColonyName,
  isActivityChannel = false,
  selectedActivityAppId,
  isActivityOpen,
  isCallPiP,
  onReturnToCall,
  onDisconnectCall,
  className,
  colonies = [],
}: UserBottomDockProps) {
  const { t } = useTranslation();

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [presence, setPresence] = useState<UserPresenceStatus>(() => {
    try {
      return (localStorage.getItem('anticeil_user_presence') as UserPresenceStatus) || 'online';
    } catch {
      return 'online';
    }
  });

  useEffect(() => {
    const handlePresenceChange = (e: Event) => {
      const detail = (e as CustomEvent<UserPresenceStatus>).detail;
      if (detail) setPresence(detail);
    };
    window.addEventListener('anticeil_presence_change', handlePresenceChange);
    return () => {
      window.removeEventListener('anticeil_presence_change', handlePresenceChange);
    };
  }, []);

  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 w-full flex flex-col shrink-0 select-none bg-sidebar border-t border-sidebar-border pb-[env(safe-area-inset-bottom,0px)]',
        className,
      )}
    >
      {/* 1. Discord-Style Active Activity Dock Card (Image 1) */}
      {selectedActivityAppId && (isActivityOpen || isCallPiP || Boolean(activeCallChannelId)) ? (
        <div className="px-2 pt-2 pb-0">
          <div
            onClick={onReturnToCall}
            className="w-full px-2.5 py-2 rounded-lg bg-transparent hover:bg-sidebar-accent/50 border border-sidebar-border transition-all flex items-center justify-between gap-2.5 cursor-pointer group shadow-2xs"
            title="Klik untuk membuka aktivitas"
          >
            {/* Left: App Icon */}
            <div className="flex items-center gap-2.5 min-w-0">
              {selectedActivityAppId === 'watch-together' || selectedActivityAppId === 'youtube' ? (
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-5 h-4 text-[#ff0000] fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
              )}

              {/* Middle: Title & Location */}
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                  {selectedActivityAppId === 'watch-together' || selectedActivityAppId === 'youtube'
                    ? 'Watch Together'
                    : selectedActivityAppId}
                </span>
                <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  {activeCallChannelName || 'general'} / {activeColonyName || 'server'}
                </span>
              </div>
            </div>

            {/* Right: Disconnect / Leave Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDisconnectCall?.();
              }}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors shrink-0"
              title="Tinggalkan Aktivitas"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : activeCallChannelId ? (
        /* 2. Active Voice Call Connected Banner */
        <div className="px-2 pt-2 pb-0">
          <div className="px-2.5 py-1.5 rounded-[8px] bg-sidebar-accent/50 border border-sidebar-border flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-emerald-400 leading-tight">
                  {isActivityChannel ? t('Aktivitas Berjalan') : t('Voice Terhubung')}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {activeCallChannelName || t('Panggilan')} / {activeColonyName || t('Workspace')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={onReturnToCall}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title={t('Kembali ke Layar Panggilan')}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDisconnectCall}
                className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                title={t('Putus Panggilan')}
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* User Dock Bar */}
      {!currentUser ? (
        <div className="w-full h-[64px] px-2.5 flex items-center justify-between gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (onOpenLoginDialog) {
                onOpenLoginDialog();
              } else if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('anticeil_open_auth_dialog'));
              } else if (onGoogleSignIn) {
                onGoogleSignIn();
              } else {
                onOpenSettings?.('account');
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 h-9 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer shadow-xs rounded-lg"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>{t('Login')}</span>
          </Button>
          <button
            type="button"
            onClick={() => onOpenSettings?.('account')}
            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded-lg cursor-pointer transition-colors shrink-0"
            title={t('Pengaturan Pengguna')}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-full h-[64px] px-2 flex items-center justify-between">
          <div
            onClick={() => setIsProfileDialogOpen(true)}
            className="flex items-center gap-2 min-w-0 flex-1 mr-1 px-1.5 py-1 rounded-md hover:bg-sidebar-accent/60 cursor-pointer transition-colors group/user"
            title={t('Lihat profil pengguna')}
          >
            <CommunityAvatar
              name={currentUserName}
              imageUrl={currentUser?.imageUrl}
              size={34}
              status={presence}
              showStatus
              className="shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold truncate leading-tight text-foreground group-hover/user:text-primary transition-colors">
                {currentUserName}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono leading-tight mt-0.5 truncate">
                {currentUser?.username
                  ? `@${currentUser.username}`
                  : currentUser?.email
                  ? `@${currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')}`
                  : '@atur_username'}
              </span>
            </div>
          </div>

          {/* Action icons with Discord-style Chevron Menus */}
          <div className="flex items-center gap-0.5 text-muted-foreground shrink-0">
            {/* Mic Button with Input Device Chevron Menu */}
            <div className="flex items-center rounded-md hover:bg-sidebar-accent/60">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="h-7 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title={isMuted ? t('Bunyikan') : t('Bisu')}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <AudioDeviceMenu type="input" onOpenFullSettings={() => onOpenSettings?.('voice')}>
                <button
                  type="button"
                  className="h-7 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer pr-1"
                  title={t('Pengaturan Perangkat Masukan')}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
              </AudioDeviceMenu>
            </div>

            {/* Headphones Button with Output Device Chevron Menu */}
            <div className="flex items-center rounded-md hover:bg-sidebar-accent/60">
              <button
                type="button"
                onClick={() => setIsDeafened(!isDeafened)}
                className="h-7 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title={isDeafened ? t('Batal Tulikan') : t('Tulikan')}
              >
                <Headphones className={cn('w-3.5 h-3.5', isDeafened && 'text-red-400')} />
              </button>
              <AudioDeviceMenu type="output" onOpenFullSettings={() => onOpenSettings?.('voice')}>
                <button
                  type="button"
                  className="h-7 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer pr-1"
                  title={t('Pengaturan Perangkat Keluaran')}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
              </AudioDeviceMenu>
            </div>

            {/* Settings button */}
            <button
              type="button"
              onClick={() => onOpenSettings?.('account')}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded-md cursor-pointer transition-colors"
              title={t('Pengaturan Pengguna')}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Discord-style User Profile Dialog */}
      {currentUser && (
        <UserProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          currentUser={currentUser}
          currentUserName={currentUserName}
          onOpenEditProfile={onOpenEditProfile}
          onOpenSettings={onOpenSettings}
          colonies={colonies}
        />
      )}
    </div>
  );
}
