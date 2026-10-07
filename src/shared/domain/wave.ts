/**
 * Real-time wave progression and spawn cadence state.
 */
export interface WaveState {
  /** 1-based index of current wave (range: >= 1). */
  readonly waveNumber: number;
  /** Total quota of enemies scheduled to spawn in this wave (range: >= 1). */
  readonly totalEnemies: number;
  /**
   * Count of enemies in the current wave that have not yet been destroyed.
   * This includes both enemies remaining in the unspawned queue and currently living enemies on screen.
   * Range: 0..totalEnemies. When remainingEnemies reaches 0, the wave is completed.
   */
  readonly remainingEnemies: number;
  /** Time between enemy spawns (unit: milliseconds, range: > 0). */
  readonly spawnIntervalMs: number;
  /** Flag indicating whether all enemies in this wave have been destroyed. */
  readonly isCompleted: boolean;
}

/**
 * Real-time performance, typing accuracy, and score metrics.
 */
export interface ScoringState {
  /** Total cumulative score points (unit: points, range: >= 0). */
  readonly score: number;
  /** Current consecutive correct keystroke streak (range: >= 0). Resets to 0 on mismatch. */
  readonly streak: number;
  /** Highest streak achieved during the current run (range: >= 0). */
  readonly maxStreak: number;
  /**
   * Typing accuracy as a percentage (range: 0..100).
   * Calculated as (hits / (hits + misses)) * 100.
   * Defined strictly as 100 when hits + misses is 0 (initial state).
   */
  readonly accuracy: number;
  /** Total count of correct character inputs (range: >= 0). */
  readonly hits: number;
  /** Total count of incorrect character inputs (range: >= 0). */
  readonly misses: number;
  /** Total count of fully typed and destroyed words (range: >= 0). */
  readonly wordsCompleted: number;
  /** Gross words per minute based on total character hits / 5 over elapsed minutes (range: >= 0). */
  readonly wpm: number;
}
