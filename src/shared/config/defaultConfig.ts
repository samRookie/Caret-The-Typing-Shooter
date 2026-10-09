import {
  EnemyArchetypeConfig,
  GameplaySimulationConfig,
  RunConfig,
  ScoringRules,
  Vector2,
} from '../domain';
import { WAVE_INTERMISSION_SECONDS } from './progression';

export const DESKTOP_VIEWPORT = {
  width: 1280,
  height: 720,
} as const;

export const PLAYER_START: Vector2 = {
  x: 640,
  y: 620,
};

export const INPUT_QUEUE_CAPACITY = 64;

export const RENDERER_CONFIG = {
  projectileTravelMs: 90,
  projectileCap: 12,
  ghostDurationMs: 250,
  ghostCap: 20,
  playerDamageTintMs: 100,
  backgroundStarCount: 45,
  labelCharWidthPx: 14,
  labelPaddingPx: 12,
  labelFontSizePx: 18,
  labelFontFamily: 'Tektur',
  plateHeightPx: 26,
} as const;

export const TARGET_DRONE_WIDTH = 44;
export const TARGET_SHIP_SIZE = {
  width: 52,
  height: 75,
} as const;

export const SHOW_LOCK_RETICLE = false;

export const HUD_WING_GAP_WORLD = 52;
export const HUD_WING_Y_OFFSET_WORLD = 0;
export const HUD_WING_BOX_WIDTH_WORLD = 84;
export const HUD_WING_BOX_HEIGHT_WORLD = 34;

export const DRONE_ARCHETYPE: EnemyArchetypeConfig = {
  type: 'drone',
  healthPerLetter: 1,
  hitboxRadius: Math.round(0.8 * (TARGET_DRONE_WIDTH / 2)),
};

export const DEFAULT_SCORING_RULES: ScoringRules = {
  scorePerChar: 1,
};

export const DEFAULT_SIMULATION_CONFIG: GameplaySimulationConfig = {
  spawnY: 64,
  spawnMarginX: 60,
  hullRadius: Math.round(0.8 * (TARGET_SHIP_SIZE.width / 2)),
  collisionDamage: 1,
  playerMaxHealth: 3,
  initialSpawnDelaySeconds: 1.0,
  waveIntermissionSeconds: WAVE_INTERMISSION_SECONDS,
  labelCharWidthPx: 14,
  spawnGapWindowSeconds: 1.5,
  commonalityStart: 0.35,
  commonalityStep: 0.1,
  ratingThresholds: {
    S: 97,
    A: 92,
    B: 85,
    C: 75,
  },
  waveScaling: {
    quotaBase: 6,
    quotaPerWave: 2,
    quotaMax: 30,
    spawnIntervalMinRatio: 0.6,
    spawnIntervalDecay: 0.94,
    speedScalePerWave: 0.06,
    speedScaleMaxRatio: 2.0,
    wordLengthWaveStep: 3,
    maxWordLengthCap: 8,
  },
};

export const DEFAULT_RUN_CONFIG: RunConfig = {
  virtualResolution: DESKTOP_VIEWPORT,
  targetFps: 60,
  tickRate: 60,
  seed: 1337,
  playerStart: PLAYER_START,
  reducedMotion: false,
  audioEnabled: true,
  simulation: DEFAULT_SIMULATION_CONFIG,
  mode: 'standard',
};
