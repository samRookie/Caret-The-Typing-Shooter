import { EnemyType } from './entities';
import { Vector2 } from './geometry';

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
  /** Base starting health points (unit: HP, range: >= 1). */
  readonly baseHealth: number;
  /** Base speed multiplier (unit: pixels per second, range: > 0). */
  readonly baseSpeed: number;
  /** Circular collision radius for targeting and hull impacts (unit: pixels, range: > 0). */
  readonly hitboxRadius: number;
  /** Points awarded upon successful word completion (unit: points, range: > 0). */
  readonly baseScore: number;
}

/**
 * Streak milestone required to reach a score multiplier tier.
 */
export interface MultiplierThreshold {
  /** Streak count needed to activate this multiplier (range: >= 0). */
  readonly streak: number;
  /** Score multiplier applied to character hits and destruction (range: >= 1). */
  readonly multiplier: number;
}

/**
 * Scoring curves and multiplier progression rules.
 */
export interface ScoringRules {
  /** Base points awarded per correct character typed (unit: points, range: > 0). */
  readonly scorePerChar: number;
  /** Base bonus awarded upon completely typing and destroying an enemy (unit: points, range: > 0). */
  readonly enemyClearBonus: number;
  /** Tiered multiplier schedule ordered by streak requirement ascending. */
  readonly multiplierThresholds: readonly MultiplierThreshold[];
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
}
