import React from 'react';
import { cn } from '@/lib/utils';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import { AvatarDecorationRenderer } from '@/features/profile/components/avatar-decoration-renderer';

export interface AnticeilAvatarMannequinProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  avatarUrl?: string | null;
  statusDot?: boolean;
  statusColor?: string;
  decorationId?: string | null;
  useGradientLogo?: boolean;
  alt?: string;
}

const SIZE_CONFIGS = {
  xs: {
    container: 'size-6',
    logo: 'size-3.5',
    dot: 'size-2 -bottom-0.5 -right-0.5 border',
  },
  sm: {
    container: 'size-7',
    logo: 'size-4',
    dot: 'size-2.5 -bottom-0.5 -right-0.5 border-[1.5px]',
  },
  md: {
    container: 'size-9 sm:size-10',
    logo: 'size-5 sm:size-5.5',
    dot: 'size-3 -bottom-0.5 -right-0.5 border-2',
  },
  lg: {
    container: 'size-12 sm:size-14',
    logo: 'size-6.5 sm:size-7',
    dot: 'size-3.5 -bottom-0.5 -right-0.5 border-2',
  },
  xl: {
    container: 'size-20 sm:size-24',
    logo: 'size-10 sm:size-12',
    dot: 'size-5 -bottom-1 -right-1 border-2',
  },
};

/**
 * Reusable Anticeil Mannequin Avatar
 * Mirrors Discord Clyde mannequin avatar with Anticeil Geometric Logo.
 * Provides consistent styling across Shop, Profile Dialogs, Nameplates, and Upload modals.
 */
export const AnticeilAvatarMannequin: React.FC<AnticeilAvatarMannequinProps> = ({
  className,
  size = 'md',
  avatarUrl,
  statusDot = false,
  statusColor = '#23a55a',
  decorationId,
  useGradientLogo = false,
  alt = 'Anticeil Mannequin',
}) => {
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs select-none',
        config.container,
        className
      )}
    >
      {/* Inner avatar circular clipping with dark Discord/Anticeil surface */}
      <div className="size-full rounded-full overflow-hidden bg-[#2b2d31] border border-black/40 flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt={alt} className="size-full object-cover" />
        ) : (
          <div className={cn('text-muted-foreground/60 flex items-center justify-center pointer-events-none select-none', config.logo)}>
            <AnticeilLogo className="size-full fill-current" useGradient={useGradientLogo} />
          </div>
        )}
      </div>

      {/* Online Status Dot */}
      {statusDot && (
        <div
          style={{ backgroundColor: statusColor }}
          className={cn(
            'absolute rounded-full border-[#111214] z-20 pointer-events-none',
            config.dot
          )}
        />
      )}

      {/* Optional Overlaid Avatar Decoration */}
      {decorationId && decorationId !== 'none' && (
        <AvatarDecorationRenderer decorationId={decorationId} />
      )}
    </div>
  );
};
