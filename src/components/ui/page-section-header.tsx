import React from 'react';
import { cn } from '@/lib/utils';
import { TEXT_STYLES } from '@/lib/design-tokens';

export interface PageSectionHeaderProps {
  /** Optional icon displayed before the title */
  icon?: React.ElementType;
  /** Section title text */
  title: string;
  /** Optional item counter */
  count?: number | string;
  /** Optional counter label suffix, e.g. 'item' */
  countLabel?: string;
  /** Optional subtitle or description displayed on the right or below */
  description?: string;
  /** Optional action elements on the right (e.g. Sort, Filter, Action buttons) */
  children?: React.ReactNode;
  /** Additional custom classNames */
  className?: string;
}

/**
 * Standardized Section Header Component
 * Enforces uniform typography, font sizes, weights, uppercase tracking,
 * icon sizes, counter styling, and bottom border rhythm across all pages.
 */
export function PageSectionHeader({
  icon: Icon,
  title,
  count,
  countLabel,
  description,
  children,
  className,
}: PageSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1.5 border-b border-border/50 min-h-7',
        className
      )}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
        <span className={cn(TEXT_STYLES.SECTION_TITLE, 'truncate')}>
          {title}
        </span>
        {count !== undefined && (
          <span className={TEXT_STYLES.COUNTER_LABEL}>
            ({count}{countLabel ? ` ${countLabel}` : ''})
          </span>
        )}
      </div>

      {(description || children) && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {description && (
            <span className={TEXT_STYLES.MUTED_XS}>{description}</span>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
