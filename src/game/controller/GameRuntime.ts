import { GameSimulation, IWordProvider, RngStreams } from '@/game/core';
import { FixedStepper } from '@/game/core/fixedStepper';
import { InputQueue } from '@/game/input/inputQueue';
import { DEFAULT_RUN_CONFIG } from '@/shared/config/defaultConfig';
import {
  GameCommand,
  GameEvent,
  GameSnapshot,
  RunConfig,
} from '@/shared/domain';

export interface FrameResult {
  readonly snapshot: GameSnapshot;
  readonly events: GameEvent[];
}

export interface CommandLogEntry {
  readonly tick: number;
  readonly command: GameCommand;
}

/**
 * Framework-free runtime controller.
 * Owns GameSimulation, FixedStepper, and InputQueue.
 * Connects variable-timestep rendering frames to deterministic 60Hz ticks.
 */
export class GameRuntime {
  readonly simulation: GameSimulation;
  readonly stepper: FixedStepper;
  readonly inputQueue: InputQueue;
  private readonly _commandLog: CommandLogEntry[] = [];

  constructor(
    config: RunConfig = DEFAULT_RUN_CONFIG,
    customWordProvider?: IWordProvider,
    customStreams?: RngStreams,
    autoStart: boolean = true
  ) {
    this.simulation = new GameSimulation(config, customWordProvider, customStreams);
    this.stepper = new FixedStepper(this.simulation, config.tickRate);
    this.inputQueue = new InputQueue();

    if (autoStart) {
      this.simulation.start();
    }
  }

  /**
   * Advances the runtime by deltaSeconds:
   * 1. Drains the input queue into sim.handleCommand before the first tick of the frame.
   * 2. Advances the fixed stepper.
   * 3. Returns snapshot and drained events (events drained once per frame).
   */
  frame(deltaSeconds: number): FrameResult {
    // 1. Drain input queue before the first tick of the frame
    const commands = this.inputQueue.drain();
    for (const command of commands) {
      this._commandLog.push({
        tick: this.simulation.currentTick,
        command,
      });
      this.simulation.handleCommand(command);
    }

    // 2. Advance fixed stepper (triggers sim.tick() calls)
    this.stepper.advance(deltaSeconds);

    // 3. Return snapshot and drained events
    const snapshot = this.simulation.getSnapshot();
    const events = this.simulation.drainEvents();

    return {
      snapshot,
      events,
    };
  }

  getSnapshot(): GameSnapshot {
    return this.simulation.getSnapshot();
  }

  get status(): GameSnapshot['status'] {
    return this.simulation.getSnapshot().status;
  }

  get currentTick(): number {
    return this.simulation.currentTick;
  }

  get commandLog(): readonly CommandLogEntry[] {
    return this._commandLog;
  }

  getCommandLog(): CommandLogEntry[] {
    return [...this._commandLog];
  }

  start(): void {
    this.simulation.start();
  }

  pause(): void {
    this.simulation.pause();
  }

  resume(): void {
    this.simulation.resume();
  }
}
