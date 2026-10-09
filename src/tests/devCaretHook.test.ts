import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { installDevCaretHook } from '@/game/controller/devCaretHook';
import { GameRuntime } from '@/game/controller/GameRuntime';
import type { GameScene } from '@/game/scenes/GameScene';

describe('Dev Caret Inspection Hook (7.E)', () => {
  let runtime: GameRuntime;
  let unregister: (() => void) | null = null;

  beforeEach(() => {
    runtime = new GameRuntime();
  });

  afterEach(() => {
    if (unregister) {
      unregister();
      unregister = null;
    }
  });

  it('installs window.__caret with getSnapshot, getDebugCounts, getCommandLog, currentTick in DEV', () => {
    const mockScene = {
      children: { length: 5 },
      events: {
        eventNames: () => ['boot', 'update'],
        listenerCount: () => 2,
      },
      game: {
        events: {
          eventNames: () => ['ready'],
          listenerCount: () => 1,
        },
        loop: {
          actualFps: 59.9,
        },
      },
      getGameRenderer: () => ({
        activeEnemiesCount: 2,
        activeGhostsCount: 1,
        activeProjectilesCount: 3,
        getViewMetrics: () => ({
          playerShip: { displayWidth: 60, displayHeight: 87 },
          drones: [],
          labelPlateHeadroomMin: 7,
        }),
      }),
    } as unknown as GameScene;

    unregister = installDevCaretHook(() => runtime, () => mockScene);

    expect(window.__caret).toBeDefined();
    expect(window.__caret?.currentTick).toBe(0);

    const snapshot = window.__caret?.getSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot?.status).toBe('running');

    const counts = window.__caret?.getDebugCounts();
    expect(counts).toEqual({
      tick: 0,
      enemyCount: snapshot?.enemies.length ?? 0,
      enemyViews: 2,
      ghosts: 1,
      projectiles: 3,
      childrenCount: 5,
      listenerCount: 5, // 2*2 + 1*1 = 5
      fps: 59.9,
    });

    const log = window.__caret?.getCommandLog();
    expect(Array.isArray(log)).toBe(true);

    const metrics = window.__caret?.getViewMetrics?.();
    expect(metrics).toBeDefined();

    const effectCounts = window.__caret?.getEffectCounts?.();
    expect(effectCounts).toBeDefined();
    expect(typeof effectCounts?.liveParticles).toBe('number');

    const audioLog = window.__caret?.getAudioLog?.();
    expect(Array.isArray(audioLog)).toBe(true);

    const audioState = window.__caret?.getAudioContextState?.();
    expect(typeof audioState).toBe('string');
  });

  it('unregister cleans up window.__caret', () => {
    unregister = installDevCaretHook(() => runtime);
    expect(window.__caret).toBeDefined();

    unregister();
    unregister = null;
    expect(window.__caret).toBeUndefined();
  });
});
