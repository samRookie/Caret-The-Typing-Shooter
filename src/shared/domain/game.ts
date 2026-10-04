import { PlayerState, EnemyState } from './entities';
import { WaveState, ScoringState } from './wave';

export type GameStatus = 'idle' | 'running' | 'paused' | 'game-over';

export type GameMode = 'standard' | 'practice' | 'endless';

export interface GameSnapshot {
  readonly status: GameStatus;
  readonly mode: GameMode;
  readonly player: PlayerState;
  readonly enemies: readonly EnemyState[];
  readonly activeTargetId: string | null;
  readonly wave: WaveState;
  readonly scoring: ScoringState;
  readonly elapsedTimeMs: number;
  readonly timestamp: number;
}
