// ─────────────────────────────────────────────────────────────────────────────
// ANTICEIL MEDIA DATA (Types + Static UI data)
// Server Emojis & Stickers are loaded dynamically from database via API.
// ─────────────────────────────────────────────────────────────────────────────

export interface AnticeilEmoji {
  id: string;
  name: string;
  code: string;
  url: string;
  server: string;
  serverIcon?: string;
  category?: string;
}

export interface AnticeilSticker {
  id: string;
  name: string;
  url: string;
  server: string;
  serverIcon?: string;
  tags?: string[];
}

export interface AnticeilGifCategory {
  id: string;
  name: string;
  coverUrl: string;
  isSpecial?: boolean;
}

export interface AnticeilGifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  category: string;
}

export interface AnticeilAppCatalogItem {
  id: string;
  title: string;
  developer: string;
  group: 'Promoted' | 'Puzzle Games' | 'Card Games' | 'Productivity & Dev';
  icon: string;
  iconBg: string;
  bannerGradient?: string;
  description: string;
}

// ── Standard Unicode Emojis ──────────────────────────────────────────────────
export const STANDARD_UNICODE_EMOJIS: AnticeilEmoji[] = [
  { id: 'u-1', name: 'grinning', code: ':grinning:', url: '😀', server: 'Standard', category: 'frequently-used' },
  { id: 'u-2', name: 'joy', code: ':joy:', url: '😂', server: 'Standard', category: 'frequently-used' },
  { id: 'u-3', name: 'rofl', code: ':rofl:', url: '🤣', server: 'Standard', category: 'frequently-used' },
  { id: 'u-4', name: 'heart_eyes', code: ':heart_eyes:', url: '😍', server: 'Standard', category: 'frequently-used' },
  { id: 'u-5', name: 'sob', code: ':sob:', url: '😭', server: 'Standard', category: 'frequently-used' },
  { id: 'u-6', name: 'fire', code: ':fire:', url: '🔥', server: 'Standard', category: 'frequently-used' },
  { id: 'u-7', name: 'sparkles', code: ':sparkles:', url: '✨', server: 'Standard', category: 'frequently-used' },
  { id: 'u-8', name: 'star', code: ':star:', url: '⭐', server: 'Standard', category: 'frequently-used' },
  { id: 'u-9', name: 'heart', code: ':heart:', url: '❤️', server: 'Standard', category: 'frequently-used' },
  { id: 'u-10', name: 'thumbsup', code: ':thumbsup:', url: '👍', server: 'Standard', category: 'Smileys' },
  { id: 'u-11', name: 'clap', code: ':clap:', url: '👏', server: 'Standard', category: 'Smileys' },
  { id: 'u-12', name: 'pray', code: ':pray:', url: '🙏', server: 'Standard', category: 'Smileys' },
  { id: 'u-13', name: 'rocket', code: ':rocket:', url: '🚀', server: 'Standard', category: 'Objects' },
  { id: 'u-14', name: 'tada', code: ':tada:', url: '🎉', server: 'Standard', category: 'Objects' },
  { id: 'u-15', name: 'eyes', code: ':eyes:', url: '👀', server: 'Standard', category: 'Smileys' },
  { id: 'u-16', name: 'thinking', code: ':thinking:', url: '🤔', server: 'Standard', category: 'Smileys' },
  { id: 'u-17', name: 'sunglasses', code: ':sunglasses:', url: '😎', server: 'Standard', category: 'Smileys' },
  { id: 'u-18', name: 'skull', code: ':skull:', url: '💀', server: 'Standard', category: 'Smileys' },
  { id: 'u-19', name: '100', code: ':100:', url: '💯', server: 'Standard', category: 'Symbols' },
  { id: 'u-20', name: 'partying_face', code: ':partying_face:', url: '🥳', server: 'Standard', category: 'Smileys' },
  { id: 'u-21', name: 'exploding_head', code: ':exploding_head:', url: '🤯', server: 'Standard', category: 'Smileys' },
  { id: 'u-22', name: 'salute', code: ':saluting_face:', url: '🫡', server: 'Standard', category: 'Smileys' },
  { id: 'u-23', name: 'check', code: ':white_check_mark:', url: '✅', server: 'Standard', category: 'Symbols' },
  { id: 'u-24', name: 'cross', code: ':x:', url: '❌', server: 'Standard', category: 'Symbols' },
  { id: 'u-25', name: 'zap', code: ':zap:', url: '⚡', server: 'Standard', category: 'Nature' },
  { id: 'u-26', name: 'diamond', code: ':gem:', url: '💎', server: 'Standard', category: 'Objects' },
  { id: 'u-27', name: 'robot', code: ':robot:', url: '🤖', server: 'Standard', category: 'Smileys' },
];

export const ANTICEIL_EMOJI_SERVERS: { id: string; name: string; icon: string }[] = [];
export const ANTICEIL_EMOJIS: AnticeilEmoji[] = STANDARD_UNICODE_EMOJIS;
export const ANTICEIL_STICKERS: AnticeilSticker[] = [];

// ── GIF Categories & Items ───────────────────────────────────────────────────
export const ANTICEIL_GIF_CATEGORIES: AnticeilGifCategory[] = [
  { id: 'favorites', name: 'Favorites', coverUrl: '', isSpecial: true },
  { id: 'trending', name: 'Trending GIFs', coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80' },
  { id: 'hello', name: 'hello', coverUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80' },
  { id: 'lol', name: 'lol', coverUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&auto=format&fit=crop&q=80' },
  { id: 'love', name: 'love', coverUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&auto=format&fit=crop&q=80' },
  { id: 'happy-birthday', name: 'happy birthday', coverUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&auto=format&fit=crop&q=80' },
  { id: 'dance', name: 'dance', coverUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=300&auto=format&fit=crop&q=80' },
  { id: 'gaming', name: 'gaming', coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80' },
];

export const ANTICEIL_GIF_ITEMS: AnticeilGifItem[] = [
  { id: 'gif-1', title: 'Wave Hello Tom Hanks', url: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif', previewUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/200w.gif', category: 'hello' },
  { id: 'gif-2', title: 'Hi Cute Bear Wave', url: 'https://media.giphy.com/media/VbEC9WchxkiWTL5PFo/giphy.gif', previewUrl: 'https://media.giphy.com/media/VbEC9WchxkiWTL5PFo/200w.gif', category: 'hello' },
  { id: 'gif-3', title: 'Laughing Dog LOL', url: 'https://media.giphy.com/media/10yXFkBJ0MwGQg/giphy.gif', previewUrl: 'https://media.giphy.com/media/10yXFkBJ0MwGQg/200w.gif', category: 'lol' },
  { id: 'gif-4', title: 'Cat Laughing Head Turn', url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif', previewUrl: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/200w.gif', category: 'lol' },
  { id: 'gif-5', title: 'Milk and Mocha Hug', url: 'https://media.giphy.com/media/KztT2c4uNxKKBosTht/giphy.gif', previewUrl: 'https://media.giphy.com/media/KztT2c4uNxKKBosTht/200w.gif', category: 'love' },
  { id: 'gif-6', title: 'Cats Party Disco Happy Birthday', url: 'https://media.giphy.com/media/10hO3rDNqqg2Xe/giphy.gif', previewUrl: 'https://media.giphy.com/media/10hO3rDNqqg2Xe/200w.gif', category: 'happy-birthday' },
  { id: 'gif-7', title: 'Gamer Rage Smash Keyboard', url: 'https://media.giphy.com/media/8vUEXZA2me7vnuUvrs/giphy.gif', previewUrl: 'https://media.giphy.com/media/8vUEXZA2me7vnuUvrs/200w.gif', category: 'gaming' },
  { id: 'gif-8', title: 'Victory Royale Celebration', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/200w.gif', category: 'gaming' },
];

// ── Anticeil Interactive Apps & Games ─────────────────────────────────────────
export const EXTENDED_ANTICEIL_APPS: AnticeilAppCatalogItem[] = [
  // ── 4 TOP PROMOTED BANNERS ──
  { id: 'wordle', title: 'Wordle', developer: 'The New York Times Games', group: 'Promoted', icon: '🟩', iconBg: 'bg-emerald-600', bannerGradient: 'bg-[#e3e3e1]', description: 'Play Wordle from New York Times Games together! Tebak 5 huruf tersembunyi.' },
  { id: 'magic-garden', title: 'Magic Garden', developer: 'Bloom Studio', group: 'Promoted', icon: '🎃', iconBg: 'bg-amber-500', bannerGradient: 'from-amber-600 via-orange-700 to-indigo-950', description: 'Garden with friends! Tanam labu ajaib, buah bintang dan panen bersama tim.' },
  { id: 'farm-merge-valley', title: 'Farm Merge Valley', developer: 'Zynga & CoolGames', group: 'Promoted', icon: '🌽', iconBg: 'bg-sky-600', bannerGradient: 'from-pink-600 via-purple-700 to-indigo-950', description: 'Gabungkan tanaman, ternak ayam dan kembangkan pedesaan bersama teman.' },
  { id: 'watch-together', title: 'Watch Together', developer: 'YouTube', group: 'Promoted', icon: '▶️', iconBg: 'bg-red-600', bannerGradient: 'bg-white', description: 'Tonton video YouTube bersama rekan secara sinkron realtime tanpa delay.' },

  // ── PUZZLE GAMES ──
  { id: 'daily-word-wheel', title: 'Daily Word Wheel', developer: 'Words with Friends', group: 'Puzzle Games', icon: '🔤', iconBg: 'bg-blue-600', description: 'From the makers of Words with Friends, enjoy a daily word puzzle wheel with your friends.' },
  { id: 'daily-word-griddle', title: 'Daily Word Griddle', developer: 'Words with Friends', group: 'Puzzle Games', icon: '🧇', iconBg: 'bg-amber-600', description: 'From the makers of Words With Friends, enjoy an all new daily griddle challenge.' },
  { id: 'hex-puzzle-adventure', title: 'Hex Puzzle Adventure', developer: 'Hex Puzzle Studio', group: 'Puzzle Games', icon: '⬢', iconBg: 'bg-purple-600', description: 'A hex stacking puzzle game. Use strategic thinking to solve the hexagonal puzzle board.' },
  { id: 'daily-sudoku-together', title: 'Daily Sudoku Together', developer: 'BrainGames Inc.', group: 'Puzzle Games', icon: '🔢', iconBg: 'bg-cyan-600', description: 'Collaborative Sudoku session together in real-time voice channel.' },

  // ── CARD GAMES ──
  { id: 'poker-night', title: 'Poker Night', developer: 'Anticeil Games', group: 'Card Games', icon: '🃏', iconBg: 'bg-indigo-600', description: "A Texas hold 'em style card game where you can prove your Poker skills to friends." },
  { id: 'blazing-8s', title: 'Blazing 8s', developer: 'Crazy Eights Online', group: 'Card Games', icon: '🎴', iconBg: 'bg-emerald-600', description: 'Be the first to zero cards by swapping hands, skipping players, and dropping wild 8s.' },
  { id: 'blackjack', title: 'Blackjack', developer: 'Casino Royale', group: 'Card Games', icon: '♠️', iconBg: 'bg-red-700', description: 'The first visual Blackjack game. Play with up to 8 people at the dealer table.' },
  { id: 'erth-poker', title: 'ERTH Poker', developer: 'ERTH Gaming', group: 'Card Games', icon: '♥️', iconBg: 'bg-pink-600', description: 'High-stakes multiplayer Texas Holdem poker tournament room with live voice chat.' },

  // ── PRODUCTIVITY & DEV ──
  { id: 'virtual-fisher', title: 'Virtual Fisher', developer: 'Fishing Club Inc.', group: 'Productivity & Dev', icon: '🎣', iconBg: 'bg-cyan-500', description: 'Virtual Fisher is a game you can play in your server focused on catching rare fish.' },
  { id: 'whiteboard', title: 'Jamspace Whiteboard', developer: 'Anticeil Native', group: 'Productivity & Dev', icon: '🎨', iconBg: 'bg-blue-600', description: 'Papan tulis kolaboratif realtime untuk sketching arsitektur sistem dan wireframing.' },
  { id: 'code-runner', title: 'Dev Scratchpad & Tester', developer: 'Anticeil DevTools', group: 'Productivity & Dev', icon: '💻', iconBg: 'bg-zinc-800', description: 'Editor JavaScript realtime & JSON validator dengan live console output di panggung.' },
  { id: 'flow-canvas', title: 'Anticeil Flow Builder', developer: 'Anticeil Native', group: 'Productivity & Dev', icon: '⚡', iconBg: 'bg-purple-600', description: 'Simulasikan alur webhook, workflow, dan AI agent secara realtime bersama tim.' },
];

// ── Backward-compatible Aliases ──────────────────────────────────────────────
export type DiscordEmoji = AnticeilEmoji;
export type DiscordSticker = AnticeilSticker;
export type DiscordGifCategory = AnticeilGifCategory;
export type DiscordGifItem = AnticeilGifItem;
export type DiscordAppCatalogItem = AnticeilAppCatalogItem;

export const DISCORD_EMOJI_SERVERS = ANTICEIL_EMOJI_SERVERS;
export const DISCORD_EMOJIS = ANTICEIL_EMOJIS;
export const DISCORD_STICKERS = ANTICEIL_STICKERS;
export const DISCORD_GIF_CATEGORIES = ANTICEIL_GIF_CATEGORIES;
export const DISCORD_GIF_ITEMS = ANTICEIL_GIF_ITEMS;
export const EXTENDED_DISCORD_APPS = EXTENDED_ANTICEIL_APPS;
