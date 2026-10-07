import Phaser from 'phaser';
import { DESKTOP_VIEWPORT, RENDERER_CONFIG } from '@/shared/config/defaultConfig';
import { PHASER_FONT_FAMILY } from '@/shared/theme';

/**
 * VisualPreviewScene (4.E)
 * Dedicated dev-only legibility test sheet mounted when `?preview=1` is provided.
 * Renders:
 * 1. All 26 lowercase alphabet glyphs (18px and 36px).
 * 2. 12 sample words of lengths 3-8 featuring critical and confusable letterforms.
 * 3. Combat word label plates demonstrating typed, next (underlined), and remaining states.
 */
export class VisualPreviewScene extends Phaser.Scene {
  private starGraphics!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private stars: { x: number; y: number; speed: number; alpha: number; size: number }[] = [];

  constructor() {
    super('VisualPreviewScene');
  }

  create(): void {
    const width = DESKTOP_VIEWPORT.width;
    const height = DESKTOP_VIEWPORT.height;

    // Background tactical grid
    this.gridGraphics = this.add.graphics().setDepth(1);
    this.drawGrid(width, height);

    // Procedural starfield
    this.starGraphics = this.add.graphics().setDepth(2);
    this.initStars(width, height);

    // Header Title
    this.add
      .text(width / 2, 75, 'TEKTUR TYPOGRAPHY LEGIBILITY SHEET [SPEC 4.E]', {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '18px',
        fontStyle: '700',
        color: '#ffb84a',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Section 1: All 26 Lowercase Latin Glyphs
    this.add
      .text(48, 108, '1. FULL ALPHABET (26 LOWERCASE) - 18px (1X) & 32px (2X ZOOM):', {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '12px',
        fontStyle: '600',
        color: '#8995a1',
      })
      .setDepth(10);

    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    this.renderAlphabetRow(48, 132, alphabet, 18, 22);
    this.renderAlphabetRow(48, 172, alphabet, 30, 36);

    // Section 2: 12 Sample Words with Confusable Glyphs
    this.add
      .text(48, 225, '2. SAMPLE COMBAT VOCABULARY (LENGTHS 3-8, CRITICAL GLYPH CLUSTERS):', {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '12px',
        fontStyle: '600',
        color: '#8995a1',
      })
      .setDepth(10);

    const sampleWords = [
      'air', 'jam', 'gun',
      'wing', 'jump', 'glow',
      'armor', 'quill', 'vital',
      'matrix', 'jungle', 'military',
    ];

    sampleWords.forEach((word, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = 56 + col * 300;
      const y = 250 + row * 34;
      this.renderSampleWord(x, y, word);
    });

    // Section 3: Word Plate Visual States (Real label advance & colors)
    this.add
      .text(48, 380, '3. WORD LABEL PLATES: TYPED / ACTIVE (UNDERLINED) / REMAINING STATES:', {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '12px',
        fontStyle: '600',
        color: '#8995a1',
      })
      .setDepth(10);

    // 1X Normal scale plates
    this.renderWordPlate(160, 428, 'recon', 2, 1);
    this.renderWordPlate(440, 428, 'jungle', 1, 1);
    this.renderWordPlate(720, 428, 'quill', 3, 1);
    this.renderWordPlate(1000, 428, 'matrix', 4, 1);

    // Section 4: 200% Zoom Detail Inspection
    this.add
      .text(48, 495, '4. 200% ZOOM DETAIL INSPECTION (ACTIVE CHAR ACCENT & FIXED-ADVANCE):', {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '12px',
        fontStyle: '600',
        color: '#8995a1',
      })
      .setDepth(10);

    this.renderWordPlate(320, 575, 'military', 4, 2);
    this.renderWordPlate(860, 575, 'illuminate', 3, 2);
  }

  private renderAlphabetRow(
    startX: number,
    y: number,
    chars: string,
    fontSizePx: number,
    spacing: number
  ): void {
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i] ?? '';
      this.add
        .text(startX + i * spacing, y, char, {
          fontFamily: PHASER_FONT_FAMILY,
          fontSize: `${fontSizePx}px`,
          fontStyle: '600',
          color: i % 2 === 0 ? '#f3f7fa' : '#ffd37a',
        })
        .setOrigin(0.5)
        .setDepth(10);
    }
  }

  private renderSampleWord(x: number, y: number, word: string): void {
    // Word length tag
    this.add
      .text(x, y, `[L${word.length}]`, {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '11px',
        color: '#52606d',
      })
      .setOrigin(0, 0.5)
      .setDepth(10);

    // Word text in Tektur
    this.add
      .text(x + 44, y, word, {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '18px',
        fontStyle: '600',
        color: '#f3f7fa',
      })
      .setOrigin(0, 0.5)
      .setDepth(10);
  }

  private renderWordPlate(
    centerX: number,
    centerY: number,
    word: string,
    typedCount: number,
    scale: number
  ): void {
    const advance = RENDERER_CONFIG.labelCharWidthPx * scale;
    const padding = RENDERER_CONFIG.labelPaddingPx * scale;
    const plateWidth = word.length * advance + padding;
    const plateHeight = RENDERER_CONFIG.plateHeightPx * scale;
    const fontSize = RENDERER_CONFIG.labelFontSizePx * scale;

    const container = this.add.container(centerX, centerY).setDepth(15);

    // Plate background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0e14, 0.94);
    bg.fillRoundedRect(-plateWidth / 2, -plateHeight / 2, plateWidth, plateHeight, 4 * scale);
    bg.lineStyle(1 * scale, 0xffb84a, 0.5);
    bg.strokeRoundedRect(-plateWidth / 2, -plateHeight / 2, plateWidth, plateHeight, 4 * scale);
    container.add(bg);

    // Letters layout with fixed-advance cell centering
    const startX = -((word.length - 1) * advance) / 2;

    for (let i = 0; i < word.length; i++) {
      const char = word[i] ?? '';
      let color = '#f3f7fa';
      if (i < typedCount) {
        color = '#52606d'; // Dimmed
      } else if (i === typedCount) {
        color = '#ffd37a'; // Active
      }

      const letterText = this.add
        .text(startX + i * advance, 0, char, {
          fontFamily: PHASER_FONT_FAMILY,
          fontSize: `${fontSize}px`,
          fontStyle: '600',
          color,
        })
        .setOrigin(0.5);
      container.add(letterText);

      // Active character underline
      if (i === typedCount) {
        const underline = this.add.graphics();
        underline.fillStyle(0xffb84a, 0.95);
        underline.fillRect(
          startX + i * advance - (advance / 2 - 2 * scale),
          8 * scale,
          advance - 4 * scale,
          2 * scale
        );
        container.add(underline);
      }
    }
  }

  private drawGrid(width: number, height: number): void {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0xffb84a, 0.04);
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
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, width),
        y: Phaser.Math.Between(0, height),
        speed: Phaser.Math.FloatBetween(0.1, 0.4),
        alpha: Phaser.Math.FloatBetween(0.2, 0.6),
        size: Phaser.Math.Between(1, 2),
      });
    }
  }

  update(): void {
    const width = DESKTOP_VIEWPORT.width;
    const height = DESKTOP_VIEWPORT.height;
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
}
