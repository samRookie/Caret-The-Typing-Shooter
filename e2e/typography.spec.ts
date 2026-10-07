import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Typography & Tektur Migration (Spec 4.E)', () => {
  test('zero requests to external Google Fonts during navigation and gameplay', async ({
    page,
  }) => {
    const externalFontRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        externalFontRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start game
    const enterButton = page.locator('button:has-text("INITIATE ENGAGEMENT")');
    await expect(enterButton).toBeVisible();
    await enterButton.click();

    // Wait a brief moment in gameplay
    await page.waitForTimeout(1500);

    expect(externalFontRequests).toEqual([]);
  });

  test('all visible DOM text elements use Tektur font family', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the primary menu to render
    const menuTitle = page.locator('h1');
    await expect(menuTitle).toBeVisible();

    // Check font of visible DOM text elements
    const elements = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('h1, h2, p, span, button, a'));
      return all
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          const text = el.textContent?.trim() ?? '';
          return rect.width > 0 && rect.height > 0 && text.length > 0;
        })
        .map((el) => {
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            text: el.textContent?.trim().slice(0, 30),
            fontFamily: style.fontFamily,
          };
        });
    });

    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      // Must contain or start with Tektur
      expect(el.fontFamily).toMatch(/Tektur/i);
    }
  });

  test('document.fonts contains loaded Tektur weights', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const fontCheckResults = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        hasTektur400: document.fonts.check('400 14px Tektur'),
        hasTektur500: document.fonts.check('500 16px Tektur'),
        hasTektur600: document.fonts.check('600 18px Tektur'),
        hasTektur700: document.fonts.check('700 48px Tektur'),
      };
    });

    expect(fontCheckResults.hasTektur400).toBe(true);
    expect(fontCheckResults.hasTektur500).toBe(true);
    expect(fontCheckResults.hasTektur600).toBe(true);
    expect(fontCheckResults.hasTektur700).toBe(true);
  });

  test('captures dev legibility sheet screenshot under ?preview=1', async ({ page }) => {
    // Navigate to preview scene
    await page.goto('/?preview=1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow Phaser to render test sheet

    // Ensure artifact directory exists
    const artifactDir = path.resolve(process.cwd(), 'artifacts/font-check');
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }

    const screenshotPath = path.join(artifactDir, 'tektur-legibility-sheet.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    expect(fs.existsSync(screenshotPath)).toBe(true);
  });
});
