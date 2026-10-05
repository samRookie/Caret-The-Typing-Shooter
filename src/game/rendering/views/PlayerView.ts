import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import { PLAYER_START, RENDERER_CONFIG } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';
import { PlayerState } from '@/shared/domain';

export class PlayerView {
  private sprite: Phaser.GameObjects.Image;
  private damageTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.image(PLAYER_START.x, PLAYER_START.y, 'player-ship');
    this.sprite.setDepth(DEPTHS.PLAYER);
    this.sprite.setOrigin(0.5, 0.5);
  }

  update(deltaSeconds: number, playerState?: PlayerState): void {
    if (playerState) {
      this.sprite.setPosition(playerState.position.x, playerState.position.y);
      if (playerState.isDamaged) {
        this.triggerDamageTint();
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

  destroy(): void {
    this.sprite.destroy();
  }
}
