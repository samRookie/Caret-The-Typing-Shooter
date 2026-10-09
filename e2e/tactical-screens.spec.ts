import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = path.resolve(process.cwd(), 'artifacts/r1-p6');

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
});

test.describe('P6 Tactical Command Screens & Analytics Modals E2E Suite', () => {
  test('Case A (0 runs): Menu shows locked hint with 5 runs required and no SVG chart', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('caret.history.v1', JSON.stringify({ version: 1, runs: [] }));
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('text=COMMAND HEADQUARTERS');

    // Locked status hint
    const lockHint = page.locator('text=[TACTICAL TELEMETRY LOCKED: COMPLETE 5 MORE RUN(S) TO UNLOCK PROGRESS GRAPH]');
    await expect(lockHint).toBeVisible();

    // No chart
    const chart = page.locator('svg[role="img"]');
    await expect(chart).toHaveCount(0);

    // Capture screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'menu-0-runs-1280x720.png') });
  });

  test('Case B (4 runs): Menu shows hint counting down to 1 run remaining', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const runs = [
        { id: 1, endedAt: '', score: 100, wave: 1, maxStreak: 3, wordsDestroyed: 4, hits: 15, misses: 1, accuracy: 93.7, grossWpm: 20, netWpm: 18, durationSeconds: 30 },
        { id: 2, endedAt: '', score: 250, wave: 2, maxStreak: 5, wordsDestroyed: 8, hits: 30, misses: 2, accuracy: 93.7, grossWpm: 25, netWpm: 23, durationSeconds: 45 },
        { id: 3, endedAt: '', score: 400, wave: 2, maxStreak: 6, wordsDestroyed: 12, hits: 45, misses: 1, accuracy: 97.8, grossWpm: 30, netWpm: 28, durationSeconds: 60 },
        { id: 4, endedAt: '', score: 650, wave: 3, maxStreak: 8, wordsDestroyed: 18, hits: 65, misses: 3, accuracy: 95.5, grossWpm: 32, netWpm: 30, durationSeconds: 80 },
      ];
      localStorage.setItem('caret.history.v1', JSON.stringify({ version: 1, runs }));
    });

    await page.goto('/');
    await page.waitForSelector('text=COMMAND HEADQUARTERS');

    const lockHint = page.locator('text=[TACTICAL TELEMETRY LOCKED: COMPLETE 1 MORE RUN(S) TO UNLOCK PROGRESS GRAPH]');
    await expect(lockHint).toBeVisible();
  });

  test('Case C (6 runs): Menu unlocks SVG ProgressChart and all 4 metric tabs interact cleanly', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const runs = [
        { id: 1, endedAt: '', score: 100, wave: 1, maxStreak: 3, wordsDestroyed: 4, hits: 15, misses: 1, accuracy: 93.7, grossWpm: 20, netWpm: 18, durationSeconds: 30 },
        { id: 2, endedAt: '', score: 250, wave: 2, maxStreak: 5, wordsDestroyed: 8, hits: 30, misses: 2, accuracy: 93.7, grossWpm: 25, netWpm: 23, durationSeconds: 45 },
        { id: 3, endedAt: '', score: 400, wave: 2, maxStreak: 6, wordsDestroyed: 12, hits: 45, misses: 1, accuracy: 97.8, grossWpm: 30, netWpm: 28, durationSeconds: 60 },
        { id: 4, endedAt: '', score: 650, wave: 3, maxStreak: 8, wordsDestroyed: 18, hits: 65, misses: 3, accuracy: 95.5, grossWpm: 32, netWpm: 30, durationSeconds: 80 },
        { id: 5, endedAt: '', score: 950, wave: 4, maxStreak: 10, wordsDestroyed: 24, hits: 90, misses: 2, accuracy: 97.8, grossWpm: 35, netWpm: 34, durationSeconds: 100 },
        { id: 6, endedAt: '', score: 1200, wave: 5, maxStreak: 14, wordsDestroyed: 30, hits: 110, misses: 3, accuracy: 97.3, grossWpm: 38, netWpm: 37, durationSeconds: 120 },
      ];
      localStorage.setItem('caret.history.v1', JSON.stringify({ version: 1, runs }));
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('text=COMMAND HEADQUARTERS');

    // Chart must be mounted
    const chart = page.locator('svg[role="img"]');
    await expect(chart).toBeVisible();

    // Verify all 4 metric tabs
    for (const metric of ['WAVE', 'SCORE', 'ACCURACY', 'NET WPM']) {
      const tab = page.locator(`role=radio[name="${metric}"]`);
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(tab).toHaveAttribute('aria-checked', 'true');
    }

    // Capture screenshots at 1280x720 and 1440x900
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'menu-6-runs-1280x720.png') });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'menu-6-runs-1440x900.png') });
  });

  test('Case D (Game Over simulation): Debrief panel appears with exactly 1 new record in localStorage', async ({
    page,
  }) => {
    test.setTimeout(80000);

    await page.addInitScript(() => {
      localStorage.setItem('caret.history.v1', JSON.stringify({ version: 1, runs: [] }));
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    // Use autostart with seed 1337
    await page.goto('/?autostart=1&seed=1337');

    // Wait for game over modal to appear after drone collision
    await page.waitForSelector('text=MISSION DEBRIEFING', { timeout: 60000 });

    // Verify first run banner
    await expect(page.locator('text=FIRST MISSION LOGGED · WAVE 01')).toBeVisible();

    // Check localStorage count
    const historyData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('caret.history.v1') || '{}');
    });
    expect(historyData.runs).toHaveLength(1);

    // Capture screenshot of record debrief
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game-over-record-1280x720.png') });

    // Also capture preview game over modal (no record / defeat)
    await page.goto('/?preview=1');
    await page.waitForSelector('text=PREVIEW SWITCHBOARD');
    const previewGameOverBtn = page.getByRole('button', { name: /PREVIEW GAME OVER/i });
    if (await previewGameOverBtn.count() > 0) {
      await previewGameOverBtn.click();
      await page.waitForSelector('text=MISSION DEBRIEFING');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game-over-no-record-1280x720.png') });
    }
  });

  test('Case E (New Game & Return): BootStatusLine does NOT reappear on return to menu', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForSelector('text=COMMAND HEADQUARTERS');

    // Boot line might be in DOM or fading out
    const playBtn = page.getByRole('button', { name: /INITIATE ENGAGEMENT|NEW GAME/i });
    await playBtn.click();

    // Wait for in-game HUD
    await page.waitForSelector('text=WAVE 01');

    // Pause and quit to menu
    const pauseBtn = page.getByRole('button', { name: /PAUSE · ESC/i });
    await pauseBtn.click();
    await page.getByRole('button', { name: /QUIT TO MENU/i }).click();

    // Return to menu
    await page.waitForSelector('text=COMMAND HEADQUARTERS');
    // Boot status line must not be present
    const bootLine = page.locator('text=SYSTEM ONLINE // READY');
    await expect(bootLine).toHaveCount(0);
  });

  test('Case F (Reset Statistics): Settings modal confirms and clears history', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const runs = [
        { id: 1, endedAt: '', score: 100, wave: 1, maxStreak: 3, wordsDestroyed: 4, hits: 15, misses: 1, accuracy: 93.7, grossWpm: 20, netWpm: 18, durationSeconds: 30 },
        { id: 2, endedAt: '', score: 250, wave: 2, maxStreak: 5, wordsDestroyed: 8, hits: 30, misses: 2, accuracy: 93.7, grossWpm: 25, netWpm: 23, durationSeconds: 45 },
        { id: 3, endedAt: '', score: 400, wave: 2, maxStreak: 6, wordsDestroyed: 12, hits: 45, misses: 1, accuracy: 97.8, grossWpm: 30, netWpm: 28, durationSeconds: 60 },
        { id: 4, endedAt: '', score: 650, wave: 3, maxStreak: 8, wordsDestroyed: 18, hits: 65, misses: 3, accuracy: 95.5, grossWpm: 32, netWpm: 30, durationSeconds: 80 },
        { id: 5, endedAt: '', score: 950, wave: 4, maxStreak: 10, wordsDestroyed: 24, hits: 90, misses: 2, accuracy: 97.8, grossWpm: 35, netWpm: 34, durationSeconds: 100 },
      ];
      localStorage.setItem('caret.history.v1', JSON.stringify({ version: 1, runs }));
    });

    await page.goto('/');
    await page.waitForSelector('text=COMMAND HEADQUARTERS');

    // Open Tactical Settings
    await page.getByRole('button', { name: /TACTICAL SETTINGS/i }).click();
    await page.waitForSelector('text=CAREER TELEMETRY STORAGE');

    // Click Reset
    await page.getByRole('button', { name: /RESET CAREER STATISTICS/i }).click();
    await expect(page.locator('text=CONFIRM PURGE ALL PILOT RECORDS')).toBeVisible();

    // Confirm Purge
    await page.getByRole('button', { name: /CONFIRM PURGE/i }).click();

    // Close settings
    await page.getByRole('button', { name: /APPLY & RETURN/i }).click();

    // Telemetry lock hint must reset to 5 runs
    await expect(
      page.locator('text=[TACTICAL TELEMETRY LOCKED: COMPLETE 5 MORE RUN(S) TO UNLOCK PROGRESS GRAPH]')
    ).toBeVisible();
  });

  test('Case G (Corrupted History Resiliency): Recovers gracefully from malformed JSON', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('caret.history.v1', '{corrupt json payload!!}');
    });

    await page.goto('/');
    await page.waitForSelector('text=COMMAND HEADQUARTERS');

    // Menu renders without crashing
    await expect(page.locator('text=CARET: THE TYPING SHOOTER')).toBeVisible();
  });

  test('Case H (Zero Difficulty Controls): Strictly no difficulty selection controls in DOM', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForSelector('text=COMMAND HEADQUARTERS');

    const difficultyElements = page.locator('text=/EASY|NORMAL|HARD|NIGHTMARE|DIFFICULTY/i');
    await expect(difficultyElements).toHaveCount(0);
  });
});
