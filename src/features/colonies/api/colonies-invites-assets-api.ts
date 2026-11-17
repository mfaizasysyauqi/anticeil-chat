import { api } from '@/lib/api';
import type { ServerInvitation, ColonyInvitation, ColonySound } from '@/lib/colony';
import type { Colony } from '@/chat/chat-types';
import type { DiscordEmoji, DiscordSticker } from '@/chat/anticeil-media-data';

export const coloniesInvitesAssetsApi = {
  // ── Server Invitations (Fullstack Database) ──────────────────────────
  async getServerInvitations(): Promise<ServerInvitation[]> {
    try {
      const res = await api.get<any>('/v1/colony/server-invitations');
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

  // ── Server Soundboard (DB) ──────────────────────────────────────────────
  async getServerSounds(colonyId: string): Promise<ColonySound[]> {
    try {
      const res = await api.get<any[]>(`/v1/colony/colonies/${colonyId}/sounds`);
      if (Array.isArray(res) && res.length > 0) {
        return res.map((r) => ({
          id: r.id,
          name: r.name,
          emoji: r.emoji || '🔊',
          volume: Number(r.volume || 1.0),
          url: r.url || r.soundUrl,
          soundType: r.soundType,
        }));
      }
    } catch {}
    return [];
  },

  async addServerSound(
    colonyId: string,
    payload: { name: string; emoji?: string; url?: string; soundType?: string; volume?: number },
  ): Promise<ColonySound | null> {
    try {
      const res = await api.post<any>(`/v1/colony/colonies/${colonyId}/sounds`, payload);
      if (res?.id) {
        return {
          id: res.id,
          name: res.name,
          emoji: res.emoji || '🔊',
          volume: Number(res.volume || 1.0),
          url: res.url || res.soundUrl,
          soundType: res.soundType,
        };
      }
    } catch {}
    return null;
  },

  async deleteServerSound(colonyId: string, soundId: string): Promise<void> {
    try {
      await api.delete(`/v1/colony/colonies/${colonyId}/sounds/${soundId}`);
    } catch {}
  },

  async playServerSound(
    colonyId: string,
    soundId: string,
    payload?: { channelId?: string; name?: string; emoji?: string; url?: string; soundType?: string; volume?: number },
  ): Promise<void> {
    try {
      await api.post(`/v1/colony/colonies/${colonyId}/sounds/${soundId}/play`, payload || {});
    } catch {}
  },
};
