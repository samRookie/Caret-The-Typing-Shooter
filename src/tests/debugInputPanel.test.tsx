import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { devIntentLog, DevIntentLog } from '@/game/input/devIntentLog';
import { DebugInputPanel } from '@/ui/components/DebugInputPanel';

describe('DevIntentLog & DebugInputPanel (6.D)', () => {
  beforeEach(() => {
    devIntentLog.clear();
  });

  describe('DevIntentLog ring buffer', () => {
    it('records entries and caps buffer size at capacity 10', () => {
      const log = new DevIntentLog(10);
      expect(log.getEntries().length).toBe(0);

      for (let i = 0; i < 15; i++) {
        log.record(
          String.fromCharCode(97 + i),
          { kind: 'command', command: { type: 'char', char: String.fromCharCode(97 + i) } },
          false
        );
      }

      const entries = log.getEntries();
      expect(entries.length).toBe(10);
      // First entry should be index (15 - 10) = 5 ('f')
      expect(entries[0]?.key).toBe('f');
      expect(entries[9]?.key).toBe('o');
    });

    it('notifies subscribers when recording or clearing', () => {
      const log = new DevIntentLog(10);
      let callCount = 0;
      const unsubscribe = log.subscribe(() => {
        callCount++;
      });

      log.record('a', { kind: 'command', command: { type: 'char', char: 'a' } }, false);
      expect(callCount).toBe(1);

      log.clear();
      expect(callCount).toBe(2);

      unsubscribe();
      log.record('b', { kind: 'command', command: { type: 'char', char: 'b' } }, false);
      expect(callCount).toBe(2);
    });
  });

  describe('DebugInputPanel React Component', () => {
    it('renders empty placeholder initially and header details', () => {
      render(<DebugInputPanel />);

      expect(screen.getByText(/NORMALIZED INTENT MONITOR/i)).toBeInTheDocument();
      expect(screen.getByText(/LAST 10 INTENTS/i)).toBeInTheDocument();
      expect(screen.getByText(/Waiting for keystrokes/i)).toBeInTheDocument();
    });

    it('renders recorded normalized intents and preventDefault badges', () => {
      render(<DebugInputPanel />);

      act(() => {
        devIntentLog.record('a', { kind: 'command', command: { type: 'char', char: 'a' } }, false);
        devIntentLog.record('Tab', { kind: 'command', command: { type: 'release-target' } }, true);
        devIntentLog.record('Escape', { kind: 'ui', action: 'pause-toggle' }, false);
      });

      expect(screen.getByText(/\[a\]/i)).toBeInTheDocument();
      expect(screen.getByText(/char\('a'\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\[Tab\]/i)).toBeInTheDocument();
      expect(screen.getByText(/release-target/i)).toBeInTheDocument();
      expect(screen.getByText(/\[Escape\]/i)).toBeInTheDocument();
      expect(screen.getByText(/pause-toggle/i)).toBeInTheDocument();

      const preventBadges = screen.getAllByText('PREVENT');
      expect(preventBadges.length).toBeGreaterThan(0);
    });

    it('toggles active state and clears entries when clear is clicked', () => {
      render(<DebugInputPanel />);

      act(() => {
        devIntentLog.record('x', { kind: 'command', command: { type: 'char', char: 'x' } }, false);
      });
      expect(screen.getByText(/\[x\]/i)).toBeInTheDocument();

      const clearBtn = screen.getByTestId('clear-debug-log');
      fireEvent.click(clearBtn);

      expect(screen.getByText(/Waiting for keystrokes/i)).toBeInTheDocument();

      const toggleBtn = screen.getByTestId('toggle-game-active');
      expect(toggleBtn).toHaveTextContent(/ACTIVE: YES/i);
      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent(/ACTIVE: NO/i);
    });
  });
});
