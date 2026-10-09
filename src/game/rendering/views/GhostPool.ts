import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { RENDERER_CONFIG, TARGET_DRONE_WIDTH } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';

interface ActiveGhost {
  image: Phaser.GameObjects.Image;
  blastGraphics?: Phaser.GameObjects.Graphics;
  tweens: Phaser.Tweens.Tween[];
}

export class GhostPool {
  private scene: Phaser.Scene;
  private activeGhosts: ActiveGhost[] = [];
  readonly cap: number;

  constructor(scene: Phaser.Scene, cap: number = RENDERER_CONFIG.ghostCap) {
    this.scene = scene;
    this.cap = cap;
  }

  spawn(x: number, y: number): void {
    // Enforce hard cap 20: drop oldest if cap reached
    while (this.activeGhosts.length >= this.cap) {
      const oldest = this.activeGhosts.shift();
      if (oldest) {
        for (const tw of oldest.tweens) {
          tw.stop();
        }
        oldest.blastGraphics?.destroy();
        oldest.image.destroy();
      }
    }

    // 1. Drone Sprite Shatter & Pop: White-hot flash pop fading into blast
    const image = this.scene.add.image(x, y, 'drone');
    image.setDepth(DEPTHS.GHOSTS);
    image.setOrigin(0.5, 0.5);
    if (typeof (image as { setDisplaySize?: unknown }).setDisplaySize === 'function') {
      image.setDisplaySize(TARGET_DRONE_WIDTH, TARGET_DRONE_WIDTH);
    }
    image.setTint(0xffffff); // Initial white-hot flash
    image.setAlpha(1.0);

    const tweens: Phaser.Tweens.Tween[] = [];

    const ghostRecord: ActiveGhost = {
      image,
      tweens,
    };

    // Pop scale rapidly and transition tint to fiery amber before dissolving
    const spriteTween = this.scene.tweens.add({
      targets: image,
      scale: 1.25,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        if (image.alpha < 0.6) {
          image.setTint(THEME.phaserColors.bright);
        }
      },
      onComplete: () => {
        this.removeGhost(ghostRecord);
      },
    });
    tweens.push(spriteTween);

    // 2. High-Impact Blast Frame Graphics: Compact shockwave rings, core fireball, and focused shrapnel sparks
    if (typeof this.scene.add.graphics === 'function') {
      const blast = this.scene.add.graphics();
      blast.setDepth(DEPTHS.GHOSTS + 1);
      ghostRecord.blastGraphics = blast;

      // 8 radial shrapnel blast directions with calibrated compact spread
      const sparkCount = 8;
      const sparks = Array.from({ length: sparkCount }, (_, i) => ({
        angle: (i * (Math.PI * 2)) / sparkCount + (Math.random() - 0.5) * 0.35,
        speed: 20 + Math.random() * 6,
      }));

      const blastAnim = { t: 0 };
      const blastTween = this.scene.tweens.add({
        targets: blastAnim,
        t: 1,
        duration: 230,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          const t = blastAnim.t;
          blast.clear();
          const alpha = Math.max(0, 1 - t);

          // (a) Compact Fiery Shockwave Ring
          if (typeof blast.strokeCircle === 'function') {
            blast.lineStyle(3 * (1 - t * 0.5), 0xffd040, alpha);
            blast.strokeCircle(x, y, 4 + 22 * t);

            // Secondary inner heat ring
            blast.lineStyle(1.8, 0xff5500, Math.max(0, 0.7 - t));
            blast.strokeCircle(x, y, 3 + 14 * t);
          }

          // (b) Center Fireball Flash (rapid dissipation)
          if (typeof blast.fillCircle === 'function' && typeof blast.fillStyle === 'function') {
            if (t < 0.45) {
              const flashAlpha = (0.45 - t) / 0.45;
              blast.fillStyle(0xffffff, flashAlpha);
              blast.fillCircle(x, y, 10 * (1 - t * 1.5));

              blast.fillStyle(0xffaa00, flashAlpha * 0.7);
              blast.fillCircle(x, y, 13 * (1 - t));
            }
          }

          // (c) Compact Shrapnel Sparks radiating outward
          if (typeof blast.lineBetween === 'function') {
            for (let i = 0; i < sparks.length; i++) {
              const spark = sparks[i]!;
              const dist = spark.speed * t;
              const len = Math.max(2, 6 * (1 - t));
              const headX = x + Math.cos(spark.angle) * dist;
              const headY = y + Math.sin(spark.angle) * dist;
              const tailX = x + Math.cos(spark.angle) * Math.max(0, dist - len);
              const tailY = y + Math.sin(spark.angle) * Math.max(0, dist - len);

              blast.lineStyle(1.8, i % 2 === 0 ? 0xffea66 : 0xff5500, alpha);
              blast.lineBetween(tailX, tailY, headX, headY);
            }
          }
        },
      });
      tweens.push(blastTween);
    }

    this.activeGhosts.push(ghostRecord);
  }

  private removeGhost(ghostRecord: ActiveGhost): void {
    const idx = this.activeGhosts.indexOf(ghostRecord);
    if (idx !== -1) {
      this.activeGhosts.splice(idx, 1);
    }
    ghostRecord.blastGraphics?.destroy();
    ghostRecord.image.destroy();
  }

  get count(): number {
    return this.activeGhosts.length;
  }

  clear(): void {
    this.destroy();
  }

  destroy(): void {
    for (const g of this.activeGhosts) {
      for (const tw of g.tweens) {
        tw.stop();
      }
      g.blastGraphics?.destroy();
      g.image.destroy();
    }
    this.activeGhosts = [];
  }
}
