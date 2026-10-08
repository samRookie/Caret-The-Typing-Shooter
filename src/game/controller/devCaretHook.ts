import type { GameRuntime } from './GameRuntime';
import type { GameScene } from '../scenes/GameScene';

/**
 * Installs window.__caret dev inspection hook strictly in DEV mode.
 * Spec 7.E:
 * window.__caret = { getSnapshot, getDebugCounts, getCommandLog, currentTick } exists only on the dev server.
 */
export function installDevCaretHook(
  getRuntime: () => GameRuntime | null | undefined,
  getScene?: () => GameScene | null | undefined
): () => void {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return () => {};
  }

  function computeListenerCount(scene?: GameScene | null): number {
    if (!scene) return 0;
    let count = 0;
    try {
      const sceneEvents = scene.events;
      if (sceneEvents && typeof sceneEvents.eventNames === 'function') {
        for (const name of sceneEvents.eventNames()) {
          count += sceneEvents.listenerCount(name);
        }
      }
      const gameEvents = scene.game?.events;
      if (gameEvents && typeof gameEvents.eventNames === 'function') {
        for (const name of gameEvents.eventNames()) {
          count += gameEvents.listenerCount(name);
        }
      }
    } catch {
      // safe fallback for testing
    }
    return count;
  }

  window.__caret = {
    getSnapshot: () => {
      const rt = getRuntime();
      return rt ? rt.getSnapshot() : null;
    },
    getDebugCounts: () => {
      const rt = getRuntime();
      const scene = getScene ? getScene() : null;
      const renderer = scene?.getGameRenderer();
      const snapshot = rt ? rt.getSnapshot() : null;

      return {
        tick: rt?.currentTick ?? 0,
        enemyCount: snapshot?.enemies.length ?? 0,
        enemyViews: renderer?.activeEnemiesCount ?? 0,
        ghosts: renderer?.activeGhostsCount ?? 0,
        projectiles: renderer?.activeProjectilesCount ?? 0,
        childrenCount: scene?.children?.length ?? 0,
        listenerCount: computeListenerCount(scene),
        fps: Math.round((scene?.game?.loop?.actualFps ?? 60) * 10) / 10,
      };
    },
    getCommandLog: () => {
      const rt = getRuntime();
      return rt ? rt.getCommandLog() : [];
    },
    getViewMetrics: () => {
      const scene = getScene ? getScene() : null;
      const renderer = scene?.getGameRenderer();
      return renderer ? renderer.getViewMetrics() : null;
    },
    get currentTick() {
      const rt = getRuntime();
      return rt ? rt.currentTick : 0;
    },
  };

  return () => {
    if (typeof window !== 'undefined') {
      delete window.__caret;
    }
  };
}
