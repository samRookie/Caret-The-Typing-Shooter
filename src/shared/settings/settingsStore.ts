/**
 * ============================================================================
 * SETTINGS STORE (3.B)
 * ============================================================================
 *
 * Minimal persistent settings store under key `caret.settings.v1`.
 * Version 2 schema eliminates redundant `muted` (single source of truth:
 * `sfxEnabled`) and removes `highScore` (tracked authoritatively by historyStore).
 * Includes automatic one-time migration from v1 schemas.
 * ============================================================================
 */

import { useSyncExternalStore } from 'react';
import { SafeStorage, safeStorage } from '../storage/safeStorage';

export const SETTINGS_STORAGE_KEY = 'caret.settings.v1';

export type ReducedMotionPreference = 'off';

export interface SettingsV2 {
  readonly version: 2;
  readonly sfxVolume: number;                       // 0..1, default 0.6
  readonly musicVolume: number;                     // 0..1, default 0.6
  readonly sfxEnabled: boolean;                     // default true
  readonly musicEnabled: boolean;                   // default true
}

export interface SettingsState extends SettingsV2 {
  readonly storageAvailable: boolean;
}

export const DEFAULT_SETTINGS: SettingsV2 = {
  version: 2,
  sfxVolume: 0.6,
  musicVolume: 0.6,
  sfxEnabled: true,
  musicEnabled: true,
};

/**
 * Migration function migrateToV2:
 * Pure function to safely parse and migrate any raw configuration payload to SettingsV2.
 * - If input is v2: validates fields with defaults for missing/invalid properties.
 * - If input is v1:
 *   - If both `muted` and `sfxEnabled` are present and disagree: prefers `sfxEnabled`.
 *   - If only `muted` is present: `sfxEnabled = !old.muted`.
 *   - If only `sfxEnabled` is present: `sfxEnabled = Boolean(old.sfxEnabled)`.
 *   - If neither: default `sfxEnabled = true`.
 *   - `sfxVolume`, `musicVolume`, `musicEnabled`: carry forward if valid, else defaults.
 *   - `highScore`: safely discarded without error.
 * - If input is corrupted/unparseable/unknown version: returns DEFAULT_SETTINGS.
 */
export function migrateToV2(raw: unknown): SettingsV2 {
  if (raw === null || raw === undefined) {
    return DEFAULT_SETTINGS;
  }

  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return DEFAULT_SETTINGS;
  }

  const record = obj as Record<string, unknown>;

  // Case 1: Already v2 schema
  if (record.version === 2) {
    let sfxVolume = DEFAULT_SETTINGS.sfxVolume;
    if (typeof record.sfxVolume === 'number' && !Number.isNaN(record.sfxVolume)) {
      sfxVolume = Math.max(0, Math.min(1, record.sfxVolume));
    }

    let musicVolume = DEFAULT_SETTINGS.musicVolume;
    if (typeof record.musicVolume === 'number' && !Number.isNaN(record.musicVolume)) {
      musicVolume = Math.max(0, Math.min(1, record.musicVolume));
    }

    const sfxEnabled =
      typeof record.sfxEnabled === 'boolean'
        ? record.sfxEnabled
        : DEFAULT_SETTINGS.sfxEnabled;

    const musicEnabled =
      typeof record.musicEnabled === 'boolean'
        ? record.musicEnabled
        : DEFAULT_SETTINGS.musicEnabled;

    return {
      version: 2,
      sfxVolume,
      musicVolume,
      sfxEnabled,
      musicEnabled,
    };
  }

  // Case 2: v1 schema migration
  if (record.version === 1) {
    let sfxVolume = DEFAULT_SETTINGS.sfxVolume;
    if (typeof record.sfxVolume === 'number' && !Number.isNaN(record.sfxVolume)) {
      sfxVolume = Math.max(0, Math.min(1, record.sfxVolume));
    }

    let musicVolume = DEFAULT_SETTINGS.musicVolume;
    if (typeof record.musicVolume === 'number' && !Number.isNaN(record.musicVolume)) {
      musicVolume = Math.max(0, Math.min(1, record.musicVolume));
    }

    const musicEnabled =
      typeof record.musicEnabled === 'boolean'
        ? record.musicEnabled
        : DEFAULT_SETTINGS.musicEnabled;

    let sfxEnabled = DEFAULT_SETTINGS.sfxEnabled;
    const hasSfx = typeof record.sfxEnabled === 'boolean';
    const hasMuted = typeof record.muted === 'boolean';

    if (hasSfx) {
      sfxEnabled = record.sfxEnabled as boolean;
    } else if (hasMuted) {
      sfxEnabled = !(record.muted as boolean);
    }

    return {
      version: 2,
      sfxVolume,
      musicVolume,
      sfxEnabled,
      musicEnabled,
    };
  }

  // Corrupted / unknown schema version
  return DEFAULT_SETTINGS;
}

/**
 * Hand-written parser parsing string or null from storage via migrateToV2.
 */
export function parseSettings(raw: string | null): SettingsV2 {
  return migrateToV2(raw);
}

export type SettingsPatch = Partial<Omit<SettingsV2, 'version'>> & {
  readonly muted?: boolean;
};

export class SettingsStore {
  private currentSettings: SettingsV2;
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

  private loadFromStorage(): SettingsV2 {
    const raw = this.storage.getItem(this.storageKey);
    const parsed = migrateToV2(raw);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object' && obj.version === 1) {
          // Immediately persist migrated v2 to storage so migration happens once
          this.storage.setItem(this.storageKey, JSON.stringify(parsed));
        }
      } catch {
        // Ignored
      }
    }
    return parsed;
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

  getSettings = (): SettingsV2 => {
    return this.currentSettings;
  };

  get = this.getSettings;

  getState = (): SettingsState => {
    const available = this.storage.isAvailable;
    if (
      !this.cachedState ||
      this.cachedState.storageAvailable !== available ||
      this.cachedState.sfxVolume !== this.currentSettings.sfxVolume ||
      this.cachedState.musicVolume !== this.currentSettings.musicVolume ||
      this.cachedState.sfxEnabled !== this.currentSettings.sfxEnabled ||
      this.cachedState.musicEnabled !== this.currentSettings.musicEnabled
    ) {
      this.cachedState = {
        ...this.currentSettings,
        storageAvailable: available,
      };
    }
    return this.cachedState;
  };

  updateSettings = (patch: SettingsPatch): SettingsV2 => {
    let sfxVolume = this.currentSettings.sfxVolume;
    if (typeof patch.sfxVolume === 'number' && !Number.isNaN(patch.sfxVolume)) {
      sfxVolume = Math.max(0, Math.min(1, patch.sfxVolume));
    }

    let musicVolume = this.currentSettings.musicVolume;
    if (typeof patch.musicVolume === 'number' && !Number.isNaN(patch.musicVolume)) {
      musicVolume = Math.max(0, Math.min(1, patch.musicVolume));
    }

    let sfxEnabled = this.currentSettings.sfxEnabled;
    if (typeof patch.sfxEnabled === 'boolean') {
      sfxEnabled = patch.sfxEnabled;
    } else if (typeof patch.muted === 'boolean') {
      sfxEnabled = !patch.muted;
    }

    const musicEnabled =
      typeof patch.musicEnabled === 'boolean'
        ? patch.musicEnabled
        : this.currentSettings.musicEnabled;

    const updated: SettingsV2 = {
      version: 2,
      sfxVolume,
      musicVolume,
      sfxEnabled,
      musicEnabled,
    };

    this.currentSettings = updated;
    this.saveToStorage();
    this.notify();
    return this.currentSettings;
  };

  update = this.updateSettings;
  set = this.updateSettings;

  resetSettings = (): SettingsV2 => {
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
