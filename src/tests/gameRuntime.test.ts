import { describe, it, expect } from 'vitest';
import { GameRuntime } from '@/game/controller/GameRuntime';
import { DEFAULT_RUN_CONFIG } from '@/shared/config/defaultConfig';
import { GameCommand } from '@/shared/domain';

describe('GameRuntime (7.A)', () => {
  it('instantiates simulation, stepper, and inputQueue, starting in running status', () => {
    const runtime = new GameRuntime();
    expect(runtime.simulation).toBeDefined();
    expect(runtime.stepper).toBeDefined();
    expect(runtime.inputQueue).toBeDefined();
    expect(runtime.status).toBe('running');
    expect(runtime.commandLog).toEqual([]);
  });

  it('drains queued commands into sim.handleCommand before stepper advances', () => {
    const runtime = new GameRuntime();
    const command: GameCommand = { type: 'char', char: 'a' };

    runtime.inputQueue.push(command);
    expect(runtime.inputQueue.size).toBe(1);

    const initialTick = runtime.currentTick;
    const result = runtime.frame(1 / 60);

    // Command queue should be emptied
    expect(runtime.inputQueue.isEmpty).toBe(true);

    // Command should be recorded in commandLog with tick when it was handled
    expect(runtime.commandLog).toHaveLength(1);
    expect(runtime.commandLog[0]).toEqual({
      tick: initialTick,
      command,
    });

    // Stepper advanced by 1 step at 60Hz
    expect(result.snapshot.elapsedTicks).toBe(initialTick + 1);
    expect(runtime.currentTick).toBe(initialTick + 1);
  });

  it('drains events once per frame and provides fresh snapshot', () => {
    const runtime = new GameRuntime(DEFAULT_RUN_CONFIG);

    const firstFrame = runtime.frame(1 / 60);
    expect(firstFrame.snapshot).toBeDefined();
    expect(Array.isArray(firstFrame.events)).toBe(true);
    // On start/first tick, WAVE_INTERMISSION was emitted
    expect(firstFrame.events.some((e) => e.type === 'WAVE_INTERMISSION')).toBe(true);

    // Second frame: events from first frame must not be returned again
    const secondFrame = runtime.frame(1 / 60);
    expect(secondFrame.events.some((e) => e.type === 'WAVE_INTERMISSION')).toBe(false);
  });

  it('records multiple commands in FIFO order in commandLog', () => {
    const runtime = new GameRuntime();
    const cmd1: GameCommand = { type: 'char', char: 'b' };
    const cmd2: GameCommand = { type: 'char', char: 'c' };
    const cmd3: GameCommand = { type: 'release-target' };

    runtime.inputQueue.push(cmd1);
    runtime.inputQueue.push(cmd2);
    runtime.inputQueue.push(cmd3);

    runtime.frame(1 / 60);

    const log = runtime.getCommandLog();
    expect(log).toHaveLength(3);
    expect(log[0]?.command).toEqual(cmd1);
    expect(log[1]?.command).toEqual(cmd2);
    expect(log[2]?.command).toEqual(cmd3);
  });

  it('supports pause and resume delegation', () => {
    const runtime = new GameRuntime();
    expect(runtime.status).toBe('running');

    runtime.pause();
    expect(runtime.status).toBe('paused');

    runtime.resume();
    expect(runtime.status).toBe('running');
  });
});
