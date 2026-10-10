import { ReducedMotionPreference } from './settings/settingsStore';

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

export function isReducedMotionActive(_preference?: ReducedMotionPreference): boolean {
  return false;
}

/**
 * Synchronizes data-reduced-motion attribute on <html> (cleans it up).
 */
export function syncDocumentReducedMotion(_preference?: ReducedMotionPreference): void {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute('data-reduced-motion');
}

/**
 * Returns current motion policy (always full/standard motion).
 */
export function getMotionPolicy(_preference?: ReducedMotionPreference): MotionPolicy {
  return DEFAULT_MOTION_POLICY;
}

/**
 * React hook returning standard motion policy.
 */
export function useMotionPolicy(): MotionPolicy {
  return DEFAULT_MOTION_POLICY;
}
