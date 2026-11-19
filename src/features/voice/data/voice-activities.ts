import React from 'react';

export function YouTubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return React.createElement(
    'svg',
    { className, viewBox: '0 0 24 24', fill: 'none' },
    React.createElement('path', {
      d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z',
      fill: '#FF0000',
    }),
    React.createElement('polygon', {
      fill: '#FFFFFF',
      points: '9.545,15.568 15.818,12 9.545,8.432',
    })
  );
}

import {
  Tv,
  Palette,
  Crown,
  ScreenShare,
  Gamepad2,
  Sparkles,
} from 'lucide-react';

export interface VoiceAppDefinition {
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
  buttonClass?: string;
}

export type AnticeilAppDefinition = VoiceAppDefinition;
export type DiscordAppDefinition = VoiceAppDefinition;

export const VOICE_APPS: VoiceAppDefinition[] = [
  {
    id: 'watch-together',
    title: 'Watch Together',
    bannerTitle: 'WATCH TOGETHER',
    developer: 'YouTube',
    category: 'entertainment',
    bannerGradient: 'from-red-600 via-rose-700 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
    iconBg: 'bg-white',
    iconColor: 'text-white',
    icon: YouTubeIcon,
    tagline: 'Tonton video YouTube bersama...',
    description: 'Nikmati video YouTube, playlist, musik, dan livestream bersama seluruh anggota panggilan secara sinkron tanpa jeda waktu.',
    isRecent: true,
    isPromoted: true,
    badge: 'POPULER',
    accentColor: '#ef4444',
    buttonClass: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md shadow-red-600/25 border-0',
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
    buttonClass: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/25 border-0',
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
    description: 'Bermain catur interaktif di voice channel. Tantang teman satu colony atau asah strategi melawan Bot AI cerdas.',
    isRecent: true,
    isPromoted: true,
    badge: 'OFFICIAL',
    accentColor: '#f59e0b',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-md shadow-amber-600/25 border-0',
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
    buttonClass: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow-md shadow-violet-600/25 border-0',
  },
];

export const ANTICEIL_APPS = VOICE_APPS;
export const DISCORD_APPS = VOICE_APPS;
