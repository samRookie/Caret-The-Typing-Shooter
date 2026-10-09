/**
 * Audio capabilities declarations (Section 5 / Decision D6).
 * Music capability is checked via isMusicAvailable().
 */

/**
 * Returns whether background music tracks or synthesizers are available.
 * Currently returns false because parameter MUSIC is set to "skip".
 */
export function isMusicAvailable(): boolean {
  return false;
}

/**
 * Legacy constant for backwards compatibility with tests and components.
 */
export const musicAvailable = false;
