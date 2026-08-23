import { useWindowDimensions } from 'react-native';
import { THEME } from '@chatbyok/core';

export interface DeviceLayout {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isSplitView: boolean;
  columns: number;
}

export function useDeviceLayout(): DeviceLayout {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isMobile = width < THEME.breakpoints.mobile;
  const isTablet = width >= THEME.breakpoints.mobile && width < THEME.breakpoints.tablet;
  const isDesktop = width >= THEME.breakpoints.tablet;
  
  // Split-view (Master-Detail side-by-side) activates on tablet or wide landscape (>= 600px)
  const isSplitView = width >= 600;

  const columns = isDesktop ? 3 : isTablet || isLandscape ? 2 : 1;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isSplitView,
    columns,
  };
}
