/**
 * ============================================================================
 * PURE TYPING METRICS MODULE (SpeedTypingOnline Formulas)
 * ============================================================================
 * 
 * Equations per SpeedTypingOnline "Typing Equations" specification:
 * - Accuracy = (correct entries / total entries) * 100
 * - Gross WPM = (total entries / 5) / elapsed minutes
 * - Net WPM = max(0, Gross WPM - (uncorrected errors / elapsed minutes))
 * 
 * Rules:
 * 1. Accuracy is 100 when hits + misses is 0. Computed strictly from integers.
 * 2. Floor to 1 decimal place. 100.0% appears only with zero misses.
 * 3. Both WPM values are 0 when elapsed ticks is 0.
 * 4. Strictly pure, no DOM / browser dependencies, zero NaN / Infinity.
 * ============================================================================
 */

/**
 * Truncates / floors a floating-point number to one decimal place.
 * Ensures no rounding up (e.g. 66.666... becomes 66.6, 99.99 becomes 99.9).
 */
export function floorToOneDecimal(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }
  return Math.floor(value * 10) / 10;
}

/**
 * Computes typing accuracy percentage from hits and misses.
 *
 * @param hits Total count of correct character entries (>= 0).
 * @param misses Total count of incorrect character entries (>= 0).
 * @returns Raw accuracy percentage in [0, 100]. Returns 100 when hits + misses is 0.
 */
export function computeAccuracy(hits: number, misses: number): number {
  const safeHits = Math.max(0, Math.floor(hits));
  const safeMisses = Math.max(0, Math.floor(misses));
  const total = safeHits + safeMisses;
  if (total === 0) {
    return 100;
  }
  return (100 * safeHits) / total;
}

/**
 * Computes accuracy floored to one decimal place.
 * Enforces that 100.0% is returned strictly when misses is 0.
 *
 * @param hits Total count of correct character entries (>= 0).
 * @param misses Total count of incorrect character entries (>= 0).
 * @returns Accuracy floored to 1 decimal place in [0, 100].
 */
export function computeFlooredAccuracy(hits: number, misses: number): number {
  const safeMisses = Math.max(0, Math.floor(misses));
  const raw = computeAccuracy(hits, misses);
  const floored = floorToOneDecimal(raw);
  if (safeMisses > 0 && floored >= 100) {
    return 99.9;
  }
  return floored;
}

/**
 * Computes Gross Words Per Minute.
 * A standard word is defined as 5 characters.
 *
 * @param entries Total characters typed (hits + misses).
 * @param elapsedTicks Number of 60Hz ticks elapsed.
 * @param tickRate Simulation tick rate (default: 60 ticks/s).
 * @returns Gross WPM floored to one decimal place. Returns 0 if ticks <= 0.
 */
export function computeGrossWpm(
  entries: number,
  elapsedTicks: number,
  tickRate: number = 60
): number {
  if (elapsedTicks <= 0 || tickRate <= 0) {
    return 0;
  }
  const minutes = elapsedTicks / (tickRate * 60);
  if (minutes <= 0) {
    return 0;
  }
  const safeEntries = Math.max(0, entries);
  const words = safeEntries / 5;
  const gross = words / minutes;
  if (!Number.isFinite(gross) || Number.isNaN(gross)) {
    return 0;
  }
  return floorToOneDecimal(gross);
}

/**
 * Computes Net Words Per Minute.
 * In this game, with no backspace/correction mechanic, every miss is an uncorrected error.
 * Net WPM = max(0, Gross WPM - (misses / minutes)).
 *
 * @param entries Total characters typed (hits + misses).
 * @param misses Total incorrect character entries.
 * @param elapsedTicks Number of 60Hz ticks elapsed.
 * @param tickRate Simulation tick rate (default: 60 ticks/s).
 * @returns Net WPM floored to one decimal place (never negative). Returns 0 if ticks <= 0.
 */
export function computeNetWpm(
  entries: number,
  misses: number,
  elapsedTicks: number,
  tickRate: number = 60
): number {
  if (elapsedTicks <= 0 || tickRate <= 0) {
    return 0;
  }
  const minutes = elapsedTicks / (tickRate * 60);
  if (minutes <= 0) {
    return 0;
  }
  const safeEntries = Math.max(0, entries);
  const safeMisses = Math.max(0, misses);
  const words = safeEntries / 5;
  const gross = words / minutes;
  const penalty = safeMisses / minutes;
  const net = Math.max(0, gross - penalty);
  if (!Number.isFinite(net) || Number.isNaN(net)) {
    return 0;
  }
  return floorToOneDecimal(net);
}
