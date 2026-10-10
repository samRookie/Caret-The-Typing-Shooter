import tier3 from './data/words/tier-3.json';
import tier4 from './data/words/tier-4.json';
import tier5 from './data/words/tier-5.json';
import tier6 from './data/words/tier-6.json';
import tier7 from './data/words/tier-7.json';
import tier8 from './data/words/tier-8.json';
import elite10 from './data/words/elite-10.json';
import { Mulberry32 } from './prng';
import {
  WordLengthWeights,
  hasHardLetter,
} from '../../shared/config/progression';

export type WordTiers = Readonly<Record<number, readonly string[]>>;

export const ELITE_10_WORDS: readonly string[] = elite10;

export function pickEliteWord(
  rng: Mulberry32,
  excludeFirstLetters: ReadonlySet<string>,
  excludeWords: ReadonlySet<string>
): string {
  const candidates = ELITE_10_WORDS.filter(
    (w) => !excludeWords.has(w) && !excludeFirstLetters.has(w[0] ?? '')
  );
  if (candidates.length > 0) {
    return rng.pick(candidates);
  }

  const wordCandidates = ELITE_10_WORDS.filter((w) => !excludeWords.has(w));
  if (wordCandidates.length > 0) {
    return rng.pick(wordCandidates);
  }

  return rng.pick(ELITE_10_WORDS);
}

export const WORDS_BY_LENGTH: WordTiers = {
  3: tier3,
  4: tier4,
  5: tier5,
  6: tier6,
  7: tier7,
  8: tier8,
};

export const MIN_AVAILABLE_WORD_LENGTH = 3;
export const MAX_AVAILABLE_WORD_LENGTH = 8;

export interface WordProviderStats {
  readonly fallbacks: number;
}

export interface WordQuery {
  readonly lengthWeights?: WordLengthWeights;
  readonly commonality?: number;
  readonly hardLetterMultiplier?: number;
  readonly excludeFirstLetters: ReadonlySet<string>;
  readonly excludeWords: ReadonlySet<string>;
  readonly minLen?: number;
  readonly maxLen?: number;
}

export interface IWordProvider {
  nextWord(query: WordQuery, commonality?: number): string;
  readonly stats: WordProviderStats;
}

/**
 * Returns an array of available lengths in [MIN..MAX] sorted by proximity to initialLen,
 * preferring shorter lengths on ties.
 * E.g., for 5: [5, 4, 6, 3, 7, 8].
 */
export function getNearestLengths(initialLen: number): number[] {
  const result: number[] = [initialLen];
  const maxDelta = MAX_AVAILABLE_WORD_LENGTH - MIN_AVAILABLE_WORD_LENGTH;
  for (let delta = 1; delta <= maxDelta; delta++) {
    const shorter = initialLen - delta;
    if (shorter >= MIN_AVAILABLE_WORD_LENGTH) {
      result.push(shorter);
    }
    const longer = initialLen + delta;
    if (longer <= MAX_AVAILABLE_WORD_LENGTH) {
      result.push(longer);
    }
  }
  return result;
}

/**
 * Deterministic word provider with two-draw PRNG algorithm and multi-stage fallback strategy.
 * 
 * ALGORITHM:
 * 1. Draw 1: samples a float in [0, 1) mapping through cumulative lengthWeights to pick length L.
 * 2. Candidate pool: first ceil(commonality * |tier L|) words, excluding live words and live first letters.
 *    - Fallback 1: drop first-letter exclusion.
 *    - Fallback 2: widen to nearest available length (preferring shorter).
 *    - Fallback 3: expand commonality to 1.0 (full tier).
 *    - Fallback 4: drop active words exclusion.
 * 3. Draw 2: weighted selection where words with hard letters have weight hardLetterMultiplier and others 1.
 * 
 * INVARIANT: Exactly two wordRng draws are made per word under all conditions.
 */
export class DefaultWordProvider implements IWordProvider {
  private readonly rng: Mulberry32;
  private readonly wordsByLength: WordTiers;
  private _fallbacks: number = 0;

  constructor(
    rng: Mulberry32,
    wordsByLength: WordTiers = WORDS_BY_LENGTH
  ) {
    this.rng = rng;
    this.wordsByLength = wordsByLength;
  }

  get stats(): WordProviderStats {
    return { fallbacks: this._fallbacks };
  }

  private getPoolForTier(
    len: number,
    commonality: number,
    excludeWords: ReadonlySet<string>,
    excludeFirstLetters: ReadonlySet<string> | null
  ): string[] {
    const words = this.wordsByLength[len];
    if (!words || words.length === 0) return [];

    const limit = Math.min(
      words.length,
      Math.max(1, Math.ceil(commonality * words.length))
    );

    const pool: string[] = [];
    for (let i = 0; i < limit; i++) {
      const word = words[i]!;
      if (excludeWords.has(word)) continue;
      if (excludeFirstLetters !== null && word.length > 0) {
        const firstChar = word[0];
        if (firstChar && excludeFirstLetters.has(firstChar)) {
          continue;
        }
      }
      pool.push(word);
    }
    return pool;
  }

  nextWord(query: WordQuery, commonalityParam?: number): string {
    // ------------------------------------------------------------------------
    // DRAW 1: Length Selection via Cumulative Length Weights
    // ------------------------------------------------------------------------
    const r1 = this.rng.next();

    let weights = query.lengthWeights;
    if (!weights) {
      const minL = Math.max(MIN_AVAILABLE_WORD_LENGTH, query.minLen ?? MIN_AVAILABLE_WORD_LENGTH);
      const maxL = Math.min(MAX_AVAILABLE_WORD_LENGTH, query.maxLen ?? MAX_AVAILABLE_WORD_LENGTH);
      const count = Math.max(1, maxL - minL + 1);
      const uniformWeight = 100 / count;
      const wRecord: Record<number, number> = {};
      for (let l = MIN_AVAILABLE_WORD_LENGTH; l <= MAX_AVAILABLE_WORD_LENGTH; l++) {
        wRecord[l] = l >= minL && l <= maxL ? uniformWeight : 0;
      }
      weights = wRecord;
    }

    let totalWeight = 0;
    for (let l = MIN_AVAILABLE_WORD_LENGTH; l <= MAX_AVAILABLE_WORD_LENGTH; l++) {
      totalWeight += Math.max(0, weights[l] ?? 0);
    }

    let chosenLen = MIN_AVAILABLE_WORD_LENGTH;
    if (totalWeight > 0) {
      const target1 = r1 * totalWeight;
      let running = 0;
      for (let l = MIN_AVAILABLE_WORD_LENGTH; l <= MAX_AVAILABLE_WORD_LENGTH; l++) {
        const w = Math.max(0, weights[l] ?? 0);
        if (w <= 0) continue;
        running += w;
        if (target1 < running) {
          chosenLen = l;
          break;
        }
      }
    }

    // ------------------------------------------------------------------------
    // CANDIDATE POOL RESOLUTION & FALLBACK CASCADE
    // ------------------------------------------------------------------------
    const rawC = query.commonality ?? commonalityParam ?? 1;
    const commonality = Math.max(0.0001, Math.min(1, rawC));
    const hardMultiplier = Math.max(1, query.hardLetterMultiplier ?? 1);

    let candidates: string[] = [];

    // Stage 1: Exact length L with both live-word and live-first-letter exclusions
    candidates = this.getPoolForTier(
      chosenLen,
      commonality,
      query.excludeWords,
      query.excludeFirstLetters
    );

    // Fallback 1: Drop live-first-letter exclusion for length L
    if (candidates.length === 0) {
      this._fallbacks++;
      candidates = this.getPoolForTier(
        chosenLen,
        commonality,
        query.excludeWords,
        null
      );
    }

    // Fallback 2: Widen to nearest available length (preferring shorter)
    if (candidates.length === 0) {
      const nearest = getNearestLengths(chosenLen).slice(1);
      for (const altLen of nearest) {
        // Try with first-letter exclusion
        candidates = this.getPoolForTier(
          altLen,
          commonality,
          query.excludeWords,
          query.excludeFirstLetters
        );
        if (candidates.length > 0) {
          this._fallbacks++;
          break;
        }

        // Try without first-letter exclusion
        candidates = this.getPoolForTier(
          altLen,
          commonality,
          query.excludeWords,
          null
        );
        if (candidates.length > 0) {
          this._fallbacks++;
          break;
        }
      }
    }

    // Fallback 3: Expand commonality to 1.0 (full tier) across nearest lengths
    if (candidates.length === 0 && commonality < 1) {
      const allLengths = getNearestLengths(chosenLen);
      for (const altLen of allLengths) {
        candidates = this.getPoolForTier(
          altLen,
          1,
          query.excludeWords,
          null
        );
        if (candidates.length > 0) {
          this._fallbacks++;
          break;
        }
      }
    }

    // Fallback 4: Drop active word exclusion across nearest lengths
    if (candidates.length === 0) {
      const allLengths = getNearestLengths(chosenLen);
      for (const altLen of allLengths) {
        candidates = this.getPoolForTier(
          altLen,
          1,
          new Set(),
          null
        );
        if (candidates.length > 0) {
          this._fallbacks++;
          break;
        }
      }
    }

    // Extreme emergency fallback if dictionary has 0 words in all tiers
    if (candidates.length === 0) {
      this._fallbacks++;
      candidates = ['drone'];
    }

    // ------------------------------------------------------------------------
    // DRAW 2: Weighted Word Selection with Hard-Letter Multiplier
    // ------------------------------------------------------------------------
    const r2 = this.rng.next();

    let totalPoolWeight = 0;
    for (let i = 0; i < candidates.length; i++) {
      const w = candidates[i]!;
      totalPoolWeight += hasHardLetter(w) ? hardMultiplier : 1;
    }

    const target2 = r2 * totalPoolWeight;
    let running2 = 0;
    let chosenWord = candidates[candidates.length - 1]!;

    for (let i = 0; i < candidates.length; i++) {
      const w = candidates[i]!;
      const weight = hasHardLetter(w) ? hardMultiplier : 1;
      running2 += weight;
      if (target2 < running2) {
        chosenWord = w;
        break;
      }
    }

    return chosenWord;
  }
}

/**
 * Word provider factory enabling test injection of custom fixture tiers.
 */
export function createWordProvider(
  rng: Mulberry32,
  tiers: WordTiers = WORDS_BY_LENGTH
): IWordProvider {
  return new DefaultWordProvider(rng, tiers);
}
