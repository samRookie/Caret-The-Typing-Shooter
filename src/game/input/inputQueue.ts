import { GameCommand } from '@/shared/domain';
import { INPUT_QUEUE_CAPACITY } from '@/shared/config/defaultConfig';

/**
 * Fixed-capacity drop-oldest command queue.
 * Guarantees bounded memory footprint even if the simulation or renderer stalls.
 */
export class InputQueue {
  private buffer: GameCommand[] = [];
  readonly capacity: number;

  constructor(capacity: number = INPUT_QUEUE_CAPACITY) {
    if (capacity <= 0 || !Number.isFinite(capacity)) {
      throw new Error(`InputQueue capacity must be a positive integer, got ${capacity}`);
    }
    this.capacity = Math.floor(capacity);
  }

  /**
   * Pushes a command to the queue.
   * If capacity is reached, the oldest command is dropped to preserve bounded memory.
   */
  push(cmd: GameCommand): void {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(cmd);
  }

  /**
   * Drains all queued commands in FIFO order and resets the queue buffer.
   * Subsequent calls return an empty array until new commands are pushed.
   */
  drain(): GameCommand[] {
    if (this.buffer.length === 0) {
      return [];
    }
    const commands = this.buffer;
    this.buffer = [];
    return commands;
  }

  /**
   * Discards all currently queued commands.
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Current number of queued commands awaiting drain.
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Whether the queue currently has zero queued commands.
   */
  get isEmpty(): boolean {
    return this.buffer.length === 0;
  }
}

/**
 * Factory creating an InputQueue with default or configured capacity.
 */
export function createInputQueue(capacity?: number): InputQueue {
  return new InputQueue(capacity);
}
