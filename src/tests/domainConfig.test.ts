import { describe, it, expect } from 'vitest';
import {
  GameEvent,
  GameSnapshot,
  GameStatus,
  GameMode,
  PlayerState,
  EnemyState,
  WaveState,
  ScoringState,
  Vector2,
} from '@/shared/domain';
import {
  DESKTOP_VIEWPORT,
  DIFFICULTY_PRESETS,
  DRONE_ARCHETYPE,
  DEFAULT_SCORING_RULES,
  DEFAULT_RUN_CONFIG,
} from '@/shared/config/defaultConfig';

describe('Desktop Prototype Configuration', () => {
  it('defines valid virtual desktop coordinate bounds', () => {
    expect(DESKTOP_VIEWPORT.width).toBe(1280);
    expect(DESKTOP_VIEWPORT.height).toBe(720);
    expect(DEFAULT_RUN_CONFIG.virtualResolution.width).toBe(1280);
    expect(DEFAULT_RUN_CONFIG.virtualResolution.height).toBe(720);
    expect(DEFAULT_RUN_CONFIG.targetFps).toBe(60);
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
      expect(preset.playerMaxHealth).toBeGreaterThan(0);
    }
  });

  it('configures the single drone archetype correctly', () => {
    expect(DRONE_ARCHETYPE.type).toBe('drone');
    expect(DRONE_ARCHETYPE.baseHealth).toBe(1);
    expect(DRONE_ARCHETYPE.baseSpeed).toBeGreaterThan(0);
    expect(DRONE_ARCHETYPE.hitboxRadius).toBeGreaterThan(0);
    expect(DRONE_ARCHETYPE.baseScore).toBeGreaterThan(0);
  });

  it('enforces monotonic multiplier progression in scoring rules', () => {
    const thresholds = DEFAULT_SCORING_RULES.multiplierThresholds;
    expect(thresholds.length).toBeGreaterThan(0);
    expect(DEFAULT_SCORING_RULES.scorePerChar).toBeGreaterThan(0);
    expect(DEFAULT_SCORING_RULES.enemyClearBonus).toBeGreaterThan(0);

    for (let i = 1; i < thresholds.length; i++) {
      const current = thresholds[i];
      const prev = thresholds[i - 1];
      expect(current).toBeDefined();
      expect(prev).toBeDefined();
      if (current && prev) {
        expect(current.streak).toBeGreaterThan(prev.streak);
        expect(current.multiplier).toBeGreaterThanOrEqual(prev.multiplier);
      }
    }
  });
});

describe('GameEvent Discriminated Union Handling', () => {
  function formatEventMessage(event: GameEvent): string {
    switch (event.type) {
      case 'INPUT_MATCH':
        return `MATCH: ${event.char} on ${event.enemyId}`;
      case 'INPUT_MISMATCH':
        return `MISMATCH: ${event.char}`;
      case 'TARGET_LOCKED':
        return `LOCKED: ${event.word}`;
      case 'TARGET_LOST':
        return `LOST: ${event.enemyId}`;
      case 'PROJECTILE_SPAWNED':
        return `BOLT: to ${event.targetEnemyId}`;
      case 'ENEMY_HIT':
        return `HIT: ${event.damage} dmg`;
      case 'ENEMY_DESTROYED':
        return `DESTROYED: +${event.scoreAwarded} pts`;
      case 'PLAYER_DAMAGED':
        return `HULL: -${event.damage}`;
      case 'WAVE_COMPLETED':
        return `WAVE ${event.waveNumber} CLEAR`;
      case 'GAME_OVER':
        return `GAME OVER: ${event.result.outcome}`;
    }
  }

  it('correctly discriminates event variants without runtime errors', () => {
    const matchEvent: GameEvent = {
      type: 'INPUT_MATCH',
      char: 'r',
      enemyId: 'drone-1',
      remainingWord: 'econ',
      timestamp: 1000,
    };
    expect(formatEventMessage(matchEvent)).toBe('MATCH: r on drone-1');

    const destroyEvent: GameEvent = {
      type: 'ENEMY_DESTROYED',
      enemyId: 'drone-1',
      scoreAwarded: 150,
      position: { x: 640, y: 200 },
      timestamp: 1200,
    };
    expect(formatEventMessage(destroyEvent)).toBe('DESTROYED: +150 pts');
  });
});

describe('GameSnapshot Contract Integrity', () => {
  it('constructs a valid pure simulation snapshot', () => {
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
      targeted: false,
      alive: true,
      spawnTimeMs: 500,
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
      multiplier: 2,
      accuracy: 100,
      hits: 5,
      misses: 0,
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
      elapsedTimeMs: 12500,
      timestamp: Date.now(),
    };

    expect(snapshot.status).toBe('running');
    expect(snapshot.player.alive).toBe(true);
    expect(snapshot.enemies.length).toBe(1);
    expect(snapshot.enemies[0]?.word).toBe('RADAR');
    expect(snapshot.scoring.multiplier).toBe(2);
  });
});
