import React from 'react';
import { ANTICEIL_LOGO_PATH } from '@/components/ui/anticeil-logo';
import { cn } from '@/lib/utils';

export interface AppIconDefinition {
  id: string;
  name: string;
  tier: 'free' | 'pollen' | 'nectar' | 'royal';
  badge?: string;
  isLimitedTime?: boolean;
}

export const APP_ICON_LIST: AppIconDefinition[] = [
  // 1. Classic & Brand Base
  { id: 'classic', name: 'Classic Cyan', tier: 'free' },
  { id: 'blurple', name: 'Blurple Heritage', tier: 'free' },
  { id: 'monochrome', name: 'Clean Minimalist', tier: 'free' },
  { id: 'stealth', name: 'Stealth Obsidian', tier: 'free' },

  // 2. Pollen Tier
  { id: 'crt', name: 'CRT Retro Glitch', tier: 'pollen' },
  { id: 'manga', name: 'Manga Speed Lines', tier: 'pollen' },
  { id: 'camo', name: 'Tactical Camo', tier: 'pollen' },
  { id: 'sakura', name: 'Sakura Blossom', tier: 'pollen' },

  // 3. Nectar Tier
  { id: 'vice_city', name: 'Vice City 2026', tier: 'nectar', badge: '20D LEFT', isLimitedTime: true },
  { id: 'synthwave', name: '80s Synthwave', tier: 'nectar' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', tier: 'nectar' },
  { id: 'galaxy', name: 'Galaxy Nebula', tier: 'nectar' },
  { id: 'holo', name: 'Holographic Chrome', tier: 'nectar' },
  { id: 'gamer', name: 'Neon Gamer Headset', tier: 'nectar' },
  { id: 'matrix', name: 'Matrix Digital Rain', tier: 'nectar' },
  { id: 'magma', name: 'Molten Magma', tier: 'nectar' },
  { id: 'swirl', name: 'Psychedelic Swirl', tier: 'nectar' },
  { id: 'pride', name: 'Rainbow Pride', tier: 'nectar' },
  { id: 'cotton_candy', name: 'Cotton Candy Dream', tier: 'nectar' },
  { id: 'pirate', name: 'Pirate Deck', tier: 'nectar' },

  // 4. Royal Tier
  { id: 'gold', name: 'Gold Prestige 👑', tier: 'royal' },
  { id: 'demon', name: 'Crimson Demon 👑', tier: 'royal' },
];

export function getAppIconConfig(id: string): AppIconDefinition {
  return APP_ICON_LIST.find((item) => item.id === id) || APP_ICON_LIST[0];
}

export interface AnticeilAppIconProps {
  iconId?: string;
  className?: string;
  rounded?: string;
  size?: number | string;
}

/**
 * AnticeilAppIcon
 *
 * Renders the Anticeil insect/geometric logo (ANTICEIL_LOGO_PATH) styled
 * across 22+ Discord-parity aesthetic themes.
 */
export function AnticeilAppIcon({
  iconId = 'classic',
  className,
  rounded = 'rounded-xl',
}: AnticeilAppIconProps) {
  const normalizedId = iconId.toLowerCase();

  switch (normalizedId) {
    case 'blurple':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#5865F2] shadow-sm',
            rounded,
            className,
          )}
        >
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none drop-shadow-sm">
            <path d={ANTICEIL_LOGO_PATH} fill="#ffffff" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'monochrome':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-zinc-100 border border-zinc-300 shadow-sm',
            rounded,
            className,
          )}
        >
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none">
            <path d={ANTICEIL_LOGO_PATH} fill="#18181b" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'stealth':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#111214] border border-zinc-800 shadow-inner',
            rounded,
            className,
          )}
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '4px 4px',
          }}
        >
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#3f3f46" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'manga':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-black border border-white/20 shadow-md',
            rounded,
            className,
          )}
        >
          {/* Radial Manga Speed Lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
            viewBox="0 0 100 100"
          >
            <polygon points="50,50 0,0 20,0" fill="#ffffff" opacity="0.3" />
            <polygon points="50,50 40,0 60,0" fill="#ffffff" opacity="0.35" />
            <polygon points="50,50 80,0 100,0" fill="#ffffff" opacity="0.3" />
            <polygon points="50,50 100,20 100,40" fill="#ffffff" opacity="0.35" />
            <polygon points="50,50 100,60 100,80" fill="#ffffff" opacity="0.3" />
            <polygon points="50,50 100,100 80,100" fill="#ffffff" opacity="0.35" />
            <polygon points="50,50 60,100 40,100" fill="#ffffff" opacity="0.3" />
            <polygon points="50,50 20,100 0,100" fill="#ffffff" opacity="0.35" />
            <polygon points="50,50 0,80 0,60" fill="#ffffff" opacity="0.3" />
            <polygon points="50,50 0,40 0,20" fill="#ffffff" opacity="0.35" />
          </svg>
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] relative z-10 select-none drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#ffffff" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'crt':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#041208] border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
            rounded,
            className,
          )}
        >
          {/* Phosphor CRT Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16, 185, 129, 0.4) 3px)',
            }}
          />
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] relative z-10 select-none drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#4ade80" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'camo':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#283618] border border-[#606c38] shadow-sm',
            rounded,
            className,
          )}
        >
          {/* Military Camouflage Patches */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-70" viewBox="0 0 60 60">
            <path d="M0,0 Q15,25 35,10 Q50,0 60,15 L60,0 Z" fill="#606c38" />
            <path d="M10,40 Q25,20 45,35 Q60,50 50,60 L20,60 Z" fill="#3a4f27" />
            <path d="M35,15 Q55,25 40,45 Q20,35 35,15 Z" fill="#785934" />
          </svg>
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] relative z-10 select-none drop-shadow-sm">
            <path d={ANTICEIL_LOGO_PATH} fill="#d9f99d" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'sakura':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-br from-pink-300 via-rose-300 to-pink-400 border border-pink-200 shadow-sm',
            rounded,
            className,
          )}
        >
          {/* Sakura Petals */}
          <span className="absolute top-1 left-1.5 text-[9px] opacity-70 pointer-events-none">🌸</span>
          <span className="absolute bottom-1 right-1.5 text-[9px] opacity-70 pointer-events-none">🌸</span>
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none drop-shadow-xs relative z-10">
            <path d={ANTICEIL_LOGO_PATH} fill="#ffffff" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'vice_city':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-b from-[#831843] via-[#db2777] to-[#ea580c] border border-pink-400/50 shadow-md',
            rounded,
            className,
          )}
        >
          {/* Palm tree silhouettes on sides */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
            <path d="M10,100 Q15,70 12,50 Q10,35 15,25 Q18,30 20,40 Q25,30 30,35 Q25,45 20,55 Q22,75 25,100 Z" fill="#000000" />
            <path d="M90,100 Q85,75 88,60 Q90,45 84,35 Q82,40 80,48 Q75,38 70,42 Q75,52 80,62 Q78,80 75,100 Z" fill="#000000" />
          </svg>
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-[0_2px_8px_rgba(255,255,255,0.7)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#ffffff" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'synthwave':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-b from-[#2e0854] via-[#701a75] to-[#f97316] border border-cyan-400/40 shadow-[0_0_12px_rgba(236,72,153,0.3)]',
            rounded,
            className,
          )}
        >
          {/* Wireframe Grid Floor at Bottom */}
          <div
            className="absolute bottom-0 inset-x-0 h-4 pointer-events-none opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(6,182,212,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.6) 1px, transparent 1px)',
              backgroundSize: '6px 3px',
              perspective: '40px',
              transform: 'rotateX(45deg)',
            }}
          />
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]"
          >
            <defs>
              <linearGradient id="synthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
            <path d={ANTICEIL_LOGO_PATH} fill="url(#synthGrad)" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'cyberpunk':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#facc15] border-2 border-black shadow-md',
            rounded,
            className,
          )}
        >
          {/* High-voltage hazard caution stripes */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 6px, transparent 6px, transparent 12px)',
            }}
          />
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-md">
            <path d={ANTICEIL_LOGO_PATH} fill="#09090b" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'galaxy':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-b from-[#0b032d] via-[#1e084a] to-[#4c0519] border border-purple-500/40 shadow-sm',
            rounded,
            className,
          )}
        >
          {/* Stars */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" viewBox="0 0 100 100">
            <circle cx="15" cy="20" r="1.5" fill="#ffffff" />
            <circle cx="85" cy="25" r="1" fill="#67e8f9" />
            <circle cx="30" cy="75" r="1.2" fill="#ffffff" />
            <circle cx="75" cy="80" r="1.8" fill="#f472b6" />
            <circle cx="50" cy="15" r="0.8" fill="#ffffff" />
          </svg>
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-[0_0_8px_rgba(192,132,252,0.9)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#e9d5ff" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'holo':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-tr from-slate-300 via-indigo-200 to-rose-200 border border-white/60 shadow-md',
            rounded,
            className,
          )}
        >
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none drop-shadow-sm">
            <defs>
              <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path d={ANTICEIL_LOGO_PATH} fill="url(#holoGrad)" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'gamer':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#0d1117] border border-emerald-500/50 shadow-md',
            rounded,
            className,
          )}
        >
          {/* Neon Headset frame arc */}
          <div className="absolute top-1 inset-x-2 h-4 border-t-2 border-emerald-400 rounded-t-full pointer-events-none drop-shadow-[0_0_4px_#34d399]" />
          <div className="absolute top-3 left-1 size-2 rounded-full bg-emerald-400 drop-shadow-[0_0_4px_#34d399]" />
          <div className="absolute top-3 right-1 size-2 rounded-full bg-emerald-400 drop-shadow-[0_0_4px_#34d399]" />
          <svg
            viewBox="0 0 516 756"
            className="w-[58%] h-[58%] select-none relative z-10 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#a7f3d0" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'matrix':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-black border border-emerald-600/60 shadow-md',
            rounded,
            className,
          )}
        >
          {/* Vertical Matrix Code Traces */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(16,185,129,0.2) 0px, transparent 4px, transparent 10px)',
            }}
          />
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-[0_0_10px_rgba(16,185,129,1)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#10b981" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'magma':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-b from-[#450a0a] via-[#7f1d1d] to-[#c2410c] border border-amber-500/50 shadow-md',
            rounded,
            className,
          )}
        >
          {/* Embers */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom,rgba(245,158,11,0.4)_0%,transparent_70%)]" />
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]"
          >
            <defs>
              <linearGradient id="magmaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            <path d={ANTICEIL_LOGO_PATH} fill="url(#magmaGrad)" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'swirl':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-br from-violet-900 via-fuchsia-800 to-indigo-950 border border-purple-400/40 shadow-sm',
            rounded,
            className,
          )}
        >
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none drop-shadow-md">
            <path d={ANTICEIL_LOGO_PATH} fill="#f5d0fe" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'pride':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-b from-red-500 via-yellow-400 via-emerald-500 to-violet-600 shadow-md',
            rounded,
            className,
          )}
        >
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none drop-shadow-md">
            <path d={ANTICEIL_LOGO_PATH} fill="#ffffff" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'cotton_candy':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-tr from-sky-300 via-purple-300 to-pink-300 border border-white/40 shadow-sm',
            rounded,
            className,
          )}
        >
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none drop-shadow-sm">
            <path d={ANTICEIL_LOGO_PATH} fill="#ffffff" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'pirate':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#451a03] border border-[#78350f] shadow-sm',
            rounded,
            className,
          )}
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #291002, #291002 6px, #451a03 7px, #451a03 14px)',
          }}
        >
          {/* Eyepatch strap on logo */}
          <div className="absolute top-[38%] left-1 right-1 h-0.5 bg-black rotate-[-15deg] pointer-events-none z-20" />
          <svg viewBox="0 0 516 756" className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-md">
            <path d={ANTICEIL_LOGO_PATH} fill="#fef3c7" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'gold':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-linear-to-br from-amber-600 via-yellow-400 to-amber-700 border-2 border-yellow-200/80 shadow-[0_0_12px_rgba(234,179,8,0.4)]',
            rounded,
            className,
          )}
        >
          {/* Radiant Shimmer overlay */}
          <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-[0_2px_6px_rgba(113,63,18,0.7)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#ffffff" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'demon':
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#180305] border border-red-600/70 shadow-[0_0_14px_rgba(220,38,38,0.4)]',
            rounded,
            className,
          )}
        >
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none relative z-10 drop-shadow-[0_0_10px_rgba(239,68,68,1)]"
          >
            <path d={ANTICEIL_LOGO_PATH} fill="#ef4444" fillRule="evenodd" />
          </svg>
        </div>
      );

    case 'classic':
    default:
      return (
        <div
          className={cn(
            'relative overflow-hidden flex items-center justify-center bg-[#111214] border border-primary/40 shadow-[0_0_12px_rgba(2,111,228,0.25)]',
            rounded,
            className,
          )}
        >
          <svg
            viewBox="0 0 516 756"
            className="w-[62%] h-[62%] select-none drop-shadow-[0_2px_8px_rgba(2,111,228,0.5)]"
          >
            <defs>
              <linearGradient id="classicCyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#004AFF" />
                <stop offset="40%" stopColor="#0064FF" />
                <stop offset="70%" stopColor="#00CFFF" />
                <stop offset="100%" stopColor="#08FBFF" />
              </linearGradient>
            </defs>
            <path d={ANTICEIL_LOGO_PATH} fill="url(#classicCyanGrad)" fillRule="evenodd" />
          </svg>
        </div>
      );
  }
}
