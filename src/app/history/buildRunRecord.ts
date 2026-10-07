/**
 * ============================================================================
 * RUN RECORD MAPPER (3.E)
 * ============================================================================
 *
 * App-layer adapter that translates immutable core simulation results into
 * persistent RunRecord structures.
 *
 * Rule R-B: The core simulation never creates wall-clock timestamps or interacts
 * with system clocks. Timestamps are explicitly injected here at the boundary.
 * ============================================================================
 */

import { GameResult } from '@/shared/domain';
import { RunRecord } from '@/shared/history/historyStore';

/**
 * Maps a completed game result and external metadata into a valid RunRecord.
 *
 * @param result Simulation debrief result.
 * @param endedAtIso ISO-8601 formatted timestamp string supplied by the host application.
 * @param id Monotonic record identifier for this history entry.
 */
export function buildRunRecord(
  result: GameResult,
  endedAtIso: string,
  id: number
): RunRecord {
  return {
    id,
    endedAt: endedAtIso,
    score: result.score,
    wave: result.wave,
    maxStreak: result.maxStreak,
    wordsDestroyed: result.wordsDestroyed,
    hits: result.hits,
    misses: result.misses,
    accuracy: result.accuracy,
    grossWpm: result.grossWpm,
    netWpm: result.netWpm,
    durationSeconds: result.durationSeconds,
  };
}
