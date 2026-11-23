'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface FormDropdownProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'xs';
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  id?: string;
}

export function FormDropdown({
  label,
  description,
  error,
  required,
  options,
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder = 'Pilih opsi...',
  disabled,
  size = 'default',
  className,
  triggerClassName,
  contentClassName,
  id,
}: FormDropdownProps) {
  const handleValueChange = (val: string) => {
    onChange?.(val);
    onValueChange?.(val);
  };

  const selectProps: { value?: string; defaultValue?: string } = {};
  if (value !== undefined) {
    selectProps.value = value;
  }
  if (defaultValue !== undefined) {
    selectProps.defaultValue = defaultValue;
  }

  return (
    <div className={cn('w-full space-y-1', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-foreground flex items-center gap-1 cursor-pointer select-none"
        >
          {label}
          {required && <span className="text-destructive font-bold">*</span>}
        </label>
      )}

      <Select
        {...selectProps}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          size={size}
          className={cn(
            'w-full bg-muted/40 hover:bg-muted/60 border-border text-foreground transition-all duration-150',
            error && 'border-destructive focus:ring-destructive',
            triggerClassName
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent
          className={cn(
            'border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md z-[300]',
            contentClassName
          )}
        >
          {options.map((option) => {
            const hasIcon = Boolean(option.icon);
            return (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full gap-2 py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {hasIcon && (
                      <span className="shrink-0 opacity-80 text-muted-foreground">
                        {typeof option.icon === 'function' ? (
                          <option.icon className="size-4" />
                        ) : (
                          option.icon
                        )}
                      </span>
                    )}
                    <div className="flex flex-col text-left min-w-0">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {option.badge && (
                    <span className="shrink-0 text-[10px]">{option.badge}</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {description && !error && (
        <p className="text-[11px] text-muted-foreground leading-normal">{description}</p>
      )}
      {error && (
        <p className="text-[11px] text-destructive leading-normal">{error}</p>
      )}
    </div>
  );
}

// Alias for ease of use
export const FormSelect = FormDropdown;
