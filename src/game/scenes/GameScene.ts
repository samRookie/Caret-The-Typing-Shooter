import Phaser from 'phaser';
import { spawnTargetLock } from '../rendering/phase1-vfx';

export class GameScene extends Phaser.Scene {
  private playerShip!: Phaser.GameObjects.Image;
  private droneEnemy!: Phaser.GameObjects.Image;
  private projectile!: Phaser.GameObjects.Graphics;
  private wordContainer!: Phaser.GameObjects.Container;
  private targetReticle?: Phaser.GameObjects.Graphics;
  private stars: { x: number; y: number; speed: number; alpha: number; size: number }[] =
    [];
  private starGraphics!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Tactical Coordinate Grid
    this.gridGraphics = this.add.graphics().setDepth(1);
    this.drawGrid(width, height);

    // 2. Procedural Sparse Starfield
    this.starGraphics = this.add.graphics().setDepth(2);
    this.initStars(width, height);

    // 3. Player Ship Visual Placeholder (Bottom Center)
    this.playerShip = this.add
      .image(width / 2, height - 110, 'player-ship')
      .setOrigin(0.5)
      .setScale(0.7)
      .setDepth(10);

    // Subtle engine idle exhaust glow
    const engineGlow = this.add.graphics().setDepth(9);
    engineGlow.fillStyle(0xffb84a, 0.45);
    engineGlow.fillCircle(width / 2, height - 55, 12);
    this.tweens.add({
      targets: engineGlow,
      alpha: 0.15,
      scaleX: 0.75,
      scaleY: 1.25,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 4. Drone Enemy Visual Placeholder (Upper Center)
    const enemyX = width / 2;
    const enemyY = height * 0.32;

    this.droneEnemy = this.add
      .image(enemyX, enemyY, 'drone')
      .setOrigin(0.5)
      .setScale(0.65)
      .setDepth(10);

    // Subtle idle rotation
    this.tweens.add({
      targets: this.droneEnemy,
      angle: 360,
      duration: 16000,
      repeat: -1,
      ease: 'Linear',
    });

    // 5. Target Reticle Placeholder around Drone
    this.targetReticle = spawnTargetLock(this, enemyX, enemyY, {
      accent: 0xffb84a,
      reducedMotion: false,
    });

    // 6. High-Contrast Word Label Plate (Positioned above drone)
    this.createWordPlate(enemyX, enemyY - 55, 'RECON', 2);

    // 7. Energy Projectile Bolt Placeholder (Mid-flight toward enemy)
    this.projectile = this.add.graphics().setDepth(12);
    this.drawProjectile(width / 2, height - 210);

    // Handle viewport resize
    this.scale.on('resize', this.handleResize, this);
  }

  private drawGrid(width: number, height: number): void {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0xffb84a, 0.05);

    const gridSize = 64;
    for (let x = 0; x < width; x += gridSize) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }
    this.gridGraphics.strokePath();
  }

  private initStars(width: number, height: number): void {
    this.stars = [];
    const starCount = 45;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, width),
        y: Phaser.Math.Between(0, height),
        speed: Phaser.Math.FloatBetween(0.15, 0.6),
        alpha: Phaser.Math.FloatBetween(0.2, 0.8),
        size: Phaser.Math.Between(1, 2),
      });
    }
  }

  private createWordPlate(x: number, y: number, word: string, typedLength: number): void {
    if (this.wordContainer) this.wordContainer.destroy();

    this.wordContainer = this.add.container(x, y).setDepth(25);

    const plateWidth = 110;
    const plateHeight = 28;

    // Dark translucent background plate
    const bgPlate = this.add.graphics();
    bgPlate.fillStyle(0x0a0e14, 0.94);
    bgPlate.fillRoundedRect(
      -plateWidth / 2,
      -plateHeight / 2,
      plateWidth,
      plateHeight,
      4
    );
    bgPlate.lineStyle(1, 0xffb84a, 0.45);
    bgPlate.strokeRoundedRect(
      -plateWidth / 2,
      -plateHeight / 2,
      plateWidth,
      plateHeight,
      4
    );
    this.wordContainer.add(bgPlate);

    // Letters layout with 3-tier styling
    const startX = -plateWidth / 2 + 18;
    const spacing = 16;

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!char) continue;
      let color = '#f3f7fa';
      if (i < typedLength) {
        color = '#52606d'; // Typed / faded
      } else if (i === typedLength) {
        color = '#ffd37a'; // Next expected character
      }

      const letterText = this.add
        .text(startX + i * spacing, 0, char, {
          fontFamily: 'KenneyFutureNarrow, monospace',
          fontSize: '15px',
          color,
        })
        .setOrigin(0.5);

      if (i === typedLength) {
        // Subtle indicator under the active letter
        const under = this.add.graphics();
        under.fillStyle(0xffb84a, 0.9);
        under.fillRect(startX + i * spacing - 6, 8, 12, 2);
        this.wordContainer.add(under);
      }

      this.wordContainer.add(letterText);
    }
  }

  private drawProjectile(x: number, y: number): void {
    this.projectile.clear();

    // Fading energy trail
    this.projectile.lineStyle(6, 0xffb84a, 0.25);
    this.projectile.moveTo(x, y + 26);
    this.projectile.lineTo(x, y);
    this.projectile.strokePath();

    this.projectile.lineStyle(2, 0xfff4d0, 0.85);
    this.projectile.moveTo(x, y + 16);
    this.projectile.lineTo(x, y);
    this.projectile.strokePath();

    // Bright core
    this.projectile.fillStyle(0xfff4d0, 1);
    this.projectile.fillCircle(x, y, 4);
  }

  update(): void {
    // Drifting starfield
    const { width, height } = this.scale;
    this.starGraphics.clear();

    for (const s of this.stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Phaser.Math.Between(0, width);
      }
      this.starGraphics.fillStyle(0xfff0c2, s.alpha);
      this.starGraphics.fillCircle(s.x, s.y, s.size);
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.drawGrid(width, height);
    if (this.playerShip) {
      this.playerShip.setPosition(width / 2, height - 110);
    }
    if (this.droneEnemy) {
      const enemyX = width / 2;
      const enemyY = height * 0.32;
      this.droneEnemy.setPosition(enemyX, enemyY);
      if (this.targetReticle) {
        this.targetReticle.setPosition(enemyX - width / 2, enemyY - height * 0.32);
      }
      this.createWordPlate(enemyX, enemyY - 55, 'RECON', 2);
    }
  }
}
