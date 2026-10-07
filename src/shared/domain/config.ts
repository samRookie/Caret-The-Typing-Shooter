import { EnemyType } from './entities';
import { Vector2 } from './geometry';
import { GameMode } from './game';

/**
 * Word character length boundary configuration.
 */
export interface WordLengthRange {
  /** Minimum character length of words (range: >= 1, <= max). */
  readonly min: number;
  /** Maximum character length of words (range: >= min). */
  readonly max: number;
}

/**
 * Supported difficulty preset identifiers.
 */
export type DifficultyPresetId = 'relaxed' | 'normal' | 'intense';

/**
 * Difficulty parameters governing enemy movement, spawn pacing, and word complexity.
 */
export interface DifficultyPreset {
  /** Identifier of the difficulty tier. */
  readonly id: DifficultyPresetId;
  /** Human-readable tactical designation. */
  readonly name: string;
  /** Enemy approach speed (unit: pixels per second, range: > 0). */
  readonly enemySpeed: number;
  /** Spawn interval cadence between enemies (unit: milliseconds, range: >= 500). */
  readonly spawnIntervalMs: number;
  /** Upper cap on simultaneously active enemies on screen (range: >= 1). */
  readonly maxConcurrentEnemies: number;
  /** Allowed word length boundaries for assigned targets. */
  readonly wordLengthRange: WordLengthRange;
  /** Starting and maximum player hull integrity (unit: HP, range: > 0). */
  readonly playerMaxHealth: number;
}

/**
 * Archetype configuration parameters for enemy drone variants.
 */
export interface EnemyArchetypeConfig {
  /** Classification archetype identifier. */
  readonly type: EnemyType;
  /** Health damage required per letter (unit: HP per character, range: >= 1). */
  readonly healthPerLetter: number;
  /** Circular collision radius for targeting and hull impacts (unit: pixels, range: > 0). */
  readonly hitboxRadius: number;
}

/**
 * Accuracy percentage thresholds for end-of-run rating evaluation.
 */
export interface RatingThresholds {
  readonly S: number;
  readonly A: number;
  readonly B: number;
  readonly C: number;
}

/**
 * Parameters governing procedural wave progression and difficulty scaling.
 */
export interface WaveScalingConfig {
  readonly quotaBase: number;
  readonly quotaPerWave: number;
  readonly quotaMax: number;
  readonly spawnIntervalMinRatio: number;
  readonly spawnIntervalDecay: number;
  readonly speedScalePerWave: number;
  readonly speedScaleMaxRatio: number;
  readonly wordLengthWaveStep: number;
  readonly maxWordLengthCap: number;
}

/**
 * Pure simulation data parameters governing spawning, collisions, and gameplay rules.
 */
export interface GameplaySimulationConfig {
  readonly spawnY: number;
  readonly spawnMarginX: number;
  readonly hullRadius: number;
  readonly collisionDamage: number;
  /** Delay before the first spawn of a run (seconds). */
  readonly initialSpawnDelaySeconds: number;
  readonly waveIntermissionSeconds: number;
  readonly labelCharWidthPx: number;
  readonly spawnGapWindowSeconds: number;
  readonly commonalityStart: number;
  readonly commonalityStep: number;
  readonly ratingThresholds: RatingThresholds;
  readonly waveScaling: WaveScalingConfig;
}

/**
 * Scoring curves and character point values.
 */
export interface ScoringRules {
  /** Base points awarded per correct character typed (unit: points, strictly 1 in R1). */
  readonly scorePerChar: number;
}

/**
 * Top-level immutable configuration for initializing a deterministic run.
 */
export interface RunConfig {
  /** Virtual world coordinate bounds (pixels, e.g. 1280x720). */
  readonly virtualResolution: {
    readonly width: number;
    readonly height: number;
  };
  /** Target simulation tick rate (unit: ticks per second, range: >= 1, default: 60). */
  readonly tickRate: number;
  /** Target frame rate for renderer (unit: frames per second, range: >= 30, default: 60). */
  readonly targetFps: number;
  /** 32-bit unsigned integer seed for the PRNG (range: 0..4294967295). */
  readonly seed: number;
  /** Difficulty preset governing enemy speeds and word lengths. */
  readonly difficulty: DifficultyPreset;
  /** Starting world coordinate for the player vessel. */
  readonly playerStart: Vector2;
  /** Accessibility flag to suppress rapid screen shakes and high-frequency animations. */
  readonly reducedMotion: boolean;
  /** Master audio toggle. */
  readonly audioEnabled: boolean;
  /** Pure simulation parameters (geometry, wave pacing, collisions, thresholds). */
  readonly simulation: GameplaySimulationConfig;
  /** Gameplay mode (standard, endless, precision). Default is standard. */
  readonly mode?: GameMode;
}
