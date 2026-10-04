export type PerformanceRating = 'S' | 'A' | 'B' | 'C' | 'D';

export type GameOutcome = 'victory' | 'defeat';

export interface GameResult {
  readonly outcome: GameOutcome;
  readonly score: number;
  readonly wavesCompleted: number;
  readonly maxStreak: number;
  readonly accuracy: number;
  readonly wordsCompleted: number;
  readonly wpm: number;
  readonly durationMs: number;
  readonly rating: PerformanceRating;
}
