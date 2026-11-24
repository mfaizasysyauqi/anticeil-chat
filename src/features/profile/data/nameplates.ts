export interface NameplateItem {
  id: string;
  name: string;
  category: 'shop' | 'nectar';
  isLockedInShop?: boolean;
  isExclusiveToNectar?: boolean;
  description: string;
  backgroundClass: string;
  svgType:
    | 'none'
    | 'manga_eyes'
    | 'cosmic_blue'
    | 'purple_singularity'
    | 'shadow_hands'
    | 'cyber_grid'
    | 'golden_hive'
    | 'crimson_neon';
}

export const NAMEPLATES_LIST: NameplateItem[] = [
  {
    id: 'manga_eyes',
    name: 'Manga Gaze',
    category: 'shop',
    isLockedInShop: true,
    description: 'Black & white manga eyes with screentone ink aesthetics.',
    backgroundClass: 'bg-zinc-950 border-zinc-700/60',
    svgType: 'manga_eyes',
  },
  {
    id: 'cosmic_blue',
    name: 'Cosmic Blue Nebula',
    category: 'shop',
    isLockedInShop: true,
    description: 'Deep cosmic nebula with glowing cyan and electric star mist.',
    backgroundClass: 'bg-gradient-to-r from-blue-950 via-cyan-950 to-indigo-950 border-cyan-500/40',
    svgType: 'cosmic_blue',
  },
  {
    id: 'purple_singularity',
    name: 'Void Singularity',
    category: 'shop',
    isLockedInShop: true,
    description: 'Deep violet space portal swirling into infinite gravity.',
    backgroundClass: 'bg-gradient-to-r from-purple-950 via-fuchsia-950 to-slate-950 border-purple-500/40',
    svgType: 'purple_singularity',
  },
  {
    id: 'shadow_hands',
    name: 'Phantom Shadows',
    category: 'shop',
    isLockedInShop: true,
    description: 'Eerie monochromatic shadow silhouettes reaching from darkness.',
    backgroundClass: 'bg-zinc-900 border-zinc-700/60',
    svgType: 'shadow_hands',
  },
  {
    id: 'cyber_grid',
    name: 'Cyber Matrix Grid',
    category: 'shop',
    isLockedInShop: true,
    description: 'Neon teal perspective grid with high-speed digital circuitry.',
    backgroundClass: 'bg-[#051c24] border-teal-500/40',
    svgType: 'cyber_grid',
  },
  {
    id: 'golden_hive',
    name: 'Golden Honeycomb',
    category: 'shop',
    isLockedInShop: true,
    description: 'Regal golden hexagon cells shimmering with digital honey.',
    backgroundClass: 'bg-gradient-to-r from-amber-950 via-yellow-950 to-stone-950 border-amber-500/40',
    svgType: 'golden_hive',
  },
  {
    id: 'crimson_neon',
    name: 'Crimson Voltage',
    category: 'shop',
    isLockedInShop: true,
    description: 'High-voltage crimson plasma pulsing through dark circuits.',
    backgroundClass: 'bg-gradient-to-r from-red-950 via-rose-950 to-zinc-950 border-red-500/40',
    svgType: 'crimson_neon',
  },
];
