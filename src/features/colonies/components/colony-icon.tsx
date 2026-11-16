import React from 'react';
import { cn } from '@/lib/utils';
import { AnticeilLogo } from '@/components/ui/anticeil-logo';
import type { Colony } from '@/chat/chat-types';

export interface ColonyIconProps {
  hub: Colony;
  className?: string;
}

/**
 * Discord-accurate server initials generator:
 * - Multi-word: takes first letter of each word (e.g. "zmsta's server" -> "zs", "Colony Satu" -> "CS")
 * - CamelCase: takes first letter of each camel block (e.g. "MyColony" -> "MC")
 * - Single-word: if length <= 2 returns the full word, else first letter (e.g. "s" -> "s", "adwad" -> "a")
 * Preserves the exact casing from the colony name.
 */
export function getColonyInitials(name?: string): string {
  if (!name) return 'C';
  const clean = name.trim();
  if (!clean) return 'C';

  // Multi-word split by spaces, hyphens, or underscores
  const words = clean.split(/[\s_-]+/).filter(Boolean);
  if (words.length > 1) {
    return words.slice(0, 3).map((w) => w[0]).join('');
  }

  // CamelCase check (e.g. "MyColony" -> "MC")
  const camelWords = clean.match(/[A-Z][a-z0-9]*/g);
  if (camelWords && camelWords.length > 1) {
    return camelWords.slice(0, 3).map((w) => w[0]).join('');
  }

  // Single word
  return clean.length <= 2 ? clean : clean[0];
}

export function ColonyIcon({ hub, className }: ColonyIconProps) {
  // Direct Messages / Anticeil system colony uses the adaptive Anticeil logo
  if (
    hub.id === 'anticeil' ||
    hub.iconType === 'logo' ||
    hub.iconUrl?.includes('logo.png') ||
    hub.iconUrl?.includes('logo.svg')
  ) {
    return (
      <AnticeilLogo
        className={cn('size-6 text-foreground transition-colors duration-150', className)}
      />
    );
  }

  if (hub.iconUrl) {
    return (
      <img
        src={hub.iconUrl}
        alt={hub.name}
        className={cn('w-full h-full object-cover rounded-[14px]', className)}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  const initials = getColonyInitials(hub.name || hub.initials);

  return (
    <span
      className={cn(
        'font-medium text-foreground select-none leading-none tracking-normal flex items-center justify-center',
        initials.length >= 3 ? 'text-xs' : 'text-sm font-semibold',
        className,
      )}
    >
      {initials}
    </span>
  );
}

// Backward-compatible aliases
export const ServerIcon = ColonyIcon;
export type ServerIconProps = ColonyIconProps;
export const HubIcon = ColonyIcon;
export type HubIconProps = ColonyIconProps;
