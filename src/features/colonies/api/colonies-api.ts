import { getColonyInitials } from '../components/colony-icon';
import { api } from '@/lib/api';
import type { ServerInvitation, ColonyInvitation, ColonyOnboarding, ColonyTemplateSettings } from '@/lib/colony';
import {
  loadStoredChannels,
  loadStoredColonies,
  saveStoredColonies,
  loadStoredMessages,
  loadStoredInvites,
  saveStoredInvites,
  loadStoredBans,
  saveStoredBans,
  loadStoredRoles,
  saveStoredRoles,
  loadStoredAuditLog,
  saveStoredAuditLog,
} from '@/chat/chat-defaults';
import type {
  Colony,
  ColonyAuditEntry,
  ColonyInvite,
  ColonyBan,
  ColonyCustomRole,
  ColonyStats,
  ColonyRole,
  ColonyMember,
} from '@/chat/chat-types';
import type { DiscordEmoji, DiscordSticker } from '@/chat/anticeil-media-data';
import { membersApi } from '@/features/members/api/members-api';
import { coloniesInvitesAssetsApi } from './colonies-invites-assets-api';

export const coloniesApi = {
  // ── Hubs (Servers) & Invites ──────────────────────────────────────────
  async getColonies(): Promise<Colony[]> {
    try {
      const res = await api.get<Colony[]>('/v1/colony/colonies');
      if (Array.isArray(res) && res.length > 0) {
        saveStoredColonies(res);
        return res;
      }
    } catch {}
    return loadStoredColonies();
  },

  async createColony(payload: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    iconUrl?: string;
  }): Promise<Colony> {
    const newId = `hub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newColony: Colony = {
      id: newId,
      name: payload.name,
      iconType: payload.iconUrl ? undefined : 'initials',
      iconUrl: payload.iconUrl,
      initials: getColonyInitials(payload.name),
      description: payload.description || '',
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      membersCount: 1,
      color: payload.color || 'bg-indigo-600',
      role: 'owner',
      tags: ['komunitas', 'anticeil'],
      emojis: [
        { id: '1', name: 'rocket', char: '🚀' },
        { id: '2', name: 'fire', char: '🔥' },
        { id: '3', name: 'robot', char: '🤖' },
      ],
      boostsCount: 0,
      boostTier: 0,
    };

    try {
      const res = await api.post<Colony>('/v1/colony/colonies', {
        ...payload,
        id: newId,
        tags: newColony.tags,
        emojis: newColony.emojis,
      });
      if (res && res.id) {
        const stored = loadStoredColonies();
        const updated = [...stored.filter((h) => h.id !== res.id), res];
        saveStoredColonies(updated);
        this.recordAudit(res.id, 'COLONY_CREATED', 'Admin', res.name);
        return res;
      }
    } catch {}

    const stored = loadStoredColonies();
    const updated = [...stored.filter((h) => h.id !== newId), newColony];
    saveStoredColonies(updated);
    this.recordAudit(newId, 'COLONY_CREATED', 'Admin', newColony.name);
    return newColony;
  },

  async updateColony(
    id: string,
    payload: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      iconUrl?: string;
      tags?: string[];
      emojis?: any[];
      boostsCount?: number;
      boostTier?: number;
      onboarding?: ColonyOnboarding;
      templateSettings?: ColonyTemplateSettings;
    },
  ): Promise<Colony> {
    try {
      const res = await api.put<Colony>(`/v1/colony/colonies/${id}`, payload);
      if (res && res.id) {
        const stored = loadStoredColonies();
        saveStoredColonies(stored.map((h) => (h.id === id ? res : h)));
        this.recordAudit(id, 'HUB_UPDATED', 'Admin', payload.name || id, payload);
        return res;
      }
    } catch {}

    const stored = loadStoredColonies();
    let target = stored.find((h) => h.id === id);
    if (target) {
      target = { ...target, ...payload };
      saveStoredColonies(stored.map((h) => (h.id === id ? target! : h)));
      this.recordAudit(id, 'HUB_UPDATED', 'Admin', payload.name || id, payload);
      return target;
    }
    const fallback: Colony = {
      id,
      name: payload.name || 'Server',
      description: payload.description || '',
      initials: (payload.name || 'SV').slice(0, 2).toUpperCase(),
      iconType: 'initials',
      role: 'owner',
      ...payload,
    };
    saveStoredColonies([...stored, fallback]);
    return fallback;
  },

  async deleteColony(id: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/colonies/${id}`);
    } catch {}
    const stored = loadStoredColonies();
    saveStoredColonies(stored.filter((h) => h.id !== id));
    this.recordAudit(id, 'HUB_DELETED', 'Admin', id);
    return { success: true, id };
  },

  async boostColony(id: string): Promise<{ success: boolean; boostsCount: number; boostTier: number }> {
    try {
      const res = await api.post<{ success: boolean; boostsCount: number; boostTier: number }>(
        `/v1/colony/colonies/${id}/boost`,
      );
      if (res && typeof res.boostsCount === 'number') {
        const stored = loadStoredColonies();
        saveStoredColonies(
          stored.map((h) =>
            h.id === id
              ? { ...h, boostsCount: res.boostsCount, boostTier: res.boostTier }
              : h,
          ),
        );
        this.recordAudit(id, 'SERVER_BOOST', 'Admin', `Boost Tier ${res.boostTier}`, {
          boostsCount: res.boostsCount,
        });
        return res;
      }
    } catch {}

    const stored = loadStoredColonies();
    let count = 1;
    let tier = 0;
    const target = stored.find((h) => h.id === id);
    if (target) {
      count = (target.boostsCount || 0) + 1;
      tier = count >= 14 ? 3 : count >= 7 ? 2 : count >= 2 ? 1 : 0;
      target.boostsCount = count;
      target.boostTier = tier;
      saveStoredColonies(stored.map((h) => (h.id === id ? target : h)));
    }
    this.recordAudit(id, 'SERVER_BOOST', 'Admin', `Boost Tier ${tier}`, { boostsCount: count });
    return { success: true, boostsCount: count, boostTier: tier };
  },

  // ── Member Actions: Role & Kick ──────────────────────────────────────
  async updateMemberRole(
    colonyId: string,
    userId: string,
    role: ColonyRole,
  ): Promise<{ success: boolean; userId: string; role: ColonyRole }> {
    try {
      await api.put(`/v1/colony/colonies/${colonyId}/members/${userId}/role`, { role });
    } catch {}
    this.recordAudit(colonyId, 'MEMBER_ROLE_CHANGE', 'Admin', userId, { newRole: role });
    return { success: true, userId, role };
  },

  async kickMember(colonyId: string, userId: string): Promise<{ success: boolean; userId: string }> {
    try {
      await api.delete(`/v1/colony/colonies/${colonyId}/members/${userId}`);
    } catch {}
    this.recordAudit(colonyId, 'MEMBER_KICK', 'Admin', userId);
    return { success: true, userId };
  },

  // ── Roles Management ──────────────────────────────────────────────────
  async getRoles(colonyId: string): Promise<ColonyCustomRole[]> {
    try {
      const res = await api.get<ColonyCustomRole[]>(`/v1/colony/colonies/${colonyId}/roles`);
      if (Array.isArray(res) && res.length > 0) {
        saveStoredRoles(colonyId, res);
        return res;
      }
    } catch {}
    const stored = loadStoredRoles(colonyId);
    if (stored.length > 0) return stored;
    return [];
  },

  async createRole(colonyId: string, payload: { name: string; color: string; permissions?: string[] }): Promise<ColonyCustomRole> {
    const newRole: ColonyCustomRole = {
      id: `role_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      colonyId,
      name: payload.name,
      color: payload.color || '#6366f1',
      permissions: payload.permissions || ['SEND_MESSAGES'],
    };
    try {
      const res = await api.post<ColonyCustomRole>(`/v1/colony/colonies/${colonyId}/roles`, newRole);
      if (res && res.id) {
        const stored = loadStoredRoles(colonyId);
        saveStoredRoles(colonyId, [...stored, res]);
        this.recordAudit(colonyId, 'ROLE_CREATED', 'Admin', res.name, { color: res.color });
        return res;
      }
    } catch {}
    const stored = loadStoredRoles(colonyId);
    const updated = [...stored, newRole];
    saveStoredRoles(colonyId, updated);
    this.recordAudit(colonyId, 'ROLE_CREATED', 'Admin', newRole.name, { color: newRole.color });
    return newRole;
  },

  async updateRole(
    colonyId: string,
    roleId: string,
    payload: { name?: string; color?: string; permissions?: string[]; position?: number },
  ): Promise<ColonyCustomRole> {
    try {
      const res = await api.put<ColonyCustomRole>(`/v1/colony/colonies/${colonyId}/roles/${roleId}`, payload);
      if (res && res.id) {
        const stored = loadStoredRoles(colonyId);
        const updated = stored.map((r) => (r.id === roleId ? { ...r, ...res } : r));
        saveStoredRoles(colonyId, updated);
        this.recordAudit(colonyId, 'ROLE_UPDATED', 'Admin', res.name, { color: res.color });
        return res;
      }
    } catch {}
    const stored = loadStoredRoles(colonyId);
    let updatedRole: ColonyCustomRole | null = null;
    const updated = stored.map((r) => {
      if (r.id === roleId) {
        updatedRole = {
          ...r,
          name: payload.name !== undefined ? payload.name : r.name,
          color: payload.color !== undefined ? payload.color : r.color,
          permissions: payload.permissions !== undefined ? payload.permissions : r.permissions,
          position: payload.position !== undefined ? payload.position : r.position,
        };
        return updatedRole;
      }
      return r;
    });
    if (!updatedRole) {
      updatedRole = {
        id: roleId,
        colonyId,
        name: payload.name || 'Role',
        color: payload.color || '#6366f1',
        permissions: payload.permissions || ['SEND_MESSAGES'],
        position: payload.position || 0,
      };
      updated.push(updatedRole);
    }
    saveStoredRoles(colonyId, updated);
    this.recordAudit(colonyId, 'ROLE_UPDATED', 'Admin', updatedRole.name, { color: updatedRole.color });
    return updatedRole;
  },

  async deleteRole(colonyId: string, roleId: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/colonies/${colonyId}/roles/${roleId}`);
    } catch {}
    const stored = loadStoredRoles(colonyId);
    saveStoredRoles(colonyId, stored.filter((r) => r.id !== roleId));
    this.recordAudit(colonyId, 'ROLE_DELETED', 'Admin', roleId);
    return { success: true, id: roleId };
  },

  // ── Invites Management ────────────────────────────────────────────────
  async getInvites(colonyId: string): Promise<ColonyInvite[]> {
    try {
      const res = await api.get<ColonyInvite[]>(`/v1/colony/colonies/${colonyId}/invites`);
      if (Array.isArray(res) && res.length > 0) {
        saveStoredInvites(colonyId, res);
        return res;
      }
    } catch {}
    const stored = loadStoredInvites(colonyId);
    if (stored.length > 0) return stored;
    return [];
  },

  async createInvite(
    colonyId: string,
    payload: { maxUses?: number; expiresAt?: string | null },
  ): Promise<ColonyInvite> {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const newInvite: ColonyInvite = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      colonyId,
      code,
      inviterName: 'Admin',
      uses: 0,
      maxUses: payload.maxUses || 0,
      expiresAt: payload.expiresAt || null,
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await api.post<ColonyInvite>(`/v1/colony/colonies/${colonyId}/invites`, newInvite);
      if (res && res.id) {
        const stored = loadStoredInvites(colonyId);
        saveStoredInvites(colonyId, [res, ...stored]);
        this.recordAudit(colonyId, 'INVITE_CREATE', 'Admin', res.code);
        return res;
      }
    } catch {}
    const stored = loadStoredInvites(colonyId);
    saveStoredInvites(colonyId, [newInvite, ...stored]);
    this.recordAudit(colonyId, 'INVITE_CREATE', 'Admin', newInvite.code);
    return newInvite;
  },

  async revokeInvite(colonyId: string, inviteId: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/colonies/${colonyId}/invites/${inviteId}`);
    } catch {}
    const stored = loadStoredInvites(colonyId);
    saveStoredInvites(colonyId, stored.filter((i) => i.id !== inviteId && i.code !== inviteId));
    this.recordAudit(colonyId, 'INVITE_REVOKE', 'Admin', inviteId);
    return { success: true, id: inviteId };
  },

  // ── Bans Management ───────────────────────────────────────────────────
  async getBans(colonyId: string): Promise<ColonyBan[]> {
    try {
      const res = await api.get<ColonyBan[]>(`/v1/colony/colonies/${colonyId}/bans`);
      if (Array.isArray(res)) {
        saveStoredBans(colonyId, res);
        return res;
      }
    } catch {}
    return loadStoredBans(colonyId);
  },

  async banUser(
    colonyId: string,
    payload: { userId: string; userName: string; userEmail?: string; reason: string },
  ): Promise<ColonyBan> {
    const newBan: ColonyBan = {
      id: `ban_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      colonyId,
      userId: payload.userId,
      userName: payload.userName,
      userEmail: payload.userEmail,
      reason: payload.reason || 'Melanggar aturan komunitas',
      bannedByName: 'Admin',
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await api.post<ColonyBan>(`/v1/colony/colonies/${colonyId}/bans`, newBan);
      if (res && res.id) {
        const stored = loadStoredBans(colonyId);
        saveStoredBans(colonyId, [res, ...stored.filter((b) => b.userId !== payload.userId)]);
        this.recordAudit(colonyId, 'MEMBER_BAN', 'Admin', payload.userName, { reason: payload.reason });
        return res;
      }
    } catch {}
    const stored = loadStoredBans(colonyId);
    saveStoredBans(colonyId, [newBan, ...stored.filter((b) => b.userId !== payload.userId)]);
    this.recordAudit(colonyId, 'MEMBER_BAN', 'Admin', payload.userName, { reason: payload.reason });
    return newBan;
  },

  async unbanUser(colonyId: string, userId: string): Promise<{ success: boolean; userId: string }> {
    try {
      await api.delete(`/v1/colony/colonies/${colonyId}/bans/${userId}`);
    } catch {}
    const stored = loadStoredBans(colonyId);
    saveStoredBans(colonyId, stored.filter((b) => b.userId !== userId && b.id !== userId));
    this.recordAudit(colonyId, 'MEMBER_UNBAN', 'Admin', userId);
    return { success: true, userId };
  },

  // ── Audit Log ─────────────────────────────────────────────────────────
  async getAuditLog(colonyId: string): Promise<ColonyAuditEntry[]> {
    try {
      const res = await api.get<ColonyAuditEntry[]>(`/v1/colony/colonies/${colonyId}/audit-log`);
      if (Array.isArray(res) && res.length > 0) {
        saveStoredAuditLog(colonyId, res);
        return res;
      }
    } catch {}
    const stored = loadStoredAuditLog(colonyId);
    if (stored.length > 0) return stored;
    return [];
  },

  recordAudit(
    colonyId: string,
    action: string,
    actorName: string,
    targetName: string = '',
    details?: any,
  ): void {
    const entry: ColonyAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      colonyId,
      action,
      actorName: actorName || 'Admin',
      targetName,
      details,
      createdAt: new Date().toISOString(),
    };
    const stored = loadStoredAuditLog(colonyId);
    const updated = [entry, ...stored].slice(0, 100);
    saveStoredAuditLog(colonyId, updated);
  },

  // ── Engagement / Stats ────────────────────────────────────────────────
  async getHubStats(colonyId: string): Promise<ColonyStats> {
    try {
      const res = await api.get<ColonyStats>(`/v1/colony/colonies/${colonyId}/stats`);
      if (res && typeof res.totalMessages === 'number') {
        return res;
      }
    } catch {}
    const storedChannels = loadStoredChannels().filter((c) => (c.colonyId || 'anticeil') === colonyId);
    const storedMessages = loadStoredMessages();
    let totalMessages = 0;
    let botMessages = 0;
    const channelActivity: Array<{ channelId: string; channelName: string; messageCount: number }> = [];

    for (const ch of storedChannels) {
      const msgs = storedMessages[ch.id] || [];
      totalMessages += msgs.length;
      botMessages += msgs.filter((m) => m.senderRole === 'bot').length;
      channelActivity.push({
        channelId: ch.id,
        channelName: ch.name,
        messageCount: msgs.length,
      });
    }

    channelActivity.sort((a, b) => b.messageCount - a.messageCount);

    return {
      totalMessages,
      totalChannels: storedChannels.length,
      totalMembers: 0,
      totalBots: 0,
      botMessages,
      channelActivity,
    };
  },

  async getInvite(
    inviteCode: string,
  ): Promise<{ id: string; name: string; description: string; membersCount: number; color?: string }> {
    const cleanId = inviteCode.startsWith('hub_') ? inviteCode : `hub_${inviteCode}`;
    const stored = loadStoredColonies();
    const found = stored.find((h) => h.inviteCode === inviteCode || h.id === inviteCode || h.id === cleanId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        description: found.description || '',
        membersCount: found.membersCount || 1,
        color: found.color,
      };
    }
    try {
      const allHubs = await api.get<Colony[]>('/v1/colony/colonies');
      if (Array.isArray(allHubs)) {
        const foundInDb = allHubs.find((h) => h.inviteCode === inviteCode || h.id === inviteCode || h.id === cleanId);
        if (foundInDb) {
          return {
            id: foundInDb.id,
            name: foundInDb.name,
            description: foundInDb.description || '',
            membersCount: foundInDb.membersCount || 1,
            color: foundInDb.color,
          };
        }
      }
    } catch {}
    return {
      id: cleanId,
      name: `Server #${inviteCode.slice(0, 4)}`,
      description: 'Undangan server komunitas Anticeil',
      membersCount: 2,
    };
  },

  async getDiscoverColonies(params?: { q?: string; category?: string }): Promise<Colony[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.q) queryParams.set('q', params.q);
      if (params?.category) queryParams.set('category', params.category);
      const qs = queryParams.toString();
      const res = await api.get<Colony[]>(`/v1/colony/colonies/discover${qs ? `?${qs}` : ''}`);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}
    const stored = loadStoredColonies();
    return stored.filter((h) => h.id !== 'anticeil');
  },

  async joinHub(inviteCode: string): Promise<Colony> {
    const cleanId = inviteCode.startsWith('hub_') ? inviteCode : `hub_${inviteCode}`;
    const stored = loadStoredColonies();
    const existing = stored.find((h) => h.inviteCode === inviteCode || h.id === inviteCode || h.id === cleanId);
    if (existing) {
      return existing;
    }
    try {
      const allHubs = await api.get<Colony[]>('/v1/colony/colonies');
      if (Array.isArray(allHubs)) {
        const foundInDb = allHubs.find((h) => h.inviteCode === inviteCode || h.id === inviteCode || h.id === cleanId);
        if (foundInDb) {
          const next = [...stored.filter((h) => h.id !== foundInDb.id), foundInDb];
          saveStoredColonies(next);
          return foundInDb;
        }
      }
    } catch {}
    const newColony: Colony = {
      id: cleanId,
      name: `Server Komunitas`,
      iconType: 'initials',
      initials: 'SK',
      description: 'Bergabung melalui link undangan',
      inviteCode,
      membersCount: 2,
      color: 'bg-emerald-600',
      role: 'member',
    };
    saveStoredColonies([...stored, newColony]);
    return newColony;
  },

  // ── Colony Blueprint & Server Templates ────────────────────────────
  async getTemplate(code: string): Promise<any> {
    try {
      return await api.get<any>(`/v1/colony/templates/${code}`);
    } catch {
      return null;
    }
  },

  async syncColonyTemplate(
    colonyId: string,
    payload: { name: string; description: string; code?: string }
  ): Promise<any> {
    try {
      const res = await api.post<any>(`/v1/colony/colonies/${colonyId}/template`, payload);
      this.recordAudit(colonyId, 'TEMPLATE_SYNC', 'Admin', payload.name, payload);
      return res;
    } catch {
      const stored = loadStoredColonies();
      const updated = stored.map((c) =>
        c.id === colonyId
          ? {
              ...c,
              templateSettings: {
                name: payload.name,
                description: payload.description,
                code: payload.code || `tpl-${colonyId.substring(0, 6)}`,
                lastSyncedAt: new Date().toISOString(),
              },
            }
          : c
      );
      saveStoredColonies(updated);
      return { success: true, templateSettings: payload };
    }
  },

  async deleteColonyTemplate(colonyId: string): Promise<{ success: boolean }> {
    try {
      await api.delete(`/v1/colony/colonies/${colonyId}/template`);
    } catch {}
    const stored = loadStoredColonies();
    const updated = stored.map((c) => (c.id === colonyId ? { ...c, templateSettings: undefined } : c));
    saveStoredColonies(updated);
    this.recordAudit(colonyId, 'TEMPLATE_DELETE', 'Admin', colonyId);
    return { success: true };
  },

  async useTemplate(code: string, payload?: { name?: string }): Promise<Colony> {
    try {
      const res = await api.post<Colony>(`/v1/colony/templates/${code}/use`, payload || {});
      if (res && res.id) {
        const stored = loadStoredColonies();
        saveStoredColonies([...stored, res]);
        return res;
      }
    } catch {}
    const newColony: Colony = {
      id: `hub_${Date.now()}`,
      name: payload?.name || 'Server dari Template',
      description: 'Dibuat dari template server komunitas',
      iconType: 'initials',
      initials: (payload?.name || 'SV').slice(0, 2).toUpperCase(),
      role: 'owner',
      color: 'bg-emerald-600',
    };
    const stored = loadStoredColonies();
    saveStoredColonies([...stored, newColony]);
    return newColony;
  },

  async inviteMemberByUsername(
    colonyId: string,
    username: string,
  ): Promise<{ found: boolean; alreadyMember?: boolean; user?: ColonyMember }> {
    const members = await membersApi.getMembers();
    const cleanUser = username.trim().replace(/^@/, '').toLowerCase();
    const found = members.find(
      (m) =>
        (m.username && m.username.toLowerCase() === cleanUser) ||
        m.name.toLowerCase() === cleanUser ||
        m.email.toLowerCase().startsWith(cleanUser),
    );
    if (found) {
      return { found: true, user: found };
    }
    return { found: false };
  },

  // ── Server Invitations ────────────────────────────────────────────────
  getServerInvitations: coloniesInvitesAssetsApi.getServerInvitations,
  inviteUserToServer: coloniesInvitesAssetsApi.inviteUserToServer,
  acceptServerInvitation: coloniesInvitesAssetsApi.acceptServerInvitation,
  rejectServerInvitation: coloniesInvitesAssetsApi.rejectServerInvitation,

  // ── Bot Webhooks ──────────────────────────────────────────────────────
  async testWebhook(payload: {
    channelId?: string;
    channel?: string;
    colonyId?: string;
    botName?: string;
    content: string;
  }): Promise<any> {
    return api.post('/v1/colony/webhook', payload);
  },

  // ── Server Emojis & Stickers ──────────────────────────────────────────
  getServerEmojis: coloniesInvitesAssetsApi.getServerEmojis,
  addServerEmoji: coloniesInvitesAssetsApi.addServerEmoji,
  deleteServerEmoji: coloniesInvitesAssetsApi.deleteServerEmoji,
  getServerStickers: coloniesInvitesAssetsApi.getServerStickers,
  addServerSticker: coloniesInvitesAssetsApi.addServerSticker,
  deleteServerSticker: coloniesInvitesAssetsApi.deleteServerSticker,
  getServerSounds: coloniesInvitesAssetsApi.getServerSounds,
  addServerSound: coloniesInvitesAssetsApi.addServerSound,
  deleteServerSound: coloniesInvitesAssetsApi.deleteServerSound,
  playServerSound: coloniesInvitesAssetsApi.playServerSound,

  // ── Server Onboarding & Welcome Screen ──────────────────────────────
  async getColonyOnboarding(id: string): Promise<ColonyOnboarding> {
    try {
      return await api.get<ColonyOnboarding>(`/v1/colony/colonies/${id}/onboarding`);
    } catch {
      const stored = loadStoredColonies();
      const col = stored.find((c) => c.id === id);
      return col?.onboarding || { enabled: false };
    }
  },

  async updateColonyOnboarding(id: string, onboarding: ColonyOnboarding): Promise<ColonyOnboarding> {
    try {
      const res = await api.put<{ success: boolean; onboarding: ColonyOnboarding }>(
        `/v1/colony/colonies/${id}/onboarding`,
        onboarding
      );
      if (res && res.onboarding) return res.onboarding;
    } catch {}
    const stored = loadStoredColonies();
    const updated = stored.map((c) => (c.id === id ? { ...c, onboarding } : c));
    saveStoredColonies(updated);
    this.recordAudit(id, 'ONBOARDING_UPDATED', 'Admin', id, onboarding);
    return onboarding;
  },

  async completeColonyOnboarding(
    id: string,
    payload?: { answers?: Record<string, string>; agreedRules?: boolean; userId?: string; userName?: string }
  ): Promise<{ success: boolean }> {
    try {
      return await api.post<{ success: boolean }>(`/v1/colony/colonies/${id}/onboarding/complete`, payload || {});
    } catch {
      return { success: true };
    }
  },

  boostHub(id: string) { return this.boostColony(id); },
  createHub(payload: any) { return this.createColony(payload); },
  deleteHub(id: string) { return this.deleteColony(id); },
};

export const colonyApi = coloniesApi;


