export type HudSignal = 'pip-loss' | 'last-life' | 'mismatch';

export class FeedbackBus {
  private readonly listeners = new Set<(signal: HudSignal) => void>();
  private lastLifeEmitted = false;

  emit(signal: HudSignal): void {
    if (signal === 'last-life') {
      if (this.lastLifeEmitted) return; // at most once per run (de-duplicated)
      this.lastLifeEmitted = true;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(signal);
      } catch {
        // Safe guard against listener errors
      }
    });
  }

  reset(): void {
    this.lastLifeEmitted = false;
  }

  subscribe(listener: (signal: HudSignal) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

export const feedbackBus = new FeedbackBus();
