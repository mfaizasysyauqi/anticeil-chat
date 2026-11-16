import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface SettingToggleRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function SettingToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  badge,
  className,
  icon,
}: SettingToggleRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-3 border-b border-border/40 transition-colors',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <div className="space-y-0.5 pr-2 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
          <div className="text-xs font-semibold text-foreground truncate">{label}</div>
          {badge}
        </div>
        {description && (
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            {description}
          </div>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}

export interface SettingCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SettingCard({
  title,
  description,
  headerAction,
  children,
  className,
}: SettingCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4',
        className,
      )}
    >
      {(title || headerAction) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0 flex-1">
            {title && (
              <h3 className="text-xs font-bold text-foreground truncate">{title}</h3>
            )}
            {description && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
