import { InputIntent } from './normalize';

export interface DevIntentEntry {
  id: number;
  timestamp: number;
  key: string;
  intent: InputIntent;
  preventDefault: boolean;
}

/**
 * Dev-only ring buffer storing the last 10 normalized input intents.
 */
export class DevIntentLog {
  private entries: DevIntentEntry[] = [];
  private nextId = 1;
  private readonly capacity: number;
  private listeners: Array<() => void> = [];

  constructor(capacity = 10) {
    this.capacity = capacity;
  }

  record(key: string, intent: InputIntent, preventDefault: boolean): void {
    const next = [
      ...this.entries,
      {
        id: this.nextId++,
        timestamp: Date.now(),
        key,
        intent,
        preventDefault,
      },
    ];
    if (next.length > this.capacity) {
      next.shift();
    }
    this.entries = next;
    this.notify();
  }

  getEntries(): readonly DevIntentEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries = [];
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const devIntentLog = new DevIntentLog(10);
