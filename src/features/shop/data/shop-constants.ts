import React from 'react';
import {
  Video,
  Palette,
  Crown,
  Gamepad2,
  Sparkles,
} from 'lucide-react';

// Discord-style 1:1 Filter Definitions
export const ITEM_TYPE_OPTIONS = [
  { id: 'avatar_decoration', label: 'Avatar Decorations' },
  { id: 'nameplate', label: 'Nameplates' },
  { id: 'profile_effect', label: 'Profile Effects' },
  { id: 'bundle', label: 'Bundles' },
];

export const COLOR_OPTIONS = [
  { id: 'purple', label: 'Purple', hex: '#8b5cf6', keywords: ['purple', 'violet', 'magenta', 'indigo', 'ungu'] },
  { id: 'blue', label: 'Blue', hex: '#3b82f6', keywords: ['blue', 'cyan', 'azure', 'biru', 'sian', 'neon', 'aurora'] },
  { id: 'green', label: 'Green', hex: '#22c55e', keywords: ['green', 'emerald', 'mint', 'hijau', 'zamrud', 'forest'] },
  { id: 'brown', label: 'Brown', hex: '#92400e', keywords: ['brown', 'amber', 'bronze', 'cokelat', 'wood'] },
  { id: 'yellow', label: 'Yellow', hex: '#eab308', keywords: ['yellow', 'gold', 'kuning', 'emas', 'sun', 'starlight'] },
  { id: 'orange', label: 'Orange', hex: '#f97316', keywords: ['orange', 'sunset', 'oranye', 'fire', 'api'] },
  { id: 'red', label: 'Red', hex: '#ef4444', keywords: ['red', 'crimson', 'ruby', 'merah', 'blood', 'rose'] },
  { id: 'pink', label: 'Pink', hex: '#ec4899', keywords: ['pink', 'sakura', 'merah muda', 'blush', 'cozy'] },
  { id: 'white', label: 'White', hex: '#f8fafc', keywords: ['white', 'putih', 'silver', 'pearl', 'clear', 'light'] },
  { id: 'dark', label: 'Dark / Black', hex: '#18181b', keywords: ['dark', 'black', 'obsidian', 'void', 'gelap', 'hitam', 'shadow', 'matrix', 'cyber'] },
];

export const THEME_OPTIONS = [
  { id: 'anime', label: 'Anime', icon: '🌸', keywords: ['anime', 'sakura', 'zen', 'manga', 'miyabi', 'kawaii'] },
  { id: 'gaming', label: 'Gaming', icon: '🎮', keywords: ['gaming', 'game', 'arcade', 'pixel', 'retro', '8bit'] },
  { id: 'cute_cozy', label: 'Cute & Cozy', icon: '☕', keywords: ['cute', 'cozy', 'sweet', 'warm', 'pastel'] },
  { id: 'sci_fi', label: 'Sci-Fi', icon: '🪐', keywords: ['sci-fi', 'cyber', 'void', 'matrix', 'neon', 'core', 'future'] },
  { id: 'food_drinks', label: 'Food & Drinks', icon: '🍔', keywords: ['food', 'drink', 'tea', 'boba', 'coffee'] },
  { id: 'fantasy', label: 'Fantasy', icon: '🧙', keywords: ['fantasy', 'magic', 'celestial', 'crown', 'astral', 'myth'] },
  { id: 'animals_pets', label: 'Animals & Pets', icon: '🐾', keywords: ['animal', 'pet', 'cat', 'dog', 'fox', 'bunny', 'bear'] },
  { id: 'nature', label: 'Nature', icon: '🍃', keywords: ['nature', 'forest', 'aurora', 'borealis', 'sakura', 'leaf', 'alam'] },
  { id: 'movies_tv', label: 'Movies & TV', icon: '🎬', keywords: ['movie', 'tv', 'cinema', 'show', 'film'] },
  { id: 'dark_moody', label: 'Dark & Moody', icon: '🥀', keywords: ['dark', 'moody', 'void', 'obsidian', 'night', 'shadow', 'gothic'] },
];

// Discord-style App Shops dropdown items (Anticeil Native Ecosystem)
export const APP_SHOPS_ITEMS = [
  { id: 'app_watch_together', name: 'YouTube Watch Together', icon: Video, tag: 'Video', query: 'watch together' },
  { id: 'app_jamspace', name: 'Jamspace Whiteboard', icon: Palette, tag: 'Board', query: 'whiteboard' },
  { id: 'app_chess', name: 'Anticeil Chess', icon: Crown, tag: 'Game', query: 'chess' },
  { id: 'app_wordle', name: 'Wordle Daily Party', icon: Gamepad2, tag: 'Game', query: 'wordle' },
  { id: 'app_trivia', name: 'Cyber Trivia Battle', icon: Gamepad2, tag: 'Game', query: 'trivia' },
  { id: 'app_cyber_core', name: 'Anticeil Cyber Core', icon: Sparkles, tag: 'Official', query: 'cyber' },
];
