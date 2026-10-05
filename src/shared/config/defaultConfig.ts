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
  healthPerLetter: 1,
  hitboxRadius: 24,
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

export const DEFAULT_SIMULATION_CONFIG: GameplaySimulationConfig = {
  spawnY: 40,
  spawnMarginX: 60,
  hullRadius: 28,
  collisionDamage: 20,
  initialSpawnDelaySeconds: 1.0,
  waveIntermissionSeconds: 2,
  labelCharWidthPx: 14,
  waveClearBonus: 100,
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
