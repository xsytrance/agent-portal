/**
 * useHoverDetection
 *
 * Detects hover events on specific elements and reports them to AtlasBrain.
 * Uses `data-atlas-interact` attributes to identify interactive zones.
 * Throttles reports: only signals every ~5th unique hover target to avoid spam.
 *
 * @example
 * ```tsx
 * const { hoverProps } = useHoverDetection((target) => {
 *   brain.signalHover(target);
 * });
 *
 * <div {...hoverProps('hero-section')}>...</div>
 * ```
 */

import { useCallback, useRef } from 'react';

export interface HoverProps {
  'data-atlas-interact': string;
  onMouseEnter: (e: React.MouseEvent) => void;
}

export function useHoverDetection(onHover: (target: string) => void) {
  /** Tracks the last reported hover target to debounce duplicates */
  const lastHoverRef = useRef<string | null>(null);
  /** Counts total hovers for throttling */
  const hoverCountRef = useRef(0);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      // Prefer explicit data-atlas-interact, fall back to tag name
      const target =
        el.dataset.atlasInteract ?? el.tagName.toLowerCase();

      // Only react to new targets (debounce)
      if (lastHoverRef.current !== target) {
        lastHoverRef.current = target;
        hoverCountRef.current++;

        // Report every ~5th unique hover (rare reactions)
        if (hoverCountRef.current % 5 === 0) {
          onHover(target);
        }
      }
    },
    [onHover],
  );

  /**
   * Returns spreadable props for an element that should report hover.
   * @param identifier - Unique name for this interactive zone
   */
  const hoverProps = useCallback(
    (identifier: string): HoverProps => ({
      'data-atlas-interact': identifier,
      onMouseEnter: handleMouseEnter,
    }),
    [handleMouseEnter],
  );

  /** Returns current hover count (callable, no re-render) */
  const getHoverCount = useCallback(() => hoverCountRef.current, []);

  return { hoverProps, getHoverCount };
}
