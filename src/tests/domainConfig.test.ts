import { describe, it, expect } from 'vitest';
import {
  DESKTOP_VIEWPORT,
  DIFFICULTY_PRESETS,
  DRONE_ARCHETYPE,
  DEFAULT_SCORING_RULES,
  DEFAULT_RUN_CONFIG,
  PLAYER_START,
} from '@/shared/config/defaultConfig';
import {
  ScoringState,
  GameCommand,
  CharacterInput,
  GameEvent,
  Vector2,
  PlayerState,
  EnemyState,
  WaveState,
  GameStatus,
  GameMode,
  GameSnapshot,
} from '@/shared/domain';

import { computeAccuracy } from '@/game/core/metrics/typingMetrics';

describe('Desktop Prototype Configuration Invariants', () => {
  it('defines valid virtual desktop coordinate bounds and run defaults', () => {
    expect(DESKTOP_VIEWPORT.width).toBe(1280);
    expect(DESKTOP_VIEWPORT.height).toBe(720);
    expect(DEFAULT_RUN_CONFIG.virtualResolution.width).toBe(1280);
    expect(DEFAULT_RUN_CONFIG.virtualResolution.height).toBe(720);
    expect(DEFAULT_RUN_CONFIG.targetFps).toBe(60);
    expect(DEFAULT_RUN_CONFIG.tickRate).toBe(60);
    expect(DEFAULT_RUN_CONFIG.seed).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_RUN_CONFIG.seed).toBeLessThanOrEqual(4294967295);
    expect(DEFAULT_RUN_CONFIG.playerStart).toEqual(PLAYER_START);
  });

  it('validates all difficulty presets conform to gameplay bounds', () => {
    const presetKeys = Object.keys(DIFFICULTY_PRESETS) as (keyof typeof DIFFICULTY_PRESETS)[];
    expect(presetKeys).toContain('relaxed');
    expect(presetKeys).toContain('normal');
    expect(presetKeys).toContain('intense');

    for (const key of presetKeys) {
      const preset = DIFFICULTY_PRESETS[key];
      expect(preset.enemySpeed).toBeGreaterThan(0);
      expect(preset.spawnIntervalMs).toBeGreaterThanOrEqual(1000);
      expect(preset.maxConcurrentEnemies).toBeGreaterThanOrEqual(1);
      expect(preset.wordLengthRange.min).toBeGreaterThanOrEqual(2);
      expect(preset.wordLengthRange.max).toBeGreaterThanOrEqual(preset.wordLengthRange.min);
      expect(preset.playerMaxHealth).toBe(3);
    }
  });

  it('configures the single drone archetype correctly', () => {
    expect(DRONE_ARCHETYPE.type).toBe('drone');
    expect(DRONE_ARCHETYPE.healthPerLetter).toBe(1);
    expect(DRONE_ARCHETYPE.hitboxRadius).toBeGreaterThan(0);
  });

  it('validates simulation config parameters and thresholds', () => {
    const sim = DEFAULT_RUN_CONFIG.simulation;
    expect(sim.spawnY).toBe(40);
    expect(sim.spawnMarginX).toBe(60);
    expect(sim.hullRadius).toBe(28);
    expect(sim.collisionDamage).toBe(1);
    expect(sim.initialSpawnDelaySeconds).toBe(1.0);
    expect(sim.waveIntermissionSeconds).toBe(2);
    expect(sim.labelCharWidthPx).toBe(14);
    expect(sim.spawnGapWindowSeconds).toBe(1.5);
    expect(sim.commonalityStart).toBe(0.35);
    expect(sim.commonalityStep).toBe(0.1);
    expect(sim.ratingThresholds.S).toBe(97);
    expect(sim.ratingThresholds.A).toBe(92);
    expect(sim.ratingThresholds.B).toBe(85);
    expect(sim.ratingThresholds.C).toBe(75);
    expect(sim.waveScaling.quotaBase).toBe(6);
    expect(sim.waveScaling.quotaPerWave).toBe(2);
    expect(sim.waveScaling.quotaMax).toBe(30);
  });

  it('validates scoring rules contract (+1 per character typed)', () => {
    expect(DEFAULT_SCORING_RULES.scorePerChar).toBe(1);
  });

  it('enforces accuracy contract: strictly 100% when hits + misses is 0', () => {
    expect(computeAccuracy(0, 0)).toBe(100);
    expect(computeAccuracy(10, 0)).toBe(100);
    expect(computeAccuracy(9, 1)).toBe(90);
    expect(computeAccuracy(0, 5)).toBe(0);

    const initialScoring: ScoringState = {
      score: 0,
      streak: 0,
      maxStreak: 0,
      accuracy: computeAccuracy(0, 0),
      hits: 0,
      misses: 0,
      wordsDestroyed: 0,
      wordsCompleted: 0,
      wpm: 0,
    };

    expect(initialScoring.accuracy).toBe(100);
  });
});

describe('GameCommand & CharacterInput Contracts', () => {
  it('correctly creates and discriminates GameCommand variants', () => {
    const charCmd: CharacterInput = {
      type: 'char',
      char: 'z',
    };
    expect(charCmd.type).toBe('char');
    expect(charCmd.char).toBe('z');

    const releaseCmd: GameCommand = {
      type: 'release-target',
    };
    expect(releaseCmd.type).toBe('release-target');
  });
});

describe('GameEvent Discriminated Union Handling', () => {
  function formatEventMessage(event: GameEvent): string {
    switch (event.type) {
      case 'INPUT_MATCH':
        return `MATCH: ${event.char} (+${event.scoreAwarded}) on ${event.enemyId} @ tick ${event.tick}`;
      case 'INPUT_MISMATCH':
        return `MISMATCH: ${event.char} @ tick ${event.tick}`;
      case 'TARGET_LOCKED':
        return `LOCKED: ${event.word} @ tick ${event.tick}`;
      case 'TARGET_LOST':
        return `LOST: ${event.enemyId} @ tick ${event.tick}`;
      case 'PROJECTILE_SPAWNED':
        return `BOLT: to ${event.targetEnemyId} @ tick ${event.tick}`;
      case 'ENEMY_HIT':
        return `HIT: ${event.damage} dmg @ tick ${event.tick}`;
      case 'ENEMY_DESTROYED':
        return `DESTROYED: via ${event.cause} @ tick ${event.tick}`;
      case 'PLAYER_DAMAGED':
        return `HULL: -${event.damage} @ tick ${event.tick}`;
      case 'ENEMY_SPAWNED':
        return `SPAWNED: ${event.enemyId} at (${event.position.x},${event.position.y}) @ tick ${event.tick}`;
      case 'WAVE_STARTED':
        return `WAVE ${event.waveNumber} STARTED (quota ${event.quota}) @ tick ${event.tick}`;
      case 'WAVE_COMPLETED':
        return `WAVE ${event.waveNumber} CLEAR @ tick ${event.tick}`;
      case 'GAME_OVER':
        return `GAME OVER: ${event.result.outcome} @ tick ${event.tick}`;
    }
  }

  it('correctly discriminates event variants with tick timestamps and cause', () => {
    const matchEvent: GameEvent = {
      type: 'INPUT_MATCH',
      char: 'r',
      enemyId: 'drone-1',
      remainingWord: 'econ',
      scoreAwarded: 1,
      tick: 60,
    };
    expect(formatEventMessage(matchEvent)).toBe('MATCH: r (+1) on drone-1 @ tick 60');

    const destroyWordEvent: GameEvent = {
      type: 'ENEMY_DESTROYED',
      enemyId: 'drone-1',
      position: { x: 640, y: 200 },
      cause: 'word',
      tick: 72,
    };
    expect(formatEventMessage(destroyWordEvent)).toBe('DESTROYED: via word @ tick 72');

    const destroyCollisionEvent: GameEvent = {
      type: 'ENEMY_DESTROYED',
      enemyId: 'drone-2',
      position: { x: 640, y: 620 },
      cause: 'collision',
      tick: 120,
    };
    expect(formatEventMessage(destroyCollisionEvent)).toBe('DESTROYED: via collision @ tick 120');

    const spawnEvent: GameEvent = {
      type: 'ENEMY_SPAWNED',
      enemyId: 'e1',
      position: { x: 250, y: 40 },
      tick: 1,
    };
    expect(formatEventMessage(spawnEvent)).toBe('SPAWNED: e1 at (250,40) @ tick 1');

    const waveStartEvent: GameEvent = {
      type: 'WAVE_STARTED',
      waveNumber: 1,
      quota: 6,
      tick: 0,
    };
    expect(formatEventMessage(waveStartEvent)).toBe('WAVE 1 STARTED (quota 6) @ tick 0');
  });
});

describe('GameSnapshot Contract Integrity', () => {
  it('constructs a valid pure simulation snapshot with ticks and modes', () => {
    const playerPos: Vector2 = { x: 640, y: 620 };
    const player: PlayerState = {
      position: playerPos,
      health: 100,
      maxHealth: 100,
      alive: true,
      isDamaged: false,
    };

    const enemy: EnemyState = {
      id: 'drone-alpha',
      type: 'drone',
      position: { x: 640, y: 150 },
      velocity: { x: 0, y: 38 },
      word: 'RADAR',
      remainingWord: 'RADAR',
      health: 1,
      maxHealth: 1,
      alive: true,
      spawnTick: 30,
    };

    const wave: WaveState = {
      waveNumber: 1,
      totalEnemies: 5,
      remainingEnemies: 4,
      spawnIntervalMs: 2400,
      isCompleted: false,
    };

    const scoring: ScoringState = {
      score: 350,
      streak: 5,
      maxStreak: 5,
      accuracy: 100,
      hits: 5,
      misses: 0,
      wordsDestroyed: 1,
      wordsCompleted: 1,
      wpm: 62,
    };

    const snapshot: GameSnapshot = {
      status: 'running' as GameStatus,
      mode: 'standard' as GameMode,
      player,
      enemies: [enemy],
      activeTargetId: null,
      wave,
      scoring,
      elapsedTicks: 750,
    };

    expect(snapshot.status).toBe('running');
    expect(snapshot.mode).toBe('standard');
    expect(snapshot.player.alive).toBe(true);
    expect(snapshot.enemies.length).toBe(1);
    expect(snapshot.enemies[0]?.word).toBe('RADAR');
    expect(snapshot.enemies[0]?.spawnTick).toBe(30);
    expect(snapshot.elapsedTicks).toBe(750);
  });
});

