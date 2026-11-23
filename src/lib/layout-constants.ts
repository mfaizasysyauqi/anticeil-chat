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
    'relative flex flex-col h-full flex-1 min-h-0 w-full max-w-full min-w-0 bg-background overflow-hidden rounded-none border-0 lg:rounded-xl lg:border lg:border-sidebar-border shadow-xs',
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
   * Symmetrical Horizontal Padding for all page App Bars:
   * - Mobile (<640px): px-3.5 (14px)
   * - Small devices / Phablet (640px - 767px): sm:px-4 (16px)
   * - Tablet (768px - 1023px): md:px-5 (20px)
   * - Desktop (>=1024px): lg:px-6 (24px)
   */
  HORIZONTAL: 'px-3.5 sm:px-4 md:px-5 lg:px-6',

  /**
   * Symmetrical Horizontal Padding for all page scrollable bodies:
   * 100% matched with App Bar HORIZONTAL (px-3.5 sm:px-4 md:px-5 lg:px-6).
   * Combined with true overlay scrollbars (0px layout width), this guarantees
   * 100% pixel-perfect horizontal symmetry between the App Bar header and content body.
   */
  BODY_HORIZONTAL: 'px-3.5 sm:px-4 md:px-5 lg:px-6',

  /**
   * Vertical padding for page body scrolling content
   */
  VERTICAL: 'py-4 sm:py-5 md:py-6',

  /**
   * Universal scrollable body classes:
   * Uses max-lg:scrollbar-none on mobile/tablet and custom-scrollbar on desktop,
   * guaranteeing 100% horizontal symmetry with the App Bar header above.
   */
  BODY_SCROLL:
    'flex-1 min-h-0 overflow-y-auto max-lg:scrollbar-none custom-scrollbar px-3.5 sm:px-4 md:px-5 lg:px-6',

  /**
   * Combined page content scroll container classes
   */
  BODY_PADDING:
    'px-3.5 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6 flex-1 min-h-0 overflow-y-auto max-lg:scrollbar-none custom-scrollbar',

  /**
   * Universal App Bar header height (48px)
   */
  APP_BAR_HEIGHT: 'h-12',

  /**
   * Standard single-line App Bar container
   */
  APP_BAR_CONTAINER:
    'sticky top-0 z-20 h-12 border-b border-sidebar-border px-3.5 sm:px-4 md:px-5 lg:px-6 flex items-center justify-between shrink-0 bg-background overflow-hidden',
} as const;

/**
 * Global reusable scrollbar classes
 */
export const APP_SCROLLBAR = 'custom-scrollbar';

/**
 * Global horizontal padding for channel views (Text Channel, Voice Channel, Forum Channel, and Sidebar Header)
 * Used across app bar, body/feed, and bottom bar/input dock to ensure perfect horizontal symmetry and consistency.
 */
export const CHANNEL_HORIZONTAL_PADDING = LAYOUT_PAGE_SPACING.HORIZONTAL;
export const CHANNEL_HORIZONTAL_BODY = LAYOUT_PAGE_SPACING.BODY_HORIZONTAL;
export const CHANNEL_VERTICAL_PADDING = LAYOUT_PAGE_SPACING.VERTICAL;
export const CHANNEL_BODY_PADDING = LAYOUT_PAGE_SPACING.BODY_PADDING;

/**
 * Dialog & Modal Layout Tokens
 * Proportional responsive dimensions and symmetrical internal padding across Mobile, Tablet, and Desktop.
 */
export const LAYOUT_DIALOG_SPACING = {
  /**
   * Two-pane settings modal (Colony Settings, User Settings, Channel Settings, Edit Profile):
   * Proportional 90% viewport size with 5% outer padding on all sides, matching Edit Profile dialog.
   * - Mobile (<768px): w-[94vw] max-w-[94vw] h-[94dvh] max-h-[94dvh] rounded-2xl
   * - Tablet & Desktop (>=768px): w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] rounded-2xl
   */
  TWO_PANE_CONTAINER:
    'p-0 w-full h-full max-w-full max-h-full sm:w-[96vw] sm:h-[94dvh] sm:max-w-[96vw] sm:max-h-[94dvh] md:w-[94vw] md:max-w-[94vw] md:h-[92vh] md:max-h-[860px] lg:w-[92vw] lg:max-w-6xl xl:w-[90vw] xl:max-w-7xl xl:h-[90vh] xl:max-h-[900px] overflow-hidden bg-background border-0 sm:border border-border flex flex-col md:flex-row rounded-none sm:rounded-2xl shadow-2xl gap-0 select-none',

  /**
   * Single-pane large modal (Dialog Besar: Send a Gift, Full Showcase, etc.):
   * Same proportional 90% viewport size with 5% outer padding, vertical layout (flex-col across all breakpoints).
   */
  LARGE_CONTAINER:
    'p-0 w-full h-full max-w-full max-h-full sm:w-[96vw] sm:h-[94dvh] sm:max-w-[96vw] sm:max-h-[94dvh] md:w-[94vw] md:max-w-5xl md:h-[92vh] md:max-h-[860px] lg:w-[92vw] lg:max-w-6xl xl:w-[90vw] xl:max-w-7xl xl:h-[90vh] xl:max-h-[900px] overflow-hidden bg-background border-0 sm:border border-border flex flex-col md:flex-col rounded-none sm:rounded-2xl shadow-2xl gap-0 select-none',

  /**
   * Single-pane dialog standard container (Dialog Sedang: e.g. Colony Komunitas, Create Channel, Schedule, etc.)
   * Symmetrical horizontal padding matching the app bar (px-3.5 sm:px-4 md:px-5 lg:px-6) and max-w-md
   */
  STANDARD_CONTAINER:
    'w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-md max-h-[calc(100svh-2.5rem)] p-5 sm:p-6 rounded-2xl',

  /** Symmetrical horizontal padding for dialog headers & body content matching App Bar */
  PANE_HORIZONTAL: LAYOUT_PAGE_SPACING.HORIZONTAL,

  /** Symmetrical vertical padding for dialog body content matching sidebar rhythm: 14px mobile, 16px sm, 20px md/lg */
  PANE_VERTICAL: 'py-3.5 sm:py-4 md:py-5',

  /** Dialog detail pane header with symmetrical horizontal padding matching App Bar */
  HEADER_HEIGHT: 'h-14',
  HEADER_CONTAINER:
    'h-14 border-b border-border/60 bg-background/95 backdrop-blur-xs flex items-center justify-between px-3.5 sm:px-4 md:px-5 lg:px-6 z-10 shrink-0 select-none',

  /** Dialog detail pane scrollable body with symmetrical horizontal and vertical padding matching Sidebar and App Bar */
  BODY_PADDING:
    'flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 sm:px-4 md:px-5 lg:px-6 py-3.5 sm:py-4 md:py-5 max-md:scrollbar-none custom-scrollbar w-full min-w-0',

  /** Sidebar in two-pane settings */
  SIDEBAR_WIDTH: 'w-full md:w-56 lg:w-60',

  /** Symmetrical padding for sidebar container matching body and app bar vertical rhythm */
  SIDEBAR_PADDING: 'p-3 sm:p-3.5 md:py-5 md:px-3.5',
} as const;

export * from '@/core/constants/layout';
export * from './design-tokens';
