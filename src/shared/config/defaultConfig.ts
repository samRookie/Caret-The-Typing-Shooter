import {
  DifficultyPreset,
  DifficultyPresetId,
  EnemyArchetypeConfig,
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

export const DIFFICULTY_PRESETS: Record<DifficultyPresetId, DifficultyPreset> = {
  relaxed: {
    id: 'relaxed',
    name: 'RELAXED CADENCE',
    enemySpeed: 26,
    spawnIntervalMs: 3200,
    maxConcurrentEnemies: 3,
    wordLengthRange: { min: 3, max: 5 },
    playerMaxHealth: 100,
  },
  normal: {
    id: 'normal',
    name: 'STANDARD DEFENSE',
    enemySpeed: 38,
    spawnIntervalMs: 2400,
    maxConcurrentEnemies: 4,
    wordLengthRange: { min: 3, max: 6 },
    playerMaxHealth: 100,
  },
  intense: {
    id: 'intense',
    name: 'HIGH THREAT INVASION',
    enemySpeed: 52,
    spawnIntervalMs: 1700,
    maxConcurrentEnemies: 6,
    wordLengthRange: { min: 4, max: 8 },
    playerMaxHealth: 100,
  },
};

export const DRONE_ARCHETYPE: EnemyArchetypeConfig = {
  type: 'drone',
  baseHealth: 1,
  baseSpeed: 38,
  hitboxRadius: 24,
  baseScore: 100,
};

export const DEFAULT_SCORING_RULES: ScoringRules = {
  scorePerChar: 10,
  enemyClearBonus: 100,
  multiplierThresholds: [
    { streak: 0, multiplier: 1 },
    { streak: 5, multiplier: 2 },
    { streak: 10, multiplier: 3 },
    { streak: 20, multiplier: 4 },
  ],
};

export const DEFAULT_RUN_CONFIG: RunConfig = {
  virtualResolution: DESKTOP_VIEWPORT,
  targetFps: 60,
  difficulty: DIFFICULTY_PRESETS.normal,
  playerStart: PLAYER_START,
  reducedMotion: false,
  audioEnabled: true,
};
