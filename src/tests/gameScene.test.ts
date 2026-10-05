import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameScene } from '@/game/scenes/GameScene';
import type { GameRuntime } from '@/game/controller';
import Phaser from 'phaser';

describe('GameScene Loop & Lifecycle (7.D)', () => {
  let scene: GameScene;
  let mockRegistry: Map<string, unknown>;
  let mockEvents: {
    once: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRegistry = new Map();
    mockEvents = {
      once: vi.fn(),
      off: vi.fn(),
    };

    scene = new GameScene();
    Object.assign(scene, {
      registry: {
        get: (key: string) => mockRegistry.get(key),
        set: (key: string, val: unknown) => mockRegistry.set(key, val),
      },
      events: mockEvents,
      add: {
        image: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          clearTint: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          x: 0,
          y: 0,
        })),
        graphics: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
          lineBetween: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
        container: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          add: vi.fn(),
          destroy: vi.fn(),
        })),
      },
      tweens: {
        add: vi.fn(() => ({ stop: vi.fn() })),
      },
    });
  });

  it('create() instantiates GameRenderer and registers shutdown listeners', () => {
    scene.create();
    expect(scene.getGameRenderer()).not.toBeNull();
    expect(mockEvents.once).toHaveBeenCalledWith(
      Phaser.Scenes.Events.SHUTDOWN,
      expect.any(Function),
      scene
    );
    expect(mockEvents.once).toHaveBeenCalledWith(
      Phaser.Scenes.Events.DESTROY,
      expect.any(Function),
      scene
    );
  });

  it('update() does nothing if no runtime is present in registry', () => {
    scene.create();
    const renderer = scene.getGameRenderer();
    const applySpy = vi.spyOn(renderer!, 'apply');

    scene.update(1000, 16.66);
    expect(applySpy).not.toHaveBeenCalled();
  });

  it('update() drives runtime.frame(delta / 1000) and renderer.apply(snapshot, events)', () => {
    scene.create();
    const mockRuntime = {
      frame: vi.fn().mockReturnValue({
        snapshot: { player: { position: { x: 640, y: 620 }, isDamaged: false }, enemies: [] },
        events: [],
      }),
    } as unknown as GameRuntime;

    mockRegistry.set('runtime', mockRuntime);

    const renderer = scene.getGameRenderer();
    const applySpy = vi.spyOn(renderer!, 'apply');

    scene.update(1000, 16.66);

    expect(mockRuntime.frame).toHaveBeenCalledWith(16.66 / 1000);
    expect(applySpy).toHaveBeenCalledWith(
      expect.objectContaining({ player: expect.any(Object) }),
      [],
      16.66 / 1000
    );
  });

  it('destroys renderer and unbinds listeners on shutdown', () => {
    scene.create();
    const renderer = scene.getGameRenderer();
    const destroySpy = vi.spyOn(renderer!, 'destroy');

    // Simulate shutdown
    (scene as unknown as { handleShutdown: () => void }).handleShutdown();

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(scene.getGameRenderer()).toBeNull();
    expect(mockEvents.off).toHaveBeenCalled();
  });
});
