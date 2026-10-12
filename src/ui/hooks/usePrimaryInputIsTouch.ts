import { useState, useEffect } from 'react';

export const TOUCH_MEDIA_QUERY = '(pointer: coarse) and (hover: none)';

/**
 * usePrimaryInputIsTouch hook (Section 4)
 * Pure media-query based detection of touch-only devices without a precision pointer.
 * Listens dynamically to media query changes (e.g. attaching/detaching keyboard/pointer).
 */
export function usePrimaryInputIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    try {
      return window.matchMedia(TOUCH_MEDIA_QUERY).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    try {
      const mql = window.matchMedia(TOUCH_MEDIA_QUERY);
      const onChange = (e: MediaQueryListEvent) => {
        setIsTouch(e.matches);
      };

      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(onChange);
        return () => mql.removeListener(onChange);
      }
    } catch {
      // Ignored if matchMedia fails
    }
  }, []);

  return isTouch;
}
