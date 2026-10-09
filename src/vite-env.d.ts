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

interface CaretDroneMetric {
  id: string;
  displayWidth: number;
  displayHeight: number;
  labelPlateTop: number;
  labelPlateBottom: number;
  spriteTop: number;
  headroom: number;
}

interface CaretViewMetrics {
  playerShip: {
    displayWidth: number;
    displayHeight: number;
  };
  drones: CaretDroneMetric[];
  labelPlateHeadroomMin: number;
}

interface Window {
  __caret?: {
    getSnapshot: () => import('@/shared/domain').GameSnapshot | null;
    getDebugCounts: () => CaretDebugCounts;
    getCommandLog: () => import('@/game/controller').CommandLogEntry[];
    getViewMetrics?: () => CaretViewMetrics | null;
    getEffectCounts?: () => import('@/game/rendering/effects/EffectBackend').EffectCounts;
    getAudioLog?: () => readonly import('@/game/rendering/audio/AudioManager').SoundPlayRecord[];
    getAudioContextState?: () => string;
    currentTick: number;
  };
}
