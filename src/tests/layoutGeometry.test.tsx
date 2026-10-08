import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  worldToViewportPercent,
  computeWingBoxPositions,
} from '@/shared/geometry/viewportMath';
import { ShipWingBoxes, WingBox } from '@/ui/components/WingBox';
import {
  DESKTOP_VIEWPORT,
  PLAYER_START,
  TARGET_SHIP_SIZE,
  HUD_WING_GAP_WORLD,
  HUD_WING_BOX_WIDTH_WORLD,
} from '@/shared/config/defaultConfig';

describe('Tactical Viewport Math & Geometry (Spec 5.D)', () => {
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
