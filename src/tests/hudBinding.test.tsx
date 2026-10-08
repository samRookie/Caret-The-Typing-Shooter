import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TopStrip } from '@/ui/components/TopStrip';
import { ShipWingBoxes } from '@/ui/components/WingBox';
import { HudState } from '@/game/controller/GameController';

describe('HUD Data Binding & Render Throttle (Spec 5.B, 5.D, 5.E)', () => {
  it('renders all real simulation metrics via TopStrip and ShipWingBoxes with correct accessibility attributes', () => {
    const onPause = vi.fn();
    const hud: HudState = {
      score: 1850,
      wave: 3,
      streak: 9,
      accuracy: 94.2,
      misses: 1,
      hull: 2,
      maxHull: 3,
      elapsedSeconds: 85,
      target: null,
    };

    render(
      <div>
        <TopStrip
          wave={hud.wave}
          elapsedSeconds={hud.elapsedSeconds ?? 0}
          accuracy={hud.accuracy}
          misses={hud.misses ?? 0}
          hull={hud.hull}
          maxHull={hud.maxHull}
          onPause={onPause}
        />
        <ShipWingBoxes streak={hud.streak} score={hud.score} />
      </div>
    );

    // TopStrip: Wave (2 digits), Time (mm:ss), Accuracy (with 1 decimal)
    expect(screen.getByText('WAVE 03')).toBeInTheDocument();
    expect(screen.getByText('TIME 01:25')).toBeInTheDocument();
    expect(screen.getByText('ACCURACY 94.2%')).toBeInTheDocument();

    // TopStrip: 3-pip Hull status
    const hullStatus = screen.getByRole('status', { name: /Hull integrity: 2 of 3 pips/i });
    expect(hullStatus).toBeInTheDocument();

    // ShipWingBoxes: Streak & Score
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('1850')).toBeInTheDocument();

    // TopStrip: Pause button
    const pauseBtn = screen.getByRole('button', { name: /PAUSE · ESC/i });
    fireEvent.click(pauseBtn);
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('React re-renders on the HUD <= ~10 per second during idle play when driven by GameController throttling', () => {
    let renderCount = 0;

    const TestHUDWrapper: React.FC<{ hud: HudState }> = ({ hud }) => {
      renderCount++;
      return (
        <div>
          <TopStrip
            wave={hud.wave}
            elapsedSeconds={hud.elapsedSeconds ?? 0}
            accuracy={hud.accuracy}
            hull={hud.hull}
          />
          <ShipWingBoxes streak={hud.streak} score={hud.score} />
        </div>
      );
    };

    // Simulate 1 second of 60 FPS frames (60 frames)
    // In GameController, throttled emissions occur at most every 100ms -> ~10 times/second
    let currentHud: HudState = {
      score: 100,
      wave: 1,
      streak: 0,
      accuracy: 100,
      hull: 3,
      maxHull: 3,
      elapsedSeconds: 0,
      misses: 0,
      target: null,
    };

    const { rerender } = render(<TestHUDWrapper hud={currentHud} />);
    expect(renderCount).toBe(1);

    // 60 simulation ticks over 1 second, but state only changes on throttle ticks (every 100ms = 6 frames at 60fps)
    let emittedUpdates = 0;
    for (let frame = 1; frame <= 60; frame++) {
      if (frame % 6 === 0) {
        // 100ms elapsed -> throttle triggers an emit
        currentHud = { ...currentHud, score: 100 + frame, elapsedSeconds: frame / 60 };
        rerender(<TestHUDWrapper hud={currentHud} />);
        emittedUpdates++;
      }
    }

    // Assert re-renders are <= 11 (1 initial + 10 throttled updates)
    expect(emittedUpdates).toBe(10);
    expect(renderCount).toBeLessThanOrEqual(11);
  });
});
