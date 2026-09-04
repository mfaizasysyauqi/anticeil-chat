import { useState, useCallback, useEffect, RefObject } from 'react';

export interface UseSplitResizeOptions {
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}

/**
 * Hook to manage split pane drag resizing with 1:1 mouse tracking.
 * Clamps ratio between minRatio (default 0.2) and maxRatio (default 0.8).
 */
export function useSplitResize(
  containerRef: RefObject<HTMLElement | null>,
  options: UseSplitResizeOptions = {}
) {
  const { defaultRatio = 0.48, minRatio = 0.2, maxRatio = 0.8 } = options;
  const [splitRatio, setSplitRatio] = useState(defaultRatio);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      const startX = e.clientX;
      const startRatio = splitRatio;

      const onMove = (moveEv: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width <= 0) return;
        const deltaX = moveEv.clientX - startX;
        const newRatio = Math.max(minRatio, Math.min(maxRatio, startRatio + deltaX / rect.width));
        setSplitRatio(newRatio);
      };

      const onUp = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [containerRef, maxRatio, minRatio, splitRatio]
  );

  return {
    splitRatio,
    setSplitRatio,
    isResizing,
    startResize,
  };
}
