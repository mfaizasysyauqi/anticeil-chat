/**
 * Shared layout constants for application body containers across all breakpoints
 * - Mobile (< 768px): 0 margin/padding horizontally and vertically (full-bleed edge-to-edge)
 * - Tablet (768px - 1023px): 0 margin/padding, accessible via burger menu drawer
 * - Desktop (1024px+): margin 1 on all sides (lg:m-1 = 4px margin top, right, bottom, left)
 * - Consistent border color and thickness matching border-sidebar-border (1px solid)
 */
export const LAYOUT_BODY_CONTAINER = {
  /** Outer spacing: 0 on mobile & tablet; lg: margin 1 on all 4 sides (lg:m-1) on desktop */
  OUTER_PADDING: 'p-0 m-0 lg:m-1',
  /** Base classes for dashboard-content-container (consistent 1px border matching border-sidebar-border) */
  CONTENT_CONTAINER:
    'relative flex flex-col h-full flex-1 min-h-0 bg-background overflow-clip rounded-none border-0 lg:rounded-xl lg:border lg:border-sidebar-border shadow-xs',
} as const;

/**
 * Global Page and App Bar Spacing Tokens
 * Ensures 100% horizontal symmetry and consistent vertical rhythm across:
 * - App Bar header
 * - Main content body / feed / grid
 * - Bottom action bar / input dock
 */
export const LAYOUT_PAGE_SPACING = {
  /**
   * Symmetrical Horizontal Padding for all page App Bars & Body views:
   * - Mobile (<640px): px-3.5 (14px)
   * - Small devices / Phablet (640px - 767px): sm:px-4 (16px)
   * - Tablet (768px - 1023px): md:px-5 (20px)
   * - Desktop (>=1024px): lg:px-6 (24px)
   */
  HORIZONTAL: 'px-3.5 sm:px-4 md:px-5 lg:px-6',

  /**
   * Vertical padding for page body scrolling content
   */
  VERTICAL: 'py-4 sm:py-5 md:py-6',

  /**
   * Combined page content scroll container classes
   */
  BODY_PADDING: 'px-3.5 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6',

  /**
   * Universal App Bar header height (48px)
   */
  APP_BAR_HEIGHT: 'h-12',

  /**
   * Standard single-line App Bar container
   */
  APP_BAR_CONTAINER:
    'h-12 border-b border-sidebar-border px-3.5 sm:px-4 md:px-5 lg:px-6 flex items-center justify-between shrink-0 bg-background z-10',
} as const;

/**
 * Global horizontal padding for channel views (Text Channel, Voice Channel, Forum Channel, and Sidebar Header)
 * Used across app bar, body/feed, and bottom bar/input dock to ensure perfect horizontal symmetry and consistency.
 */
export const CHANNEL_HORIZONTAL_PADDING = LAYOUT_PAGE_SPACING.HORIZONTAL;

/**
 * Dialog & Modal Layout Tokens
 * Proportional responsive dimensions and symmetrical internal padding across Mobile, Tablet, and Desktop.
 */
export const LAYOUT_DIALOG_SPACING = {
  /**
   * Two-pane settings modal (Colony Settings, User Settings, Channel Settings):
   * - Mobile (<768px): w-[96vw] max-w-[96vw] h-[94dvh] rounded-2xl
   * - Tablet (768px - 1023px): w-[92vw] max-w-4xl h-[86vh] rounded-2xl
   * - Desktop (>=1024px): w-full max-w-5xl lg:max-w-6xl h-[85vh] max-h-[820px] rounded-2xl
   */
  TWO_PANE_CONTAINER:
    'p-0 w-[96vw] md:w-[92vw] lg:w-full max-w-5xl lg:max-w-6xl h-[94dvh] md:h-[86vh] max-h-[820px] overflow-hidden bg-background border border-border flex flex-col md:flex-row rounded-2xl shadow-2xl gap-0',

  /**
   * Single-pane dialog standard container (e.g. Create Channel, Add Friend, Schedule, etc.)
   */
  STANDARD_CONTAINER:
    'w-[calc(100vw-1.5rem)] sm:w-full max-w-lg max-h-[calc(100svh-2.5rem)] p-4 sm:p-5',

  /** Symmetrical horizontal padding for dialog headers & body content */
  PANE_HORIZONTAL: 'px-4 sm:px-6 md:px-8',

  /** Symmetrical vertical padding for dialog body content */
  PANE_VERTICAL: 'py-5 sm:py-6 md:py-8',

  /** Dialog detail pane header */
  HEADER_HEIGHT: 'h-14',
  HEADER_CONTAINER:
    'h-14 border-b border-border/60 bg-background/95 backdrop-blur-xs flex items-center justify-between px-4 sm:px-6 md:px-8 z-10 shrink-0 select-none',

  /** Dialog detail pane scrollable body */
  BODY_PADDING:
    'flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 [scrollbar-width:thin] w-full min-w-0',

  /** Sidebar in two-pane settings */
  SIDEBAR_WIDTH: 'w-full md:w-56 lg:w-60',
} as const;

export * from '@/core/constants/layout';
