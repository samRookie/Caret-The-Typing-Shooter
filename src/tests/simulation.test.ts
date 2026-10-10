import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { GameSimulation } from '@/game/core/simulation';
import { DEFAULT_RUN_CONFIG } from '@/shared/config/defaultConfig';
import { GameCommand, GameEvent, RunConfig } from '@/shared/domain';
import { IWordProvider } from '@/game/core/words';
import { compareEntityIds } from '@/game/core/entityId';

describe('GameSimulation Determinism & Reproducibility', () => {
  it('produces identical state snapshots and event logs over 20,000 ticks for identical seeds and inputs', () => {
    const config: RunConfig = {
      ...DEFAULT_RUN_CONFIG,
      seed: 1337,
    };

    const simA = new GameSimulation(config);
    const simB = new GameSimulation(config);

    simA.start();
    simB.start();

    // Scripted inputs dispatched at deterministic intervals
    const scriptedCommands: { tick: number; command: GameCommand }[] = [
      { tick: 5, command: { type: 'char', char: 'a' } },
      { tick: 6, command: { type: 'char', char: 'r' } },
      { tick: 7, command: { type: 'char', char: 'c' } },
      { tick: 200, command: { type: 'char', char: 'z' } },
      { tick: 205, command: { type: 'release-target' } },
      { tick: 1500, command: { type: 'char', char: 'b' } },
      { tick: 1501, command: { type: 'char', char: 'a' } },
      { tick: 1502, command: { type: 'char', char: 's' } },
      { tick: 1503, command: { type: 'char', char: 'e' } },
    ];

    const commandMap = new Map<number, GameCommand>();
    for (const item of scriptedCommands) {
      commandMap.set(item.tick, item.command);
    }

    const totalTicks = 20000;
    for (let t = 1; t <= totalTicks; t++) {
      const cmd = commandMap.get(t);
      if (cmd) {
        simA.handleCommand(cmd);
        simB.handleCommand(cmd);
      }

      simA.tick();
      simB.tick();

      if (t % 100 === 0) {
        const snapA = simA.getSnapshot();
        const snapB = simB.getSnapshot();
        expect(snapA).toEqual(snapB);

        const eventsA = simA.drainEvents();
        const eventsB = simB.drainEvents();
        expect(eventsA).toEqual(eventsB);
      }
    }
  });

  it('different seeds produce different spawn X coordinate sequences', () => {
    const sim1 = new GameSimulation({ ...DEFAULT_RUN_CONFIG, seed: 1111 });
    const sim2 = new GameSimulation({ ...DEFAULT_RUN_CONFIG, seed: 9999 });

    sim1.start();
    sim2.start();

    // Run until at least 3 enemies spawn
    for (let i = 0; i < 600; i++) {
      sim1.tick();
      sim2.tick();
    }

    const events1 = sim1.drainEvents().filter((e) => e.type === 'ENEMY_SPAWNED');
    const events2 = sim2.drainEvents().filter((e) => e.type === 'ENEMY_SPAWNED');

    expect(events1.length).toBeGreaterThan(0);
    expect(events2.length).toBeGreaterThan(0);

    const positions1 = events1.map((e) => e.type === 'ENEMY_SPAWNED' && e.position.x);
    const positions2 = events2.map((e) => e.type === 'ENEMY_SPAWNED' && e.position.x);

    expect(positions1).not.toEqual(positions2);
  });
});

describe('Golden Run Deterministic Hash Verification', () => {
  /**
   * EXPECTED GOLDEN HASH FOR SEED 4242 ACROSS 500 TICKS:
   * Computed via SHA-256 over JSON.stringify(events).
   * 
   * GOLDEN HASH UPDATE PROCEDURE:
   * If simulation gameplay rules, event structures, or default configurations are
   * intentionally modified in subsequent steps, compute the new event log hash,
   * verify the emitted events match intended game mechanics, and update this constant.
   */
  const EXPECTED_GOLDEN_HASH =
    '6810ec76c05ef436d399f4aec645ba66b7055fa73ab4a5b59352d399abb53439';

  it('matches the golden SHA-256 hash of a deterministic scripted event log', () => {
    const sim = new GameSimulation({ ...DEFAULT_RUN_CONFIG, seed: 4242 });
    sim.start();

    const allEvents: GameEvent[] = [];

    // Script: step 500 ticks while dispatching inputs
    for (let t = 1; t <= 500; t++) {
      if (t === 10) sim.handleCommand({ type: 'char', char: 'a' });
      if (t === 11) sim.handleCommand({ type: 'char', char: 'b' });
      if (t === 12) sim.handleCommand({ type: 'char', char: 'c' });
      if (t === 50) sim.handleCommand({ type: 'release-target' });
      if (t === 100) sim.handleCommand({ type: 'char', char: 'd' });

      sim.tick();
      allEvents.push(...sim.drainEvents());
    }

    const json = JSON.stringify(allEvents);
    const hash = crypto.createHash('sha256').update(json).digest('hex');

    expect(hash).toBe(EXPECTED_GOLDEN_HASH);
  });
});

describe('Initial Spawn Delay (4.A)', () => {
  it('enforces initialSpawnDelaySeconds before the first enemy spawns', () => {
    const sim = new GameSimulation({
      ...DEFAULT_RUN_CONFIG,
      simulation: {
        ...DEFAULT_RUN_CONFIG.simulation,
        waveIntermissionSeconds: 0,
      },
    });
    sim.start();

    // During ticks 1 to 60 (1.0s delay at 60Hz), no enemy spawns
    for (let t = 1; t <= 60; t++) {
      sim.tick();
      expect(sim.getSnapshot().enemies.length).toBe(0);
    }

    // At tick 61, initial delay expires and first enemy spawns
    sim.tick();
    expect(sim.getSnapshot().enemies.length).toBe(1);
    const events = sim.drainEvents();
    const spawnEvent = events.find((e) => e.type === 'ENEMY_SPAWNED');
    expect(spawnEvent).toBeDefined();
    expect(spawnEvent?.tick).toBe(61);
  });
});

describe('Target Acquisition and Typing Rules (4.C)', () => {
  it('enforces exact event order on correct character and word destruction', () => {
    const mockWordProvider: IWordProvider = {
      nextWord: () => 'arc',
      stats: { fallbacks: 0 },
    };

    const sim = new GameSimulation(
      {
        ...DEFAULT_RUN_CONFIG,
        simulation: {
          ...DEFAULT_RUN_CONFIG.simulation,
          waveIntermissionSeconds: 0,
        },
      },
      mockWordProvider
    );
    sim.start();

    // Advance past initial spawn delay (60 ticks) to tick 61 where first enemy spawns
    for (let t = 0; t < 61; t++) {
      sim.tick();
    }
    sim.drainEvents(); // Clear spawn event

    // Keystroke 1: 'a' acquires target and damages enemy
    sim.handleCommand({ type: 'char', char: 'a' });
    const eventsChar1 = sim.drainEvents();

    expect(eventsChar1.map((e) => e.type)).toEqual([
      'TARGET_LOCKED',
      'INPUT_MATCH',
      'PROJECTILE_SPAWNED',
      'ENEMY_HIT',
    ]);

    // Keystroke 2: 'r' advances word on already-locked target
    sim.handleCommand({ type: 'char', char: 'r' });
    const eventsChar2 = sim.drainEvents();
    expect(eventsChar2.map((e) => e.type)).toEqual([
      'INPUT_MATCH',
      'PROJECTILE_SPAWNED',
      'ENEMY_HIT',
    ]);

    // Keystroke 3: 'c' completes the word: ENEMY_DESTROYED {cause: "word"} then TARGET_LOST
    sim.handleCommand({ type: 'char', char: 'c' });
    const eventsChar3 = sim.drainEvents();
    expect(eventsChar3.map((e) => e.type)).toEqual([
      'INPUT_MATCH',
      'PROJECTILE_SPAWNED',
      'ENEMY_HIT',
      'ENEMY_DESTROYED',
      'TARGET_LOST',
    ]);

    const matchEvent = eventsChar3.find((e) => e.type === 'INPUT_MATCH');
    expect(matchEvent).toBeDefined();
    if (matchEvent && matchEvent.type === 'INPUT_MATCH') {
      expect(matchEvent.scoreAwarded).toBe(1);
    }

    const destroyEvent = eventsChar3.find((e) => e.type === 'ENEMY_DESTROYED');
    expect(destroyEvent).toBeDefined();
    if (destroyEvent && destroyEvent.type === 'ENEMY_DESTROYED') {
      expect(destroyEvent.cause).toBe('word');
    }
  });

  it('tie-breaks target acquisition: smallest squared distance to player, then lowest numeric entity ID (including e9 vs e10)', () => {
    // 1. Distance tie-break:
    let wordCounter = 0;
    const mockWords = ['aim', 'arc'];
    const mockWordProvider: IWordProvider = {
      nextWord: () => {
        const w = mockWords[wordCounter] ?? 'arc';
        wordCounter++;
        return w;
      },
      stats: { fallbacks: 0 },
    };

    const sim = new GameSimulation(
      {
        ...DEFAULT_RUN_CONFIG,
        simulation: {
          ...DEFAULT_RUN_CONFIG.simulation,
          initialSpawnDelaySeconds: 0,
          waveIntermissionSeconds: 0,
        },
      },
      mockWordProvider
    );
    sim.start();

    // Tick 1: Spawns e1 ("aim")
    sim.tick();
    // Advance 169 ticks (interval countdown 168 -> 0) to spawn e2 ("arc")
    for (let i = 0; i <= 168; i++) {
      sim.tick();
    }

    const snapshot = sim.getSnapshot();
    expect(snapshot.enemies.length).toBe(2);

    const e1 = snapshot.enemies.find((e) => e.id === 'e1')!;
    const e2 = snapshot.enemies.find((e) => e.id === 'e2')!;
    expect(e1.position.y).toBeGreaterThan(e2.position.y);

    // Typing 'a' locks onto e1 because e1 is closer to the player
    sim.handleCommand({ type: 'char', char: 'a' });
    expect(sim.getSnapshot().activeTargetId).toBe('e1');

    // 2. Numeric ID tie-break contract: verify numeric comparison prioritizes e9 over e10
    expect(compareEntityIds('e9', 'e10')).toBeLessThan(0); // 9 < 10
    expect('e9' > 'e10').toBe(true); // Lexicographical sort is inverted ("e10" < "e9")
  });

  it('handles mismatch penalties and keeps target lock while locked', () => {
    const mockWordProvider: IWordProvider = {
      nextWord: () => 'beam',
      stats: { fallbacks: 0 },
    };
    const sim = new GameSimulation(
      {
        ...DEFAULT_RUN_CONFIG,
        simulation: {
          ...DEFAULT_RUN_CONFIG.simulation,
          waveIntermissionSeconds: 0,
        },
      },
      mockWordProvider
    );
    sim.start();

    // Advance past initial spawn delay to spawn "beam"
    for (let t = 0; t < 61; t++) {
      sim.tick();
    }
    sim.drainEvents();

    // 1. Unlocked mismatch: typing 'z'
    sim.handleCommand({ type: 'char', char: 'z' });
    let events = sim.drainEvents();
    expect(events.map((e) => e.type)).toEqual(['INPUT_MISMATCH']);
    if (events[0]?.type === 'INPUT_MISMATCH') {
      expect(events[0].activeTargetId).toBeNull();
    }
    let snap = sim.getSnapshot();
    expect(snap.scoring.misses).toBe(1);
    expect(snap.scoring.streak).toBe(0);

    // 2. Correct hit: lock 'b'
    sim.handleCommand({ type: 'char', char: 'b' });
    sim.drainEvents();
    snap = sim.getSnapshot();
    expect(snap.activeTargetId).toBe('e1');
    expect(snap.scoring.streak).toBe(1);

    // 3. Locked mismatch: typing 'x' instead of 'e'
    sim.handleCommand({ type: 'char', char: 'x' });
    events = sim.drainEvents();
    expect(events.map((e) => e.type)).toEqual(['INPUT_MISMATCH']);
    if (events[0]?.type === 'INPUT_MISMATCH') {
      expect(events[0].activeTargetId).toBe('e1');
    }
    snap = sim.getSnapshot();
    // Lock STAYS on mismatch
    expect(snap.activeTargetId).toBe('e1');
    expect(snap.scoring.misses).toBe(2);
    expect(snap.scoring.streak).toBe(0);
  });

  it('release-target command clears the lock, emits TARGET_LOST, and leaves progress intact', () => {
    const mockWordProvider: IWordProvider = {
      nextWord: () => 'core',
      stats: { fallbacks: 0 },
    };
    const sim = new GameSimulation(
      {
        ...DEFAULT_RUN_CONFIG,
        simulation: {
          ...DEFAULT_RUN_CONFIG.simulation,
          waveIntermissionSeconds: 0,
        },
      },
      mockWordProvider
    );
    sim.start();

    // Advance past initial spawn delay to spawn "core"
    for (let t = 0; t < 61; t++) {
      sim.tick();
    }
    sim.drainEvents();

    // Type 'c' to lock and hit
    sim.handleCommand({ type: 'char', char: 'c' });
    sim.drainEvents();
    expect(sim.getSnapshot().activeTargetId).toBe('e1');

    // Release target
    sim.handleCommand({ type: 'release-target' });
    const events = sim.drainEvents();
    expect(events.map((e) => e.type)).toEqual(['TARGET_LOST']);
    expect(sim.getSnapshot().activeTargetId).toBeNull();

    // Progress remains: remainingWord is 'ore'
    const enemy = sim.getSnapshot().enemies.find((e) => e.id === 'e1');
    expect(enemy?.remainingWord).toBe('ore');

    // Calling release-target again is a no-op
    sim.handleCommand({ type: 'release-target' });
    expect(sim.drainEvents()).toEqual([]);
  });

  it('collision removing the locked enemy clears the target lock with TARGET_LOST', () => {
    const mockWordProvider: IWordProvider = {
      nextWord: () => 'drone',
      stats: { fallbacks: 0 },
    };
    const sim = new GameSimulation(
      {
        ...DEFAULT_RUN_CONFIG,
        simulation: {
          ...DEFAULT_RUN_CONFIG.simulation,
          initialSpawnDelaySeconds: 0,
          waveIntermissionSeconds: 0,
        },
      },
      mockWordProvider
    );
    sim.start();
    sim.tick(); // Spawns e1

    // Lock e1 with 'd'
    sim.handleCommand({ type: 'char', char: 'd' });
    expect(sim.getSnapshot().activeTargetId).toBe('e1');
    sim.drainEvents();

    // Advance until e1 collides with player hull
    while (sim.getSnapshot().enemies.length > 0 && sim.getSnapshot().status === 'running') {
      sim.tick();
    }

    // Active lock must be cleared
    expect(sim.getSnapshot().activeTargetId).toBeNull();
    const events = sim.drainEvents();
    expect(events.some((e) => e.type === 'TARGET_LOST' && e.enemyId === 'e1')).toBe(true);
    expect(events.some((e) => e.type === 'PLAYER_DAMAGED')).toBe(true);
  });

  it('evaluates scoring and streak progression (+1 per character)', () => {
    const mockWordProvider: IWordProvider = {
      nextWord: () => 'zap',
      stats: { fallbacks: 0 },
    };
    const sim = new GameSimulation(
      {
        ...DEFAULT_RUN_CONFIG,
        simulation: {
          ...DEFAULT_RUN_CONFIG.simulation,
          waveIntermissionSeconds: 0,
        },
      },
      mockWordProvider
    );
    sim.start();

    // Advance past initial spawn delay
    for (let t = 0; t < 61; t++) {
      sim.tick();
    }

    // 1 char deal exactly 1 pt
    sim.handleCommand({ type: 'char', char: 'z' });
    expect(sim.getSnapshot().scoring.score).toBe(1);
    expect(sim.getSnapshot().scoring.streak).toBe(1);
    expect(sim.getSnapshot().scoring.maxStreak).toBe(1);

    sim.handleCommand({ type: 'char', char: 'a' });
    expect(sim.getSnapshot().scoring.score).toBe(2);
    expect(sim.getSnapshot().scoring.streak).toBe(2);
    expect(sim.getSnapshot().scoring.maxStreak).toBe(2);

    // Final char: +1 pt, no clear bonus = 3 total
    sim.handleCommand({ type: 'char', char: 'p' });
    expect(sim.getSnapshot().scoring.score).toBe(3);
    expect(sim.getSnapshot().scoring.streak).toBe(3);
    expect(sim.getSnapshot().scoring.maxStreak).toBe(3);
    expect(sim.getSnapshot().scoring.wordsCompleted).toBe(1);

    // Mismatch: resets streak to 0, score stays 3, maxStreak stays 3
    sim.handleCommand({ type: 'char', char: 'x' });
    expect(sim.getSnapshot().scoring.score).toBe(3);
    expect(sim.getSnapshot().scoring.streak).toBe(0);
    expect(sim.getSnapshot().scoring.maxStreak).toBe(3);
  });

  it('evaluates accuracy 100% at zero attempts and WPM 0 at zero elapsed ticks', () => {
    const sim = new GameSimulation(DEFAULT_RUN_CONFIG);
    sim.start();

    const snapshot = sim.getSnapshot();
    expect(snapshot.scoring.accuracy).toBe(100);
    expect(snapshot.scoring.wpm).toBe(0);
    expect(snapshot.scoring.hits).toBe(0);
    expect(snapshot.scoring.misses).toBe(0);
  });
});

describe('Hull Collision and 3-Life Defeat Flow (1.D, D2)', () => {
  it('enforces 3 lives: exactly three collisions end the run with correct event sequence', () => {
    const sim = new GameSimulation(DEFAULT_RUN_CONFIG);
    sim.start();

    expect(sim.getSnapshot().player.health).toBe(3);
    expect(sim.getSnapshot().player.maxHealth).toBe(3);

    let collisionsCount = 0;

    // Step simulation until game over (expecting 3 collisions)
    for (let t = 0; t < 3000; t++) {
      sim.tick();
      const events = sim.drainEvents();
      const damageEvent = events.find((e) => e.type === 'PLAYER_DAMAGED');
      if (damageEvent && damageEvent.type === 'PLAYER_DAMAGED') {
        collisionsCount++;
        expect(damageEvent.damage).toBe(1);
        expect(damageEvent.currentHealth).toBe(3 - collisionsCount);

        const destroyEvent = events.find((e) => e.type === 'ENEMY_DESTROYED');
        expect(destroyEvent).toBeDefined();
        if (destroyEvent && destroyEvent.type === 'ENEMY_DESTROYED') {
          expect(destroyEvent.cause).toBe('collision');
        }

        if (collisionsCount === 3) {
          const gameOverEvent = events.find((e) => e.type === 'GAME_OVER');
          expect(gameOverEvent).toBeDefined();
          // Verify dispatch order: PLAYER_DAMAGED -> ENEMY_DESTROYED -> GAME_OVER
          const damageIdx = events.findIndex((e) => e.type === 'PLAYER_DAMAGED');
          const destroyIdx = events.findIndex((e) => e.type === 'ENEMY_DESTROYED');
          const gameOverIdx = events.findIndex((e) => e.type === 'GAME_OVER');
          expect(damageIdx).toBeLessThan(destroyIdx);
          expect(destroyIdx).toBeLessThan(gameOverIdx);
          break;
        }
      }
    }

    expect(collisionsCount).toBe(3);
    expect(sim.getSnapshot().status).toBe('game-over');
    expect(sim.getSnapshot().player.health).toBe(0);
    expect(sim.getSnapshot().player.alive).toBe(false);

    const result = sim.getResult();
    expect(result).not.toBeNull();
    expect(result?.outcome).toBe('defeat');
    expect(result?.durationMs).toBeGreaterThan(0);
  });

  it('ignores commands and ticks after game over', () => {
    const sim = new GameSimulation(DEFAULT_RUN_CONFIG);
    sim.start();

    while (sim.getSnapshot().status !== 'game-over') {
      sim.tick();
    }

    sim.drainEvents();
    const ticksAtGameOver = sim.currentTick;

    // Further commands and ticks should be ignored
    sim.handleCommand({ type: 'char', char: 'a' });
    sim.tick();

    expect(sim.currentTick).toBe(ticksAtGameOver);
    expect(sim.drainEvents()).toEqual([]);
  });

  it('start() after game-over completely resets simulation state to 3 lives', () => {
    const sim = new GameSimulation(DEFAULT_RUN_CONFIG);
    sim.start();

    while (sim.getSnapshot().status !== 'game-over') {
      sim.tick();
    }

    expect(sim.getSnapshot().status).toBe('game-over');

    // Restart
    sim.start();
    expect(sim.getSnapshot().status).toBe('running');
    expect(sim.getSnapshot().player.health).toBe(3);
    expect(sim.getSnapshot().player.maxHealth).toBe(3);
    expect(sim.getSnapshot().player.alive).toBe(true);
    expect(sim.getSnapshot().scoring.score).toBe(0);
    expect(sim.currentTick).toBe(0);
  });
});

describe('Pause and Resume Controls (4.B)', () => {
  it('freezes simulation progression and ignores commands while paused', () => {
    const sim = new GameSimulation(DEFAULT_RUN_CONFIG);
    sim.start();
    sim.tick();
    sim.tick();

    const tickBeforePause = sim.currentTick;
    sim.pause();
    expect(sim.getSnapshot().status).toBe('paused');

    sim.tick();
    sim.handleCommand({ type: 'char', char: 'a' });
    expect(sim.currentTick).toBe(tickBeforePause);

    sim.resume();
    expect(sim.getSnapshot().status).toBe('running');
    sim.tick();
    expect(sim.currentTick).toBe(tickBeforePause + 1);
  });
});

describe('Wave Progression, Intermission and Concurrent Cap (4.E, 2.D)', () => {
  it('advances waves, enters intermission, and transitions with exact event order', () => {
    const mockWordProvider: IWordProvider = {
      nextWord: () => 'pod',
      stats: { fallbacks: 0 },
    };
    const sim = new GameSimulation(
      {
        ...DEFAULT_RUN_CONFIG,
        simulation: {
          ...DEFAULT_RUN_CONFIG.simulation,
          initialSpawnDelaySeconds: 0,
          waveIntermissionSeconds: 1, // 60 ticks
          waveScaling: {
            ...DEFAULT_RUN_CONFIG.simulation.waveScaling,
            quotaBase: 1, // 1 enemy completes wave 1
          },
        },
      },
      mockWordProvider
    );

    sim.start();
    const initialEvents = sim.drainEvents();
    expect(initialEvents.some((e) => e.type === 'WAVE_INTERMISSION')).toBe(true);

    // Step through 60 initial intermission ticks to start wave 1
    for (let i = 0; i < 60; i++) {
      sim.tick();
    }
    const wave1StartEvents = sim.drainEvents();
    expect(wave1StartEvents.some((e) => e.type === 'WAVE_STARTED')).toBe(true);

    // Clear wave 1 quota (5 enemies)
    for (let q = 1; q <= 5; q++) {
      sim.tick(); // Spawn enemy
      sim.handleCommand({ type: 'char', char: 'p' });
      sim.handleCommand({ type: 'char', char: 'o' });
      sim.handleCommand({ type: 'char', char: 'd' });
      sim.tick(); // Destroy enemy
      if (q < 5) {
        for (let i = 0; i <= 168; i++) {
          sim.tick();
        }
      }
    }

    const events = sim.drainEvents();
    const waveClearEvent = events.find((e) => e.type === 'WAVE_COMPLETED');
    expect(waveClearEvent).toBeDefined();
    if (waveClearEvent && waveClearEvent.type === 'WAVE_COMPLETED') {
      expect(waveClearEvent.waveNumber).toBe(1);
    }
    const intermissionEvent = events.find((e) => e.type === 'WAVE_INTERMISSION');
    expect(intermissionEvent).toBeDefined();
    if (intermissionEvent && intermissionEvent.type === 'WAVE_INTERMISSION') {
      expect(intermissionEvent.nextWave).toBe(2);
      expect(intermissionEvent.durationTicks).toBe(60);
    }

    expect(sim.getSnapshot().wave.isCompleted).toBe(true);

    // Step through 60 intermission ticks
    for (let i = 0; i < 60; i++) {
      sim.tick();
    }

    const nextWaveEvents = sim.drainEvents();
    const nextWaveStart = nextWaveEvents.find((e) => e.type === 'WAVE_STARTED');
    expect(nextWaveStart).toBeDefined();
    if (nextWaveStart && nextWaveStart.type === 'WAVE_STARTED') {
      expect(nextWaveStart.waveNumber).toBe(2);
    }
  });

  it('runs initial WAVE_INTERMISSION for 90 ticks and freezes during pause (Decision D4)', () => {
    const sim = new GameSimulation(DEFAULT_RUN_CONFIG);
    sim.start();

    const startEvents = sim.drainEvents();
    expect(startEvents).toHaveLength(1);
    expect(startEvents[0]).toMatchObject({
      type: 'WAVE_INTERMISSION',
      nextWave: 1,
      durationTicks: 90,
      tick: 0,
    });
    expect(sim.getSnapshot().wave.isCompleted).toBe(true);

    // Advance 30 ticks
    for (let i = 0; i < 30; i++) {
      sim.tick();
      expect(sim.getSnapshot().enemies).toHaveLength(0);
    }

    // Pause simulation: intermission timer must freeze
    sim.pause();
    for (let i = 0; i < 30; i++) {
      sim.tick();
    }
    expect(sim.getSnapshot().wave.isCompleted).toBe(true);

    // Resume simulation
    sim.resume();
    // Advance 59 ticks (total active = 89 ticks)
    for (let i = 0; i < 59; i++) {
      sim.tick();
    }
    expect(sim.drainEvents()).toEqual([]);
    expect(sim.getSnapshot().wave.isCompleted).toBe(true);

    // 90th active tick: triggers WAVE_STARTED(1)
    sim.tick();
    const waveEvents = sim.drainEvents();
    const started = waveEvents.find((e) => e.type === 'WAVE_STARTED');
    expect(started).toBeDefined();
    if (started && started.type === 'WAVE_STARTED') {
      expect(started.waveNumber).toBe(1);
      expect(started.quota).toBe(5);
    }
    expect(sim.getSnapshot().wave.isCompleted).toBe(false);
  });

  it('skips spawn when active enemies reach concurrent cap and restarts countdown', () => {
    const sim = new GameSimulation({
      ...DEFAULT_RUN_CONFIG,
      simulation: {
        ...DEFAULT_RUN_CONFIG.simulation,
        initialSpawnDelaySeconds: 0,
        waveIntermissionSeconds: 0,
      },
    });

    sim.start();
    sim.tick(); // Spawns e1 (alive = 1, cap = 2 in wave 1)
    expect(sim.getSnapshot().enemies.length).toBe(1);

    // Advance until second enemy spawns (interval is 2.8s = 168 ticks)
    for (let i = 0; i <= 168; i++) {
      sim.tick();
    }
    expect(sim.getSnapshot().enemies.length).toBe(2);

    // Advance 200 more ticks without typing; cap is 2 so no new enemies spawn
    for (let i = 0; i < 200; i++) {
      sim.tick();
    }
    expect(sim.getSnapshot().enemies.length).toBe(2);
  });
});

describe('Snapshot Isolation Security', () => {
  it('mutating a returned snapshot does not corrupt simulation state', () => {
    const sim = new GameSimulation(DEFAULT_RUN_CONFIG);
    sim.start();

    // Advance past initial intermission (150 ticks) and spawn delay (60 ticks)
    for (let t = 0; t < 220; t++) {
      sim.tick();
    }

    const snapshot = sim.getSnapshot();
    // Force mutation past readonly
    (snapshot.player as { health: number }).health = 0;
    (snapshot.player.position as { x: number }).x = 9999;
    (snapshot.enemies as unknown[]).length = 0;

    // Fresh snapshot should retain uncorrupted internal state
    const freshSnapshot = sim.getSnapshot();
    expect(freshSnapshot.player.health).toBe(DEFAULT_RUN_CONFIG.simulation.playerMaxHealth);
    expect(freshSnapshot.player.position.x).toBe(DEFAULT_RUN_CONFIG.playerStart.x);
    expect(freshSnapshot.enemies.length).toBeGreaterThanOrEqual(1);
  });
});

describe('1.C Result Data & Snapshot Metrics', () => {
  it('increments elapsedTicks strictly while running and freezes while paused', () => {
    const sim = new GameSimulation(DEFAULT_RUN_CONFIG);
    sim.start();

    for (let t = 0; t < 50; t++) {
      sim.tick();
    }
    expect(sim.getSnapshot().elapsedTicks).toBe(50);

    // Pause simulation
    sim.pause();
    expect(sim.getSnapshot().status).toBe('paused');
    for (let t = 0; t < 30; t++) {
      sim.tick();
    }
    // elapsedTicks must remain frozen at 50
    expect(sim.getSnapshot().elapsedTicks).toBe(50);

    // Resume simulation
    sim.resume();
    expect(sim.getSnapshot().status).toBe('running');
    for (let t = 0; t < 20; t++) {
      sim.tick();
    }
    expect(sim.getSnapshot().elapsedTicks).toBe(70);
  });

  it('exposes all 1.C metrics on snapshot and getResult()', () => {
    const mockWordProvider: IWordProvider = {
      nextWord: () => 'ace',
      stats: { fallbacks: 0 },
    };
    const sim = new GameSimulation(
      {
        ...DEFAULT_RUN_CONFIG,
        simulation: {
          ...DEFAULT_RUN_CONFIG.simulation,
          waveIntermissionSeconds: 0,
        },
      },
      mockWordProvider
    );
    sim.start();

    // Advance 61 ticks to spawn first enemy
    for (let t = 0; t < 61; t++) {
      sim.tick();
    }

    // Type 2 hits: 'a', 'c'
    sim.handleCommand({ type: 'char', char: 'a' });
    sim.handleCommand({ type: 'char', char: 'c' });

    // 1 miss: 'x'
    sim.handleCommand({ type: 'char', char: 'x' });

    // Complete word: 'e'
    sim.handleCommand({ type: 'char', char: 'e' });

    // Advance 59 more ticks -> total elapsed ticks = 120 (2 seconds)
    for (let t = 0; t < 59; t++) {
      sim.tick();
    }

    const snap = sim.getSnapshot();
    expect(snap.scoring.hits).toBe(3);
    expect(snap.scoring.misses).toBe(1);
    expect(snap.scoring.accuracy).toBe(75); // 3 / 4 * 100
    expect(snap.scoring.streak).toBe(1);
    expect(snap.scoring.maxStreak).toBe(2);
    expect(snap.scoring.wordsDestroyed).toBe(1);
    expect(snap.scoring.score).toBe(3);
    expect(snap.wave.waveNumber).toBe(1);
    expect(snap.elapsedTicks).toBe(120);

    const result = sim.getResult();
    expect(result).not.toBeNull();
    if (result) {
      expect(result.score).toBe(3);
      expect(result.wave).toBe(1);
      expect(result.maxStreak).toBe(2);
      expect(result.wordsDestroyed).toBe(1);
      expect(result.hits).toBe(3);
      expect(result.misses).toBe(1);
      expect(result.accuracy).toBe(75.0);
      expect(result.grossWpm).toBeGreaterThan(0);
      expect(result.netWpm).toBeGreaterThanOrEqual(0);
      expect(result.durationSeconds).toBe(2);
    }
  });
});

