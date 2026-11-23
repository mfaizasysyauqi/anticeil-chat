import React from 'react';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';

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

export function TradingViewIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return React.createElement(
    'svg',
    { className, viewBox: '0 4 24 16', fill: 'currentColor' },
    React.createElement('path', {
      d: 'M15.865 8.279a2.452 2.452 0 1 1-4.904 0a2.452 2.452 0 0 1 4.904 0M9.75 6H0v4.904h4.846v7.269H9.75Zm8.596 0H24l-5.106 12.173H13.24z',
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
  serverCount?: string;
  supportedLanguages?: string[];
  screenshots?: string[];
  overviewLong?: string;
  howToPlay?: string;
}

export type AnticeilAppDefinition = VoiceAppDefinition;
export type DiscordAppDefinition = VoiceAppDefinition;

export const VOICE_APPS: VoiceAppDefinition[] = [
  {
    id: 'anticeil-flow',
    title: 'Anticeil Flow',
    bannerTitle: 'ANTICEIL FLOW',
    developer: 'Anticeil Official',
    category: 'productivity',
    bannerGradient: 'from-blue-600 via-indigo-800 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1644088379091-d574269d422f?auto=format&fit=crop&w=1200&q=80',
    iconBg: 'bg-primary/10 border border-primary/20',
    iconColor: 'text-primary',
    icon: AnticeilLogo,
    tagline: 'Sistem otomasi alur kerja visual (n8n-style) & integrasi cerdas Anticeil...',
    description: 'Bangun dan orkestrasi otomasi alur kerja visual seperti n8n dengan trigger, action, dan webhook terintegrasi SSO Anticeil.',
    isRecent: true,
    isPromoted: true,
    badge: 'OFFICIAL',
    accentColor: '#2563eb',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/25 border-0',
    serverCount: 'Official Core',
    supportedLanguages: ['English, US', 'Bahasa Indonesia'],
    screenshots: [
      'https://images.unsplash.com/photo-1644088379091-d574269d422f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80',
    ],
    overviewLong: 'Anticeil Flow adalah sistem orkestrasi alur kerja visual (workflow automation) mirip n8n. Hubungkan berbagai webhook, pemicu (trigger), API eksternal, dan aksi (actions) secara otomatis dalam diagram alur visual node-based tanpa koding rumit, terhubung langsung melalui Single Sign-On (SSO) akun Anticeil Anda.',
    howToPlay: 'Klik Luncurkan atau Buka Flow untuk masuk ke canvas otomasi. Tambahkan node trigger, hubungkan dengan node action atau webhook, lalu aktifkan flow untuk mengeksekusi otomasi secara real-time.',
  },
  {
    id: 'watch-together',
    title: 'Watch Together',
    bannerTitle: 'WATCH TOGETHER',
    developer: 'YouTube',
    category: 'entertainment',
    bannerGradient: 'from-red-600 via-rose-700 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=1200&q=80',
    iconBg: 'bg-red-500/10 border border-red-500/20',
    iconColor: 'text-[#ff0000]',
    icon: YouTubeIcon,
    tagline: 'Tonton video YouTube bersama...',
    description: 'Nikmati video YouTube, playlist, musik, dan livestream bersama seluruh anggota panggilan secara sinkron tanpa jeda waktu.',
    isRecent: true,
    isPromoted: true,
    badge: 'POPULER',
    accentColor: '#ef4444',
    buttonClass: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md shadow-red-600/25 border-0',
    serverCount: 'In 787K colonies',
    supportedLanguages: ['English, US', 'Bahasa Indonesia'],
    screenshots: [
      'https://images.unsplash.com/photo-1540655037529-dec987208707?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=1200&q=80',
    ],
    overviewLong: 'Watch Together adalah sarana kolaboratif untuk menonton video dan livestream YouTube bersama orang lain secara real-time. Di Watch Together, semua peserta dapat berpartisipasi menyusun antrean playlist video bersama dengan sinkronisasi otomatis.',
    howToPlay: 'Cari judul video atau paste link YouTube di kolom pencarian. Tambahkan video ke antrean bersama, dan nikmati sinkronisasi pemutaran video secara instan.',
  },
  {
    id: 'tradingview',
    title: 'TradingView Charts',
    bannerTitle: 'TRADINGVIEW',
    developer: 'TradingView (Open Source)',
    category: 'productivity',
    bannerGradient: 'from-blue-600 via-indigo-700 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    iconBg: 'bg-[#1e222d] border border-sky-500/30',
    iconColor: 'text-[#2962ff]',
    icon: TradingViewIcon,
    tagline: 'Grafik pasar finansial & kripto realtime...',
    description: 'Analisis teknikal, candlestick chart, indikator MA & volume realtime untuk Crypto, Saham, dan Forex menggunakan TradingView Lightweight Charts resmi (Lisensi Open-Source Apache 2.0).',
    isRecent: true,
    isPromoted: true,
    badge: 'OPEN SOURCE',
    accentColor: '#2962ff',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/25 border-0',
    serverCount: 'In 142K colonies',
    supportedLanguages: ['English, US', 'Bahasa Indonesia'],
    screenshots: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1200&q=80',
    ],
    overviewLong: 'Platform charting finansial interaktif yang ditenagai oleh TradingView Lightweight Charts. Analisis pergerakan pasar Kripto, Saham, dan Forex dengan candlestick multi-timeframe serta indikator teknikal (SMA, EMA, Volume).',
    howToPlay: 'Pilih pasangan aset pasar (BTC/USDT, ETH, Saham), ubah timeframe grafik, dan aktifkan indikator teknikal untuk analisis pergerakan harga.',
  },
  {
    id: 'chess',
    title: 'Anticeil Chess',
    bannerTitle: 'ANTICEIL CHESS',
    developer: 'Anticeil Native',
    category: 'game',
    bannerGradient: 'from-amber-700 via-stone-800 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1200&q=80',
    iconBg: 'bg-amber-500/10 border border-amber-500/20',
    iconColor: 'text-amber-400',
    icon: Crown,
    tagline: 'Main catur bersama lawan Bot atau teman...',
    description: 'Bermain catur interaktif di voice channel. Tantang teman satu colony atau asah strategi melawan Bot AI cerdas.',
    isRecent: true,
    isPromoted: true,
    badge: 'OFFICIAL',
    accentColor: '#f59e0b',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-md shadow-amber-600/25 border-0',
    serverCount: 'In 310K colonies',
    supportedLanguages: ['English, US', 'Bahasa Indonesia'],
    screenshots: [
      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1200&q=80',
    ],
    overviewLong: 'Papan catur interaktif realtime yang dapat dimainkan baik di dalam voice channel bersama rekan tim maupun secara mandiri. Dilengkapi sistem validasi langkah akurat dan mode tanding bot cerdas.',
    howToPlay: 'Geser bidak catur di atas papan sesuai aturan legal. Aktifkan Mode Bot AI untuk bermain solo atau bertanding dengan teman dalam room suara.',
  },
  {
    id: 'whiteboard',
    title: 'Jamspace Whiteboard',
    bannerTitle: 'JAMSPACE',
    developer: 'Anticeil Native',
    category: 'productivity',
    bannerGradient: 'from-blue-600 via-indigo-700 to-slate-950',
    bannerImage: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80',
    iconBg: 'bg-blue-500/10 border border-blue-500/20',
    iconColor: 'text-blue-400',
    icon: Palette,
    tagline: 'Papan tulis kolaboratif realtime...',
    description: 'Papan kanvas interaktif realtime untuk coret-coret skema arsitektur, diagram alur, wireframe, atau ide proyek baru bersama tim.',
    isRecent: true,
    isPromoted: true,
    badge: 'OFFICIAL',
    accentColor: '#3b82f6',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/25 border-0',
    serverCount: 'In 520K colonies',
    supportedLanguages: ['English, US', 'Bahasa Indonesia'],
    screenshots: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
    ],
    overviewLong: 'Papan kanvas tanpa batas berkecepatan tinggi untuk sketsa konsep desain, diagram alur sistem, coret-coret kreatif, dan brainstorming ide proyek bersama tim secara realtime.',
    howToPlay: 'Pilih kuas, bangun bentuk persegi/lingkaran, tulis teks catatan, dan undang tim Anda untuk menggambar bersama di kanvas tak terbatas.',
  },
  {
    id: 'screenshare',
    title: 'Share Screen',
    bannerTitle: 'SHARE SCREEN',
    developer: 'Anticeil Native',
    category: 'productivity',
    bannerGradient: 'from-violet-600 via-purple-700 to-zinc-950',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    iconBg: 'bg-violet-500/10 border border-violet-500/20',
    iconColor: 'text-violet-400',
    icon: ScreenShare,
    tagline: 'Berbagi layar komputer & presentasi...',
    description: 'Bagikan jendela aplikasi, tab browser, atau seluruh layar Anda dengan audio jernih dan latensi ultra-rendah untuk presentasi atau co-working.',
    isRecent: true,
    isPromoted: true,
    badge: 'OFFICIAL',
    accentColor: '#8b5cf6',
    buttonClass: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow-md shadow-violet-600/25 border-0',
    serverCount: 'In 950K colonies',
    supportedLanguages: ['English, US', 'Bahasa Indonesia'],
    screenshots: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    ],
    overviewLong: 'Fitur berbagi layar bawaan beresolusi tinggi dengan dukungan transmisi audio jernih dan frame rate lancar untuk demonstrasi produk, presentasi slide, atau kerja kolaboratif.',
    howToPlay: 'Pilih jendela atau layar yang ingin Anda presentasikan, atur resolusi dan frame rate, lalu mulai sesi siaran langsung kepada semua partisipan.',
  },
];

export const ANTICEIL_APPS = VOICE_APPS;
export const DISCORD_APPS = VOICE_APPS;
