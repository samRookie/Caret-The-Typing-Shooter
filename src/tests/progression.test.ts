import { describe, expect, it } from 'vitest';
import {
  HARD_LETTERS,
  WAVE_INTERMISSION_SECONDS,
  commonalityForWave,
  concurrentCapForWave,
  hardLetterMultiplierForWave,
  hasHardLetter,
  lengthWeightsForWave,
  quotaForWave,
  spawnIntervalSeconds,
  speedForWave,
} from '../shared/config/progression';

describe('progression configuration', () => {
  it('enforces exact sum = 100 for all waves 1 through 25', () => {
    for (let w = 1; w <= 25; w++) {
      const weights = lengthWeightsForWave(w);
      const sum =
        (weights[3] ?? 0) +
        (weights[4] ?? 0) +
        (weights[5] ?? 0) +
        (weights[6] ?? 0) +
        (weights[7] ?? 0) +
        (weights[8] ?? 0);
      expect(sum).toBe(100);
    }
  });

  it('guarantees waves 1 and 2 have 0% weight for words longer than 4 letters', () => {
    for (const w of [1, 2]) {
      const weights = lengthWeightsForWave(w);
      expect(weights[5]).toBe(0);
      expect(weights[6]).toBe(0);
      expect(weights[7]).toBe(0);
      expect(weights[8]).toBe(0);
    }
  });

  it('guarantees wave 3 has 5-6 letter share equal to 10%', () => {
    const weights = lengthWeightsForWave(3);
    expect((weights[5] ?? 0) + (weights[6] ?? 0)).toBe(10);
  });

  it('guarantees wave 5 has 5-6 letter share equal to 50%', () => {
    const weights = lengthWeightsForWave(5);
    expect((weights[5] ?? 0) + (weights[6] ?? 0)).toBe(50);
  });

  it('preserves monotonicity of speed across waves 1 to 25 with max cap 72', () => {
    let prev = speedForWave(1);
    expect(prev).toBe(30);

    for (let w = 2; w <= 25; w++) {
      const curr = speedForWave(w);
      expect(curr).toBeGreaterThanOrEqual(prev);
      expect(curr).toBeLessThanOrEqual(72);
      prev = curr;
    }
    expect(speedForWave(100)).toBe(72);
  });

  it('preserves monotonicity of spawn cadence across waves 1 to 25 with min floor 1.0s', () => {
    let prev = spawnIntervalSeconds(1);
    expect(prev).toBeCloseTo(2.8, 4);

    for (let w = 2; w <= 25; w++) {
      const curr = spawnIntervalSeconds(w);
      expect(curr).toBeLessThanOrEqual(prev);
      expect(curr).toBeGreaterThanOrEqual(1.0);
      prev = curr;
    }
    expect(spawnIntervalSeconds(100)).toBe(1.0);
  });

  it('preserves monotonicity of concurrency cap across waves 1 to 25 with max cap 6', () => {
    let prev = concurrentCapForWave(1);
    expect(prev).toBe(2);

    for (let w = 2; w <= 25; w++) {
      const curr = concurrentCapForWave(w);
      expect(curr).toBeGreaterThanOrEqual(prev);
      expect(curr).toBeLessThanOrEqual(6);
      prev = curr;
    }
    expect(concurrentCapForWave(100)).toBe(6);
  });

  it('preserves monotonicity of quota across waves 1 to 25 with max cap 30', () => {
    let prev = quotaForWave(1);
    expect(prev).toBe(5);

    for (let w = 2; w <= 25; w++) {
      const curr = quotaForWave(w);
      expect(curr).toBeGreaterThanOrEqual(prev);
      expect(curr).toBeLessThanOrEqual(30);
      prev = curr;
    }
    expect(quotaForWave(100)).toBe(30);
  });

  it('preserves monotonicity of mean word length across waves 1 to 25', () => {
    const computeMean = (w: number): number => {
      const weights = lengthWeightsForWave(w);
      let total = 0;
      for (let len = 3; len <= 8; len++) {
        total += len * (weights[len] ?? 0);
      }
      return total / 100;
    };

    let prevMean = computeMean(1);
    for (let w = 2; w <= 25; w++) {
      const currMean = computeMean(w);
      expect(currMean).toBeGreaterThanOrEqual(prevMean);
      prevMean = currMean;
    }
  });

  it('scales commonality fraction from 0.30 up to max 1.0', () => {
    expect(commonalityForWave(1)).toBeCloseTo(0.3, 4);
    expect(commonalityForWave(2)).toBeCloseTo(0.37, 4);
    expect(commonalityForWave(100)).toBe(1.0);
  });

  it('scales hard letter multiplier from 1.0 up to max 2.0', () => {
    expect(hardLetterMultiplierForWave(1)).toBe(1.0);
    expect(hardLetterMultiplierForWave(2)).toBe(1.0);
    expect(hardLetterMultiplierForWave(3)).toBeCloseTo(1.1, 4);
    expect(hardLetterMultiplierForWave(12)).toBe(2.0);
    expect(hardLetterMultiplierForWave(100)).toBe(2.0);
  });

  it('detects hard letters correctly using HARD_LETTERS', () => {
    expect(HARD_LETTERS).toEqual(['j', 'k', 'q', 'v', 'w', 'x', 'z']);

    expect(hasHardLetter('jump')).toBe(true);
    expect(hasHardLetter('king')).toBe(true);
    expect(hasHardLetter('quiz')).toBe(true);
    expect(hasHardLetter('verb')).toBe(true);
    expect(hasHardLetter('wave')).toBe(true);
    expect(hasHardLetter('exit')).toBe(true);
    expect(hasHardLetter('zero')).toBe(true);

    expect(hasHardLetter('cat')).toBe(false);
    expect(hasHardLetter('dog')).toBe(false);
    expect(hasHardLetter('apple')).toBe(false);
    expect(hasHardLetter('test')).toBe(false);
  });

  it('exports standard wave intermission constant', () => {
    expect(WAVE_INTERMISSION_SECONDS).toBe(1.5);
  });
});
