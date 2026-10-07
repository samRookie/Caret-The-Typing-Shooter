import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GameController,
  resolveSeed,
} from '@/game/controller/GameController';

describe('8.A GameController Unit Tests', () => {
  let mockWindow: Window;
  let mockDocument: Document;
  let mockLocation: { search: string };
  let mockDocState: { hidden: boolean };
  let windowListeners: Map<string, Array<() => void>>;
  let documentListeners: Map<string, Array<() => void>>;

  beforeEach(() => {
    windowListeners = new Map();
    documentListeners = new Map();
    mockLocation = { search: '' };
    mockDocState = { hidden: false };

    mockWindow = {
      location: mockLocation,
      crypto: {
        getRandomValues: vi.fn((buf: Uint32Array) => {
          buf[0] = 77777;
          return buf;
        }),
      },
      addEventListener: vi.fn((event: string, handler: () => void) => {
        const arr = windowListeners.get(event) ?? [];
        arr.push(handler);
        windowListeners.set(event, arr);
      }),
      removeEventListener: vi.fn((event: string, handler: () => void) => {
        const arr = windowListeners.get(event) ?? [];
        const idx = arr.indexOf(handler);
        if (idx !== -1) arr.splice(idx, 1);
        windowListeners.set(event, arr);
      }),
    } as unknown as Window;

    mockDocument = {
      get hidden() {
        return mockDocState.hidden;
      },
      addEventListener: vi.fn((event: string, handler: () => void) => {
        const arr = documentListeners.get(event) ?? [];
        arr.push(handler);
        documentListeners.set(event, arr);
      }),
      removeEventListener: vi.fn((event: string, handler: () => void) => {
        const arr = documentListeners.get(event) ?? [];
        const idx = arr.indexOf(handler);
        if (idx !== -1) arr.splice(idx, 1);
        documentListeners.set(event, arr);
      }),
    } as unknown as Document;
  });

  describe('Seed Resolution', () => {
    it('uses URL ?seed= if present', () => {
      mockLocation.search = '?seed=4242';
      const seed = resolveSeed(mockWindow);
      expect(seed).toBe(4242);
    });

    it('generates random uint32 from crypto.getRandomValues if no URL seed', () => {
      mockLocation.search = '';
      const seed = resolveSeed(mockWindow);
      expect(seed).toBe(77777);
      expect(mockWindow.crypto.getRandomValues).toHaveBeenCalled();
    });

    it('prioritizes explicit seed parameter', () => {
      mockLocation.search = '?seed=4242';
      const seed = resolveSeed(mockWindow, 9999);
      expect(seed).toBe(9999);
    });
  });

  describe('State Machine & Transitions', () => {
    it('initializes in loading screen and transitions to menu on boot complete', () => {
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });

      expect(controller.getState().screen).toBe('loading');
      expect(controller.getState().loadingProgress).toBe(0);

      controller.setLoadingProgress(50);
      expect(controller.getState().loadingProgress).toBe(50);

      controller.setBootComplete();
      expect(controller.getState().screen).toBe('menu');
      expect(controller.getState().loadingProgress).toBe(100);
      controller.destroy();
    });

    it('handles start, pause, resume, and quitToMenu correctly', () => {
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });

      controller.setBootComplete();
      expect(controller.getState().screen).toBe('menu');

      controller.start({ seed: 1337 });
      expect(controller.getState().screen).toBe('running');
      expect(controller.getState().seed).toBe(1337);
      expect(controller.runtime).not.toBeNull();

      controller.pause();
      expect(controller.getState().screen).toBe('paused');

      controller.resume();
      expect(controller.getState().screen).toBe('running');

      controller.quitToMenu();
      expect(controller.getState().screen).toBe('menu');
      expect(controller.getState().hud.score).toBe(0);
      controller.destroy();
    });

    it('ignores illegal transitions gracefully', () => {
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });
      controller.setBootComplete();

      // Illegal: cannot pause while in menu
      controller.pause();
      expect(controller.getState().screen).toBe('menu');

      // Illegal: cannot resume while in menu
      controller.resume();
      expect(controller.getState().screen).toBe('menu');

      controller.start();
      expect(controller.getState().screen).toBe('running');

      // Illegal: cannot resume while already running
      controller.resume();
      expect(controller.getState().screen).toBe('running');

      controller.destroy();
    });
  });

  describe('Visibility Safety & Window Blur', () => {
    it('pauses on document visibilitychange to hidden and NEVER auto-resumes on visible', () => {
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });
      controller.setBootComplete();
      controller.start();
      expect(controller.getState().screen).toBe('running');

      // Simulate document becoming hidden
      mockDocState.hidden = true;
      const visHandlers = documentListeners.get('visibilitychange') ?? [];
      for (const h of visHandlers) h();

      expect(controller.getState().screen).toBe('paused');

      // Simulate document becoming visible again -> must NOT auto-resume
      mockDocState.hidden = false;
      for (const h of visHandlers) h();

      expect(controller.getState().screen).toBe('paused');
      controller.destroy();
    });

    it('pauses on window blur and NEVER auto-resumes', () => {
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });
      controller.setBootComplete();
      controller.start();
      expect(controller.getState().screen).toBe('running');

      const blurHandlers = windowListeners.get('blur') ?? [];
      for (const h of blurHandlers) h();

      expect(controller.getState().screen).toBe('paused');
      controller.destroy();
    });

    it('resets stepper accumulator on pause to prevent time jump upon resume', () => {
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });
      controller.setBootComplete();
      controller.start();

      // Advance partial tick accumulator
      controller.runtime!.stepper.advance(0.01);
      expect(controller.runtime!.stepper.getAccumulator()).toBeGreaterThan(0);

      controller.pause();
      expect(controller.runtime!.stepper.getAccumulator()).toBe(0);
      controller.destroy();
    });
  });

  describe('HUD Throttling & Object Identity', () => {
    it('only changes state object reference and notifies listeners when emitted', () => {
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });
      controller.setBootComplete();
      controller.start();

      const state1 = controller.getState();
      const listenerSpy = vi.fn();
      controller.subscribe(listenerSpy);

      // Frame with delta 16ms (less than 100ms) and no events
      controller.frame(0.016);

      const state2 = controller.getState();
      // Identity MUST be identical because throttled
      expect(state2).toBe(state1);
      expect(listenerSpy).not.toHaveBeenCalled();

      // Cumulative delta exceeds 100ms (e.g. advance by 90ms more -> 106ms total)
      controller.frame(0.09);

      const state3 = controller.getState();
      // Identity MUST have changed
      expect(state3).not.toBe(state1);
      expect(listenerSpy).toHaveBeenCalledTimes(1);

      controller.destroy();
    });

    it('emits immediately without waiting for 100ms on gameplay events', () => {
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });
      controller.setBootComplete();
      controller.start({ seed: 1337 });

      const listenerSpy = vi.fn();
      controller.subscribe(listenerSpy);

      const stateBefore = controller.getState();

      // Find an enemy to hit
      // Wait for initial spawn
      for (let i = 0; i < 70; i++) {
        controller.frame(1 / 60);
      }

      listenerSpy.mockClear();

      const snapshot = controller.runtime!.getSnapshot();
      const firstEnemy = snapshot.enemies[0];
      expect(firstEnemy).toBeDefined();

      const char = firstEnemy!.word[0]!;
      // Push character command to inputQueue
      controller.runtime!.inputQueue.push({ type: 'char', char });

      // Run 1 frame (16.6ms) - gameplay event (TARGET_LOCKED, INPUT_MATCH) occurs
      controller.frame(1 / 60);

      // Should emit immediately despite delta < 100ms!
      expect(listenerSpy).toHaveBeenCalled();
      const stateAfter = controller.getState();
      expect(stateAfter).not.toBe(stateBefore);

      controller.destroy();
    });
  });

  describe('Restart Lifecycle', () => {
    it('creates a fresh runtime, clears scene views, and resets state', () => {
      const sceneClearSpy = vi.fn();
      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
        onSceneClear: sceneClearSpy,
      });
      controller.setBootComplete();
      controller.start({ seed: 1337 });

      const runtime1 = controller.runtime;
      expect(runtime1).not.toBeNull();

      // Run some frames
      for (let i = 0; i < 30; i++) {
        controller.frame(1 / 60);
      }
      expect(runtime1!.currentTick).toBeGreaterThan(0);

      // Restart
      controller.restart();

      expect(sceneClearSpy).toHaveBeenCalledTimes(1);
      const runtime2 = controller.runtime;
      expect(runtime2).not.toBeNull();
      expect(runtime2).not.toBe(runtime1);
      expect(runtime2!.currentTick).toBe(0);
      expect(controller.getState().screen).toBe('running');

      controller.destroy();
    });
  });

  describe('Cleanup on destroy()', () => {
    it('removes every listener it added on window and document', () => {
      const addWinSpy = vi.spyOn(mockWindow, 'addEventListener');
      const remWinSpy = vi.spyOn(mockWindow, 'removeEventListener');
      const addDocSpy = vi.spyOn(mockDocument, 'addEventListener');
      const remDocSpy = vi.spyOn(mockDocument, 'removeEventListener');

      const controller = new GameController({
        targetWindow: mockWindow,
        targetDocument: mockDocument,
      });

      // Window added: blur (controller) + keydown (KeyboardAdapter) + blur (KeyboardAdapter)
      // Doc added: visibilitychange (controller)
      const winAddedCount = addWinSpy.mock.calls.length;
      const docAddedCount = addDocSpy.mock.calls.length;
      expect(winAddedCount).toBeGreaterThan(0);
      expect(docAddedCount).toBeGreaterThan(0);

      controller.destroy();

      const winRemovedCount = remWinSpy.mock.calls.length;
      const docRemovedCount = remDocSpy.mock.calls.length;

      expect(winRemovedCount).toBe(winAddedCount);
      expect(docRemovedCount).toBe(docAddedCount);
    });
  });
});
