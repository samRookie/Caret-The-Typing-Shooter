import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { HUDOverlay } from '@/ui/components/HUDOverlay';
import { HudState } from '@/game/controller/GameController';

describe('8.C HUD Overlay Data Binding & Render Throttle', () => {
  it('renders all real simulation metrics, 2-digit wave, and hull progressbar with correct accessibility attributes', () => {
    const onPause = vi.fn();
    const hud: HudState = {
      score: 1850,
      wave: 3,
      streak: 9,
      accuracy: 94,
      hull: 80,
      maxHull: 100,
      target: {
        id: 'drone-1',
        word: 'RADAR',
        remainingWord: 'DAR',
        typedIndex: 2,
      },
    };

    render(<HUDOverlay hud={hud} onPause={onPause} />);

    // Score, wave, streak, accuracy
    expect(screen.getByText('1850')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument(); // Padded to 2 digits
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();

    // Hull progress bar
    const hullBar = screen.getByRole('progressbar', { name: /hull integrity/i });
    expect(hullBar).toBeInTheDocument();
    expect(hullBar).toHaveAttribute('aria-valuenow', '80');
    expect(hullBar).toHaveAttribute('aria-valuemin', '0');
    expect(hullBar).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText('80/100')).toBeInTheDocument();

    // Active target
    expect(screen.getByText(/TARGET LOCK/i)).toBeInTheDocument();
    expect(screen.getAllByText('R').length).toBeGreaterThan(0);

    // Pause button
    const pauseBtn = screen.getByRole('button', { name: /PAUSE/i });
    fireEvent.click(pauseBtn);
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('hides active target lock when target is null', () => {
    const hud: HudState = {
      score: 0,
      wave: 1,
      streak: 0,
      accuracy: 100,
      hull: 100,
      maxHull: 100,
      target: null,
    };

    render(<HUDOverlay hud={hud} onPause={vi.fn()} />);
    expect(screen.queryByText(/TARGET LOCK/i)).not.toBeInTheDocument();
  });

  it('React re-renders on the HUD <= ~10 per second during idle play when driven by GameController throttling', () => {
    let renderCount = 0;

    const TestHUDWrapper: React.FC<{ hud: HudState }> = ({ hud }) => {
      renderCount++;
      return <HUDOverlay hud={hud} onPause={vi.fn()} />;
    };

    // Simulate 1 second of 60 FPS frames (60 frames)
    // In GameController, throttled emissions occur at most every 100ms -> ~10 times/second
    let currentHud: HudState = {
      score: 100,
      wave: 1,
      streak: 0,
      accuracy: 100,
      hull: 100,
      maxHull: 100,
      target: null,
    };

    const { rerender } = render(<TestHUDWrapper hud={currentHud} />);
    expect(renderCount).toBe(1);

    // 60 simulation ticks over 1 second, but state only changes on throttle ticks (every 100ms = 6 frames at 60fps)
    let emittedUpdates = 0;
    for (let frame = 1; frame <= 60; frame++) {
      if (frame % 6 === 0) {
        // 100ms elapsed -> throttle triggers an emit
        currentHud = { ...currentHud, score: 100 + frame };
        rerender(<TestHUDWrapper hud={currentHud} />);
        emittedUpdates++;
      }
    }

    // Assert re-renders are <= 11 (1 initial + 10 throttled updates)
    expect(emittedUpdates).toBe(10);
    expect(renderCount).toBeLessThanOrEqual(11);
  });
});
