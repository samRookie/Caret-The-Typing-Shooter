import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Minimal canvas mock for JSDOM
HTMLCanvasElement.prototype.getContext = () => null;

vi.mock('phaser', () => {
  return {
    default: {
      AUTO: 'AUTO',
      Scale: {
        FIT: 'FIT',
        RESIZE: 'RESIZE',
        CENTER_BOTH: 'CENTER_BOTH',
      },
      BlendModes: {
        ADD: 'ADD',
      },
      Core: {
        Events: {
          READY: 'ready',
        },
      },
      Scenes: {
        Events: {
          SHUTDOWN: 'shutdown',
          DESTROY: 'destroy',
        },
      },
      Scene: class MockScene {},
      Game: class MockGame {
        events = {
          once: vi.fn((_event: string, callback: () => void) => {
            callback();
          }),
        };
        registry = {
          set: vi.fn(),
          get: vi.fn(),
        };
        destroy = vi.fn();
      },
    },
  };
});
