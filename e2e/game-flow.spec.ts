import '../src/vite-env.d.ts';
import { test, expect } from '@playwright/test';

test.describe('Step 8 — Game Flow: Menu, HUD Binding, Pause, Game Over, Restart', () => {
  test('complete user flow: Menu -> Play -> Type word -> Esc Pause/Resume -> Blur safety -> Game Over -> Restart', async ({
    page,
  }) => {
    // Allow up to 60s for full loop including enemies reaching hull for game-over
    test.setTimeout(65000);

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

    // ------------------------------------------------------------------------
    // 1. Initial Load: Loading -> Menu
    // ------------------------------------------------------------------------
    await page.goto('/?seed=1337&debug=1');
    await page.waitForSelector('canvas');

    // Exactly one canvas
    let canvases = await page.locator('canvas').count();
    expect(canvases).toBe(1);

    // Wait for Menu screen to be visible after BootScene preloading finishes
    const playButton = page.getByRole('button', { name: /INITIATE ENGAGEMENT/i });
    await expect(playButton).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/COMMAND HEADQUARTERS/i)).toBeVisible();

    // Verify how-to-play text is displayed on Menu
    await expect(page.getByText(/Type the first letter of a ship's word to lock on/i)).toBeVisible();

    // ------------------------------------------------------------------------
    // 2. Start Game: Menu -> Running
    // ------------------------------------------------------------------------
    await playButton.click();

    // HUD becomes visible
    await expect(page.getByText('SCORE')).toBeVisible();
    await expect(page.getByText('WAVE')).toBeVisible();
    await expect(page.getByRole('progressbar', { name: /hull integrity/i })).toBeVisible();

    // Verify window.__caret is active
    await page.waitForFunction(() => typeof window.__caret !== 'undefined');

    // Record baseline display counts right after start
    const firstStartCounts = await page.evaluate(() => {
      return window.__caret!.getDebugCounts();
    });
    expect(firstStartCounts).not.toBeNull();
    console.log('[First Start Debug Counts]:', JSON.stringify(firstStartCounts));

    // ------------------------------------------------------------------------
    // 3. Type a Known Word: Read from window.__caret
    // ------------------------------------------------------------------------
    await page.waitForFunction(
      () => {
        const snap = window.__caret?.getSnapshot();
        return snap && snap.enemies.length > 0;
      },
      { timeout: 10000 }
    );

    const snapshotBeforeKill = await page.evaluate(() => window.__caret!.getSnapshot()!);
    const targetEnemy = snapshotBeforeKill.enemies[0]!;
    const targetWord = targetEnemy.word;
    const targetId = targetEnemy.id;

    // Type the word sequentially
    for (const char of targetWord) {
      await page.keyboard.press(char);
      await page.waitForTimeout(30);
    }

    // Wait for enemy destruction and score increase
    await page.waitForFunction(
      (id) => {
        const snap = window.__caret?.getSnapshot();
        return (
          snap &&
          snap.scoring.score > 0 &&
          !snap.enemies.some((e: { id: string }) => e.id === id)
        );
      },
      targetId,
      { timeout: 5000 }
    );

    const postKillSnapshot = await page.evaluate(() => window.__caret!.getSnapshot()!);
    expect(postKillSnapshot.scoring.score).toBeGreaterThan(0);

    // Assert DOM HUD reflects real simulation score
    const hudScoreElement = page.locator('text=SCORE').locator('..').locator('span').nth(1);
    const displayedScore = await hudScoreElement.textContent();
    expect(Number(displayedScore)).toBe(postKillSnapshot.scoring.score);

    // ------------------------------------------------------------------------
    // 4. Esc Pause & Resume Flow
    // ------------------------------------------------------------------------
    await page.keyboard.press('Escape');
    const pauseDialog = page.getByRole('dialog');
    await expect(pauseDialog).toBeVisible();
    await expect(page.getByText(/TACTICAL PAUSE/i)).toBeVisible();

    // Press Escape again to resume
    await page.keyboard.press('Escape');
    await expect(pauseDialog).toBeHidden();

    // ------------------------------------------------------------------------
    // 5. Window Blur Safety: Pauses and NEVER auto-resumes
    // ------------------------------------------------------------------------
    // Dispatch window blur
    const tickBeforeBlur = await page.evaluate(() => window.__caret!.currentTick);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
    });

    // Assert paused dialog appears immediately
    await expect(pauseDialog).toBeVisible();

    // Wait 3 seconds during pause
    await page.waitForTimeout(3000);

    // Focus window back - must NOT auto-resume!
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await expect(pauseDialog).toBeVisible();

    // Resume via Resume button
    const resumeBtn = page.getByRole('button', { name: /RESUME ENGAGEMENT/i });
    await resumeBtn.click();
    await expect(pauseDialog).toBeHidden();

    const tickAfterResume = await page.evaluate(() => window.__caret!.currentTick);
    // Simulation must have stopped during pause: tick difference should be at most a few ticks (<= 5)
    const tickDeltaDuringPause = tickAfterResume - tickBeforeBlur;
    console.log(`[Blur Pause Tick Delta]: ${tickDeltaDuringPause} ticks (expected <= 5)`);
    expect(tickDeltaDuringPause).toBeLessThanOrEqual(5);

    // ------------------------------------------------------------------------
    // 6. Game Over Flow: Let enemies reach hull
    // ------------------------------------------------------------------------
    // Wait for player health to reach 0 and Game Over modal to appear
    const gameOverDialog = page.getByRole('dialog');
    await page.waitForFunction(
      () => {
        const snap = window.__caret?.getSnapshot();
        return snap && snap.status === 'game-over';
      },
      { timeout: 45000 }
    );

    await expect(gameOverDialog).toBeVisible();
    await expect(page.getByText(/VESSEL DESTROYED/i)).toBeVisible();
    await expect(page.getByText(/SIMULATION SEED:/i)).toBeVisible();
    await expect(page.getByText('1337')).toBeVisible();

    // ------------------------------------------------------------------------
    // 7. Restart Flow & Display Object Count Verification
    // ------------------------------------------------------------------------
    const restartButton = page.getByRole('button', { name: /RESTART/i });
    await expect(restartButton).toBeVisible();

    // Restart the run
    await restartButton.click();

    // Game is running again
    await expect(gameOverDialog).toBeHidden();
    await expect(page.getByText('SCORE')).toBeVisible();

    // Verify exactly one canvas
    canvases = await page.locator('canvas').count();
    expect(canvases).toBe(1);

    // Verify debug counts equal the first run's counts (or within identical baseline)
    const restartCounts = await page.evaluate(() => {
      return window.__caret!.getDebugCounts();
    });
    console.log('[Restarted Debug Counts]:', JSON.stringify(restartCounts));

    // Display-object child count and listener counts equal the first run's counts
    expect(restartCounts!.enemyViews).toBe(0);
    expect(restartCounts!.ghosts).toBe(0);
    expect(restartCounts!.projectiles).toBe(0);
    expect(restartCounts!.childrenCount).toBe(firstStartCounts!.childrenCount);
    expect(restartCounts!.listenerCount).toBe(firstStartCounts!.listenerCount);

    // ------------------------------------------------------------------------
    // 8. Zero Console Errors Throughout
    // ------------------------------------------------------------------------
    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });
});
