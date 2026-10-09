import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { HullPips } from '@/ui/components/HullPips';
import { ShipWingBoxes } from '@/ui/components/WingBox';
import { GameController } from '@/game/controller/GameController';
import { feedbackBus } from '@/game/controller/FeedbackBus';
import { settingsStore } from '@/shared/settings/settingsStore';
import { historyStore } from '@/shared/history/historyStore';
import { EFFECT_CONFIG } from '@/shared/config/effectsConfig';

describe('HUD Feedback & Game-Over Sequence (Section 4 & 8)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    settingsStore.resetSettings();
    historyStore.clear();
    feedbackBus.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders HullPips correctly across 3/2/1/0 health in standard and reduced motion', () => {
    // 3 pips
    const { rerender } = render(<HullPips currentHealth={3} />);
    expect(screen.getAllByRole('status')[0]).toHaveAttribute(
      'aria-label',
      'Hull integrity: 3 of 3 pips'
    );

    // 2 pips
    rerender(<HullPips currentHealth={2} />);
    expect(screen.getAllByRole('status')[0]).toHaveAttribute(
      'aria-label',
      'Hull integrity: 2 of 3 pips'
    );

    // 1 pip: triggers last-life styling
    rerender(<HullPips currentHealth={1} />);
    const lastLifePip = document.querySelector('[data-pip-last-life="true"]');
    expect(lastLifePip).not.toBeNull();

    // 0 pips: all depleted
    rerender(<HullPips currentHealth={0} />);
    expect(screen.getAllByRole('status')[0]).toHaveAttribute(
      'aria-label',
      'Hull integrity: 0 of 3 pips'
    );
  });

  it('FeedbackBus: last-life signal is emitted at most once per run and resets on reset()', () => {
    const listener = vi.fn();
    const unsub = feedbackBus.subscribe(listener);

    feedbackBus.emit('last-life');
    feedbackBus.emit('last-life');
    expect(listener).toHaveBeenCalledTimes(1);

    feedbackBus.reset();
    feedbackBus.emit('last-life');
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
  });

  it('StreakBox: flashes danger border on mismatch signal and retriggers on rapid misses', () => {
    render(<ShipWingBoxes streak={5} score={100} />);

    const streakBox = screen.getByTestId('wing-streak-box');
    const scoreBox = screen.getByTestId('wing-score-box');

    expect(streakBox.style.border).toContain('var(--border)');
    expect(scoreBox.style.border).toContain('var(--border)');

    // Trigger mismatch signal
    act(() => {
      feedbackBus.emit('mismatch');
    });

    expect(streakBox.style.border).toContain('var(--danger');
    expect(scoreBox.style.border).toContain('var(--border)'); // score box never animates

    // Advance 100ms and retrigger
    act(() => {
      vi.advanceTimersByTime(100);
      feedbackBus.emit('mismatch');
    });
    expect(streakBox.style.border).toContain('var(--danger');

    // Advance past 150ms
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(streakBox.style.border).toContain('var(--border)');
  });

  it('GameController: enters game-over-pending, delays 900ms (300ms reduced), ignores inputs, opens panel', () => {
    settingsStore.set({ reducedMotion: 'off' });
    const controller = new GameController();
    controller.start();

    // Step frames until game over occurs via simulation collision
    const sim = controller.runtime!.simulation;
    while (sim.getSnapshot().status !== 'game-over') {
      controller.frame(0.05);
    }
    // Pump the frame that transitions controller into game-over-pending
    controller.frame(0.016);
    expect(controller.getState().screen).toBe('game-over-pending');

    // Attempt to pause/resume during pending
    controller.pause();
    expect(controller.getState().screen).toBe('game-over-pending');

    // Advance time by 800ms (before 900ms delay)
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(controller.getState().screen).toBe('game-over-pending');

    // Advance remaining 150ms -> reaches game-over
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(controller.getState().screen).toBe('game-over');

    controller.destroy();
  });

  it('GameController: reduced motion uses 300ms delay', () => {
    settingsStore.set({ reducedMotion: 'on' });
    const controller = new GameController();
    controller.start();

    const sim = controller.runtime!.simulation;
    while (sim.getSnapshot().status !== 'game-over') {
      controller.frame(0.05);
    }
    controller.frame(0.016);
    expect(controller.getState().screen).toBe('game-over-pending');

    act(() => {
      vi.advanceTimersByTime(EFFECT_CONFIG.GAME_OVER_PANEL_DELAY_REDUCED_MS + 20);
    });
    expect(controller.getState().screen).toBe('game-over');

    controller.destroy();
  });

  it('GameController: restart during pending cancels pending timer cleanly', () => {
    const controller = new GameController();
    controller.start();

    const sim = controller.runtime!.simulation;
    while (sim.getSnapshot().status !== 'game-over') {
      controller.frame(0.05);
    }
    controller.frame(0.016);
    expect(controller.getState().screen).toBe('game-over-pending');

    // Restart before timer expires
    controller.restart();
    expect(controller.getState().screen).toBe('running');

    // Advance time: should NOT switch to game-over
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(controller.getState().screen).toBe('running');

    controller.destroy();
  });

  it('GameController: destroy cancels pending timers and cleans up listeners', () => {
    const controller = new GameController();
    controller.start();

    const sim = controller.runtime!.simulation;
    while (sim.getSnapshot().status !== 'game-over') {
      controller.frame(0.05);
    }
    controller.frame(0.016);
    expect(controller.getState().screen).toBe('game-over-pending');

    controller.destroy();
    expect(controller.isDestroyed).toBe(true);
  });
});
