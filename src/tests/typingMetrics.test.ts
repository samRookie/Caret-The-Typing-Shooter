import { describe, it, expect } from 'vitest';
import {
  computeAccuracy,
  computeFlooredAccuracy,
  computeGrossWpm,
  computeNetWpm,
  floorToOneDecimal,
} from '@/game/core/metrics/typingMetrics';
import { formatAccuracy, formatElapsed } from '@/shared/formatters';

describe('1.B SpeedTypingOnline Metric Vectors & Equations', () => {
  it('vector 1: 90 hits, 10 misses, 3600 ticks (1 min) -> Accuracy: 90.0%, Gross: 20.0, Net: 10.0', () => {
    const hits = 90;
    const misses = 10;
    const entries = hits + misses; // 100
    const ticks = 3600; // 60s at 60Hz

    const acc = computeFlooredAccuracy(hits, misses);
    const gross = computeGrossWpm(entries, ticks, 60);
    const net = computeNetWpm(entries, misses, ticks, 60);

    expect(acc).toBe(90.0);
    expect(gross).toBe(20.0);
    expect(net).toBe(10.0);
    expect(formatAccuracy(acc, misses)).toBe('90.0%');
  });

  it('vector 2: 0 hits, 0 misses, 0 ticks -> Accuracy: 100.0%, Gross: 0.0, Net: 0.0', () => {
    const hits = 0;
    const misses = 0;
    const entries = 0;
    const ticks = 0;

    const acc = computeFlooredAccuracy(hits, misses);
    const gross = computeGrossWpm(entries, ticks, 60);
    const net = computeNetWpm(entries, misses, ticks, 60);

    expect(acc).toBe(100.0);
    expect(gross).toBe(0.0);
    expect(net).toBe(0.0);
    expect(formatAccuracy(acc, misses)).toBe('100.0%');
  });

  it('vector 3: 2 hits, 1 miss, 600 ticks (10s) -> Accuracy: 66.6%, Gross: 3.6, Net: 0.0', () => {
    const hits = 2;
    const misses = 1;
    const entries = hits + misses; // 3
    const ticks = 600;

    const acc = computeFlooredAccuracy(hits, misses);
    const gross = computeGrossWpm(entries, ticks, 60);
    const net = computeNetWpm(entries, misses, ticks, 60);

    expect(acc).toBe(66.6);
    expect(gross).toBe(3.6);
    expect(net).toBe(0.0);
    expect(formatAccuracy(acc, misses)).toBe('66.6%');
  });

  it('vector 4: 999 hits, 1 miss, 7200 ticks (2 min) -> Accuracy: 99.9%, Gross: 100.0, Net: 99.5', () => {
    const hits = 999;
    const misses = 1;
    const entries = hits + misses; // 1000
    const ticks = 7200;

    const acc = computeFlooredAccuracy(hits, misses);
    const gross = computeGrossWpm(entries, ticks, 60);
    const net = computeNetWpm(entries, misses, ticks, 60);

    expect(acc).toBe(99.9);
    expect(gross).toBe(100.0);
    expect(net).toBe(99.5);
    expect(formatAccuracy(acc, misses)).toBe('99.9%');
  });

  it('vector 5: 792 hits, 8 misses, 7200 ticks (2 min) -> Accuracy: 99.0%, Gross: 80.0, Net: 76.0', () => {
    const hits = 792;
    const misses = 8;
    const entries = hits + misses; // 800
    const ticks = 7200;

    const acc = computeFlooredAccuracy(hits, misses);
    const gross = computeGrossWpm(entries, ticks, 60);
    const net = computeNetWpm(entries, misses, ticks, 60);

    expect(acc).toBe(99.0);
    expect(gross).toBe(80.0);
    expect(net).toBe(76.0);
    expect(formatAccuracy(acc, misses)).toBe('99.0%');
  });
});

describe('Mathematical Invariants & Property Tests', () => {
  it('guarantees floorToOneDecimal never rounds up', () => {
    expect(floorToOneDecimal(99.99)).toBe(99.9);
    expect(floorToOneDecimal(99.91)).toBe(99.9);
    expect(floorToOneDecimal(66.6666)).toBe(66.6);
    expect(floorToOneDecimal(0.09)).toBe(0.0);
    expect(floorToOneDecimal(-5.5)).toBe(-5.5);
    expect(floorToOneDecimal(NaN)).toBe(0);
    expect(floorToOneDecimal(Infinity)).toBe(0);
  });

  it('guarantees 100.0% is never displayed when misses > 0', () => {
    // Extreme ratio: 1 million hits and 1 miss
    const hits = 1_000_000;
    const misses = 1;
    const acc = computeFlooredAccuracy(hits, misses);
    const formatted = formatAccuracy(acc, misses);

    expect(acc).toBeLessThan(100.0);
    expect(acc).toBe(99.9);
    expect(formatted).toBe('99.9%');
    expect(formatted).not.toBe('100.0%');
  });

  it('enforces bounds and finite values across randomized inputs', () => {
    for (let i = 0; i < 500; i++) {
      const hits = Math.floor(Math.random() * 1000);
      const misses = Math.floor(Math.random() * 50);
      const ticks = Math.floor(Math.random() * 10000);

      const rawAcc = computeAccuracy(hits, misses);
      const flooredAcc = computeFlooredAccuracy(hits, misses);
      const gross = computeGrossWpm(hits + misses, ticks, 60);
      const net = computeNetWpm(hits + misses, misses, ticks, 60);

      expect(Number.isFinite(rawAcc)).toBe(true);
      expect(rawAcc).toBeGreaterThanOrEqual(0);
      expect(rawAcc).toBeLessThanOrEqual(100);

      expect(Number.isFinite(flooredAcc)).toBe(true);
      expect(flooredAcc).toBeGreaterThanOrEqual(0);
      expect(flooredAcc).toBeLessThanOrEqual(100);

      expect(Number.isFinite(gross)).toBe(true);
      expect(gross).toBeGreaterThanOrEqual(0);

      expect(Number.isFinite(net)).toBe(true);
      expect(net).toBeGreaterThanOrEqual(0);
      expect(net).toBeLessThanOrEqual(gross);

      if (misses > 0) {
        expect(formatAccuracy(flooredAcc, misses)).not.toBe('100.0%');
      }
    }
  });

  it('handles division by zero and edge cases without NaN or Infinity', () => {
    expect(computeAccuracy(0, 0)).toBe(100);
    expect(computeFlooredAccuracy(0, 0)).toBe(100);
    expect(computeGrossWpm(0, 0)).toBe(0);
    expect(computeNetWpm(0, 0, 0)).toBe(0);
    expect(computeGrossWpm(100, -10)).toBe(0);
    expect(computeNetWpm(100, 5, -10)).toBe(0);
  });
});

describe('formatElapsed Clock Formatter', () => {
  it('formats mm:ss for durations under 1 hour', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(5)).toBe('00:05');
    expect(formatElapsed(59)).toBe('00:59');
    expect(formatElapsed(60)).toBe('01:00');
    expect(formatElapsed(134)).toBe('02:14');
    expect(formatElapsed(3599)).toBe('59:59');
  });

  it('formats h:mm:ss for durations of 1 hour or greater', () => {
    expect(formatElapsed(3600)).toBe('1:00:00');
    expect(formatElapsed(3665)).toBe('1:01:05');
    expect(formatElapsed(7325)).toBe('2:02:05');
    expect(formatElapsed(36000)).toBe('10:00:00');
  });

  it('handles negative or invalid elapsed seconds gracefully', () => {
    expect(formatElapsed(-10)).toBe('00:00');
    expect(formatElapsed(NaN)).toBe('00:00');
    expect(formatElapsed(Infinity)).toBe('00:00');
  });
});
