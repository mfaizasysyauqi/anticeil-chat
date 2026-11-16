import { api } from '@/lib/api';

export interface RegisteredGame {
  id: string;
  name: string;
  verified: boolean;
  lastPlayed: string;
  enabled: boolean;
  icon?: string;
}

export interface UserConnectionItem {
  id: string;
  platformId: string;
  accountName: string;
  platformName: string;
  icon: string;
  displayOnProfile: boolean;
  displayStatus: boolean;
}

export interface AuthorizedAppDetail {
  id: string;
  name: string;
  authorizedDate: string;
  icon: string;
  permissionsCount: number;
  permissionsList: string[];
  aboutInfo: string;
  policiesUrl: string;
}

const GAMES_STORAGE_KEY = 'anticeil_registered_games';
const CONNS_STORAGE_KEY = 'anticeil_user_connections';
const APPS_STORAGE_KEY = 'anticeil_authorized_apps';

const DEFAULT_GAMES: RegisteredGame[] = [
  {
    id: 'terraria',
    name: 'Terraria',
    verified: true,
    lastPlayed: '2 days ago',
    enabled: true,
    icon: '🌳',
  },
];

const DEFAULT_CONNECTIONS: UserConnectionItem[] = [
  {
    id: 'conn-spotify',
    platformId: 'spotify',
    accountName: 'ESTEFANO',
    platformName: 'Spotify',
    icon: '🟢',
    displayOnProfile: true,
    displayStatus: true,
  },
];

const DEFAULT_APPS: AuthorizedAppDetail[] = [
  {
    id: 'app-nve',
    name: 'Neverness to Everness',
    authorizedDate: '11/1/2026',
    icon: '🌸',
    permissionsCount: 4,
    permissionsList: [
      'Akses info profil publik',
      'Lihat aktivitas bermain game',
      'Kirim status pencapaian game',
      'Sinkronisasi teman dalam game',
    ],
    aboutInfo: 'Game RPG open-world anime futuristik resmi terintegrasi dengan Anticeil.',
    policiesUrl: 'https://anticeil.com/privacy',
  },
];

export const gamesAppsApi = {
  // Games
  getRegisteredGames: async (): Promise<RegisteredGame[]> => {
    try {
      const data = await api.get<RegisteredGame[]>('/v1/community/games');
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(GAMES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}

    return DEFAULT_GAMES;
  },

  addGame: async (name: string, icon = '🎮', verified = false): Promise<RegisteredGame> => {
    const newGame: RegisteredGame = {
      id: `game_${Date.now()}`,
      name,
      verified,
      lastPlayed: 'Baru saja',
      enabled: true,
      icon,
    };

    try {
      await api.post('/v1/community/games', newGame);
    } catch {}

    const current = await gamesAppsApi.getRegisteredGames();
    const updated = [newGame, ...current];
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(updated));
    return newGame;
  },

  toggleGameOverlay: async (id: string, enabled: boolean): Promise<void> => {
    try {
      await api.put(`/v1/community/games/${id}`, { enabled });
    } catch {}

    const current = await gamesAppsApi.getRegisteredGames();
    const updated = current.map((g) => (g.id === id ? { ...g, enabled } : g));
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(updated));
  },

  removeGame: async (id: string): Promise<void> => {
    try {
      await api.delete(`/v1/community/games/${id}`);
    } catch {}

    const current = await gamesAppsApi.getRegisteredGames();
    const updated = current.filter((g) => g.id !== id);
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(updated));
  },

  // Connections
  getUserConnections: async (): Promise<UserConnectionItem[]> => {
    try {
      const data = await api.get<UserConnectionItem[]>('/v1/community/connections');
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(CONNS_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(CONNS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}

    return DEFAULT_CONNECTIONS;
  },

  addConnection: async (conn: Omit<UserConnectionItem, 'id'>): Promise<UserConnectionItem> => {
    const newConn: UserConnectionItem = {
      ...conn,
      id: `conn_${Date.now()}`,
    };

    try {
      await api.post('/v1/community/connections', newConn);
    } catch {}

    const current = await gamesAppsApi.getUserConnections();
    const updated = [newConn, ...current];
    localStorage.setItem(CONNS_STORAGE_KEY, JSON.stringify(updated));
    return newConn;
  },

  toggleConnectionField: async (
    id: string,
    field: 'displayOnProfile' | 'displayStatus',
    value: boolean
  ): Promise<void> => {
    try {
      await api.put(`/v1/community/connections/${id}`, { [field]: value });
    } catch {}

    const current = await gamesAppsApi.getUserConnections();
    const updated = current.map((c) => (c.id === id ? { ...c, [field]: value } : c));
    localStorage.setItem(CONNS_STORAGE_KEY, JSON.stringify(updated));
  },

  removeConnection: async (id: string): Promise<void> => {
    try {
      await api.delete(`/v1/community/connections/${id}`);
    } catch {}

    const current = await gamesAppsApi.getUserConnections();
    const updated = current.filter((c) => c.id !== id);
    localStorage.setItem(CONNS_STORAGE_KEY, JSON.stringify(updated));
  },

  // Authorized Apps
  getAuthorizedApps: async (): Promise<AuthorizedAppDetail[]> => {
    try {
      const data = await api.get<AuthorizedAppDetail[]>('/v1/community/apps');
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {}

    try {
      const stored = localStorage.getItem(APPS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}

    return DEFAULT_APPS;
  },

  deauthorizeApp: async (id: string): Promise<void> => {
    try {
      await api.delete(`/v1/community/apps/${id}`);
    } catch {}

    const current = await gamesAppsApi.getAuthorizedApps();
    const updated = current.filter((a) => a.id !== id);
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(updated));
  },
};
