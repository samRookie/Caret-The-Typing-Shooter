import {
  DifficultyPreset,
  DifficultyPresetId,
  EnemyArchetypeConfig,
  GameplaySimulationConfig,
  RunConfig,
  ScoringRules,
  Vector2,
} from '../domain';

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
  labelFontFamily: "Consolas, Monaco, 'Courier New', Courier, monospace",
  plateHeightPx: 26,
} as const;

export const DIFFICULTY_PRESETS: Record<DifficultyPresetId, DifficultyPreset> = {
  relaxed: {
    id: 'relaxed',
    name: 'RELAXED CADENCE',
    enemySpeed: 26,
    spawnIntervalMs: 3200,
    maxConcurrentEnemies: 3,
    wordLengthRange: { min: 3, max: 5 },
    playerMaxHealth: 3,
  },
  normal: {
    id: 'normal',
    name: 'STANDARD DEFENSE',
    enemySpeed: 38,
    spawnIntervalMs: 2400,
    maxConcurrentEnemies: 4,
    wordLengthRange: { min: 3, max: 6 },
    playerMaxHealth: 3,
  },
  intense: {
    id: 'intense',
    name: 'HIGH THREAT INVASION',
    enemySpeed: 52,
    spawnIntervalMs: 1700,
    maxConcurrentEnemies: 6,
    wordLengthRange: { min: 4, max: 8 },
    playerMaxHealth: 3,
  },
};

export const TARGET_DRONE_WIDTH = 44;
export const TARGET_SHIP_SIZE = {
  width: 60,
  height: 87,
} as const;

export const SHOW_LOCK_RETICLE = false;

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
  initialSpawnDelaySeconds: 1.0,
  waveIntermissionSeconds: 2,
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
  difficulty: DIFFICULTY_PRESETS.normal,
  playerStart: PLAYER_START,
  reducedMotion: false,
  audioEnabled: true,
  simulation: DEFAULT_SIMULATION_CONFIG,
  mode: 'standard',
};
