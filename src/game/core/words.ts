import len3 from './data/words/len3.json';
import len4 from './data/words/len4.json';
import len5 from './data/words/len5.json';
import len6 from './data/words/len6.json';
import len7 from './data/words/len7.json';
import len8 from './data/words/len8.json';
import { Mulberry32 } from './prng';

export const WORDS_BY_LENGTH: Readonly<Record<number, readonly string[]>> = {
  3: len3,
  4: len4,
  5: len5,
  6: len6,
  7: len7,
  8: len8,
};

export const MIN_AVAILABLE_WORD_LENGTH = 3;
export const MAX_AVAILABLE_WORD_LENGTH = 8;

export interface WordQuery {
  readonly minLen: number;
  readonly maxLen: number;
  readonly excludeFirstLetters: ReadonlySet<string>;
  readonly excludeWords: ReadonlySet<string>;
}

export interface IWordProvider {
  nextWord(query: WordQuery): string;
}

/**
 * Deterministic word provider with multi-stage fallback strategy.
 * 
 * FALLBACK POLICY:
 * 1. Filter candidates in [minLen..maxLen] excluding live words and first letters.
 * 2. If empty: drop excludeFirstLetters, keeping excludeWords.
 * 3. If still empty: widen [minLen, maxLen] by 1 (clamped to 3..8).
 */
export class DefaultWordProvider implements IWordProvider {
  private readonly rng: Mulberry32;
  private readonly wordsByLength: Readonly<Record<number, readonly string[]>>;

  constructor(
    rng: Mulberry32,
    wordsByLength: Readonly<Record<number, readonly string[]>> = WORDS_BY_LENGTH
  ) {
    this.rng = rng;
    this.wordsByLength = wordsByLength;
  }

  private collectCandidates(
    minLen: number,
    maxLen: number,
    excludeFirstLetters: ReadonlySet<string> | null,
    excludeWords: ReadonlySet<string>
  ): string[] {
    const candidates: string[] = [];
    const clampedMin = Math.max(MIN_AVAILABLE_WORD_LENGTH, minLen);
    const clampedMax = Math.min(MAX_AVAILABLE_WORD_LENGTH, maxLen);

    for (let len = clampedMin; len <= clampedMax; len++) {
      const words = this.wordsByLength[len];
      if (!words) continue;

      for (const word of words) {
        if (excludeWords.has(word)) continue;
        if (excludeFirstLetters !== null && word.length > 0) {
          const firstChar = word[0];
          if (firstChar && excludeFirstLetters.has(firstChar)) {
            continue;
          }
        }
        candidates.push(word);
      }
    }
    return candidates;
  }

  nextWord(query: WordQuery): string {
    // Stage 1: Exact length range, excluding active words and first letters
    let candidates = this.collectCandidates(
      query.minLen,
      query.maxLen,
      query.excludeFirstLetters,
      query.excludeWords
    );

    // Stage 2 Fallback: Drop excludeFirstLetters, keep excludeWords
    if (candidates.length === 0) {
      candidates = this.collectCandidates(
        query.minLen,
        query.maxLen,
        null,
        query.excludeWords
      );
    }

    // Stage 3 Fallback: Widen length bounds by 1 tier (clamped to 3..8)
    if (candidates.length === 0) {
      const widenedMin = Math.max(MIN_AVAILABLE_WORD_LENGTH, query.minLen - 1);
      const widenedMax = Math.min(MAX_AVAILABLE_WORD_LENGTH, query.maxLen + 1);

      candidates = this.collectCandidates(
        widenedMin,
        widenedMax,
        query.excludeFirstLetters,
        query.excludeWords
      );

      if (candidates.length === 0) {
        candidates = this.collectCandidates(
          widenedMin,
          widenedMax,
          null,
          query.excludeWords
        );
      }
    }

    // Extreme fallback: reset exclusions to guarantee simulation never halts
    if (candidates.length === 0) {
      const clampedMin = Math.max(MIN_AVAILABLE_WORD_LENGTH, query.minLen);
      const clampedMax = Math.min(MAX_AVAILABLE_WORD_LENGTH, query.maxLen);
      const emergencyList: string[] = [];
      for (let len = clampedMin; len <= clampedMax; len++) {
        const words = this.wordsByLength[len];
        if (words) emergencyList.push(...words);
      }
      if (emergencyList.length > 0) {
        return this.rng.pick(emergencyList);
      }
      return 'drone';
    }

    return this.rng.pick(candidates);
  }
}
