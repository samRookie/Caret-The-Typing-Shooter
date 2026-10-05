import { describe, it, expect, vi } from 'vitest';
import { GhostPool } from '@/game/rendering/views/GhostPool';
import { ProjectilePool } from '@/game/rendering/views/ProjectilePool';
import { DEPTHS } from '@/game/rendering/depths';
import Phaser from 'phaser';

function createMockScene(): Phaser.Scene {
  const mockScene = {
    add: {
      image: vi.fn(() => ({
        setDepth: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setTint: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      })),
      graphics: vi.fn(() => ({
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        lineBetween: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      })),
    },
    tweens: {
      add: vi.fn(() => ({
        stop: vi.fn(),
      })),
    },
  } as unknown as Phaser.Scene;

  return mockScene;
}

describe('Pools & Depths Constraints (7.C)', () => {
  describe('Depths Configuration', () => {
    it('strictly satisfies depth layering hierarchy and bounds', () => {
      expect(DEPTHS.BACKGROUND_GRID).toBe(0);
      expect(DEPTHS.BACKGROUND_STARS).toBe(1);
      expect(DEPTHS.PLAYER).toBe(10);
      expect(DEPTHS.ENEMIES).toBe(10);
      expect(DEPTHS.PROJECTILES).toBe(12);
      expect(DEPTHS.GHOSTS).toBe(14);
      expect(DEPTHS.EFFECTS_MIN).toBe(15);
      expect(DEPTHS.EFFECTS_MAX).toBe(19);
      expect(DEPTHS.RETICLE).toBe(20);
      expect(DEPTHS.LABELS).toBe(25);

      // Spec rule: Nothing except labels (depth 25) may be >= 25
      const entries = Object.entries(DEPTHS);
      for (const [key, depth] of entries) {
        if (key !== 'LABELS') {
          expect(depth).toBeLessThan(25);
        }
      }
    });
  });

  describe('GhostPool', () => {
    it('enforces hard cap of 20 active ghosts and drops oldest when exceeded', () => {
      const scene = createMockScene();
      const pool = new GhostPool(scene, 20);

      expect(pool.count).toBe(0);

      // Spawn 20 ghosts
      for (let i = 0; i < 20; i++) {
        pool.spawn(100 + i, 200 + i);
      }
      expect(pool.count).toBe(20);

      // Spawn 5 additional ghosts -> cap must remain exactly 20
      for (let i = 0; i < 5; i++) {
        pool.spawn(300 + i, 400 + i);
        expect(pool.count).toBe(20);
      }

      // Cleanup
      pool.destroy();
      expect(pool.count).toBe(0);
    });
  });

  describe('ProjectilePool', () => {
    it('pools up to 12 projectiles and reuses oldest when cap is saturated', () => {
      const scene = createMockScene();
      const pool = new ProjectilePool(scene, 12);

      expect(pool.activeCount).toBe(0);

      // Spawn 12 projectiles
      for (let i = 0; i < 12; i++) {
        pool.spawn({ x: 640, y: 620 }, { x: 100 + i * 20, y: 100 });
      }
      expect(pool.activeCount).toBe(12);

      // Advance by 0.02s (20ms) so projectiles have different elapsed times
      pool.update(0.02);

      // Spawning a 13th projectile reuses the oldest without exceeding 12
      pool.spawn({ x: 640, y: 620 }, { x: 500, y: 100 });
      expect(pool.activeCount).toBe(12);

      // Advance by 0.1s (100ms > 90ms travel time) -> all should complete and deactivate
      pool.update(0.1);
      expect(pool.activeCount).toBe(0);

      // Cleanup
      pool.destroy();
      expect(pool.activeCount).toBe(0);
    });
  });
});
