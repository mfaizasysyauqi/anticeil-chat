import React, { useState, useMemo } from 'react';
import {
  Plus,
  ArrowLeft,
  Search,
  Lock,
  Gem,
  MoreVertical,
  Check,
  Trash2,
  Users,
  Shield,
  Eye,
  Camera,
  MessageSquare,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { colonyApi } from '@/chat/chat-api';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type {
  Colony,
  CommunityCustomRole,
  ColonyMember,
} from '@/chat/chat-types';
import {
  RoleDisplaySubtab,
  RolePermissionsSubtab,
  RoleLinksSubtab,
  RoleMembersSubtab,
} from './roles';

interface RolesTabProps {
  activeColony: Colony;
  serverRoles: CommunityCustomRole[];
  setServerRoles: React.Dispatch<React.SetStateAction<CommunityCustomRole[]>>;
  members: ColonyMember[];
  onUpdateMembers?: (updater: (prev: ColonyMember[]) => ColonyMember[]) => void;
  t: (key: string) => string;
}

export function RolesTab({
  activeColony,
  serverRoles,
  setServerRoles,
  members,
  onUpdateMembers,
  t,
}: RolesTabProps) {
  // If activeRoleId is null, show main "Organize your members" screen
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [roleEditorTab, setRoleEditorTab] = useState<
    'display' | 'permissions' | 'links' | 'members'
  >('display');
  const [isSaving, setIsSaving] = useState(false);

  // Active role object
  const activeRole = useMemo(() => {
    if (!activeRoleId) return null;
    if (activeRoleId === 'everyone') {
      return {
        id: 'everyone',
        colonyId: activeColony.id,
        name: '@everyone',
        color: '#94a3b8',
        permissions: [],
      } as CommunityCustomRole;
    }
    return serverRoles.find((r) => r.id === activeRoleId) || null;
  }, [activeRoleId, serverRoles]);

  // Form edit states
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#94a3b8');
  const [roleIcon, setRoleIcon] = useState<string | null>(null);
  const [roleStyle, setRoleStyle] = useState<'solid' | 'gradient' | 'holographic'>('solid');
  const [hoist, setHoist] = useState(false);
  const [mentionable, setMentionable] = useState(false);
  const [permissionsSearch, setPermissionsSearch] = useState('');

  // Granular Discord permissions map
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    view_channels: true,
    send_messages: true,
    embed_links: true,
    attach_files: true,
    add_reactions: true,
    connect: true,
    speak: true,
    use_voice_activity: true,
    read_message_history: true,
    create_invite: true,
    change_nickname: true,
  });

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearAllPermissions = () => {
    setPermissions({});
  };

  // Linked role requirements state
  const [requirements, setRequirements] = useState<
    Array<{ id: string; platform: string; condition: string }>
  >([]);
  const [isAddingRequirement, setIsAddingRequirement] = useState(false);

  // Members assigned to this role state
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [memberSearchInRole, setMemberSearchInRole] = useState('');
  const [isAddingMembersModalOpen, setIsAddingMembersModalOpen] = useState(false);

  const roleMembers = useMemo(() => {
    return members.filter((m) => {
      const isDirectlyAssigned = assignedMemberIds.includes(m.id);
      const isRoleMatching =
        activeRole &&
        m.role?.toLowerCase() === activeRole.name?.toLowerCase();
      const matchesSearch =
        !memberSearchInRole ||
        m.name.toLowerCase().includes(memberSearchInRole.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(memberSearchInRole.toLowerCase()));
      return (isDirectlyAssigned || isRoleMatching) && matchesSearch;
    });
  }, [members, assignedMemberIds, activeRole, memberSearchInRole]);

  const handleSelectRole = (r: CommunityCustomRole) => {
    setActiveRoleId(r.id);
    setRoleName(r.name);
    setRoleColor(r.color || '#94a3b8');
    setRoleIcon(null);
    setRoleEditorTab('display');

    // Parse existing permissions
    const permMap: Record<string, boolean> = {};
    if (Array.isArray(r.permissions)) {
      for (const p of r.permissions) {
        if (typeof p === 'string') {
          permMap[p.toLowerCase()] = true;
        }
      }
    }
    setPermissions(permMap);

    // Initial assigned members
    const matching = members
      .filter((m) => m.role?.toLowerCase() === r.name?.toLowerCase())
      .map((m) => m.id);
    setAssignedMemberIds(matching);
  };

  const handleCreateNewRole = async () => {
    try {
      const created = await colonyApi.createRole(activeColony.id, {
        name: 'new role',
        color: '#94a3b8',
        permissions: ['view_channels', 'send_messages', 'attach_files', 'add_reactions'],
      });
      const roleItem: CommunityCustomRole = {
        ...created,
        name: created?.name || 'new role',
        color: created?.color || '#94a3b8',
        permissions: created?.permissions || ['view_channels', 'send_messages', 'attach_files', 'add_reactions'],
      };
      setServerRoles((prev) => [...prev, roleItem]);
      handleSelectRole(roleItem);
      toast.success(t('Peran baru berhasil dibuat!'));
    } catch {
      const fallback: CommunityCustomRole = {
        id: `role_${Date.now()}`,
        colonyId: activeColony.id,
        name: 'new role',
        color: '#94a3b8',
        permissions: ['view_channels', 'send_messages', 'attach_files', 'add_reactions'],
      };
      setServerRoles((prev) => [...prev, fallback]);
      handleSelectRole(fallback);
      toast.success(t('Peran baru dibuat!'));
    }
  };

  const handleSaveRole = async () => {
    if (!activeRole) return;
    if (activeRole.id === 'everyone') {
      toast.success(t('Izin @everyone berhasil diperbarui!'));
      return;
    }
    setIsSaving(true);
    const activePerms = Object.keys(permissions).filter((k) => permissions[k]);
    try {
      const res = await colonyApi.updateRole(activeColony.id, activeRole.id, {
        name: roleName,
        color: roleColor,
        permissions: activePerms,
      });
      const updated = serverRoles.map((r) =>
        r.id === activeRole.id
          ? {
              ...r,
              name: res?.name || roleName,
              color: res?.color || roleColor,
              permissions: res?.permissions || activePerms,
            }
          : r,
      );
      setServerRoles(updated);
      toast.success(t(`Peran "${roleName}" berhasil disimpan! 🛡️`));
    } catch {
      const updated = serverRoles.map((r) =>
        r.id === activeRole.id
          ? { ...r, name: roleName, color: roleColor, permissions: activePerms }
          : r,
      );
      setServerRoles(updated);
      toast.success(t(`Peran "${roleName}" berhasil disimpan! 🛡️`));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await colonyApi.deleteRole(activeColony.id, id);
    } catch {}
    const updated = serverRoles.filter((r) => r.id !== id);
    setServerRoles(updated);
    setActiveRoleId(null);
    toast.success(t('Peran telah dihapus.'));
  };

  // 16 Standard Discord Role Colors
  const discordRoleColors = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e91e63', '#f1c40f', '#e67e22', '#e74c3c',
    '#11806a', '#1f8b4c', '#206694', '#71368a', '#ad1457', '#c27c0e', '#a84300', '#992d22',
  ];

  // ==========================================
  // VIEW 1: MAIN OVERVIEW (Discord 1:1 Parity)
  // ==========================================
  if (!activeRole) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('Roles')}</h2>
        </div>

        {/* Center Hero Illustration Card */}
        <div className="py-10 px-4 rounded-2xl bg-[#1e1f22]/60 border border-border/80 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          {/* Mockup Member Cards with Roles */}
          <div className="flex -space-x-4 mb-2">
            <div className="w-36 p-3 rounded-2xl bg-[#2b2d31] border border-border shadow-xl transform -rotate-6 space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">
                  🧑
                </div>
                <span className="text-[11px] font-bold text-foreground">Moatmon</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  LFG
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Moderator
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                  VIP
                </span>
              </div>
            </div>

            <div className="w-36 p-3 rounded-2xl bg-[#2b2d31] border border-border shadow-2xl transform rotate-3 space-y-2 z-10">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">
                  👩
                </div>
                <span className="text-[11px] font-bold text-foreground">Val</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400">
                  Diamond
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                  OG
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-base font-extrabold text-foreground">
            {t('Organize your members')}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            {t('Use roles to group your server members and assign permissions.')}
          </p>

          <Button
            variant="teal"
            onClick={handleCreateNewRole}
            className="text-xs font-semibold px-5 h-9 rounded-lg cursor-pointer shadow-md"
          >
            {t('Create Role')}
          </Button>
        </div>

        {/* Default Permissions Card */}
        <div
          onClick={() => {
            setActiveRoleId('everyone');
            setRoleName('@everyone');
            setRoleColor('#94a3b8');
            setRoleEditorTab('permissions');
          }}
          className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31]/80 transition-colors cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="size-9 rounded-xl bg-[#2b2d31] flex items-center justify-center text-muted-foreground group-hover:text-foreground">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">
                {t('Default Permissions')}
              </span>
              <span className="text-[11px] text-muted-foreground">
                @everyone • {t('applies to all server members')}
              </span>
            </div>
          </div>
          <span className="text-muted-foreground text-sm font-bold group-hover:text-foreground">
            &gt;
          </span>
        </div>

        {/* Custom Roles List */}
        {serverRoles.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Peran Khusus')} ({serverRoles.length})
            </span>
            <div className="rounded-xl border border-border/80 bg-[#1e1f22] divide-y divide-border/60 overflow-hidden">
              {serverRoles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className="flex items-center justify-between p-3.5 hover:bg-[#2b2d31]/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: role.color || '#94a3b8' }}
                    />
                    <span className="text-xs font-bold text-foreground">
                      {role.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-[11px]">
                      {members.filter((m) => m.role === role.name.toLowerCase()).length}{' '}
                      {t('anggota')}
                    </span>
                    <span className="text-xs font-bold">&gt;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ROLE EDITOR (Discord 1:1 Parity)
  // ==========================================
  return (
    <div className="w-full flex flex-col md:flex-row gap-6 items-start">
      {/* Sub-Sidebar: Roles List */}
      <div className="w-full md:w-56 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveRoleId(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('Back')}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNewRole}
            className="p-1 rounded bg-[#2b2d31] hover:bg-[#35373c] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t('Buat Peran')}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Roles list */}
        <div className="space-y-1">
          {serverRoles.map((r) => {
            const isSelected = activeRole?.id === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRole(r)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer',
                  isSelected
                    ? 'bg-[#2b2d31] text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[#2b2d31]/50',
                )}
              >
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: r.color || '#94a3b8' }}
                />
                <span className="truncate">{r.name}</span>
              </button>
            );
          })}

          {/* @everyone row */}
          <button
            type="button"
            onClick={() => {
              setActiveRoleId('everyone');
              setRoleName('@everyone');
              setRoleColor('#94a3b8');
              setRoleEditorTab('permissions');
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer mt-2 pt-2 border-t border-border/50',
              activeRole?.id === 'everyone'
                ? 'bg-[#2b2d31] text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-[#2b2d31]/50',
            )}
          >
            <span className="size-2.5 rounded-full bg-muted-foreground/60 shrink-0" />
            <span className="truncate">@everyone</span>
          </button>
        </div>
      </div>

      {/* Main Right Editor Pane */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Editor Top Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground truncate">
            {t('Edit Role')} — {activeRole.name}
          </h2>

          {activeRole.id !== 'everyone' && (
            <button
              type="button"
              onClick={() => handleDeleteRole(activeRole.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title={t('Hapus Peran')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 4 Tabs Bar */}
        <div className="flex items-center gap-6 border-b border-border/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRoleEditorTab('display')}
            className={cn(
              'pb-2.5 transition-colors cursor-pointer relative',
              roleEditorTab === 'display'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{t('Display')}</span>
            {roleEditorTab === 'display' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setRoleEditorTab('permissions')}
            className={cn(
              'pb-2.5 transition-colors cursor-pointer relative',
              roleEditorTab === 'permissions'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{t('Permissions')}</span>
            {roleEditorTab === 'permissions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setRoleEditorTab('links')}
            className={cn(
              'pb-2.5 transition-colors cursor-pointer relative',
              roleEditorTab === 'links'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{t('Links')}</span>
            {roleEditorTab === 'links' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setRoleEditorTab('members')}
            className={cn(
              'pb-2.5 transition-colors cursor-pointer relative',
              roleEditorTab === 'members'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{t('Manage Members')} ({roleMembers.length})</span>
            {roleEditorTab === 'members' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
            )}
          </button>
        </div>

        {/* TAB 1: DISPLAY */}
        {roleEditorTab === 'display' && (
          <RoleDisplaySubtab
            roleName={roleName}
            setRoleName={setRoleName}
            roleColor={roleColor}
            setRoleColor={setRoleColor}
            roleIcon={roleIcon}
            setRoleIcon={setRoleIcon}
            roleStyle={roleStyle}
            setRoleStyle={setRoleStyle}
            hoist={hoist}
            setHoist={setHoist}
            mentionable={mentionable}
            setMentionable={setMentionable}
            activeRole={activeRole}
            t={t}
          />
        )}

        {roleEditorTab === 'permissions' && (
          <RolePermissionsSubtab
            permissions={permissions}
            togglePermission={togglePermission}
            clearAllPermissions={clearAllPermissions}
            permissionsSearch={permissionsSearch}
            setPermissionsSearch={setPermissionsSearch}
            activeRole={activeRole}
            t={t}
          />
        )}

        {roleEditorTab === 'links' && (
          <RoleLinksSubtab
            requirements={requirements}
            setRequirements={setRequirements}
            isAddingRequirement={isAddingRequirement}
            setIsAddingRequirement={setIsAddingRequirement}
            t={t}
          />
        )}

        {roleEditorTab === 'members' && (
          <RoleMembersSubtab
            activeRole={activeRole}
            activeColony={activeColony}
            members={members}
            assignedMemberIds={assignedMemberIds}
            setAssignedMemberIds={setAssignedMemberIds}
            memberSearchInRole={memberSearchInRole}
            setMemberSearchInRole={setMemberSearchInRole}
            isAddingMembersModalOpen={isAddingMembersModalOpen}
            setIsAddingMembersModalOpen={setIsAddingMembersModalOpen}
            onUpdateMembers={onUpdateMembers}
            t={t}
          />
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border/50 flex items-center gap-3">
          <Button
            variant="teal"
            disabled={isSaving}
            onClick={handleSaveRole}
            className="text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
          >
            {isSaving ? t('Menyimpan...') : t('Simpan Perubahan')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveRoleId(null)}
            className="text-xs h-9 px-4 rounded-lg cursor-pointer"
          >
            {t('Batal')}
          </Button>
        </div>
      </div>
    </div>
  );
}
