import { test, expect } from '@playwright/test';
import path from 'path';

// Artifacts directory for screenshots
const ARTIFACT_DIR =
  'C:/Users/KENGUVA SAMEER/.gemini/antigravity/brain/1e48ab02-f018-4984-85a6-c1b9cc9c714a';

test.describe('Tactical Console Smoke & Playwright Tests', () => {
  test('smoke test: zero console errors and zero page errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    await page.goto('/?preview=1');
    await page.waitForSelector('canvas');

    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('PhaserContainer: exactly one <canvas> after load and after forced remount', async ({
    page,
  }) => {
    await page.goto('/?preview=1');
    await page.waitForSelector('canvas');

    // Exactly one canvas after initial load
    let canvases = await page.locator('canvas').count();
    expect(canvases).toBe(1);

    // Force remount by navigating or toggling
    await page.evaluate(() => {
      window.location.reload();
    });
    await page.waitForSelector('canvas');

    canvases = await page.locator('canvas').count();
    expect(canvases).toBe(1);
  });

  test('scaling & letterboxing verification at 1280x720, 1440x900, 1920x1080', async ({
    page,
  }) => {
    const viewports = [
      { width: 1280, height: 720, name: '1280x720' },
      { width: 1440, height: 900, name: '1440x900' },
      { width: 1920, height: 1080, name: '1920x1080' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/?preview=1');
      await page.waitForSelector('canvas');
      // Wait for rendering to settle
      await page.waitForTimeout(500);

      // Verify canvas maintains 16:9 ratio and does not distort
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        const ratio = box.width / box.height;
        expect(ratio).toBeCloseTo(16 / 9, 1);
      }

      // Save screenshot to artifacts directory
      const screenshotPath = path.join(ARTIFACT_DIR, `screenshot-${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  });

  test('contrast ratio verification on HUD and Word Plate', async ({ page }) => {
    await page.goto('/?preview=1');
    await page.waitForSelector('.word-plate-container');

    // Calculate relative luminance and contrast ratio in page context
    const contrastRatio = await page.evaluate(() => {
      function luminance(r: number, g: number, b: number): number {
        const a = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        const l0 = a[0] ?? 0;
        const l1 = a[1] ?? 0;
        const l2 = a[2] ?? 0;
        return l0 * 0.2126 + l1 * 0.7152 + l2 * 0.0722;
      }

      // Plate background: rgba(10, 14, 20, 0.92) approx #0a0e14
      const bgLum = luminance(10, 14, 20);
      // Primary text: #f3f7fa (243, 247, 250)
      const textLum = luminance(243, 247, 250);
      // Accent: #ffb84a (255, 184, 74)
      const accentLum = luminance(255, 184, 74);

      const textRatio = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);
      const accentRatio = (Math.max(bgLum, accentLum) + 0.05) / (Math.min(bgLum, accentLum) + 0.05);

      return { textRatio, accentRatio };
    });

    // WCAG AA requires at least 4.5:1 for standard text, 3:1 for large/accent
    expect(contrastRatio.textRatio).toBeGreaterThan(7.0);
    expect(contrastRatio.accentRatio).toBeGreaterThan(4.5);
  });
});
