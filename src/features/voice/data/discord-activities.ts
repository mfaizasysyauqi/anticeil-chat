import React from 'react';
import {
  Tv,
  Palette,
  Crown,
  ScreenShare,
} from 'lucide-react';

export interface DiscordAppDefinition {
  id: string;
  title: string;
  bannerTitle?: string;
  developer: string;
  category: 'game' | 'entertainment' | 'productivity' | 'dev';
  bannerGradient: string;
  bannerImage?: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
  tagline: string;
  description: string;
  isRecent?: boolean;
  isInServer?: boolean;
  isPromoted?: boolean;
  badge?: string;
  accentColor: string;
}

export const DISCORD_APPS: DiscordAppDefinition[] = [
  {
    id: 'watch-together',
    title: 'Watch Together',
    bannerTitle: 'WATCH TOGETHER',
    developer: 'YouTube',
    category: 'entertainment',
    bannerGradient: 'from-red-600 via-rose-700 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80',
    iconBg: 'bg-[#dc2626]',
    iconColor: 'text-white',
    icon: Tv,
    tagline: 'Tonton video YouTube bersama...',
    description: 'Nikmati video YouTube, playlist, musik, dan livestream bersama seluruh anggota panggilan secara sinkron tanpa jeda waktu.',
    isRecent: true,
    isPromoted: true,
    badge: 'POPULER',
    accentColor: '#ef4444',
  },
  {
    id: 'whiteboard',
    title: 'Jamspace Whiteboard',
    bannerTitle: 'JAMSPACE',
    developer: 'Anticeil Native',
    category: 'productivity',
    bannerGradient: 'from-blue-600 via-indigo-700 to-slate-950',
    bannerImage: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    iconBg: 'bg-[#2563eb]',
    iconColor: 'text-white',
    icon: Palette,
    tagline: 'Papan tulis kolaboratif realtime...',
    description: 'Papan kanvas interaktif realtime untuk coret-coret skema arsitektur, diagram alur, wireframe, atau ide proyek baru bersama tim.',
    isRecent: true,
    isPromoted: true,
    badge: 'OFFICIAL',
    accentColor: '#3b82f6',
  },
  {
    id: 'chess',
    title: 'Anticeil Chess',
    bannerTitle: 'ANTICEIL CHESS',
    developer: 'Anticeil Native',
    category: 'game',
    bannerGradient: 'from-amber-700 via-stone-800 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80',
    iconBg: 'bg-[#b45309]',
    iconColor: 'text-white',
    icon: Crown,
    tagline: 'Main catur bersama lawan Bot atau teman...',
    description: 'Bermain catur interaktif di voice channel. Tantang teman satu server atau asah strategi melawan Bot AI cerdas.',
    isRecent: true,
    isPromoted: true,
    badge: 'OFFICIAL',
    accentColor: '#f59e0b',
  },
  {
    id: 'screenshare',
    title: 'Share Screen',
    bannerTitle: 'SHARE SCREEN',
    developer: 'Anticeil Native',
    category: 'productivity',
    bannerGradient: 'from-violet-600 via-purple-700 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    iconBg: 'bg-[#7c3aed]',
    iconColor: 'text-white',
    icon: ScreenShare,
    tagline: 'Berbagi layar komputer & presentasi...',
    description: 'Bagikan jendela aplikasi, tab browser, atau seluruh layar Anda dengan audio jernih dan latensi ultra-rendah untuk presentasi atau co-working.',
    isRecent: true,
    isPromoted: true,
    badge: 'OFFICIAL',
    accentColor: '#8b5cf6',
  },
];
