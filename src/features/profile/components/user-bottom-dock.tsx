import React from 'react';
import { Mic, MicOff, Headphones, Settings, Radio, Maximize2, PhoneOff, LogOut } from 'lucide-react';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

interface UserBottomDockProps {
  currentUser: any;
  currentUserName: string;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isDeafened: boolean;
  setIsDeafened: (deafened: boolean) => void;
  onOpenEditProfile: () => void;
  onLogout?: () => void;
  activeCallChannelId?: string | null;
  activeCallChannelName?: string;
  activeHubName?: string;
  onReturnToCall?: () => void;
  onDisconnectCall?: () => void;
  className?: string;
}

export function UserBottomDock({
  currentUser,
  currentUserName,
  isMuted,
  setIsMuted,
  isDeafened,
  setIsDeafened,
  onOpenEditProfile,
  onLogout,
  activeCallChannelId,
  activeCallChannelName,
  activeHubName,
  onReturnToCall,
  onDisconnectCall,
  className,
}: UserBottomDockProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'w-full flex flex-col shrink-0 select-none bg-sidebar border-t border-sidebar-border z-10',
        className,
      )}
    >
      {/* Active Voice Call Connected Banner */}
      {activeCallChannelId && (
        <div className="px-2 pt-2 pb-0">
          <div className="px-2.5 py-1.5 rounded-[8px] bg-sidebar-accent/50 border border-sidebar-border flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-emerald-400 leading-tight">
                  {t('Voice Terhubung')}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {activeCallChannelName || t('Panggilan')} / {activeHubName || t('Workspace')}
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
      )}

      {/* User Dock Bar - Strictly contained inside sidebar width, background matches sidebar theme exactly */}
      <div className="w-full h-[52px] px-2 flex items-center justify-between">
        <div
          onClick={onOpenEditProfile}
          className="flex items-center gap-2 min-w-0 flex-1 mr-1 px-1.5 py-1 rounded-md hover:bg-sidebar-accent/60 cursor-pointer transition-colors group/user"
          title={t('Ubah profil & pengaturan akun')}
        >
          <CommunityAvatar
            name={currentUserName}
            email={currentUser?.email}
            imageUrl={currentUser?.imageUrl}
            size={32}
            status="online"
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

        {/* Action icons: Mic, Headphones, Settings, Logout */}
        <div className="flex items-center gap-0.5 text-muted-foreground shrink-0">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded-md cursor-pointer transition-colors"
            title={isMuted ? t('Bunyikan') : t('Bisu')}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setIsDeafened(!isDeafened)}
            className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded-md cursor-pointer transition-colors"
            title={isDeafened ? t('Batal Tulikan') : t('Tulikan')}
          >
            <Headphones className={cn('w-3.5 h-3.5', isDeafened && 'text-red-400')} />
          </button>
          <button
            type="button"
            onClick={onOpenEditProfile}
            className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded-md cursor-pointer transition-colors"
            title={t('Pengaturan Akun')}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors"
              title={t('Keluar (Log Out)')}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
