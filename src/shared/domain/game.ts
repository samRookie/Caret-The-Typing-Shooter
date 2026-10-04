import { PlayerState, EnemyState } from './entities';
import { WaveState, ScoringState } from './wave';

/**
 * Top-level lifecycle status of the tactical game simulation.
 */
export type GameStatus = 'idle' | 'running' | 'paused' | 'game-over';

/**
 * Supported game modes.
 */
export type GameMode = 'standard' | 'endless' | 'precision';

/**
 * Serialized snapshot representing the complete state of the deterministic simulation.
 * Pure, renderer-agnostic, and testable without a DOM or engine.
 */
export interface GameSnapshot {
  /** Current simulation lifecycle status. */
  readonly status: GameStatus;
  /** Active game mode ruleset. */
  readonly mode: GameMode;
  /** Complete state of player vessel. */
  readonly player: PlayerState;
  /** List of all active and uncollected enemies currently tracked in the simulation. */
  readonly enemies: readonly EnemyState[];
  /** Entity ID of currently locked target enemy, or null if player is not locked. */
  readonly activeTargetId: string | null;
  /** Current wave progression metrics. */
  readonly wave: WaveState;
  /** Real-time scoring and typing metrics. */
  readonly scoring: ScoringState;
  /** Total elapsed simulation ticks since run started (unit: ticks, range: >= 0). Derive ms via elapsedTicks * (1000 / tickRate). */
  readonly elapsedTicks: number;
}
