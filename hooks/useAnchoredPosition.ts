import { RefObject, useLayoutEffect, useState } from 'react';

export interface AnchoredPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

interface UseAnchoredPositionOptions {
  gap?: number;
  maxHeight?: number;
}

export function useAnchoredPosition(
  isOpen: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  options: UseAnchoredPositionOptions = {},
): AnchoredPosition | null {
  const gap = options.gap ?? 8;
  const maxHeightLimit = options.maxHeight ?? 288;

  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openBelow = spaceBelow >= Math.min(maxHeightLimit, 160) || spaceBelow >= spaceAbove;
      const maxHeight = Math.min(
        maxHeightLimit,
        Math.max(120, openBelow ? spaceBelow - 8 : spaceAbove - 8),
      );

      setPosition({
        top: openBelow ? rect.bottom + gap : Math.max(8, rect.top - gap - maxHeight),
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, anchorRef, gap, maxHeightLimit]);

  return position;
}
