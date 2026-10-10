import { Vector2 } from './geometry';

/**
 * Recognized enemy archetype classifications.
 */
export type EnemyType = 'drone' | 'elite';

/**
 * State representation of an individual enemy unit.
 * Targeted state is derived dynamically from `activeTargetId === id`.
 */
export interface EnemyState {
  /** Unique entity identifier. */
  readonly id: string;
  /** Archetype classification. */
  readonly type: EnemyType;
  /** World position in virtual coordinate space (pixels, x: 0..1280, y: 0..720). */
  readonly position: Vector2;
  /** Movement velocity vector (pixels per second). */
  readonly velocity: Vector2;
  /** Full original word assigned to this enemy. */
  readonly word: string;
  /** Remaining untyped substring of the word (length: 0..word.length). */
  readonly remainingWord: string;
  /** Current health points (unit: HP, range: 0..maxHealth). */
  readonly health: number;
  /** Maximum health points (unit: HP, range: > 0). */
  readonly maxHealth: number;
  /** Living state flag (true if health > 0 and not yet destroyed). */
  readonly alive: boolean;
  /** Simulation tick at which the enemy was spawned (unit: ticks, range: >= 0). */
  readonly spawnTick: number;
}

/**
 * State representation of the player's tactical vessel.
 */
export interface PlayerState {
  /** World position in virtual coordinate space (pixels, x: 0..1280, y: 0..720). */
  readonly position: Vector2;
  /** Current hull integrity (unit: HP, range: 0..maxHealth). */
  readonly health: number;
  /** Maximum hull integrity (unit: HP, range: > 0). */
  readonly maxHealth: number;
  /** True if player hull integrity is greater than zero. */
  readonly alive: boolean;
  /** Flag indicating whether the player vessel took damage on the current tick. */
  readonly isDamaged: boolean;
}
