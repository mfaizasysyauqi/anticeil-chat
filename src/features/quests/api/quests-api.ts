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
    status: 'in_progress',
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
    progress: 3,
  },
  {
    id: 'quest_wordle_party',
    title: 'Wordle Daily Streak',
    subtitle: 'Tebak kata harian bersama kawan di aktivitas Wordle Daily Party.',
    category: 'game',
    promoter: 'Anticeil Games',
    coverUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=800&auto=format&fit=crop&q=80',
    badge: 'Teka-Teki',
    rewardDew: 150,
    rewardIcon: '💧',
    target: 1,
    unit: 'kata',
    actionLabel: 'Tebak Kata',
    appId: 'wordle',
    endsAt: '2026-12-31T23:59:59Z',
    status: 'available',
    progress: 0,
  },
  {
    id: 'quest_trivia_clash',
    title: 'Cyber Trivia Battle Clash',
    subtitle: 'Jawab kuis sains dan teknologi di aktivitas Cyber Trivia Battle.',
    category: 'game',
    promoter: 'Anticeil Games',
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    badge: 'Populer',
    rewardDew: 200,
    rewardIcon: '💧',
    target: 3,
    unit: 'soal',
    actionLabel: 'Main Trivia',
    appId: 'trivia',
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
    status: 'completed',
    progress: 1,
  },
];

export const questsApi = {
  async getQuests(): Promise<QuestItem[]> {
    try {
      const res = await api.get<any>('/v1/community/quests');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}
    return FALLBACK_QUESTS;
  },

  async acceptQuest(questId: string): Promise<{ success: boolean; message: string; quest?: QuestItem }> {
    try {
      return await api.post('/v1/community/quests/accept', { questId });
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menerima quest' };
    }
  },

  async updateProgress(questId: string, amount: number = 1): Promise<{ success: boolean; message: string; quest?: QuestItem }> {
    try {
      return await api.post('/v1/community/quests/progress', { questId, amount });
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memperbarui progress quest' };
    }
  },

  async claimQuest(questId: string): Promise<{ success: boolean; message: string; rewardDew?: number; newBalance?: any; quest?: QuestItem }> {
    try {
      return await api.post('/v1/community/quests/claim', { questId });
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal mengklaim reward quest' };
    }
  },

  async getClaimedQuests(): Promise<QuestItem[]> {
    try {
      const res = await api.get<any>('/v1/community/quests/claimed');
      if (Array.isArray(res)) return res;
    } catch {}
    return [];
  },
};
