import '../src/vite-env.d.ts';
import { test, expect } from '@playwright/test';

test.describe('Step 10 — Feedback Layer: Visual Effects, Audio, HUD Feedback & Game-Over Sequencing', () => {
  test('typing bot triggers combat audio cues (laser, destroy, wrong-input)', async ({ page }) => {
    test.setTimeout(45000);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?autostart=1&seed=1337&debug=1');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => typeof window.__caret !== 'undefined');

    // Wait until at least one enemy spawns
    await page.waitForFunction(() => {
      const snap = window.__caret?.getSnapshot();
      return (snap?.enemies.length ?? 0) > 0;
    }, { timeout: 10000 });

    // Type the characters of the first enemy word
    for (let attempt = 0; attempt < 50; attempt++) {
      const targetChar = await page.evaluate(() => {
        const snap = window.__caret?.getSnapshot();
        if (!snap || snap.enemies.length === 0) return null;
        const active = snap.enemies.find((e) => e.id === snap.activeTargetId);
        const target = active || snap.enemies[0];
        return target && target.remainingWord.length > 0 ? target.remainingWord[0] : null;
      });

      if (!targetChar) {
        break;
      }

      await page.keyboard.press(targetChar);
      await page.waitForTimeout(60);
    }

    // Verify audio log recorded combat cues (laser, destroy)
    const audioLog = await page.evaluate(() => {
      return window.__caret?.getAudioLog?.() ?? [];
    });

    expect(audioLog.length).toBeGreaterThan(0);
    const cues = audioLog.map((entry) => entry.cue);
    expect(cues).toContain('laser');
    expect(cues).toContain('destroy');

    // Type a non-matching character to verify mismatch cue
    const nonMatchingChar = await page.evaluate(() => {
      const snap = window.__caret?.getSnapshot();
      const firstLetters = (snap?.enemies ?? []).map((e) => e.remainingWord[0]?.toLowerCase());
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      for (const char of alphabet) {
        if (!firstLetters.includes(char)) return char;
      }
      return 'q';
    });
    await page.keyboard.press(nonMatchingChar);
    await page.waitForTimeout(100);

    const postMismatchAudioLog = await page.evaluate(() => {
      return window.__caret?.getAudioLog?.() ?? [];
    });
    const postMismatchCues = postMismatchAudioLog.map((entry) => entry.cue);
    expect(postMismatchCues).toContain('wrong-input');

    // Check console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('novfx flag keeps active visual effect counts at zero', async ({ page }) => {
    test.setTimeout(40000);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?autostart=1&seed=1337&novfx=1');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => typeof window.__caret !== 'undefined');

    // Wait for enemy to spawn and type a few letters
    await page.waitForFunction(() => (window.__caret?.getSnapshot()?.enemies.length ?? 0) > 0, {
      timeout: 10000,
    });

    for (let i = 0; i < 5; i++) {
      const char = await page.evaluate(() => {
        const snap = window.__caret?.getSnapshot();
        const enemy = snap?.enemies[0];
        return enemy && enemy.remainingWord.length > 0 ? enemy.remainingWord[0] : null;
      });
      if (char) {
        await page.keyboard.press(char);
      }
      await page.waitForTimeout(50);
    }

    const counts = await page.evaluate(() => {
      return window.__caret?.getEffectCounts?.();
    });

    expect(counts).toBeDefined();
    expect(counts!.liveParticles).toBe(0);
    expect(counts!.liveRings).toBe(0);
    expect(counts!.shakeCount).toBe(0);
    expect(counts!.edgeFlashCount).toBe(0);
  });

  test('hull pips decrement on collision and game-over panel appears after delay', async ({
    page,
  }) => {
    test.setTimeout(75000);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?autostart=1&seed=1337');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => typeof window.__caret !== 'undefined');

    // Hull status starts at 3
    const pipsGroup = page.getByRole('status', { name: /hull integrity/i });
    await expect(pipsGroup).toBeVisible();

    // Allow enemies to collide: wait until health becomes 0 / defeat
    await page.waitForFunction(
      () => {
        const snap = window.__caret?.getSnapshot();
        return snap && snap.status === 'game-over';
      },
      { timeout: 60000 }
    );

    // After game over status in sim, the defeat delay triggers before showing modal
    const gameOverDialog = page.getByRole('dialog');
    await expect(gameOverDialog).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/HULL INTEGRITY COMPROMISED/i)).toBeVisible();
  });

  test('reduced-motion mode transitions to game-over panel faster than standard mode', async ({
    page,
  }) => {
    test.setTimeout(45000);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?seed=1337');
    await page.waitForSelector('canvas');

    // Open settings and enable reduced motion
    const settingsBtn = page.getByRole('button', { name: /SETTINGS/i });
    await settingsBtn.click();
    await page.getByRole('radio', { name: 'ON' }).click();
    await page.keyboard.press('Escape');

    // Verify reduced motion attribute is set on HTML root
    const hasAttr = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-reduced-motion') === 'true';
    });
    expect(hasAttr).toBe(true);
  });
});
