import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ResponsiveSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputWidth?: string;
  id?: string;
}

export function ResponsiveSearchBar({
  value,
  onChange,
  placeholder = 'Cari...',
  className,
  inputWidth = 'w-36 sm:w-44 md:w-48',
  id,
}: ResponsiveSearchBarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobileOpen) {
      inputRef.current?.focus();
    }
  }, [isMobileOpen]);

  // Handle escape to close mobile search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (value) {
        onChange('');
      } else {
        setIsMobileOpen(false);
      }
    }
  };

  return (
    <div className={cn('flex items-center shrink-0', className)}>
      {/* ── Desktop & Tablet View (Always Visible on sm+) ────────── */}
      <div className={cn('hidden sm:flex relative items-center', inputWidth)}>
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-7 pl-7 pr-7 text-xs bg-muted/40 border-sidebar-border hover:bg-muted/60 focus:bg-background transition-colors"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer"
            title="Hapus pencarian"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Mobile View: Icon Button that toggles full search overlay ── */}
      <div className="sm:hidden flex items-center">
        {!isMobileOpen ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsMobileOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 relative cursor-pointer"
            title={placeholder}
          >
            <Search className="w-4 h-4" />
            {value && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        ) : (
          <div className="fixed inset-x-0 top-0 h-12 bg-background border-b border-sidebar-border z-50 flex items-center px-3 gap-2 animate-in fade-in slide-in-from-top-1 duration-150 shadow-md">
            <Search className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
            <Input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="h-8 text-xs bg-muted/50 border-input flex-1"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onChange('')}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Hapus teks"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              type="button"
              size="xs"
              onClick={() => setIsMobileOpen(false)}
              className="text-xs font-bold px-2.5 h-7 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-2xs shrink-0"
            >
              Tutup
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
