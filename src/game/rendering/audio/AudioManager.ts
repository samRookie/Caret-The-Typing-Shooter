import { EFFECT_CONFIG, SoundCue } from '@/shared/config/effectsConfig';
import { settingsStore } from '@/shared/settings/settingsStore';

export interface SoundPlayRecord {
  readonly cue: SoundCue;
  readonly volume: number;
  readonly rate: number;
  readonly time: number;
}

export interface SoundBackend {
  play(cue: SoundCue, config: { volume: number; rate: number }): void;
  stopAll(): void;
  getContextState?: () => string;
  resumeContext?: () => Promise<void>;
}

export interface AudioManagerOptions {
  readonly backend?: SoundBackend;
  readonly clock?: () => number;
}

export class AudioManager {
  private backend: SoundBackend | null = null;
  private readonly clock: () => number;
  private sfxEnabled: boolean = true;
  private unsubscribeStore?: () => void;

  // Concurrency & timing controls
  private laserActiveCount: number = 0;
  private lastLaserStartTime: number = -Infinity;

  // Play log for dev telemetry & tests (retains last 50)
  private readonly playLog: SoundPlayRecord[] = [];

  // Keypress sound assertion counter
  private keypressSoundCount: number = 0;

  // Active delayed timers
  private readonly activeTimers = new Set<number>();

  constructor(options: AudioManagerOptions = {}) {
    this.backend = options.backend ?? null;
    this.clock = options.clock ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

    // Subscribe to settingsStore live changes
    this.sfxEnabled = settingsStore.getSettings().sfxEnabled;
    this.unsubscribeStore = settingsStore.subscribe(() => {
      const nextEnabled = settingsStore.getSettings().sfxEnabled;
      if (this.sfxEnabled !== nextEnabled) {
        this.setEnabled(nextEnabled);
      }
    });
  }

  setBackend(backend: SoundBackend): void {
    this.backend = backend;
  }

  beginKeypress(): void {
    this.keypressSoundCount = 0;
  }

  play(
    cue: SoundCue,
    options: {
      volume?: number;
      rate?: number;
      delayMs?: number;
      isKeypress?: boolean;
      simStatus?: string;
    } = {}
  ): void {
    if (!this.sfxEnabled) {
      return;
    }

    // Constraint: While simulation is not running, only UI sounds and game-over cues play
    if (options.simStatus && options.simStatus !== 'running') {
      const allowed = cue === 'ui-click' || cue === 'destroy' || cue === 'wave-complete';
      if (!allowed) {
        return;
      }
    }

    // Rule: At most two sounds per keypress
    if (options.isKeypress) {
      this.keypressSoundCount++;
      if (this.keypressSoundCount > 2) {
        return;
      }
    }

    const delayMs = options.delayMs ?? 0;
    if (delayMs > 0) {
      const timerId = window.setTimeout(() => {
        this.activeTimers.delete(timerId);
        this.dispatchPlay(cue, options.volume ?? 1, options.rate ?? 1);
      }, delayMs);
      this.activeTimers.add(timerId);
    } else {
      this.dispatchPlay(cue, options.volume ?? 1, options.rate ?? 1);
    }
  }

  private dispatchPlay(cue: SoundCue, rawVolume: number, rate: number): void {
    if (!this.sfxEnabled) return;

    const now = this.clock();

    // Volume safety: nothing is louder than destroy cue (0.8)
    const clampedVolume = Math.min(0.8, Math.max(0, rawVolume));

    // Concurrency and spacing for laser
    if (cue === 'laser') {
      if (now - this.lastLaserStartTime < EFFECT_CONFIG.LASER_MIN_SPACING_MS) {
        return; // Spacing violation
      }
      if (this.laserActiveCount >= EFFECT_CONFIG.LASER_CONCURRENCY_CAP) {
        return; // Concurrency limit
      }
      this.lastLaserStartTime = now;
      this.laserActiveCount++;
      // Decrement laser active count after estimated duration (~100ms)
      window.setTimeout(() => {
        this.laserActiveCount = Math.max(0, this.laserActiveCount - 1);
      }, 100);
    }

    const effectiveVolume = clampedVolume * EFFECT_CONFIG.MASTER_GAIN;

    // Log played sound
    this.playLog.push({
      cue,
      volume: effectiveVolume,
      rate,
      time: now,
    });
    if (this.playLog.length > 50) {
      this.playLog.shift();
    }

    // Dispatch to audio backend
    this.backend?.play(cue, {
      volume: effectiveVolume,
      rate,
    });
  }

  stopAll(): void {
    // Clear scheduled delayed sounds
    for (const id of this.activeTimers) {
      clearTimeout(id);
    }
    this.activeTimers.clear();
    this.laserActiveCount = 0;
    this.backend?.stopAll();
  }

  setEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  async unlock(): Promise<void> {
    if (this.backend?.resumeContext) {
      await this.backend.resumeContext();
    }
  }

  getContextState(): string {
    return this.backend?.getContextState ? this.backend.getContextState() : 'running';
  }

  getAudioLog(): readonly SoundPlayRecord[] {
    return this.playLog;
  }

  destroy(): void {
    this.stopAll();
    this.unsubscribeStore?.();
  }
}

export const audioManager = new AudioManager();
