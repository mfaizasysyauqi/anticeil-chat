import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Minimize2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface MagneticFloatingCollapseButtonProps {
  onCollapse: () => void;
  className?: string;
  tooltipText?: string;
}

/**
 * Tier-S UX Magnetic Snap-to-Edge Floating Collapse Button
 * Used in Theater / Immersive Focus mode for Activities & Standalone Apps.
 * 
 * Features:
 * - AssistiveTouch / Chat Head physics: snaps to nearest left/right screen edge when released.
 * - Idle Auto-Dim: dims to opacity-35 after 3s of inactivity, restores on hover or activity.
 * - Keyboard Escape (ESC) support: exits theater mode immediately.
 * - Seamless drag detection with iframe mouse-capture shield.
 */
export function MagneticFloatingCollapseButton({
  onCollapse,
  className,
  tooltipText = 'Keluar Mode Layar Penuh (ESC)',
}: MagneticFloatingCollapseButtonProps) {
  const BUTTON_SIZE = 44; // 44px
  const PADDING = 16; // 16px from edge

  // Initial position: top-right corner with 16px padding
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(PADDING, window.innerWidth - BUTTON_SIZE - PADDING),
        y: 80,
      };
    }
    return { x: 100, y: 80 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; buttonX: number; buttonY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    buttonX: 0,
    buttonY: 0,
    moved: false,
  });

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset idle dimming timer
  const resetIdleTimer = useCallback(() => {
    setIsDimmed(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsDimmed(true);
    }, 3000);
  }, []);

  // Keyboard ESC listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCollapse]);

  // Global mousemove / touch listener for idle auto-dim
  useEffect(() => {
    const handleUserActivity = () => {
      resetIdleTimer();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Window resize handler: ensure button stays within bounds & snapped
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const isLeft = prev.x + BUTTON_SIZE / 2 < window.innerWidth / 2;
        const targetX = isLeft ? PADDING : Math.max(PADDING, window.innerWidth - BUTTON_SIZE - PADDING);
        const targetY = Math.min(Math.max(prev.y, PADDING), Math.max(PADDING, window.innerHeight - BUTTON_SIZE - PADDING));
        return { x: targetX, y: targetY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer event handlers for drag & drop with magnetic snap
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      buttonX: position.x,
      buttonY: position.y,
      moved: false,
    };
    setIsDragging(true);
    resetIdleTimer();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 5) {
      dragStartRef.current.moved = true;
    }

    const newX = dragStartRef.current.buttonX + deltaX;
    const newY = dragStartRef.current.buttonY + deltaY;

    // Constrain within viewport during drag
    const clampedX = Math.min(Math.max(newX, PADDING), window.innerWidth - BUTTON_SIZE - PADDING);
    const clampedY = Math.min(Math.max(newY, PADDING), window.innerHeight - BUTTON_SIZE - PADDING);

    setPosition({ x: clampedX, y: clampedY });
    resetIdleTimer();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);

    if (!dragStartRef.current.moved) {
      // It was a tap/click -> Trigger collapse
      onCollapse();
      return;
    }

    // It was a drag: Magnetic snap to left or right edge
    const midX = position.x + BUTTON_SIZE / 2;
    const screenMid = window.innerWidth / 2;
    const isLeft = midX < screenMid;

    const targetX = isLeft ? PADDING : Math.max(PADDING, window.innerWidth - BUTTON_SIZE - PADDING);
    const targetY = Math.min(Math.max(position.y, PADDING), Math.max(PADDING, window.innerHeight - BUTTON_SIZE - PADDING));

    setPosition({ x: targetX, y: targetY });
    resetIdleTimer();
  };

  return (
    <>
      {/* Invisible overlay during drag to prevent iframes (YouTube embed, canvas) from stealing mouse capture */}
      {isDragging && <div className="fixed inset-0 z-[9998] select-none cursor-grabbing" />}

      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onMouseEnter={() => setIsDimmed(false)}
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                transition: isDragging
                  ? 'none'
                  : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.15), opacity 0.3s ease',
              }}
              className={cn(
                'fixed top-0 left-0 z-[9999] size-11 rounded-full flex items-center justify-center select-none shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing border border-border/70 bg-background/80 text-foreground hover:bg-background/95 hover:text-primary hover:border-primary/50 transition-colors',
                isDimmed && !isDragging ? 'opacity-35 hover:opacity-100' : 'opacity-100',
                className
              )}
              aria-label={tooltipText}
            >
              <Minimize2 className="w-5 h-5 pointer-events-none" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side={position.x < window.innerWidth / 2 ? 'right' : 'left'}
            sideOffset={8}
            className="text-xs font-semibold select-none"
          >
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
