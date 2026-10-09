import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { DESKTOP_VIEWPORT } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';

interface Star {
  x: number;
  y: number;
  speedY: number;
  size: number;
  alpha: number;
  isFlare?: boolean;
}

interface CelestialObject {
  type: 'planet' | 'galaxy';
  x: number;
  y: number;
  speedY: number;
  speedX: number;
  radius: number;
  waveAssigned: number;
  color: number;
  accentColor: number;
  rotation: number;
  rotationSpeed: number;
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
  private celestialGraphics: Phaser.GameObjects.Graphics;
  private starGraphics: Phaser.GameObjects.Graphics;
  private stars: Star[] = [];
  private celestialObjects: CelestialObject[] = [];
  private lastCheckedWave: number = 0;
  private rng = createRenderRng(99991);

  constructor(scene: Phaser.Scene) {
    const width = DESKTOP_VIEWPORT.width;
    const height = DESKTOP_VIEWPORT.height;

    // 1. Static Tactical Grid (Depth 0)
    this.gridGraphics = scene.add.graphics();
    this.gridGraphics.setDepth(DEPTHS.BACKGROUND_GRID);
    this.gridGraphics.lineStyle(1, THEME.phaserColors.bgGrid, 0.35);

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

    // 2. Celestial Objects Graphics (Planets & Galaxies) (Depth 1)
    this.celestialGraphics = scene.add.graphics();
    this.celestialGraphics.setDepth(DEPTHS.BACKGROUND_STARS);

    // 3. Multi-Tier Starfield (140 stars across 3 layers) (Depth 1.5)
    this.starGraphics = scene.add.graphics();
    this.starGraphics.setDepth(DEPTHS.BACKGROUND_STARS);

    this.initStars(width, height);
    this.renderStars();
  }

  private initStars(width: number, height: number): void {
    // Layer 1: 80 micro distant background stars
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: this.rng() * width,
        y: this.rng() * height,
        speedY: 10 + this.rng() * 20,
        size: 1,
        alpha: 0.15 + this.rng() * 0.35,
      });
    }

    // Layer 2: 45 mid-range stars
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: this.rng() * width,
        y: this.rng() * height,
        speedY: 25 + this.rng() * 35,
        size: 1.5,
        alpha: 0.45 + this.rng() * 0.45,
      });
    }

    // Layer 3: 15 prominent bright flare stars (with 4-point cross diffraction)
    for (let i = 0; i < 15; i++) {
      this.stars.push({
        x: this.rng() * width,
        y: this.rng() * height,
        speedY: 45 + this.rng() * 45,
        size: 2.5,
        alpha: 0.8 + this.rng() * 0.2,
        isFlare: true,
      });
    }
  }

  update(deltaSeconds: number, wave: number = 1): void {
    const width = DESKTOP_VIEWPORT.width;
    const height = DESKTOP_VIEWPORT.height;

    // Check wave progression to spawn occasional celestial events
    if (wave !== this.lastCheckedWave) {
      this.handleWaveTransition(wave, width);
      this.lastCheckedWave = wave;
    }

    // Advance stars
    for (const star of this.stars) {
      star.y += star.speedY * deltaSeconds;
      if (star.y > height) {
        star.y = 0;
        star.x = this.rng() * width;
      }
    }

    // Advance and filter celestial objects
    for (const obj of this.celestialObjects) {
      obj.y += obj.speedY * deltaSeconds;
      obj.x += obj.speedX * deltaSeconds;
      obj.rotation += obj.rotationSpeed * deltaSeconds;
    }
    this.celestialObjects = this.celestialObjects.filter(
      (obj) => obj.y - obj.radius <= height + 80 && obj.x + obj.radius >= -80
    );

    this.renderStars();
    this.renderCelestialObjects();
  }

  private handleWaveTransition(wave: number, width: number): void {
    // 1. After every 3 waves (Waves 3, 6, 9...), spawn an occasional planet drifting down
    if (wave > 1 && wave % 3 === 0) {
      const isRinged = this.rng() > 0.4;
      this.celestialObjects.push({
        type: 'planet',
        x: 100 + this.rng() * (width - 200),
        y: -60,
        speedY: 7 + this.rng() * 8, // slow, majestic drift
        speedX: (this.rng() - 0.5) * 4,
        radius: 28 + this.rng() * 14,
        waveAssigned: wave,
        color: isRinged ? 0x22354a : 0x1a2636,
        accentColor: isRinged ? 0xffb84a : 0x4a6582,
        rotation: this.rng() * Math.PI,
        rotationSpeed: 0.02,
      });
    }

    // 2. When wave >= 8, spawn a medium-sized galaxy once per wave
    if (wave >= 8) {
      const alreadyHasGalaxyThisWave = this.celestialObjects.some(
        (obj) => obj.type === 'galaxy' && obj.waveAssigned === wave
      );
      if (!alreadyHasGalaxyThisWave) {
        this.celestialObjects.push({
          type: 'galaxy',
          x: 120 + this.rng() * (width - 240),
          y: -80,
          speedY: 5 + this.rng() * 6,
          speedX: (this.rng() - 0.5) * 3,
          radius: 55 + this.rng() * 20, // medium sized
          waveAssigned: wave,
          color: 0xffcaa0,
          accentColor: 0x4d6688,
          rotation: this.rng() * Math.PI * 2,
          rotationSpeed: 0.04,
        });
      }
    }
  }

  private renderStars(): void {
    this.starGraphics.clear();
    for (const star of this.stars) {
      this.starGraphics.fillStyle(THEME.phaserColors.bright, star.alpha);
      this.starGraphics.fillRect(star.x, star.y, star.size, star.size);

      // Render 4-point cross diffraction flares on prominent stars
      if (star.isFlare) {
        this.starGraphics.lineStyle(1, 0xffe6ad, star.alpha * 0.6);
        this.starGraphics.lineBetween(star.x - 3, star.y + 1, star.x + 5, star.y + 1);
        this.starGraphics.lineBetween(star.x + 1, star.y - 3, star.x + 1, star.y + 5);
      }
    }
  }

  private renderCelestialObjects(): void {
    this.celestialGraphics.clear();

    for (const obj of this.celestialObjects) {
      if (obj.type === 'planet') {
        // Planet body
        this.celestialGraphics.fillStyle(obj.color, 0.7);
        this.celestialGraphics.fillCircle(obj.x, obj.y, obj.radius);

        // Planet dark crescent shadow
        this.celestialGraphics.fillStyle(0x0a1018, 0.55);
        this.celestialGraphics.fillCircle(obj.x + obj.radius * 0.35, obj.y, obj.radius * 0.95);

        // Planetary ring
        this.celestialGraphics.lineStyle(2.5, obj.accentColor, 0.35);
        this.celestialGraphics.strokeEllipse(
          obj.x,
          obj.y,
          obj.radius * 2.4,
          obj.radius * 0.75
        );
      } else if (obj.type === 'galaxy') {
        // Glowing galactic core
        this.celestialGraphics.fillStyle(obj.color, 0.45);
        this.celestialGraphics.fillCircle(obj.x, obj.y, obj.radius * 0.28);

        // Diffuse elliptical galactic halo
        this.celestialGraphics.fillStyle(obj.accentColor, 0.18);
        this.celestialGraphics.fillEllipse(
          obj.x,
          obj.y,
          obj.radius * 2,
          obj.radius * 1.1
        );

        // Spiral dust arm dots
        const armCount = 2;
        const dotsPerArm = 14;
        for (let a = 0; a < armCount; a++) {
          const armOffset = (a * Math.PI) + obj.rotation;
          for (let d = 1; d <= dotsPerArm; d++) {
            const r = (d / dotsPerArm) * obj.radius;
            const theta = armOffset + (d * 0.32);
            const dotX = obj.x + Math.cos(theta) * r;
            const dotY = obj.y + Math.sin(theta) * (r * 0.55);
            this.celestialGraphics.fillStyle(0xffe2b8, 0.35 * (1 - d / dotsPerArm));
            this.celestialGraphics.fillCircle(dotX, dotY, 1.4);
          }
        }
      }
    }
  }

  destroy(): void {
    this.gridGraphics.destroy();
    this.celestialGraphics.destroy();
    this.starGraphics.destroy();
    this.stars = [];
    this.celestialObjects = [];
  }
}
