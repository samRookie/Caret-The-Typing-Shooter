import Phaser from 'phaser';

export type VfxOptions = { reducedMotion?: boolean; accent?: number };

const colors = { amber: 0xffb84a, bright: 0xfff0c2, danger: 0xff5f5f };

export function spawnTargetLock(scene: Phaser.Scene, x: number, y: number, options: VfxOptions = {}) {
  const c = options.accent ?? colors.amber;
  const g = scene.add.graphics().setDepth(20);
  g.lineStyle(2, c, 0.9);
  const s = 26;
  g.strokeCircle(x, y, s);
  g.beginPath(); g.moveTo(x - s - 8, y - s); g.lineTo(x - s, y - s); g.lineTo(x - s, y - s + 8);
  g.moveTo(x + s + 8, y - s); g.lineTo(x + s, y - s); g.lineTo(x + s, y - s + 8);
  g.moveTo(x - s - 8, y + s); g.lineTo(x - s, y + s); g.lineTo(x - s, y + s - 8);
  g.moveTo(x + s + 8, y + s); g.lineTo(x + s, y + s); g.lineTo(x + s, y + s - 8); g.strokePath();
  if (!options.reducedMotion) {
    scene.tweens.add({ targets: g, alpha: 0.15, scale: 1.18, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
  return g;
}

export function spawnHitFlash(scene: Phaser.Scene, x: number, y: number, options: VfxOptions = {}) {
  const c = options.accent ?? colors.bright;
  const g = scene.add.graphics().setDepth(30);
  g.fillStyle(c, 0.9); g.fillCircle(x, y, options.reducedMotion ? 8 : 14);
  scene.tweens.add({ targets: g, alpha: 0, scale: options.reducedMotion ? 1.2 : 2.2, duration: options.reducedMotion ? 100 : 180, onComplete: () => g.destroy() });
  return g;
}

export function spawnDestroyBurst(scene: Phaser.Scene, x: number, y: number, options: VfxOptions = {}) {
  const count = options.reducedMotion ? 6 : 16;
  const c = options.accent ?? colors.amber;
  const particles = scene.add.particles(x, y, undefined, {
    lifespan: options.reducedMotion ? 160 : 360,
    speed: { min: 30, max: options.reducedMotion ? 80 : 180 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.9, end: 0 },
    tint: c,
    quantity: count,
    emitting: false,
    blendMode: Phaser.BlendModes.ADD,
  }).setDepth(25);
  particles.explode(count, x, y);
  scene.time.delayedCall(500, () => particles.destroy());
  return particles;
}

export function spawnWrongInputPulse(scene: Phaser.Scene, camera: Phaser.Cameras.Scene2D.Camera, options: VfxOptions = {}) {
  if (options.reducedMotion) return;
  camera.flash(90, 255, 95, 95, false);
}
