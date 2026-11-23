/**
 * Centralized Design System Tokens for Anticeil Chat
 * Enforces DRY typography, button styling, dialog layouts, and surface cards across all features.
 */

/**
 * Typography & Text Style Tokens
 */
export const TEXT_STYLES = {
  // Section Headers & Categorization Labels
  SECTION_TITLE: 'text-xs font-bold text-foreground uppercase tracking-wider',
  SECTION_MUTED: 'text-xs font-bold text-muted-foreground uppercase tracking-wider',
  SECTION_LABEL: 'text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider',
  
  // Badges & Tag Labels
  BADGE_LABEL: 'text-[10px] font-bold uppercase tracking-wider',
  BADGE_CHIP: 'text-[10px] px-2 py-0.5 rounded-md font-mono font-medium',
  
  // Hero & Page Headings
  HERO_TITLE: 'text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight',
  HERO_SUBTITLE: 'text-xs sm:text-sm text-muted-foreground leading-relaxed',
  PAGE_TITLE: 'text-base sm:text-lg font-bold text-foreground tracking-tight',
  PAGE_SUBTITLE: 'text-xs text-muted-foreground',
  
  // Card Typography
  CARD_TITLE: 'text-xs sm:text-sm font-bold text-foreground truncate',
  CARD_DESC: 'text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed',
  COUNTER_LABEL: 'text-[11px] font-semibold text-muted-foreground',
  
  // General Body Text
  BODY_REGULAR: 'text-xs sm:text-sm text-foreground',
  BODY_MUTED: 'text-xs text-muted-foreground',
  MUTED_XS: 'text-[11px] text-muted-foreground',
  MUTED_2XS: 'text-[10px] text-muted-foreground',
  
  // Form & Input Labels
  LABEL_INPUT: 'text-xs font-semibold text-foreground block mb-1',
  LABEL_HINT: 'text-[11px] text-muted-foreground mt-1',
  
  // Status & Accents
  STATUS_SUCCESS: 'text-emerald-400 font-bold flex items-center gap-1',
  STATUS_WARNING: 'text-amber-400 font-semibold flex items-center gap-1',
  STATUS_DANGER: 'text-rose-400 font-semibold flex items-center gap-1',
  DEW_BALANCE: 'text-xs font-black text-cyan-400 flex items-center gap-1',
} as const;

/**
 * Button Style Tokens
 */
export const BUTTON_STYLES = {
  // Toolbar Action Buttons (e.g. + Tambah Quest, + Tambah Item)
  TOOLBAR_ACTION: 'h-7 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs shrink-0',
  
  // Bordered Ghost / Dropdown Triggers (e.g. Filters, Sort by dropdown)
  TOOLBAR_BORDERED:
    'h-7 px-2.5 rounded-md border border-border/70 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer select-none shrink-0 transition-colors',
  
  // Hero Call To Action Buttons
  HERO_PRIMARY: 'font-bold h-9 sm:h-10 px-4 sm:px-6 gap-2 cursor-pointer shadow-md shrink-0',
  HERO_CYAN: 'font-bold h-9 px-4 gap-1.5 cursor-pointer shadow-md bg-cyan-600 hover:bg-cyan-500 text-white shrink-0',
  
  // Card Internal Action Buttons
  CARD_ACTION_PRIMARY: 'h-7 px-3 text-xs font-bold gap-1 cursor-pointer rounded-lg shadow-xs shrink-0',
  CARD_ACTION_SECONDARY: 'h-7 px-3 text-xs font-semibold cursor-pointer rounded-lg shrink-0',
  CARD_ACTION_SUCCESS: 'h-7 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-lg shadow-xs shrink-0',
  
  // Icon Buttons
  ICON_XS: 'size-6 p-0 flex items-center justify-center rounded-md cursor-pointer shrink-0',
  ICON_SM: 'size-7 p-0 flex items-center justify-center rounded-md cursor-pointer shrink-0',
} as const;

/**
 * Dialog & Modal Style Tokens (3-Tier Standard Architecture)
 * - Large: Two-pane settings modals (User Settings, Edit Profile, Colony Settings)
 * - Medium: Single-pane feature modals (Colony Komunitas, Forms, Tabs - all dialogs smaller than Large)
 * - Small: Confirmation & Delete modals (Delete Channel, Delete Colony, Alerts)
 */
export const DIALOG_STYLES = {
  // Dialog Besar (Two-Pane / Large Viewport Settings)
  MODAL_LARGE:
    'p-0 w-full h-full sm:w-[96vw] sm:h-[94dvh] md:w-[94vw] md:h-[92vh] lg:w-[92vw] lg:max-w-6xl xl:w-[90vw] xl:max-w-7xl xl:h-[90vh] xl:max-h-[900px] overflow-hidden bg-background border-0 sm:border border-border flex flex-col md:flex-row rounded-none sm:rounded-2xl shadow-2xl gap-0 select-none',

  // Dialog Sedang (Standard Single-Pane Modal: Colony Komunitas, Forms, CRUD, Schedules)
  MODAL_MEDIUM:
    'w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-md p-0 rounded-2xl bg-card border border-border shadow-2xl z-[160] max-h-[85vh] flex flex-col overflow-hidden',

  // Dialog Kecil (Confirmation, Delete, Alerts)
  MODAL_SMALL:
    'w-[calc(100vw-2rem)] sm:w-full sm:max-w-sm p-0 rounded-2xl bg-card border border-border shadow-2xl z-[160] max-h-[85vh] flex flex-col overflow-hidden',

  // Aliases for 100% backward compatibility
  MODAL_STANDARD:
    'w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-md p-0 rounded-2xl bg-card border border-border shadow-2xl z-[160] max-h-[85vh] flex flex-col overflow-hidden',
  MODAL_COMPACT:
    'w-[calc(100vw-2rem)] sm:w-full sm:max-w-sm p-0 rounded-2xl bg-card border border-border shadow-2xl z-[160] max-h-[85vh] flex flex-col overflow-hidden',
  MODAL_WIDE:
    'w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-md p-0 rounded-2xl bg-card border border-border shadow-2xl z-[160] max-h-[85vh] flex flex-col overflow-hidden',
  MODAL_PREVIEW:
    'w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-md p-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl z-[150]',
  MODAL_TWO_PANE:
    'p-0 w-full h-full sm:w-[96vw] sm:h-[94dvh] md:w-[94vw] md:h-[92vh] lg:w-[92vw] lg:max-w-6xl xl:w-[90vw] xl:max-w-7xl xl:h-[90vh] xl:max-h-[900px] overflow-hidden bg-background border-0 sm:border border-border flex flex-col md:flex-row rounded-none sm:rounded-2xl shadow-2xl gap-0 select-none',
  
  // Modal Header & Titles
  HEADER_TITLE: 'text-sm font-bold flex items-center gap-2 text-foreground',
  HEADER_DESC: 'text-xs text-muted-foreground mt-0.5',
  
  // Modal Body & Footer
  BODY_SCROLL: 'space-y-4 py-2 overflow-y-auto custom-scrollbar',
  FOOTER_ACTIONS: 'flex items-center justify-end gap-2 pt-4 border-t border-border/60',
} as const;

/**
 * Surface & Card Layout Tokens
 */
export const SURFACE_STYLES = {
  // Interactive standard cards (Shop items, Quests, Colonies, Apps)
  CARD_INTERACTIVE:
    'rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden shadow-xs group cursor-pointer',
    
  // Promoted / Spotlight Card
  CARD_SPOTLIGHT:
    'rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between gap-3 shadow-xs relative overflow-hidden group hover:border-primary/50 transition-all',
    
  // Hero Collection & Featured Banners
  HERO_BANNER:
    'relative overflow-hidden rounded-2xl bg-gradient-to-r p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl',
    
  // Discord-style Right Filter Sidebar
  SIDEBAR_RIGHT:
    'hidden lg:flex w-64 lg:w-72 shrink-0 flex-col border-l border-border/60 bg-card/25 backdrop-blur-xs overflow-y-auto px-3.5 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5 md:py-6 custom-scrollbar select-none',
    
  // Responsive Card Grid (4 cols desktop, 2 cols tablet & mobile)
  CARD_GRID: 'grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4',
} as const;
