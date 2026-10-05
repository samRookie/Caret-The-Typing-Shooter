/**
 * ============================================================================
 * DETERMINISTIC TYPING SHOOTING SIMULATION ENGINE
 * ============================================================================
 * 
 * CORE TYPING & GAMEPLAY RULES (4.C):
 * 1. Commands are ignored unless status === "running".
 * 2. Health per letter: at spawn maxHealth = health = word.length; each correct char
 *    deals 1 damage; the word completes exactly when health reaches 0.
 * 3. Acquire a target (no lock): among alive enemies, match the typed char against
 *    remainingWord[0]. Tie-break: smallest squared distance to the player, then lowest
 *    numeric id. A match locks the target.
 * 4. No match while unlocked: INPUT_MISMATCH (activeTargetId: null), misses +1,
 *    streak 0, multiplier 1.
 * 5. While locked: char must equal the locked enemy's remainingWord[0]. A mismatch
 *    applies the same penalty and the lock stays.
 * 6. release-target: clears the lock, keeps typed progress, emits TARGET_LOST,
 *    no penalty. No-op when unlocked.
 * 7. Event order for a correct char: [TARGET_LOCKED only if this char acquired the lock],
 *    INPUT_MATCH, PROJECTILE_SPAWNED, ENEMY_HIT. On the final char additionally
 *    ENEMY_DESTROYED{cause:"word"}, then TARGET_LOST.
 * 8. Scoring: on a correct char: streak +1; multiplier = lookup(streak); score +=
 *    scorePerChar * multiplier. On word completion: score += enemyClearBonus * multiplier.
 *    ENEMY_DESTROYED.scoreAwarded = the clear bonus only. wordsCompleted +1; track maxStreak.
 * 9. accuracy = 100 * hits / (hits + misses), and 100 when hits + misses = 0.
 *    wpm = (hits / 5) / minutes, 0 when elapsed ticks = 0.
 * 10. ENEMY_DESTROYED carries the enemy's position at the moment of the kill
 *     (the renderer plays the death effect after the entity leaves the snapshot).
 * 11. Collision: squared distance <= (enemy.hitboxRadius + hullRadius)^2. Events in order:
 *     PLAYER_DAMAGED, ENEMY_DESTROYED{cause:"collision", scoreAwarded:0}, TARGET_LOST
 *     (if it was the locked enemy), then GAME_OVER if health <= 0. Collisions do not touch
 *     streak or accuracy.
 * 12. Game over: status = "game-over"; getResult() builds GameResult (outcome "defeat",
 *     rating from accuracy thresholds, durationMs derived from ticks). After game-over,
 *     tick() and commands do nothing. start() fully resets state.
 * 13. GameMode: accept "standard" | "endless" | "precision"; only standard behavior exists
 *     (TODO(phase2) for the others).
 * 
 * TICK PIPELINE ORDER:
 * [if not running return] -> tick++ -> wave state machine/spawns -> move enemies ->
 * collisions in ascending numeric id -> game-over check -> wave-completion check.
 * ============================================================================
 */

import {
  CharacterInput,
  EnemyState,
  GameCommand,
  GameEvent,
  GameMode,
  GameResult,
  GameSnapshot,
  GameStatus,
  PerformanceRating,
  PlayerState,
  RatingThresholds,
  RunConfig,
  ScoringRules,
  Vector2,
  WaveState,
} from '@/shared/domain';
import {
  DEFAULT_RUN_CONFIG,
  DEFAULT_SCORING_RULES,
  DRONE_ARCHETYPE,
} from '@/shared/config/defaultConfig';
import { RngStreams, createRngStreams } from './prng';
import { DefaultWordProvider, IWordProvider } from './words';
import { EntityIdGenerator, compareEntityIds } from './entityId';

export interface InternalEnemy extends EnemyState {
  health: number;
  remainingWord: string;
  alive: boolean;
  position: Vector2;
  velocity: Vector2;
}

interface RecentSpawnRecord {
  readonly x: number;
  readonly wordLength: number;
  readonly tick: number;
}

export class GameSimulation {
  private config: RunConfig;
  private scoringRules: ScoringRules;
  private status: GameStatus = 'idle';
  private mode: GameMode = 'standard';
  private tickIndex: number = 0;

  // RNG Streams
  private rngStreams: RngStreams;
  private wordProvider: IWordProvider;
  private idGenerator: EntityIdGenerator = new EntityIdGenerator();

  // Entities
  private player: PlayerState;
  private enemies: InternalEnemy[] = [];
  private activeTargetId: string | null = null;

  // Wave Tracking
  private waveNumber: number = 1;
  private waveSpawnedCount: number = 0;
  private waveQuota: number = 6;
  private spawnCountdownTicks: number = 0;
  private intermissionCountdownTicks: number = 0;
  private isIntermission: boolean = false;
  private recentSpawns: RecentSpawnRecord[] = [];

  // Scoring
  private score: number = 0;
  private streak: number = 0;
  private maxStreak: number = 0;
  private multiplier: number = 1;
  private hits: number = 0;
  private misses: number = 0;
  private wordsCompleted: number = 0;

  // Events & Results
  private eventQueue: GameEvent[] = [];
  private gameResult: GameResult | null = null;

  constructor(
    config: RunConfig = DEFAULT_RUN_CONFIG,
    customWordProvider?: IWordProvider,
    customStreams?: RngStreams
  ) {
    this.config = config;
    this.scoringRules = DEFAULT_SCORING_RULES;
    this.rngStreams = customStreams ?? createRngStreams(config.seed);
    this.wordProvider =
      customWordProvider ?? new DefaultWordProvider(this.rngStreams.wordRng);

    this.player = {
      position: { ...config.playerStart },
      health: config.difficulty.playerMaxHealth,
      maxHealth: config.difficulty.playerMaxHealth,
      alive: true,
      isDamaged: false,
    };
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE CONTROLS
  // --------------------------------------------------------------------------

  start(config?: RunConfig, customWordProvider?: IWordProvider, customStreams?: RngStreams): void {
    if (config) {
      this.config = config;
    }
    this.tickIndex = 0;
    this.status = 'running';
    this.mode = this.config.mode ?? 'standard';
    if (this.mode === 'endless') {
      // TODO(phase2): Implement endless mode progression
    } else if (this.mode === 'precision') {
      // TODO(phase2): Implement precision mode restrictions
    }
    this.gameResult = null;
    this.eventQueue = [];
    this.enemies = [];
    this.activeTargetId = null;
    this.recentSpawns = [];
    this.idGenerator.reset();

    // Reinitialize PRNG streams
    if (customStreams) {
      this.rngStreams = customStreams;
    } else {
      this.rngStreams = createRngStreams(this.config.seed);
    }

    if (customWordProvider) {
      this.wordProvider = customWordProvider;
    } else if (!this.wordProvider || this.wordProvider instanceof DefaultWordProvider) {
      this.wordProvider = new DefaultWordProvider(this.rngStreams.wordRng);
    }

    // Initialize player
    this.player = {
      position: { ...this.config.playerStart },
      health: this.config.difficulty.playerMaxHealth,
      maxHealth: this.config.difficulty.playerMaxHealth,
      alive: true,
      isDamaged: false,
    };

    // Initialize scoring
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.multiplier = 1;
    this.hits = 0;
    this.misses = 0;
    this.wordsCompleted = 0;

    // Initialize Wave 1
    this.waveNumber = 1;
    this.waveSpawnedCount = 0;
    this.isIntermission = false;
    this.intermissionCountdownTicks = 0;
    this.calculateWaveParams();

    // Initial spawn delay: delay before the first spawn of a run
    this.spawnCountdownTicks = Math.round(
      this.config.simulation.initialSpawnDelaySeconds * this.config.tickRate
    );

    // Emit initial WAVE_STARTED
    this.emit({
      type: 'WAVE_STARTED',
      waveNumber: this.waveNumber,
      quota: this.waveQuota,
      tick: this.currentTick,
    });
  }

  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
    }
  }

  get currentTick(): number {
    return this.tickIndex;
  }

  get tickCount(): number {
    return this.tickIndex;
  }

  // --------------------------------------------------------------------------
  // FIXED STEP UPDATE (60Hz)
  // Pipeline: [if not running return] -> tick++ -> wave state machine/spawns ->
  // move enemies -> collisions in ascending numeric id -> game-over check -> wave-completion check
  // --------------------------------------------------------------------------

  tick(): void {
    if (this.status !== 'running') {
      return;
    }

    this.tickIndex++;
    this.player = { ...this.player, isDamaged: false };

    // 1. Advance Wave Spawning or Intermission
    this.updateWavePacing();

    // 2. Move Active Enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.position = {
        x: enemy.position.x + enemy.velocity.x,
        y: enemy.position.y + enemy.velocity.y,
      };
    }

    // 3. Check Hull Collisions in ascending numeric id
    this.checkCollisions();

    // 4. Game-Over Check
    if ((this.status as GameStatus) === 'game-over') {
      return;
    }

    // 5. Check Wave Clear
    this.checkWaveCompletion();
  }

  // --------------------------------------------------------------------------
  // COMMAND HANDLING
  // --------------------------------------------------------------------------

  handleCommand(command: GameCommand): void {
    if (this.status !== 'running') {
      return;
    }

    if (command.type === 'release-target') {
      this.releaseTarget();
      return;
    }

    if (command.type === 'char') {
      this.handleCharInput(command);
    }
  }

  private releaseTarget(): void {
    if (this.activeTargetId !== null) {
      const prevId = this.activeTargetId;
      this.activeTargetId = null;
      this.emit({
        type: 'TARGET_LOST',
        enemyId: prevId,
        tick: this.currentTick,
      });
    }
  }

  private handleCharInput(input: CharacterInput): void {
    const rawChar = input.char.toLowerCase();

    // Case 1: Target Already Locked
    if (this.activeTargetId !== null) {
      const targetEnemy = this.enemies.find(
        (e) => e.id === this.activeTargetId && e.alive
      );

      if (!targetEnemy) {
        // Locked enemy was destroyed or removed
        this.activeTargetId = null;
        this.handleCharInput(input);
        return;
      }

      const expectedChar = targetEnemy.remainingWord[0];
      if (rawChar === expectedChar) {
        this.processCorrectHit(targetEnemy, rawChar, false);
      } else {
        this.processMismatch(rawChar, this.activeTargetId);
      }
      return;
    }

    // Case 2: No Target Currently Locked (Acquisition Phase)
    const matchingEnemies = this.enemies.filter(
      (e) => e.alive && e.remainingWord.length > 0 && e.remainingWord[0] === rawChar
    );

    if (matchingEnemies.length === 0) {
      this.processMismatch(rawChar, null);
      return;
    }

    // Tie-break: smallest squared distance to player, then lowest numeric entity ID
    matchingEnemies.sort((a, b) => {
      const distA = this.squaredDist(a.position, this.player.position);
      const distB = this.squaredDist(b.position, this.player.position);
      if (distA !== distB) {
        return distA - distB;
      }
      return compareEntityIds(a.id, b.id);
    });

    const chosen = matchingEnemies[0];
    if (!chosen) {
      this.processMismatch(rawChar, null);
      return;
    }

    // Lock target and emit TARGET_LOCKED
    this.activeTargetId = chosen.id;
    this.emit({
      type: 'TARGET_LOCKED',
      enemyId: chosen.id,
      word: chosen.word,
      position: { ...chosen.position },
      tick: this.currentTick,
    });

    this.processCorrectHit(chosen, rawChar, true);
  }

  private processCorrectHit(
    enemy: InternalEnemy,
    char: string,
    _freshlyLocked: boolean
  ): void {
    this.hits++;
    this.streak++;
    if (this.streak > this.maxStreak) {
      this.maxStreak = this.streak;
    }
    this.multiplier = this.computeMultiplier(this.streak);
    this.score += this.scoringRules.scorePerChar * this.multiplier;

    // Advance word substring & reduce health
    enemy.remainingWord = enemy.remainingWord.slice(1);
    enemy.health -= 1;

    // Events: INPUT_MATCH -> PROJECTILE_SPAWNED -> ENEMY_HIT
    this.emit({
      type: 'INPUT_MATCH',
      char,
      enemyId: enemy.id,
      remainingWord: enemy.remainingWord,
      tick: this.currentTick,
    });

    this.emit({
      type: 'PROJECTILE_SPAWNED',
      from: { ...this.player.position },
      to: { ...enemy.position },
      targetEnemyId: enemy.id,
      tick: this.currentTick,
    });

    this.emit({
      type: 'ENEMY_HIT',
      enemyId: enemy.id,
      damage: 1,
      position: { ...enemy.position },
      tick: this.currentTick,
    });

    // Check Word Completion
    if (enemy.health <= 0 || enemy.remainingWord.length === 0) {
      enemy.alive = false;
      this.wordsCompleted++;

      const clearBonus = this.scoringRules.enemyClearBonus * this.multiplier;
      this.score += clearBonus;

      // Event order on kill: ENEMY_DESTROYED -> TARGET_LOST
      this.emit({
        type: 'ENEMY_DESTROYED',
        enemyId: enemy.id,
        scoreAwarded: clearBonus,
        position: { ...enemy.position },
        cause: 'word',
        tick: this.currentTick,
      });

      if (this.activeTargetId === enemy.id) {
        this.emit({
          type: 'TARGET_LOST',
          enemyId: enemy.id,
          tick: this.currentTick,
        });
        this.activeTargetId = null;
      }

      // Remove from active list
      this.enemies = this.enemies.filter((e) => e.id !== enemy.id);
    }
  }

  private processMismatch(char: string, lockedEnemyId: string | null): void {
    this.misses++;
    this.streak = 0;
    this.multiplier = 1;

    this.emit({
      type: 'INPUT_MISMATCH',
      char,
      activeTargetId: lockedEnemyId,
      tick: this.currentTick,
    });
  }

  // --------------------------------------------------------------------------
  // SPAWNING & WAVE PROGRESSION (B4)
  // --------------------------------------------------------------------------

  private calculateWaveParams(): void {
    const wave = this.waveNumber;
    const scaling = this.config.simulation.waveScaling;

    // Quota formula: min(6 + 2*(wave-1), 30)
    this.waveQuota = Math.min(
      scaling.quotaBase + scaling.quotaPerWave * (wave - 1),
      scaling.quotaMax
    );
  }

  private getWaveSpawnIntervalTicks(): number {
    const wave = this.waveNumber;
    const scaling = this.config.simulation.waveScaling;
    const baseMs = this.config.difficulty.spawnIntervalMs;

    // interval = max(60% of base, base * 0.94^(wave-1))
    const scaledMs = Math.max(
      scaling.spawnIntervalMinRatio * baseMs,
      baseMs * Math.pow(scaling.spawnIntervalDecay, wave - 1)
    );

    return Math.round((scaledMs / 1000) * this.config.tickRate);
  }

  private getWaveSpeedPerTick(): number {
    const wave = this.waveNumber;
    const scaling = this.config.simulation.waveScaling;
    const baseSpeed = this.config.difficulty.enemySpeed;

    // speed = min(base * (1 + 0.06*(wave-1)), 2 * base)
    const scaledSpeed = Math.min(
      baseSpeed * (1 + scaling.speedScalePerWave * (wave - 1)),
      scaling.speedScaleMaxRatio * baseSpeed
    );

    return scaledSpeed / this.config.tickRate;
  }

  private updateWavePacing(): void {
    if (this.isIntermission) {
      this.intermissionCountdownTicks--;
      if (this.intermissionCountdownTicks <= 0) {
        this.isIntermission = false;
        this.waveNumber++;
        this.waveSpawnedCount = 0;
        this.calculateWaveParams();
        this.spawnCountdownTicks = 0;

        this.emit({
          type: 'WAVE_STARTED',
          waveNumber: this.waveNumber,
          quota: this.waveQuota,
          tick: this.currentTick,
        });
      }
      return;
    }

    // If whole quota for wave has been spawned, wait for remaining to die
    if (this.waveSpawnedCount >= this.waveQuota) {
      return;
    }

    if (this.spawnCountdownTicks > 0) {
      this.spawnCountdownTicks--;
      return;
    }

    // Concurrent enemy cap check
    const aliveCount = this.enemies.filter((e) => e.alive).length;
    if (aliveCount >= this.config.difficulty.maxConcurrentEnemies) {
      // Skip spawn, restart countdown
      this.spawnCountdownTicks = this.getWaveSpawnIntervalTicks();
      return;
    }

    // Spawn Enemy
    this.spawnEnemy();
    this.waveSpawnedCount++;
    this.spawnCountdownTicks = this.getWaveSpawnIntervalTicks();
  }

  private spawnEnemy(): void {
    const simConfig = this.config.simulation;
    const diff = this.config.difficulty;
    const scaling = simConfig.waveScaling;
    const width = this.config.virtualResolution.width;

    // Word Length Bounds
    const maxWordLen = Math.min(
      diff.wordLengthRange.max + Math.floor((this.waveNumber - 1) / scaling.wordLengthWaveStep),
      scaling.maxWordLengthCap
    );
    const minWordLen = diff.wordLengthRange.min;

    // Exclusions for word selection
    const activeFirstChars = new Set<string>();
    const activeWords = new Set<string>();
    for (const e of this.enemies) {
      if (e.alive && e.remainingWord.length > 0) {
        const first = e.remainingWord[0];
        if (first) activeFirstChars.add(first);
        activeWords.add(e.word);
      }
    }

    const assignedWord = this.wordProvider.nextWord({
      minLen: minWordLen,
      maxLen: maxWordLen,
      excludeFirstLetters: activeFirstChars,
      excludeWords: activeWords,
    });

    // Horizontal Spawning with Gap Window Retries
    const gapWindowTicks = Math.round(
      simConfig.spawnGapWindowSeconds * this.config.tickRate
    );
    const recent = this.recentSpawns.filter(
      (r) => this.currentTick - r.tick <= gapWindowTicks
    );

    let chosenX = 0;
    const minX = simConfig.spawnMarginX;
    const maxX = width - simConfig.spawnMarginX;

    if (recent.length === 0) {
      chosenX = this.rngStreams.spawnRng.intBetween(minX, maxX);
    } else {
      let bestX = 0;
      let maxMinGap = -1;
      let foundCleanCandidate = false;

      // Draw up to 6 times (1 initial + 5 retries)
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidateX = this.rngStreams.spawnRng.intBetween(minX, maxX);

        let minGapForCandidate = Infinity;
        let candidateValid = true;

        for (const r of recent) {
          const requiredGap =
            simConfig.labelCharWidthPx * Math.max(assignedWord.length, r.wordLength);
          const gap = Math.abs(candidateX - r.x);
          if (gap < minGapForCandidate) {
            minGapForCandidate = gap;
          }
          if (gap < requiredGap) {
            candidateValid = false;
          }
        }

        if (minGapForCandidate > maxMinGap) {
          maxMinGap = minGapForCandidate;
          bestX = candidateX;
        }

        if (candidateValid) {
          chosenX = candidateX;
          foundCleanCandidate = true;
          break;
        }
      }

      if (!foundCleanCandidate) {
        chosenX = bestX;
      }
    }

    this.recentSpawns.push({
      x: chosenX,
      wordLength: assignedWord.length,
      tick: this.currentTick,
    });

    const enemyId = this.idGenerator.next();
    const spawnPos: Vector2 = { x: chosenX, y: simConfig.spawnY };

    // Compute velocity once: direction to player * speed per tick
    const dx = this.player.position.x - spawnPos.x;
    const dy = this.player.position.y - spawnPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speedPerTick = this.getWaveSpeedPerTick();

    const velocity: Vector2 = {
      x: dist > 0 ? (dx / dist) * speedPerTick : 0,
      y: dist > 0 ? (dy / dist) * speedPerTick : speedPerTick,
    };

    const enemy: InternalEnemy = {
      id: enemyId,
      type: 'drone',
      position: spawnPos,
      velocity,
      word: assignedWord,
      remainingWord: assignedWord,
      health: assignedWord.length * DRONE_ARCHETYPE.healthPerLetter,
      maxHealth: assignedWord.length * DRONE_ARCHETYPE.healthPerLetter,
      alive: true,
      spawnTick: this.currentTick,
    };

    this.enemies.push(enemy);

    this.emit({
      type: 'ENEMY_SPAWNED',
      enemyId,
      position: { ...spawnPos },
      tick: this.currentTick,
    });
  }

  // --------------------------------------------------------------------------
  // COLLISIONS & DEFEAT (B2)
  // --------------------------------------------------------------------------

  private checkCollisions(): void {
    const simConfig = this.config.simulation;
    const collisionThreshold = DRONE_ARCHETYPE.hitboxRadius + simConfig.hullRadius;
    const thresholdSq = collisionThreshold * collisionThreshold;

    const aliveEnemies = this.enemies
      .filter((e) => e.alive)
      .sort((a, b) => compareEntityIds(a.id, b.id));

    for (const enemy of aliveEnemies) {
      if (!enemy.alive) continue;

      const distSq = this.squaredDist(enemy.position, this.player.position);
      if (distSq <= thresholdSq) {
        this.handleHullCollision(enemy);
        if ((this.status as GameStatus) === 'game-over') {
          break;
        }
      }
    }
  }

  private handleHullCollision(enemy: InternalEnemy): void {
    const damage = this.config.simulation.collisionDamage;
    const newHealth = Math.max(0, this.player.health - damage);
    const isDead = newHealth <= 0;

    this.player = {
      ...this.player,
      health: newHealth,
      alive: !isDead,
      isDamaged: true,
    };

    enemy.alive = false;

    // Event order: PLAYER_DAMAGED -> ENEMY_DESTROYED -> TARGET_LOST (if locked) -> GAME_OVER (if dead)
    this.emit({
      type: 'PLAYER_DAMAGED',
      damage,
      currentHealth: newHealth,
      tick: this.currentTick,
    });

    this.emit({
      type: 'ENEMY_DESTROYED',
      enemyId: enemy.id,
      scoreAwarded: 0,
      position: { ...enemy.position },
      cause: 'collision',
      tick: this.currentTick,
    });

    if (this.activeTargetId === enemy.id) {
      this.emit({
        type: 'TARGET_LOST',
        enemyId: enemy.id,
        tick: this.currentTick,
      });
      this.activeTargetId = null;
    }

    this.enemies = this.enemies.filter((e) => e.id !== enemy.id);

    if (isDead) {
      this.triggerGameOver('defeat');
    }
  }

  private checkWaveCompletion(): void {
    if (this.isIntermission || this.status !== 'running') {
      return;
    }

    if (this.waveSpawnedCount >= this.waveQuota) {
      const aliveCount = this.enemies.filter((e) => e.alive).length;
      if (aliveCount === 0) {
        // Wave complete!
        const bonus = this.config.simulation.waveClearBonus * this.waveNumber;
        this.score += bonus;

        this.emit({
          type: 'WAVE_COMPLETED',
          waveNumber: this.waveNumber,
          bonusScore: bonus,
          tick: this.currentTick,
        });

        this.isIntermission = true;
        this.intermissionCountdownTicks = Math.round(
          this.config.simulation.waveIntermissionSeconds * this.config.tickRate
        );
      }
    }
  }

  private triggerGameOver(outcome: 'defeat' | 'victory'): void {
    this.status = 'game-over';
    this.gameResult = this.compileResult(outcome);

    this.emit({
      type: 'GAME_OVER',
      result: this.gameResult,
      tick: this.currentTick,
    });
  }

  private compileResult(outcome: 'defeat' | 'victory'): GameResult {
    const accuracy = this.computeAccuracy();
    const durationMs = Math.round(
      (this.currentTick / this.config.tickRate) * 1000
    );
    const rating = this.evaluateRating(accuracy);

    return {
      outcome,
      score: this.score,
      wavesCompleted: Math.max(0, this.waveNumber - 1),
      maxStreak: this.maxStreak,
      accuracy,
      wordsCompleted: this.wordsCompleted,
      wpm: this.computeWpm(),
      durationMs,
      rating,
    };
  }

  // --------------------------------------------------------------------------
  // CALCULATIONS & HELPERS
  // --------------------------------------------------------------------------

  private computeAccuracy(): number {
    const total = this.hits + this.misses;
    if (total === 0) return 100;
    return Math.round((this.hits / total) * 100);
  }

  private computeWpm(): number {
    if (this.currentTick === 0) return 0;
    const elapsedMinutes = this.currentTick / (this.config.tickRate * 60);
    if (elapsedMinutes <= 0) return 0;
    const standardWords = this.hits / 5;
    return Math.round(standardWords / elapsedMinutes);
  }

  private computeMultiplier(streak: number): number {
    const thresholds = this.scoringRules.multiplierThresholds;
    let mult = 1;
    for (const t of thresholds) {
      if (streak >= t.streak) {
        mult = t.multiplier;
      }
    }
    return mult;
  }

  private evaluateRating(accuracy: number): PerformanceRating {
    const th: RatingThresholds = this.config.simulation.ratingThresholds;
    if (accuracy >= th.S) return 'S';
    if (accuracy >= th.A) return 'A';
    if (accuracy >= th.B) return 'B';
    if (accuracy >= th.C) return 'C';
    return 'D';
  }

  private squaredDist(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  private emit(event: GameEvent): void {
    this.eventQueue.push(event);
  }

  // --------------------------------------------------------------------------
  // PUBLIC INSPECTION APIS
  // --------------------------------------------------------------------------

  drainEvents(): GameEvent[] {
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }

  getResult(): GameResult | null {
    return this.gameResult ? { ...this.gameResult } : null;
  }

  getSnapshot(): GameSnapshot {
    const aliveEnemies = this.enemies
      .filter((e) => e.alive)
      .map((e) => ({
        id: e.id,
        type: e.type,
        position: { ...e.position },
        velocity: { ...e.velocity },
        word: e.word,
        remainingWord: e.remainingWord,
        health: e.health,
        maxHealth: e.maxHealth,
        alive: e.alive,
        spawnTick: e.spawnTick,
      }));

    const remainingWaveEnemies =
      Math.max(0, this.waveQuota - this.waveSpawnedCount) + aliveEnemies.length;

    const wave: WaveState = {
      waveNumber: this.waveNumber,
      totalEnemies: this.waveQuota,
      remainingEnemies: remainingWaveEnemies,
      spawnIntervalMs: Math.round(
        (this.getWaveSpawnIntervalTicks() / this.config.tickRate) * 1000
      ),
      isCompleted: this.isIntermission,
    };

    const scoring = {
      score: this.score,
      streak: this.streak,
      maxStreak: this.maxStreak,
      multiplier: this.multiplier,
      accuracy: this.computeAccuracy(),
      hits: this.hits,
      misses: this.misses,
      wordsCompleted: this.wordsCompleted,
      wpm: this.computeWpm(),
    };

    return {
      status: this.status,
      mode: this.mode,
      player: {
        position: { ...this.player.position },
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        alive: this.player.alive,
        isDamaged: this.player.isDamaged,
      },
      enemies: aliveEnemies,
      activeTargetId: this.activeTargetId,
      wave,
      scoring,
      elapsedTicks: this.currentTick,
    };
  }
}
