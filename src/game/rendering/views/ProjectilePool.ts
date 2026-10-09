import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { RENDERER_CONFIG } from '@/shared/config/defaultConfig';
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

  spawn(from: Vector2, to: Vector2, travelMs?: number): void {
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
    proj.travelMs = travelMs ?? RENDERER_CONFIG.projectileTravelMs;
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

    // Aerodynamic elongated plasma laser: up to 48px length along flight vector
    const dx = proj.to.x - proj.from.x;
    const dy = proj.to.y - proj.from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const boltLen = Math.min(48, dist * progress);

    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;

    const tailX = currX - nx * boltLen;
    const tailY = currY - ny * boltLen;

    const g = proj.graphics;
    g.clear();

    // 1. Outer Warm Golden Energy Bloom (radiant plasma field)
    g.lineStyle(10, 0xff8800, 0.4);
    g.lineBetween(tailX, tailY, currX, currY);

    // 2. Focused Electric Amber Plasma Core (high energy beam)
    g.lineStyle(5.2, 0xffb84a, 0.92);
    g.lineBetween(tailX + nx * 2, tailY + ny * 2, currX, currY);

    // 3. Super-Hot Incandescent Laser Needle (pure white-hot center streak)
    g.lineStyle(2.0, 0xffffff, 1.0);
    g.lineBetween(
      tailX + nx * (boltLen * 0.15),
      tailY + ny * (boltLen * 0.15),
      currX,
      currY
    );

    // 4. Leading Plasma Sphere Head
    if (typeof g.fillStyle === 'function' && typeof g.fillCircle === 'function') {
      // Golden plasma corona
      g.fillStyle(0xffaa22, 0.85);
      g.fillCircle(currX, currY, 4.8);
      // Incandescent white plasma core
      g.fillStyle(0xffffff, 1.0);
      g.fillCircle(currX, currY, 2.5);
    }
  }

  get activeCount(): number {
    return this.pool.filter((p) => p.active).length;
  }

  clear(): void {
    for (const proj of this.pool) {
      proj.active = false;
      proj.elapsedMs = 0;
      proj.graphics.clear();
      proj.graphics.setVisible(false);
    }
  }

  destroy(): void {
    for (const proj of this.pool) {
      proj.graphics.destroy();
    }
    this.pool = [];
  }
}
