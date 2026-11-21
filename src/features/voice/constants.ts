import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';

/**
 * Shared styling tokens for Voice & Stage channel bottom controls bar.
 * Guarantees 100% DRY, pixel-perfect symmetry, consistent button sizing,
 * identical h-16 bar height, and bg-background color.
 */
export const VOICE_BOTTOM_BAR_STYLES = {
  /** Outer bottom bar container: exactly h-16 (64px), bg-background, 3-column grid */
  CONTAINER: cn(
    'h-16 shrink-0 w-full grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center bg-background select-none z-20',
    CHANNEL_HORIZONTAL_PADDING,
  ),

  /** Pill container: h-11, bg-card, rounded-xl, border border-border/60, shadow-md */
  PILL: 'h-11 bg-card rounded-xl flex items-center px-1 border border-border/60 shadow-md shrink-0',
  PILL_GAP: 'h-11 bg-card rounded-xl flex items-center px-1 gap-1 border border-border/60 shadow-md shrink-0',

  /** Audio/Video button with toggle text & chevron: h-9, rounded-lg, text-sm */
  BUTTON_TOGGLE:
    'h-9 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-lg transition-colors cursor-pointer text-sm font-medium',

  /** Square / Icon action button: h-9 w-10, rounded-lg */
  BUTTON_ICON:
    'h-9 w-10 flex items-center justify-center rounded-lg text-foreground hover:bg-muted/60 transition-colors cursor-pointer',

  /** Red Disconnect Button: h-11, rounded-xl, bg-destructive, text-white */
  DISCONNECT_BUTTON:
    'h-11 px-4 sm:px-5 rounded-xl bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 shrink-0',

  /** Side utility button (Invite, PiP, Fullscreen): h-9 w-9 sm:h-10 sm:w-10, rounded-lg */
  SIDE_BUTTON:
    'h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer flex items-center justify-center shrink-0',
} as const;
