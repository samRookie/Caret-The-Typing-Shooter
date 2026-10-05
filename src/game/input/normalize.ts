import { GameCommand } from '@/shared/domain';

/**
 * Normalized key event snapshot matching the standard KeyboardEvent fields.
 */
export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  repeat: boolean;
  isComposing: boolean;
}

/**
 * Normalized input intent produced by key evaluation.
 */
export type InputIntent =
  | { kind: 'command'; command: GameCommand }
  | { kind: 'ui'; action: 'pause-toggle' }
  | { kind: 'ignore' };

/**
 * Options influencing key normalization.
 */
export interface NormalizeKeyOptions {
  gameActive: boolean;
}

/**
 * Single exported constant holding allowed gameplay characters (Rule 6.A / D7).
 * Phase 2 can extend this string without modifying core normalization logic.
 */
export const ALLOWED_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz';
export const ALLOWED_CHAR_SET: ReadonlySet<string> = new Set(ALLOWED_CHARACTERS);

const IME_OR_DEAD_KEYS: ReadonlySet<string> = new Set(['Process', 'Dead', 'Unidentified']);

/**
 * Pure normalization converting raw browser keyboard events into GameCommand
 * or UI intents without touching browser DOM APIs.
 *
 * Rules:
 * 1. e.repeat -> ignore (holding key does not fire repeated characters).
 * 2. isComposing or key in {"Process", "Dead", "Unidentified"} -> ignore.
 * 3. Any ctrlKey/metaKey/altKey -> ignore and never preventDefault (browser shortcuts intact).
 * 4. Single letter a-z/A-Z -> {type: "char", char: lowercase}. Shift or Caps Lock never matter.
 * 5. Tab (with or without Shift) -> release-target; preventDefault only while gameActive.
 * 6. Escape -> UI intent pause-toggle.
 * 7. " " and Backspace -> ignore, but preventDefault while gameActive.
 * 8. Everything else -> ignore, no preventDefault.
 * 9. When gameActive is false, no command intents are produced (only pause-toggle passes).
 */
export function normalizeKey(
  e: KeyLike,
  opts: NormalizeKeyOptions
): { intent: InputIntent; preventDefault: boolean } {
  // Rule 3: Any ctrlKey/metaKey/altKey -> ignore and NEVER preventDefault
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return {
      intent: { kind: 'ignore' },
      preventDefault: false,
    };
  }

  // Rule 2: IME composing or dead keys -> ignore, never preventDefault
  if (e.isComposing || IME_OR_DEAD_KEYS.has(e.key)) {
    return {
      intent: { kind: 'ignore' },
      preventDefault: false,
    };
  }

  // Rule 1: Auto-repeat -> ignore (holding key must not fire repeated characters or UI toggles)
  // For Space, Backspace, and Tab while gameActive, keep preventDefault true so holding doesn't scroll/navigate/tab
  if (e.repeat) {
    return {
      intent: { kind: 'ignore' },
      preventDefault: opts.gameActive && (e.key === ' ' || e.key === 'Backspace' || e.key === 'Tab'),
    };
  }

  // Rule 6: Escape -> UI intent pause-toggle (passes whether gameActive is true or false per Rule 9)
  if (e.key === 'Escape') {
    return {
      intent: { kind: 'ui', action: 'pause-toggle' },
      preventDefault: false,
    };
  }

  // Rule 7: Space and Backspace -> ignore, but preventDefault while gameActive
  if (e.key === ' ' || e.key === 'Backspace') {
    return {
      intent: { kind: 'ignore' },
      preventDefault: opts.gameActive,
    };
  }

  // Rule 5: Tab (with or without Shift) -> release-target; preventDefault only while gameActive
  if (e.key === 'Tab') {
    if (opts.gameActive) {
      return {
        intent: { kind: 'command', command: { type: 'release-target' } },
        preventDefault: true,
      };
    }
    return {
      intent: { kind: 'ignore' },
      preventDefault: false,
    };
  }

  // Rule 4: Single letter a-z / A-Z -> lowercase char command
  if (e.key.length === 1) {
    const lower = e.key.toLowerCase();
    if (ALLOWED_CHAR_SET.has(lower)) {
      if (opts.gameActive) {
        return {
          intent: { kind: 'command', command: { type: 'char', char: lower } },
          preventDefault: false,
        };
      }
      // Rule 9: When gameActive is false, no command intents are produced
      return {
        intent: { kind: 'ignore' },
        preventDefault: false,
      };
    }
  }

  // Rule 8: Everything else -> ignore, no preventDefault
  return {
    intent: { kind: 'ignore' },
    preventDefault: false,
  };
}
