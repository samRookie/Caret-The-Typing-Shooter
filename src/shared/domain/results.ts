/**
 * Performance grading tiers for mission debriefing.
 */
export type PerformanceRating = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * End-state victory or defeat outcome indicator.
 */
export type GameOutcome = 'victory' | 'defeat';

/**
 * Immutable debriefing summary compiled upon run termination.
 */
export interface GameResult {
  /** Outcome classification (victory upon clearing all waves, defeat upon hull destruction). */
  readonly outcome: GameOutcome;
  /** Final score points achieved (unit: points, range: >= 0). */
  readonly score: number;
  /** Total count of fully completed waves (range: >= 0). */
  readonly wavesCompleted: number;
  /** Maximum streak achieved during run (range: >= 0). */
  readonly maxStreak: number;
  /** Overall keystroke accuracy percentage (range: 0..100). */
  readonly accuracy: number;
  /** Total words typed and destroyed (range: >= 0). */
  readonly wordsCompleted: number;
  /** Average words per minute achieved over the run (range: >= 0). */
  readonly wpm: number;
  /** Total wall-clock duration of the run (unit: milliseconds, range: >= 0). */
  readonly durationMs: number;
  /** Qualitative performance rank evaluated against accuracy and speed thresholds. */
  readonly rating: PerformanceRating;
}
