import { describe, it, expect, vi } from 'vitest';
import { EnemyView } from '@/game/rendering/views/EnemyView';
import { EnemyState } from '@/shared/domain';
import Phaser from 'phaser';

describe('EnemyView (7.C)', () => {
  it('creates Text objects once upon construction and NEVER creates Text during idle position updates', () => {
    let textCreationCount = 0;

    const mockScene = {
      add: {
        image: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          x: 100,
          y: 50,
        })),
        text: vi.fn(() => {
          textCreationCount++;
          return {
            setOrigin: vi.fn().mockReturnThis(),
            setColor: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
          };
        }),
        container: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          add: vi.fn(),
          destroy: vi.fn(),
        })),
        graphics: vi.fn(() => ({
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          lineBetween: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
      },
    } as unknown as Phaser.Scene;

    const enemy: EnemyState = {
      id: 'enemy-1',
      type: 'drone',
      word: 'COMBAT',
      remainingWord: 'COMBAT',
      position: { x: 100, y: 50 },
      velocity: { x: 0, y: 1 },
      health: 6,
      maxHealth: 6,
      alive: true,
      spawnTick: 0,
    };

    // Construct view: 6 characters in "COMBAT" -> creates exactly 6 Text objects
    const view = new EnemyView(mockScene, enemy, false);
    expect(textCreationCount).toBe(6);

    // Simulate 120 idle frames (2 seconds at 60Hz) where enemy moves down but remainingWord is unchanged
    for (let frame = 1; frame <= 120; frame++) {
      const movedEnemy = {
        ...enemy,
        position: { x: 100, y: 50 + frame },
      };
      view.update(movedEnemy, false);
    }

    // CRITICAL ACCEPTANCE CHECK: Zero text objects created during idle frames
    expect(textCreationCount).toBe(6);

    // Destroy view
    view.destroy();
  });
});
