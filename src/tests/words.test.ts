import { describe, it, expect } from 'vitest';
import {
  WORDS_BY_LENGTH,
  DefaultWordProvider,
  IWordProvider,
  WordQuery,
} from '@/game/core/words';
import { Mulberry32 } from '@/game/core/prng';

describe('Word Data Integrity (Tiers 3 through 8)', () => {
  const tiers = [3, 4, 5, 6, 7, 8];

  it('validates each tier contains at least 30 lowercase words matching length tier with >= 12 initial letters', () => {
    const seenGlobalWords = new Set<string>();

    for (const tier of tiers) {
      const words = WORDS_BY_LENGTH[tier];
      expect(words).toBeDefined();
      if (!words) continue;

      expect(words.length).toBeGreaterThanOrEqual(30);

      const uniqueFirstLetters = new Set<string>();
      const seenTierWords = new Set<string>();

      for (const word of words) {
        // Must be strictly lowercase English alphabet
        expect(word).toMatch(/^[a-z]+$/);
        // Length must strictly equal tier
        expect(word.length).toBe(tier);

        // No duplicates within tier
        expect(seenTierWords.has(word)).toBe(false);
        seenTierWords.add(word);

        // No global duplicate across tiers
        expect(seenGlobalWords.has(word)).toBe(false);
        seenGlobalWords.add(word);

        const firstChar = word[0];
        if (firstChar) uniqueFirstLetters.add(firstChar);
      }

      // First-letter count must be >= 12
      // Report count for verification
      console.log(`[Word Tier ${tier}] Words: ${words.length}, Distinct Initial Letters: ${uniqueFirstLetters.size}`);
      expect(uniqueFirstLetters.size).toBeGreaterThanOrEqual(12);
    }
  });
});

describe('DefaultWordProvider Fallback Policy', () => {
  it('selects valid candidate under standard constraints', () => {
    const rng = new Mulberry32(101);
    const provider = new DefaultWordProvider(rng);

    const word = provider.nextWord({
      minLen: 4,
      maxLen: 4,
      excludeFirstLetters: new Set(['b', 'c']),
      excludeWords: new Set(['beam', 'core']),
    });

    expect(word.length).toBe(4);
    expect(word.startsWith('b')).toBe(false);
    expect(word.startsWith('c')).toBe(false);
    expect(word).not.toBe('beam');
    expect(word).not.toBe('core');
  });

  it('fallback path 1: drops excludeFirstLetters when all first letters are blocked, keeping excludeWords', () => {
    const miniDict = {
      4: ['atom', 'base', 'core'],
    };
    const rng = new Mulberry32(102);
    const provider = new DefaultWordProvider(rng, miniDict);

    // Exclude all available first letters: 'a', 'b', 'c', but only exclude word 'atom'
    const word = provider.nextWord({
      minLen: 4,
      maxLen: 4,
      excludeFirstLetters: new Set(['a', 'b', 'c']),
      excludeWords: new Set(['atom']),
    });

    // Should drop first letter exclusion, but still respect excludeWords
    expect(['base', 'core']).toContain(word);
    expect(word).not.toBe('atom');
  });

  it('fallback path 2: widens length range by 1 tier when tier words are exhausted', () => {
    const miniDict = {
      3: ['pod'],
      4: ['atom'],
      5: ['laser'],
    };
    const rng = new Mulberry32(103);
    const provider = new DefaultWordProvider(rng, miniDict);

    // Request length 4, but exhaust 'atom'
    const word = provider.nextWord({
      minLen: 4,
      maxLen: 4,
      excludeFirstLetters: new Set<string>(),
      excludeWords: new Set(['atom']),
    });

    // Widened range [3..5] provides 'pod' or 'laser'
    expect(['pod', 'laser']).toContain(word);
  });

  it('deterministic provider with mock yields predictable sequence', () => {
    const fakeProvider: IWordProvider = {
      nextWord: (query: WordQuery) => `mock${query.minLen}`,
      stats: { fallbacks: 0 },
    };

    expect(
      fakeProvider.nextWord({
        minLen: 5,
        maxLen: 5,
        excludeFirstLetters: new Set(),
        excludeWords: new Set(),
      })
    ).toBe('mock5');
  });
});
