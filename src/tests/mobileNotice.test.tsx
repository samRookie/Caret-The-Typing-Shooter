import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { usePrimaryInputIsTouch, TOUCH_MEDIA_QUERY } from '@/ui/hooks/usePrimaryInputIsTouch';
import { MenuScreen, DISMISS_MOBILE_NOTICE_KEY } from '@/ui/components/MenuScreen';

describe('Mobile / Touch Input Detection & Notice (Section 4)', () => {
  let listeners: ((e: MediaQueryListEvent) => void)[] = [];
  let matchesValue = false;

  beforeEach(() => {
    listeners = [];
    matchesValue = false;
    window.sessionStorage.clear();

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === TOUCH_MEDIA_QUERY ? matchesValue : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') listeners.push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          listeners = listeners.filter((l) => l !== cb);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('usePrimaryInputIsTouch returns false for desktop pointer and reacts to media query changes', () => {
    matchesValue = false;
    const { result } = renderHook(() => usePrimaryInputIsTouch());
    expect(result.current).toBe(false);

    // Simulate attaching touch screen or coarse pointer
    act(() => {
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent));
    });
    expect(result.current).toBe(true);

    // Simulate returning to mouse / fine pointer
    act(() => {
      listeners.forEach((l) => l({ matches: false } as MediaQueryListEvent));
    });
    expect(result.current).toBe(false);
  });

  it('usePrimaryInputIsTouch returns true when primary pointer is coarse and hover is none', () => {
    matchesValue = true;
    const { result } = renderHook(() => usePrimaryInputIsTouch());
    expect(result.current).toBe(true);
  });

  it('does NOT render notice on MenuScreen when input is not touch-only', () => {
    matchesValue = false;
    render(<MenuScreen onPlay={vi.fn()} />);

    expect(screen.queryByTestId('mobile-keyboard-notice')).not.toBeInTheDocument();
    expect(screen.queryByText(/PHYSICAL KEYBOARD REQUIRED/i)).not.toBeInTheDocument();
  });

  it('renders prominent informational notice on MenuScreen when input is touch-only', () => {
    matchesValue = true;
    render(<MenuScreen onPlay={vi.fn()} />);

    const notice = screen.getByTestId('mobile-keyboard-notice');
    expect(notice).toBeInTheDocument();
    expect(screen.getByText(/PHYSICAL KEYBOARD REQUIRED/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Caret is designed for hardware keyboards\. On-screen keyboards are not supported\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CONTINUE ANYWAY/i })).toBeInTheDocument();
  });

  it('dismissing the notice hides it and persists flag in sessionStorage', () => {
    matchesValue = true;
    const { rerender } = render(<MenuScreen onPlay={vi.fn()} />);

    expect(screen.getByTestId('mobile-keyboard-notice')).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /CONTINUE ANYWAY/i });
    fireEvent.click(continueBtn);

    expect(screen.queryByTestId('mobile-keyboard-notice')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(DISMISS_MOBILE_NOTICE_KEY)).toBe('1');

    // Rerender or remount: remains dismissed
    rerender(<MenuScreen onPlay={vi.fn()} />);
    expect(screen.queryByTestId('mobile-keyboard-notice')).not.toBeInTheDocument();
  });

  it('remains completely non-blocking: play button still triggers onPlay even when notice is shown', () => {
    matchesValue = true;
    const onPlay = vi.fn();
    render(<MenuScreen onPlay={onPlay} />);

    expect(screen.getByTestId('mobile-keyboard-notice')).toBeInTheDocument();

    const playBtn = screen.getByRole('button', { name: /NEW GAME/i });
    expect(playBtn).toBeEnabled();
    fireEvent.click(playBtn);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});
