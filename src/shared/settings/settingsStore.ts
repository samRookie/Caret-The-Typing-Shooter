/**
 * ============================================================================
 * SETTINGS STORE (3.B)
 * ============================================================================
 *
 * Minimal persistent settings store under key `caret.settings.v1`.
 * Features:
 * - Per-field hand-written validation: individual corrupted fields revert to
 *   defaults while valid sibling fields are preserved.
 * - Unknown schema versions or non-JSON payloads safely revert to full defaults.
 * - External store subscription and React `useSettings()` hook via useSyncExternalStore.
 * ============================================================================
 */

import { useSyncExternalStore } from 'react';
import { SafeStorage, safeStorage } from '../storage/safeStorage';

export const SETTINGS_STORAGE_KEY = 'caret.settings.v1';

export type ReducedMotionPreference = 'system' | 'on' | 'off';

export interface LocalHighScore {
  readonly score: number;
  readonly wave: number;
}

export interface SettingsV1 {
  readonly version: 1;
  readonly sfxVolume: number;                       // 0..1, default 0.6
  readonly muted: boolean;                          // default false
  readonly sfxEnabled: boolean;                     // synced with !muted
  readonly musicEnabled: boolean;                   // default true
  readonly reducedMotion: ReducedMotionPreference;  // default 'system'
  readonly highScore: LocalHighScore | null;        // default null
}

export interface SettingsState extends SettingsV1 {
  readonly storageAvailable: boolean;
}

export const DEFAULT_SETTINGS: SettingsV1 = {
  version: 1,
  sfxVolume: 0.6,
  muted: false,
  sfxEnabled: true,
  musicEnabled: true,
  reducedMotion: 'system',
  highScore: null,
};

/**
 * Hand-written parser with strict per-field validation and number clamping.
 * Good fields are kept; corrupted or invalid fields fall back to their individual defaults.
 * If raw is unparseable or has an unknown schema version, returns DEFAULT_SETTINGS.
 */
export function parseSettings(raw: string | null): SettingsV1 {
  if (!raw || typeof raw !== 'string') {
    return DEFAULT_SETTINGS;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return DEFAULT_SETTINGS;
  }

  const obj = parsed as Record<string, unknown>;

  // Schema version validation: must be 1
  if (obj.version !== 1) {
    return DEFAULT_SETTINGS;
  }

  // Volume: strictly clamped to [0, 1]
  let sfxVolume = DEFAULT_SETTINGS.sfxVolume;
  if (typeof obj.sfxVolume === 'number' && !Number.isNaN(obj.sfxVolume)) {
    sfxVolume = Math.max(0, Math.min(1, obj.sfxVolume));
  }

  // Mute & SFX enabled synchronization
  let muted = DEFAULT_SETTINGS.muted;
  let sfxEnabled = DEFAULT_SETTINGS.sfxEnabled;

  if (typeof obj.muted === 'boolean') {
    muted = obj.muted;
    sfxEnabled = typeof obj.sfxEnabled === 'boolean' ? obj.sfxEnabled : !muted;
  } else if (typeof obj.sfxEnabled === 'boolean') {
    sfxEnabled = obj.sfxEnabled;
    muted = !sfxEnabled;
  }

  const musicEnabled =
    typeof obj.musicEnabled === 'boolean' ? obj.musicEnabled : DEFAULT_SETTINGS.musicEnabled;

  let reducedMotion: ReducedMotionPreference = DEFAULT_SETTINGS.reducedMotion;
  if (
    obj.reducedMotion === 'system' ||
    obj.reducedMotion === 'on' ||
    obj.reducedMotion === 'off'
  ) {
    reducedMotion = obj.reducedMotion;
  }

  // High score record validation (unverified local best)
  let highScore: LocalHighScore | null = null;
  if (
    typeof obj.highScore === 'object' &&
    obj.highScore !== null &&
    !Array.isArray(obj.highScore)
  ) {
    const hs = obj.highScore as Record<string, unknown>;
    if (
      typeof hs.score === 'number' &&
      !Number.isNaN(hs.score) &&
      hs.score >= 0 &&
      typeof hs.wave === 'number' &&
      !Number.isNaN(hs.wave) &&
      hs.wave >= 1
    ) {
      highScore = {
        score: Math.round(hs.score),
        wave: Math.round(hs.wave),
      };
    }
  }

  return {
    version: 1,
    sfxVolume,
    muted,
    sfxEnabled,
    musicEnabled,
    reducedMotion,
    highScore,
  };
}

export class SettingsStore {
  private currentSettings: SettingsV1;
  private cachedState: SettingsState | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: SafeStorage = safeStorage,
    private readonly storageKey: string = SETTINGS_STORAGE_KEY
  ) {
    this.currentSettings = this.loadFromStorage();
  }

  get isStorageAvailable(): boolean {
    return this.storage.isAvailable;
  }

  isAvailable = (): boolean => {
    return this.storage.isAvailable;
  };

  private loadFromStorage(): SettingsV1 {
    const raw = this.storage.getItem(this.storageKey);
    return parseSettings(raw);
  }

  private saveToStorage(): void {
    this.storage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
  }

  private notify(): void {
    this.cachedState = null;
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Prevent listener exceptions from breaking store operations
      }
    });
  }

  getSettings = (): SettingsV1 => {
    return this.currentSettings;
  };

  get = this.getSettings;

  getState = (): SettingsState => {
    const available = this.storage.isAvailable;
    if (
      !this.cachedState ||
      this.cachedState.storageAvailable !== available ||
      this.cachedState.sfxVolume !== this.currentSettings.sfxVolume ||
      this.cachedState.muted !== this.currentSettings.muted ||
      this.cachedState.sfxEnabled !== this.currentSettings.sfxEnabled ||
      this.cachedState.musicEnabled !== this.currentSettings.musicEnabled ||
      this.cachedState.reducedMotion !== this.currentSettings.reducedMotion ||
      this.cachedState.highScore !== this.currentSettings.highScore
    ) {
      this.cachedState = {
        ...this.currentSettings,
        storageAvailable: available,
      };
    }
    return this.cachedState;
  };

  updateSettings = (patch: Partial<Omit<SettingsV1, 'version'>>): SettingsV1 => {
    let sfxVolume = this.currentSettings.sfxVolume;
    if (typeof patch.sfxVolume === 'number' && !Number.isNaN(patch.sfxVolume)) {
      sfxVolume = Math.max(0, Math.min(1, patch.sfxVolume));
    }

    let muted = this.currentSettings.muted;
    let sfxEnabled = this.currentSettings.sfxEnabled;

    if (typeof patch.muted === 'boolean') {
      muted = patch.muted;
      sfxEnabled = typeof patch.sfxEnabled === 'boolean' ? patch.sfxEnabled : !muted;
    } else if (typeof patch.sfxEnabled === 'boolean') {
      sfxEnabled = patch.sfxEnabled;
      muted = !sfxEnabled;
    }

    let highScore = this.currentSettings.highScore;
    if (patch.highScore !== undefined) {
      if (patch.highScore === null) {
        highScore = null;
      } else if (
        typeof patch.highScore === 'object' &&
        typeof patch.highScore.score === 'number' &&
        typeof patch.highScore.wave === 'number'
      ) {
        highScore = {
          score: Math.max(0, Math.round(patch.highScore.score)),
          wave: Math.max(1, Math.round(patch.highScore.wave)),
        };
      }
    }

    const updated: SettingsV1 = {
      version: 1,
      sfxVolume,
      muted,
      sfxEnabled,
      musicEnabled:
        typeof patch.musicEnabled === 'boolean'
          ? patch.musicEnabled
          : this.currentSettings.musicEnabled,
      reducedMotion:
        patch.reducedMotion === 'system' ||
        patch.reducedMotion === 'on' ||
        patch.reducedMotion === 'off'
          ? patch.reducedMotion
          : this.currentSettings.reducedMotion,
      highScore,
    };

    this.currentSettings = updated;
    this.saveToStorage();
    this.notify();
    return this.currentSettings;
  };

  update = this.updateSettings;
  set = this.updateSettings;

  resetSettings = (): SettingsV1 => {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.saveToStorage();
    this.notify();
    return this.currentSettings;
  };

  reset = this.resetSettings;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const settingsStore = new SettingsStore();

export function useSettings(): SettingsState {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.getState);
}
