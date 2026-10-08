import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const VIEWPORTS = [
  { width: 1280, height: 720, label: '1280x720' },
  { width: 1440, height: 900, label: '1440x900' },
  { width: 1920, height: 1080, label: '1920x1080' },
  { width: 1024, height: 600, label: '1024x600' },
];

test.describe('Tactical Viewport Shell, Top Strip & HUD Layout (Spec 5.H)', () => {
  test.beforeAll(() => {
    const artifactDir = path.resolve(process.cwd(), 'artifacts/r1-p5');
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
  });

  for (const vp of VIEWPORTS) {
    test(`verifies tactical layout and sprite metrics at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Navigate with autostart=1, fixed seed=1337, debug=1
      await page.goto('/?autostart=1&seed=1337&debug=1');

      // Wait for canvas to mount and game to initialize
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });
      await page.waitForFunction(() => typeof window.__caret !== 'undefined');

      // TopStrip check: sits in row 1, outside canvas
      const topStrip = page.locator('.top-strip');
      await expect(topStrip).toBeVisible();

      const topStripBox = await topStrip.boundingBox();
      const canvasBox = await canvas.boundingBox();

      expect(topStripBox).not.toBeNull();
      expect(canvasBox).not.toBeNull();

      if (topStripBox && canvasBox) {
        // Rule 5.B: top-strip bottom <= canvas top (with 1px subpixel tolerance)
        expect(topStripBox.y + topStripBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
      }

      // Check TopStrip metrics are rendered
      await expect(topStrip.getByText(/WAVE 01/i)).toBeVisible();
      await expect(page.getByRole('status', { name: /Hull integrity/i })).toBeVisible();
      await expect(page.getByRole('timer')).toBeVisible();

      // WingBoxes: streak & score
      const streakBox = page.getByTestId('wing-streak-box');
      const scoreBox = page.getByTestId('wing-score-box');
      await expect(streakBox).toBeVisible();
      await expect(scoreBox).toBeVisible();

      const streakBBox = await streakBox.boundingBox();
      const scoreBBox = await scoreBox.boundingBox();

      expect(streakBBox).not.toBeNull();
      expect(scoreBBox).not.toBeNull();

      if (streakBBox && scoreBBox && canvasBox) {
        const bottom20Threshold = canvasBox.y + canvasBox.height * 0.8;
        const left30Threshold = canvasBox.x + canvasBox.width * 0.3;
        const right70Threshold = canvasBox.x + canvasBox.width * 0.7;

        // Rule 5.D: strictly in bottom 20% of viewport (y >= 80%)
        expect(streakBBox.y).toBeGreaterThanOrEqual(bottom20Threshold - 2);
        expect(scoreBBox.y).toBeGreaterThanOrEqual(bottom20Threshold - 2);

        // Rule 5.D: strictly within 20% of horizontal center (30% <= x <= 70%)
        expect(streakBBox.x).toBeGreaterThanOrEqual(left30Threshold - 2);
        expect(scoreBBox.x + scoreBBox.width).toBeLessThanOrEqual(right70Threshold + 2);

        // Top 80% clear: no HUD box intersects upper 80%
        expect(streakBBox.y).toBeGreaterThanOrEqual(bottom20Threshold - 2);
        expect(scoreBBox.y).toBeGreaterThanOrEqual(bottom20Threshold - 2);
      }

      // WaveBanner verification: visible at start with "WAVE 01"
      const waveBanner = page.getByTestId('wave-banner');
      await expect(waveBanner).toBeVisible();
      await expect(waveBanner).toContainText('WAVE 01');

      // Removals verification (Rule R-C): no TARGET LOCK, no multiplier, no TACTICAL COMMAND CONSOLE
      const domText = await page.content();
      expect(domText).not.toContain('TARGET LOCK');
      expect(domText).not.toContain('TACTICAL COMMAND CONSOLE');
      expect(page.getByText('MULTIPLIER')).toHaveCount(0);

      // Wait for first drone spawn to measure sprite metrics
      await page.waitForFunction(
        () => {
          const metrics = window.__caret?.getViewMetrics?.();
          return metrics && metrics.drones.length > 0;
        },
        { timeout: 15000 }
      );

      // Measure sprite dimensions & label plate headroom
      const viewMetrics = await page.evaluate(() => window.__caret!.getViewMetrics!());
      expect(viewMetrics).not.toBeNull();

      if (viewMetrics) {
        // Ship target size ~60x87 px (+-3 px tolerance)
        expect(viewMetrics.playerShip.displayWidth).toBeGreaterThanOrEqual(57);
        expect(viewMetrics.playerShip.displayWidth).toBeLessThanOrEqual(63);
        expect(viewMetrics.playerShip.displayHeight).toBeGreaterThanOrEqual(84);
        expect(viewMetrics.playerShip.displayHeight).toBeLessThanOrEqual(90);

        // Drone target width ~44 px (+-3 px tolerance)
        for (const drone of viewMetrics.drones) {
          expect(drone.displayWidth).toBeGreaterThanOrEqual(41);
          expect(drone.displayWidth).toBeLessThanOrEqual(47);
        }

        // Label plate headroom >= 6 px
        expect(viewMetrics.labelPlateHeadroomMin).toBeGreaterThanOrEqual(6);
      }

      // Capture screenshot for visual inspection
      const screenshotPath = path.resolve(
        process.cwd(),
        `artifacts/r1-p5/viewport-${vp.label}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
    });
  }
});
