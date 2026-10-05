import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { DESKTOP_VIEWPORT, RENDERER_CONFIG } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';

interface Star {
  x: number;
  y: number;
  speedY: number;
  size: number;
  alpha: number;
}

/**
 * Render-only PRNG (Mulberry32) completely isolated from simulation streams.
 */
function createRenderRng(seed: number = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class BackgroundView {
  private gridGraphics: Phaser.GameObjects.Graphics;
  private starGraphics: Phaser.GameObjects.Graphics;
  private stars: Star[] = [];

  constructor(scene: Phaser.Scene) {
    const rng = createRenderRng(99991);
    const width = DESKTOP_VIEWPORT.width;
    const height = DESKTOP_VIEWPORT.height;

    // 1. Static Tactical Grid (Depth 0)
    this.gridGraphics = scene.add.graphics();
    this.gridGraphics.setDepth(DEPTHS.BACKGROUND_GRID);
    this.gridGraphics.lineStyle(1, THEME.phaserColors.bgGrid, 0.4);

    const gridSize = 64;
    for (let x = 0; x <= width; x += gridSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }
    this.gridGraphics.strokePath();

    // 2. 45-star drifting starfield (Depth 1)
    this.starGraphics = scene.add.graphics();
    this.starGraphics.setDepth(DEPTHS.BACKGROUND_STARS);

    const starCount = RENDERER_CONFIG.backgroundStarCount; // 45
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: rng() * width,
        y: rng() * height,
        speedY: 15 + rng() * 35, // slow drift
        size: rng() > 0.8 ? 2 : 1,
        alpha: 0.2 + rng() * 0.6,
      });
    }

    this.renderStars();
  }

  update(deltaSeconds: number): void {
    const height = DESKTOP_VIEWPORT.height;
    for (const star of this.stars) {
      star.y += star.speedY * deltaSeconds;
      if (star.y > height) {
        star.y = 0;
      }
    }
    this.renderStars();
  }

  private renderStars(): void {
    this.starGraphics.clear();
    for (const star of this.stars) {
      this.starGraphics.fillStyle(THEME.phaserColors.bright, star.alpha);
      this.starGraphics.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  destroy(): void {
    this.gridGraphics.destroy();
    this.starGraphics.destroy();
    this.stars = [];
  }
}
