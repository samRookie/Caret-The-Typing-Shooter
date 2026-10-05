/// <reference types="vite/client" />

interface CaretDebugCounts {
  tick: number;
  enemyCount: number;
  enemyViews: number;
  ghosts: number;
  projectiles: number;
  childrenCount: number;
  listenerCount: number;
  fps: number;
}

interface Window {
  __caret?: {
    getSnapshot: () => import('@/shared/domain').GameSnapshot | null;
    getDebugCounts: () => CaretDebugCounts;
    getCommandLog: () => import('@/game/controller').CommandLogEntry[];
    currentTick: number;
  };
}
