import { Vector2 } from './geometry';
import { GameResult } from './results';

export interface CharacterInput {
  readonly char: string;
  readonly timestamp: number;
  readonly rawKey: string;
}

export type GameEvent =
  | {
      readonly type: 'INPUT_MATCH';
      readonly char: string;
      readonly enemyId: string;
      readonly remainingWord: string;
      readonly timestamp: number;
    }
  | {
      readonly type: 'INPUT_MISMATCH';
      readonly char: string;
      readonly activeTargetId: string | null;
      readonly timestamp: number;
    }
  | {
      readonly type: 'TARGET_LOCKED';
      readonly enemyId: string;
      readonly word: string;
      readonly position: Vector2;
      readonly timestamp: number;
    }
  | {
      readonly type: 'TARGET_LOST';
      readonly enemyId: string;
      readonly timestamp: number;
    }
  | {
      readonly type: 'PROJECTILE_SPAWNED';
      readonly from: Vector2;
      readonly to: Vector2;
      readonly targetEnemyId: string;
      readonly timestamp: number;
    }
  | {
      readonly type: 'ENEMY_HIT';
      readonly enemyId: string;
      readonly damage: number;
      readonly position: Vector2;
      readonly timestamp: number;
    }
  | {
      readonly type: 'ENEMY_DESTROYED';
      readonly enemyId: string;
      readonly scoreAwarded: number;
      readonly position: Vector2;
      readonly timestamp: number;
    }
  | {
      readonly type: 'PLAYER_DAMAGED';
      readonly damage: number;
      readonly currentHealth: number;
      readonly timestamp: number;
    }
  | {
      readonly type: 'WAVE_COMPLETED';
      readonly waveNumber: number;
      readonly bonusScore: number;
      readonly timestamp: number;
    }
  | {
      readonly type: 'GAME_OVER';
      readonly result: GameResult;
      readonly timestamp: number;
    };
