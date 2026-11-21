import React from 'react';
import { Menu, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface SidebarNavToggleProps {
  onClick?: () => void;
  className?: string;
  tooltipText?: string;
}

/**
 * Universal Responsive Sidebar Toggle Button
 * - Mobile & Tablet (< 1024px): Renders Hamburger Menu Icon (Menu) to open drawer
 * - Desktop (>= 1024px): Renders PanelLeftOpen icon (opposite of PanelLeftClose) to expand collapsed sidebar
 */
export function SidebarNavToggle({
  onClick,
  className,
  tooltipText = 'Buka Menu Sidebar',
}: SidebarNavToggleProps) {
  if (!onClick) return null;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClick}
          className={cn(
            'sidebar-toggle-btn h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer shrink-0 transition-colors',
            // Hidden on desktop by default when sidebar is open; revealed when data-sidebar-collapsed="true"
            'lg:hidden',
            className
          )}
          title={tooltipText}
          aria-label={tooltipText}
        >
          {/* Burger icon ONLY on mobile and tablet (< 1024px) */}
          <Menu className="w-5 h-5 block lg:hidden" />
          {/* PanelLeftOpen icon (opposite of PanelLeftClose) ONLY on desktop (>= 1024px) */}
          <PanelLeftOpen className="w-4 h-4 hidden lg:block" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <span className="lg:hidden">{tooltipText}</span>
        <span className="hidden lg:inline">
          Buka Sidebar <kbd className="ml-1 text-[10px] text-muted-foreground font-mono">Ctrl+B</kbd>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
