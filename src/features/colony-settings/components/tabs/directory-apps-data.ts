export interface DirectoryAppItem {
  id: string;
  name: string;
  badge: string;
  category: 'Featured' | 'Games' | 'Entertainment' | 'Moderation and Tools' | 'Social' | 'Utilities';
  description: string;
  longDescription: string;
  bannerGradient: string;
  bannerImage?: string;
  iconBg: string;
  iconText: string;
  iconImage?: string;
  verified: boolean;
  author: string;
  commands: string[];
  permissions: string[];
}

export const DIRECTORY_APPS: DirectoryAppItem[] = [
  {
    id: 'exoplanet',
    name: 'EXOPLANET',
    badge: 'Promoted',
    category: 'Games',
    description: 'Andy Weir presents Exoplanet, listen now only on Audible. Your ship is wrecked and stranded...',
    longDescription:
      'Immerse your server in an audio-driven sci-fi survival narrative from bestselling author Andy Weir. Make collective story choices, survive planetary perils, and unlock exclusive space badges.',
    bannerGradient: 'from-amber-900/60 via-stone-900/80 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-amber-600',
    iconText: '🚀',
    verified: true,
    author: 'Audible Original',
    commands: ['/exoplanet start', '/exoplanet vote [choice]', '/exoplanet status'],
    permissions: ['Send Messages', 'Embed Links', 'Attach Files', 'Use Slash Commands'],
  },
  {
    id: 'rings-of-power',
    name: 'The Rings of Power',
    badge: 'Games • Promoted',
    category: 'Games',
    description: "It is the Second Age. Enter Sauron's forge in Barad-dûr and discover exclusive lore, quizzes, and rewards.",
    longDescription:
      "Journey into Middle-earth's Second Age. Forge legendary rings, conquer server trivia challenges, and pledge your allegiance to the Elves, Dwarves, Númenóreans, or Southlands.",
    bannerGradient: 'from-amber-600/50 via-zinc-900/80 to-black',
    bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-amber-500',
    iconText: '💍',
    verified: true,
    author: 'Prime Video & Amazon Studios',
    commands: ['/forge ring', '/lore search [query]', '/trivia middle-earth'],
    permissions: ['Send Messages', 'Embed Links', 'Add Reactions', 'Use Slash Commands'],
  },
  {
    id: 'wordle',
    name: 'Wordle',
    badge: 'The New York Times Games',
    category: 'Games',
    description: 'Enjoy Wordle from New York Times Games! You have 6 chances to guess a 5-letter word with friends.',
    longDescription:
      'The viral word guessing sensation directly in your server. Compete synchronously with colony members on the daily puzzle or generate endless custom 5-letter showdowns.',
    bannerGradient: 'from-emerald-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-emerald-600',
    iconText: '🟩',
    verified: true,
    author: 'The New York Times',
    commands: ['/wordle daily', '/wordle duel @user', '/wordle stats'],
    permissions: ['Send Messages', 'Embed Links', 'Use Slash Commands'],
  },
  {
    id: 'farm-merge-valley',
    name: 'Farm Merge Valley',
    badge: 'Games',
    category: 'Games',
    description: 'Farm, merge, grow and expand your land! Welcome to the world of farming that gets better together.',
    longDescription:
      'A cozy cooperative multiplayer merge puzzle game. Cultivate your shared server valley, harvest crops, trade goods with other colonies, and raise adorable farm animals.',
    bannerGradient: 'from-rose-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-red-500',
    iconText: '🐔',
    verified: true,
    author: 'Merge Games Studio',
    commands: ['/farm harvest', '/farm market', '/farm visit @user'],
    permissions: ['Send Messages', 'Embed Links', 'Attach Files', 'Use Slash Commands'],
  },
  {
    id: 'gartic-phone',
    name: 'Gartic Phone',
    badge: 'Popular Party Game',
    category: 'Social',
    description: 'The telephone drawing game! Pass animated sketches and hilarious prompts around your voice channel.',
    longDescription:
      'Laugh uncontrollably with your friends. One player writes a sentence, the next draws it, the next guesses what was drawn. Pure chaos and fun.',
    bannerGradient: 'from-blue-900/60 via-zinc-900 to-black',
    bannerImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-blue-500',
    iconText: '🎨',
    verified: true,
    author: 'Onrizon Games',
    commands: ['/gartic start', '/gartic lobby', '/gartic theme [name]'],
    permissions: ['Send Messages', 'Connect & Speak', 'Use Slash Commands'],
  },
  {
    id: 'carl-bot',
    name: 'Carl-bot',
    badge: 'Moderation • Reaction Roles',
    category: 'Moderation and Tools',
    description: 'Advanced reaction roles, mod logs, auto-moderation, custom embeds, and server management.',
    longDescription:
      'One of the most trusted moderation suites in Anticeil history. Fast reaction role assignment, highly configurable auto-punishments, logging feeds, and announcement builders.',
    bannerGradient: 'from-cyan-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-cyan-600',
    iconText: '🐢',
    verified: true,
    author: 'CarlBot Team',
    commands: ['/rr make', '/warn @user [reason]', '/embed create'],
    permissions: ['Manage Roles', 'Kick Members', 'Ban Members', 'Manage Messages'],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    badge: 'Creative AI',
    category: 'Entertainment',
    description: 'Generate stunning photorealistic artwork, concept designs, and portraits directly from text prompts.',
    longDescription:
      'Transform imaginative words into breathtaking imagery. Collaborate with channel members using upscaling, panning, outpainting, and stylistic blends.',
    bannerGradient: 'from-purple-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-purple-600',
    iconText: '⛵',
    verified: true,
    author: 'Midjourney, Inc.',
    commands: ['/imagine [prompt]', '/blend [image1] [image2]', '/describe [image]'],
    permissions: ['Send Messages', 'Embed Links', 'Attach Files', 'Use Slash Commands'],
  },
  {
    id: 'rythm',
    name: 'Rythm Music',
    badge: 'Music Assistant',
    category: 'Entertainment',
    description: 'Stream music from Spotify, Soundcloud, and YouTube directly into your voice channels with zero lag.',
    longDescription:
      'High-fidelity sound, shared playlists, song queue management, lyrics display, and audio filters (Bass Boost, Nightcore, Lo-Fi) for your colony hangout.',
    bannerGradient: 'from-indigo-950/70 via-stone-900 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    iconBg: 'bg-indigo-600',
    iconText: '🎵',
    verified: true,
    author: 'Rythm Inc.',
    commands: ['/play [song or url]', '/queue', '/skip', '/lyrics'],
    permissions: ['Connect & Speak', 'Use Voice Activity', 'Send Messages'],
  },
];

export const DIRECTORY_CATEGORIES = [
  'Featured',
  'Games',
  'Entertainment',
  'Moderation and Tools',
  'Social',
  'Utilities',
] as const;
