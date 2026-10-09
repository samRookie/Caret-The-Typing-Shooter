import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.resolve(process.cwd(), 'artifacts/r1-final');

test.beforeAll(() => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
});

const SIX_RUNS = [
  { id: 1, endedAt: '', score: 100, wave: 1, maxStreak: 3, wordsDestroyed: 4, hits: 15, misses: 1, accuracy: 93.7, grossWpm: 20, netWpm: 18, durationSeconds: 30 },
  { id: 2, endedAt: '', score: 250, wave: 2, maxStreak: 5, wordsDestroyed: 8, hits: 30, misses: 2, accuracy: 93.7, grossWpm: 25, netWpm: 23, durationSeconds: 45 },
  { id: 3, endedAt: '', score: 400, wave: 2, maxStreak: 6, wordsDestroyed: 12, hits: 45, misses: 1, accuracy: 97.8, grossWpm: 30, netWpm: 28, durationSeconds: 60 },
  { id: 4, endedAt: '', score: 650, wave: 3, maxStreak: 8, wordsDestroyed: 18, hits: 65, misses: 3, accuracy: 95.5, grossWpm: 32, netWpm: 30, durationSeconds: 80 },
  { id: 5, endedAt: '', score: 950, wave: 4, maxStreak: 10, wordsDestroyed: 24, hits: 90, misses: 2, accuracy: 97.8, grossWpm: 35, netWpm: 34, durationSeconds: 100 },
  { id: 6, endedAt: '', score: 1200, wave: 5, maxStreak: 14, wordsDestroyed: 30, hits: 110, misses: 3, accuracy: 97.3, grossWpm: 38, netWpm: 37, durationSeconds: 120 },
];

const VIEWPORTS = [
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1024x600', width: 1024, height: 600 },
  { name: '1440x900-retina', width: 1440, height: 900 },
];

test.describe('P7 Visual Screenshot Matrix Across Resolutions', () => {
  for (const vp of VIEWPORTS) {
    test(`Capture visual matrix at ${vp.name}`, async ({ page }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Menu with 0 runs (locked graph hint)
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('caret.history.v1', JSON.stringify({ version: 1, runs: [] }));
      });
      await page.reload();
      await page.waitForSelector('text=COMMAND HEADQUARTERS');
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `menu-0-runs-${vp.name}.png`),
      });

      // 2. Menu with 6 runs (unlocked SVG graph)
      await page.evaluate((runs) => {
        localStorage.setItem('caret.history.v1', JSON.stringify({ version: 1, runs }));
      }, SIX_RUNS);
      await page.reload();
      await page.waitForSelector('svg[role="img"]');
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `menu-6-runs-${vp.name}.png`),
      });

      // 3. Game Over (Record broken debrief modal via preview switchboard)
      await page.goto('/?preview=1');
      await page.waitForSelector('text=PREVIEW SWITCHBOARD');
      const gameOverBtn = page.getByRole('button', { name: /PREVIEW GAME OVER/i });
      await gameOverBtn.click();
      await page.waitForSelector('text=MISSION DEBRIEFING');
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `gameover-record-${vp.name}.png`),
      });

      // 4. Combat Scene (active play)
      await page.goto('/?autostart=1&seed=1337');
      await page.waitForSelector('canvas');
      await page.waitForSelector('text=WAVE 01');
      // Allow enemy drones to spawn and move into play
      await page.waitForTimeout(3500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `combat-${vp.name}.png`),
      });
    });
  }
});
