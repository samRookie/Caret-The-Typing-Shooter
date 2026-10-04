/**
 * Mulberry32 32-bit pseudorandom number generator.
 * Fast, deterministic, framework-independent PRNG with uniform distribution.
 */
export class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    // Ensure initial state is a 32-bit unsigned integer
    this.state = seed >>> 0;
    // Step forward once to decouple from seed edge cases (e.g. 0)
    this.next();
  }

  /**
   * Generates the next pseudorandom float in [0, 1).
   */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a pseudorandom float in [min, max).
   */
  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generates a pseudorandom integer in [min, max] inclusive.
   */
  intBetween(min: number, max: number): number {
    const floorMin = Math.floor(min);
    const floorMax = Math.floor(max);
    if (floorMin >= floorMax) return floorMin;
    return Math.floor(floorMin + this.next() * (floorMax - floorMin + 1));
  }

  /**
   * Selects a random element from a non-empty array.
   */
  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Mulberry32.pick called on an empty array');
    }
    const index = this.intBetween(0, array.length - 1);
    const item = array[index];
    if (item === undefined) {
      throw new Error(`Mulberry32.pick resolved undefined index: ${index}`);
    }
    return item;
  }

  /**
   * Exposes the current 32-bit internal state.
   */
  getState(): number {
    return this.state;
  }
}

/**
 * Independent PRNG stream bundle for deterministic simulation.
 * 
 * DRAW ORDER CONTRACT:
 * 1. Master generator is initialized with `masterSeed` (uint32).
 * 2. First draw: `spawnSeed` is sampled to initialize `spawnRng`.
 * 3. Second draw: `wordSeed` is sampled to initialize `wordRng`.
 * 
 * `spawnRng` is used exclusively for entity spawn X-coordinates and gap retries.
 * `wordRng` is used exclusively for dictionary word selection.
 * This guarantees that changing word logic never shifts the spatial enemy wave pattern.
 */
export interface RngStreams {
  readonly spawnRng: Mulberry32;
  readonly wordRng: Mulberry32;
}

export function createRngStreams(masterSeed: number): RngStreams {
  const master = new Mulberry32(masterSeed);
  const spawnSeed = Math.floor(master.next() * 4294967296) >>> 0;
  const wordSeed = Math.floor(master.next() * 4294967296) >>> 0;

  return {
    spawnRng: new Mulberry32(spawnSeed),
    wordRng: new Mulberry32(wordSeed),
  };
}
