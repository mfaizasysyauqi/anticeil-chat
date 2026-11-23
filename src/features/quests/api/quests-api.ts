import { api } from '@/lib/api';

export interface QuestItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'activity' | 'game' | 'social' | 'profile';
  promoter: string;
  coverUrl: string;
  badge?: string;
  rewardDew: number;
  rewardIcon?: string;
  target: number;
  unit: string;
  actionLabel?: string;
  appId?: string;
  endsAt?: string;
  status: 'available' | 'in_progress' | 'completed' | 'claimed';
  progress: number;
  acceptedAt?: string | null;
  claimedAt?: string | null;
}

export const FALLBACK_QUESTS: QuestItem[] = [
  {
    id: 'quest_watch_together',
    title: 'YouTube Watch Party Explorer',
    subtitle: 'Tonton video YouTube bersama kawan di Voice Channel selama 10 menit.',
    category: 'activity',
    promoter: 'Anticeil Activities',
    coverUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
    badge: 'Unggulan',
    rewardDew: 300,
    rewardIcon: '💧',
    target: 10,
    unit: 'menit',
    actionLabel: 'Mulai Menonton',
    appId: 'youtube-watch',
    endsAt: '2026-12-31T23:59:59Z',
    status: 'available',
    progress: 0,
  },
  {
    id: 'quest_chess_master',
    title: 'Anticeil Chess PvP / AI Challenge',
    subtitle: 'Mainkan minimal 1 pertandingan catur multiplayer atau tantang Bot AI.',
    category: 'game',
    promoter: 'Anticeil Games',
    coverUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80',
    badge: 'Game Baru',
    rewardDew: 250,
    rewardIcon: '💧',
    target: 1,
    unit: 'ronde',
    actionLabel: 'Main Catur',
    appId: 'chess',
    endsAt: '2026-12-31T23:59:59Z',
    status: 'available',
    progress: 0,
  },
  {
    id: 'quest_active_chat',
    title: 'Active Community Messenger',
    subtitle: 'Kirimkan minimal 5 pesan di saluran teks Colony atau pesan langsung.',
    category: 'social',
    promoter: 'Anticeil Community',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    badge: 'Harian',
    rewardDew: 200,
    rewardIcon: '💧',
    target: 5,
    unit: 'pesan',
    actionLabel: 'Mulai Chat',
    appId: 'chat',
    endsAt: '2026-12-31T23:59:59Z',
    status: 'available',
    progress: 0,
  },
  {
    id: 'quest_jamspace_board',
    title: 'Jamspace Whiteboard Collab',
    subtitle: 'Buka kanvas Jamspace Whiteboard dan buat sketsa ide bersama teman saluran.',
    category: 'activity',
    promoter: 'Anticeil Studio',
    coverUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80',
    badge: 'Kreatif',
    rewardDew: 200,
    rewardIcon: '💧',
    target: 1,
    unit: 'sesi',
    actionLabel: 'Buka Kanvas',
    appId: 'whiteboard',
    endsAt: '2026-12-31T23:59:59Z',
    status: 'available',
    progress: 0,
  },
  {
    id: 'quest_profile_styler',
    title: 'Profil Estetik Eksklusif',
    subtitle: 'Pasang bingkai avatar animasi atau efek profil di pengaturan akun Anda.',
    category: 'profile',
    promoter: 'Anticeil Studio',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    badge: 'Estetik',
    rewardDew: 100,
    rewardIcon: '💧',
    target: 1,
    unit: 'profil',
    actionLabel: 'Buka Profil',
    appId: 'profile',
    endsAt: '2026-12-31T23:59:59Z',
    status: 'available',
    progress: 0,
  },
];

function getDeletedQuestIds(): string[] {
  try {
    const raw = localStorage.getItem('anticeil_deleted_quest_ids');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function addDeletedQuestId(id: string) {
  const ids = getDeletedQuestIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem('anticeil_deleted_quest_ids', JSON.stringify(ids));
  }
}

function removeDeletedQuestId(id: string) {
  const ids = getDeletedQuestIds();
  if (ids.includes(id)) {
    localStorage.setItem('anticeil_deleted_quest_ids', JSON.stringify(ids.filter((x) => x !== id)));
  }
}

export const questsApi = {
  async getQuests(): Promise<QuestItem[]> {
    const deletedIds = getDeletedQuestIds();
    try {
      const res = await api.get<any>('/v1/community/quests');
      if (Array.isArray(res)) {
        const clean = res.filter((q: QuestItem) => !deletedIds.includes(q.id));
        localStorage.setItem('anticeil_community_quests', JSON.stringify(clean));
        return clean;
      }
    } catch {}

    const stored = localStorage.getItem('anticeil_community_quests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((q: QuestItem) => !deletedIds.includes(q.id));
        }
      } catch {}
    }

    const fallback = FALLBACK_QUESTS.filter((q) => !deletedIds.includes(q.id));
    return fallback;
  },

  async createQuest(data: Partial<QuestItem>): Promise<{ success: boolean; message: string; quest?: QuestItem }> {
    const newQuestId = data.id || `quest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    removeDeletedQuestId(newQuestId);

    const payload = { ...data, id: newQuestId };

    try {
      const res = await api.post('/v1/community/quests', payload);
      if (res?.success && res.quest) {
        const current = await this.getQuests();
        const updated = [res.quest, ...current.filter((q) => q.id !== res.quest!.id)];
        localStorage.setItem('anticeil_community_quests', JSON.stringify(updated));
        return res;
      }
    } catch {}

    // Fallback if offline
    const current = await this.getQuests();
    const newQuest: QuestItem = {
      id: newQuestId,
      title: data.title || 'Quest Baru',
      subtitle: data.subtitle || '',
      category: data.category || 'activity',
      promoter: data.promoter || 'Komunitas Anticeil',
      coverUrl: data.coverUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
      badge: data.badge || 'Baru',
      rewardDew: Number(data.rewardDew) || 100,
      rewardIcon: '💧',
      target: Number(data.target) || 1,
      unit: data.unit || 'kali',
      actionLabel: data.actionLabel || 'Mulai',
      appId: data.appId || '',
      endsAt: data.endsAt || '2026-12-31T23:59:59Z',
      status: 'available',
      progress: 0,
    };
    const updated = [newQuest, ...current.filter((q) => q.id !== newQuest.id)];
    localStorage.setItem('anticeil_community_quests', JSON.stringify(updated));
    return { success: true, message: 'Quest berhasil ditambahkan', quest: newQuest };
  },

  async updateQuest(questId: string, data: Partial<QuestItem>): Promise<{ success: boolean; message: string; quest?: QuestItem }> {
    try {
      const res = await api.put(`/v1/community/quests/${questId}`, data);
      if (res?.success && res.quest) {
        const current = await this.getQuests();
        const updated = current.map((q) => (q.id === questId ? res.quest! : q));
        localStorage.setItem('anticeil_community_quests', JSON.stringify(updated));
        return res;
      }
    } catch {}

    const current = await this.getQuests();
    const updated = current.map((q) => (q.id === questId ? { ...q, ...data } : q));
    localStorage.setItem('anticeil_community_quests', JSON.stringify(updated));
    const target = updated.find((q) => q.id === questId);
    return { success: true, message: 'Quest berhasil diperbarui', quest: target };
  },

  async deleteQuest(questId: string): Promise<{ success: boolean; message: string }> {
    addDeletedQuestId(questId);

    // Immediately remove from localStorage cache
    const stored = localStorage.getItem('anticeil_community_quests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((q: QuestItem) => q.id !== questId);
          localStorage.setItem('anticeil_community_quests', JSON.stringify(filtered));
        }
      } catch {}
    }

    try {
      const res = await api.delete(`/v1/community/quests/${questId}`);
      if (res?.success) return res;
    } catch {}

    return { success: true, message: 'Quest berhasil dihapus' };
  },

  async acceptQuest(questId: string): Promise<{ success: boolean; message: string; quest?: QuestItem }> {
    try {
      const res = await api.post('/v1/community/quests/accept', { questId });
      if (res?.success) return res;
    } catch {}
    const current = await this.getQuests();
    const updated = current.map((q) => (q.id === questId ? { ...q, status: 'in_progress' as const } : q));
    localStorage.setItem('anticeil_community_quests', JSON.stringify(updated));
    const target = updated.find((q) => q.id === questId);
    return { success: true, message: 'Quest diterima!', quest: target };
  },

  async updateProgress(questId: string, amount: number = 1): Promise<{ success: boolean; message: string; quest?: QuestItem }> {
    try {
      const res = await api.post('/v1/community/quests/progress', { questId, amount });
      if (res?.success) return res;
    } catch {}
    const current = await this.getQuests();
    const updated = current.map((q) => {
      if (q.id !== questId) return q;
      const newProg = Math.min((q.progress || 0) + amount, q.target || 1);
      const isCompleted = newProg >= (q.target || 1);
      return { ...q, progress: newProg, status: isCompleted ? ('completed' as const) : ('in_progress' as const) };
    });
    localStorage.setItem('anticeil_community_quests', JSON.stringify(updated));
    const target = updated.find((q) => q.id === questId);
    return { success: true, message: 'Progress quest diperbarui', quest: target };
  },

  async claimQuest(questId: string): Promise<{ success: boolean; message: string; rewardDew?: number; newBalance?: any; quest?: QuestItem }> {
    try {
      const res = await api.post('/v1/community/quests/claim', { questId });
      if (res?.success) return res;
    } catch {}
    const current = await this.getQuests();
    const quest = current.find((q) => q.id === questId);
    const updated = current.map((q) => (q.id === questId ? { ...q, status: 'claimed' as const } : q));
    localStorage.setItem('anticeil_community_quests', JSON.stringify(updated));
    if (quest) {
      const claimed = await this.getClaimedQuests();
      localStorage.setItem('anticeil_claimed_quests', JSON.stringify([...claimed.filter((c) => c.id !== questId), quest]));
    }
    return { success: true, message: 'Hadiah quest berhasil diklaim!', rewardDew: quest?.rewardDew || 100 };
  },

  async getClaimedQuests(): Promise<QuestItem[]> {
    try {
      const res = await api.get<any>('/v1/community/quests/claimed');
      if (Array.isArray(res)) return res;
    } catch {}
    const stored = localStorage.getItem('anticeil_claimed_quests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  },
};
