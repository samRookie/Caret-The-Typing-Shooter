/**
 * ============================================================================
 * SAFE STORAGE HELPER (3.A)
 * ============================================================================
 *
 * Resilient wrapper around browser LocalStorage with memory fallback.
 * Guarantees:
 * - try/catch on every single read, write, and removal operation.
 * - In-memory Map fallback when LocalStorage is disabled, throws, or quota is exceeded.
 * - Never throws exceptions to calling code.
 * - Tracks availability status via `isAvailable`.
 * ============================================================================
 */

export class SafeStorage {
  private memoryMap = new Map<string, string>();
  private readonly storageBackend: Storage | null;

  constructor(customStorage?: Storage | null) {
    if (customStorage !== undefined) {
      this.storageBackend = customStorage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storageBackend = window.localStorage;
    } else {
      this.storageBackend = null;
    }
  }

  /**
   * Evaluates if the underlying Web Storage backend is functional and writable.
   */
  get isAvailable(): boolean {
    if (!this.storageBackend) {
      return false;
    }
    try {
      const testKey = '__safe_storage_probe__';
      this.storageBackend.setItem(testKey, '1');
      this.storageBackend.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves a string value by key. Falls back to memory cache if storage fails.
   */
  getItem(key: string): string | null {
    if (this.storageBackend) {
      try {
        const value = this.storageBackend.getItem(key);
        if (value !== null) {
          return value;
        }
      } catch {
        // Storage access blocked or threw; fall back to memory
      }
    }
    return this.memoryMap.get(key) ?? null;
  }

  /**
   * Stores a string value by key. Mirrors to in-memory map and attempts storage write.
   * Never throws; returns boolean indicating whether persistent storage succeeded.
   */
  setItem(key: string, value: string): boolean {
    this.memoryMap.set(key, value);

    if (!this.storageBackend) {
      return false;
    }

    try {
      this.storageBackend.setItem(key, value);
      return true;
    } catch {
      // Quota exceeded or storage disabled; retained in memory map
      return false;
    }
  }

  /**
   * Removes a stored entry by key across persistent storage and memory map.
   */
  removeItem(key: string): boolean {
    this.memoryMap.delete(key);

    if (!this.storageBackend) {
      return true;
    }

    try {
      this.storageBackend.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clears all stored items in memory and persistent storage.
   */
  clear(): void {
    this.memoryMap.clear();

    if (this.storageBackend) {
      try {
        this.storageBackend.clear();
      } catch {
        // Storage clear blocked; memory already cleared
      }
    }
  }

  // Convenient aliases
  get(key: string): string | null {
    return this.getItem(key);
  }

  set(key: string, value: string): boolean {
    return this.setItem(key, value);
  }

  remove(key: string): boolean {
    return this.removeItem(key);
  }
}

/** Global default singleton instance */
export const safeStorage = new SafeStorage();
