/**
 * Anticeil Discord-Parity Color Theme Tokens & System
 *
 * All themes are driven strictly via CSS variables injected into document.documentElement,
 * ensuring no hardcoded child colors and 100% theme reactivity across all views.
 */

export interface ColorThemeDefinition {
  id: string;
  name: string;
  tier: 'free' | 'pollen' | 'nectar' | 'royal';
  gradient: string;
  badge?: string;
  isLimitedTime?: boolean;
  cssVars: Record<string, string>;
}

export const COLOR_THEME_LIST: ColorThemeDefinition[] = [
  // ==========================================
  // FREE TIER THEMES
  // ==========================================
  {
    id: 'default_dark',
    name: 'Anticeil Dark (AMOLED)',
    tier: 'free',
    gradient: 'linear-gradient(135deg, #000000 0%, #111214 100%)',
    cssVars: {
      '--background': '#000000',
      '--foreground': '#f4f4f5',
      '--card': '#09090b',
      '--card-foreground': '#f4f4f5',
      '--popover': '#000000',
      '--popover-foreground': '#f4f4f5',
      '--sidebar-background': '#000000',
      '--sidebar-foreground': '#f4f4f5',
      '--sidebar-border': 'rgba(255, 255, 255, 0.15)',
      '--sidebar-accent': '#121215',
      '--border': 'rgba(255, 255, 255, 0.18)',
      '--muted': '#121215',
      '--muted-foreground': '#a1a1aa',
      '--accent': '#18181b',
      '--accent-foreground': '#ffffff',
      '--secondary': '#18181b',
      '--secondary-foreground': '#f4f4f5',
      '--primary': '211 98% 48%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(2, 111, 228, 0.45)',
    },
  },
  {
    id: 'midnight_grey',
    name: 'Midnight Grey',
    tier: 'free',
    gradient: 'linear-gradient(135deg, #2b2d31 0%, #313338 100%)',
    cssVars: {
      '--background': '#313338',
      '--foreground': '#dbdee1',
      '--card': '#2b2d31',
      '--card-foreground': '#f2f3f5',
      '--popover': '#313338',
      '--popover-foreground': '#dbdee1',
      '--sidebar-background': '#2b2d31',
      '--sidebar-foreground': '#dbdee1',
      '--sidebar-border': 'rgba(255, 255, 255, 0.14)',
      '--sidebar-accent': '#35373c',
      '--border': 'rgba(255, 255, 255, 0.16)',
      '--muted': '#383a40',
      '--muted-foreground': '#949ba4',
      '--accent': '#35373c',
      '--accent-foreground': '#ffffff',
      '--secondary': '#2b2d31',
      '--secondary-foreground': '#f2f3f5',
      '--primary': '211 98% 48%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(2, 111, 228, 0.45)',
    },
  },

  // ==========================================
  // POLLEN TIER THEMES
  // ==========================================
  {
    id: 'mint_breeze',
    name: 'Mint Breeze',
    tier: 'pollen',
    gradient: 'linear-gradient(135deg, #0d3b32 0%, #164e43 50%, #2dd4bf 100%)',
    cssVars: {
      '--background': '#07201b',
      '--foreground': '#ccfbf1',
      '--card': '#0b2923',
      '--card-foreground': '#f0fdfa',
      '--popover': '#07201b',
      '--popover-foreground': '#ccfbf1',
      '--sidebar-background': '#061a16',
      '--sidebar-foreground': '#99f6e4',
      '--sidebar-border': 'rgba(45, 212, 191, 0.25)',
      '--sidebar-accent': '#0f3a31',
      '--border': 'rgba(45, 212, 191, 0.22)',
      '--muted': '#0d332b',
      '--muted-foreground': '#5eead4',
      '--accent': '#115e59',
      '--accent-foreground': '#ffffff',
      '--secondary': '#0e3830',
      '--secondary-foreground': '#ccfbf1',
      '--primary': '168 84% 42%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(45, 212, 191, 0.45)',
    },
  },
  {
    id: 'peach_sunrise',
    name: 'Peach Sunrise',
    tier: 'pollen',
    gradient: 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #fb923c 100%)',
    cssVars: {
      '--background': '#230a04',
      '--foreground': '#ffedd5',
      '--card': '#2e0f06',
      '--card-foreground': '#fff7ed',
      '--popover': '#230a04',
      '--popover-foreground': '#ffedd5',
      '--sidebar-background': '#1a0703',
      '--sidebar-foreground': '#fed7aa',
      '--sidebar-border': 'rgba(251, 146, 60, 0.25)',
      '--sidebar-accent': '#3d1409',
      '--border': 'rgba(251, 146, 60, 0.2)',
      '--muted': '#361208',
      '--muted-foreground': '#fdba74',
      '--accent': '#9a3412',
      '--accent-foreground': '#ffffff',
      '--secondary': '#331107',
      '--secondary-foreground': '#ffedd5',
      '--primary': '25 95% 53%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(249, 115, 22, 0.45)',
    },
  },
  {
    id: 'soft_horizon',
    name: 'Soft Horizon',
    tier: 'pollen',
    gradient: 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #38bdf8 100%)',
    cssVars: {
      '--background': '#041724',
      '--foreground': '#e0f2fe',
      '--card': '#072033',
      '--card-foreground': '#f0f9ff',
      '--popover': '#041724',
      '--popover-foreground': '#e0f2fe',
      '--sidebar-background': '#03121d',
      '--sidebar-foreground': '#bae6fd',
      '--sidebar-border': 'rgba(56, 189, 248, 0.25)',
      '--sidebar-accent': '#0a2d47',
      '--border': 'rgba(56, 189, 248, 0.2)',
      '--muted': '#08273d',
      '--muted-foreground': '#7dd3fc',
      '--accent': '#0284c7',
      '--accent-foreground': '#ffffff',
      '--secondary': '#07253a',
      '--secondary-foreground': '#e0f2fe',
      '--primary': '199 89% 48%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(56, 189, 248, 0.45)',
    },
  },
  {
    id: 'cream_linen',
    name: 'Desert Linen',
    tier: 'pollen',
    gradient: 'linear-gradient(135deg, #292524 0%, #44403c 50%, #d6d3d1 100%)',
    cssVars: {
      '--background': '#171514',
      '--foreground': '#f5f5f4',
      '--card': '#201d1b',
      '--card-foreground': '#fafaf9',
      '--popover': '#171514',
      '--popover-foreground': '#f5f5f4',
      '--sidebar-background': '#131110',
      '--sidebar-foreground': '#e7e5e4',
      '--sidebar-border': 'rgba(214, 211, 209, 0.2)',
      '--sidebar-accent': '#2d2926',
      '--border': 'rgba(214, 211, 209, 0.16)',
      '--muted': '#282422',
      '--muted-foreground': '#a8a29e',
      '--accent': '#57534e',
      '--accent-foreground': '#ffffff',
      '--secondary': '#23201d',
      '--secondary-foreground': '#f5f5f4',
      '--primary': '30 20% 60%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(214, 211, 209, 0.4)',
    },
  },

  // ==========================================
  // NECTAR TIER THEMES (DISCORD NITRO PARITY)
  // ==========================================
  {
    id: 'vice_city',
    name: 'Vice City Theme',
    tier: 'nectar',
    badge: '20D LEFT',
    isLimitedTime: true,
    gradient: 'linear-gradient(135deg, #701a75 0%, #db2777 50%, #ea580c 100%)',
    cssVars: {
      '--background': '#1f041b',
      '--foreground': '#fdf2f8',
      '--card': '#2e0729',
      '--card-foreground': '#ffffff',
      '--popover': '#1f041b',
      '--popover-foreground': '#fdf2f8',
      '--sidebar-background': '#160213',
      '--sidebar-foreground': '#fbcfe8',
      '--sidebar-border': 'rgba(219, 39, 119, 0.3)',
      '--sidebar-accent': '#400a39',
      '--border': 'rgba(234, 88, 12, 0.25)',
      '--muted': '#360930',
      '--muted-foreground': '#f472b6',
      '--accent': '#be185d',
      '--accent-foreground': '#ffffff',
      '--secondary': '#2d0728',
      '--secondary-foreground': '#fdf2f8',
      '--primary': '330 81% 60%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(219, 39, 119, 0.5)',
    },
  },
  {
    id: 'retro_synthwave',
    name: 'Retro Synthwave',
    tier: 'nectar',
    gradient: 'linear-gradient(135deg, #3b0764 0%, #a21caf 50%, #06b6d4 100%)',
    cssVars: {
      '--background': '#120224',
      '--foreground': '#fae8ff',
      '--card': '#1e053a',
      '--card-foreground': '#ffffff',
      '--popover': '#120224',
      '--popover-foreground': '#fae8ff',
      '--sidebar-background': '#0c0119',
      '--sidebar-foreground': '#f0abfc',
      '--sidebar-border': 'rgba(162, 28, 175, 0.35)',
      '--sidebar-accent': '#2e0757',
      '--border': 'rgba(6, 182, 212, 0.28)',
      '--muted': '#27064a',
      '--muted-foreground': '#e879f9',
      '--accent': '#86198f',
      '--accent-foreground': '#ffffff',
      '--secondary': '#20053e',
      '--secondary-foreground': '#fae8ff',
      '--primary': '292 84% 61%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(192, 38, 211, 0.5)',
    },
  },
  {
    id: 'chroma_glow',
    name: 'Chroma Glow',
    tier: 'nectar',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 40%, #06b6d4 80%, #10b981 100%)',
    cssVars: {
      '--background': '#0a0920',
      '--foreground': '#e0e7ff',
      '--card': '#110f33',
      '--card-foreground': '#ffffff',
      '--popover': '#0a0920',
      '--popover-foreground': '#e0e7ff',
      '--sidebar-background': '#070617',
      '--sidebar-foreground': '#c7d2fe',
      '--sidebar-border': 'rgba(99, 102, 241, 0.3)',
      '--sidebar-accent': '#1b174f',
      '--border': 'rgba(6, 182, 212, 0.25)',
      '--muted': '#171444',
      '--muted-foreground': '#818cf8',
      '--accent': '#4f46e5',
      '--accent-foreground': '#ffffff',
      '--secondary': '#131139',
      '--secondary-foreground': '#e0e7ff',
      '--primary': '239 84% 67%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(99, 102, 241, 0.5)',
    },
  },
  {
    id: 'sakura_bloom',
    name: 'Sakura Bloom',
    tier: 'nectar',
    gradient: 'linear-gradient(135deg, #500724 0%, #9d174d 50%, #f472b6 100%)',
    cssVars: {
      '--background': '#23020e',
      '--foreground': '#fdf2f8',
      '--card': '#330516',
      '--card-foreground': '#ffffff',
      '--popover': '#23020e',
      '--popover-foreground': '#fdf2f8',
      '--sidebar-background': '#180109',
      '--sidebar-foreground': '#fbcfe8',
      '--sidebar-border': 'rgba(244, 114, 182, 0.28)',
      '--sidebar-accent': '#44071e',
      '--border': 'rgba(244, 114, 182, 0.2)',
      '--muted': '#3b061a',
      '--muted-foreground': '#f472b6',
      '--accent': '#be185d',
      '--accent-foreground': '#ffffff',
      '--secondary': '#300515',
      '--secondary-foreground': '#fdf2f8',
      '--primary': '336 84% 65%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(244, 114, 182, 0.45)',
    },
  },
  {
    id: 'northern_aurora',
    name: 'Northern Aurora',
    tier: 'nectar',
    gradient: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #06b6d4 100%)',
    cssVars: {
      '--background': '#011712',
      '--foreground': '#ecfdf5',
      '--card': '#03231c',
      '--card-foreground': '#ffffff',
      '--popover': '#011712',
      '--popover-foreground': '#ecfdf5',
      '--sidebar-background': '#01100c',
      '--sidebar-foreground': '#a7f3d0',
      '--sidebar-border': 'rgba(6, 182, 212, 0.3)',
      '--sidebar-accent': '#06352b',
      '--border': 'rgba(16, 185, 129, 0.25)',
      '--muted': '#052b22',
      '--muted-foreground': '#34d399',
      '--accent': '#047857',
      '--accent-foreground': '#ffffff',
      '--secondary': '#042820',
      '--secondary-foreground': '#ecfdf5',
      '--primary': '160 84% 45%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(16, 185, 129, 0.5)',
    },
  },
  {
    id: 'forest_dusk',
    name: 'Forest Dusk',
    tier: 'nectar',
    gradient: 'linear-gradient(135deg, #14281d 0%, #1c3d2b 50%, #4ade80 100%)',
    cssVars: {
      '--background': '#0a170f',
      '--foreground': '#dcfce7',
      '--card': '#102217',
      '--card-foreground': '#ffffff',
      '--popover': '#0a170f',
      '--popover-foreground': '#dcfce7',
      '--sidebar-background': '#07100a',
      '--sidebar-foreground': '#bbf7d0',
      '--sidebar-border': 'rgba(74, 222, 128, 0.25)',
      '--sidebar-accent': '#183122',
      '--border': 'rgba(74, 222, 128, 0.2)',
      '--muted': '#14291c',
      '--muted-foreground': '#86efac',
      '--accent': '#15803d',
      '--accent-foreground': '#ffffff',
      '--secondary': '#12251a',
      '--secondary-foreground': '#dcfce7',
      '--primary': '142 71% 45%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(74, 222, 128, 0.45)',
    },
  },

  // ==========================================
  // ROYAL TIER THEMES
  // ==========================================
  {
    id: 'royal_gold',
    name: 'Royal Gold 👑',
    tier: 'royal',
    gradient: 'linear-gradient(135deg, #451a03 0%, #b45309 40%, #facc15 80%, #78350f 100%)',
    cssVars: {
      '--background': '#150901',
      '--foreground': '#fefce8',
      '--card': '#200f03',
      '--card-foreground': '#ffffff',
      '--popover': '#150901',
      '--popover-foreground': '#fefce8',
      '--sidebar-background': '#0e0601',
      '--sidebar-foreground': '#fef08a',
      '--sidebar-border': 'rgba(250, 204, 21, 0.35)',
      '--sidebar-accent': '#301705',
      '--border': 'rgba(250, 204, 21, 0.3)',
      '--muted': '#281304',
      '--muted-foreground': '#fde047',
      '--accent': '#a16207',
      '--accent-foreground': '#ffffff',
      '--secondary': '#221104',
      '--secondary-foreground': '#fefce8',
      '--primary': '48 96% 53%',
      '--primary-foreground': '0 0% 0%',
      '--ring': 'rgba(250, 204, 21, 0.6)',
    },
  },
  {
    id: 'crimson_velvet',
    name: 'Crimson Royalty 👑',
    tier: 'royal',
    gradient: 'linear-gradient(135deg, #450a0a 0%, #991b1b 50%, #f43f5e 100%)',
    cssVars: {
      '--background': '#1a0404',
      '--foreground': '#ffe4e6',
      '--card': '#280707',
      '--card-foreground': '#ffffff',
      '--popover': '#1a0404',
      '--popover-foreground': '#ffe4e6',
      '--sidebar-background': '#120202',
      '--sidebar-foreground': '#fecdd3',
      '--sidebar-border': 'rgba(244, 63, 94, 0.3)',
      '--sidebar-accent': '#380a0a',
      '--border': 'rgba(244, 63, 94, 0.25)',
      '--muted': '#300808',
      '--muted-foreground': '#fb7185',
      '--accent': '#be123c',
      '--accent-foreground': '#ffffff',
      '--secondary': '#290707',
      '--secondary-foreground': '#ffe4e6',
      '--primary': '347 87% 60%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(244, 63, 94, 0.5)',
    },
  },
  {
    id: 'cosmic_void',
    name: 'Cosmic Nebula 👑',
    tier: 'royal',
    gradient: 'linear-gradient(135deg, #0f0728 0%, #3b0764 45%, #9333ea 85%, #ec4899 100%)',
    cssVars: {
      '--background': '#09031c',
      '--foreground': '#f3e8ff',
      '--card': '#140533',
      '--card-foreground': '#ffffff',
      '--popover': '#09031c',
      '--popover-foreground': '#f3e8ff',
      '--sidebar-background': '#060113',
      '--sidebar-foreground': '#e9d5ff',
      '--sidebar-border': 'rgba(147, 51, 234, 0.35)',
      '--sidebar-accent': '#20094e',
      '--border': 'rgba(236, 72, 153, 0.25)',
      '--muted': '#1a0640',
      '--muted-foreground': '#c084fc',
      '--accent': '#7e22ce',
      '--accent-foreground': '#ffffff',
      '--secondary': '#160638',
      '--secondary-foreground': '#f3e8ff',
      '--primary': '271 91% 65%',
      '--primary-foreground': '0 0% 100%',
      '--ring': 'rgba(168, 85, 247, 0.5)',
    },
  },
  {
    id: 'cyber_matrix',
    name: 'Cyber Matrix 👑',
    tier: 'royal',
    gradient: 'linear-gradient(135deg, #022c22 0%, #047857 45%, #10b981 85%, #a7f3d0 100%)',
    cssVars: {
      '--background': '#01120e',
      '--foreground': '#ecfdf5',
      '--card': '#031c16',
      '--card-foreground': '#ffffff',
      '--popover': '#01120e',
      '--popover-foreground': '#ecfdf5',
      '--sidebar-background': '#000c09',
      '--sidebar-foreground': '#a7f3d0',
      '--sidebar-border': 'rgba(16, 185, 129, 0.35)',
      '--sidebar-accent': '#062920',
      '--border': 'rgba(16, 185, 129, 0.3)',
      '--muted': '#05221b',
      '--muted-foreground': '#34d399',
      '--accent': '#059669',
      '--accent-foreground': '#ffffff',
      '--secondary': '#041f18',
      '--secondary-foreground': '#ecfdf5',
      '--primary': '158 84% 48%',
      '--primary-foreground': '0 0% 0%',
      '--ring': 'rgba(16, 185, 129, 0.6)',
    },
  },
];

export function getColorThemeConfig(id: string): ColorThemeDefinition {
  return COLOR_THEME_LIST.find((t) => t.id === id) || COLOR_THEME_LIST[0];
}

const STORAGE_SAVED_THEME_KEY = 'anticeil_color_theme';

export function getSavedColorTheme(): string {
  if (typeof window === 'undefined') return 'default_dark';
  try {
    const saved = localStorage.getItem(STORAGE_SAVED_THEME_KEY);
    if (saved && COLOR_THEME_LIST.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {}
  return 'default_dark';
}

/**
 * Apply a Color Theme by injecting CSS custom properties into document.documentElement.
 */
export function applyColorTheme(themeId: string, isPreview: boolean = false): void {
  if (typeof document === 'undefined') return;

  const theme = getColorThemeConfig(themeId);
  const root = document.documentElement;

  // Apply all CSS variables
  Object.entries(theme.cssVars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  root.setAttribute('data-color-theme', theme.id);

  if (!isPreview) {
    try {
      localStorage.setItem(STORAGE_SAVED_THEME_KEY, theme.id);
    } catch {}
  }

  // Dispatch custom event for real-time reactivity
  window.dispatchEvent(
    new CustomEvent('anticeil_color_theme_applied', {
      detail: { themeId: theme.id, isPreview },
    }),
  );
}

/**
 * Revert back to the saved color theme.
 */
export function revertColorTheme(): void {
  const saved = getSavedColorTheme();
  applyColorTheme(saved, false);
}
