import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarDecorationRendererProps {
  decorationId?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
}

export const AvatarDecorationRenderer: React.FC<AvatarDecorationRendererProps> = ({
  decorationId,
  className,
}) => {
  if (!decorationId || decorationId === 'none') {
    return null;
  }

  // If it's a direct image URL (from remote or upload)
  if (decorationId.startsWith('http') || decorationId.startsWith('data:image')) {
    return (
      <div className={cn('absolute -inset-[18%] size-[136%] pointer-events-none select-none z-20', className)}>
        <img
          src={decorationId}
          alt="Avatar Decoration"
          className="size-full object-contain filter drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
        />
      </div>
    );
  }

  // Pure SVG Animated Decorations
  return (
    <div
      className={cn(
        'absolute -inset-[18%] size-[136%] pointer-events-none select-none z-20 flex items-center justify-center',
        className
      )}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full overflow-visible"
      >
        {/* CYBER HEADSET */}
        {decorationId === 'cyber_headset' && (
          <g className="animate-pulse duration-1000">
            {/* Top Headband */}
            <path
              d="M 24 54 C 24 24, 96 24, 96 54"
              stroke="#00f0ff"
              strokeWidth="4"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px #00f0ff)"
            />
            <path
              d="M 30 50 C 30 29, 90 29, 90 50"
              stroke="#0077ff"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
            {/* Left Earcup */}
            <rect
              x="16"
              y="44"
              width="10"
              height="24"
              rx="5"
              fill="#0f172a"
              stroke="#00f0ff"
              strokeWidth="2.5"
              filter="drop-shadow(0 0 8px #00f0ff)"
            />
            <circle cx="21" cy="56" r="2.5" fill="#00f0ff" />
            {/* Right Earcup */}
            <rect
              x="94"
              y="44"
              width="10"
              height="24"
              rx="5"
              fill="#0f172a"
              stroke="#00f0ff"
              strokeWidth="2.5"
              filter="drop-shadow(0 0 8px #00f0ff)"
            />
            <circle cx="99" cy="56" r="2.5" fill="#00f0ff" />
            {/* Mic boom */}
            <path
              d="M 21 68 C 21 82, 38 86, 44 86"
              stroke="#00f0ff"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="45" cy="86" r="3" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)" />
          </g>
        )}

        {/* CYBERPUNK HUD _23 */}
        {decorationId === 'cyber_hud' && (
          <g>
            {/* Top-Left Bracket */}
            <path
              d="M 18 36 L 18 20 L 34 20"
              stroke="#ff007f"
              strokeWidth="3"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #ff007f)"
            />
            {/* Top-Right Bracket */}
            <path
              d="M 86 20 L 102 20 L 102 36"
              stroke="#ff007f"
              strokeWidth="3"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #ff007f)"
            />
            {/* Bottom-Right Bracket */}
            <path
              d="M 102 84 L 102 100 L 86 100"
              stroke="#ff007f"
              strokeWidth="3"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #ff007f)"
            />
            {/* Bottom-Left Bracket & _23 Badge */}
            <path
              d="M 34 100 L 18 100 L 18 84"
              stroke="#ff007f"
              strokeWidth="3"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #ff007f)"
            />
            {/* HUD Badge plate */}
            <rect
              x="12"
              y="68"
              width="26"
              height="16"
              rx="3"
              fill="#18041c"
              stroke="#ff007f"
              strokeWidth="1.5"
              filter="drop-shadow(0 0 6px #ff007f)"
            />
            <text
              x="25"
              y="80"
              fill="#00ffff"
              fontSize="9"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
              filter="drop-shadow(0 0 3px #00ffff)"
            >
              _23
            </text>
            {/* Crosshair telemetry dots */}
            <circle cx="60" cy="14" r="2" fill="#00ffff" />
            <circle cx="106" cy="60" r="1.5" fill="#ff007f" />
            <line x1="52" y1="14" x2="68" y2="14" stroke="#00ffff" strokeWidth="1" strokeDasharray="2 2" />
          </g>
        )}

        {/* TOXIC SKULL */}
        {decorationId === 'toxic_skull' && (
          <g>
            {/* Toxic bio mist aura */}
            <circle
              cx="60"
              cy="60"
              r="46"
              stroke="#84cc16"
              strokeWidth="2.5"
              strokeDasharray="8 6 14 4"
              strokeLinecap="round"
              filter="drop-shadow(0 0 10px #84cc16)"
              className="animate-spin"
              style={{ animationDuration: '8s' }}
            />
            {/* Glowing skull emblem on bottom-left */}
            <g transform="translate(14, 72) scale(0.7)" filter="drop-shadow(0 0 8px #a3e635)">
              <path
                d="M 16 4 C 8 4 2 10 2 18 C 2 24 6 28 8 30 L 8 36 L 24 36 L 24 30 C 26 28 30 24 30 18 C 30 10 24 4 16 4 Z"
                fill="#84cc16"
              />
              <circle cx="10" cy="16" r="3.5" fill="#14532d" />
              <circle cx="22" cy="16" r="3.5" fill="#14532d" />
              <line x1="12" y1="31" x2="12" y2="36" stroke="#14532d" strokeWidth="1.5" />
              <line x1="16" y1="31" x2="16" y2="36" stroke="#14532d" strokeWidth="1.5" />
              <line x1="20" y1="31" x2="20" y2="36" stroke="#14532d" strokeWidth="1.5" />
            </g>
            {/* Toxic sparks */}
            <circle cx="98" cy="38" r="2.5" fill="#bef264" filter="drop-shadow(0 0 4px #bef264)" />
            <circle cx="88" cy="88" r="2" fill="#a3e635" filter="drop-shadow(0 0 4px #a3e635)" />
            <circle cx="28" cy="32" r="2" fill="#bef264" />
          </g>
        )}

        {/* SAKURA BLOSSOM */}
        {decorationId === 'sakura' && (
          <g>
            {/* Soft pink petal ring */}
            <circle
              cx="60"
              cy="60"
              r="47"
              stroke="#f472b6"
              strokeWidth="2"
              strokeDasharray="6 8"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #f472b6)"
              className="animate-spin"
              style={{ animationDuration: '20s' }}
            />
            {/* Cherry Blossom Flowers */}
            {/* Top-Right Flower */}
            <g transform="translate(86, 20) scale(0.65)" filter="drop-shadow(0 0 6px #f472b6)">
              <circle cx="12" cy="12" r="4" fill="#fbbf24" />
              <circle cx="12" cy="4" r="5" fill="#fbcfe8" />
              <circle cx="20" cy="9" r="5" fill="#f472b6" />
              <circle cx="18" cy="18" r="5" fill="#fbcfe8" />
              <circle cx="6" cy="18" r="5" fill="#f472b6" />
              <circle cx="4" cy="9" r="5" fill="#fbcfe8" />
            </g>
            {/* Bottom-Left Flower */}
            <g transform="translate(14, 76) scale(0.55)" filter="drop-shadow(0 0 6px #f472b6)">
              <circle cx="12" cy="12" r="4" fill="#fbbf24" />
              <circle cx="12" cy="4" r="5" fill="#fbcfe8" />
              <circle cx="20" cy="9" r="5" fill="#f472b6" />
              <circle cx="18" cy="18" r="5" fill="#fbcfe8" />
              <circle cx="6" cy="18" r="5" fill="#f472b6" />
              <circle cx="4" cy="9" r="5" fill="#fbcfe8" />
            </g>
            {/* Top-Left Small Flower */}
            <g transform="translate(24, 24) scale(0.45)" filter="drop-shadow(0 0 4px #f472b6)">
              <circle cx="12" cy="12" r="4" fill="#fbbf24" />
              <circle cx="12" cy="4" r="5" fill="#fbcfe8" />
              <circle cx="20" cy="9" r="5" fill="#f472b6" />
              <circle cx="18" cy="18" r="5" fill="#fbcfe8" />
              <circle cx="6" cy="18" r="5" fill="#f472b6" />
              <circle cx="4" cy="9" r="5" fill="#fbcfe8" />
            </g>
          </g>
        )}

        {/* INFERNO FLAMES */}
        {decorationId === 'flame_aura' && (
          <g>
            {/* Animated flame base */}
            <path
              d="M 20 84 Q 28 60 40 76 Q 52 46 60 70 Q 68 38 80 72 Q 92 56 100 84 Q 60 114 20 84 Z"
              fill="url(#fireGradient)"
              opacity="0.85"
              filter="drop-shadow(0 0 12px #f97316)"
            />
            {/* Foreground lick flames */}
            <path
              d="M 32 86 Q 44 64 54 80 Q 62 52 70 80 Q 82 66 88 88 Q 60 108 32 86 Z"
              fill="url(#fireInnerGradient)"
              filter="drop-shadow(0 0 8px #fbbf24)"
            />
            <defs>
              <linearGradient id="fireGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="fireInnerGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="70%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            {/* Spark embers */}
            <circle cx="26" cy="50" r="1.5" fill="#fbbf24" />
            <circle cx="94" cy="46" r="2" fill="#f97316" />
            <circle cx="60" cy="30" r="2" fill="#fde047" />
          </g>
        )}

        {/* GOLDEN HIVE HALO */}
        {decorationId === 'gold_bee' && (
          <g filter="drop-shadow(0 0 8px #f59e0b)">
            {/* Honeycomb arch */}
            <path
              d="M 22 50 C 22 24, 98 24, 98 50"
              stroke="#f59e0b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Honeycomb hexagons */}
            <polygon points="60,12 66,16 66,24 60,28 54,24 54,16" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
            <polygon points="44,18 50,22 50,30 44,34 38,30 38,22" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            <polygon points="76,18 82,22 82,30 76,34 70,30 70,22" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            {/* Honey drop */}
            <path d="M 60 26 C 60 26, 64 33, 64 35 C 64 37, 62 39, 60 39 C 58 39, 56 37, 56 35 C 56 33, 60 26, 60 26 Z" fill="#fbbf24" />
          </g>
        )}

        {/* CELESTIAL WINGS */}
        {decorationId === 'angel_wings' && (
          <g filter="drop-shadow(0 0 8px #38bdf8)">
            {/* Left Wing */}
            <path
              d="M 30 54 C 10 40, 2 24, 6 12 C 14 18, 16 30, 24 38 C 18 28, 16 16, 26 18 C 28 26, 30 38, 34 46 Z"
              fill="#e0f2fe"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Right Wing */}
            <path
              d="M 90 54 C 110 40, 118 24, 114 12 C 106 18, 104 30, 96 38 C 102 28, 104 16, 94 18 C 92 26, 90 38, 86 46 Z"
              fill="#e0f2fe"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Divine halo circle above */}
            <ellipse cx="60" cy="16" rx="20" ry="5" stroke="#facc15" strokeWidth="2.5" fill="none" filter="drop-shadow(0 0 6px #facc15)" />
          </g>
        )}

        {/* GHOSTLY SMOKE */}
        {decorationId === 'ghost_smoke' && (
          <g className="animate-pulse duration-1000">
            <circle
              cx="60"
              cy="60"
              r="47"
              stroke="#e2e8f0"
              strokeWidth="3"
              strokeDasharray="16 10 24 8"
              strokeLinecap="round"
              filter="drop-shadow(0 0 10px #ffffff)"
              className="animate-spin"
              style={{ animationDuration: '14s' }}
            />
            <path
              d="M 28 88 Q 14 60 30 40 Q 20 20 46 22 Q 80 12 92 34 Q 108 58 88 84 Q 60 102 28 88 Z"
              stroke="#cbd5e1"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
              filter="drop-shadow(0 0 6px #ffffff)"
            />
          </g>
        )}

        {/* PLASMA ELECTRIC RING */}
        {decorationId === 'electric_ring' && (
          <g>
            <circle
              cx="60"
              cy="60"
              r="46"
              stroke="#00ffff"
              strokeWidth="2.5"
              filter="drop-shadow(0 0 8px #00ffff)"
            />
            {/* Jagged Lightning bolts */}
            <path
              d="M 60 12 L 64 22 L 58 24 L 62 34"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px #38bdf8)"
            />
            <path
              d="M 106 58 L 96 62 L 98 68 L 88 70"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px #38bdf8)"
            />
            <path
              d="M 14 62 L 24 58 L 22 52 L 32 50"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px #38bdf8)"
            />
            <circle cx="60" cy="106" r="2.5" fill="#00ffff" filter="drop-shadow(0 0 4px #00ffff)" />
          </g>
        )}

        {/* GALAXY VORTEX */}
        {decorationId === 'galaxy_vortex' && (
          <g>
            <circle
              cx="60"
              cy="60"
              r="47"
              stroke="#a855f7"
              strokeWidth="3.5"
              strokeDasharray="22 12 8 10"
              strokeLinecap="round"
              filter="drop-shadow(0 0 10px #c084fc)"
              className="animate-spin"
              style={{ animationDuration: '10s' }}
            />
            <circle
              cx="60"
              cy="60"
              r="44"
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="12 6"
              opacity="0.8"
            />
            {/* Stars */}
            <circle cx="86" cy="30" r="2" fill="#ffffff" filter="drop-shadow(0 0 4px #ffffff)" />
            <circle cx="34" cy="84" r="2.5" fill="#f472b6" filter="drop-shadow(0 0 4px #f472b6)" />
            <circle cx="98" cy="74" r="1.5" fill="#c084fc" />
          </g>
        )}

        {/* CRIMSON ANGER */}
        {decorationId === 'rage_veins' && (
          <g>
            {/* Top right anger mark 💢 */}
            <g transform="translate(80, 16) scale(0.9)" filter="drop-shadow(0 0 8px #ef4444)">
              <path
                d="M 4 8 C 10 4 14 4 20 8 M 4 16 C 10 20 14 20 20 16 M 8 4 C 4 10 4 14 8 20 M 16 4 C 20 10 20 14 16 20"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* Crimson pulse circle */}
            <circle
              cx="60"
              cy="60"
              r="47"
              stroke="#dc2626"
              strokeWidth="2"
              strokeDasharray="4 8 16 6"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #dc2626)"
            />
            {/* Bottom left stress mark */}
            <g transform="translate(18, 78) scale(0.7)" filter="drop-shadow(0 0 6px #ef4444)">
              <path
                d="M 4 8 C 10 4 14 4 20 8 M 4 16 C 10 20 14 20 20 16 M 8 4 C 4 10 4 14 8 20 M 16 4 C 20 10 20 14 16 20"
                stroke="#f87171"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>
        )}

        {/* MYSTICAL CYAN FIRE */}
        {decorationId === 'mystic_fire' && (
          <g>
            <path
              d="M 24 88 Q 36 64 48 80 Q 56 46 64 78 Q 74 58 84 84 Q 96 68 100 88 Q 60 110 24 88 Z"
              fill="url(#cyanFlameGradient)"
              opacity="0.85"
              filter="drop-shadow(0 0 10px #06b6d4)"
            />
            <defs>
              <linearGradient id="cyanFlameGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#0891b2" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
            </defs>
            <circle cx="34" cy="54" r="2" fill="#67e8f9" />
            <circle cx="88" cy="50" r="2" fill="#22d3ee" />
          </g>
        )}

        {/* SILVER BLADE RING */}
        {decorationId === 'silver_blade' && (
          <g filter="drop-shadow(0 0 6px #94a3b8)">
            <circle
              cx="60"
              cy="60"
              r="47"
              stroke="#cbd5e1"
              strokeWidth="3.5"
              strokeDasharray="2 6"
              strokeLinecap="round"
            />
            {/* Spiked blades on perimeter */}
            <polygon points="60,8 64,16 56,16" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
            <polygon points="60,112 64,104 56,104" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
            <polygon points="8,60 16,64 16,56" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
            <polygon points="112,60 104,64 104,56" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
          </g>
        )}
      </svg>
    </div>
  );
};
