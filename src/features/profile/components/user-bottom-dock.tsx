import React from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Headphones, Settings, Radio, Maximize2, PhoneOff } from 'lucide-react';
import { CommunityAvatar } from '@/chat/messages-avatar';
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
  activeCallChannelId?: string | null;
  activeCallChannelName?: string;
  activeHubName?: string;
  onReturnToCall?: () => void;
  onDisconnectCall?: () => void;
  isOverlay?: boolean;
}

export function UserBottomDock({
  currentUser,
  currentUserName,
  isMuted,
  setIsMuted,
  isDeafened,
  setIsDeafened,
  onOpenEditProfile,
  activeCallChannelId,
  activeCallChannelName,
  activeHubName,
  onReturnToCall,
  onDisconnectCall,
  isOverlay = true,
}: UserBottomDockProps) {
  const { t } = useTranslation();

  const dockNode = (
    <>
      {/* Gradient scrim behind the card */}
      {isOverlay && (
        <div
          aria-hidden
          className="hidden lg:block fixed bottom-0 left-0 pointer-events-none z-40"
          style={{
            width: '298px',
            height: activeCallChannelId ? '106px' : '60px',
            background:
              'linear-gradient(to top, var(--sidebar-background) 0%, color-mix(in srgb, var(--sidebar-background) 80%, transparent) 60%, transparent 100%)',
          }}
        />
      )}
      <div
        className={cn(
          'select-none pointer-events-auto',
          isOverlay
            ? 'hidden lg:flex flex-col fixed bottom-2 left-2 z-50 w-[280px]'
            : 'lg:hidden flex flex-col shrink-0 z-10 w-full bg-sidebar p-2 border-t border-sidebar-border'
        )}
      >
        {activeCallChannelId && (
          <div className="mb-1.5 px-3 py-1.5 rounded-[10px] bg-card border border-border shadow-2xl backdrop-blur-md flex items-center justify-between animate-in slide-in-from-bottom-2">
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
                className="h-6 w-6 text-muted-foreground hover:text-white"
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
        )}
        <div className="w-full h-[52px] px-2 py-1.5 rounded-[12px] bg-card border border-border shadow-2xl backdrop-blur-md flex items-center justify-between">
          <div
            onClick={onOpenEditProfile}
            className="flex items-center gap-2 min-w-0 flex-1 mr-1 px-1.5 py-1 rounded-md hover:bg-muted/60 cursor-pointer transition-colors group/user"
            title={t('Ubah nama tampilan atau username')}
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

          {/* Discord Mic, Headphones & Settings */}
          <div className="flex items-center gap-0.5 text-muted-foreground shrink-0">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md cursor-pointer transition-colors"
              title={isMuted ? t('Bunyikan') : t('Bisu')}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsDeafened(!isDeafened)}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md cursor-pointer transition-colors"
              title={isDeafened ? t('Batal Tulikan') : t('Tulikan')}
            >
              <Headphones className={cn('w-3.5 h-3.5', isDeafened && 'text-red-400')} />
            </button>
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md cursor-pointer transition-colors"
              title={t('Pengaturan Akun')}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (isOverlay) {
    if (typeof document !== 'undefined') {
      return createPortal(dockNode, document.body);
    }
    return null;
  }
  return dockNode;
}
