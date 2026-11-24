export interface AvatarDecorationItem {
  id: string;
  name: string;
  category: 'nectar' | 'shop';
  isExclusiveToNectar?: boolean;
  isLockedInShop?: boolean;
  description?: string;
  gradient: string;
  svgType:
    | 'cyber_headset'
    | 'cyber_hud'
    | 'toxic_skull'
    | 'sakura'
    | 'flame_aura'
    | 'gold_bee'
    | 'angel_wings'
    | 'ghost_smoke'
    | 'electric_ring'
    | 'galaxy_vortex'
    | 'rage_veins'
    | 'mystic_fire'
    | 'silver_blade';
}

export const AVATAR_DECORATIONS_LIST: AvatarDecorationItem[] = [
  // Exclusive to Nitro / Nectar
  {
    id: 'cyber_headset',
    name: 'Cyber Headset',
    category: 'nectar',
    isExclusiveToNectar: true,
    description: 'High-tech cybernetic neural headset with audio feedback.',
    gradient: 'from-cyan-500 to-blue-600',
    svgType: 'cyber_headset',
  },
  {
    id: 'cyber_hud',
    name: 'Cyberpunk HUD _23',
    category: 'nectar',
    isExclusiveToNectar: true,
    description: 'Neon magenta tactical HUD visor with digital telemetry.',
    gradient: 'from-pink-500 to-purple-600',
    svgType: 'cyber_hud',
  },
  {
    id: 'toxic_skull',
    name: 'Toxic Skull',
    category: 'nectar',
    isExclusiveToNectar: true,
    description: 'Radioactive green bio-aura with swirling phantom mist.',
    gradient: 'from-lime-400 to-emerald-600',
    svgType: 'toxic_skull',
  },
  {
    id: 'sakura',
    name: 'Sakura Blossom',
    category: 'nectar',
    isExclusiveToNectar: true,
    description: 'Spring cherry petals fluttering in a calming pink breeze.',
    gradient: 'from-pink-400 to-rose-500',
    svgType: 'sakura',
  },
  {
    id: 'flame_aura',
    name: 'Inferno Flames',
    category: 'nectar',
    isExclusiveToNectar: true,
    description: 'Raging hellfire flames burning with relentless energy.',
    gradient: 'from-orange-500 to-red-600',
    svgType: 'flame_aura',
  },
  {
    id: 'gold_bee',
    name: 'Golden Hive Halo',
    category: 'nectar',
    isExclusiveToNectar: true,
    description: 'Honeycomb crown forged in pure digital nectar.',
    gradient: 'from-amber-400 to-yellow-500',
    svgType: 'gold_bee',
  },
  {
    id: 'angel_wings',
    name: 'Celestial Wings',
    category: 'nectar',
    isExclusiveToNectar: true,
    description: 'Luminous divine wings radiating celestial light.',
    gradient: 'from-sky-300 to-indigo-400',
    svgType: 'angel_wings',
  },

  // See What's in Shop
  {
    id: 'ghost_smoke',
    name: 'Ghostly Smoke',
    category: 'shop',
    isLockedInShop: true,
    description: 'Spiritual mist whispering ancient ethereal echoes.',
    gradient: 'from-zinc-300 to-slate-400',
    svgType: 'ghost_smoke',
  },
  {
    id: 'electric_ring',
    name: 'Plasma Electric Ring',
    category: 'shop',
    isLockedInShop: true,
    description: 'Hypercharged lightning coils circling your presence.',
    gradient: 'from-cyan-400 to-blue-500',
    svgType: 'electric_ring',
  },
  {
    id: 'galaxy_vortex',
    name: 'Galaxy Vortex',
    category: 'shop',
    isLockedInShop: true,
    description: 'Deep cosmic singularity swirling with stardust.',
    gradient: 'from-purple-500 to-indigo-700',
    svgType: 'galaxy_vortex',
  },
  {
    id: 'rage_veins',
    name: 'Crimson Anger',
    category: 'shop',
    isLockedInShop: true,
    description: 'Anime fury marks burning with unbridled intensity.',
    gradient: 'from-red-500 to-rose-700',
    svgType: 'rage_veins',
  },
  {
    id: 'mystic_fire',
    name: 'Mystical Cyan Fire',
    category: 'shop',
    isLockedInShop: true,
    description: 'Spiritual flame burning cool cyan with ancient sorcery.',
    gradient: 'from-teal-300 to-cyan-600',
    svgType: 'mystic_fire',
  },
  {
    id: 'silver_blade',
    name: 'Silver Blade Ring',
    category: 'shop',
    isLockedInShop: true,
    description: 'Titanium-forged metallic spiked halo with razor precision.',
    gradient: 'from-slate-200 to-zinc-400',
    svgType: 'silver_blade',
  },
];
