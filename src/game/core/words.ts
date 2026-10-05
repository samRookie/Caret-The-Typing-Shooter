import tier3 from './data/words/tier-3.json';
import tier4 from './data/words/tier-4.json';
import tier5 from './data/words/tier-5.json';
import tier6 from './data/words/tier-6.json';
import tier7 from './data/words/tier-7.json';
import tier8 from './data/words/tier-8.json';
import { Mulberry32 } from './prng';

export type WordTiers = Readonly<Record<number, readonly string[]>>;

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
  readonly minLen: number;
  readonly maxLen: number;
  readonly excludeFirstLetters: ReadonlySet<string>;
  readonly excludeWords: ReadonlySet<string>;
  readonly commonality?: number;
}

export interface IWordProvider {
  nextWord(query: WordQuery, commonality?: number): string;
  readonly stats: WordProviderStats;
}

/**
 * Deterministic word provider with difficulty-by-commonality and multi-stage fallback strategy.
 * 
 * FALLBACK POLICY:
 * 1. Filter candidates in [minLen..maxLen] within commonality pool (ceil(c * tierLength)),
 *    excluding live words and first letters.
 * 2. If empty: drop excludeFirstLetters, keeping excludeWords.
 * 3. If empty and commonality < 1: widen pool to full tier (c = 1).
 * 4. If still empty: widen [minLen, maxLen] by 1 (clamped to 3..8).
 * 5. Extreme emergency fallback: unconstrained dictionary selection so the simulation never halts.
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

  private collectCandidates(
    minLen: number,
    maxLen: number,
    excludeFirstLetters: ReadonlySet<string> | null,
    excludeWords: ReadonlySet<string>,
    commonality: number
  ): string[] {
    const candidates: string[] = [];
    const clampedMin = Math.max(MIN_AVAILABLE_WORD_LENGTH, minLen);
    const clampedMax = Math.min(MAX_AVAILABLE_WORD_LENGTH, maxLen);

    for (let len = clampedMin; len <= clampedMax; len++) {
      const words = this.wordsByLength[len];
      if (!words || words.length === 0) continue;

      const poolLimit = Math.min(
        words.length,
        Math.max(1, Math.ceil(commonality * words.length))
      );

      for (let i = 0; i < poolLimit; i++) {
        const word = words[i]!;
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

  nextWord(query: WordQuery, commonalityParam?: number): string {
    const rawC = query.commonality ?? commonalityParam ?? 1;
    const commonality = Math.max(0.0001, Math.min(1, rawC));

    // Stage 1: Exact length range with commonality pool, excluding active words and first letters
    let candidates = this.collectCandidates(
      query.minLen,
      query.maxLen,
      query.excludeFirstLetters,
      query.excludeWords,
      commonality
    );

    // Stage 2 Fallback: Drop excludeFirstLetters, keep excludeWords
    if (candidates.length === 0) {
      this._fallbacks++;
      candidates = this.collectCandidates(
        query.minLen,
        query.maxLen,
        null,
        query.excludeWords,
        commonality
      );
    }

    // Stage 2b Fallback: Expand restricted commonality to full tier before widening length
    if (candidates.length === 0 && commonality < 1) {
      this._fallbacks++;
      candidates = this.collectCandidates(
        query.minLen,
        query.maxLen,
        query.excludeFirstLetters,
        query.excludeWords,
        1
      );

      if (candidates.length === 0) {
        candidates = this.collectCandidates(
          query.minLen,
          query.maxLen,
          null,
          query.excludeWords,
          1
        );
      }
    }

    // Stage 3 Fallback: Widen length bounds by 1 tier (clamped to 3..8)
    if (candidates.length === 0) {
      this._fallbacks++;
      const widenedMin = Math.max(MIN_AVAILABLE_WORD_LENGTH, query.minLen - 1);
      const widenedMax = Math.min(MAX_AVAILABLE_WORD_LENGTH, query.maxLen + 1);

      candidates = this.collectCandidates(
        widenedMin,
        widenedMax,
        query.excludeFirstLetters,
        query.excludeWords,
        1
      );

      if (candidates.length === 0) {
        candidates = this.collectCandidates(
          widenedMin,
          widenedMax,
          null,
          query.excludeWords,
          1
        );
      }
    }

    // Extreme fallback: reset exclusions to guarantee simulation never halts
    if (candidates.length === 0) {
      this._fallbacks++;
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

/**
 * Word provider factory enabling test injection of custom fixture tiers.
 */
export function createWordProvider(
  rng: Mulberry32,
  tiers: WordTiers = WORDS_BY_LENGTH
): IWordProvider {
  return new DefaultWordProvider(rng, tiers);
}
