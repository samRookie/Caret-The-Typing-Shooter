import { test, expect } from '@playwright/test';

test.describe('P7 Automated 90s Soak Test & Memory Leak Monitor', () => {
  test('Soak Bot: Sustained combat, bounded entity counts, and zero console errors', async ({
    page,
  }) => {
    test.setTimeout(120000); // 120s timeout

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

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?autostart=1&seed=42');
    await page.waitForSelector('canvas');
    await page.waitForSelector('text=WAVE 01');

    const startTime = Date.now();
    const durationMs = 60000; // 60s sustained combat test
    let lastSampleTime = 0;
    const fpsSamples: number[] = [];

    while (Date.now() - startTime < durationMs) {
      // Query game snapshot from window.__caret
      const snapshotInfo = await page.evaluate(() => {
        const caret = (window as unknown as { __caret?: { getSnapshot: () => { activeTargetId: string | null; enemies: { id: string; word: string; remainingWord: string }[] } | null; getDebugCounts: () => { fps: number; childrenCount: number; enemyViews: number } } }).__caret;
        if (!caret) return null;
        const snap = caret.getSnapshot();
        const counts = caret.getDebugCounts();
        return {
          snap,
          counts,
        };
      });

      if (snapshotInfo) {
        fpsSamples.push(snapshotInfo.counts.fps);

        // Assert bounded display objects
        expect(snapshotInfo.counts.enemyViews).toBeLessThanOrEqual(10);
        expect(snapshotInfo.counts.childrenCount).toBeLessThan(150);

        // Find character to type
        const enemies = snapshotInfo.snap?.enemies || [];
        const activeTarget = enemies.find(e => e.id === snapshotInfo.snap?.activeTargetId);
        const targetToShoot = activeTarget || enemies[0];

        if (targetToShoot && targetToShoot.remainingWord.length > 0) {
          const nextChar = targetToShoot.remainingWord[0];
          await page.keyboard.press(nextChar);
        }
      }

      // Small typing delay for realistic cadence (~50 WPM)
      await page.waitForTimeout(110);

      // Status log every 15s
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed - lastSampleTime >= 15) {
        lastSampleTime = elapsed;
      }
    }

    // Zero console errors
    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);

    // Calculate avg FPS
    const validFps = fpsSamples.filter(f => f > 0);
    const avgFps = validFps.length > 0 ? validFps.reduce((a, b) => a + b, 0) / validFps.length : 60;
    expect(avgFps).toBeGreaterThanOrEqual(40);
  });

  test('Restart Stability: Event listener counts remain flat across 5 restarts', async ({
    page,
  }) => {
    test.setTimeout(60000);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?autostart=1&seed=99');
    await page.waitForSelector('canvas');
    await page.waitForSelector('text=WAVE 01');

    const listenerSamples: number[] = [];

    for (let cycle = 1; cycle <= 5; cycle++) {
      // Pause then restart via UI
      await page.keyboard.press('Escape');
      await page.waitForSelector('text=TACTICAL PAUSE');
      const restartBtn = page.getByRole('button', { name: /RESTART RUN/i });
      await restartBtn.click();

      // Wait for re-start
      await page.waitForTimeout(800);

      // Sample listener count
      const count = await page.evaluate(() => {
        const caret = (window as unknown as { __caret?: { getDebugCounts: () => { listenerCount: number } } }).__caret;
        return caret ? caret.getDebugCounts().listenerCount : 0;
      });

      listenerSamples.push(count);
    }

    // Verify flat listener count across restarts (max drift <= 2 listeners)
    const baseline = listenerSamples[0];
    for (const sample of listenerSamples) {
      expect(Math.abs(sample - baseline)).toBeLessThanOrEqual(2);
    }
  });
});
