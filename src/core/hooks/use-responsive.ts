import { useState, useEffect } from 'react';
import { BREAKPOINTS, getDeviceMode, type DeviceMode } from '../constants/layout';

export interface ResponsiveState {
  deviceMode: DeviceMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

/**
 * Reusable hook to track responsive viewport state across Mobile, Tablet, and Desktop
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        deviceMode: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1280,
        height: 800,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const mode = getDeviceMode(width);

    return {
      deviceMode: mode,
      isMobile: mode === 'mobile',
      isTablet: mode === 'tablet',
      isDesktop: mode === 'desktop',
      width,
      height,
    };
  });

  useEffect(() => {
    let timeoutId: any;

    const handleResize = () => {
      // Debounce slightly for 60fps performance on resize
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const mode = getDeviceMode(width);

        setState({
          deviceMode: mode,
          isMobile: mode === 'mobile',
          isTablet: mode === 'tablet',
          isDesktop: mode === 'desktop',
          width,
          height,
        });
      }, 50);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return state;
}
