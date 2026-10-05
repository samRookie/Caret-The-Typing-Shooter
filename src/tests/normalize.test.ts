import { describe, it, expect } from 'vitest';
import {
  normalizeKey,
  KeyLike,
  InputIntent,
  ALLOWED_CHARACTERS,
  ALLOWED_CHAR_SET,
} from '@/game/input/normalize';

describe('Key Normalization Pure Function (6.A)', () => {
  it('exports ALLOWED_CHARACTERS and ALLOWED_CHAR_SET containing exactly a-z', () => {
    expect(ALLOWED_CHARACTERS).toBe('abcdefghijklmnopqrstuvwxyz');
    expect(ALLOWED_CHAR_SET.size).toBe(26);
    expect(ALLOWED_CHAR_SET.has('a')).toBe(true);
    expect(ALLOWED_CHAR_SET.has('z')).toBe(true);
    expect(ALLOWED_CHAR_SET.has('1')).toBe(false);
  });

  interface TestCase {
    name: string;
    input: KeyLike;
    opts: { gameActive: boolean };
    expected: {
      intent: InputIntent;
      preventDefault: boolean;
    };
  }

  const baseKey: KeyLike = {
    key: '',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
  };

  const testCases: TestCase[] = [
    // 1-4: Lowercase letters (gameActive: true)
    {
      name: 'lowercase letter a',
      input: { ...baseKey, key: 'a' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'char', char: 'a' } }, preventDefault: false },
    },
    {
      name: 'lowercase letter m',
      input: { ...baseKey, key: 'm' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'char', char: 'm' } }, preventDefault: false },
    },
    {
      name: 'lowercase letter z',
      input: { ...baseKey, key: 'z' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'char', char: 'z' } }, preventDefault: false },
    },

    // 5-7: Uppercase letters with Shift (gameActive: true)
    {
      name: 'uppercase letter A with shiftKey',
      input: { ...baseKey, key: 'A', shiftKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'char', char: 'a' } }, preventDefault: false },
    },
    {
      name: 'uppercase letter Z with shiftKey',
      input: { ...baseKey, key: 'Z', shiftKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'char', char: 'z' } }, preventDefault: false },
    },

    // 8-9: Uppercase letters with Caps Lock (shiftKey: false)
    {
      name: 'uppercase letter B with Caps Lock (shiftKey false)',
      input: { ...baseKey, key: 'B', shiftKey: false },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'char', char: 'b' } }, preventDefault: false },
    },
    {
      name: 'uppercase letter Q with Caps Lock (shiftKey false)',
      input: { ...baseKey, key: 'Q', shiftKey: false },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'char', char: 'q' } }, preventDefault: false },
    },

    // 10-12: Auto-repeat (repeat: true)
    {
      name: 'repeated letter keydown (e.repeat true) ignored',
      input: { ...baseKey, key: 'a', repeat: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'repeated uppercase letter keydown ignored',
      input: { ...baseKey, key: 'K', shiftKey: true, repeat: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'repeated Escape keydown ignored',
      input: { ...baseKey, key: 'Escape', repeat: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 13-17: Modifiers (ctrlKey, metaKey, altKey, AltGr) -> ignore and NEVER preventDefault
    {
      name: 'Ctrl+R shortcut never preventDefault-ed',
      input: { ...baseKey, key: 'r', ctrlKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Cmd+R shortcut (metaKey) never preventDefault-ed',
      input: { ...baseKey, key: 'r', metaKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Ctrl+C shortcut never preventDefault-ed',
      input: { ...baseKey, key: 'c', ctrlKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Alt+A combination ignored and never preventDefault-ed',
      input: { ...baseKey, key: 'a', altKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'AltGr combination (ctrlKey + altKey) ignored and never preventDefault-ed',
      input: { ...baseKey, key: 'e', ctrlKey: true, altKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 18-21: IME and dead keys
    {
      name: 'IME composing (isComposing: true) ignored',
      input: { ...baseKey, key: 'a', isComposing: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'IME key Process ignored',
      input: { ...baseKey, key: 'Process' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Dead key ignored',
      input: { ...baseKey, key: 'Dead' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Unidentified key ignored',
      input: { ...baseKey, key: 'Unidentified' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 22-24: Tab and Shift+Tab
    {
      name: 'Tab while gameActive produces release-target with preventDefault: true',
      input: { ...baseKey, key: 'Tab' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'release-target' } }, preventDefault: true },
    },
    {
      name: 'Shift+Tab while gameActive produces release-target with preventDefault: true',
      input: { ...baseKey, key: 'Tab', shiftKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'command', command: { type: 'release-target' } }, preventDefault: true },
    },
    {
      name: 'Tab while gameActive: false ignored and preventDefault: false',
      input: { ...baseKey, key: 'Tab' },
      opts: { gameActive: false },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 25-26: Escape (UI intent pause-toggle)
    {
      name: 'Escape while gameActive: true produces pause-toggle',
      input: { ...baseKey, key: 'Escape' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ui', action: 'pause-toggle' }, preventDefault: false },
    },
    {
      name: 'Escape while gameActive: false produces pause-toggle',
      input: { ...baseKey, key: 'Escape' },
      opts: { gameActive: false },
      expected: { intent: { kind: 'ui', action: 'pause-toggle' }, preventDefault: false },
    },

    // 27-30: Space and Backspace
    {
      name: 'Space while gameActive: true is ignored with preventDefault: true',
      input: { ...baseKey, key: ' ' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: true },
    },
    {
      name: 'Space while gameActive: false is ignored with preventDefault: false',
      input: { ...baseKey, key: ' ' },
      opts: { gameActive: false },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Backspace while gameActive: true is ignored with preventDefault: true',
      input: { ...baseKey, key: 'Backspace' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: true },
    },
    {
      name: 'Backspace while gameActive: false is ignored with preventDefault: false',
      input: { ...baseKey, key: 'Backspace' },
      opts: { gameActive: false },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 31-33: Digits (out of scope for Step 6 / D7)
    {
      name: 'Digit 0 ignored without preventDefault',
      input: { ...baseKey, key: '0' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Digit 5 ignored without preventDefault',
      input: { ...baseKey, key: '5' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Digit 9 ignored without preventDefault',
      input: { ...baseKey, key: '9' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 34-36: Punctuation
    {
      name: 'Punctuation period . ignored without preventDefault',
      input: { ...baseKey, key: '.' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Punctuation semicolon ; ignored without preventDefault',
      input: { ...baseKey, key: ';' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Punctuation slash / ignored without preventDefault',
      input: { ...baseKey, key: '/' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 37-40: Arrow keys
    {
      name: 'ArrowUp ignored without preventDefault',
      input: { ...baseKey, key: 'ArrowUp' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'ArrowDown ignored without preventDefault',
      input: { ...baseKey, key: 'ArrowDown' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'ArrowLeft ignored without preventDefault',
      input: { ...baseKey, key: 'ArrowLeft' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'ArrowRight ignored without preventDefault',
      input: { ...baseKey, key: 'ArrowRight' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 41-43: Function keys (e.g. F5 browser refresh must never be preventDefault-ed)
    {
      name: 'F5 browser reload shortcut ignored and never preventDefault-ed',
      input: { ...baseKey, key: 'F5' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'F11 fullscreen shortcut ignored and never preventDefault-ed',
      input: { ...baseKey, key: 'F11' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'F12 dev tools shortcut ignored and never preventDefault-ed',
      input: { ...baseKey, key: 'F12' },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 44-46: gameActive: false suppresses all gameplay commands
    {
      name: 'letter a while gameActive: false produces ignore',
      input: { ...baseKey, key: 'a' },
      opts: { gameActive: false },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'letter Z with Shift while gameActive: false produces ignore',
      input: { ...baseKey, key: 'Z', shiftKey: true },
      opts: { gameActive: false },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },
    {
      name: 'Shift key alone produces ignore',
      input: { ...baseKey, key: 'Shift', shiftKey: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: false },
    },

    // 47-49: Space and Tab holding repeats while gameActive
    {
      name: 'Space repeat while gameActive: true stays preventDefault: true',
      input: { ...baseKey, key: ' ', repeat: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: true },
    },
    {
      name: 'Backspace repeat while gameActive: true stays preventDefault: true',
      input: { ...baseKey, key: 'Backspace', repeat: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: true },
    },
    {
      name: 'Tab repeat while gameActive: true stays preventDefault: true',
      input: { ...baseKey, key: 'Tab', repeat: true },
      opts: { gameActive: true },
      expected: { intent: { kind: 'ignore' }, preventDefault: true },
    },
  ];

  it('contains at least 30 table-driven test cases', () => {
    expect(testCases.length).toBeGreaterThanOrEqual(30);
  });

  testCases.forEach(({ name, input, opts, expected }) => {
    it(`correctly normalizes: ${name}`, () => {
      const result = normalizeKey(input, opts);
      expect(result).toEqual(expected);
    });
  });

  it('explicitly verifies browser shortcuts are never preventDefault-ed', () => {
    const shortcuts = [
      { key: 'r', ctrlKey: true },
      { key: 'r', metaKey: true },
      { key: 'c', ctrlKey: true },
      { key: 'F5' },
      { key: 'F12' },
      { key: 'w', ctrlKey: true },
      { key: 't', ctrlKey: true },
    ];

    for (const sc of shortcuts) {
      const result = normalizeKey({ ...baseKey, ...sc }, { gameActive: true });
      expect(result.preventDefault).toBe(false);
      expect(result.intent.kind).toBe('ignore');
    }
  });

  it('guarantees no command intents are produced when gameActive is false', () => {
    const candidateKeys = ['a', 'b', 'z', 'A', 'Z', 'Tab'];
    for (const key of candidateKeys) {
      const result = normalizeKey({ ...baseKey, key }, { gameActive: false });
      expect(result.intent.kind).not.toBe('command');
    }
  });
});
