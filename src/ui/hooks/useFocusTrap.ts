import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible Focus Trap Hook.
 * Enforces modal accessibility:
 * 1. Stores previously focused element on open.
 * 2. Focuses first focusable element (or [data-autofocus]) on open.
 * 3. Traps keyboard Tab / Shift+Tab cycling inside the modal container.
 * 4. Restores focus to previous active element on close.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isActive: boolean = true) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    if (typeof document !== 'undefined') {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    const container = containerRef.current;
    if (!container) return;

    // Focus first focusable element (or explicit data-autofocus element)
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );

    const autoFocusTarget =
      container.querySelector<HTMLElement>('[data-autofocus="true"]') ??
      focusables[0];

    if (autoFocusTarget) {
      // Use setTimeout or requestAnimationFrame to ensure modal is rendered
      requestAnimationFrame(() => {
        autoFocusTarget.focus();
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );

      if (currentFocusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = currentFocusables[0]!;
      const lastElement = currentFocusables[currentFocusables.length - 1]!;
      const currentActive = document.activeElement;

      if (e.shiftKey) {
        // Shift + Tab: if on first element or outside, cycle to last
        if (currentActive === firstElement || !container.contains(currentActive)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element or outside, cycle to first
        if (currentActive === lastElement || !container.contains(currentActive)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}
