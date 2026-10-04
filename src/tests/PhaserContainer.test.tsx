import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PhaserContainer } from '@/ui/PhaserContainer';
import Phaser from 'phaser';

describe('PhaserContainer StrictMode Lifecycle', () => {
  let createdInstances: Array<{ destroy: ReturnType<typeof vi.fn> }> = [];
  let originalGame: typeof Phaser.Game;

  beforeEach(() => {
    createdInstances = [];
    originalGame = Phaser.Game;

    // Spy implementation of Phaser.Game
    Phaser.Game = class SpiedGame {
      events = {
        once: vi.fn((_event: string, callback: () => void) => {
          callback();
        }),
      };
      destroy = vi.fn();
      constructor() {
        createdInstances.push(this);
      }
    } as unknown as typeof Phaser.Game;
  });

  afterEach(() => {
    Phaser.Game = originalGame;
  });

  it('in React.StrictMode: the game is created twice and destroyed once, ending with one live instance', () => {
    const handleReady = vi.fn();

    const { unmount } = render(
      <React.StrictMode>
        <PhaserContainer onGameReady={handleReady} />
      </React.StrictMode>
    );

    // In React 18 StrictMode: mount -> cleanup -> mount
    // Total created instances should be 2
    expect(createdInstances.length).toBe(2);

    // First instance was destroyed by StrictMode cleanup
    const firstInstance = createdInstances[0];
    const secondInstance = createdInstances[1];
    expect(firstInstance).toBeDefined();
    expect(secondInstance).toBeDefined();

    expect(firstInstance?.destroy).toHaveBeenCalledTimes(1);
    expect(secondInstance?.destroy).toHaveBeenCalledTimes(0);

    // When the component is finally unmounted, the remaining live instance is destroyed
    unmount();
    expect(secondInstance?.destroy).toHaveBeenCalledTimes(1);
  });
});
