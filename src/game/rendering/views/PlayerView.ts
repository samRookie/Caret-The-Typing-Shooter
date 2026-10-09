import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { PLAYER_START, RENDERER_CONFIG, TARGET_SHIP_SIZE } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';
import { PlayerState } from '@/shared/domain';

export class PlayerView {
  private sprite: Phaser.GameObjects.Image;
  private damageTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.image(PLAYER_START.x, PLAYER_START.y, 'player-ship');
    this.sprite.setDisplaySize(TARGET_SHIP_SIZE.width, TARGET_SHIP_SIZE.height);
    this.sprite.setDepth(DEPTHS.PLAYER);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.rotation = 0;
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

    if (this.damageTimer > 0) {
      this.damageTimer -= deltaSeconds;
      if (this.damageTimer <= 0) {
        this.damageTimer = 0;
        this.sprite.clearTint();
      }
    }
  }

  triggerDamageTint(): void {
    this.damageTimer = RENDERER_CONFIG.playerDamageTintMs / 1000;
    this.sprite.setTint(THEME.phaserColors.danger);
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
    this.sprite.clearTint();
    this.sprite.rotation = 0;
    this.sprite.setPosition(PLAYER_START.x, PLAYER_START.y);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
