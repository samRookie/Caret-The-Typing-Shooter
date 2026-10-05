import { describe, it, expect } from 'vitest';
import { InputQueue, createInputQueue } from '@/game/input/inputQueue';
import { GameCommand } from '@/shared/domain';
import { INPUT_QUEUE_CAPACITY } from '@/shared/config/defaultConfig';

describe('InputQueue (6.B)', () => {
  it('initializes with default capacity 64 and empty state', () => {
    const queue = new InputQueue();
    expect(queue.capacity).toBe(INPUT_QUEUE_CAPACITY);
    expect(queue.capacity).toBe(64);
    expect(queue.size).toBe(0);
    expect(queue.isEmpty).toBe(true);
    expect(queue.drain()).toEqual([]);
  });

  it('initializes via factory function createInputQueue', () => {
    const queue = createInputQueue();
    expect(queue).toBeInstanceOf(InputQueue);
    expect(queue.capacity).toBe(64);
  });

  it('rejects invalid capacity values', () => {
    expect(() => new InputQueue(0)).toThrow();
    expect(() => new InputQueue(-5)).toThrow();
    expect(() => new InputQueue(NaN)).toThrow();
  });

  it('preserves FIFO ordering when pushing and draining commands', () => {
    const queue = new InputQueue(10);
    const cmd1: GameCommand = { type: 'char', char: 'a' };
    const cmd2: GameCommand = { type: 'char', char: 'b' };
    const cmd3: GameCommand = { type: 'release-target' };

    queue.push(cmd1);
    queue.push(cmd2);
    queue.push(cmd3);

    expect(queue.size).toBe(3);
    expect(queue.isEmpty).toBe(false);

    const drained = queue.drain();
    expect(drained).toEqual([cmd1, cmd2, cmd3]);
    expect(queue.size).toBe(0);
    expect(queue.isEmpty).toBe(true);

    // Subsequent drain is empty
    expect(queue.drain()).toEqual([]);
  });

  it('clears all queued commands on clear()', () => {
    const queue = new InputQueue(10);
    queue.push({ type: 'char', char: 'x' });
    queue.push({ type: 'char', char: 'y' });
    expect(queue.size).toBe(2);

    queue.clear();
    expect(queue.size).toBe(0);
    expect(queue.isEmpty).toBe(true);
    expect(queue.drain()).toEqual([]);
  });

  it('drops oldest commands when capacity is exceeded (bounded memory)', () => {
    const queue = new InputQueue(3);
    queue.push({ type: 'char', char: 'a' });
    queue.push({ type: 'char', char: 'b' });
    queue.push({ type: 'char', char: 'c' });
    expect(queue.size).toBe(3);

    // 4th push drops 'a'
    queue.push({ type: 'char', char: 'd' });
    expect(queue.size).toBe(3);

    // 5th push drops 'b'
    queue.push({ type: 'char', char: 'e' });
    expect(queue.size).toBe(3);

    const drained = queue.drain();
    expect(drained).toEqual([
      { type: 'char', char: 'c' },
      { type: 'char', char: 'd' },
      { type: 'char', char: 'e' },
    ]);
  });

  it('drops exactly the oldest commands when pushing beyond default capacity 64', () => {
    const queue = new InputQueue(); // capacity 64
    const totalCommands = 70;

    for (let i = 0; i < totalCommands; i++) {
      queue.push({ type: 'char', char: String.fromCharCode(97 + (i % 26)) });
    }

    expect(queue.size).toBe(64);
    const drained = queue.drain();
    expect(drained.length).toBe(64);

    // First element in drained should correspond to index (70 - 64) = 6
    const expectedFirstChar = String.fromCharCode(97 + (6 % 26));
    const expectedLastChar = String.fromCharCode(97 + (69 % 26));

    expect(drained[0]).toEqual({ type: 'char', char: expectedFirstChar });
    expect(drained[63]).toEqual({ type: 'char', char: expectedLastChar });
  });
});
