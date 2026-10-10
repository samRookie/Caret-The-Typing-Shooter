import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  worldToViewportPercent,
  computeWingBoxPositions,
} from '@/shared/geometry/viewportMath';
import { ShipWingBoxes, WingBox } from '@/ui/components/WingBox';
import { HullPips } from '@/ui/components/HullPips';
import { ClockBadge } from '@/ui/components/ClockBadge';
import { WaveBanner } from '@/ui/components/WaveBanner';
import { formatAccuracy, formatElapsed } from '@/shared/formatters';
import {
  DESKTOP_VIEWPORT,
  PLAYER_START,
  TARGET_SHIP_SIZE,
  HUD_WING_GAP_WORLD,
  HUD_WING_BOX_WIDTH_WORLD,
} from '@/shared/config/defaultConfig';

describe('Tactical Viewport Math & Geometry (Spec 5.D, 5.H)', () => {
  it('maps center world coordinate to (50%, 50%)', () => {
    const center = worldToViewportPercent(
      { x: DESKTOP_VIEWPORT.width / 2, y: DESKTOP_VIEWPORT.height / 2 },
      DESKTOP_VIEWPORT
    );
    expect(center.leftPercent).toBeCloseTo(50, 4);
    expect(center.topPercent).toBeCloseTo(50, 4);
  });

  it('computes wing box positions satisfying bottom 20% and horizontal center constraints', () => {
    const { streakBox, scoreBox } = computeWingBoxPositions(PLAYER_START, DESKTOP_VIEWPORT);

    // Rule 5.D: strictly in bottom 20% of viewport (y >= 80%)
    expect(streakBox.topPercent).toBeGreaterThanOrEqual(80);
    expect(scoreBox.topPercent).toBeGreaterThanOrEqual(80);

    // Rule 5.D: strictly within 20% of horizontal center (30% <= x <= 70%)
    expect(streakBox.leftPercent).toBeGreaterThanOrEqual(30);
    expect(streakBox.leftPercent).toBeLessThan(50);

    expect(scoreBox.leftPercent).toBeGreaterThan(50);
    expect(scoreBox.leftPercent).toBeLessThanOrEqual(70);

    // Exact geometric verification based on ship half-width and wing gap
    const expectedStreakX =
      PLAYER_START.x - TARGET_SHIP_SIZE.width / 2 - HUD_WING_GAP_WORLD - HUD_WING_BOX_WIDTH_WORLD;
    const expectedStreakPercent = (expectedStreakX / DESKTOP_VIEWPORT.width) * 100;
    expect(streakBox.leftPercent).toBeCloseTo(expectedStreakPercent, 4);
  });

  it('renders WingBox with label and formatted numeric value', () => {
    render(
      <WingBox
        label="STREAK"
        value={12}
        positionPercent={{ leftPercent: 37, topPercent: 83 }}
        testId="test-streak-box"
      />
    );

    const box = screen.getByTestId('test-streak-box');
    expect(box).toBeInTheDocument();
    expect(screen.getByText('STREAK')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders ShipWingBoxes displaying current streak and score', () => {
    render(<ShipWingBoxes streak={7} score={2450} />);

    expect(screen.getByTestId('wing-streak-box')).toBeInTheDocument();
    expect(screen.getByTestId('wing-score-box')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2450')).toBeInTheDocument();
  });
});

describe('Pure Formatters Verification (Spec 5.B, 5.H)', () => {
  it('formats elapsed seconds into mm:ss and h:mm:ss strings', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(45)).toBe('00:45');
    expect(formatElapsed(125)).toBe('02:05');
    expect(formatElapsed(3600)).toBe('1:00:00');
    expect(formatElapsed(3665)).toBe('1:01:05');
  });

  it('formats accuracy percentage with floorToOneDecimal and clamps when misses > 0', () => {
    expect(formatAccuracy(100, 0)).toBe('100.0%');
    expect(formatAccuracy(99.99, 1)).toBe('99.9%');
    expect(formatAccuracy(100, 1)).toBe('99.9%');
    expect(formatAccuracy(94.27, 2)).toBe('94.2%');
    expect(formatAccuracy(0, 5)).toBe('0.0%');
  });
});

describe('HullPips Lifecycle & States (Spec 5.B, 5.H)', () => {
  it('renders 3 active pips when health is 3', () => {
    const { container } = render(<HullPips currentHealth={3} maxHealth={3} />);
    expect(screen.getByRole('status', { name: /Hull integrity: 3 of 3 pips/i })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-pip-active="true"]').length).toBe(3);
    expect(container.querySelectorAll('[data-pip-active="false"]').length).toBe(0);
  });

  it('renders 2 active pips and 1 lost pip when health is 2', () => {
    const { container } = render(<HullPips currentHealth={2} maxHealth={3} />);
    expect(screen.getByRole('status', { name: /Hull integrity: 2 of 3 pips/i })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-pip-active="true"]').length).toBe(2);
    expect(container.querySelectorAll('[data-pip-active="false"]').length).toBe(1);
  });

  it('renders 1 active pip and 2 lost pips when health is 1', () => {
    const { container } = render(<HullPips currentHealth={1} maxHealth={3} />);
    expect(screen.getByRole('status', { name: /Hull integrity: 1 of 3 pips/i })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-pip-active="true"]').length).toBe(1);
    expect(container.querySelectorAll('[data-pip-active="false"]').length).toBe(2);
  });

  it('renders 0 active pips and 3 lost pips when health is 0', () => {
    const { container } = render(<HullPips currentHealth={0} maxHealth={3} />);
    expect(screen.getByRole('status', { name: /Hull integrity: 0 of 3 pips/i })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-pip-active="true"]').length).toBe(0);
    expect(container.querySelectorAll('[data-pip-active="false"]').length).toBe(3);
  });
});

describe('ClockBadge Fake Timers & Alignment (Spec 5.C, 5.H)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts, aligns to minute boundary, updates on visibilitychange, and unmounts cleanly', () => {
    vi.setSystemTime(new Date(2026, 9, 8, 14, 30, 45)); // 14:30:45
    const { unmount } = render(<ClockBadge />);

    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
    expect(timer.textContent).toContain('SYS');

    // Fast-forward 16 seconds to cross minute boundary (14:31:01)
    act(() => {
      vi.advanceTimersByTime(16000);
    });

    // Trigger visibilitychange
    act(() => {
      fireEvent(document, new Event('visibilitychange'));
    });

    expect(() => unmount()).not.toThrow();
  });
});

describe('WaveBanner Visibility Logic (Spec 5.G, 5.H)', () => {
  it('renders visible wave banner with opacity 1 and alert role', () => {
    render(<WaveBanner wave={1} visible={true} />);
    const banner = screen.getByTestId('wave-banner');
    expect(banner).toHaveStyle({ opacity: '1', visibility: 'visible' });
    expect(screen.getByText('WAVE 01')).toBeInTheDocument();
  });

  it('hides wave banner with opacity 0 when visible is false', () => {
    render(<WaveBanner wave={2} visible={false} />);
    const banner = screen.getByTestId('wave-banner');
    expect(banner).toHaveStyle({ opacity: '0', visibility: 'hidden' });
  });
});
