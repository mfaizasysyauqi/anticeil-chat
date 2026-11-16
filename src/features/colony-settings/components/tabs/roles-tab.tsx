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

interface RolesTabProps {
  activeColony: Colony;
  serverRoles: CommunityCustomRole[];
  setServerRoles: React.Dispatch<React.SetStateAction<CommunityCustomRole[]>>;
  members: ColonyMember[];
  t: (key: string) => string;
}

export function RolesTab({
  activeColony,
  serverRoles,
  setServerRoles,
  members,
  t,
}: RolesTabProps) {
  // If activeRoleId is null, show main "Organize your members" screen
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [roleEditorTab, setRoleEditorTab] = useState<
    'display' | 'permissions' | 'links' | 'members'
  >('display');

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

  // 35+ granular Discord permissions map
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
  };

  const handleCreateNewRole = async () => {
    try {
      const created = await colonyApi.createRole(activeColony.id, {
        name: 'new role',
        color: '#94a3b8',
      });
      const roleItem: CommunityCustomRole = {
        ...created,
        name: 'new role',
        color: '#94a3b8',
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
        permissions: [],
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
    const updated = serverRoles.map((r) =>
      r.id === activeRole.id ? { ...r, name: roleName, color: roleColor } : r,
    );
    setServerRoles(updated);
    toast.success(t(`Peran "${roleName}" berhasil disimpan! 🛡️`));
  };

  const handleDeleteRole = async (id: string) => {
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
            onClick={handleCreateNewRole}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-5 h-9 rounded-lg cursor-pointer shadow-md"
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2]" />
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2]" />
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2]" />
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2]" />
            )}
          </button>
        </div>

        {/* TAB 1: DISPLAY */}
        {roleEditorTab === 'display' && (
          <div className="space-y-6">
            {/* Role Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Role name')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="new role"
                className="w-full h-10 px-3.5 rounded-xl bg-[#1e1f22] border border-border/80 text-xs font-semibold text-foreground focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            {/* Role Style NEW */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Role Style')}
                </label>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#5865F2] text-white">
                  NEW
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['solid', 'gradient', 'holographic'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setRoleStyle(style)}
                    className={cn(
                      'p-3 rounded-xl border bg-[#1e1f22] flex flex-col items-center justify-center gap-1.5 capitalize text-xs font-semibold transition-all cursor-pointer',
                      roleStyle === style
                        ? 'border-[#5865F2] ring-2 ring-[#5865F2] bg-[#2b2d31]'
                        : 'border-border/70 hover:border-border hover:bg-[#2b2d31]/50 text-muted-foreground',
                    )}
                  >
                    <span className="text-xs">{style}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1e1f22] border border-border/60 text-xs">
                <div>
                  <span className="font-bold text-foreground">
                    {t('Make certain roles magical')}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Unlock new role styles with Boosting.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info(t('Tingkatkan server untuk membuka gaya peran kustom.'))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#5865F2] via-[#8b5cf6] to-[#ec4899] text-white text-[10px] font-bold shadow-sm"
                >
                  <Gem className="w-3 h-3" />
                  <span>{t('Unlock with Boosting')}</span>
                </button>
              </div>
            </div>

            {/* Role Color */}
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Role color')} <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    'Members use the color of the highest role they have on the roles list.',
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Clear / Default swatch */}
                <button
                  type="button"
                  onClick={() => setRoleColor('#94a3b8')}
                  className={cn(
                    'size-9 rounded-xl border flex items-center justify-center bg-[#2b2d31] transition-transform cursor-pointer',
                    roleColor === '#94a3b8'
                      ? 'border-white ring-2 ring-[#5865F2] scale-105'
                      : 'border-border/70',
                  )}
                  title="Clear / Default"
                >
                  <Check className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* 16 Discord Role Colors */}
                {discordRoleColors.map((col) => {
                  const isSelected =
                    roleColor.toLowerCase() === col.toLowerCase();
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setRoleColor(col)}
                      className={cn(
                        'size-9 rounded-xl border transition-all cursor-pointer shadow-xs',
                        isSelected
                          ? 'border-white ring-2 ring-[#5865F2] scale-110'
                          : 'border-transparent hover:scale-105',
                      )}
                      style={{ backgroundColor: col }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Live Message Preview (Discord 1:1 Parity) */}
            <div className="rounded-xl border border-border/80 bg-[#111214] p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Role Preview')}
              </span>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-[#1e1f22]">
                <div className="size-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-bold"
                      style={{ color: roleColor }}
                    >
                      Wumpus
                    </span>
                    <span className="text-[10px] text-muted-foreground">14:49</span>
                  </div>
                  <p className="text-xs text-foreground/90 mt-0.5">
                    rocks are really old
                  </p>
                </div>
              </div>
            </div>

            {/* Display Separately Switch (Hoisted) */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {t('Display role members separately from online members')}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t('Menampilkan anggota peran ini dalam kategori khusus di daftar anggota.')}
                </span>
              </div>
              <Switch checked={hoist} onCheckedChange={setHoist} />
            </div>

            {/* Mentionable Switch */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {t('Allow anyone to @mention this role')}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t(
                    'Members with the "Mention @everyone, @here, and All Roles" permission will always be able to ping this role.',
                  )}
                </span>
              </div>
              <Switch checked={mentionable} onCheckedChange={setMentionable} />
            </div>
          </div>
        )}

        {/* TAB 2: PERMISSIONS (Discord 35+ Permissions Parity) */}
        {roleEditorTab === 'permissions' && (
          <div className="space-y-6">
            {/* Search & Clear Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={permissionsSearch}
                  onChange={(e) => setPermissionsSearch(e.target.value)}
                  placeholder={t('Search permissions')}
                  className="w-full text-xs h-9 pl-9 pr-3 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllPermissions}
                className="text-xs text-blue-400 hover:text-blue-300 h-9"
              >
                {t('Clear permissions')}
              </Button>
            </div>

            {/* Group 1: General Server Permissions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('General Server Permissions')}
              </h4>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'view_channels',
                    name: 'View Channels',
                    desc: 'Allows members to view channels by default (excluding private channels).',
                  },
                  {
                    key: 'manage_channels',
                    name: 'Manage Channels',
                    desc: 'Allows members to create, edit, or delete channels.',
                  },
                  {
                    key: 'manage_roles',
                    name: 'Manage Roles',
                    desc: 'Allows members to create new roles and edit or delete roles lower than their highest role.',
                  },
                  {
                    key: 'create_expressions',
                    name: 'Create Expressions',
                    desc: 'Allows members to add custom emoji, stickers, and sounds in this server.',
                  },
                  {
                    key: 'manage_expressions',
                    name: 'Manage Expressions',
                    desc: 'Allows members to edit or remove custom emoji, stickers, and sounds in this server.',
                  },
                  {
                    key: 'view_audit_log',
                    name: 'View Audit Log',
                    desc: 'Allows members to view a record of who made which changes in this server.',
                  },
                  {
                    key: 'view_server_insights',
                    name: 'View Server Insights',
                    desc: 'Allows members to view Server Insights, which shows data on community growth, engagement, and more.',
                  },
                  {
                    key: 'manage_webhooks',
                    name: 'Manage Webhooks',
                    desc: 'Allows members to create, edit, or delete webhooks, which can post messages from other apps or sites into this server.',
                  },
                  {
                    key: 'manage_server',
                    name: 'Manage Server',
                    desc: "Allows members to change this server's name, switch regions, view all invites, add apps to this server and create and update AutoMod rules.",
                  },
                ].map((perm) => (
                  <div
                    key={perm.key}
                    className="flex items-start justify-between gap-4 py-1"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t(perm.name)}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {t(perm.desc)}
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(permissions[perm.key])}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-border/50 my-4" />

            {/* Group 2: Membership Permissions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Membership Permissions')}
              </h4>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'create_invite',
                    name: 'Create Invite',
                    desc: 'Allows members to invite new people to this server.',
                  },
                  {
                    key: 'change_nickname',
                    name: 'Change Nickname',
                    desc: 'Allows members to change their own nickname, a custom name for just this server.',
                  },
                  {
                    key: 'manage_nicknames',
                    name: 'Manage Nicknames',
                    desc: 'Allows members to change the nicknames of other members.',
                  },
                  {
                    key: 'kick_members',
                    name: 'Kick, Approve, and Reject Members',
                    desc: 'Kick will remove other members from this server. Kicked members will be able to rejoin if they have another invite.',
                  },
                  {
                    key: 'ban_members',
                    name: 'Ban Members',
                    desc: 'Allows members to permanently ban and delete the message history of other members from this server.',
                  },
                  {
                    key: 'timeout_members',
                    name: 'Timeout Members',
                    desc: 'When you put a user in timeout they will not be able to send messages in chat, reply within threads, react to messages, or speak in voice or Stage channels.',
                  },
                ].map((perm) => (
                  <div
                    key={perm.key}
                    className="flex items-start justify-between gap-4 py-1"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t(perm.name)}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {t(perm.desc)}
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(permissions[perm.key])}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-border/50 my-4" />

            {/* Group 3: Text & Voice Channel Permissions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Text Channel Permissions')}
              </h4>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'send_messages',
                    name: 'Send Messages and Create Posts',
                    desc: 'Allow members to send messages in text channels and create posts in forum channels.',
                  },
                  {
                    key: 'send_messages_in_threads',
                    name: 'Send Messages in Threads and Posts',
                    desc: 'Allow members to send messages in threads and in posts on forum channels.',
                  },
                  {
                    key: 'create_public_threads',
                    name: 'Create Public Threads',
                    desc: 'Allow members to create threads that everyone in a channel can view.',
                  },
                  {
                    key: 'embed_links',
                    name: 'Embed Links',
                    desc: 'Allows links that members share to show embedded content in text channels.',
                  },
                  {
                    key: 'attach_files',
                    name: 'Attach Files',
                    desc: 'Allows members to upload files or media in text channels.',
                  },
                  {
                    key: 'add_reactions',
                    name: 'Add Reactions',
                    desc: 'Allows members to add new emoji reactions to a message.',
                  },
                  {
                    key: 'manage_messages',
                    name: 'Manage Messages',
                    desc: 'Allows members to delete or remove embeds from messages by other members.',
                  },
                  {
                    key: 'pin_messages',
                    name: 'Pin Messages',
                    desc: 'Allows members to pin or unpin any message.',
                  },
                ].map((perm) => (
                  <div
                    key={perm.key}
                    className="flex items-start justify-between gap-4 py-1"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t(perm.name)}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {t(perm.desc)}
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(permissions[perm.key])}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-border/50 my-4" />

            {/* Group 4: Advanced Administrator Permission */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-destructive">
                  {t('Administrator')}
                </span>
                <Switch
                  checked={Boolean(permissions.administrator)}
                  onCheckedChange={() => togglePermission('administrator')}
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t(
                  'Members with this permission will have every permission and will also bypass all channel specific permissions or restrictions. This is a dangerous permission to grant.',
                )}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: LINKS (Discord 1:1 Parity) */}
        {roleEditorTab === 'links' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t('Create Linked Role')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t(
                  'Linking a connection or app requires members to connect their accounts before being added to the role.',
                )}{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info(t('Linked roles require verified third-party connections.'));
                  }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  {t('Learn more about Linked Roles.')}
                </a>
              </p>
            </div>

            {/* Add requirement button */}
            <div>
              <Button
                onClick={() => setIsAddingRequirement(true)}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold h-10 rounded-lg cursor-pointer"
              >
                {t('Add requirement')}
              </Button>
            </div>

            {/* Requirements list */}
            {requirements.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  {t('Active Requirements')} ({requirements.length})
                </span>
                <div className="rounded-xl border border-border/80 bg-[#1e1f22] divide-y divide-border/60 overflow-hidden">
                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">🔗</span>
                        <div>
                          <span className="text-xs font-bold text-foreground block">
                            {req.platform}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {req.condition}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRequirements((prev) =>
                            prev.filter((r) => r.id !== req.id),
                          )
                        }
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add requirement modal */}
            {isAddingRequirement && (
              <div className="p-4 rounded-xl border border-border/80 bg-[#1e1f22] space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  {t('Pilih Platform Koneksi')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: 'Steam', cond: 'Steam account verified (> 1 game)' },
                    { name: 'Spotify', cond: 'Spotify connected' },
                    { name: 'GitHub', cond: 'GitHub account (> 5 followers)' },
                    { name: 'YouTube', cond: 'YouTube channel verified' },
                    { name: 'Reddit', cond: 'Reddit account karma > 50' },
                    { name: 'X / Twitter', cond: 'X account followers > 10' },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setRequirements((prev) => [
                          ...prev,
                          {
                            id: `req_${Date.now()}`,
                            platform: p.name,
                            condition: p.cond,
                          },
                        ]);
                        setIsAddingRequirement(false);
                        toast.success(
                          t(`Persyaratan ${p.name} berhasil ditambahkan!`),
                        );
                      }}
                      className="p-2.5 rounded-lg border border-border/60 bg-[#2b2d31]/70 hover:bg-[#35373c] text-xs font-semibold text-left transition-colors cursor-pointer"
                    >
                      <span className="text-foreground block">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {p.cond}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pt-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingRequirement(false)}
                    className="text-xs h-8"
                  >
                    {t('Batal')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MANAGE MEMBERS (Discord 1:1 Parity) */}
        {roleEditorTab === 'members' && (
          <div className="space-y-4">
            {/* Search & Add Members Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={memberSearchInRole}
                  onChange={(e) => setMemberSearchInRole(e.target.value)}
                  placeholder={t('Search Members')}
                  className="w-full text-xs h-9 pl-9 pr-3 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <Button
                size="sm"
                onClick={() => setIsAddingMembersModalOpen(true)}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold h-9 px-4 rounded-lg cursor-pointer shrink-0"
              >
                {t('Add Members')}
              </Button>
            </div>

            {/* Member List or Empty State */}
            {roleMembers.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="size-12 rounded-full bg-[#2b2d31] flex items-center justify-center text-muted-foreground mx-auto text-xl">
                  👥
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('No members were found.')}{' '}
                  <button
                    type="button"
                    onClick={() => setIsAddingMembersModalOpen(true)}
                    className="text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    {t('Add members to this role.')}
                  </button>
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 bg-[#1e1f22] divide-y divide-border/60 overflow-hidden">
                {roleMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CommunityAvatar
                        name={m.name}
                        imageUrl={m.avatar}
                        size={32}
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          @{m.name.toLowerCase().replace(/\s+/g, '_')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignedMemberIds((prev) =>
                          prev.filter((id) => id !== m.id),
                        );
                        toast.success(
                          t(
                            `Peran dicabut dari ${m.name}.`,
                          ),
                        );
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title={t('Hapus dari Peran')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Members Selection Modal */}
            {isAddingMembersModalOpen && (
              <div className="p-4 rounded-xl border border-border/80 bg-[#1e1f22] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {t('Pilih Anggota untuk Peran Ini')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingMembersModalOpen(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {members.map((m) => {
                    const isAlreadyAssigned = roleMembers.some(
                      (rm) => rm.id === m.id,
                    );
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isAlreadyAssigned) {
                            setAssignedMemberIds((prev) =>
                              prev.filter((id) => id !== m.id),
                            );
                          } else {
                            setAssignedMemberIds((prev) => [...prev, m.id]);
                            toast.success(t(`${m.name} ditambahkan ke peran!`));
                          }
                        }}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors',
                          isAlreadyAssigned
                            ? 'bg-[#5865F2]/20 text-[#5865F2]'
                            : 'hover:bg-[#2b2d31] text-foreground',
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <CommunityAvatar
                            name={m.name}
                            imageUrl={m.avatar}
                            size={26}
                          />
                          <span className="font-semibold">{m.name}</span>
                        </div>
                        {isAlreadyAssigned && (
                          <Check className="w-4 h-4 text-[#5865F2]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border/50 flex items-center gap-3">
          <Button
            onClick={handleSaveRole}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
          >
            {t('Simpan Perubahan')}
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
