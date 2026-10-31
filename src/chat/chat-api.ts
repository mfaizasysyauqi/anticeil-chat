import { api } from '@/lib/api';
import type { ServerInvitation, ColonyInvitation } from '@/lib/colony';
import {
  loadStoredChannels,
  saveStoredChannels,
  loadStoredColonies,
  saveStoredColonies,
  loadStoredMessages,
  saveStoredMessages,
  loadStoredInvites,
  saveStoredInvites,
  loadStoredBans,
  saveStoredBans,
  loadStoredRoles,
  saveStoredRoles,
  loadStoredAuditLog,
  saveStoredAuditLog,
  DEFAULT_COLONIES,
} from './chat-defaults';
import {
  ColonyChannel,
  ColonyChannelType,
  ColonyMember,
  ColonyMessage,
  Colony,
  CommunityAuditEntry,
  CommunityInvite,
  ColonyBan,
  CommunityCustomRole,
  ColonyStats,
  ColonyRole,
  ColonyChannelNotification,
  ColonyThread,
  resolveChannelType,
} from './chat-types';
import { DiscordEmoji, DiscordSticker, DiscordGifItem } from './anticeil-media-data';

export const chatApi = {
  // ── Channels ──────────────────────────────────────────────────────────
  async getChannels(colonyId?: string): Promise<ColonyChannel[]> {
    try {
      const res = await api.get<ColonyChannel[]>('/v1/colony/channels', {
        params: colonyId ? { colonyId } : undefined,
      });
      if (Array.isArray(res)) {
        const normalized = res.map((c) => ({
          ...c,
          type: resolveChannelType(c),
        }));
        const stored = loadStoredChannels();
        if (colonyId) {
          const others = stored.filter((c) => (c.colonyId || 'anticeil') !== colonyId);
          saveStoredChannels([...others, ...normalized]);
        } else {
          const existingDms = stored.filter((c) => c.category === 'DIRECT MESSAGES' || c.isDirectMessage);
          saveStoredChannels([...existingDms, ...normalized]);
        }
        return normalized;
      }
    } catch {}
    const stored = loadStoredChannels().map((c) => ({
      ...c,
      type: resolveChannelType(c),
    }));
    return colonyId ? stored.filter((c) => (c.colonyId || 'anticeil') === colonyId) : stored;
  },

  async createChannel(payload: {
    name: string;
    description: string;
    category: 'CHANNELS' | 'DIRECT MESSAGES';
    colonyId?: string;
    type?: ColonyChannelType;
    isPrivate?: boolean;
  }): Promise<ColonyChannel> {
    try {
      const res = await api.post<ColonyChannel>('/v1/colony/channels', payload);
      if (res && res.id) {
        const stored = loadStoredChannels();
        const updated = [...stored.filter((c) => c.id !== res.id), res];
        saveStoredChannels(updated);
        return res;
      }
    } catch {}
    const newChannel: ColonyChannel = {
      id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      colonyId: payload.colonyId || 'anticeil',
      type: payload.type || 'text',
      isPrivate: payload.isPrivate || false,
    };
    const stored = loadStoredChannels();
    const updated = [...stored.filter((c) => c.id !== newChannel.id), newChannel];
    saveStoredChannels(updated);
    return newChannel;
  },

  async updateChannel(
    id: string,
    payload: Partial<ColonyChannel>,
  ): Promise<ColonyChannel> {
    try {
      const res = await api.put<ColonyChannel>(`/v1/colony/channels/${id}`, payload);
      if (res && res.id) {
        const stored = loadStoredChannels();
        saveStoredChannels(stored.map((c) => (c.id === id ? res : c)));
        return res;
      }
    } catch {}
    const stored = loadStoredChannels();
    let target = stored.find((c) => c.id === id);
    if (target) {
      target = { ...target, ...payload };
      saveStoredChannels(stored.map((c) => (c.id === id ? target! : c)));
      return target;
    }
    const fallback: ColonyChannel = {
      id,
      name: payload.name || 'Channel',
      description: payload.description || '',
      category: 'CHANNELS',
      colonyId: 'anticeil',
    };
    saveStoredChannels([...stored, fallback]);
    return fallback;
  },

  async deleteChannel(id: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/channels/${id}`);
    } catch {}
    const stored = loadStoredChannels();
    saveStoredChannels(stored.filter((c) => c.id !== id));
    return { success: true, id };
  },

  async markChannelRead(channelId: string, userId: string): Promise<void> {
    try {
      await api.post(`/v1/colony/channels/${channelId}/read`, { userId });
    } catch {}
  },

  // ── Messages ──────────────────────────────────────────────────────────
  async getMessages(channelId: string): Promise<ColonyMessage[]> {
    try {
      if (channelId.startsWith('dm-')) {
        const parts = channelId.slice(3).split('-').filter(Boolean);
        const reqs = [api.get<ColonyMessage[]>(`/v1/colony/channels/${channelId}/messages`)];
        if (parts.length === 2) {
          reqs.push(
            api.get<ColonyMessage[]>(`/v1/colony/channels/dm-${parts[0]}/messages`).catch(() => []),
            api.get<ColonyMessage[]>(`/v1/colony/channels/dm-${parts[1]}/messages`).catch(() => []),
          );
        }
        const results = await Promise.all(reqs.map((p) => p.catch(() => [])));
        const allMsgs: ColonyMessage[] = [];
        const seen = new Set<string>();
        results.forEach((res) => {
          if (Array.isArray(res)) {
            res.forEach((m) => {
              if (m && m.id && !seen.has(m.id)) {
                seen.add(m.id);
                allMsgs.push(m);
              }
            });
          }
        });
        allMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const stored = loadStoredMessages();
        stored[channelId] = allMsgs;
        saveStoredMessages(stored);
        return allMsgs;
      }

      const res = await api.get<ColonyMessage[]>(`/v1/colony/channels/${channelId}/messages`);
      if (Array.isArray(res)) {
        const stored = loadStoredMessages();
        stored[channelId] = res;
        saveStoredMessages(stored);
        return res;
      }
    } catch {}
    const stored = loadStoredMessages();
    return stored[channelId] || [];
  },

  async sendMessage(
    channelId: string,
    payload: Partial<ColonyMessage>,
  ): Promise<ColonyMessage> {
    const fallbackMsg: ColonyMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      senderId: payload.senderId || 'me',
      senderName: payload.senderName || 'Anonymous',
      senderEmail: payload.senderEmail || '',
      senderAvatar: payload.senderAvatar ?? null,
      senderRole: (payload.senderRole as any) || 'member',
      content: payload.content || '',
      attachments: payload.attachments,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post<ColonyMessage>(`/v1/colony/channels/${channelId}/messages`, {
        ...payload,
        channelId,
      });
      if (res && res.id) {
        const stored = loadStoredMessages();
        stored[channelId] = [...(stored[channelId] || []).filter((m) => m.id !== res.id), res];
        saveStoredMessages(stored);
        return res;
      }
    } catch {}

    const stored = loadStoredMessages();
    stored[channelId] = [...(stored[channelId] || []), fallbackMsg];
    saveStoredMessages(stored);
    return fallbackMsg;
  },

  async deleteMessage(messageId: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/messages/${messageId}`);
    } catch {}
    const stored = loadStoredMessages();
    for (const chId in stored) {
      stored[chId] = stored[chId].filter((m) => m.id !== messageId);
    }
    saveStoredMessages(stored);
    return { success: true, id: messageId };
  },

  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<{ id: string; channelId?: string; reactions: Record<string, string[]> }> {
    try {
      const res = await api.post<{ id: string; channelId?: string; reactions: Record<string, string[]> }>(
        `/v1/colony/messages/${messageId}/reactions`,
        { emoji, userId }
      );
      if (res && res.reactions) {
        return res;
      }
    } catch {}
    const stored = loadStoredMessages();
    let targetMsg: ColonyMessage | null = null;
    for (const chId in stored) {
      const msg = stored[chId].find((m) => m.id === messageId);
      if (msg) {
        targetMsg = msg;
        const currentReactions = msg.reactions || {};
        const users = currentReactions[emoji] || [];
        if (users.includes(userId)) {
          currentReactions[emoji] = users.filter((u) => u !== userId);
          if (currentReactions[emoji].length === 0) {
            delete currentReactions[emoji];
          }
        } else {
          currentReactions[emoji] = [...users, userId];
        }
        msg.reactions = currentReactions;
        break;
      }
    }
    saveStoredMessages(stored);
    return {
      id: messageId,
      channelId: targetMsg?.channelId,
      reactions: targetMsg?.reactions || {},
    };
  },

  // ── Members & Friends (Fetches real workspace users from /v1/colony/members with /v1/users fallback) ──
  async getMembers(projectId?: string, colonyId?: string): Promise<ColonyMember[]> {
    try {
      // 1. Try community members endpoint (always available for workspace/community users)
      const commRes = await api.get<any>('/v1/colony/members');
      const commList = Array.isArray(commRes) ? commRes : commRes?.data || commRes?.members;
      if (Array.isArray(commList) && commList.length > 0) {
        return commList.map((u: any) => {
          const firstName = u.firstName || '';
          const lastName = u.lastName || '';
          const fullName =
            u.name ||
            `${firstName} ${lastName}`.trim() ||
            u.email?.split('@')[0] ||
            'Pengguna Anticeil';
          return {
            id: u.id,
            name: fullName,
            email: u.email || '',
            avatar: u.avatar || u.imageUrl || null,
            username:
              u.username ||
              u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
              null,
            role:
              (u.platformRole === 'OWNER' ||
              u.platformRole === 'ADMIN' ||
              u.role === 'platform_admin'
                ? 'admin'
                : 'member') as any,
            status: (u.status || 'online') as any,
          };
        });
      }
    } catch {
      // Fallback to /v1/users
    }

    try {
      const res = await api.get<any>('/v1/users', {
        params: { limit: 100 },
      });
      const usersList = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(usersList) && usersList.length > 0) {
        return usersList.map((u: any) => {
          const firstName = u.firstName || '';
          const lastName = u.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || u.email?.split('@')[0] || 'Pengguna Anticeil';
          return {
            id: u.id,
            name: fullName,
            email: u.email || '',
            avatar: u.imageUrl || u.avatar || null,
            username: u.username || u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || null,
            role: (u.platformRole === 'OWNER' || u.platformRole === 'ADMIN' ? 'admin' : 'member') as any,
            status: 'online' as const,
          };
        });
      }
    } catch {
      // Graceful fallback if unauthenticated or forbidden
    }
    return [];
  },

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

  async createHub(payload: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    iconUrl?: string;
  }): Promise<Colony> {
    const newId = `hub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newHub: Colony = {
      id: newId,
      name: payload.name,
      iconType: payload.iconUrl ? (undefined as any) : ('code' as any),
      iconUrl: payload.iconUrl,
      initials: payload.name.slice(0, 2).toUpperCase() || 'SV',
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
        tags: newHub.tags,
        emojis: newHub.emojis,
      });
      if (res && res.id) {
        const stored = loadStoredColonies();
        const updated = [...stored.filter((h) => h.id !== res.id), res];
        saveStoredColonies(updated);
        this.recordAudit(res.id, 'HUB_CREATED', 'Admin', res.name);
        return res;
      }
    } catch {}

    const stored = loadStoredColonies();
    const updated = [...stored.filter((h) => h.id !== newId), newHub];
    saveStoredColonies(updated);
    this.recordAudit(newId, 'HUB_CREATED', 'Admin', newHub.name);
    return newHub;
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

  async deleteHub(id: string): Promise<{ success: boolean; id: string }> {
    try {
      await api.delete(`/v1/colony/colonies/${id}`);
    } catch {}
    const stored = loadStoredColonies();
    saveStoredColonies(stored.filter((h) => h.id !== id));
    this.recordAudit(id, 'HUB_DELETED', 'Admin', id);
    return { success: true, id };
  },

  async boostHub(id: string): Promise<{ success: boolean; boostsCount: number; boostTier: number }> {
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
  async getRoles(colonyId: string): Promise<CommunityCustomRole[]> {
    try {
      const res = await api.get<CommunityCustomRole[]>(`/v1/colony/colonies/${colonyId}/roles`);
      if (Array.isArray(res) && res.length > 0) {
        saveStoredRoles(colonyId, res);
        return res;
      }
    } catch {}
    const stored = loadStoredRoles(colonyId);
    if (stored.length > 0) return stored;
    return [];
  },

  async createRole(colonyId: string, payload: { name: string; color: string; permissions?: string[] }): Promise<CommunityCustomRole> {
    const newRole: CommunityCustomRole = {
      id: `role_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      colonyId,
      name: payload.name,
      color: payload.color || '#6366f1',
      permissions: payload.permissions || ['SEND_MESSAGES'],
    };
    try {
      const res = await api.post<CommunityCustomRole>(`/v1/colony/colonies/${colonyId}/roles`, newRole);
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
  async getInvites(colonyId: string): Promise<CommunityInvite[]> {
    try {
      const res = await api.get<CommunityInvite[]>(`/v1/colony/colonies/${colonyId}/invites`);
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
  ): Promise<CommunityInvite> {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const newInvite: CommunityInvite = {
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
      const res = await api.post<CommunityInvite>(`/v1/colony/colonies/${colonyId}/invites`, newInvite);
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
  async getAuditLog(colonyId: string): Promise<CommunityAuditEntry[]> {
    try {
      const res = await api.get<CommunityAuditEntry[]>(`/v1/colony/colonies/${colonyId}/audit-log`);
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
    const entry: CommunityAuditEntry = {
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
    const newHub: Colony = {
      id: cleanId,
      name: `Server Komunitas`,
      iconType: 'code' as any,
      initials: 'SK',
      description: 'Bergabung melalui link undangan',
      inviteCode,
      membersCount: 2,
      color: 'bg-emerald-600',
      role: 'member',
    };
    saveStoredColonies([...stored, newHub]);
    return newHub;
  },

  async inviteMemberByUsername(
    colonyId: string,
    username: string,
  ): Promise<{ found: boolean; alreadyMember?: boolean; user?: ColonyMember }> {
    const members = await messagesApi.getMembers();
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

  // ── Server Invitations (Fullstack Database) ──────────────────────────
  async getServerInvitations(): Promise<ServerInvitation[]> {
    try {
      const res = await api.get<any>('/v1/colony/server-invitations');
      // Backend may return array directly or wrapped: { data: [] } or { invitations: [] }
      const raw: any[] = Array.isArray(res) ? res : (res?.data ?? res?.invitations ?? []);
      return raw.map((r: any) => {
        const hub = r.hub || r.server || {};
        const inviter = r.inviter || r.sender || r.from || {};
        return {
          id: r.id,
          serverId: r.serverId || r.colonyId || hub.id || r.id,
          serverName: r.serverName || r.hubName || hub.name || 'Server',
          serverDescription: r.serverDescription || hub.description || undefined,
          serverIconUrl: r.serverIconUrl || hub.iconUrl || undefined,
          inviterName:
            r.inviterName ||
            r.senderName ||
            inviter.name ||
            inviter.displayName ||
            [inviter.firstName, inviter.lastName].filter(Boolean).join(' ').trim() ||
            'Pengguna Anticeil',
          inviterUsername:
            r.inviterUsername || r.senderUsername || inviter.username || undefined,
          inviterAvatar:
            r.inviterAvatar || r.senderAvatar || inviter.imageUrl || inviter.avatar || undefined,
          createdAt: r.createdAt,
          membersCount: r.membersCount || hub.membersCount || undefined,
        } as ColonyInvitation;
      });
    } catch (e) {
      console.warn('Failed to fetch server invitations from API', e);
      return [];
    }
  },

  async inviteUserToServer(
    colonyId: string,
    targetUserId?: string,
    targetUsername?: string,
  ): Promise<{ success: boolean; alreadyMember?: boolean; alreadyInvited?: boolean; message?: string; user?: any }> {
    try {
      return await api.post(`/v1/colony/colonies/${colonyId}/invite-user`, {
        targetUserId,
        targetUsername,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal mengirim undangan server';
      return { success: false, message: msg };
    }
  },

  async acceptServerInvitation(invitationId: string): Promise<{ success: boolean; hub?: Colony }> {
    return api.post(`/v1/colony/server-invitations/${invitationId}/accept`);
  },

  async rejectServerInvitation(invitationId: string): Promise<{ success: boolean }> {
    return api.post(`/v1/colony/server-invitations/${invitationId}/reject`);
  },

  // ── Pinned Messages ───────────────────────────────────────────────────
  async getPinnedMessages(channelId: string): Promise<ColonyMessage[]> {
    try {
      const res = await api.get<ColonyMessage[]>(`/v1/colony/channels/${channelId}/pins`);
      if (Array.isArray(res)) return res;
    } catch {}
    const stored = loadStoredMessages();
    const list = stored[channelId] || [];
    return list.filter((m) => m.isPinned);
  },

  async togglePinMessage(
    messageId: string,
    channelId: string,
    userName?: string,
  ): Promise<ColonyMessage> {
    try {
      const res = await api.post<ColonyMessage>(`/v1/colony/messages/${messageId}/pin`, {
        userName,
      });
      if (res && res.id) {
        // sync to local stored messages
        const stored = loadStoredMessages();
        const list = stored[channelId] || [];
        stored[channelId] = list.map((m) => (m.id === messageId ? { ...m, ...res } : m));
        saveStoredMessages(stored);
        return res;
      }
    } catch {}

    // Fallback sync
    const stored = loadStoredMessages();
    const list = stored[channelId] || [];
    let updatedMsg: ColonyMessage | null = null;
    stored[channelId] = list.map((m) => {
      if (m.id === messageId) {
        const nextPinned = !m.isPinned;
        updatedMsg = {
          ...m,
          isPinned: nextPinned,
          pinnedAt: nextPinned ? new Date().toISOString() : null,
          pinnedBy: nextPinned ? (userName || 'You') : null,
        };
        return updatedMsg;
      }
      return m;
    });
    saveStoredMessages(stored);
    return updatedMsg || ({ id: messageId } as ColonyMessage);
  },

  // ── Channel Notifications ─────────────────────────────────────────────
  async getChannelNotification(channelId: string): Promise<ColonyChannelNotification> {
    try {
      const res = await api.get<ColonyChannelNotification>(`/v1/colony/channels/${channelId}/notifications`);
      if (res && res.channelId) return res;
    } catch {}
    const saved = localStorage.getItem(`anticeil_notif_${channelId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      channelId,
      userId: 'me',
      level: 'default',
      isMuted: false,
      mutedUntil: null,
    };
  },

  async updateChannelNotification(
    channelId: string,
    payload: Partial<ColonyChannelNotification>,
  ): Promise<ColonyChannelNotification> {
    try {
      const res = await api.put<ColonyChannelNotification>(`/v1/colony/channels/${channelId}/notifications`, payload);
      if (res && res.channelId) {
        localStorage.setItem(`anticeil_notif_${channelId}`, JSON.stringify(res));
        return res;
      }
    } catch {}

    const current = await this.getChannelNotification(channelId);
    const updated: ColonyChannelNotification = {
      ...current,
      ...payload,
    };
    localStorage.setItem(`anticeil_notif_${channelId}`, JSON.stringify(updated));
    return updated;
  },

  // ── Threads ───────────────────────────────────────────────────────────
  async getThreads(channelId: string, search?: string): Promise<ColonyThread[]> {
    try {
      const res = await api.get<ColonyThread[]>(`/v1/colony/channels/${channelId}/threads`, {
        params: search ? { search } : undefined,
      });
      if (Array.isArray(res)) {
        localStorage.setItem(`anticeil_threads_${channelId}`, JSON.stringify(res));
        return res;
      }
    } catch {}

    const saved = localStorage.getItem(`anticeil_threads_${channelId}`);
    if (saved) {
      try {
        const list: ColonyThread[] = JSON.parse(saved);
        if (search) {
          return list.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
        }
        return list;
      } catch {}
    }
    return [];
  },

  async createThread(
    channelId: string,
    payload: {
      name: string;
      creatorName?: string;
      creatorAvatar?: string | null;
      initialMessage?: string;
    },
  ): Promise<ColonyThread> {
    const fallbackThread: ColonyThread = {
      id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      name: payload.name.trim(),
      creatorId: 'me',
      creatorName: payload.creatorName || 'You',
      creatorAvatar: payload.creatorAvatar ?? null,
      messageCount: payload.initialMessage ? 1 : 0,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post<ColonyThread>(`/v1/colony/channels/${channelId}/threads`, payload);
      if (res && res.id) {
        const current = await this.getThreads(channelId);
        localStorage.setItem(`anticeil_threads_${channelId}`, JSON.stringify([res, ...current]));
        return res;
      }
    } catch {}

    const current = await this.getThreads(channelId);
    localStorage.setItem(`anticeil_threads_${channelId}`, JSON.stringify([fallbackThread, ...current]));
    return fallbackThread;
  },

  async getThreadMessages(threadId: string): Promise<ColonyMessage[]> {
    try {
      const res = await api.get<ColonyMessage[]>(`/v1/colony/threads/${threadId}/messages`);
      if (Array.isArray(res)) return res;
    } catch {}

    const saved = localStorage.getItem(`anticeil_thread_msgs_${threadId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  },

  async sendThreadMessage(
    threadId: string,
    payloadOrChannelId: string | Partial<ColonyMessage>,
    maybePayload?: Partial<ColonyMessage>,
  ): Promise<ColonyMessage> {
    const payload = typeof payloadOrChannelId === 'string' ? (maybePayload || {}) : payloadOrChannelId;
    const channelId = typeof payloadOrChannelId === 'string' ? payloadOrChannelId : (payload.channelId || '');
    const fallbackMsg: ColonyMessage = {
      id: `msg_th_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      threadId,
      senderId: payload.senderId || 'me',
      senderName: payload.senderName || 'You',
      senderEmail: payload.senderEmail || '',
      senderAvatar: payload.senderAvatar ?? null,
      senderRole: (payload.senderRole as any) || 'member',
      content: payload.content || '',
      attachments: payload.attachments,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post<ColonyMessage>(`/v1/colony/threads/${threadId}/messages`, {
        channelId,
        content: payload.content,
        senderName: payload.senderName,
        senderAvatar: payload.senderAvatar,
        senderRole: payload.senderRole,
        attachments: payload.attachments,
      });
      if (res && res.id) {
        const current = await this.getThreadMessages(threadId);
        localStorage.setItem(`anticeil_thread_msgs_${threadId}`, JSON.stringify([...current, res]));
        return res;
      }
    } catch {}

    const current = await this.getThreadMessages(threadId);
    localStorage.setItem(`anticeil_thread_msgs_${threadId}`, JSON.stringify([...current, fallbackMsg]));
    return fallbackMsg;
  },

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

  // ── Server Emojis (DB — no dummy data) ──────────────────────────────────
  async getServerEmojis(colonyId: string): Promise<DiscordEmoji[]> {
    try {
      const res = await api.get<any[]>(`/v1/colony/colonies/${colonyId}/emojis`);
      if (Array.isArray(res)) {
        return res.map((r) => ({
          id: r.id, name: r.name, code: r.code, url: r.url,
          server: colonyId, category: colonyId,
        }));
      }
    } catch {}
    return [];
  },

  async addServerEmoji(colonyId: string, payload: { name: string; code: string; url: string }): Promise<DiscordEmoji | null> {
    try {
      const res = await api.post<any>(`/v1/colony/colonies/${colonyId}/emojis`, payload);
      if (res?.id) return { id: res.id, name: res.name, code: res.code, url: res.url, server: colonyId, category: colonyId };
    } catch {}
    return null;
  },

  async deleteServerEmoji(colonyId: string, emojiId: string): Promise<void> {
    try { await api.delete(`/v1/colony/colonies/${colonyId}/emojis/${emojiId}`); } catch {}
  },

  // ── Server Stickers (DB — no dummy data) ────────────────────────────────
  async getServerStickers(colonyId: string): Promise<DiscordSticker[]> {
    try {
      const res = await api.get<any[]>(`/v1/colony/colonies/${colonyId}/stickers`);
      if (Array.isArray(res)) {
        return res.map((r) => ({
          id: r.id, name: r.name, url: r.url,
          server: colonyId, tags: r.tags || [],
        }));
      }
    } catch {}
    return [];
  },

  async addServerSticker(colonyId: string, payload: { name: string; url: string; tags?: string[] }): Promise<DiscordSticker | null> {
    try {
      const res = await api.post<any>(`/v1/colony/colonies/${colonyId}/stickers`, payload);
      if (res?.id) return { id: res.id, name: res.name, url: res.url, server: colonyId, tags: res.tags || [] };
    } catch {}
    return null;
  },

  async deleteServerSticker(colonyId: string, stickerId: string): Promise<void> {
    try { await api.delete(`/v1/colony/colonies/${colonyId}/stickers/${stickerId}`); } catch {}
  },

  async claimGift(messageId: string, userName?: string): Promise<{ success: boolean }> {
    try {
      const res = await api.post<{ success: boolean }>(`/v1/colony/messages/${messageId}/claim-gift`, { userName });
      return res || { success: true };
    } catch {
      return { success: false };
    }
  },

  async searchGifs(query: string = '', limit: number = 20): Promise<DiscordGifItem[]> {
    try {
      const res = await api.get<DiscordGifItem[]>(`/v1/colony/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch {}
    return [];
  },
};

export const messagesApi = chatApi;
export const colonyApi = chatApi;

