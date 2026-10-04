export interface ITickableSimulation {
  tick(): void;
}

export interface StepperResult {
  /** Number of simulation ticks executed during this advance call (0..5). */
  readonly stepsTaken: number;
  /** Normalized fraction [0..1) of unsimulated tick remaining for render interpolation. */
  readonly alpha: number;
}

/**
 * Pure, headless fixed-timestep accumulator.
 * Decouples variable frame rates from deterministic 60Hz simulation ticks.
 * No browser APIs, timers, or DOM globals.
 */
export class FixedStepper {
  private accumulator: number = 0;
  private readonly stepDuration: number;
  private readonly sim: ITickableSimulation;

  constructor(sim: ITickableSimulation, tickRate: number = 60) {
    if (tickRate <= 0) {
      throw new Error(`tickRate must be strictly positive, received ${tickRate}`);
    }
    this.sim = sim;
    this.stepDuration = 1 / tickRate;
  }

  /**
   * Advances the time accumulator by deltaSeconds.
   * Clamps frame delta to 0.25s maximum.
   * Dispatches at most 5 tick() calls per advance.
   * Returns steps taken and leftover interpolation alpha.
   */
  advance(deltaSeconds: number): StepperResult {
    if (deltaSeconds <= 0) {
      return {
        stepsTaken: 0,
        alpha: Math.min(1, Math.max(0, this.accumulator / this.stepDuration)),
      };
    }

    // Clamp frame delta to 0.25 seconds
    const clampedDelta = Math.min(deltaSeconds, 0.25);
    this.accumulator += clampedDelta;

    let stepsTaken = 0;
    while (this.accumulator >= this.stepDuration && stepsTaken < 5) {
      this.sim.tick();
      this.accumulator -= this.stepDuration;
      stepsTaken++;
    }

    // If still backed up after 5 steps, clamp accumulator to prevent spiral of death
    if (this.accumulator > this.stepDuration) {
      this.accumulator = this.accumulator % this.stepDuration;
    }

    const alpha = Math.min(1, Math.max(0, this.accumulator / this.stepDuration));

    return {
      stepsTaken,
      alpha,
    };
  }

  /**
   * Clears accumulated unsimulated delta.
   */
  reset(): void {
    this.accumulator = 0;
  }

  /**
   * Inspects current accumulated time.
   */
  getAccumulator(): number {
    return this.accumulator;
  }
}
