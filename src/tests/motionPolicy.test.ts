import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  getMotionPolicy,
  useMotionPolicy,
  DEFAULT_MOTION_POLICY,
  REDUCED_MOTION_POLICY,
  isReducedMotionActive,
} from '@/shared/motion';
import { settingsStore } from '@/shared/settings/settingsStore';

describe('MotionPolicy (Standard Motion Architecture)', () => {
  beforeEach(() => {
    settingsStore.resetSettings();
    vi.restoreAllMocks();
  });

  it('provides expected default and reduced policy shapes', () => {
    expect(DEFAULT_MOTION_POLICY).toEqual({
      reduced: false,
      particleScale: 1,
      shake: true,
      flash: true,
      tweenScale: 1,
    });

    expect(REDUCED_MOTION_POLICY).toEqual({
      reduced: true,
      particleScale: 0.3,
      shake: false,
      flash: false,
      tweenScale: 0.5,
    });
  });

  it('isReducedMotionActive always returns false', () => {
    expect(isReducedMotionActive()).toBe(false);
    expect(getMotionPolicy()).toBe(DEFAULT_MOTION_POLICY);
  });

  it('useMotionPolicy hook always returns standard motion policy', () => {
    const { result } = renderHook(() => useMotionPolicy());
    expect(result.current.reduced).toBe(false);
    expect(result.current.particleScale).toBe(1);
    expect(result.current.shake).toBe(true);
    expect(result.current.flash).toBe(true);
  });
});

