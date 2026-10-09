import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  getMotionPolicy,
  useMotionPolicy,
  DEFAULT_MOTION_POLICY,
  REDUCED_MOTION_POLICY,
  isReducedMotionActive,
} from '@/shared/motion';
import { settingsStore } from '@/shared/settings/settingsStore';

describe('MotionPolicy (Section 1)', () => {
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

  it('evaluates explicit "on" and "off" settings immediately', () => {
    settingsStore.set({ reducedMotion: 'off' });
    expect(isReducedMotionActive()).toBe(false);
    expect(getMotionPolicy()).toBe(DEFAULT_MOTION_POLICY);

    settingsStore.set({ reducedMotion: 'on' });
    expect(isReducedMotionActive()).toBe(true);
    expect(getMotionPolicy()).toBe(REDUCED_MOTION_POLICY);
  });

  it('delegates to system matchMedia when preference is "system"', () => {
    settingsStore.set({ reducedMotion: 'system' });

    // Mock matchMedia returning true (system prefers reduced motion)
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isReducedMotionActive()).toBe(true);
    expect(getMotionPolicy()).toBe(REDUCED_MOTION_POLICY);

    // Mock matchMedia returning false
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isReducedMotionActive()).toBe(false);
    expect(getMotionPolicy()).toBe(DEFAULT_MOTION_POLICY);
  });

  it('useMotionPolicy hook updates reactively on store changes and media query changes', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    settingsStore.set({ reducedMotion: 'off' });
    const { result } = renderHook(() => useMotionPolicy());
    expect(result.current.reduced).toBe(false);

    // Update setting to 'on'
    act(() => {
      settingsStore.set({ reducedMotion: 'on' });
    });
    expect(result.current.reduced).toBe(true);
    expect(result.current.particleScale).toBe(0.3);

    // Update setting to 'system'
    act(() => {
      settingsStore.set({ reducedMotion: 'system' });
    });
    expect(result.current.reduced).toBe(false);

    // Trigger system media query change
    if (changeHandler) {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      act(() => {
        changeHandler!({ matches: true } as MediaQueryListEvent);
      });
      expect(result.current.reduced).toBe(true);
    }
  });
});
