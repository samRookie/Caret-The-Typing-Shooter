import Phaser from 'phaser';
import { Vector2 } from '@/shared/domain';
import { DEPTHS } from '../depths';
import { EffectBackend, EffectCounts } from './EffectBackend';
import { ProjectilePool } from '../views/ProjectilePool';
import { GhostPool } from '../views/GhostPool';
import { PlayerView } from '../views/PlayerView';
import { EnemyView } from '../views/EnemyView';
import { THEME } from '@/shared/theme';

export interface PhaserBackendContext {
  readonly scene: Phaser.Scene;
  readonly projectilePool: ProjectilePool;
  readonly ghostPool: GhostPool;
  readonly playerView?: PlayerView;
  readonly getEnemyView?: (id: string) => EnemyView | undefined;
}

export class PhaserEffectBackend implements EffectBackend {
  private scene: Phaser.Scene;
  private projectilePool: ProjectilePool;
  private ghostPool: GhostPool;
  private playerView?: PlayerView;
  private getEnemyView?: (id: string) => EnemyView | undefined;

  // Reusable Particle Emitter Families
  private sparkEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private burstEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Active ring graphics tracking
  private activeRings: Phaser.GameObjects.Graphics[] = [];

  // Edge flash overlay
  private edgeFlashGraphics?: Phaser.GameObjects.Graphics;
  private edgeFlashTween?: Phaser.Tweens.Tween;

  // Metrics tracking
  private liveParticleCount: number = 0;
  private shakeCount: number = 0;
  private edgeFlashCount: number = 0;

  constructor(ctx: PhaserBackendContext) {
    this.scene = ctx.scene;
    this.projectilePool = ctx.projectilePool;
    this.ghostPool = ctx.ghostPool;
    this.playerView = ctx.playerView;
    this.getEnemyView = ctx.getEnemyView;

    this.initParticleTextures();
    this.initEmitters();
    this.initEdgeFlash();
  }

  private initParticleTextures(): void {
    if (!this.scene.textures.exists('particle-spark')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xfff0c2, 1);
      g.fillCircle(4, 4, 3);
      g.generateTexture('particle-spark', 8, 8);
      g.destroy();
    }

    if (!this.scene.textures.exists('particle-burst')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffb84a, 1);
      g.fillCircle(6, 6, 5);
      g.generateTexture('particle-burst', 12, 12);
      g.destroy();
    }
  }

  private initEmitters(): void {
    // 1. Sparks emitter family (hit sparks, subtle debris)
    this.sparkEmitter = this.scene.add.particles(0, 0, 'particle-spark', {
      emitting: false,
      lifespan: { min: 100, max: 250 },
      speed: { min: 40, max: 100 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
    });
    this.sparkEmitter.setDepth(DEPTHS.EFFECTS_MIN);

    // 2. Burst emitter family (drone destruction, ship collision, game over)
    this.burstEmitter = this.scene.add.particles(0, 0, 'particle-burst', {
      emitting: false,
      lifespan: { min: 250, max: 500 },
      speed: { min: 60, max: 160 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
    });
    this.burstEmitter.setDepth(DEPTHS.EFFECTS_MAX);
  }

  private initEdgeFlash(): void {
    const w = this.scene.cameras.main.width || 1280;
    const h = this.scene.cameras.main.height || 720;

    this.edgeFlashGraphics = this.scene.add.graphics();
    this.edgeFlashGraphics.setDepth(DEPTHS.EDGE_FLASH);
    this.edgeFlashGraphics.setAlpha(0);

    // Thin 4px tactical border overlay
    this.edgeFlashGraphics.lineStyle(4, THEME.phaserColors.danger, 1);
    this.edgeFlashGraphics.strokeRect(2, 2, w - 4, h - 4);
  }

  spawnRing(at: Vector2, fromRadius: number, toRadius: number, ms: number): void {
    const g = this.scene.add.graphics();
    g.setDepth(DEPTHS.EFFECTS_MID);
    this.activeRings.push(g);

    const isStatic = Math.abs(fromRadius - toRadius) < 0.1;
    const targetObj = { radius: fromRadius, alpha: 0.85 };

    this.scene.tweens.add({
      targets: targetObj,
      radius: toRadius,
      alpha: 0,
      duration: ms,
      ease: isStatic ? 'Linear' : 'Cubic.easeOut',
      onUpdate: () => {
        g.clear();
        g.lineStyle(2, THEME.phaserColors.accent, targetObj.alpha);
        g.strokeCircle(at.x, at.y, targetObj.radius);
      },
      onComplete: () => {
        g.destroy();
        this.activeRings = this.activeRings.filter((ring) => ring !== g);
      },
    });
  }

  spawnBurst(
    at: Vector2,
    count: number,
    speed: readonly [number, number],
    lifeMs: number,
    _priority: 'normal' | 'high'
  ): void {
    const emitter = count <= 4 ? this.sparkEmitter : this.burstEmitter;
    if (!emitter) return;

    this.liveParticleCount += count;
    emitter.explode(count, at.x, at.y);

    // Decrement particle counter when lifespan concludes
    this.scene.time.delayedCall(lifeMs, () => {
      this.liveParticleCount = Math.max(0, this.liveParticleCount - count);
    });
  }

  flashSprite(target: 'drone' | 'ship', id?: string, ms: number = 60): void {
    if (target === 'drone' && id && this.getEnemyView) {
      const view = this.getEnemyView(id);
      view?.flash?.(ms);
    } else if (target === 'ship' && this.playerView) {
      this.playerView.triggerDamageTint();
    }
  }

  pulseLabel(id: string, ms: number): void {
    if (this.getEnemyView) {
      const view = this.getEnemyView(id);
      view?.pulse?.(ms);
    }
  }

  spawnBolt(from: Vector2, to: Vector2, _travelMs: number, _trailSegments: number): void {
    this.projectilePool.spawn(from, to);
  }

  tintShip(_color: number, _ms: number): void {
    this.playerView?.triggerDamageTint();
  }

  flashEdge(alpha: number, ms: number): void {
    if (!this.edgeFlashGraphics) return;

    this.edgeFlashCount++;
    if (this.edgeFlashTween) {
      this.edgeFlashTween.stop();
    }

    this.edgeFlashGraphics.setAlpha(alpha);
    this.edgeFlashTween = this.scene.tweens.add({
      targets: this.edgeFlashGraphics,
      alpha: 0,
      duration: ms,
      ease: 'Quad.easeOut',
    });
  }

  shakeCamera(px: number, ms: number): void {
    const cam = this.scene.cameras.main;
    if (!cam) return;

    this.shakeCount++;
    const intensity = px / Math.max(1, cam.width);
    cam.shake(ms, intensity);
  }

  spawnGhost(x: number, y: number): void {
    this.ghostPool.spawn(x, y);
  }

  getCounts(): EffectCounts {
    return {
      liveParticles: this.liveParticleCount,
      liveBolts: (this.projectilePool as unknown as { activeCount?: number }).activeCount ?? 0,
      liveRings: this.activeRings.length,
      ghosts: (this.ghostPool as unknown as { activeCount?: number }).activeCount ?? 0,
      displayObjects: this.scene.children?.length ?? 0,
      shakeCount: this.shakeCount,
      edgeFlashCount: this.edgeFlashCount,
    };
  }

  clear(): void {
    for (const g of this.activeRings) {
      g.destroy();
    }
    this.activeRings = [];
    this.liveParticleCount = 0;
    if (this.edgeFlashGraphics) {
      this.edgeFlashGraphics.setAlpha(0);
    }
  }

  destroy(): void {
    this.clear();
    this.sparkEmitter?.destroy();
    this.burstEmitter?.destroy();
    this.edgeFlashGraphics?.destroy();
  }
}
