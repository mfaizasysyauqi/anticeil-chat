import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface SidebarNavToggleProps {
  onClick?: () => void;
  className?: string;
  tooltipText?: string;
}

/**
 * Responsive Mobile Sidebar Drawer Toggle Button
 * - Mobile & Tablet (< 1024px): Renders Hamburger Menu Icon (Menu) to open drawer
 * - Desktop: Hidden since the expand toggle is placed directly inside the sidebar rail under the Anticeil logo
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
            // Only on mobile and tablet (< 1024px)
            'lg:hidden',
            className
          )}
          title={tooltipText}
          aria-label={tooltipText}
        >
          {/* Burger icon ONLY on mobile and tablet (< 1024px) */}
          <Menu className="w-5 h-5 block" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <span>{tooltipText}</span>
      </TooltipContent>
    </Tooltip>
  );
}
