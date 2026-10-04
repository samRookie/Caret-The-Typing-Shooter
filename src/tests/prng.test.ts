import { describe, it, expect } from 'vitest';
import { Mulberry32, createRngStreams } from '@/game/core/prng';
import { EntityIdGenerator, compareEntityIds, parseEntityNumericId } from '@/game/core/entityId';

describe('Mulberry32 PRNG and Dual Stream Generator', () => {
  it('produces identical deterministic sequences for identical seeds', () => {
    const rng1 = new Mulberry32(1337);
    const rng2 = new Mulberry32(1337);

    const seq1 = Array.from({ length: 50 }, () => rng1.next());
    const seq2 = Array.from({ length: 50 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rngA = new Mulberry32(100);
    const rngB = new Mulberry32(200);

    const valA = rngA.next();
    const valB = rngB.next();

    expect(valA).not.toEqual(valB);
  });

  it('generates numbers within specified bounds', () => {
    const rng = new Mulberry32(42);

    for (let i = 0; i < 200; i++) {
      const floatVal = rng.between(10, 20);
      expect(floatVal).toBeGreaterThanOrEqual(10);
      expect(floatVal).toBeLessThan(20);

      const intVal = rng.intBetween(5, 12);
      expect(Number.isInteger(intVal)).toBe(true);
      expect(intVal).toBeGreaterThanOrEqual(5);
      expect(intVal).toBeLessThanOrEqual(12);
    }
  });

  it('picks elements uniformly from an array', () => {
    const rng = new Mulberry32(999);
    const items = ['alpha', 'beta', 'gamma'];
    const chosen = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const item = rng.pick(items);
      chosen.add(item);
    }

    expect(chosen.size).toBe(3);
  });

  it('derives two independent streams from a single master seed', () => {
    const { spawnRng: spawn1, wordRng: word1 } = createRngStreams(1337);
    const { spawnRng: spawn2, wordRng: word2 } = createRngStreams(1337);

    // Streams from same seed are identical to each other
    expect(spawn1.next()).toBe(spawn2.next());
    expect(word1.next()).toBe(word2.next());

    // Spawn stream and word stream within the same instance are independent
    const spawnVal = spawn1.next();
    const wordVal = word1.next();
    expect(spawnVal).not.toBe(wordVal);
  });
});

describe('EntityIdGenerator & Numeric Comparison', () => {
  it('generates sequential IDs formatted as e1, e2, e3', () => {
    const gen = new EntityIdGenerator();
    expect(gen.next()).toBe('e1');
    expect(gen.next()).toBe('e2');
    expect(gen.next()).toBe('e3');
  });

  it('correctly compares entity IDs numerically, never alphabetically', () => {
    expect(parseEntityNumericId('e1')).toBe(1);
    expect(parseEntityNumericId('e10')).toBe(10);
    expect(parseEntityNumericId('e2')).toBe(2);

    const ids = ['e10', 'e2', 'e1', 'e20', 'e3'];
    ids.sort(compareEntityIds);

    // Numeric sorting: e1, e2, e3, e10, e20 (string sorting would yield e1, e10, e2, e20, e3)
    expect(ids).toEqual(['e1', 'e2', 'e3', 'e10', 'e20']);
  });
});
