import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { RENDERER_CONFIG } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';
import { Vector2 } from '@/shared/domain';

interface PooledProjectile {
  active: boolean;
  from: Vector2;
  to: Vector2;
  elapsedMs: number;
  travelMs: number;
  graphics: Phaser.GameObjects.Graphics;
}

export class ProjectilePool {
  private pool: PooledProjectile[] = [];
  readonly cap: number;

  constructor(scene: Phaser.Scene, cap: number = RENDERER_CONFIG.projectileCap) {
    this.cap = cap;

    // Pre-allocate the pool of projectiles
    for (let i = 0; i < cap; i++) {
      const g = scene.add.graphics();
      g.setDepth(DEPTHS.PROJECTILES);
      g.setVisible(false);
      this.pool.push({
        active: false,
        from: { x: 0, y: 0 },
        to: { x: 0, y: 0 },
        elapsedMs: 0,
        travelMs: RENDERER_CONFIG.projectileTravelMs,
        graphics: g,
      });
    }
  }

  spawn(from: Vector2, to: Vector2): void {
    // 1. Find inactive projectile
    let proj = this.pool.find((p) => !p.active);

    // 2. If all active, reuse the oldest (the one with highest elapsedMs)
    if (!proj) {
      let oldest = this.pool[0]!;
      for (const p of this.pool) {
        if (p.elapsedMs > oldest.elapsedMs) {
          oldest = p;
        }
      }
      proj = oldest;
    }

    proj.active = true;
    proj.from = { x: from.x, y: from.y };
    proj.to = { x: to.x, y: to.y };
    proj.elapsedMs = 0;
    proj.travelMs = RENDERER_CONFIG.projectileTravelMs;
    proj.graphics.setVisible(true);

    this.renderProjectile(proj, 0);
  }

  update(deltaSeconds: number): void {
    const deltaMs = deltaSeconds * 1000;
    for (const proj of this.pool) {
      if (!proj.active) continue;

      proj.elapsedMs += deltaMs;
      const progress = Math.min(1, proj.elapsedMs / proj.travelMs);

      if (progress >= 1) {
        proj.active = false;
        proj.graphics.clear();
        proj.graphics.setVisible(false);
      } else {
        this.renderProjectile(proj, progress);
      }
    }
  }

  private renderProjectile(proj: PooledProjectile, progress: number): void {
    const currX = proj.from.x + (proj.to.x - proj.from.x) * progress;
    const currY = proj.from.y + (proj.to.y - proj.from.y) * progress;

    // Laser segment: 14px tail along trajectory
    const dx = proj.to.x - proj.from.x;
    const dy = proj.to.y - proj.from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const tailLen = Math.min(14, dist * progress);

    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;

    proj.graphics.clear();
    proj.graphics.lineStyle(3, THEME.phaserColors.bright, 1);
    proj.graphics.lineBetween(
      currX - nx * tailLen,
      currY - ny * tailLen,
      currX,
      currY
    );
  }

  get activeCount(): number {
    return this.pool.filter((p) => p.active).length;
  }

  destroy(): void {
    for (const proj of this.pool) {
      proj.graphics.destroy();
    }
    this.pool = [];
  }
}
