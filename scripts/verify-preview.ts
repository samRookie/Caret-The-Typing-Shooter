import { chromium } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

interface VerifyOptions {
  base: string; // e.g. '/' or '/caret/'
  port?: number;
}

interface VerifyResult {
  base: string;
  success: boolean;
  consoleErrors: string[];
  http404s: string[];
  durationMs: number;
}

function waitForServer(url: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else {
            retry();
          }
        })
        .on('error', () => {
          retry();
        });
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timed out waiting for preview server at ${url}`));
      } else {
        setTimeout(check, 300);
      }
    };

    check();
  });
}

export async function runPreviewVerification(options: VerifyOptions): Promise<VerifyResult> {
  const port = options.port ?? 4173;
  const base = options.base.endsWith('/') ? options.base : `${options.base}/`;
  const normalizedBase = base.startsWith('/') ? base : `/${base}`;
  const targetUrl = `http://localhost:${port}${normalizedBase}`;
  const startTime = Date.now();

  const consoleErrors: string[] = [];
  const http404s: string[] = [];

  console.log(`[verify-preview] Starting preview server on port ${port} with base '${normalizedBase}'...`);

  // Start preview server process
  const previewProcess: ChildProcess = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--port', String(port), '--strictPort'],
    {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, VITE_BASE: normalizedBase },
    }
  );

  previewProcess.stdout?.on('data', (_d) => {
    // console.log(`[preview stdout]: ${_d.toString().trim()}`);
  });
  previewProcess.stderr?.on('data', (_d) => {
    // console.error(`[preview stderr]: ${_d.toString().trim()}`);
  });

  try {
    await waitForServer(targetUrl, 15000);
    console.log(`[verify-preview] Preview server ready at ${targetUrl}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        console.error(`[Browser Console Error]: ${text}`);
        consoleErrors.push(text);
      }
    });

    page.on('response', (response) => {
      if (response.status() === 404) {
        const url = response.url();
        console.error(`[Browser 404 Response]: ${url}`);
        http404s.push(url);
      }
    });

    page.on('pageerror', (err) => {
      console.error(`[Browser Page Error]: ${err.message}`);
      consoleErrors.push(err.message);
    });

    const pageUrlWithSeed = `${targetUrl}?seed=1337`;
    console.log(`[verify-preview] Navigating to ${pageUrlWithSeed}...`);
    await page.goto(pageUrlWithSeed, { waitUntil: 'networkidle' });

    // Step 1: Wait for Menu Screen
    console.log('[verify-preview] Step 1: Waiting for Menu Screen...');
    const initiateBtn = page.getByRole('button', { name: /INITIATE ENGAGEMENT/i });
    await initiateBtn.waitFor({ state: 'visible', timeout: 10000 });

    // Step 2: Start Game
    console.log('[verify-preview] Step 2: Initiating engagement...');
    await initiateBtn.click();

    // Verify HUD is active
    await page.waitForSelector('[role="progressbar"]', { timeout: 10000 });
    console.log('[verify-preview] HUD mounted and running.');

    // Step 3: Type a known word ('aim' is spawned for seed 1337)
    console.log('[verify-preview] Step 3: Typing known word "aim"...');
    // Wait 1.5s for initial enemy to spawn and enter viewport
    await page.waitForTimeout(1500);
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyI');
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyM');
    await page.waitForTimeout(500);

    // Verify score increases above 0
    const scoreVal = await page.locator('text=SCORE').locator('..').textContent();
    console.log(`[verify-preview] Score readout after typing 'aim': ${scoreVal}`);

    // Step 4: Let game end (wait for enemies to deplete player hull to 0)
    console.log('[verify-preview] Step 4: Waiting for game over (hull depletion)...');
    const gameOverModal = page.getByRole('dialog');
    await gameOverModal.waitFor({ state: 'visible', timeout: 45000 });
    console.log('[verify-preview] Game Over modal appeared.');

    // Step 5: Restart game
    console.log('[verify-preview] Step 5: Clicking "RESTART" to restart...');
    const restartBtn = page.getByRole('button', { name: /RESTART/i });
    await restartBtn.waitFor({ state: 'visible', timeout: 10000 });
    await restartBtn.click();

    // Verify running again or menu
    await page.waitForTimeout(1000);
    const canvas = page.locator('canvas');
    const canvasCount = await canvas.count();
    console.log(`[verify-preview] Canvas count after restart: ${canvasCount}`);

    await browser.close();

    const durationMs = Date.now() - startTime;
    return {
      base: normalizedBase,
      success: consoleErrors.length === 0 && http404s.length === 0 && canvasCount === 1,
      consoleErrors,
      http404s,
      durationMs,
    };
  } finally {
    if (previewProcess.pid) {
      if (process.platform === 'win32') {
        try {
          const { execSync } = await import('child_process');
          execSync(`taskkill /pid ${previewProcess.pid} /T /F`, { stdio: 'ignore' });
        } catch {
          // Process already closed
        }
      } else {
        previewProcess.kill();
      }
    }
    // Allow process to terminate cleanly
    await new Promise((r) => setTimeout(r, 500));
  }
}

// Direct CLI invocation
if (process.argv[1]?.endsWith('verify-preview.ts') || process.argv[1]?.endsWith('verify-preview.js')) {
  const baseArg = process.env.VITE_BASE || process.argv[2] || '/';
  runPreviewVerification({ base: baseArg })
    .then((result) => {
      console.log('--- VERIFICATION RESULT ---');
      console.log(`Base: ${result.base}`);
      console.log(`Success: ${result.success}`);
      console.log(`Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
      console.log(`Console Errors: ${result.consoleErrors.length}`);
      if (result.consoleErrors.length > 0) {
        result.consoleErrors.forEach((e) => console.log(`  - ${e}`));
      }
      console.log(`HTTP 404s: ${result.http404s.length}`);
      if (result.http404s.length > 0) {
        result.http404s.forEach((u) => console.log(`  - ${u}`));
      }
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('[verify-preview] Fatal error:', err);
      process.exit(1);
    });
}
