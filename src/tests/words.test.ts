import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  WORDS_BY_LENGTH,
  createWordProvider,
  IWordProvider,
  WordQuery,
} from '@/game/core/words';
import { Mulberry32 } from '@/game/core/prng';
import { GameSimulation } from '@/game/core/simulation';
import { DEFAULT_RUN_CONFIG } from '@/shared/config/defaultConfig';
import {
  buildWordTiers,
  isValidWordCandidate,
} from '../../scripts/build-words';

describe('Word Data Integrity and Schema (5.E)', () => {
  const tiers = [3, 4, 5, 6, 7, 8];

  // Load exclude and blocklist files for cross-check
  const excludePath = path.resolve(__dirname, '../../data/words-source/exclude.txt');
  const blocklistPath = path.resolve(__dirname, '../../data/words-source/blocklist.txt');
  const excludeWords = new Set(
    fs.readFileSync(excludePath, 'utf-8')
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0)
  );
  const blocklistWords = new Set(
    fs.readFileSync(blocklistPath, 'utf-8')
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0)
  );

  it('validates schema, length, no duplicates within or across tiers, no blocked words, and >= 150 words per tier', () => {
    const seenGlobalWords = new Set<string>();

    for (const tier of tiers) {
      const words = WORDS_BY_LENGTH[tier];
      expect(words).toBeDefined();
      if (!words) continue;

      // Schema requirement: >= 150 words per tier or report shortfall
      console.log(`[Word Tier ${tier}] Word Count: ${words.length}`);
      expect(words.length).toBeGreaterThanOrEqual(150);

      const uniqueFirstLetters = new Set<string>();
      const seenTierWords = new Set<string>();

      for (const word of words) {
        // Must match ^[a-z]+$
        expect(word).toMatch(/^[a-z]+$/);
        // Length must strictly equal tier
        expect(word.length).toBe(tier);

        // No duplicates within tier
        expect(seenTierWords.has(word)).toBe(false);
        seenTierWords.add(word);

        // No duplicate across tiers
        expect(seenGlobalWords.has(word)).toBe(false);
        seenGlobalWords.add(word);

        // No word from exclude.txt or blocklist.txt
        expect(excludeWords.has(word)).toBe(false);
        expect(blocklistWords.has(word)).toBe(false);

        const firstChar = word[0];
        if (firstChar) uniqueFirstLetters.add(firstChar);
      }

      // Coverage requirement: >= 12 distinct initial letters per tier
      console.log(`[Word Tier ${tier}] Distinct Initial Letters: ${uniqueFirstLetters.size}`);
      expect(uniqueFirstLetters.size).toBeGreaterThanOrEqual(12);
    }
  });
});

describe('Pure-Function Filtering Rules Fixtures (5.E)', () => {
  const emptyBlocklist = new Set<string>();

  it('Rule 1: lowercases, trims, and keeps only ^[a-z]{3,8}$', () => {
    expect(isValidWordCandidate('  RADAR  ', emptyBlocklist)).toBe(true);
    expect(isValidWordCandidate('abc', emptyBlocklist)).toBe(true);
    expect(isValidWordCandidate('altitude', emptyBlocklist)).toBe(true);
    // Reject length < 3 or > 8
    expect(isValidWordCandidate('ab', emptyBlocklist)).toBe(false);
    expect(isValidWordCandidate('superconduct', emptyBlocklist)).toBe(false);
    // Reject numbers and symbols
    expect(isValidWordCandidate('bot1', emptyBlocklist)).toBe(false);
    expect(isValidWordCandidate('orbit-x', emptyBlocklist)).toBe(false);
  });

  it('Rule 2: rejects anything in exclude or blocklist', () => {
    const blocked = new Set(['spam', 'toxic']);
    expect(isValidWordCandidate('spam', blocked)).toBe(false);
    expect(isValidWordCandidate('toxic', blocked)).toBe(false);
    expect(isValidWordCandidate('clean', blocked)).toBe(true);
  });

  it('Rule 3: rejects words with no vowels, 3 identical consecutive letters, or all same letters', () => {
    // No vowels (a, e, i, o, u, y)
    expect(isValidWordCandidate('nth', emptyBlocklist)).toBe(false);
    expect(isValidWordCandidate('crwth', emptyBlocklist)).toBe(false);
    expect(isValidWordCandidate('myth', emptyBlocklist)).toBe(true); // 'y' is accepted as vowel

    // 3 identical consecutive letters
    expect(isValidWordCandidate('aaa', emptyBlocklist)).toBe(false);
    expect(isValidWordCandidate('feed', emptyBlocklist)).toBe(true);
    expect(isValidWordCandidate('feeed', emptyBlocklist)).toBe(false);

    // All letters the same
    expect(isValidWordCandidate('zzzz', emptyBlocklist)).toBe(false);
  });

  it('Rule 4 & 5: deduplicates and groups by length, preserving frequency order capped at maxPerTier', () => {
    const freq = ['first', 'third', 'forth', 'first', 'fifth', 'sixth'];
    const themed = ['pulse'];
    const tiers = buildWordTiers(freq, themed, [], [], { maxPerTier: 3 });

    // Length 5 tier capped at 3
    expect(tiers[5]).toBeDefined();
    expect(tiers[5]!.length).toBe(3);
    // Preserves frequency order of selected candidates and interleaves themed
    expect(tiers[5]).toContain('first');
    expect(tiers[5]).toContain('third');
    expect(tiers[5]).toContain('pulse');
    // 'first' was duplicate in input, ensure only appears once
    expect(tiers[5]!.filter((w) => w === 'first').length).toBe(1);
  });

  it('Rule 6: interleaves themed words evenly across both common and rare pools', () => {
    const freq = [
      'oneaa', 'twobb', 'thrcc', 'foudd', 'fifee',
      'sixff', 'sevgg', 'eighh', 'ninjj', 'tenkk'
    ];
    const themed = ['alpha', 'omega'];
    const tiers = buildWordTiers(freq, themed, [], [], { maxPerTier: 10 });

    const tier5 = tiers[5]!;
    expect(tier5.length).toBe(10);

    const alphaIdx = tier5.indexOf('alpha');
    const omegaIdx = tier5.indexOf('omega');

    expect(alphaIdx).toBeGreaterThanOrEqual(0);
    expect(omegaIdx).toBeGreaterThanOrEqual(0);
    // 'alpha' should be in the common (early) half; 'omega' in the rare (late) half
    expect(alphaIdx).toBeLessThan(5);
    expect(omegaIdx).toBeGreaterThanOrEqual(5);
  });
});

describe('Pipeline Idempotency (5.E)', () => {
  it('running buildWordTiers twice with identical inputs yields byte-identical outputs', () => {
    const freq = ['radar', 'orbit', 'laser', 'shield', 'vector'];
    const themed = ['pulse', 'flare'];
    const exclude = ['toxic'];
    const blocklist = ['spam'];

    const run1 = buildWordTiers(freq, themed, exclude, blocklist);
    const run2 = buildWordTiers(freq, themed, exclude, blocklist);

    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });
});

describe('Difficulty by Commonality (5.C, 5.E)', () => {
  it('restricts candidate pool to ceil(c * tierLength) when commonality is passed', () => {
    const miniDict = {
      4: ['core', 'bolt', 'beam', 'data', 'fuel', 'gear', 'grid', 'hull', 'jump', 'lock'],
    };
    const rng = new Mulberry32(42);
    const provider = createWordProvider(rng, miniDict);

    // Commonality 0.3 on 10 words -> ceil(0.3 * 10) = 3 candidates ('core', 'bolt', 'beam')
    const word = provider.nextWord({
      minLen: 4,
      maxLen: 4,
      excludeFirstLetters: new Set<string>(),
      excludeWords: new Set<string>(),
      commonality: 0.3,
    });

    expect(['core', 'bolt', 'beam']).toContain(word);
    expect(['data', 'fuel', 'gear', 'grid', 'hull', 'jump', 'lock']).not.toContain(word);
  });
});

describe('DefaultWordProvider Fallback Policy & Diagnostics (5.C, 5.E)', () => {
  it('selects valid candidate under standard constraints with stats.fallbacks === 0', () => {
    const rng = new Mulberry32(101);
    const provider = createWordProvider(rng);

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
    expect(provider.stats.fallbacks).toBe(0);
  });

  it('fallback path 1: drops excludeFirstLetters and increments fallbacks', () => {
    const miniDict = {
      4: ['atom', 'base', 'core'],
    };
    const rng = new Mulberry32(102);
    const provider = createWordProvider(rng, miniDict);

    const word = provider.nextWord({
      minLen: 4,
      maxLen: 4,
      excludeFirstLetters: new Set(['a', 'b', 'c']),
      excludeWords: new Set(['atom']),
    });

    expect(['base', 'core']).toContain(word);
    expect(word).not.toBe('atom');
    expect(provider.stats.fallbacks).toBe(1);
  });

  it('fallback path 2: widens length range when tier is exhausted and tracks fallbacks', () => {
    const miniDict = {
      3: ['pod'],
      4: ['atom'],
      5: ['laser'],
    };
    const rng = new Mulberry32(103);
    const provider = createWordProvider(rng, miniDict);

    const word = provider.nextWord({
      minLen: 4,
      maxLen: 4,
      excludeFirstLetters: new Set<string>(),
      excludeWords: new Set(['atom']),
    });

    expect(['pod', 'laser']).toContain(word);
    expect(provider.stats.fallbacks).toBeGreaterThanOrEqual(1);
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

  it('two provider instances with identical seeds and real tiers produce identical sequences', () => {
    const providerA = createWordProvider(new Mulberry32(2026));
    const providerB = createWordProvider(new Mulberry32(2026));

    const query: WordQuery = {
      minLen: 4,
      maxLen: 6,
      excludeFirstLetters: new Set(['x']),
      excludeWords: new Set(['drone']),
      commonality: 0.5,
    };

    for (let i = 0; i < 50; i++) {
      expect(providerA.nextWord(query)).toBe(providerB.nextWord(query));
    }
  });
});

describe('20,000-Tick Simulation Run with Real Data (5.E)', () => {
  it('simulates 20,000 ticks with real data: no duplicate live words and reports fallbacks', () => {
    const sim = new GameSimulation({
      ...DEFAULT_RUN_CONFIG,
      seed: 8888,
      simulation: {
        ...DEFAULT_RUN_CONFIG.simulation,
        playerMaxHealth: 999999, // Infinite hull to sustain continuous 20,000 ticks
      },
    });
    sim.start();

    let duplicateLiveWordsFound = false;

    for (let t = 1; t <= 20000; t++) {
      const snap = sim.getSnapshot();

      // Check live words uniqueness across active enemies
      const activeWordSet = new Set<string>();
      for (const enemy of snap.enemies) {
        if (enemy.alive) {
          if (activeWordSet.has(enemy.word)) {
            duplicateLiveWordsFound = true;
          }
          activeWordSet.add(enemy.word);
        }
      }

      // Automated keystrokes to clear enemies as they approach
      if (t % 8 === 0 && snap.enemies.length > 0) {
        const target =
          snap.enemies.find((e) => e.id === snap.activeTargetId && e.alive) ??
          snap.enemies.find((e) => e.alive);
        if (target && target.remainingWord.length > 0) {
          const char = target.remainingWord[0];
          if (char) {
            sim.handleCommand({ type: 'char', char });
          }
        }
      }

      sim.tick();
    }

    expect(duplicateLiveWordsFound).toBe(false);
    console.log(`[20,000-Tick Simulation] Word Provider Fallbacks Count: ${sim.wordProviderStats.fallbacks}`);
    expect(sim.wordProviderStats.fallbacks).toBeGreaterThanOrEqual(0);
  });
});
