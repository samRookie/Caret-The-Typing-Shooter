/**
 * ============================================================================
 * PROGRESSION & WAVE CONFIGURATION (Spec 1.4)
 * ============================================================================
 * Single progressive campaign driven purely by wave number w >= 1.
 * Pure mathematical scaling curves governing approach speeds, spawn cadences,
 * concurrency caps, quotas, and word complexity without artificial presets.
 * ============================================================================
 */

/**
 * Hard-letter set (awkward characters) receiving increased selection weight in higher waves.
 */
export const HARD_LETTERS = ['j', 'k', 'q', 'v', 'w', 'x', 'z'] as const;

/**
 * Standard wave intermission duration between waves in seconds (Decision D4, tuned to 1.5s).
 */
export const WAVE_INTERMISSION_SECONDS = 1.5;

/**
 * Computes enemy drone approach speed in virtual pixels per second.
 * Formula: min(30 + 2.5 * (w - 1), 72)
 */
export function speedForWave(w: number): number {
  const wave = Math.max(1, Math.floor(w));
  return Math.min(30 + 2.5 * (wave - 1), 72);
}

/**
 * Computes spawn cadence delay between enemy drones in seconds.
 * Formula: max(1.0, 2.8 * 0.95^(w - 1))
 */
export function spawnIntervalSeconds(w: number): number {
  const wave = Math.max(1, Math.floor(w));
  return Math.max(1.0, 2.8 * Math.pow(0.95, wave - 1));
}

/**
 * Computes maximum simultaneously active enemies permitted on screen.
 * Formula: min(2 + floor((w - 1) / 3), 6)
 */
export function concurrentCapForWave(w: number): number {
  const wave = Math.max(1, Math.floor(w));
  return Math.min(2 + Math.floor((wave - 1) / 3), 6);
}

/**
 * Computes total enemy drone quota required to clear the wave.
 * Formula: min(5 + 2 * (w - 1), 30)
 */
export function quotaForWave(w: number): number {
  const wave = Math.max(1, Math.floor(w));
  return Math.min(5 + 2 * (wave - 1), 30);
}

/**
 * Computes word commonality fraction (pool = first ceil(c * tierLength) words).
 * Formula: min(1.0, 0.30 + 0.07 * (w - 1))
 */
export function commonalityForWave(w: number): number {
  const wave = Math.max(1, Math.floor(w));
  return Math.min(1.0, 0.30 + 0.07 * (wave - 1));
}

/**
 * Computes selection weight multiplier for words containing hard letters.
 * Formula: 1 + min(1.0, 0.10 * max(0, w - 2))
 */
export function hardLetterMultiplierForWave(w: number): number {
  const wave = Math.max(1, Math.floor(w));
  return 1 + Math.min(1.0, 0.1 * Math.max(0, wave - 2));
}

/**
 * Word length distribution weights (%) for lengths [3, 4, 5, 6, 7, 8].
 * Rows 1 through 10 are defined explicitly; rows >= 20 use the final row;
 * rows 11 through 19 interpolate linearly per column between row 10 and row 20.
 */
const LENGTH_DISTRIBUTION_TABLE: Readonly<Record<number, readonly [number, number, number, number, number, number]>> = {
  1: [50, 50, 0, 0, 0, 0],
  2: [40, 60, 0, 0, 0, 0],
  3: [35, 55, 6, 4, 0, 0],
  4: [28, 48, 14, 10, 0, 0],
  5: [18, 32, 26, 24, 0, 0],
  6: [12, 28, 28, 27, 5, 0],
  7: [8, 24, 28, 30, 10, 0],
  8: [6, 20, 28, 30, 12, 4],
  9: [4, 18, 26, 30, 16, 6],
  10: [3, 15, 25, 30, 18, 9],
  20: [0, 8, 20, 30, 26, 16],
};

export type WordLengthWeights = Readonly<Record<number, number>>;

/**
 * Computes word length distribution weights for lengths 3 through 8 for a given wave.
 * Guarantees all weights sum exactly to 100.
 */
export function lengthWeightsForWave(w: number): WordLengthWeights {
  const wave = Math.max(1, Math.floor(w));

  if (wave <= 10) {
    const row = LENGTH_DISTRIBUTION_TABLE[wave]!;
    return {
      3: row[0],
      4: row[1],
      5: row[2],
      6: row[3],
      7: row[4],
      8: row[5],
    };
  }

  if (wave >= 20) {
    const row = LENGTH_DISTRIBUTION_TABLE[20]!;
    return {
      3: row[0],
      4: row[1],
      5: row[2],
      6: row[3],
      7: row[4],
      8: row[5],
    };
  }

  // Linear interpolation for waves 11 through 19:
  // t = (wave - 10) / 10
  const t = (wave - 10) / 10;
  const row10 = LENGTH_DISTRIBUTION_TABLE[10]!;
  const row20 = LENGTH_DISTRIBUTION_TABLE[20]!;

  const unrounded = [
    row10[0] + t * (row20[0] - row10[0]),
    row10[1] + t * (row20[1] - row10[1]),
    row10[2] + t * (row20[2] - row10[2]),
    row10[3] + t * (row20[3] - row10[3]),
    row10[4] + t * (row20[4] - row10[4]),
    row10[5] + t * (row20[5] - row10[5]),
  ];

  const rounded = unrounded.map((v) => Math.round(v));
  const sum = rounded.reduce((acc, v) => acc + v, 0);

  // Enforce exact sum = 100 by adjusting the column with highest weight (index 3, length 6)
  if (sum !== 100) {
    rounded[3] = (rounded[3] ?? 0) + (100 - sum);
  }

  return {
    3: rounded[0]!,
    4: rounded[1]!,
    5: rounded[2]!,
    6: rounded[3]!,
    7: rounded[4]!,
    8: rounded[5]!,
  };
}

/**
 * Returns true if the word contains at least one character from HARD_LETTERS.
 */
export function hasHardLetter(word: string): boolean {
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (ch && HARD_LETTERS.includes(ch as (typeof HARD_LETTERS)[number])) {
      return true;
    }
  }
  return false;
}
