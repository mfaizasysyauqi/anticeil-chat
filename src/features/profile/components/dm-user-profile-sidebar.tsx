import React, { useState, useEffect, useMemo } from 'react';
import {
  UserRound,
  Calendar,
  ShieldCheck,
  Mail,
  Copy,
  Check,
  Server,
  X,
  Phone,
  Video,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { api } from '@/lib/api';
import type { ColonyMember, Colony } from '@/chat/chat-types';
import dayjs from 'dayjs';

export interface DmUserProfileSidebarProps {
  userId: string;
  member?: ColonyMember;
  currentUser?: any;
  colonies?: Colony[];
  friends?: any[];
  onStartCall?: (type: 'voice' | 'video') => void;
  onSelectColony?: (colonyId: string) => void;
  onClose?: () => void;
  t: (key: string) => string;
}

export function DmUserProfileSidebar({
  userId,
  member,
  currentUser,
  colonies = [],
  onStartCall,
  onSelectColony,
  onClose,
  t,
}: DmUserProfileSidebarProps) {
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopiedUsername, setIsCopiedUsername] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);

  // Private note persisted per user
  const [userNote, setUserNote] = useState('');

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    setIsLoading(true);

    // Load persisted local note
    try {
      const saved = localStorage.getItem(`anticeil_user_note_${userId}`);
      setUserNote(saved || '');
    } catch {}

    // Real database query to /v1/users/:id
    api
      .get<any>(`/v1/users/${userId}`)
      .then((data) => {
        if (isMounted && data && (data.id || data.email)) {
          setDbUser(data);
        }
      })
      .catch(() => {
        // Graceful fallback to member prop
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleSaveNote = (val: string) => {
    setUserNote(val);
    try {
      localStorage.setItem(`anticeil_user_note_${userId}`, val);
    } catch {}
  };

  // Resolved user properties
  const displayName = useMemo(() => {
    if (dbUser) {
      const full = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim();
      if (full) return full;
      if (dbUser.email) return dbUser.email.split('@')[0];
    }
    return member?.name || 'Pengguna Anticeil';
  }, [dbUser, member?.name]);

  const username = useMemo(() => {
    if (dbUser?.username) return dbUser.username;
    if (member?.username) return member.username;
    if (dbUser?.email) {
      return dbUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    return 'user';
  }, [dbUser, member?.username]);

  const email = dbUser?.email || member?.email || null;
  const avatarUrl = dbUser?.imageUrl || member?.avatar || null;
  const status = member?.status || (dbUser?.status === 'ACTIVE' ? 'online' : 'online');
  const role = (dbUser?.platformRole || member?.role || 'member').toLowerCase();
  const createdAt = dbUser?.created || member?.joinedAt || null;

  // Mutual hubs
  const mutualHubs = useMemo(() => {
    return colonies.filter((h) => h.id !== 'anticeil');
  }, [colonies]);

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${username}`);
    setIsCopiedUsername(true);
    setTimeout(() => setIsCopiedUsername(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setIsCopiedId(true);
    setTimeout(() => setIsCopiedId(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border select-none w-full overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-12 border-b border-sidebar-border px-4 flex items-center justify-between font-semibold text-xs text-muted-foreground uppercase tracking-wider shrink-0 bg-sidebar z-10">
        <div className="flex items-center gap-1.5 truncate">
          <UserRound className="w-4 h-4 text-foreground/80 shrink-0" />
          <span className="truncate">{t('Profil Pengguna')}</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onClose}
            title={t('Tutup')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Scrollable Profile Body */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {/* Banner */}
        <div className="h-28 w-full bg-gradient-to-r from-teal-900/40 via-sidebar-primary/20 to-emerald-900/30 relative border-b border-sidebar-border shrink-0 flex items-start justify-end p-2.5">
          {role === 'owner' || role === 'admin' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sidebar-primary/20 border border-sidebar-primary/40 text-sidebar-primary flex items-center gap-1 backdrop-blur-xs">
              <ShieldCheck className="w-3 h-3" />
              {role === 'owner' ? t('Pemilik') : t('Admin')}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 border border-white/15 text-white/90 flex items-center gap-1 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-sidebar-primary" />
              {t('Anggota')}
            </span>
          )}
        </div>

        {/* Avatar & Display Name Overlap */}
        <div className="px-4 pb-3 relative">
          {/* Avatar floating over banner */}
          <div className="-mt-10 mb-2.5 flex items-end justify-between">
            <div className="relative rounded-full ring-4 ring-sidebar bg-sidebar">
              <CommunityAvatar
                name={displayName}
                imageUrl={avatarUrl}
                size={76}
                showStatus
                status={status === 'offline' ? 'offline' : 'online'}
              />
            </div>

            {/* Quick Call Action Buttons */}
            {onStartCall && (
              <div className="flex items-center gap-1.5 pb-1">
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStartCall('voice')}
                      className="h-8 w-8 rounded-full bg-sidebar-accent hover:bg-accent text-foreground/80 hover:text-foreground cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {t('Panggilan Suara')}
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStartCall('video')}
                      className="h-8 w-8 rounded-full bg-sidebar-accent hover:bg-accent text-foreground/80 hover:text-foreground cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {t('Panggilan Video')}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* User Names Card */}
          <div className="bg-card/40 border border-border/50 rounded-xl p-3 shadow-2xs">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {displayName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">@{username}</span>
              <button
                type="button"
                onClick={handleCopyUsername}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
                title={t('Salin Username')}
              >
                {isCopiedUsername ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Custom Status / Activity */}
            {(member?.customStatus || member?.activity) && (
              <div className="mt-2.5 pt-2.5 border-t border-border/40 text-xs text-foreground/80 flex items-center gap-1.5">
                <span>💬</span>
                <span className="truncate italic">
                  {member.customStatus || member.activity}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 space-y-3.5">
          {/* Card: Tentang Saya (About Me) */}
          <div className="bg-card/40 border border-border/50 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {t('Tentang Saya')}
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {member?.bio || t('Anggota komunitas Anticeil')}
            </p>

            {email && (
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-sidebar-primary shrink-0" />
              <span className="capitalize">
                {role === 'owner'
                  ? t('Pemilik Platform')
                  : role === 'admin'
                  ? t('Administrator')
                  : t('Anggota Komunitas')}
              </span>
            </div>
          </div>

          {/* Card: Anggota Sejak (Member Since) */}
          <div className="bg-card/40 border border-border/50 rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {t('Anggota Sejak')}
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/90">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>
                {createdAt
                  ? dayjs(createdAt).format('D MMMM YYYY')
                  : dayjs().format('D MMMM YYYY')}
              </span>
            </div>
          </div>

          {/* Card: Server Bersama (Mutual Servers) */}
          <div className="bg-card/40 border border-border/50 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>{t('Colony Bersama')}</span>
              <span>{mutualHubs.length}</span>
            </div>

            {mutualHubs.length === 0 ? (
              <div className="py-2 text-center text-xs text-muted-foreground/60">
                {t('Belum ada colony bersama')}
              </div>
            ) : (
              <div className="space-y-1">
                {mutualHubs.map((hub) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => onSelectColony?.(hub.id)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-sidebar-accent transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground transition-colors">
                      {hub.initials || hub.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {hub.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {hub.membersCount || 1} {t('anggota')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card: Catatan Pribadi (Private Note) */}
          <div className="bg-card/40 border border-border/50 rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {t('Catatan Pribadi')}
            </div>
            <textarea
              value={userNote}
              onChange={(e) => handleSaveNote(e.target.value)}
              placeholder={t('Klik untuk menambahkan catatan pribadi...')}
              rows={2}
              className="w-full resize-none bg-background/50 border border-border/40 rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden focus:border-sidebar-primary transition-colors"
            />
            <p className="text-[10px] text-muted-foreground/60">
              {t('Hanya Anda yang dapat melihat catatan ini.')}
            </p>
          </div>

          {/* Card: Aksi Cepat */}
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyId}
              className="w-full text-xs text-muted-foreground hover:text-foreground justify-center gap-1.5 cursor-pointer"
            >
              {isCopiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('ID Pengguna Tersalin!')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('Salin ID Pengguna')}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
