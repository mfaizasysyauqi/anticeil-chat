export interface DisplayNameStyleConfig {
  fontId: string;
  effectId: 'solid' | 'gradient' | 'neon' | 'toon' | 'pop' | 'gummy' | 'prism';
  color: string;
}

export interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
  sample: string;
  isLimitedTime?: boolean;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'sans', name: 'Modern Sans', fontFamily: 'system-ui, sans-serif', sample: 'Gg' },
  { id: 'serif', name: 'Classic Serif', fontFamily: 'Georgia, serif', sample: 'Gg' },
  { id: 'mono', name: 'Terminal Mono', fontFamily: '"Share Tech Mono", monospace', sample: 'Gg' },
  { id: 'gothic', name: 'Blackletter Gothic', fontFamily: '"UnifrakturMaguntia", serif', sample: 'Gg' },
  { id: 'pixel', name: 'Retro 8-Bit', fontFamily: '"Press Start 2P", monospace', sample: 'Gg' },
  { id: 'cursive', name: 'Elegant Script', fontFamily: '"Dancing Script", cursive', sample: 'Gg' },
  { id: 'bubble', name: 'Chubby Bubble', fontFamily: '"Fredoka", cursive', sample: 'Gg' },
  { id: 'cyber', name: 'Cyberpunk', fontFamily: '"Courier New", monospace', sample: 'Gg' },
  { id: 'roman', name: 'Imperial Roman', fontFamily: '"Cinzel", serif', sample: 'Gg' },
  { id: 'arcade', name: 'Arcade Pixel', fontFamily: '"VT323", monospace', sample: 'Gg' },
  { id: 'heavy', name: 'Bold Impact', fontFamily: 'Impact, sans-serif', sample: 'Gg' },
  { id: 'tech', name: 'Futuristic Tube', fontFamily: 'monospace', sample: 'Gg' },
];

export const LIMITED_TIME_FONT: FontOption = {
  id: 'vice_city',
  name: 'Vice City 2026',
  fontFamily: '"Impact", "Share Tech Mono", sans-serif',
  sample: 'ZMSTA',
  isLimitedTime: true,
};

export interface EffectOption {
  id: DisplayNameStyleConfig['effectId'];
  label: string;
}

export const EFFECT_OPTIONS: EffectOption[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'neon', label: 'Neon' },
  { id: 'toon', label: 'Toon' },
  { id: 'pop', label: 'Pop' },
  { id: 'gummy', label: 'Gummy' },
  { id: 'prism', label: 'Prism' },
];

export const COLOR_SWATCHES: string[] = [
  '#5865F2', // Discord Blurple
  '#23a55a', // Emerald Green
  '#00a8fc', // Sky Blue
  '#eb459e', // Magenta Pink
  '#f23f43', // Crimson Red
  '#f26522', // Tangerine Orange
  '#fee75c', // Golden Yellow
  '#ffffff', // Clean White
];

export const DEFAULT_STYLE_CONFIG: DisplayNameStyleConfig = {
  fontId: 'gothic',
  effectId: 'solid',
  color: '#f23f43',
};

export function parseDisplayNameStyle(raw?: string): DisplayNameStyleConfig {
  if (!raw || raw === 'default') {
    return { fontId: 'sans', effectId: 'solid', color: '#ffffff' };
  }
  if (raw === 'cyber') {
    return { fontId: 'cyber', effectId: 'neon', color: '#06b6d4' };
  }
  if (raw === 'retro') {
    return { fontId: 'serif', effectId: 'solid', color: '#f59e0b' };
  }
  if (raw === 'gradient') {
    return { fontId: 'sans', effectId: 'gradient', color: '#14b8a6' };
  }
  if (raw === 'mono') {
    return { fontId: 'mono', effectId: 'solid', color: '#10b981' };
  }
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      return {
        fontId: parsed.fontId || 'sans',
        effectId: parsed.effectId || 'solid',
        color: parsed.color || '#ffffff',
      };
    } catch {}
  }
  return { fontId: 'sans', effectId: 'solid', color: '#ffffff' };
}

export function serializeDisplayNameStyle(config: DisplayNameStyleConfig): string {
  return JSON.stringify(config);
}

export function getDisplayNameInlineStyles(config: DisplayNameStyleConfig): React.CSSProperties {
  const font =
    config.fontId === 'vice_city'
      ? LIMITED_TIME_FONT
      : FONT_OPTIONS.find((f) => f.id === config.fontId) || FONT_OPTIONS[0];

  const base: React.CSSProperties = {
    fontFamily: font.fontFamily,
    color: config.color,
  };

  switch (config.effectId) {
    case 'gradient':
      return {
        ...base,
        backgroundImage: `linear-gradient(135deg, ${config.color}, #ffffff)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      };
    case 'neon':
      return {
        ...base,
        textShadow: `0 0 6px ${config.color}, 0 0 14px ${config.color}, 0 0 24px rgba(255,255,255,0.6)`,
      };
    case 'toon':
      return {
        ...base,
        textShadow: `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 3px 0 #000`,
      };
    case 'pop':
      return {
        ...base,
        textShadow: `2px 2px 0px #000, 4px 4px 0px rgba(0,0,0,0.4)`,
      };
    case 'gummy':
      return {
        ...base,
        textShadow: `0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(0,0,0,0.5), 0 3px 6px rgba(0,0,0,0.6)`,
      };
    case 'prism':
      return {
        ...base,
        textShadow: `-2px 0 #00ffff, 2px 0 #ff00ff, 0 0 8px rgba(255,255,255,0.7)`,
      };
    case 'solid':
    default:
      return {
        ...base,
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      };
  }
}
