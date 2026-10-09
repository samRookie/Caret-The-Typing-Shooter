const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

(async () => {
  const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  console.log('1. Capturing Menu Screen...');
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, 'menu_screen.png') });
  console.log('Saved menu_screen.png');

  console.log('2. Capturing Gameplay Combat Scene...');
  await page.goto('http://localhost:3000/?autostart=1');
  await page.waitForFunction(() => window.__caret?.getSnapshot()?.enemies?.length > 0, { timeout: 15000 });
  const enemy = await page.evaluate(() => window.__caret.getSnapshot().enemies[0]);
  console.log('Target enemy word:', enemy.word);

  // Type first character to trigger aim rotation and golden bullet
  await page.keyboard.press(enemy.word[0]);
  await page.waitForTimeout(20);
  await page.screenshot({ path: path.join(screenshotsDir, 'gameplay_combat.png') });
  console.log('Saved gameplay_combat.png');

  console.log('3. Capturing Pause Modal...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, 'pause_modal.png') });
  console.log('Saved pause_modal.png');

  console.log('4. Capturing Visual Preview Switchboard...');
  await page.goto('http://localhost:3000/?preview=1');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, 'preview_switchboard.png') });
  console.log('Saved preview_switchboard.png');

  console.log('5. Capturing Game Over Modal...');
  await page.click('button:has-text("PREVIEW GAME OVER")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, 'gameover_modal.png') });
  console.log('Saved gameover_modal.png');

  await browser.close();
  console.log('All screenshots captured successfully in docs/screenshots/');
})();
