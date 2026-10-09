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

export interface SettingsV1 {
  readonly version: 1;
  readonly sfxEnabled: boolean;
  readonly musicEnabled: boolean;
  readonly reducedMotion: ReducedMotionPreference;
}

export const DEFAULT_SETTINGS: SettingsV1 = {
  version: 1,
  sfxEnabled: true,
  musicEnabled: true,
  reducedMotion: 'system',
};

/**
 * Hand-written parser with strict per-field validation.
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

  const sfxEnabled =
    typeof obj.sfxEnabled === 'boolean' ? obj.sfxEnabled : DEFAULT_SETTINGS.sfxEnabled;

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

  return {
    version: 1,
    sfxEnabled,
    musicEnabled,
    reducedMotion,
  };
}

export class SettingsStore {
  private currentSettings: SettingsV1;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: SafeStorage = safeStorage,
    private readonly storageKey: string = SETTINGS_STORAGE_KEY
  ) {
    this.currentSettings = this.loadFromStorage();
  }

  private loadFromStorage(): SettingsV1 {
    const raw = this.storage.getItem(this.storageKey);
    return parseSettings(raw);
  }

  private saveToStorage(): void {
    this.storage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
  }

  private notify(): void {
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

  updateSettings = (patch: Partial<Omit<SettingsV1, 'version'>>): SettingsV1 => {
    const updated: SettingsV1 = {
      version: 1,
      sfxEnabled:
        typeof patch.sfxEnabled === 'boolean'
          ? patch.sfxEnabled
          : this.currentSettings.sfxEnabled,
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
    };

    this.currentSettings = updated;
    this.saveToStorage();
    this.notify();
    return this.currentSettings;
  };

  set = this.updateSettings;

  resetSettings = (): SettingsV1 => {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.saveToStorage();
    this.notify();
    return this.currentSettings;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const settingsStore = new SettingsStore();

export function useSettings(): SettingsV1 {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.getSettings);
}
