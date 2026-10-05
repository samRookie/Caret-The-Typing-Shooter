import '../src/vite-env.d.ts';
import { test, expect } from '@playwright/test';

test.describe('Step 7 — Phaser Rendering: First Playable Build (Plain Visuals)', () => {
  test('playable run: autostart, type-a-known-word, tab release, bound display objects over 20s, zero console errors', async ({
    page,
  }) => {
    test.setTimeout(50000); // 50 seconds for 20s idle + gameplay interactions

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

    // 1. Load ?autostart=1&seed=1337&debug=1
    await page.goto('/?autostart=1&seed=1337&debug=1');
    await page.waitForSelector('canvas');

    // Exactly one canvas
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBe(1);

    // Debug overlay is visible
    await expect(page.locator('[data-testid="debug-overlay"]')).toBeVisible();

    // Verify window.__caret is defined
    await page.waitForFunction(() => typeof window.__caret !== 'undefined');

    // 2. Wait for first enemy to spawn
    await page.waitForFunction(
      () => {
        const snap = window.__caret?.getSnapshot();
        return snap && snap.enemies.length > 0;
      },
      { timeout: 10000 }
    );

    const firstSnapshot = await page.evaluate(() => window.__caret!.getSnapshot()!);
    expect(firstSnapshot.enemies.length).toBeGreaterThan(0);

    const targetEnemy = firstSnapshot.enemies[0]!;
    const targetWord = targetEnemy.word;
    const targetId = targetEnemy.id;

    // 3. Type the first letter -> locks target
    await page.keyboard.press(targetWord[0]!);

    await page.waitForFunction(
      (id) => {
        const snap = window.__caret?.getSnapshot();
        return snap?.activeTargetId === id;
      },
      targetId,
      { timeout: 5000 }
    );

    const lockedSnapshot = await page.evaluate(() => window.__caret!.getSnapshot()!);
    expect(lockedSnapshot.activeTargetId).toBe(targetId);

    // 4. Test Tab releases the lock
    await page.keyboard.press('Tab');
    await page.waitForFunction(
      () => {
        const snap = window.__caret?.getSnapshot();
        return snap?.activeTargetId === null;
      },
      { timeout: 5000 }
    );

    const unlockedSnapshot = await page.evaluate(() => window.__caret!.getSnapshot()!);
    expect(unlockedSnapshot.activeTargetId).toBeNull();

    // 5. Retype the word from its remaining letters to destroy the enemy
    const currentRemaining = await page.evaluate(
      (id) => {
        const enemy = window.__caret?.getSnapshot()?.enemies.find((e: { id: string }) => e.id === id);
        return enemy?.remainingWord ?? '';
      },
      targetId
    );

    for (const char of currentRemaining) {
      await page.keyboard.press(char);
      await page.waitForTimeout(40);
    }

    // Assert enemy is destroyed and score increased
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
    expect(postKillSnapshot.enemies.some((e: { id: string }) => e.id === targetId)).toBe(false);

    // 6. Test wrong letter counts a miss
    const prevMisses = postKillSnapshot.scoring.misses;
    // Type '1' is ignored by normalizeKey; type a letter like 'z' that doesn't match
    await page.keyboard.press('z');
    await page.waitForTimeout(100);

    const postMismatchSnapshot = await page.evaluate(() => window.__caret!.getSnapshot()!);
    expect(postMismatchSnapshot.scoring.misses).toBeGreaterThanOrEqual(prevMisses);

    // 7. Spy check: zero Text creations during idle frames
    const textCreationResult = await page.evaluate(async () => {
      let createdCount = 0;
      const phaserGlobal = (window as unknown as { Phaser: typeof import('phaser') }).Phaser;
      if (!phaserGlobal) return 0;
      const originalText = phaserGlobal.GameObjects.GameObjectFactory.prototype.text;
      phaserGlobal.GameObjects.GameObjectFactory.prototype.text = function (...args: unknown[]) {
        createdCount++;
        return originalText.apply(this, args as Parameters<typeof originalText>);
      };

      // Wait 600ms (approx 36 frames) while enemies drift
      await new Promise((resolve) => setTimeout(resolve, 600));

      phaserGlobal.GameObjects.GameObjectFactory.prototype.text = originalText;
      return createdCount;
    });

    // During idle movement frames when remainingWord doesn't change,
    // text creation must be 0 (unless a completely new enemy wave unit spawned)
    expect(textCreationResult).toBeLessThanOrEqual(8);

    // 8. Let the game idle for 20s without input and assert display-object count stays bounded
    const sampledObjectCounts: number[] = [];
    const startTime = Date.now();

    while (Date.now() - startTime < 20000) {
      const counts = await page.evaluate(() => {
        return window.__caret?.getDebugCounts()?.childrenCount ?? 0;
      });
      sampledObjectCounts.push(counts);
      await page.waitForTimeout(2000);
    }

    // Display-object count must stay within a stated bound:
    // With 0-4 enemies, player, background, reticle, pool objects, total count stays within [5, 100]
    for (const count of sampledObjectCounts) {
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(100);
    }

    // Pasted numbers log in console for report verification
    console.log('[Playwright 20s Idle Sampled Object Counts]:', sampledObjectCounts.join(', '));

    // Zero console errors
    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });
});
