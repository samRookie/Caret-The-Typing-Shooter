/**
 * ============================================================================
 * RUN HISTORY STORE (3.C)
 * ============================================================================
 *
 * Persistent storage of past combat runs under key `caret.history.v1`.
 * Features:
 * - Stores up to 100 runs (FIFO: oldest records dropped when cap is reached).
 * - Per-record validation: malformed items are repaired or discarded individually
 *   without wiping out valid historical records.
 * - Monotonic ID tracking per history.
 * - External store subscription and React `useHistory()` hook.
 * ============================================================================
 */

import { useSyncExternalStore } from 'react';
import { SafeStorage, safeStorage } from '../storage/safeStorage';
import { floorToOneDecimal } from '@/game/core/metrics/typingMetrics';

export const HISTORY_STORAGE_KEY = 'caret.history.v1';
export const MAX_HISTORY_RUNS = 100;

export interface RunRecord {
  readonly id: number;            // Monotonic ID per history
  readonly endedAt: string;       // ISO-8601 string created at app layer (never in core)
  readonly score: number;         // Final score achieved (>= 0)
  readonly wave: number;          // Final wave reached (>= 1)
  readonly maxStreak: number;     // Highest character streak (>= 0)
  readonly wordsDestroyed: number;// Completed words (>= 0)
  readonly hits: number;          // Correct keystrokes (>= 0)
  readonly misses: number;        // Mistyped keystrokes (>= 0)
  readonly accuracy: number;      // Keystroke accuracy percentage floored (0..100)
  readonly grossWpm: number;      // Gross words per minute (>= 0)
  readonly netWpm: number;        // Net words per minute (>= 0)
  readonly durationSeconds: number; // Elapsed simulation seconds (>= 0)
}

export interface HistoryDataV1 {
  readonly version: 1;
  readonly runs: readonly RunRecord[];
}

export const EMPTY_HISTORY: HistoryDataV1 = {
  version: 1,
  runs: [],
};

/**
 * Validates and sanitizes a single candidate record.
 * Returns null if the item is corrupted beyond reasonable repair.
 */
export function validateRunRecord(item: unknown, fallbackId: number): RunRecord | null {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return null;
  }

  const rec = item as Record<string, unknown>;

  const id =
    typeof rec.id === 'number' && Number.isFinite(rec.id) && rec.id >= 0
      ? Math.floor(rec.id)
      : fallbackId;

  const endedAt =
    typeof rec.endedAt === 'string' && rec.endedAt.trim().length > 0
      ? rec.endedAt.trim()
      : new Date(0).toISOString();

  const score =
    typeof rec.score === 'number' && Number.isFinite(rec.score)
      ? Math.max(0, Math.floor(rec.score))
      : 0;

  const wave =
    typeof rec.wave === 'number' && Number.isFinite(rec.wave)
      ? Math.max(1, Math.floor(rec.wave))
      : 1;

  const maxStreak =
    typeof rec.maxStreak === 'number' && Number.isFinite(rec.maxStreak)
      ? Math.max(0, Math.floor(rec.maxStreak))
      : 0;

  const wordsDestroyed =
    typeof rec.wordsDestroyed === 'number' && Number.isFinite(rec.wordsDestroyed)
      ? Math.max(0, Math.floor(rec.wordsDestroyed))
      : 0;

  const hits =
    typeof rec.hits === 'number' && Number.isFinite(rec.hits)
      ? Math.max(0, Math.floor(rec.hits))
      : 0;

  const misses =
    typeof rec.misses === 'number' && Number.isFinite(rec.misses)
      ? Math.max(0, Math.floor(rec.misses))
      : 0;

  let accuracy = 0;
  if (typeof rec.accuracy === 'number' && Number.isFinite(rec.accuracy)) {
    accuracy = Math.min(100, Math.max(0, floorToOneDecimal(rec.accuracy)));
    if (misses > 0 && accuracy >= 100) {
      accuracy = 99.9;
    }
  }

  const grossWpm =
    typeof rec.grossWpm === 'number' && Number.isFinite(rec.grossWpm)
      ? Math.max(0, floorToOneDecimal(rec.grossWpm))
      : 0;

  const netWpm =
    typeof rec.netWpm === 'number' && Number.isFinite(rec.netWpm)
      ? Math.max(0, floorToOneDecimal(rec.netWpm))
      : 0;

  const durationSeconds =
    typeof rec.durationSeconds === 'number' && Number.isFinite(rec.durationSeconds)
      ? Math.max(0, floorToOneDecimal(rec.durationSeconds))
      : 0;

  return {
    id,
    endedAt,
    score,
    wave,
    maxStreak,
    wordsDestroyed,
    hits,
    misses,
    accuracy,
    grossWpm,
    netWpm,
    durationSeconds,
  };
}

/**
 * Parses raw JSON string into validated HistoryDataV1.
 * Drops malformed individual items while keeping valid siblings.
 * Caps at MAX_HISTORY_RUNS (newest preserved).
 */
export function parseHistory(raw: string | null): HistoryDataV1 {
  if (!raw || typeof raw !== 'string') {
    return EMPTY_HISTORY;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_HISTORY;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return EMPTY_HISTORY;
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1 || !Array.isArray(obj.runs)) {
    return EMPTY_HISTORY;
  }

  const validatedRuns: RunRecord[] = [];
  let nextFallbackId = 1;

  for (const item of obj.runs) {
    const valid = validateRunRecord(item, nextFallbackId);
    if (valid) {
      validatedRuns.push(valid);
      nextFallbackId = Math.max(nextFallbackId + 1, valid.id + 1);
    }
  }

  const cappedRuns =
    validatedRuns.length > MAX_HISTORY_RUNS
      ? validatedRuns.slice(validatedRuns.length - MAX_HISTORY_RUNS)
      : validatedRuns;

  return {
    version: 1,
    runs: cappedRuns,
  };
}

export class HistoryStore {
  private currentHistory: HistoryDataV1;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: SafeStorage = safeStorage,
    private readonly storageKey: string = HISTORY_STORAGE_KEY
  ) {
    this.currentHistory = this.loadFromStorage();
  }

  private loadFromStorage(): HistoryDataV1 {
    const raw = this.storage.getItem(this.storageKey);
    return parseHistory(raw);
  }

  private saveToStorage(): void {
    this.storage.setItem(this.storageKey, JSON.stringify(this.currentHistory));
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Prevent subscriber crash from corrupting store
      }
    });
  }

  load = (): readonly RunRecord[] => {
    return this.currentHistory.runs;
  };

  getNextId = (): number => {
    const runs = this.currentHistory.runs;
    if (runs.length === 0) {
      return 1;
    }
    return Math.max(...runs.map((r) => r.id)) + 1;
  };

  append = (record: RunRecord): void => {
    const valid = validateRunRecord(record, this.getNextId());
    if (!valid) {
      return;
    }

    const updated = [...this.currentHistory.runs, valid];
    const capped =
      updated.length > MAX_HISTORY_RUNS
        ? updated.slice(updated.length - MAX_HISTORY_RUNS)
        : updated;

    this.currentHistory = {
      version: 1,
      runs: capped,
    };

    this.saveToStorage();
    this.notify();
  };

  clear = (): void => {
    this.currentHistory = EMPTY_HISTORY;
    this.saveToStorage();
    this.notify();
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const historyStore = new HistoryStore();

export function useHistory(): readonly RunRecord[] {
  return useSyncExternalStore(historyStore.subscribe, historyStore.load);
}
