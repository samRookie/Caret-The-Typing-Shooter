import Phaser from 'phaser';
import { DEPTHS } from '../depths';
import {
  clampContainerX,
  computePlateWidth,
  layoutLabel,
  LayoutLetter,
} from '../layoutLabel';
import { RENDERER_CONFIG, TARGET_DRONE_WIDTH } from '@/shared/config/defaultConfig';
import { THEME } from '@/shared/theme';
import { EnemyState } from '@/shared/domain';

// Clear headroom >= 6 px between bottom of label plate and top of drone sprite (Rule R-E)
export const LABEL_HEADROOM_PX = 7;
export const LABEL_Y_OFFSET =
  TARGET_DRONE_WIDTH / 2 + LABEL_HEADROOM_PX + RENDERER_CONFIG.plateHeightPx / 2;

export class EnemyView {
  readonly id: string;
  readonly word: string;
  private droneImage: Phaser.GameObjects.Image;
  private labelContainer: Phaser.GameObjects.Container;
  private plateGraphics: Phaser.GameObjects.Graphics;
  private underlineGraphics: Phaser.GameObjects.Graphics;
  private letterTexts: Phaser.GameObjects.Text[] = [];

  private lastRemainingWord: string = '';
  private lastIsTargeted: boolean = false;
  private plateWidth: number;
  private plateHeight: number = RENDERER_CONFIG.plateHeightPx;

  constructor(scene: Phaser.Scene, enemy: EnemyState, isTargeted: boolean = false) {
    this.id = enemy.id;
    this.word = enemy.word;
    this.lastRemainingWord = enemy.remainingWord;
    this.lastIsTargeted = isTargeted;

    // 1. Drone Image (Depth 10, display size 44x44 px)
    this.droneImage = scene.add.image(enemy.position.x, enemy.position.y, 'drone');
    this.droneImage.setDisplaySize(TARGET_DRONE_WIDTH, TARGET_DRONE_WIDTH);
    this.droneImage.setDepth(DEPTHS.ENEMIES);
    this.droneImage.setOrigin(0.5, 0.5);

    // 2. Label Container (Depth 25, positioned with >= 6px headroom above sprite)
    this.plateWidth = computePlateWidth(this.word.length);
    const clampedX = clampContainerX(enemy.position.x, this.plateWidth);
    const labelY = enemy.position.y - LABEL_Y_OFFSET;

    this.labelContainer = scene.add.container(clampedX, labelY);
    this.labelContainer.setDepth(DEPTHS.LABELS);

    // Background & border graphics
    this.plateGraphics = scene.add.graphics();
    this.labelContainer.add(this.plateGraphics);

    // Underline graphics for next letter
    this.underlineGraphics = scene.add.graphics();
    this.labelContainer.add(this.underlineGraphics);

    // Initial letters layout
    const layout = layoutLabel(this.word, enemy.remainingWord);
    for (let i = 0; i < layout.length; i++) {
      const item = layout[i]!;
      const text = scene.add.text(item.x, 0, item.char, {
        fontFamily: RENDERER_CONFIG.labelFontFamily,
        fontSize: `${RENDERER_CONFIG.labelFontSizePx}px`,
        fontStyle: '600',
        color: this.getColorForState(item.state),
      });
      text.setOrigin(0.5, 0.5);
      this.letterTexts.push(text);
      this.labelContainer.add(text);
    }

    this.redrawPlateAndUnderline(layout, isTargeted);
  }

  update(enemy: EnemyState, isTargeted: boolean): void {
    // 1. Position update: setPosition each frame (zero allocation)
    this.droneImage.setPosition(enemy.position.x, enemy.position.y);
    const clampedX = clampContainerX(enemy.position.x, this.plateWidth);
    this.labelContainer.setPosition(clampedX, enemy.position.y - LABEL_Y_OFFSET);

    // 2. Label state update: recolor ONLY when remainingWord or isTargeted changes
    if (
      enemy.remainingWord === this.lastRemainingWord &&
      isTargeted === this.lastIsTargeted
    ) {
      return;
    }

    this.lastRemainingWord = enemy.remainingWord;
    this.lastIsTargeted = isTargeted;

    const layout = layoutLabel(this.word, enemy.remainingWord);
    for (let i = 0; i < layout.length && i < this.letterTexts.length; i++) {
      const item = layout[i]!;
      this.letterTexts[i]?.setColor(this.getColorForState(item.state));
    }

    this.redrawPlateAndUnderline(layout, isTargeted);
  }

  private getColorForState(state: LayoutLetter['state']): string {
    switch (state) {
      case 'typed':
        return THEME.colors.textMuted;
      case 'next':
        return THEME.colors.accent;
      case 'remaining':
      default:
        return THEME.colors.textPrimary;
    }
  }

  private redrawPlateAndUnderline(
    layout: LayoutLetter[],
    isTargeted: boolean
  ): void {
    const halfW = this.plateWidth / 2;
    const halfH = this.plateHeight / 2;

    // Draw plate background and border
    this.plateGraphics.clear();
    // Background: rgba(10, 14, 20, 0.92)
    this.plateGraphics.fillStyle(0x0a0e14, 0.92);
    this.plateGraphics.fillRoundedRect(-halfW, -halfH, this.plateWidth, this.plateHeight, 4);

    if (isTargeted) {
      // 2px plate border in accent color
      this.plateGraphics.lineStyle(2, THEME.phaserColors.amber, 1);
    } else {
      // 1px subtle border
      this.plateGraphics.lineStyle(1, 0x3a4856, 0.7);
    }
    this.plateGraphics.strokeRoundedRect(-halfW, -halfH, this.plateWidth, this.plateHeight, 4);

    // Draw underline under next letter if targeted
    this.underlineGraphics.clear();
    if (isTargeted) {
      const nextLetter = layout.find((l) => l.state === 'next');
      if (nextLetter) {
        const halfAdv = RENDERER_CONFIG.labelCharWidthPx / 2;
        const lineY = halfH - 4;
        this.underlineGraphics.lineStyle(2, THEME.phaserColors.amber, 1);
        this.underlineGraphics.lineBetween(
          nextLetter.x - halfAdv + 1,
          lineY,
          nextLetter.x + halfAdv - 1,
          lineY
        );
      }
    }
  }

  get x(): number {
    return this.droneImage.x;
  }

  get y(): number {
    return this.droneImage.y;
  }

  get displayWidth(): number {
    return this.droneImage.displayWidth;
  }

  get displayHeight(): number {
    return this.droneImage.displayHeight;
  }

  get spriteTop(): number {
    return this.droneImage.y - this.droneImage.displayHeight / 2;
  }

  get labelPlateBottom(): number {
    return this.labelContainer.y + this.plateHeight / 2;
  }

  get labelPlateTop(): number {
    return this.labelContainer.y - this.plateHeight / 2;
  }

  get headroom(): number {
    return this.spriteTop - this.labelPlateBottom;
  }

  flash(ms: number = 60): void {
    if (!this.droneImage.active) return;
    this.droneImage.setTintFill(0xffffff);
    this.droneImage.scene?.time?.delayedCall(ms, () => {
      if (this.droneImage.active) {
        this.droneImage.clearTint();
      }
    });
  }

  pulse(ms: number = 100, scale: number = 1.06): void {
    if (!this.labelContainer.active || !this.labelContainer.scene) return;
    this.labelContainer.scene.tweens.add({
      targets: this.labelContainer,
      scaleX: scale,
      scaleY: scale,
      duration: ms / 2,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  fadeIn(ms: number = 200): void {
    if (!this.droneImage.active || !this.droneImage.scene) return;
    this.droneImage.setAlpha(0);
    this.droneImage.scene.tweens.add({
      targets: this.droneImage,
      alpha: 1,
      duration: ms,
      ease: 'Linear',
    });
  }

  destroy(): void {
    this.droneImage.destroy();
    this.labelContainer.destroy(true);
    this.letterTexts = [];
  }
}
