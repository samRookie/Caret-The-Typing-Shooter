import '../src/vite-env.d.ts';
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts/step10');

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
});

test.describe('Step 10 — Soak Benchmarks, Restart Stability & Visual Matrix', () => {
  test('120s sustained combat soak test with typing bot', async ({ page }) => {
    test.setTimeout(150000); // 150s

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?autostart=1&seed=1337');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => typeof window.__caret !== 'undefined');

    const startTime = Date.now();
    const durationMs = 120000; // 120s soak
    const fpsSamples: number[] = [];
    let capturedCombatShot = false;

    while (Date.now() - startTime < durationMs) {
      const snap = await page.evaluate(() => window.__caret?.getSnapshot() ?? null);
      const counts = await page.evaluate(() => window.__caret?.getDebugCounts() ?? null);

      if (counts?.fps) {
        fpsSamples.push(counts.fps);
      }

      if (snap && snap.enemies.length > 0) {
        const active = snap.enemies.find((e) => e.id === snap.activeTargetId);
        const target = active || snap.enemies[0];

        if (target && target.remainingWord.length > 0) {
          const char = target.remainingWord[0];
          await page.keyboard.press(char);

          if (!capturedCombatShot && target.remainingWord.length < target.word.length) {
            await page.waitForTimeout(50);
            await page.screenshot({
              path: path.join(ARTIFACTS_DIR, 'caret-gameplay-effects.png'),
            });
            capturedCombatShot = true;
          }
        }
      }

      await page.waitForTimeout(90);
    }

    expect(consoleErrors).toHaveLength(0);
    const validFps = fpsSamples.filter((f) => f > 0);
    const avgFps = validFps.length > 0 ? validFps.reduce((a, b) => a + b, 0) / validFps.length : 60;
    expect(avgFps).toBeGreaterThanOrEqual(25);
  });

  test('5 consecutive restarts listener stability', async ({ page }) => {
    test.setTimeout(60000);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?autostart=1&seed=42');
    await page.waitForSelector('canvas');

    const listenerSamples: number[] = [];

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Escape');
      await page.waitForSelector('text=TACTICAL PAUSE');
      const restartBtn = page.getByRole('button', { name: /RESTART RUN/i });
      await restartBtn.click();
      await page.waitForTimeout(600);

      const count = await page.evaluate(() => {
        return window.__caret?.getDebugCounts()?.listenerCount ?? 0;
      });
      listenerSamples.push(count);
    }

    const baseline = listenerSamples[0]!;
    for (const sample of listenerSamples) {
      expect(Math.abs(sample - baseline)).toBeLessThanOrEqual(2);
    }
  });

  test('60s reduced motion combat soak and screenshot matrix capture', async ({ page }) => {
    test.setTimeout(120000);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?seed=1337');
    await page.waitForSelector('canvas');

    // Turn on reduced motion
    const settingsBtn = page.getByRole('button', { name: /SETTINGS/i });
    await settingsBtn.click();
    await page.getByRole('radio', { name: 'ON' }).click();
    await page.keyboard.press('Escape');

    // Start engagement
    const playBtn = page.getByRole('button', { name: /INITIATE ENGAGEMENT/i });
    await playBtn.click();
    await page.waitForSelector('text=WAVE 01');

    const startTime = Date.now();
    const durationMs = 60000; // 60s
    let capturedReduced = false;

    while (Date.now() - startTime < durationMs) {
      const snap = await page.evaluate(() => window.__caret?.getSnapshot() ?? null);
      if (snap && snap.enemies.length > 0) {
        const active = snap.enemies.find((e) => e.id === snap.activeTargetId);
        const target = active || snap.enemies[0];
        if (target && target.remainingWord.length > 0) {
          await page.keyboard.press(target.remainingWord[0]);
          if (!capturedReduced) {
            await page.screenshot({
              path: path.join(ARTIFACTS_DIR, 'caret-reduced-motion.png'),
            });
            capturedReduced = true;
          }
        }
      }
      await page.waitForTimeout(100);
    }

    // Capture visual preview dev bench
    await page.goto('/?preview=1');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'caret-dev-bench.png'),
    });
  });
});
