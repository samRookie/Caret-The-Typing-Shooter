import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { THEME, PHASER_FONT_FAMILY } from '@/shared/theme';
import { RENDERER_CONFIG } from '@/shared/config/defaultConfig';

describe('Typography & Tektur Migration (Spec 4.E)', () => {
  it('exports PHASER_FONT_FAMILY as Tektur', () => {
    expect(PHASER_FONT_FAMILY).toBe('Tektur');
  });

  it('configures RENDERER_CONFIG.labelFontFamily as Tektur', () => {
    expect(RENDERER_CONFIG.labelFontFamily).toBe('Tektur');
  });

  it('defines all THEME typography tokens with Tektur', () => {
    expect(THEME.typography.fontDisplay).toContain('Tektur');
    expect(THEME.typography.fontCondensed).toContain('Tektur');
    expect(THEME.typography.fontSans).toContain('Tektur');
    expect(THEME.typography.fontMono).toContain('Tektur');
  });

  it('preserves SIL Open Font License 1.1 in third_party/tektur/OFL.txt', () => {
    const oflPath = path.resolve(process.cwd(), 'third_party/tektur/OFL.txt');
    expect(fs.existsSync(oflPath)).toBe(true);
    const content = fs.readFileSync(oflPath, 'utf8');
    expect(content).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(content).toContain('Copyright 2023 The Tektur Project Authors');
  });

  it('contains zero source references to legacy Kenney fonts in src/', () => {
    const srcDir = path.resolve(process.cwd(), 'src');

    function checkDir(dir: string): void {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (
          entry.isFile() &&
          /\.(ts|tsx|css|html)$/.test(entry.name) &&
          entry.name !== 'typography.test.ts'
        ) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const forbidden1 = ['Kenney', 'Future'].join('');
          const forbidden2 = ['kenney-', 'future'].join('');
          expect(content).not.toContain(forbidden1);
          expect(content).not.toContain(forbidden2);
        }
      }
    }

    checkDir(srcDir);
  });

  it('confirms old font files were removed from public/assets/fonts', () => {
    const fontsDir = path.resolve(process.cwd(), 'public/assets/fonts');
    if (fs.existsSync(fontsDir)) {
      const files = fs.readdirSync(fontsDir);
      expect(files).not.toContain('kenney-future.ttf');
      expect(files).not.toContain('kenney-future-narrow.ttf');
    }
  });
});
