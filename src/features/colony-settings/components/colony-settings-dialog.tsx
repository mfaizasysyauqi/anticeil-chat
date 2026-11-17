import React, { useState, useEffect } from 'react';
import { Trash2, Ban } from 'lucide-react';
import { TwoPaneSettingsDialog, SettingsNavGroup } from '@/components/ui/two-pane-settings-dialog';
import { buildColonyNavGroups } from './colony-settings-nav';
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
import { colonyApi } from '@/chat/chat-api';
import { ColonyIcon } from '@/features/colonies/components/colony-icon';
import type {
  Colony,
  ColonyMember,
  CommunityCustomRole,
  CommunityInvite,
  ColonyBan,
  CommunityAuditEntry,
  ColonyStats,
  CommunityCustomEmoji,
  ColonyChannel,
} from '@/chat/chat-types';
import {
  ProfileTab,
  ColonyTagsTab,
  AnalyticsTab,
  BoostTab,
  EmojisTab,
  StickersTab,
  SoundboardTab,
  MembersTab,
  RolesTab,
  InvitesTab,
  AccessTab,
  IntegrationsTab,
  AppDirectoryTab,
  SafetySetupTab,
  AuditLogTab,
  BansTab,
  CommunityOverviewTab,
  OnboardingTab,
  ServerInsightsTab,
  ServerTemplateTab,
  DeleteColonyTab,
} from './tabs';

export type ColonySettingsSection =
  | 'profile'
  | 'colony-tag'
  | 'engagement'
  | 'boost'
  | 'emoji'
  | 'stickers'
  | 'soundboard'
  | 'members'
  | 'roles'
  | 'invites'
  | 'access'
  | 'integrations'
  | 'app-directory'
  | 'safety-setup'
  | 'audit-log'
  | 'bans'
  | 'community-overview'
  | 'onboarding'
  | 'server-insights'
  | 'server-template'
  | 'delete-server'
  | 'delete';

interface ColonySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeColony: Colony | null;
  currentUser: ColonyMember | null;
  members: ColonyMember[];
  channels: ColonyChannel[];
  initialSection?: ColonySettingsSection;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onDeleteHub: (hub: Colony) => void;
  onOpenWebhooks?: () => void;
  onUpdateMembers?: (updater: (prev: ColonyMember[]) => ColonyMember[]) => void;
  onNavigateToApps?: () => void;
}

export function ColonySettingsDialog({
  isOpen,
  onClose,
  activeColony,
  currentUser,
  members,
  channels,
  initialSection = 'profile',
  onUpdateColony,
  onDeleteHub,
  onOpenWebhooks,
  onUpdateMembers,
  onNavigateToApps,
}: ColonySettingsDialogProps) {
  const { t } = useTranslation();

  const [serverSettingsSection, setColonySettingsSection] = useState<ColonySettingsSection>(
    initialSection === 'app-directory' ? 'profile' : initialSection
  );

  const handleNavigateSection = (sec: string) => {
    if (sec === 'app-directory') {
      onClose();
      onNavigateToApps?.();
      return;
    }
    setColonySettingsSection(sec as ColonySettingsSection);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialSection === 'app-directory') {
        onClose();
        onNavigateToApps?.();
        return;
      }
      if (initialSection) {
        setColonySettingsSection(initialSection);
      }
    }
  }, [isOpen, initialSection]);

  const [serverSettingsEditName, setServerSettingsEditName] = useState('');
  const [serverSettingsEditDesc, setServerSettingsEditDesc] = useState('');
  const [serverSettingsEditColor, setServerSettingsEditColor] = useState('bg-indigo-600');
  const [serverSettingsEditIconUrl, setServerSettingsEditIconUrl] = useState('');

  const [serverTags, setServerTags] = useState<string[]>([]);
  const [serverEmojis, setServerEmojis] = useState<CommunityCustomEmoji[]>([]);
  const [serverStats, setServerStats] = useState<ColonyStats | null>(null);
  const [serverInvites, setServerInvites] = useState<CommunityInvite[]>([]);
  const [serverBans, setServerBans] = useState<ColonyBan[]>([]);
  const [serverRoles, setServerRoles] = useState<CommunityCustomRole[]>([]);
  const [serverAuditLogs, setServerAuditLogs] = useState<CommunityAuditEntry[]>([]);

  // Ban dialog sub-flow
  const [isBanningUser, setIsBanningUser] = useState(false);
  const [banTargetMember, setBanTargetMember] = useState<ColonyMember | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');

  // Load sub-data on open
  useEffect(() => {
    if (!isOpen || !activeColony) return;
    setServerSettingsEditName(activeColony.name || '');
    setServerSettingsEditDesc(activeColony.description || '');
    setServerSettingsEditColor(activeColony.color || 'bg-indigo-600');
    setServerSettingsEditIconUrl(activeColony.iconUrl || '');
    setServerTags(activeColony.tags || ['komunitas', 'anticeil']);
    setServerEmojis(
      activeColony.emojis || [
        { id: '1', name: 'rocket', char: '🚀' },
        { id: '2', name: 'fire', char: '🔥' },
        { id: '3', name: 'robot', char: '🤖' },
      ],
    );

    const loadData = async () => {
      try {
        const [rolesRes, invitesRes, bansRes, auditRes, statsRes] = await Promise.all([
          colonyApi.getRoles(activeColony.id),
          colonyApi.getInvites(activeColony.id),
          colonyApi.getBans(activeColony.id),
          colonyApi.getAuditLog(activeColony.id),
          colonyApi.getHubStats(activeColony.id),
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
  }, [isOpen, activeColony?.id]);

  if (!isOpen || !activeColony) return null;

  const colonyGroups = buildColonyNavGroups({
    activeColonyName: activeColony?.name,
    t,
  });

  return (
    <>
      <TwoPaneSettingsDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={t('Pengaturan Colony')}
        groups={colonyGroups}
        activeSection={serverSettingsSection}
        onSectionChange={(id) => {
          if (id === 'app-directory') {
            onClose();
            onNavigateToApps?.();
            return;
          }
          setColonySettingsSection(id as ColonySettingsSection);
        }}
        initialMobileView={initialSection && initialSection !== 'profile' ? 'detail' : 'menu'}
        sidebarHeader={
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
            <div className="size-8 rounded-[10px] bg-sidebar-accent border border-sidebar-border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs font-semibold text-xs text-foreground">
              {activeColony && <ColonyIcon hub={activeColony} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-foreground truncate">
                {activeColony?.name || t('Colony')}
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
              onDeleteHub(activeColony);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span>{t('Hapus Colony')}</span>
          </button>
        }
      >
        <div className={cn("w-full", (serverSettingsSection === 'profile' || serverSettingsSection === 'colony-tag' || serverSettingsSection === 'boost' || serverSettingsSection === 'stickers' || serverSettingsSection === 'members' || serverSettingsSection === 'roles' || serverSettingsSection === 'access' || serverSettingsSection === 'integrations' || serverSettingsSection === 'app-directory' || serverSettingsSection === 'safety-setup' || serverSettingsSection === 'audit-log' || serverSettingsSection === 'bans' || serverSettingsSection === 'community-overview' || serverSettingsSection === 'onboarding' || serverSettingsSection === 'server-insights' || serverSettingsSection === 'server-template') ? "max-w-5xl" : "max-w-2xl")}>
              {/* 1. PROFIL SERVER */}
              {serverSettingsSection === 'profile' && (
                <ProfileTab
                  activeColony={activeColony}
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
                  onUpdateColony={onUpdateColony}
                  onClose={onClose}
                  t={t}
                />
              )}

              {/* 2. TAG SERVER */}
              {serverSettingsSection === 'colony-tag' && (
                <ColonyTagsTab
                  activeColony={activeColony}
                  serverTags={serverTags}
                  setServerTags={setServerTags}
                  onUpdateColony={onUpdateColony}
                  onNavigateSection={handleNavigateSection}
                  onClose={onClose}
                  t={t}
                />
              )}

              {/* 3. ENGAGEMENT */}
              {serverSettingsSection === 'engagement' && (
                <AnalyticsTab
                  activeColony={activeColony}
                  serverStats={serverStats}
                  setServerStats={setServerStats}
                  channels={channels}
                  members={members}
                  onUpdateColony={onUpdateColony}
                  onClose={onClose}
                  t={t}
                />
              )}

              {/* 4. BOOST PERKS */}
              {serverSettingsSection === 'boost' && (
                <BoostTab
                  activeColony={activeColony}
                  onUpdateColony={onUpdateColony}
                  onClose={onClose}
                  t={t}
                />
              )}

              {/* 5. EMOJI */}
              {serverSettingsSection === 'emoji' && (
                <EmojisTab
                  activeColony={activeColony}
                  serverEmojis={serverEmojis}
                  setServerEmojis={setServerEmojis}
                  onUpdateColony={onUpdateColony}
                  t={t}
                />
              )}

              {/* 6. STICKERS */}
              {serverSettingsSection === 'stickers' && (
                <StickersTab
                  activeColony={activeColony}
                  onUpdateColony={onUpdateColony}
                  onNavigateSection={handleNavigateSection}
                  t={t}
                />
              )}

              {/* 7. SOUNDBOARD */}
              {serverSettingsSection === 'soundboard' && (
                <SoundboardTab
                  activeColony={activeColony}
                  onUpdateColony={onUpdateColony}
                  t={t}
                />
              )}

              {/* 6. ANGGOTA (MEMBERS) */}
              {serverSettingsSection === 'members' && (
                <MembersTab
                  activeColony={activeColony}
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
                  activeColony={activeColony}
                  serverRoles={serverRoles}
                  setServerRoles={setServerRoles}
                  members={members}
                  onUpdateMembers={onUpdateMembers}
                  t={t}
                />
              )}

              {/* 8. UNDANGAN (INVITES) */}
              {serverSettingsSection === 'invites' && (
                <InvitesTab
                  activeColony={activeColony}
                  serverInvites={serverInvites}
                  setServerInvites={setServerInvites}
                  t={t}
                />
              )}

              {/* 8b. AKSES (ACCESS) */}
              {serverSettingsSection === 'access' && (
                <AccessTab
                  activeColony={activeColony}
                  onUpdateColony={onUpdateColony}
                  onClose={onClose}
                  t={t}
                />
              )}

              {/* 9. INTEGRASI */}
              {serverSettingsSection === 'integrations' && (
                <IntegrationsTab
                  activeColony={activeColony}
                  channels={channels}
                  onUpdateColony={onUpdateColony}
                  onNavigateSection={handleNavigateSection}
                  onClose={onClose}
                  onOpenWebhooks={onOpenWebhooks}
                  t={t}
                />
              )}

              {/* 9b. APP DIRECTORY */}
              {serverSettingsSection === 'app-directory' && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t('Mengalihkan ke Aplikasi & Aktivitas...')}
                </div>
              )}

              {/* 9c. SAFETY SETUP */}
              {serverSettingsSection === 'safety-setup' && (
                <SafetySetupTab
                  activeColony={activeColony}
                  onUpdateColony={onUpdateColony}
                  onClose={onClose}
                  t={t}
                />
              )}

              {/* 10. LOG AUDIT */}
              {serverSettingsSection === 'audit-log' && (
                <AuditLogTab
                  activeColony={activeColony}
                  members={members}
                  serverAuditLogs={serverAuditLogs}
                  setServerAuditLogs={setServerAuditLogs}
                  t={t}
                />
              )}

              {/* 11. BAN */}
              {serverSettingsSection === 'bans' && (
                <BansTab
                  activeColony={activeColony}
                  members={members}
                  serverBans={serverBans}
                  setServerBans={setServerBans}
                  onUpdateMembers={onUpdateMembers}
                  onNavigateSection={handleNavigateSection}
                  t={t}
                />
              )}

              {/* 12. COMMUNITY OVERVIEW */}
              {serverSettingsSection === 'community-overview' && (
                <CommunityOverviewTab
                  activeColony={activeColony}
                  channels={channels}
                  onUpdateColony={onUpdateColony}
                  onNavigateSection={handleNavigateSection}
                  onClose={onClose}
                  t={t}
                />
              )}

              {/* 13. ONBOARDING */}
              {serverSettingsSection === 'onboarding' && (
                <OnboardingTab
                  activeColony={activeColony}
                  channels={channels}
                  onUpdateColony={onUpdateColony}
                  t={t}
                />
              )}

              {/* 14. SERVER INSIGHTS */}
              {serverSettingsSection === 'server-insights' && (
                <ServerInsightsTab
                  activeColony={activeColony}
                  channels={channels}
                  t={t}
                />
              )}

              {/* 15. SERVER TEMPLATE */}
              {serverSettingsSection === 'server-template' && (
                <ServerTemplateTab
                  activeColony={activeColony}
                  channels={channels}
                  onUpdateColony={onUpdateColony}
                  t={t}
                />
              )}

              {/* 16. DELETE SERVER */}
              {(serverSettingsSection === 'delete-server' || serverSettingsSection === 'delete') && (
                <DeleteColonyTab
                  activeColony={activeColony}
                  onDeleteHub={onDeleteHub}
                  onClose={onClose}
                  onNavigateSection={handleNavigateSection}
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
                if (!activeColony || !banTargetMember) return;
                const banned = await colonyApi.banUser(activeColony.id, {
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
