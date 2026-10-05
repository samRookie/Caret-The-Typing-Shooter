/**
 * Headless Simulation Verification & Automated Bot Playtest
 * 
 * Runs a deterministic bot simulation without DOM, Phaser, or browser globals.
 * Bot simulates human typing mechanics at configurable WPM and error rates across all difficulty tiers.
 */

import { GameSimulation } from '../src/game/core/simulation';
import { Mulberry32 } from '../src/game/core/prng';
import {
  DEFAULT_RUN_CONFIG,
  DIFFICULTY_PRESETS,
} from '../src/shared/config/defaultConfig';
import { DifficultyPresetId, EnemyState, RunConfig } from '../src/shared/domain';

interface BotConfig {
  readonly targetWpm: number;
  readonly errorRate: number; // 0.0 to 1.0 (e.g. 0.04 = 4%)
  readonly durationMinutes: number;
  readonly botSeed: number;
}

interface RunStats {
  readonly presetId: DifficultyPresetId;
  readonly presetName: string;
  readonly survived: boolean;
  readonly timeToGameOverSec: number;
  readonly wavesReached: number;
  readonly finalHealth: number;
  readonly maxHealth: number;
  readonly accuracy: number;
  readonly wpm: number;
  readonly score: number;
  readonly wordsCompleted: number;
  readonly hits: number;
  readonly misses: number;
  readonly fallbacks: number;
}

function runBotSimulation(
  presetId: DifficultyPresetId,
  botConfig: BotConfig
): RunStats {
  const preset = DIFFICULTY_PRESETS[presetId];
  const runConfig: RunConfig = {
    ...DEFAULT_RUN_CONFIG,
    difficulty: preset,
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
  const survived = finalSnap.status !== 'game-over';
  const timeToGameOverSec = elapsedTicks / tickRate;

  return {
    presetId,
    presetName: preset.name,
    survived,
    timeToGameOverSec,
    wavesReached: finalSnap.wave.waveNumber,
    finalHealth: finalSnap.player.health,
    maxHealth: finalSnap.player.maxHealth,
    accuracy: finalSnap.scoring.accuracy,
    wpm: finalSnap.scoring.wpm,
    score: finalSnap.scoring.score,
    wordsCompleted: finalSnap.scoring.wordsCompleted,
    hits: finalSnap.scoring.hits,
    misses: finalSnap.scoring.misses,
    fallbacks: sim.wordProviderStats.fallbacks,
  };
}

function runNoInputSimulation(presetId: DifficultyPresetId): {
  presetName: string;
  timeToGameOverSec: number;
} {
  const preset = DIFFICULTY_PRESETS[presetId];
  const runConfig: RunConfig = {
    ...DEFAULT_RUN_CONFIG,
    difficulty: preset,
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

  return {
    presetName: preset.name,
    timeToGameOverSec: ticks / runConfig.tickRate,
  };
}

function main(): void {
  const botConfig: BotConfig = {
    targetWpm: 40,
    errorRate: 0.04, // 4% error rate
    durationMinutes: 3, // 3 minutes per preset
    botSeed: 7777,
  };

  console.log('========================================================================');
  console.log('CARET: THE TYPING SHOOTER - HEADLESS SIMULATION VERIFICATION (B6)');
  console.log(`Config: ${botConfig.targetWpm} Target WPM | ${(botConfig.errorRate * 100).toFixed(1)}% Error Rate | ${botConfig.durationMinutes} Minutes Duration`);
  console.log('========================================================================\n');

  console.log('--- TEST 1: NO-INPUT RUNS (IDLE HULL SURVIVAL BENCHMARK) ---');
  const presets: DifficultyPresetId[] = ['relaxed', 'normal', 'intense'];

  for (const pid of presets) {
    const res = runNoInputSimulation(pid);
    console.log(
      `• [${pid.toUpperCase().padEnd(7)}] ${res.presetName.padEnd(20)} -> Time to Game Over: ${res.timeToGameOverSec.toFixed(2)}s`
    );
  }

  console.log('\n--- TEST 2: AUTOMATED BOT PLAYTEST (40 WPM, 4% ERRORS, 3 MINUTES) ---');

  for (const pid of presets) {
    const res = runBotSimulation(pid, botConfig);
    const statusStr = res.survived
      ? `SURVIVED (${res.timeToGameOverSec.toFixed(1)}s full)`
      : `DEFEAT @ ${res.timeToGameOverSec.toFixed(2)}s`;

    console.log(`\nPRESET: ${res.presetId.toUpperCase()} (${res.presetName})`);
    console.log(`  Outcome:         ${statusStr}`);
    console.log(`  Waves Reached:   Wave ${res.wavesReached}`);
    console.log(`  Final Hull:      ${res.finalHealth} / ${res.maxHealth} HP`);
    console.log(`  Accuracy:        ${res.accuracy}% (${res.hits} hits, ${res.misses} misses)`);
    console.log(`  Simulated WPM:   ${res.wpm} WPM`);
    console.log(`  Score:           ${res.score} pts (${res.wordsCompleted} words cleared)`);
    console.log(`  Word Fallbacks:  ${res.fallbacks}`);
  }

  console.log('\n========================================================================');
  console.log('SIMULATION VERIFICATION COMPLETE - UNTUNED RAW SIMULATION METRICS REPORTED');
  console.log('========================================================================');
}

main();
