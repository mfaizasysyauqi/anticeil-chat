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
import { TwoPaneSettingsDialog, SettingsNavGroup } from '@/components/ui/two-pane-settings-dialog';
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
  ColonyTagsTab,
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

export type ColonySettingsSection =
  | 'profile'
  | 'colony-tag'
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

interface ColonySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeHub: CommunityHub | null;
  currentUser: CommunityMember | null;
  members: CommunityMember[];
  channels: CommunityChannel[];
  initialSection?: ColonySettingsSection;
  onUpdateHub: (hubId: string, updates: Partial<CommunityHub>) => Promise<void>;
  onDeleteHub: (hub: CommunityHub) => void;
  onOpenWebhooks?: () => void;
  onUpdateMembers?: (updater: (prev: CommunityMember[]) => CommunityMember[]) => void;
}

export function ColonySettingsDialog({
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
}: ColonySettingsDialogProps) {
  const { t } = useTranslation();

  const [serverSettingsSection, setColonySettingsSection] = useState<ColonySettingsSection>(initialSection);

  useEffect(() => {
    if (isOpen && initialSection) {
      setColonySettingsSection(initialSection);
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

  const colonyGroups: SettingsNavGroup[] = [
    {
      key: 'COLONY_SETTINGS',
      title: activeHub?.name || t('Colony'),
      items: [
        { id: 'profile', label: t('Profil Colony'), icon: <Globe className="h-4 w-4 shrink-0" /> },
        { id: 'colony-tag', label: t('Tag Colony'), icon: <Tag className="h-4 w-4 shrink-0" /> },
        { id: 'engagement', label: t('Engagement'), icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
        { id: 'boost', label: t('Colony Boost'), icon: <Zap className="h-4 w-4 shrink-0" /> },
        { id: 'emoji', label: t('Emoji Kustom'), icon: <Smile className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      key: 'COLONY_MANAGEMENT',
      title: t('Manajemen'),
      items: [
        { id: 'members', label: t('Anggota'), icon: <Users className="h-4 w-4 shrink-0" /> },
        { id: 'roles', label: t('Peran'), icon: <KeyRound className="h-4 w-4 shrink-0" /> },
        { id: 'invites', label: t('Undangan'), icon: <UserPlus className="h-4 w-4 shrink-0" /> },
        { id: 'integrations', label: t('Integrasi'), icon: <Webhook className="h-4 w-4 shrink-0" /> },
        { id: 'audit-log', label: t('Log Audit'), icon: <ScrollText className="h-4 w-4 shrink-0" /> },
        { id: 'bans', label: t('Pemblokiran'), icon: <Ban className="h-4 w-4 shrink-0" /> },
      ],
    },
  ];

  return (
    <>
      <TwoPaneSettingsDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={t('Pengaturan Colony')}
        groups={colonyGroups}
        activeSection={serverSettingsSection}
        onSectionChange={(id) => setColonySettingsSection(id as ColonySettingsSection)}
        initialMobileView={initialSection && initialSection !== 'profile' ? 'detail' : 'menu'}
        sidebarHeader={
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
            {activeHub?.iconUrl ? (
              <img
                src={activeHub.iconUrl}
                alt={activeHub.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0',
                  activeHub?.color || 'bg-indigo-600',
                )}
              >
                {activeHub?.name ? activeHub.name.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-foreground truncate">
                {activeHub?.name || t('Colony')}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {members.length} {t('Anggota')}
              </div>
            </div>
          </div>
        }
        footerAction={
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteHub(activeHub);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span>{t('Hapus Colony')}</span>
          </button>
        }
      >
        <div className="max-w-2xl w-full">
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
              {serverSettingsSection === 'colony-tag' && (
                <ColonyTagsTab
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
      </TwoPaneSettingsDialog>

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
