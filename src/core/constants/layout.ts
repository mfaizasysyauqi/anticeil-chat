/**
 * Responsive Breakpoints and Layout Dimensions Configuration
 * Clean Architecture Constants for Anticeil Chat
 */

export const BREAKPOINTS = {
  MOBILE: 768,   // < 768px: Mobile phones
  TABLET: 1024,  // 768px - 1023px: Tablets & small laptops
  DESKTOP: 1280, // >= 1024px: Desktops & widescreen monitors
} as const;

export type DeviceMode = 'mobile' | 'tablet' | 'desktop';

export const LAYOUT_SIZES = {
  // Mini Hub / Server Rail (Discord-style left rail)
  RAIL_WIDTH: 'w-14',
  RAIL_WIDTH_PX: 56,

  // Channels & DMs Sidebar
  SIDEBAR_WIDTH_DESKTOP: 'w-60',
  SIDEBAR_WIDTH_DESKTOP_PX: 240,
  SIDEBAR_WIDTH_TABLET: 'w-72',
  SIDEBAR_WIDTH_TABLET_PX: 288,

  // Mobile & Tablet Drawer Widths
  DRAWER_WIDTH: 'w-[310px] sm:w-[340px]',
  MEMBERS_DRAWER_WIDTH: 'w-72 sm:w-80',

  // Top App Bar Header
  HEADER_HEIGHT: 'h-12',
  HEADER_HEIGHT_PX: 48,
  APP_BAR_PADDING: 'px-3 sm:px-4',

  // User Footer Dock
  USER_DOCK_HEIGHT_PX: 52,
  USER_DOCK_OVERLAY_WIDTH: 'w-[280px]',
  USER_DOCK_SCRIM_WIDTH: '298px',
} as const;

/**
 * Utility helper to determine device mode from window width
 */
export function getDeviceMode(width: number): DeviceMode {
  if (width < BREAKPOINTS.MOBILE) return 'mobile';
  if (width < BREAKPOINTS.TABLET) return 'tablet';
  return 'desktop';
}
