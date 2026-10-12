import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SafeStorage } from '@/shared/storage/safeStorage';
import {
  parseSettings,
  migrateToV2,
  SettingsStore,
  DEFAULT_SETTINGS,
} from '@/shared/settings/settingsStore';
import {
  parseHistory,
  HistoryStore,
  validateRunRecord,
  RunRecord,
  MAX_HISTORY_RUNS,
} from '@/shared/history/historyStore';
import {
  computeStats,
  evaluateRecords,
  selectSeries,
} from '@/shared/history/statsMath';
import { buildRunRecord } from '@/app/history/buildRunRecord';
import { formatAccuracy, formatElapsed, formatCount } from '@/shared/formatters';
import { GameResult } from '@/shared/domain';

// Mock storage helper for simulating faults
class MockStorage implements Storage {
  private store = new Map<string, string>();
  public shouldThrowOnGet = false;
  public shouldThrowOnSet = false;
  public shouldThrowOnRemove = false;

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) {
      throw new Error('Storage read fault');
    }
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrowOnSet) {
      throw new Error('QuotaExceededError');
    }
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    if (this.shouldThrowOnRemove) {
      throw new Error('Storage remove fault');
    }
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Persistence Layer & Statistics (Phase P3)', () => {
  describe('SafeStorage (3.A)', () => {
    let mockBackend: MockStorage;
    let safeStorage: SafeStorage;

    beforeEach(() => {
      mockBackend = new MockStorage();
      safeStorage = new SafeStorage(mockBackend);
    });

    it('handles standard get, set, and remove operations', () => {
      expect(safeStorage.get('key1')).toBeNull();
      expect(safeStorage.set('key1', 'value1')).toBe(true);
      expect(safeStorage.get('key1')).toBe('value1');
      expect(safeStorage.remove('key1')).toBe(true);
      expect(safeStorage.get('key1')).toBeNull();
    });

    it('falls back to memory and does not throw when storage throws on read', () => {
      safeStorage.set('token', 'abc');
      mockBackend.shouldThrowOnGet = true;

      // Even though backend throws on getItem, SafeStorage catches and returns from memory
      expect(safeStorage.get('token')).toBe('abc');
    });

    it('falls back to memory and returns false when storage throws on write (e.g. quota exceeded)', () => {
      mockBackend.shouldThrowOnSet = true;

      const result = safeStorage.set('large_key', 'payload');
      expect(result).toBe(false);
      // Value is still available via in-memory fallback
      expect(safeStorage.get('large_key')).toBe('payload');
    });

    it('operates cleanly when backend is null (storage disabled)', () => {
      const memoryOnlyStorage = new SafeStorage(null);
      expect(memoryOnlyStorage.isAvailable).toBe(false);
      expect(memoryOnlyStorage.set('foo', 'bar')).toBe(false);
      expect(memoryOnlyStorage.get('foo')).toBe('bar');
      expect(memoryOnlyStorage.remove('foo')).toBe(true);
      expect(memoryOnlyStorage.get('foo')).toBeNull();
    });
  });

  describe('SettingsStore & Validation (3.B) - v1 to v2 Migration', () => {
    it('returns default settings for null or malformed JSON', () => {
      expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
      expect(parseSettings('invalid json')).toEqual(DEFAULT_SETTINGS);
      expect(parseSettings('123')).toEqual(DEFAULT_SETTINGS);
      expect(parseSettings('[]')).toEqual(DEFAULT_SETTINGS);
      expect(migrateToV2('corrupted {')).toEqual(DEFAULT_SETTINGS);
    });

    it('returns default settings if unknown schema version', () => {
      const wrongVersion = JSON.stringify({
        version: 99,
        sfxEnabled: false,
      });
      expect(parseSettings(wrongVersion)).toEqual(DEFAULT_SETTINGS);
    });

    it('migrates v1 with { muted: true, sfxEnabled: true } -> v2 { sfxEnabled: true } (sfxEnabled wins)', () => {
      const raw = { version: 1, muted: true, sfxEnabled: true };
      const migrated = migrateToV2(raw);
      expect(migrated.version).toBe(2);
      expect(migrated.sfxEnabled).toBe(true);
      expect((migrated as Record<string, unknown>).muted).toBeUndefined();
    });

    it('migrates v1 with { muted: true } (no sfxEnabled) -> v2 { sfxEnabled: false }', () => {
      const raw = { version: 1, muted: true };
      const migrated = migrateToV2(raw);
      expect(migrated.version).toBe(2);
      expect(migrated.sfxEnabled).toBe(false);
      expect((migrated as Record<string, unknown>).muted).toBeUndefined();
    });

    it('migrates v1 with { muted: false, highScore: 1234 } -> v2 { sfxEnabled: true } and discards highScore', () => {
      const raw = { version: 1, muted: false, highScore: { score: 1234, wave: 5 } };
      const migrated = migrateToV2(raw);
      expect(migrated.version).toBe(2);
      expect(migrated.sfxEnabled).toBe(true);
      expect((migrated as Record<string, unknown>).highScore).toBeUndefined();
    });

    it('preserves existing v2 configuration without changes', () => {
      const v2Config = {
        version: 2 as const,
        sfxVolume: 0.8,
        musicVolume: 0.4,
        sfxEnabled: false,
        musicEnabled: true,
      };
      const result = migrateToV2(v2Config);
      expect(result).toEqual(v2Config);
    });

    it('performs per-field validation and clamping on v2 schema', () => {
      const partialCorrupt = JSON.stringify({
        version: 2,
        sfxEnabled: 'not-a-bool', // corrupted
        musicEnabled: false,       // valid
        sfxVolume: 1.5,            // clamped
      });
      const parsed = parseSettings(partialCorrupt);
      expect(parsed.sfxEnabled).toBe(true); // default
      expect(parsed.musicEnabled).toBe(false); // kept
      expect(parsed.sfxVolume).toBe(1.0); // clamped
    });

    it('clamps sfxVolume strictly to [0, 1] and restores default for bad values', () => {
      expect(parseSettings(JSON.stringify({ version: 2, sfxVolume: 1.5 })).sfxVolume).toBe(1.0);
      expect(parseSettings(JSON.stringify({ version: 2, sfxVolume: -0.2 })).sfxVolume).toBe(0.0);
      expect(parseSettings(JSON.stringify({ version: 2, sfxVolume: 0.45 })).sfxVolume).toBeCloseTo(0.45);
      expect(parseSettings(JSON.stringify({ version: 2, sfxVolume: 'loud' })).sfxVolume).toBe(0.6);
      expect(parseSettings(JSON.stringify({ version: 2, sfxVolume: NaN })).sfxVolume).toBe(0.6);
    });

    it('notifies subscribers on update and reset in SettingsStore', () => {
      const mockStorage = new MockStorage();
      const safe = new SafeStorage(mockStorage);
      const store = new SettingsStore(safe, 'test.settings');

      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      store.updateSettings({ sfxEnabled: false });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getSettings().sfxEnabled).toBe(false);

      store.updateSettings({ sfxVolume: 0.25 });
      expect(listener).toHaveBeenCalledTimes(2);
      expect(store.getSettings().sfxVolume).toBe(0.25);

      store.resetSettings();
      expect(listener).toHaveBeenCalledTimes(3);
      expect(store.getSettings().sfxEnabled).toBe(true);
      expect(store.getSettings().sfxVolume).toBe(0.6);

      unsubscribe();
      store.updateSettings({ musicEnabled: false });
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('exposes storageAvailable boolean via getState and reflects storage availability', () => {
      const workingBackend = new MockStorage();
      const workingSafe = new SafeStorage(workingBackend);
      const workingStore = new SettingsStore(workingSafe, 'test.working');
      expect(workingStore.isStorageAvailable).toBe(true);
      expect(workingStore.getState().storageAvailable).toBe(true);

      const disabledSafe = new SafeStorage(null);
      const disabledStore = new SettingsStore(disabledSafe, 'test.disabled');
      expect(disabledStore.isStorageAvailable).toBe(false);
      expect(disabledStore.getState().storageAvailable).toBe(false);
    });
  });

  describe('HistoryStore & Record Validation (3.C)', () => {
    const createSampleRecord = (id: number, score = 100): RunRecord => ({
      id,
      endedAt: '2026-10-07T12:00:00.000Z',
      score,
      wave: 3,
      maxStreak: 15,
      wordsDestroyed: 8,
      hits: 45,
      misses: 2,
      accuracy: 95.7,
      grossWpm: 42.0,
      netWpm: 40.5,
      durationSeconds: 45.2,
    });

    it('discards a corrupted record but preserves valid sibling records', () => {
      const raw = JSON.stringify({
        version: 1,
        runs: [
          createSampleRecord(1, 100),
          null, // corrupted
          'corrupted string', // corrupted
          createSampleRecord(2, 200),
        ],
      });
      const history = parseHistory(raw);
      expect(history.runs).toHaveLength(2);
      expect(history.runs[0]?.id).toBe(1);
      expect(history.runs[1]?.id).toBe(2);
    });

    it('sanitizes and clamps invalid numbers in individual records', () => {
      const candidate = {
        id: -5,
        endedAt: '',
        score: -100,
        wave: 0,
        maxStreak: -2,
        wordsDestroyed: -1,
        hits: -10,
        misses: 3,
        accuracy: 105, // clamp to 100; with misses, clamp below 100
        grossWpm: -10,
        netWpm: -5,
        durationSeconds: -20,
      };

      const sanitized = validateRunRecord(candidate, 10);
      expect(sanitized).not.toBeNull();
      expect(sanitized?.id).toBe(10); // fallback id used
      expect(sanitized?.score).toBe(0);
      expect(sanitized?.wave).toBe(1); // wave >= 1
      expect(sanitized?.accuracy).toBe(99.9); // with misses, floored below 100%
      expect(sanitized?.grossWpm).toBe(0);
      expect(sanitized?.netWpm).toBe(0);
      expect(sanitized?.durationSeconds).toBe(0);
    });

    it('enforces FIFO 100-run history cap', () => {
      const mockStorage = new MockStorage();
      const safe = new SafeStorage(mockStorage);
      const store = new HistoryStore(safe, 'test.history');

      for (let i = 1; i <= 105; i++) {
        store.append(createSampleRecord(i, i * 10));
      }

      const runs = store.load();
      expect(runs).toHaveLength(MAX_HISTORY_RUNS);
      expect(runs[0]?.id).toBe(6); // first 5 runs dropped
      expect(runs[runs.length - 1]?.id).toBe(105);
    });
  });

  describe('Pure Stats Math (3.D)', () => {
    const makeRun = (overrides: Partial<RunRecord> = {}): RunRecord => ({
      id: 1,
      endedAt: '2026-10-07T12:00:00.000Z',
      score: 150,
      wave: 2,
      maxStreak: 10,
      wordsDestroyed: 5,
      hits: 60,
      misses: 5,
      accuracy: 92.3,
      grossWpm: 45.0,
      netWpm: 42.0,
      durationSeconds: 35.0,
      ...overrides,
    });

    it('returns zeroes and nulls for empty run list', () => {
      const stats = computeStats([]);
      expect(stats.totalRuns).toBe(0);
      expect(stats.bestScore).toBe(0);
      expect(stats.bestWave).toBe(0);
      expect(stats.bestAccuracy).toBeNull();
      expect(stats.bestNetWpm).toBeNull();
      expect(stats.lastRun).toBeNull();
      expect(stats.previousRun).toBeNull();
    });

    it('enforces MIN_ENTRIES_FOR_BEST_ACCURACY (100 keystrokes)', () => {
      const shortRun = makeRun({ hits: 40, misses: 2, accuracy: 95.2 }); // 42 keystrokes < 100
      const longRun = makeRun({ hits: 100, misses: 10, accuracy: 90.9 }); // 110 keystrokes >= 100

      const stats1 = computeStats([shortRun]);
      expect(stats1.bestAccuracy).toBeNull();

      const stats2 = computeStats([shortRun, longRun]);
      expect(stats2.bestAccuracy).toBe(90.9);
    });

    it('enforces MIN_SECONDS_FOR_BEST_WPM (30 seconds)', () => {
      const fastShortRun = makeRun({ durationSeconds: 20, netWpm: 80 }); // 20s < 30s
      const normalRun = makeRun({ durationSeconds: 45, netWpm: 50 }); // 45s >= 30s

      const stats1 = computeStats([fastShortRun]);
      expect(stats1.bestNetWpm).toBeNull();

      const stats2 = computeStats([fastShortRun, normalRun]);
      expect(stats2.bestNetWpm).toBe(50);
    });

    it('evaluates records per Decision D13 (first run is not a record)', () => {
      const run1 = makeRun({ wave: 3, score: 200 });

      // First run ever
      const eval1 = evaluateRecords([], run1);
      expect(eval1.isFirstRun).toBe(true);
      expect(eval1.isNewWaveRecord).toBe(false);
      expect(eval1.isNewScoreRecord).toBe(false);

      // Subsequent run with equal wave, higher score
      const run2 = makeRun({ wave: 3, score: 250 });
      const eval2 = evaluateRecords([run1], run2);
      expect(eval2.isFirstRun).toBe(false);
      expect(eval2.isNewWaveRecord).toBe(false);
      expect(eval2.isNewScoreRecord).toBe(true);

      // Subsequent run with higher wave
      const run3 = makeRun({ wave: 4, score: 180 });
      const eval3 = evaluateRecords([run1, run2], run3);
      expect(eval3.isFirstRun).toBe(false);
      expect(eval3.isNewWaveRecord).toBe(true);
      expect(eval3.isNewScoreRecord).toBe(false);
    });

    it('selects trend series and highlights latest run at activeIndex', () => {
      const runs = [
        makeRun({ wave: 1, score: 50 }),
        makeRun({ wave: 2, score: 100 }),
        makeRun({ wave: 3, score: 150 }),
      ];

      const waveSeries = selectSeries(runs, 'wave', 2);
      expect(waveSeries.series).toEqual([2, 3]);
      expect(waveSeries.activeIndex).toBe(1);

      const scoreSeries = selectSeries(runs, 'score', 5);
      expect(scoreSeries.series).toEqual([50, 100, 150]);
      expect(scoreSeries.activeIndex).toBe(2);
    });
  });

  describe('buildRunRecord Mapper (3.E)', () => {
    it('maps GameResult to RunRecord with external timestamp and ID', () => {
      const result: GameResult = {
        outcome: 'defeat',
        score: 350,
        wave: 4,
        wavesCompleted: 3,
        maxStreak: 22,
        wordsDestroyed: 14,
        wordsCompleted: 14,
        hits: 90,
        misses: 4,
        accuracy: 95.7,
        grossWpm: 48.2,
        netWpm: 46.1,
        wpm: 48.2,
        durationSeconds: 58.4,
        durationMs: 58400,
        rating: 'A',
      };

      const record = buildRunRecord(result, '2026-10-07T14:30:00.000Z', 42);
      expect(record.id).toBe(42);
      expect(record.endedAt).toBe('2026-10-07T14:30:00.000Z');
      expect(record.score).toBe(350);
      expect(record.wave).toBe(4);
      expect(record.accuracy).toBe(95.7);
      expect(record.netWpm).toBe(46.1);
      expect(record.durationSeconds).toBe(58.4);
    });
  });

  describe('Pure Formatters (3.F)', () => {
    it('formats elapsed duration at boundary thresholds', () => {
      expect(formatElapsed(0)).toBe('00:00');
      expect(formatElapsed(59)).toBe('00:59');
      expect(formatElapsed(60)).toBe('01:00');
      expect(formatElapsed(3599)).toBe('59:59');
      expect(formatElapsed(3600)).toBe('1:00:00');
      expect(formatElapsed(3665)).toBe('1:01:05');
      expect(formatElapsed(NaN)).toBe('00:00');
    });

    it('formats accuracy safely without ever presenting 100.0% when misses occur', () => {
      expect(formatAccuracy(100.0, 0)).toBe('100.0%');
      expect(formatAccuracy(100.0, 1)).toBe('99.9%');
      expect(formatAccuracy(99.99, 1)).toBe('99.9%');
      expect(formatAccuracy(96.4)).toBe('96.4%');
      expect(formatAccuracy(NaN)).toBe('0.0%');
    });

    it('formats numeric counts with thousands commas', () => {
      expect(formatCount(0)).toBe('0');
      expect(formatCount(999)).toBe('999');
      expect(formatCount(1000)).toBe('1,000');
      expect(formatCount(1250000)).toBe('1,250,000');
      expect(formatCount(NaN)).toBe('0');
    });
  });
});
