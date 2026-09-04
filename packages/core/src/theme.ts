export interface ThemeColors {
  bgMain: string;
  bgSurface: string;
  bgSurfaceHover: string;
  bgSubtle: string;
  bgInput: string;
  bgUserBubble: string;
  bgAiBubble: string;
  borderSubtle: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  brand: {
    primary: string;
    primaryHover: string;
    primaryText: string;
    secondary: string;
    gradient: string;
  };
  accent: {
    success: string;
    warning: string;
    danger: string;
    info: string;
    reasoning: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const THEME_DARK_COLORS: ThemeColors = {
  bgMain: '#0B0F17',
  bgSurface: '#121824',
  bgSurfaceHover: '#1A2234',
  bgSubtle: '#182030',
  bgInput: '#151D2C',
  bgUserBubble: '#3B82F6',
  bgAiBubble: '#161F30',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  brand: {
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryText: '#FFFFFF',
    secondary: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  },
  accent: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    reasoning: '#A855F7',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    md: '0 4px 12px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 12px 32px -4px rgba(0, 0, 0, 0.6), 0 4px 12px -2px rgba(0, 0, 0, 0.4)',
  },
};

export const THEME_LIGHT_COLORS: ThemeColors = {
  bgMain: '#F8FAFC',
  bgSurface: '#FFFFFF',
  bgSurfaceHover: '#F1F5F9',
  bgSubtle: '#F1F5F9',
  bgInput: '#FFFFFF',
  bgUserBubble: '#2563EB',
  bgAiBubble: '#F1F5F9',
  borderSubtle: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.16)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  brand: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryText: '#FFFFFF',
    secondary: '#7C3AED',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
  },
  accent: {
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0891B2',
    reasoning: '#9333EA',
  },
  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 12px 32px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
  },
};

export function getThemeColors(mode: 'light' | 'dark'): ThemeColors {
  return mode === 'dark' ? THEME_DARK_COLORS : THEME_LIGHT_COLORS;
}

export interface TierBadgeStyle {
  background: string;
  color: string;
  border: string;
  label: string;
}

export function getTierBadgeStyle(tier: import('./types').UserTier = 'free'): TierBadgeStyle {
  switch (tier) {
    case 'enterprise':
      return {
        background: 'var(--tier-enterprise-bg, rgba(139, 92, 246, 0.15))',
        color: 'var(--tier-enterprise-color, #a78bfa)',
        border: '1px solid var(--tier-enterprise-border, rgba(139, 92, 246, 0.4))',
        label: 'ENTERPRISE',
      };
    case 'pro':
      return {
        background: 'var(--tier-pro-bg, rgba(0, 115, 234, 0.15))',
        color: 'var(--tier-pro-color, var(--brand-primary))',
        border: '1px solid var(--tier-pro-border, rgba(0, 115, 234, 0.3))',
        label: 'PRO',
      };
    case 'starter':
      return {
        background: 'var(--tier-starter-bg, rgba(245, 158, 11, 0.15))',
        color: 'var(--tier-starter-color, #f59e0b)',
        border: '1px solid var(--tier-starter-border, rgba(245, 158, 11, 0.4))',
        label: 'STARTER',
      };
    case 'free':
    default:
      return {
        background: 'var(--tier-free-bg, rgba(0, 200, 117, 0.12))',
        color: 'var(--tier-free-color, var(--accent-success))',
        border: '1px solid var(--tier-free-border, rgba(0, 200, 117, 0.3))',
        label: 'FREE',
      };
  }
}

export const THEME = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  spacingNum: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '9999px',
  },
  radiusNum: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999,
  },
  fontSizeNum: {
    micro: 9,
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 26,
    xxxl: 32,
    display: 40,
    hero: 52,
  },
  fontWeightNum: {
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800,
    black: 900,
  },
  lineHeightNum: {
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.65,
    loose: 1.8,
  },
  elevation: {
    none: { elevation: 0, shadowOpacity: 0 },
    xs: { elevation: 1, shadowOpacity: 0.1 },
    sm: { elevation: 2, shadowOpacity: 0.15 },
    md: { elevation: 4, shadowOpacity: 0.2 },
    lg: { elevation: 8, shadowOpacity: 0.25 },
    xl: { elevation: 12, shadowOpacity: 0.3 },
  },
  zIndex: {
    base: 0,
    raised: 10,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    toast: 600,
    tooltip: 700,
    max: 9999,
  },
  animation: {
    durationMs: {
      fast: 150,
      normal: 250,
      slow: 400,
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },
  iconSizeNum: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  touchTargetMin: 44,
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1440,
  },
};
