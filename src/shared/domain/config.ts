import { EnemyType } from './entities';
import { Vector2 } from './geometry';

export interface WordLengthRange {
  readonly min: number;
  readonly max: number;
}

export type DifficultyPresetId = 'relaxed' | 'normal' | 'intense';

export interface DifficultyPreset {
  readonly id: DifficultyPresetId;
  readonly name: string;
  readonly enemySpeed: number; // pixels per second
  readonly spawnIntervalMs: number;
  readonly maxConcurrentEnemies: number;
  readonly wordLengthRange: WordLengthRange;
  readonly playerMaxHealth: number;
}

export interface EnemyArchetypeConfig {
  readonly type: EnemyType;
  readonly baseHealth: number;
  readonly baseSpeed: number;
  readonly hitboxRadius: number;
  readonly baseScore: number;
}

export interface MultiplierThreshold {
  readonly streak: number;
  readonly multiplier: number;
}

export interface ScoringRules {
  readonly scorePerChar: number;
  readonly enemyClearBonus: number;
  readonly multiplierThresholds: readonly MultiplierThreshold[];
}

export interface RunConfig {
  readonly virtualResolution: {
    readonly width: number;
    readonly height: number;
  };
  readonly targetFps: number;
  readonly difficulty: DifficultyPreset;
  readonly playerStart: Vector2;
  readonly reducedMotion: boolean;
  readonly audioEnabled: boolean;
}
