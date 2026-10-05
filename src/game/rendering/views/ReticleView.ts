import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { THEME } from '@/shared/theme';

export class ReticleView {
  private graphics: Phaser.GameObjects.Graphics;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(DEPTHS.RETICLE);
    this.graphics.setVisible(false);

    // Draw bracket reticle around (0, 0)
    this.drawBrackets();
  }

  private drawBrackets(): void {
    const s = 28; // bracket radius around drone
    const arm = 8; // corner bracket arm length

    this.graphics.clear();
    this.graphics.lineStyle(2, THEME.phaserColors.amber, 1);

    this.graphics.beginPath();
    // Top-Left corner
    this.graphics.moveTo(-s, -s + arm);
    this.graphics.lineTo(-s, -s);
    this.graphics.lineTo(-s + arm, -s);

    // Top-Right corner
    this.graphics.moveTo(s - arm, -s);
    this.graphics.lineTo(s, -s);
    this.graphics.lineTo(s, -s + arm);

    // Bottom-Left corner
    this.graphics.moveTo(-s, s - arm);
    this.graphics.lineTo(-s, s);
    this.graphics.lineTo(-s + arm, s);

    // Bottom-Right corner
    this.graphics.moveTo(s - arm, s);
    this.graphics.lineTo(s, s);
    this.graphics.lineTo(s, s - arm);

    this.graphics.strokePath();
  }

  show(x: number, y: number): void {
    this.isVisible = true;
    this.graphics.setPosition(x, y);
    this.graphics.setVisible(true);
  }

  updatePosition(x: number, y: number): void {
    if (this.isVisible) {
      this.graphics.setPosition(x, y);
    }
  }

  hide(): void {
    this.isVisible = false;
    this.graphics.setVisible(false);
  }

  get visible(): boolean {
    return this.isVisible;
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
