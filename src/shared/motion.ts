import { useEffect, useState } from 'react';
import { settingsStore, ReducedMotionPreference } from './settings/settingsStore';

export interface MotionPolicy {
  readonly reduced: boolean;
  readonly particleScale: number;
  readonly shake: boolean;
  readonly flash: boolean;
  readonly tweenScale: number;
}

export const DEFAULT_MOTION_POLICY: MotionPolicy = {
  reduced: false,
  particleScale: 1,
  shake: true,
  flash: true,
  tweenScale: 1,
};

export const REDUCED_MOTION_POLICY: MotionPolicy = {
  reduced: true,
  particleScale: 0.3,
  shake: false,
  flash: false,
  tweenScale: 0.5,
};

function querySystemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isReducedMotionActive(preference?: ReducedMotionPreference): boolean {
  const pref = preference ?? settingsStore.getSettings().reducedMotion;
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return querySystemPrefersReducedMotion();
}

/**
 * Returns current motion policy for Phaser and headless logic.
 * Evaluated when an effect fires so mid-run changes apply immediately.
 */
export function getMotionPolicy(preference?: ReducedMotionPreference): MotionPolicy {
  return isReducedMotionActive(preference) ? REDUCED_MOTION_POLICY : DEFAULT_MOTION_POLICY;
}

/**
 * React hook that subscribes to settingsStore and system matchMedia change events.
 */
export function useMotionPolicy(): MotionPolicy {
  const [policy, setPolicy] = useState<MotionPolicy>(() => getMotionPolicy());

  useEffect(() => {
    const update = () => {
      setPolicy(getMotionPolicy());
    };

    // Subscribe to settings store changes
    const unsubscribeStore = settingsStore.subscribe(update);

    // Subscribe to system matchMedia changes
    let mql: MediaQueryList | null = null;
    let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        mqlHandler = () => {
          if (settingsStore.getSettings().reducedMotion === 'system') {
            update();
          }
        };
        if (typeof mql.addEventListener === 'function') {
          mql.addEventListener('change', mqlHandler);
        } else if (
          typeof (mql as unknown as { addListener?: unknown }).addListener === 'function'
        ) {
          (mql as unknown as { addListener: (h: unknown) => void }).addListener(mqlHandler);
        }
      } catch {
        // Safe fallback for environments with partial matchMedia support
      }
    }

    return () => {
      unsubscribeStore();
      if (mql && mqlHandler) {
        if (typeof mql.removeEventListener === 'function') {
          mql.removeEventListener('change', mqlHandler);
        } else if (
          typeof (mql as unknown as { removeListener?: unknown }).removeListener === 'function'
        ) {
          (mql as unknown as { removeListener: (h: unknown) => void }).removeListener(mqlHandler);
        }
      }
    };
  }, []);

  return policy;
}
