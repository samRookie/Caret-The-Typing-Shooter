import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { PLAYER_START, RENDERER_CONFIG, TARGET_SHIP_SIZE } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';
import { PlayerState } from '@/shared/domain';

export class PlayerView {
  private sprite: Phaser.GameObjects.Image;
  private engineGlow?: Phaser.GameObjects.Graphics;
  private muzzleFlash?: Phaser.GameObjects.Graphics;
  private glowTween?: Phaser.Tweens.Tween;
  private damageTimer: number = 0;
  private muzzleFlashTimer: number = 0;

  constructor(scene: Phaser.Scene, reducedMotion: boolean = false) {
    this.sprite = scene.add.image(PLAYER_START.x, PLAYER_START.y, 'player-ship');
    this.sprite.setDisplaySize(TARGET_SHIP_SIZE.width, TARGET_SHIP_SIZE.height);
    this.sprite.setDepth(DEPTHS.PLAYER);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.rotation = 0;

    if (scene.add && typeof scene.add.graphics === 'function') {
      const g = scene.add.graphics();
      if (g) {
        this.engineGlow = g;
        this.engineGlow.setDepth?.(DEPTHS.PLAYER - 1);
        this.drawEngineGlow();

        if (!reducedMotion && scene.tweens && typeof scene.tweens.add === 'function') {
          this.glowTween = scene.tweens.add({
            targets: this.engineGlow,
            alpha: { from: 0.6, to: 1.0 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        } else if (this.engineGlow.setAlpha) {
          this.engineGlow.setAlpha(0.85);
        }
      }

      const flash = scene.add.graphics();
      if (flash) {
        this.muzzleFlash = flash;
        this.muzzleFlash.setDepth?.(DEPTHS.PROJECTILES + 1);
      }
    }
  }

  private drawEngineGlow(): void {
    if (!this.engineGlow || typeof this.engineGlow.fillCircle !== 'function') return;
    this.engineGlow.clear();
    this.engineGlow.fillStyle(0xffb84a, 0.6);
    this.engineGlow.fillCircle(0, TARGET_SHIP_SIZE.height / 2 + 4, 8);
    this.engineGlow.fillStyle(0xfff0c2, 0.9);
    this.engineGlow.fillCircle(0, TARGET_SHIP_SIZE.height / 2 + 2, 4);
  }

  update(
    deltaSeconds: number,
    playerState?: PlayerState,
    targetPosition?: { x: number; y: number } | null
  ): void {
    if (playerState) {
      this.sprite.setPosition(playerState.position.x, playerState.position.y);
      if (playerState.isDamaged) {
        this.triggerDamageTint();
      }
    }

    // Aim rotation: point spacecraft towards active target, or smoothly return to 0 (upright)
    let desiredAngle = 0;
    if (targetPosition) {
      const dx = targetPosition.x - this.sprite.x;
      const dy = targetPosition.y - this.sprite.y;
      // Native ship sprite points UP (-PI/2), so add PI/2
      desiredAngle = Math.atan2(dy, dx) + Math.PI / 2;
    }

    if (typeof this.sprite.rotation === 'number') {
      const currentAngle = this.sprite.rotation;
      let diff = desiredAngle - currentAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      const rotateSpeed = 16; // Fast, snappy tactical aim response
      const maxStep = rotateSpeed * deltaSeconds;
      if (Math.abs(diff) <= maxStep) {
        this.sprite.rotation = desiredAngle;
      } else {
        this.sprite.rotation = currentAngle + Math.sign(diff) * maxStep;
      }
    }

    // Synchronize engine glow
    this.engineGlow?.setPosition?.(this.sprite.x, this.sprite.y);
    this.engineGlow?.setRotation?.(this.sprite.rotation);

    if (this.damageTimer > 0) {
      this.damageTimer -= deltaSeconds;
      if (this.damageTimer <= 0) {
        this.damageTimer = 0;
        this.sprite.clearTint();
      }
    }

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= deltaSeconds;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashTimer = 0;
        this.muzzleFlash?.clear?.();
      } else {
        this.renderMuzzleFlash();
      }
    }
  }

  getNosePosition(): { x: number; y: number } {
    const angle = this.sprite.rotation ?? 0;
    const halfHeight = TARGET_SHIP_SIZE.height * 0.45;
    return {
      x: this.sprite.x + Math.sin(angle) * halfHeight,
      y: this.sprite.y - Math.cos(angle) * halfHeight,
    };
  }

  triggerMuzzleFlash(): void {
    this.muzzleFlashTimer = 0.05; // 50ms intense plasma discharge
    this.renderMuzzleFlash();
  }

  private renderMuzzleFlash(): void {
    if (!this.muzzleFlash || typeof this.muzzleFlash.fillStyle !== 'function') return;
    const nose = this.getNosePosition();
    this.muzzleFlash.clear();
    // Radiant golden plasma halo
    this.muzzleFlash.fillStyle(0xffa834, 0.75);
    this.muzzleFlash.fillCircle(nose.x, nose.y, 9);
    // Incandescent white-hot core
    this.muzzleFlash.fillStyle(0xffffff, 1.0);
    this.muzzleFlash.fillCircle(nose.x, nose.y, 4.5);
  }

  triggerDamageTint(): void {
    this.damageTimer = RENDERER_CONFIG.playerDamageTintMs / 1000;
    this.sprite.setTint(THEME.phaserColors.danger);
  }

  setVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
    this.engineGlow?.setVisible?.(visible);
    this.muzzleFlash?.setVisible?.(visible);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get displayWidth(): number {
    return this.sprite.displayWidth;
  }

  get displayHeight(): number {
    return this.sprite.displayHeight;
  }

  get rotation(): number {
    return this.sprite.rotation ?? 0;
  }

  reset(): void {
    this.damageTimer = 0;
    this.muzzleFlashTimer = 0;
    this.muzzleFlash?.clear?.();
    this.sprite.clearTint();
    this.sprite.rotation = 0;
    this.sprite.setPosition(PLAYER_START.x, PLAYER_START.y);
    this.sprite.setVisible(true);
    this.engineGlow?.setPosition?.(PLAYER_START.x, PLAYER_START.y);
    this.engineGlow?.setRotation?.(0);
    this.engineGlow?.setVisible?.(true);
  }

  destroy(): void {
    this.glowTween?.stop();
    this.engineGlow?.destroy?.();
    this.muzzleFlash?.destroy?.();
    this.sprite.destroy();
  }
}

