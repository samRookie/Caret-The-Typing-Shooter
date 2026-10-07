/**
 * Headless Simulation Verification & Automated Bot Playtest (Revision R1, Sub-section 2.E)
 * 
 * Runs deterministic bot simulations without DOM, Phaser, or browser globals.
 * Benchmarks single progressive campaign with seeded bots at 30, 50, and 70 WPM
 * (4% error rate) for 5 simulated minutes, plus a no-input baseline run.
 */

import { GameSimulation } from '../src/game/core/simulation';
import { Mulberry32 } from '../src/game/core/prng';
import { DEFAULT_RUN_CONFIG } from '../src/shared/config/defaultConfig';
import { EnemyState, RunConfig } from '../src/shared/domain';

interface BotConfig {
  readonly targetWpm: number;
  readonly errorRate: number; // 0.0 to 1.0 (e.g. 0.04 = 4%)
  readonly durationMinutes: number;
  readonly botSeed: number;
}

interface RunStats {
  readonly targetWpm: number;
  readonly survived: boolean;
  readonly timeToGameOverSec: number;
  readonly elapsedTimeSec: number;
  readonly wavesReached: number;
  readonly hits: number;
  readonly misses: number;
  readonly accuracy: number;
  readonly grossWpm: number;
  readonly netWpm: number;
  readonly score: number;
  readonly wordsCompleted: number;
}

function runBotSimulation(botConfig: BotConfig): RunStats {
  const runConfig: RunConfig = {
    ...DEFAULT_RUN_CONFIG,
    seed: 1337,
  };

  const sim = new GameSimulation(runConfig);
  sim.start();

  const botRng = new Mulberry32(botConfig.botSeed);
  const tickRate = runConfig.tickRate; // 60
  const maxTicks = Math.round(botConfig.durationMinutes * 60 * tickRate);

  // At WPM words/min, chars/sec = (WPM * 5) / 60
  // Ticks per character = tickRate / charsPerSec = 3600 / (WPM * 5)
  const charsPerSec = (botConfig.targetWpm * 5) / 60;
  const ticksPerKeystroke = Math.max(1, Math.round(tickRate / charsPerSec));

  let keystrokeCountdown = ticksPerKeystroke;
  let elapsedTicks = 0;

  while (elapsedTicks < maxTicks) {
    if (sim.getSnapshot().status === 'game-over') {
      break;
    }

    keystrokeCountdown--;

    if (keystrokeCountdown <= 0) {
      keystrokeCountdown = ticksPerKeystroke;

      const snap = sim.getSnapshot();
      if (snap.enemies.length > 0) {
        // Find target: active locked target or nearest alive enemy
        let target = snap.enemies.find((e: EnemyState) => e.id === snap.activeTargetId && e.alive);

        if (!target) {
          // Find nearest to player
          let closestDist = Infinity;
          for (const enemy of snap.enemies) {
            if (!enemy.alive || enemy.remainingWord.length === 0) continue;
            const dx = enemy.position.x - snap.player.position.x;
            const dy = enemy.position.y - snap.player.position.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < closestDist) {
              closestDist = distSq;
              target = enemy;
            }
          }
        }

        if (target && target.remainingWord.length > 0) {
          const correctChar = target.remainingWord[0] ?? 'a';
          const isError = botRng.next() < botConfig.errorRate;

          if (isError) {
            // Pick an incorrect char
            const alphabet = 'abcdefghijklmnopqrstuvwxyz';
            let wrongChar = alphabet[botRng.intBetween(0, 25)] ?? 'x';
            if (wrongChar === correctChar) {
              wrongChar = correctChar === 'z' ? 'a' : 'z';
            }
            sim.handleCommand({ type: 'char', char: wrongChar });
          } else {
            sim.handleCommand({ type: 'char', char: correctChar });
          }
        }
      }
    }

    sim.tick();
    elapsedTicks++;
  }

  const finalSnap = sim.getSnapshot();
  const res = sim.getResult();
  const survived = finalSnap.status !== 'game-over';
  const timeToGameOverSec = elapsedTicks / tickRate;

  return {
    targetWpm: botConfig.targetWpm,
    survived,
    timeToGameOverSec,
    elapsedTimeSec: elapsedTicks / tickRate,
    wavesReached: finalSnap.wave.waveNumber,
    hits: finalSnap.scoring.hits,
    misses: finalSnap.scoring.misses,
    accuracy: finalSnap.scoring.accuracy,
    grossWpm: res?.grossWpm ?? 0,
    netWpm: res?.netWpm ?? 0,
    score: finalSnap.scoring.score,
    wordsCompleted: finalSnap.scoring.wordsCompleted,
  };
}

function runNoInputSimulation(): {
  timeToGameOverSec: number;
  wavesReached: number;
} {
  const runConfig: RunConfig = {
    ...DEFAULT_RUN_CONFIG,
    seed: 1337,
  };

  const sim = new GameSimulation(runConfig);
  sim.start();

  let ticks = 0;
  const maxTicks = 60 * 60 * 10; // 10 minutes max limit

  while (sim.getSnapshot().status !== 'game-over' && ticks < maxTicks) {
    sim.tick();
    ticks++;
  }

  const snap = sim.getSnapshot();
  return {
    timeToGameOverSec: ticks / runConfig.tickRate,
    wavesReached: snap.wave.waveNumber,
  };
}

function main(): void {
  console.log('========================================================================');
  console.log('CARET: THE TYPING SHOOTER - HEADLESS SIMULATION BENCHMARK (2.E)');
  console.log('Single Progressive Campaign | 5 Simulated Minutes | 4% Error Rate');
  console.log('========================================================================\n');

  console.log('--- TEST 1: NO-INPUT RUN (IDLE HULL DEFEAT BENCHMARK) ---');
  const noInput = runNoInputSimulation();
  console.log(`• Time to Game Over: ${noInput.timeToGameOverSec.toFixed(2)}s`);
  console.log(`• Waves Reached:     Wave ${noInput.wavesReached}\n`);

  console.log('--- TEST 2: SEEDED BOT PLAYTESTS (30, 50, 70 WPM) ---');
  const targetWpms = [30, 50, 70];

  for (const wpm of targetWpms) {
    const res = runBotSimulation({
      targetWpm: wpm,
      errorRate: 0.04,
      durationMinutes: 5,
      botSeed: 4242 + wpm,
    });

    const statusStr = res.survived
      ? `SURVIVED (${res.elapsedTimeSec.toFixed(1)}s full)`
      : `DEFEAT @ ${res.timeToGameOverSec.toFixed(2)}s`;

    console.log(`\nBOT TARGET: ${res.targetWpm} WPM`);
    console.log(`  Outcome:           ${statusStr}`);
    console.log(`  Waves Reached:     Wave ${res.wavesReached}`);
    console.log(`  Hits / Misses:     ${res.hits} hits / ${res.misses} misses`);
    console.log(`  Accuracy:          ${res.accuracy.toFixed(1)}%`);
    console.log(`  Net WPM:           ${res.netWpm.toFixed(1)} WPM (Gross: ${res.grossWpm.toFixed(1)})`);
    console.log(`  Elapsed Time:      ${res.elapsedTimeSec.toFixed(1)}s`);
    console.log(`  Time to Game Over: ${res.survived ? 'N/A (survived)' : `${res.timeToGameOverSec.toFixed(2)}s`}`);
    console.log(`  Score:             ${res.score} pts (${res.wordsCompleted} words cleared)`);
  }

  console.log('\n========================================================================');
  console.log('SIMULATION VERIFICATION COMPLETE - UNTUNED RAW SIMULATION METRICS REPORTED');
  console.log('========================================================================');
}

main();
