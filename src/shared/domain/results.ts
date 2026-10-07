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
  /** Final wave number reached during run (range: >= 1). */
  readonly wave: number;
  /** Total count of fully completed waves (range: >= 0). */
  readonly wavesCompleted: number;
  /** Maximum streak achieved during run (range: >= 0). */
  readonly maxStreak: number;
  /** Total words typed and destroyed (alias of wordsCompleted, range: >= 0). */
  readonly wordsDestroyed: number;
  /** Total words typed and destroyed (range: >= 0). */
  readonly wordsCompleted: number;
  /** Total count of correct character entries (range: >= 0). */
  readonly hits: number;
  /** Total count of incorrect character entries (range: >= 0). */
  readonly misses: number;
  /** Overall keystroke accuracy percentage floored to 1 decimal place (range: 0..100). */
  readonly accuracy: number;
  /** Gross words per minute based on total entries / 5 over elapsed minutes (range: >= 0). */
  readonly grossWpm: number;
  /** Net words per minute deducting uncorrected errors (range: >= 0). */
  readonly netWpm: number;
  /** Average words per minute achieved over the run (range: >= 0). */
  readonly wpm: number;
  /** Total elapsed duration of the run in seconds (unit: seconds, range: >= 0). */
  readonly durationSeconds: number;
  /** Total wall-clock duration of the run (unit: milliseconds, range: >= 0). */
  readonly durationMs: number;
  /** Qualitative performance rank evaluated against accuracy and speed thresholds. */
  readonly rating: PerformanceRating;
}
