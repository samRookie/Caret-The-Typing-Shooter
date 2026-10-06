import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { RENDERER_CONFIG } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';

interface ActiveGhost {
  image: Phaser.GameObjects.Image;
  tween: Phaser.Tweens.Tween;
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
        oldest.tween.stop();
        oldest.image.destroy();
      }
    }

    const image = this.scene.add.image(x, y, 'drone');
    image.setDepth(DEPTHS.GHOSTS);
    image.setOrigin(0.5, 0.5);
    image.setTint(THEME.phaserColors.bright);
    image.setAlpha(0.85);

    const ghostRecord: ActiveGhost = {
      image,
      tween: null as unknown as Phaser.Tweens.Tween,
    };

    const tween = this.scene.tweens.add({
      targets: image,
      scale: 1.6,
      alpha: 0,
      duration: RENDERER_CONFIG.ghostDurationMs, // 250ms
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.removeGhost(ghostRecord);
      },
    });

    ghostRecord.tween = tween;
    this.activeGhosts.push(ghostRecord);
  }

  private removeGhost(ghostRecord: ActiveGhost): void {
    const idx = this.activeGhosts.indexOf(ghostRecord);
    if (idx !== -1) {
      this.activeGhosts.splice(idx, 1);
    }
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
      g.tween.stop();
      g.image.destroy();
    }
    this.activeGhosts = [];
  }
}
