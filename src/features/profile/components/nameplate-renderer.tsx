import React from 'react';
import { cn } from '@/lib/utils';

interface NameplateRendererProps {
  nameplateId?: string | null;
  className?: string;
}

export const NameplateRenderer: React.FC<NameplateRendererProps> = ({
  nameplateId,
  className,
}) => {
  if (!nameplateId || nameplateId === 'none') {
    return null;
  }

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden rounded-lg', className)}>
      {/* MANGA EYES */}
      {nameplateId === 'manga_eyes' && (
        <svg
          viewBox="0 0 300 50"
          preserveAspectRatio="xMaxYMid meet"
          className="absolute inset-0 size-full opacity-90"
        >
          {/* Halftone dot pattern overlay */}
          <pattern id="mangaDots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1" fill="#52525b" opacity="0.4" />
          </pattern>
          <rect width="300" height="50" fill="url(#mangaDots)" />
          {/* Manga dramatic eyes on right side */}
          <g transform="translate(180, 2) scale(0.9)">
            {/* Left eye */}
            <path
              d="M 10 26 Q 30 14 55 24 Q 35 34 10 26 Z"
              fill="#09090b"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <ellipse cx="32" cy="24" rx="8" ry="7" fill="#ffffff" />
            <ellipse cx="32" cy="24" rx="5" ry="5" fill="#09090b" />
            <circle cx="30" cy="22" r="2.5" fill="#ffffff" />
            {/* Eyelash sharp strokes */}
            <path d="M 12 24 L 6 18 M 25 16 L 22 10 M 45 18 L 52 12" stroke="#ffffff" strokeWidth="2" />

            {/* Right eye */}
            <path
              d="M 65 24 Q 85 14 110 26 Q 90 34 65 24 Z"
              fill="#09090b"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <ellipse cx="88" cy="24" rx="8" ry="7" fill="#ffffff" />
            <ellipse cx="88" cy="24" rx="5" ry="5" fill="#09090b" />
            <circle cx="86" cy="22" r="2.5" fill="#ffffff" />
            {/* Eyelash strokes */}
            <path d="M 70 18 L 65 12 M 90 16 L 92 10 M 105 22 L 112 16" stroke="#ffffff" strokeWidth="2" />
          </g>
          {/* Dynamic action speed lines */}
          <line x1="130" y1="10" x2="180" y2="20" stroke="#71717a" strokeWidth="1" strokeDasharray="6 4" />
          <line x1="140" y1="38" x2="185" y2="30" stroke="#71717a" strokeWidth="1" strokeDasharray="6 4" />
        </svg>
      )}

      {/* COSMIC BLUE NEBULA */}
      {nameplateId === 'cosmic_blue' && (
        <svg
          viewBox="0 0 300 50"
          preserveAspectRatio="xMaxYMid meet"
          className="absolute inset-0 size-full"
        >
          <defs>
            <radialGradient id="nebulaGlow" cx="80%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="50" fill="url(#nebulaGlow)" />
          {/* Swirling celestial arc */}
          <path
            d="M 120 45 Q 210 10 290 35"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            filter="drop-shadow(0 0 6px #00f0ff)"
            opacity="0.8"
          />
          {/* Twinkling star bursts */}
          <g transform="translate(250, 18)" filter="drop-shadow(0 0 4px #ffffff)">
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </g>
          <circle cx="210" cy="35" r="1.5" fill="#bae6fd" filter="drop-shadow(0 0 3px #00f0ff)" />
          <circle cx="280" cy="12" r="2" fill="#ffffff" />
        </svg>
      )}

      {/* PURPLE SINGULARITY */}
      {nameplateId === 'purple_singularity' && (
        <svg
          viewBox="0 0 300 50"
          preserveAspectRatio="xMaxYMid meet"
          className="absolute inset-0 size-full"
        >
          <defs>
            <radialGradient id="voidGlow" cx="85%" cy="50%" r="45%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#7e22ce" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="50" fill="url(#voidGlow)" />
          {/* Gravity vortex rings on the right */}
          <g transform="translate(255, 25)">
            <ellipse
              rx="32"
              ry="16"
              stroke="#a855f7"
              strokeWidth="2"
              fill="none"
              strokeDasharray="14 6"
              transform="rotate(-20)"
              filter="drop-shadow(0 0 6px #c084fc)"
            />
            <ellipse
              rx="20"
              ry="10"
              stroke="#e879f9"
              strokeWidth="1.5"
              fill="none"
              transform="rotate(15)"
            />
            <circle cx="0" cy="0" r="4" fill="#180424" stroke="#f0abfc" strokeWidth="1.5" />
          </g>
          <circle cx="190" cy="18" r="1.5" fill="#f5d0fe" />
          <circle cx="215" cy="38" r="2" fill="#e879f9" />
        </svg>
      )}

      {/* SHADOW HANDS */}
      {nameplateId === 'shadow_hands' && (
        <svg
          viewBox="0 0 300 50"
          preserveAspectRatio="xMaxYMid meet"
          className="absolute inset-0 size-full opacity-80"
        >
          {/* Silhouette eerie hands reaching from bottom */}
          <g fill="#09090b" stroke="#71717a" strokeWidth="1.5">
            {/* Hand 1 */}
            <path d="M 220 50 L 222 30 Q 224 16 228 12 Q 230 16 230 28 Q 233 12 236 8 Q 238 12 237 28 Q 241 14 244 11 Q 246 15 244 32 L 246 50 Z" />
            {/* Hand 2 */}
            <path d="M 260 50 L 262 26 Q 265 14 268 10 Q 270 14 270 24 Q 273 12 276 9 Q 278 13 277 24 Q 281 16 283 14 Q 285 18 284 34 L 286 50 Z" />
          </g>
          {/* Eerie smoke wisps */}
          <path
            d="M 180 40 Q 200 20 230 35 Q 260 15 285 30"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            fill="none"
            opacity="0.6"
          />
        </svg>
      )}

      {/* CYBER MATRIX GRID */}
      {nameplateId === 'cyber_grid' && (
        <svg
          viewBox="0 0 300 50"
          preserveAspectRatio="xMaxYMid meet"
          className="absolute inset-0 size-full"
        >
          {/* Perspective grid lines */}
          <line x1="140" y1="45" x2="300" y2="45" stroke="#14b8a6" strokeWidth="1.5" opacity="0.6" />
          <line x1="160" y1="35" x2="300" y2="35" stroke="#0d9488" strokeWidth="1" opacity="0.4" />
          <line x1="180" y1="25" x2="300" y2="25" stroke="#0f766e" strokeWidth="0.8" opacity="0.3" />
          {/* Perspective verticals */}
          <line x1="200" y1="50" x2="230" y2="15" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
          <line x1="240" y1="50" x2="260" y2="15" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
          <line x1="280" y1="50" x2="290" y2="15" stroke="#14b8a6" strokeWidth="1" opacity="0.5" />
          {/* Circuit node */}
          <circle cx="260" cy="22" r="3" fill="#2dd4bf" filter="drop-shadow(0 0 4px #2dd4bf)" />
          <path d="M 230 38 L 250 38 L 260 22" stroke="#2dd4bf" strokeWidth="1.5" fill="none" />
        </svg>
      )}

      {/* GOLDEN HONEYCOMB */}
      {nameplateId === 'golden_hive' && (
        <svg
          viewBox="0 0 300 50"
          preserveAspectRatio="xMaxYMid meet"
          className="absolute inset-0 size-full"
        >
          <g transform="translate(190, 8)" filter="drop-shadow(0 0 6px #f59e0b)">
            <polygon points="30,4 42,11 42,25 30,32 18,25 18,11" fill="#f59e0b" fillOpacity="0.25" stroke="#fbbf24" strokeWidth="1.5" />
            <polygon points="50,15 62,22 62,36 50,43 38,36 38,22" fill="#d97706" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />
            <polygon points="70,4 82,11 82,25 70,32 58,25 58,11" fill="#f59e0b" fillOpacity="0.25" stroke="#fbbf24" strokeWidth="1.5" />
            <polygon points="90,15 102,22 102,36 90,43 78,36 78,22" fill="#b45309" fillOpacity="0.2" stroke="#d97706" strokeWidth="1.5" />
          </g>
          <circle cx="210" cy="20" r="2" fill="#fef08a" />
          <circle cx="265" cy="14" r="1.5" fill="#fde047" />
        </svg>
      )}

      {/* CRIMSON VOLTAGE */}
      {nameplateId === 'crimson_neon' && (
        <svg
          viewBox="0 0 300 50"
          preserveAspectRatio="xMaxYMid meet"
          className="absolute inset-0 size-full"
        >
          <path
            d="M 170 30 L 210 16 L 225 24 L 265 10 L 285 20"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            filter="drop-shadow(0 0 8px #ef4444)"
          />
          <path
            d="M 210 38 L 240 28 L 270 34"
            stroke="#f87171"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <circle cx="265" cy="10" r="3" fill="#ffffff" filter="drop-shadow(0 0 4px #ef4444)" />
        </svg>
      )}
    </div>
  );
};
