import { useState, useEffect } from 'react';

export const DEFAULT_SIDEBAR_WIDTH = 240;
export const MIN_SIDEBAR_WIDTH = 180;
export const MAX_SIDEBAR_WIDTH = 480;
export const SIDEBAR_STORAGE_KEY = 'anticeil_channels_sidebar_width';

export interface UseResizableSidebarOptions {
  storageKey?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  railElementId?: string;
}

export function useResizableSidebar(options: UseResizableSidebarOptions = {}) {
  const {
    storageKey = SIDEBAR_STORAGE_KEY,
    defaultWidth = DEFAULT_SIDEBAR_WIDTH,
    minWidth = MIN_SIDEBAR_WIDTH,
    maxWidth = MAX_SIDEBAR_WIDTH,
    railElementId = 'anticeil-mini-rail',
  } = options;

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= minWidth && val <= maxWidth) return val;
      }
    } catch {}
    return defaultWidth;
  });

  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  const handleSidebarResizeReset = () => {
    setSidebarWidth(defaultWidth);
    try {
      localStorage.setItem(storageKey, String(defaultWidth));
    } catch {}
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const miniRailEl = document.getElementById(railElementId);
      const miniRailOffset = miniRailEl ? miniRailEl.getBoundingClientRect().right : 56;
      const newWidth = Math.min(Math.max(e.clientX - miniRailOffset, minWidth), maxWidth);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      try {
        localStorage.setItem(storageKey, String(sidebarWidth));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, sidebarWidth, railElementId, minWidth, maxWidth, storageKey]);

  return {
    sidebarWidth,
    isResizingSidebar,
    handleSidebarResizeStart,
    handleSidebarResizeReset,
  };
}
