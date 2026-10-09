import { describe, it, expect } from 'vitest';
import { planEffects, EffectContext } from '@/game/rendering/effects/planEffects';
import { DEFAULT_MOTION_POLICY, REDUCED_MOTION_POLICY } from '@/shared/motion';
import { GameEvent } from '@/shared/domain';

const CTX_STANDARD: EffectContext = {
  wd: 44,
  ws: 60,
  healthAfter: 3,
  isNewRecord: false,
  panelDelayMs: 900,
  shipPosition: { x: 640, y: 620 },
};

describe('Pure Effect Planner (Section 2 & 8)', () => {
  it('ENEMY_SPAWNED: emits ring on standard, empty on reduced', () => {
    const event: GameEvent = {
      type: 'ENEMY_SPAWNED',
      enemyId: 'e1',
      position: { x: 100, y: 100 },
      tick: 10,
    };

    const stdCmds = planEffects(event, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(stdCmds).toEqual([
      {
        type: 'ring',
        at: { x: 100, y: 100 },
        fromRadius: 0.6 * 44,
        toRadius: 1.4 * 44,
        ms: 220,
      },
    ]);

    const redCmds = planEffects(event, CTX_STANDARD, REDUCED_MOTION_POLICY);
    expect(redCmds).toEqual([]);
  });

  it('TARGET_LOCKED: emits labelPulse in both modes', () => {
    const event: GameEvent = {
      type: 'TARGET_LOCKED',
      enemyId: 'e1',
      word: 'caret',
      position: { x: 100, y: 100 },
      tick: 20,
    };

    const stdCmds = planEffects(event, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(stdCmds).toEqual([{ type: 'labelPulse', id: 'e1', ms: 100 }]);

    const redCmds = planEffects(event, CTX_STANDARD, REDUCED_MOTION_POLICY);
    expect(redCmds).toEqual([{ type: 'labelPulse', id: 'e1', ms: 100 }]);
  });

  it('INPUT_MATCH: emits laser sound when non-final, and laser+destroy when final (at most 2 sounds)', () => {
    const nonFinalEvent: GameEvent = {
      type: 'INPUT_MATCH',
      char: 'c',
      enemyId: 'e1',
      remainingWord: 'aret',
      scoreAwarded: 1,
      tick: 30,
    };

    const nonFinalCmds = planEffects(nonFinalEvent, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(nonFinalCmds).toEqual([{ type: 'sound', cue: 'laser', volume: 0.35 }]);

    const finalEvent: GameEvent = {
      type: 'INPUT_MATCH',
      char: 't',
      enemyId: 'e1',
      remainingWord: '',
      scoreAwarded: 1,
      tick: 35,
    };

    const finalCmds = planEffects(finalEvent, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(finalCmds).toEqual([
      { type: 'sound', cue: 'laser', volume: 0.35 },
      { type: 'sound', cue: 'destroy', volume: 0.8 },
    ]);
  });

  it('PROJECTILE_SPAWNED: emits bolt with 3 trails on standard, 0 on reduced', () => {
    const event: GameEvent = {
      type: 'PROJECTILE_SPAWNED',
      from: { x: 640, y: 620 },
      to: { x: 300, y: 200 },
      targetEnemyId: 'e1',
      tick: 40,
    };

    const stdCmds = planEffects(event, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(stdCmds).toEqual([
      {
        type: 'bolt',
        from: { x: 640, y: 620 },
        to: { x: 300, y: 200 },
        travelMs: 90,
        trailSegments: 3,
      },
    ]);

    const redCmds = planEffects(event, CTX_STANDARD, REDUCED_MOTION_POLICY);
    expect(redCmds).toEqual([
      {
        type: 'bolt',
        from: { x: 640, y: 620 },
        to: { x: 300, y: 200 },
        travelMs: 90,
        trailSegments: 0,
      },
    ]);
  });

  it('ENEMY_HIT: emits spriteFlash + sparks on standard, flash only on reduced', () => {
    const event: GameEvent = {
      type: 'ENEMY_HIT',
      enemyId: 'e1',
      damage: 1,
      position: { x: 300, y: 200 },
      tick: 45,
    };

    const stdCmds = planEffects(event, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(stdCmds).toHaveLength(2);
    expect(stdCmds[0]).toEqual({ type: 'spriteFlash', target: 'drone', id: 'e1', ms: 60 });
    expect(stdCmds[1].type).toBe('burst');

    const redCmds = planEffects(event, CTX_STANDARD, REDUCED_MOTION_POLICY);
    expect(redCmds).toEqual([{ type: 'spriteFlash', target: 'drone', id: 'e1', ms: 60 }]);
  });

  it('ENEMY_DESTROYED (cause: word): expands ring and bursts; reduced clamps <= 5 and no ring growth', () => {
    const event: GameEvent = {
      type: 'ENEMY_DESTROYED',
      enemyId: 'e1',
      position: { x: 300, y: 200 },
      cause: 'word',
      tick: 50,
    };

    const stdCmds = planEffects(event, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(stdCmds).toEqual([
      {
        type: 'ring',
        at: { x: 300, y: 200 },
        fromRadius: 0.6 * 44,
        toRadius: 1.8 * 44,
        ms: 300,
      },
      {
        type: 'burst',
        at: { x: 300, y: 200 },
        count: 12,
        speed: [60, 140],
        lifeMs: 350,
      },
    ]);

    const redCmds = planEffects(event, CTX_STANDARD, REDUCED_MOTION_POLICY);
    expect(redCmds).toEqual([
      {
        type: 'ring',
        at: { x: 300, y: 200 },
        fromRadius: 0.6 * 44,
        toRadius: 0.6 * 44,
        ms: 300,
      },
      {
        type: 'burst',
        at: { x: 300, y: 200 },
        count: 4,
        speed: [60, 140],
        lifeMs: 350,
      },
    ]);
    expect((redCmds[1] as { count: number }).count).toBeLessThanOrEqual(5);
  });

  it('PLAYER_DAMAGED: emits full feedback on standard; tint+pip-loss only on reduced; last-life when health=1', () => {
    const damageEvent: GameEvent = {
      type: 'PLAYER_DAMAGED',
      damage: 1,
      currentHealth: 2,
      tick: 60,
    };

    const stdCmds = planEffects(damageEvent, { ...CTX_STANDARD, healthAfter: 2 }, DEFAULT_MOTION_POLICY);
    expect(stdCmds.some(c => c.type === 'burst')).toBe(true);
    expect(stdCmds.some(c => c.type === 'tint')).toBe(true);
    expect(stdCmds.some(c => c.type === 'edgeFlash')).toBe(true);
    expect(stdCmds.some(c => c.type === 'shake')).toBe(true);
    expect(stdCmds.some(c => c.type === 'hudSignal' && c.signal === 'pip-loss')).toBe(true);
    expect(stdCmds.some(c => c.type === 'sound' && c.cue === 'hit')).toBe(true);
    expect(stdCmds.some(c => c.type === 'hudSignal' && c.signal === 'last-life')).toBe(false);

    // Reduced motion
    const redCmds = planEffects(damageEvent, { ...CTX_STANDARD, healthAfter: 2 }, REDUCED_MOTION_POLICY);
    expect(redCmds.some(c => c.type === 'burst')).toBe(false);
    expect(redCmds.some(c => c.type === 'edgeFlash')).toBe(false);
    expect(redCmds.some(c => c.type === 'shake')).toBe(false);
    expect(redCmds.some(c => c.type === 'tint')).toBe(true);
    expect(redCmds.some(c => c.type === 'hudSignal' && c.signal === 'pip-loss')).toBe(true);

    // Health drops to 1: triggers last-life signal and delayed hit cue
    const lastLifeCmds = planEffects(
      { ...damageEvent, currentHealth: 1 },
      { ...CTX_STANDARD, healthAfter: 1 },
      DEFAULT_MOTION_POLICY
    );
    expect(lastLifeCmds.some(c => c.type === 'hudSignal' && c.signal === 'last-life')).toBe(true);
    const delayedHit = lastLifeCmds.find(c => c.type === 'sound' && c.delayMs === 250);
    expect(delayedHit).toEqual({
      type: 'sound',
      cue: 'hit',
      rate: 0.7,
      volume: 0.5,
      delayMs: 250,
    });
  });

  it('INPUT_MISMATCH: emits mismatch hudSignal and wrong-input sound without shake or flash', () => {
    const event: GameEvent = {
      type: 'INPUT_MISMATCH',
      char: 'x',
      activeTargetId: 'e1',
      tick: 70,
    };

    const cmds = planEffects(event, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(cmds).toEqual([
      { type: 'hudSignal', signal: 'mismatch' },
      { type: 'sound', cue: 'wrong-input', volume: 0.4 },
    ]);
  });

  it('WAVE_COMPLETED: emits wave-complete sound only', () => {
    const event: GameEvent = {
      type: 'WAVE_COMPLETED',
      waveNumber: 1,
      tick: 80,
    };

    const cmds = planEffects(event, CTX_STANDARD, DEFAULT_MOTION_POLICY);
    expect(cmds).toEqual([{ type: 'sound', cue: 'wave-complete', volume: 0.7 }]);
  });

  it('GAME_OVER: emits explosion, destroy sound, and delayed new record cue if isNewRecord', () => {
    const event: GameEvent = {
      type: 'GAME_OVER',
      result: {
        outcome: 'defeat',
        finalWave: 3,
        wordsCompleted: 15,
        score: 42,
        rating: 'B',
        accuracy: 88,
        wpm: 45,
        durationSeconds: 65,
        hits: 42,
        misses: 5,
      },
      tick: 100,
    };

    const cmds = planEffects(
      event,
      { ...CTX_STANDARD, isNewRecord: true, panelDelayMs: 900 },
      DEFAULT_MOTION_POLICY
    );

    expect(cmds.some(c => c.type === 'ring' && c.toRadius === 3 * 60)).toBe(true);
    expect(cmds.some(c => c.type === 'burst' && c.count >= 18)).toBe(true);
    expect(cmds.some(c => c.type === 'sound' && c.cue === 'destroy' && c.rate === 0.5)).toBe(true);

    const recordSound = cmds.find(c => c.type === 'sound' && c.cue === 'wave-complete');
    expect(recordSound).toEqual({
      type: 'sound',
      cue: 'wave-complete',
      rate: 1.25,
      volume: 0.6,
      delayMs: 950, // max(600, 900 + 50)
    });
  });

  it('scales radii proportionally when wd/ws vary', () => {
    const spawnEvent: GameEvent = {
      type: 'ENEMY_SPAWNED',
      enemyId: 'e2',
      position: { x: 50, y: 50 },
      tick: 1,
    };

    const cmds44 = planEffects(spawnEvent, { ...CTX_STANDARD, wd: 44 }, DEFAULT_MOTION_POLICY);
    const cmds88 = planEffects(spawnEvent, { ...CTX_STANDARD, wd: 88 }, DEFAULT_MOTION_POLICY);

    const ring44 = cmds44[0] as { fromRadius: number; toRadius: number };
    const ring88 = cmds88[0] as { fromRadius: number; toRadius: number };

    expect(ring88.fromRadius).toBe(ring44.fromRadius * 2);
    expect(ring88.toRadius).toBe(ring44.toRadius * 2);
  });
});
