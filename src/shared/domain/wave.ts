export interface WaveState {
  readonly waveNumber: number;
  readonly totalEnemies: number;
  readonly remainingEnemies: number;
  readonly spawnIntervalMs: number;
  readonly isCompleted: boolean;
}

export interface ScoringState {
  readonly score: number;
  readonly streak: number;
  readonly maxStreak: number;
  readonly multiplier: number;
  readonly accuracy: number; // 0 to 100 percentage
  readonly hits: number;
  readonly misses: number;
  readonly wordsCompleted: number;
  readonly wpm: number;
}
