import { Vector2 } from './geometry';
import { GameResult } from './results';

/**
 * Domain command dispatched to the simulation.
 */
export type GameCommand =
  | {
      readonly type: 'char';
      /** Lowercase character input to process. Range: string of length 1 */
      readonly char: string;
    }
  | {
      readonly type: 'release-target';
    };

/**
 * CharacterInput alias matching the 'char' command payload.
 */
export type CharacterInput = Extract<GameCommand, { type: 'char' }>;

/**
 * Discriminated union of all gameplay and simulation events.
 * Timestamps are recorded as simulation tick counters (tick >= 0).
 */
export type GameEvent =
  | {
      readonly type: 'INPUT_MATCH';
      /** Character that was successfully typed. */
      readonly char: string;
      /** Identifier of the targeted enemy. */
      readonly enemyId: string;
      /** Remaining untyped characters of the enemy word. */
      readonly remainingWord: string;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'INPUT_MISMATCH';
      /** Incorrect character that was entered. */
      readonly char: string;
      /** Currently targeted enemy ID, or null if no target was locked. */
      readonly activeTargetId: string | null;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'TARGET_LOCKED';
      /** Identifier of the newly locked enemy. */
      readonly enemyId: string;
      /** Full word assigned to the enemy. */
      readonly word: string;
      /** Position of the enemy at the time of locking. */
      readonly position: Vector2;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'ENEMY_SPAWNED';
      /** Spawned enemy identifier. */
      readonly enemyId: string;
      /** World coordinate where enemy appeared. */
      readonly position: Vector2;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'WAVE_STARTED';
      /** 1-based index of started wave. */
      readonly waveNumber: number;
      /** Total quota of enemies scheduled to spawn in this wave. */
      readonly quota: number;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'TARGET_LOST';
      /** Identifier of the enemy that was unlocked. */
      readonly enemyId: string;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'PROJECTILE_SPAWNED';
      /** World origin coordinate of projectile. */
      readonly from: Vector2;
      /** Destination / target coordinate of projectile. */
      readonly to: Vector2;
      /** Targeted enemy identifier. */
      readonly targetEnemyId: string;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'ENEMY_HIT';
      /** Targeted enemy identifier. */
      readonly enemyId: string;
      /** Damage inflicted (unit: health points, range: > 0). */
      readonly damage: number;
      /** Enemy coordinate when hit. */
      readonly position: Vector2;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'ENEMY_DESTROYED';
      /** Enemy identifier that was destroyed. */
      readonly enemyId: string;
      /** Score points awarded for destruction (unit: points, range: >= 0). */
      readonly scoreAwarded: number;
      /** Enemy coordinate when destroyed. */
      readonly position: Vector2;
      /** Cause of enemy destruction: completed word or hull collision. */
      readonly cause: 'word' | 'collision';
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'PLAYER_DAMAGED';
      /** Damage taken by the player hull (unit: health points, range: > 0). */
      readonly damage: number;
      /** Remaining hull health after damage (unit: health points, range: >= 0). */
      readonly currentHealth: number;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'WAVE_COMPLETED';
      /** Index of completed wave (range: >= 1). */
      readonly waveNumber: number;
      /** Bonus points awarded for clearing the wave (unit: points, range: >= 0). */
      readonly bonusScore: number;
      /** Simulation tick index when event occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    }
  | {
      readonly type: 'GAME_OVER';
      /** Final game result summary. */
      readonly result: GameResult;
      /** Simulation tick index when game over occurred (unit: ticks, range: >= 0). */
      readonly tick: number;
    };
