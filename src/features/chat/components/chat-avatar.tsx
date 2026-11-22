import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getColonyInitials } from '@/features/colonies/components/colony-icon';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ChatAvatarProps {
  name: string;
  email?: string;
  imageUrl?: string | null;
  size?: number;
  status?: 'online' | 'idle' | 'offline' | 'dnd';
  className?: string;
  showStatus?: boolean;
  tooltipText?: string;
  variant?: 'circle' | 'squircle';
  isActive?: boolean;
}

// Generate consistent modern gradient background for names
function getInitialsGradient(name: string): { bg: string; text: string } {
  const gradients = [
    { bg: 'from-blue-600 to-indigo-600', text: 'text-white' },
    { bg: 'from-purple-600 to-violet-600', text: 'text-white' },
    { bg: 'from-emerald-600 to-teal-600', text: 'text-white' },
    { bg: 'from-amber-600 to-orange-600', text: 'text-white' },
    { bg: 'from-rose-600 to-pink-600', text: 'text-white' },
    { bg: 'from-cyan-600 to-blue-600', text: 'text-white' },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ChatAvatar({
  name,
  email,
  imageUrl,
  size = 36,
  status,
  className,
  showStatus = false,
  tooltipText,
  variant,
  isActive = false,
}: ChatAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const gradient = getInitialsGradient(name);

  const isSquircle =
    variant === 'squircle' ||
    Boolean(
      className?.includes('rounded-[') ||
      className?.includes('rounded-xl') ||
      className?.includes('rounded-2xl') ||
      className?.includes('rounded-lg')
    );

  const roundedClass = isSquircle ? 'rounded-[14px]' : 'rounded-full';

  const hasImage = Boolean(
    imageUrl &&
      !imageError &&
      !imageUrl.includes('logo.png') &&
      !imageUrl.includes('logo.svg')
  );

  const statusIndicator = showStatus && status && (
    <span
      className={cn(
        'absolute rounded-full ring-2 ring-background z-10 shrink-0 pointer-events-none',
        isSquircle ? '-bottom-0.5 -right-0.5' : 'bottom-0 right-0',
        size >= 36 ? 'w-3 h-3' : 'w-2.5 h-2.5',
        status === 'online' && 'bg-emerald-500',
        status === 'idle' && 'bg-amber-500',
        status === 'dnd' && 'bg-rose-500',
        status === 'offline' && 'bg-zinc-500',
      )}
    />
  );

  const avatarCircle = (
    <div
      className={cn(
        'relative inline-flex shrink-0 aspect-square select-none items-center justify-center',
        roundedClass,
        className,
      )}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
    >
      <div
        className={cn(
          'w-full h-full aspect-square overflow-hidden flex items-center justify-center',
          hasImage ? 'bg-sidebar-accent' : isActive ? 'bg-transparent' : 'bg-sidebar-accent',
          roundedClass,
        )}
        style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
      >
        {imageUrl && (imageUrl.includes('logo.png') || imageUrl.includes('logo.svg')) ? (
          <AnticeilLogo className={cn('w-3/5 h-3/5 transition-colors duration-150', isActive ? 'text-primary' : 'text-foreground')} />
        ) : imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={name}
            onError={() => setImageError(true)}
            style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
            className={cn('w-full h-full object-cover aspect-square', roundedClass)}
          />
        ) : isSquircle && (name?.toLowerCase() === 'anticeil') ? (
          <AnticeilLogo className={cn('w-3/5 h-3/5 transition-colors duration-150', isActive ? 'text-primary' : 'text-foreground')} />
        ) : isSquircle ? (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center font-semibold select-none leading-none transition-colors duration-200',
              isActive
                ? 'bg-transparent text-primary'
                : 'text-foreground bg-sidebar-accent border border-sidebar-border',
              roundedClass,
            )}
            style={{ fontSize: `${Math.max(11, Math.floor(size * 0.38))}px` }}
          >
            {getColonyInitials(name)}
          </div>
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center rounded-full font-bold tracking-tight transition-colors duration-200',
              isActive
                ? 'bg-transparent text-primary'
                : cn('bg-gradient-to-br', gradient.bg, gradient.text),
            )}
            style={{ fontSize: `${Math.max(10, Math.floor(size * 0.38))}px` }}
          >
            {initials}
          </div>
        )}
      </div>
      {statusIndicator}
    </div>
  );

  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="cursor-pointer inline-flex shrink-0">{avatarCircle}</div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs font-medium">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatarCircle;
}

// Backward-compatible alias
export const CommunityAvatar = ChatAvatar;
export type CommunityAvatarProps = ChatAvatarProps;
