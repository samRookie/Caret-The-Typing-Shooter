/**
 * ============================================================================
 * PURE RUN STATISTICS & RECORD EVALUATION (3.D)
 * ============================================================================
 *
 * Deterministic mathematical aggregators for run records.
 * Rules:
 * - Strictly pure: no Web Storage access, no DOM access, no wall-clock access.
 * - Minimum qualification thresholds:
 *   - Best Accuracy requires >= 100 total character keystrokes (hits + misses).
 *   - Best Net WPM requires >= 30 seconds of active combat duration.
 * - Evaluates record breakthroughs against history prior to appending (Decision D13).
 * ============================================================================
 */

import { RunRecord } from './historyStore';

export const MIN_ENTRIES_FOR_BEST_ACCURACY = 100;
export const MIN_SECONDS_FOR_BEST_WPM = 30;
export const GRAPH_MIN_RUNS = 5;

export type TrendMetric = 'wave' | 'score' | 'accuracy' | 'netWpm';

export interface AggregateStats {
  readonly bestScore: number;
  readonly bestWave: number;
  readonly bestAccuracy: number | null;
  readonly bestNetWpm: number | null;
  readonly totalRuns: number;
  readonly totalTimeSeconds: number;
  readonly lastRun: RunRecord | null;
  readonly previousRun: RunRecord | null;
}

export interface RecordEvaluation {
  readonly isFirstRun: boolean;
  readonly isNewWaveRecord: boolean;
  readonly isNewScoreRecord: boolean;
  readonly previousBestWave: number;
  readonly previousBestScore: number;
}

export interface MetricSeries {
  readonly series: readonly number[];
  readonly activeIndex: number;
}

/**
 * Computes career totals and record ceilings across an array of historical runs.
 */
export function computeStats(runs: readonly RunRecord[]): AggregateStats {
  if (runs.length === 0) {
    return {
      bestScore: 0,
      bestWave: 0,
      bestAccuracy: null,
      bestNetWpm: null,
      totalRuns: 0,
      totalTimeSeconds: 0,
      lastRun: null,
      previousRun: null,
    };
  }

  let bestScore = 0;
  let bestWave = 0;
  let bestAccuracy: number | null = null;
  let bestNetWpm: number | null = null;
  let totalTimeSeconds = 0;

  for (const run of runs) {
    if (run.score > bestScore) {
      bestScore = run.score;
    }
    if (run.wave > bestWave) {
      bestWave = run.wave;
    }
    totalTimeSeconds += run.durationSeconds;

    // Accuracy qualification gate: >= 100 total keystrokes
    const totalEntries = run.hits + run.misses;
    if (totalEntries >= MIN_ENTRIES_FOR_BEST_ACCURACY) {
      if (bestAccuracy === null || run.accuracy > bestAccuracy) {
        bestAccuracy = run.accuracy;
      }
    }

    // Net WPM qualification gate: >= 30 seconds duration
    if (run.durationSeconds >= MIN_SECONDS_FOR_BEST_WPM) {
      if (bestNetWpm === null || run.netWpm > bestNetWpm) {
        bestNetWpm = run.netWpm;
      }
    }
  }

  const lastRun = runs[runs.length - 1] ?? null;
  const previousRun = (runs.length >= 2 ? runs[runs.length - 2] : null) ?? null;

  return {
    bestScore,
    bestWave,
    bestAccuracy,
    bestNetWpm,
    totalRuns: runs.length,
    totalTimeSeconds,
    lastRun,
    previousRun,
  };
}

/**
 * Evaluates whether currentRun broke any career records against prior history.
 * Per Decision D13: The first run ever is flagged as `isFirstRun` ("FIRST MISSION LOGGED")
 * rather than a new record. Subsequent runs require strictly higher values than previous bests.
 */
export function evaluateRecords(
  previousRuns: readonly RunRecord[],
  currentRun: RunRecord
): RecordEvaluation {
  if (previousRuns.length === 0) {
    return {
      isFirstRun: true,
      isNewWaveRecord: false,
      isNewScoreRecord: false,
      previousBestWave: 0,
      previousBestScore: 0,
    };
  }

  let prevBestWave = 0;
  let prevBestScore = 0;

  for (const run of previousRuns) {
    if (run.wave > prevBestWave) {
      prevBestWave = run.wave;
    }
    if (run.score > prevBestScore) {
      prevBestScore = run.score;
    }
  }

  const isNewWaveRecord = currentRun.wave > prevBestWave;
  const isNewScoreRecord = currentRun.score > prevBestScore;

  return {
    isFirstRun: false,
    isNewWaveRecord,
    isNewScoreRecord,
    previousBestWave: prevBestWave,
    previousBestScore: prevBestScore,
  };
}

/**
 * Extracts a chronological series for trend charts up to `count` entries.
 * Highlights the newest run at the active index.
 */
export function selectSeries(
  runs: readonly RunRecord[],
  metric: TrendMetric,
  count = 10
): MetricSeries {
  if (runs.length === 0) {
    return {
      series: [],
      activeIndex: -1,
    };
  }

  const sliceCount = Math.max(1, count);
  const subset = runs.length > sliceCount ? runs.slice(runs.length - sliceCount) : runs;

  const series = subset.map((run) => {
    switch (metric) {
      case 'wave':
        return run.wave;
      case 'score':
        return run.score;
      case 'accuracy':
        return run.accuracy;
      case 'netWpm':
        return run.netWpm;
    }
  });

  return {
    series,
    activeIndex: series.length - 1,
  };
}
