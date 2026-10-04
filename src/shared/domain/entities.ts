import { Vector2 } from './geometry';

export type EnemyType = 'drone';

export interface EnemyState {
  readonly id: string;
  readonly type: EnemyType;
  readonly position: Vector2;
  readonly velocity: Vector2;
  readonly word: string;
  readonly remainingWord: string;
  readonly health: number;
  readonly maxHealth: number;
  readonly targeted: boolean;
  readonly alive: boolean;
  readonly spawnTimeMs: number;
}

export interface PlayerState {
  readonly position: Vector2;
  readonly health: number;
  readonly maxHealth: number;
  readonly alive: boolean;
  readonly isDamaged: boolean;
}
