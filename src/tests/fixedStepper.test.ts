import { describe, it, expect, vi } from 'vitest';
import { FixedStepper } from '@/game/core/fixedStepper';

describe('FixedStepper Deterministic Timestep Accumulator', () => {
  it('advances single step cleanly when delta matches exact step duration', () => {
    const mockSim = { tick: vi.fn() };
    const stepper = new FixedStepper(mockSim, 60); // 1/60 = 0.016666... s

    const result = stepper.advance(1 / 60);
    expect(mockSim.tick).toHaveBeenCalledTimes(1);
    expect(result.stepsTaken).toBe(1);
    expect(result.alpha).toBeCloseTo(0, 4);
  });

  it('accumulates fractional time and returns leftover interpolation alpha', () => {
    const mockSim = { tick: vi.fn() };
    const stepper = new FixedStepper(mockSim, 60);

    // 1.5 steps worth of time
    const result = stepper.advance(1.5 * (1 / 60));
    expect(mockSim.tick).toHaveBeenCalledTimes(1);
    expect(result.stepsTaken).toBe(1);
    expect(result.alpha).toBeCloseTo(0.5, 3);
  });

  it('clamps one frame delta to maximum 0.25 seconds', () => {
    const mockSim = { tick: vi.fn() };
    const stepper = new FixedStepper(mockSim, 60);

    // Delta of 10.0 seconds (e.g. tab backgrounded)
    const result = stepper.advance(10.0);
    // At 60Hz, max 5 steps executed per call
    expect(mockSim.tick).toHaveBeenCalledTimes(5);
    expect(result.stepsTaken).toBe(5);
  });

  it('enforces maximum 5 simulation steps per advance invocation', () => {
    const mockSim = { tick: vi.fn() };
    const stepper = new FixedStepper(mockSim, 60);

    // 0.20 seconds = 12 steps if unbounded, but must clamp to 5 steps
    const result = stepper.advance(0.2);
    expect(mockSim.tick).toHaveBeenCalledTimes(5);
    expect(result.stepsTaken).toBe(5);
  });

  it('handles zero and negative deltas without advancing or mutating state', () => {
    const mockSim = { tick: vi.fn() };
    const stepper = new FixedStepper(mockSim, 60);

    const resZero = stepper.advance(0);
    expect(mockSim.tick).not.toHaveBeenCalled();
    expect(resZero.stepsTaken).toBe(0);

    const resNeg = stepper.advance(-0.05);
    expect(mockSim.tick).not.toHaveBeenCalled();
    expect(resNeg.stepsTaken).toBe(0);
  });

  it('resets accumulated delta on command', () => {
    const mockSim = { tick: vi.fn() };
    const stepper = new FixedStepper(mockSim, 60);

    stepper.advance(0.5 * (1 / 60));
    expect(stepper.getAccumulator()).toBeGreaterThan(0);
    stepper.reset();
    expect(stepper.getAccumulator()).toBe(0);
  });
});
