import React, { useState, useEffect } from 'react';
import {
  Globe,
  Tag,
  BarChart3,
  Zap,
  Smile,
  Users,
  KeyRound,
  UserPlus,
  Webhook,
  ScrollText,
  Ban,
  Trash2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { communityApi } from '@/chat/chat-api';
import type {
  CommunityHub,
  CommunityMember,
  CommunityCustomRole,
  CommunityInvite,
  CommunityBan,
  CommunityAuditEntry,
  CommunityHubStats,
  CommunityCustomEmoji,
  CommunityChannel,
} from '@/chat/chat-types';
import {
  ProfileTab,
  ServerTagsTab,
  AnalyticsTab,
  BoostTab,
  EmojisTab,
  MembersTab,
  RolesTab,
  InvitesTab,
  IntegrationsTab,
  AuditLogTab,
  BansTab,
} from './tabs';

export type ServerSettingsSection =
  | 'profile'
  | 'server-tag'
  | 'engagement'
  | 'boost'
  | 'emoji'
  | 'members'
  | 'roles'
  | 'invites'
  | 'integrations'
  | 'audit-log'
  | 'bans'
  | 'delete';

interface ServerSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeHub: CommunityHub | null;
  currentUser: CommunityMember | null;
  members: CommunityMember[];
  channels: CommunityChannel[];
  initialSection?: ServerSettingsSection;
  onUpdateHub: (hubId: string, updates: Partial<CommunityHub>) => Promise<void>;
  onDeleteHub: (hub: CommunityHub) => void;
  onOpenWebhooks?: () => void;
  onUpdateMembers?: (updater: (prev: CommunityMember[]) => CommunityMember[]) => void;
}

export function ServerSettingsDialog({
  isOpen,
  onClose,
  activeHub,
  currentUser,
  members,
  channels,
  initialSection = 'profile',
  onUpdateHub,
  onDeleteHub,
  onOpenWebhooks,
  onUpdateMembers,
}: ServerSettingsDialogProps) {
  const { t } = useTranslation();

  const [serverSettingsSection, setServerSettingsSection] = useState<ServerSettingsSection>(initialSection);

  useEffect(() => {
    if (isOpen && initialSection) {
      setServerSettingsSection(initialSection);
    }
  }, [isOpen, initialSection]);

  const [serverSettingsEditName, setServerSettingsEditName] = useState('');
  const [serverSettingsEditDesc, setServerSettingsEditDesc] = useState('');
  const [serverSettingsEditColor, setServerSettingsEditColor] = useState('bg-indigo-600');
  const [serverSettingsEditIconUrl, setServerSettingsEditIconUrl] = useState('');

  const [serverTags, setServerTags] = useState<string[]>([]);
  const [serverEmojis, setServerEmojis] = useState<CommunityCustomEmoji[]>([]);
  const [serverStats, setServerStats] = useState<CommunityHubStats | null>(null);
  const [serverInvites, setServerInvites] = useState<CommunityInvite[]>([]);
  const [serverBans, setServerBans] = useState<CommunityBan[]>([]);
  const [serverRoles, setServerRoles] = useState<CommunityCustomRole[]>([]);
  const [serverAuditLogs, setServerAuditLogs] = useState<CommunityAuditEntry[]>([]);

  // Ban dialog sub-flow
  const [isBanningUser, setIsBanningUser] = useState(false);
  const [banTargetMember, setBanTargetMember] = useState<CommunityMember | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');

  // Load sub-data on open
  useEffect(() => {
    if (!isOpen || !activeHub) return;
    setServerSettingsEditName(activeHub.name || '');
    setServerSettingsEditDesc(activeHub.description || '');
    setServerSettingsEditColor(activeHub.color || 'bg-indigo-600');
    setServerSettingsEditIconUrl(activeHub.iconUrl || '');
    setServerTags(activeHub.tags || ['komunitas', 'anticeil']);
    setServerEmojis(
      activeHub.emojis || [
        { id: '1', name: 'rocket', char: '🚀' },
        { id: '2', name: 'fire', char: '🔥' },
        { id: '3', name: 'robot', char: '🤖' },
      ],
    );

    const loadData = async () => {
      try {
        const [rolesRes, invitesRes, bansRes, auditRes, statsRes] = await Promise.all([
          communityApi.getRoles(activeHub.id),
          communityApi.getInvites(activeHub.id),
          communityApi.getBans(activeHub.id),
          communityApi.getAuditLog(activeHub.id),
          communityApi.getHubStats(activeHub.id),
        ]);
        setServerRoles(rolesRes || []);
        setServerInvites(invitesRes || []);
        setServerBans(bansRes || []);
        setServerAuditLogs(auditRes || []);
        setServerStats(statsRes || null);
      } catch (err) {
        console.error('Failed to load server settings data', err);
      }
    };
    loadData();
  }, [isOpen, activeHub?.id]);

  if (!isOpen || !activeHub) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[900px] w-[calc(100vw-2rem)] h-[calc(100dvh-4rem)] max-h-[680px] gap-0 overflow-hidden p-0 rounded-[16px]"
        >
          <DialogTitle className="sr-only">{t('Pengaturan Server')}</DialogTitle>
          <div className="flex flex-row w-full h-full min-h-0 overflow-hidden">

          {/* Left sidebar */}
          <aside className="w-56 shrink-0 flex flex-col border-r bg-muted/30 overflow-y-auto [scrollbar-width:thin]">
            <div className="px-3 pt-5 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                {activeHub?.name || t('Server')}
              </span>
            </div>

            <nav className="p-2 space-y-0.5 text-xs">
              {[
                { id: 'profile' as const, label: t('Profil Server'), icon: Globe },
                { id: 'server-tag' as const, label: t('Tag Server'), icon: Tag },
                { id: 'engagement' as const, label: t('Engagement'), icon: BarChart3 },
                { id: 'boost' as const, label: t('Server Boost'), icon: Zap },
                { id: 'emoji' as const, label: t('Emoji Kustom'), icon: Smile },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setServerSettingsSection(id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium text-left transition-colors',
                    serverSettingsSection === id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              <div className="pt-3 pb-1 px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Manajemen')}
                </span>
              </div>

              {[
                { id: 'members' as const, label: t('Anggota'), icon: Users },
                { id: 'roles' as const, label: t('Peran'), icon: KeyRound },
                { id: 'invites' as const, label: t('Undangan'), icon: UserPlus },
                { id: 'integrations' as const, label: t('Integrasi'), icon: Webhook },
                { id: 'audit-log' as const, label: t('Log Audit'), icon: ScrollText },
                { id: 'bans' as const, label: t('Pemblokiran'), icon: Ban },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setServerSettingsSection(id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium text-left transition-colors',
                    serverSettingsSection === id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              <div className="pt-3 pb-1 px-2">
                <div className="h-px bg-border my-1" />
              </div>

              <button
                onClick={() => {
                  onClose();
                  onDeleteHub(activeHub);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium text-left text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                {t('Hapus Server')}
              </button>
            </nav>
          </aside>

          {/* Right content area */}
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] relative">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-2xl w-full">
              {/* 1. PROFIL SERVER */}
              {serverSettingsSection === 'profile' && (
                <ProfileTab
                  activeHub={activeHub}
                  members={members}
                  serverTags={serverTags}
                  serverSettingsEditName={serverSettingsEditName}
                  setServerSettingsEditName={setServerSettingsEditName}
                  serverSettingsEditDesc={serverSettingsEditDesc}
                  setServerSettingsEditDesc={setServerSettingsEditDesc}
                  serverSettingsEditColor={serverSettingsEditColor}
                  setServerSettingsEditColor={setServerSettingsEditColor}
                  serverSettingsEditIconUrl={serverSettingsEditIconUrl}
                  setServerSettingsEditIconUrl={setServerSettingsEditIconUrl}
                  onUpdateHub={onUpdateHub}
                  onClose={onClose}
                  t={t}
                />
              )}

              {/* 2. TAG SERVER */}
              {serverSettingsSection === 'server-tag' && (
                <ServerTagsTab
                  activeHub={activeHub}
                  serverTags={serverTags}
                  setServerTags={setServerTags}
                  onUpdateHub={onUpdateHub}
                  t={t}
                />
              )}

              {/* 3. ENGAGEMENT */}
              {serverSettingsSection === 'engagement' && (
                <AnalyticsTab
                  activeHub={activeHub}
                  serverStats={serverStats}
                  setServerStats={setServerStats}
                  channels={channels}
                  members={members}
                  t={t}
                />
              )}

              {/* 4. BOOST PERKS */}
              {serverSettingsSection === 'boost' && (
                <BoostTab
                  activeHub={activeHub}
                  onUpdateHub={onUpdateHub}
                  t={t}
                />
              )}

              {/* 5. EMOJI */}
              {serverSettingsSection === 'emoji' && (
                <EmojisTab
                  activeHub={activeHub}
                  serverEmojis={serverEmojis}
                  setServerEmojis={setServerEmojis}
                  onUpdateHub={onUpdateHub}
                  t={t}
                />
              )}

              {/* 6. ANGGOTA (MEMBERS) */}
              {serverSettingsSection === 'members' && (
                <MembersTab
                  activeHub={activeHub}
                  currentUser={currentUser}
                  members={members}
                  onUpdateMembers={onUpdateMembers}
                  onInitiateBan={(m) => {
                    setBanTargetMember(m);
                    setBanReasonInput('Melanggar aturan komunitas server');
                    setIsBanningUser(true);
                  }}
                  t={t}
                />
              )}

              {/* 7. PERAN (ROLES) */}
              {serverSettingsSection === 'roles' && (
                <RolesTab
                  activeHub={activeHub}
                  serverRoles={serverRoles}
                  setServerRoles={setServerRoles}
                  members={members}
                  t={t}
                />
              )}

              {/* 8. UNDANGAN (INVITES) */}
              {serverSettingsSection === 'invites' && (
                <InvitesTab
                  activeHub={activeHub}
                  serverInvites={serverInvites}
                  setServerInvites={setServerInvites}
                  t={t}
                />
              )}

              {/* 9. INTEGRASI */}
              {serverSettingsSection === 'integrations' && (
                <IntegrationsTab
                  activeHub={activeHub}
                  onClose={onClose}
                  onOpenWebhooks={onOpenWebhooks}
                  t={t}
                />
              )}

              {/* 10. LOG AUDIT */}
              {serverSettingsSection === 'audit-log' && (
                <AuditLogTab
                  activeHub={activeHub}
                  serverAuditLogs={serverAuditLogs}
                  setServerAuditLogs={setServerAuditLogs}
                  t={t}
                />
              )}

              {/* 11. BAN */}
              {serverSettingsSection === 'bans' && (
                <BansTab
                  activeHub={activeHub}
                  serverBans={serverBans}
                  setServerBans={setServerBans}
                  t={t}
                />
              )}
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: BAN MEMBER SUB-MODAL */}
      <Dialog open={isBanningUser} onOpenChange={setIsBanningUser}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Ban className="w-5 h-5" />
              {t('Blokir Anggota dari Server')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Apakah Anda yakin ingin memblokir {{name}}? Pengguna ini akan dikeluarkan dan tidak dapat bergabung kembali menggunakan link undangan.',
                { name: banTargetMember?.name },
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-3">
            <label className="text-xs font-semibold text-muted-foreground">{t('Alasan Pemblokiran')}</label>
            <Input
              value={banReasonInput}
              onChange={(e) => setBanReasonInput(e.target.value)}
              placeholder="cth: Melanggar aturan komunitas / spam..."
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsBanningUser(false);
                setBanTargetMember(null);
              }}
            >
              {t('Batal')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!activeHub || !banTargetMember) return;
                const banned = await communityApi.banUser(activeHub.id, {
                  userId: banTargetMember.id,
                  userName: banTargetMember.name,
                  userEmail: banTargetMember.email,
                  reason: banReasonInput,
                });
                setServerBans((prev) => [banned, ...prev]);
                onUpdateMembers?.((prev) => prev.filter((m) => m.id !== banTargetMember.id));
                setIsBanningUser(false);
                setBanTargetMember(null);
                toast.success(t(`${banTargetMember.name} telah diblokir dari server 🚫`));
              }}
            >
              {t('Blokir & Keluarkan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
