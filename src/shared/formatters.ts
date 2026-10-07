/**
 * ============================================================================
 * PURE DISPLAY FORMATTERS
 * ============================================================================
 * 
 * Shared display formatting helpers for accuracy, elapsed duration, and stats.
 * Strictly pure: no DOM, no side-effects.
 * ============================================================================
 */

import { floorToOneDecimal } from '@/game/core/metrics/typingMetrics';

/**
 * Formats typing accuracy as a percentage string with one decimal place.
 * Uses floor (never rounds up), so 999 hits + 1 miss displays "99.9%", never "100.0%".
 * "100.0%" appears strictly when misses is 0 (or omitted/zero).
 *
 * @param accuracy Raw or floored accuracy percentage (0..100).
 * @param misses Optional count of misses; when > 0, clamps output below 100.0%.
 * @returns Formatted percentage string (e.g. "99.9%", "100.0%", "66.6%").
 */
export function formatAccuracy(accuracy: number, misses: number = 0): string {
  if (!Number.isFinite(accuracy) || Number.isNaN(accuracy)) {
    return '0.0%';
  }
  let floored = floorToOneDecimal(accuracy);
  if (misses > 0 && floored >= 100) {
    floored = 99.9;
  }
  return `${floored.toFixed(1)}%`;
}

/**
 * Formats elapsed time in seconds to "mm:ss", or "h:mm:ss" if 1 hour (3600s) or greater.
 *
 * @param totalSeconds Total elapsed time in seconds (>= 0).
 * @returns Formatted clock string (e.g. "02:14", "59:59", "1:01:05").
 */
export function formatElapsed(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '00:00';
  }
  const safeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
