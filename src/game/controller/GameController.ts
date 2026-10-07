import {
  DifficultyPresetId,
  GameResult,
  GameSnapshot,
  RunConfig,
} from '@/shared/domain';
import {
  DEFAULT_RUN_CONFIG,
  DIFFICULTY_PRESETS,
} from '@/shared/config/defaultConfig';
import { GameRuntime, FrameResult } from './GameRuntime';
import { KeyboardAdapter } from '@/game/input/keyboardAdapter';

export type Screen = 'loading' | 'menu' | 'running' | 'paused' | 'game-over';

export interface HudTarget {
  readonly id: string;
  readonly word: string;
  readonly remainingWord: string;
  readonly typedIndex: number;
}

export interface HudState {
  readonly score: number;
  readonly wave: number;
  readonly streak: number;
  readonly accuracy: number;
  readonly hull: number;
  readonly maxHull: number;
  readonly target: HudTarget | null;
}

export interface AppGameState {
  readonly screen: Screen;
  readonly hud: HudState;
  readonly result: GameResult | null;
  readonly seed: number;
  readonly difficulty: DifficultyPresetId;
  readonly loadingProgress: number;
}

export interface GameControllerOptions {
  readonly initialScreen?: Screen;
  readonly defaultDifficulty?: DifficultyPresetId;
  readonly targetWindow?: Window | null;
  readonly targetDocument?: Document | null;
  readonly onSceneClear?: () => void;
}

export const INITIAL_HUD_STATE: HudState = {
  score: 0,
  wave: 1,
  streak: 0,
  accuracy: 100,
  hull: 100,
  maxHull: 100,
  target: null,
};

/**
 * Generates a random uint32 seed using crypto.getRandomValues in the controller.
 * Fallback to pseudo-random if crypto is unavailable.
 */
export function generateRandomSeed(targetWindow?: Window | null): number {
  const win = targetWindow ?? (typeof window !== 'undefined' ? window : null);
  const cryptoObj = win?.crypto ?? (typeof crypto !== 'undefined' ? crypto : null);
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    return buf[0]!;
  }
  return (Math.floor(Math.random() * 0xffffffff) >>> 0);
}

/**
 * Resolves seed: URL query param `?seed=` takes precedence; otherwise random uint32.
 */
export function resolveSeed(targetWindow?: Window | null, explicitSeed?: number): number {
  if (explicitSeed !== undefined && Number.isFinite(explicitSeed)) {
    return explicitSeed >>> 0;
  }

  const win = targetWindow ?? (typeof window !== 'undefined' ? window : null);
  if (win && win.location) {
    try {
      const params = new URLSearchParams(win.location.search);
      const seedParam = params.get('seed');
      if (seedParam !== null) {
        const parsed = parseInt(seedParam, 10);
        if (Number.isFinite(parsed)) {
          return parsed >>> 0;
        }
      }
    } catch {
      // In non-browser environments or malformed URLs
    }
  }

  return generateRandomSeed(win);
}

export function extractHudState(snapshot: GameSnapshot): HudState {
  const activeEnemy = snapshot.activeTargetId
    ? snapshot.enemies.find((e) => e.id === snapshot.activeTargetId)
    : null;

  const target: HudTarget | null = activeEnemy
    ? {
        id: activeEnemy.id,
        word: activeEnemy.word,
        remainingWord: activeEnemy.remainingWord,
        typedIndex: activeEnemy.word.length - activeEnemy.remainingWord.length,
      }
    : null;

  return {
    score: snapshot.scoring.score,
    wave: snapshot.wave.waveNumber,
    streak: snapshot.scoring.streak,
    accuracy: snapshot.scoring.accuracy,
    hull: snapshot.player.health,
    maxHull: snapshot.player.maxHealth,
    target,
  };
}

/**
 * Framework-free GameController coordinating React presentation,
 * deterministic GameRuntime, input handling, HUD throttle, and visibility safety.
 */
export class GameController {
  private _state: AppGameState;
  private readonly listeners = new Set<() => void>();
  private _runtime: GameRuntime | null = null;
  private keyboardAdapter: KeyboardAdapter | null = null;

  private readonly targetWindow: Window | null;
  private readonly targetDocument: Document | null;
  private onSceneClear?: () => void;

  private throttleTimerMs: number = 0;
  private destroyed: boolean = false;

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  private readonly boundVisibilityChange: () => void;
  private readonly boundBlur: () => void;

  constructor(options: GameControllerOptions = {}) {
    this.targetWindow =
      options.targetWindow !== undefined
        ? options.targetWindow
        : typeof window !== 'undefined'
          ? window
          : null;

    this.targetDocument =
      options.targetDocument !== undefined
        ? options.targetDocument
        : typeof document !== 'undefined'
          ? document
          : null;

    this.onSceneClear = options.onSceneClear;

    const initialDifficulty = options.defaultDifficulty ?? 'normal';
    const initialSeed = resolveSeed(this.targetWindow);

    this._state = {
      screen: options.initialScreen ?? 'loading',
      hud: INITIAL_HUD_STATE,
      result: null,
      seed: initialSeed,
      difficulty: initialDifficulty,
      loadingProgress: 0,
    };

    this.boundVisibilityChange = this.handleVisibilityChange.bind(this);
    this.boundBlur = this.handleBlur.bind(this);

    if (this.targetDocument) {
      this.targetDocument.addEventListener('visibilitychange', this.boundVisibilityChange);
    }
    if (this.targetWindow) {
      this.targetWindow.addEventListener('blur', this.boundBlur);
    }

    this.initKeyboardAdapter();
  }

  // --------------------------------------------------------------------------
  // INPUT & SCENE WIRING
  // --------------------------------------------------------------------------

  private initKeyboardAdapter(): void {
    this.keyboardAdapter = new KeyboardAdapter({
      getState: () => ({ gameActive: this._state.screen === 'running' }),
      targetWindow: this.targetWindow,
      onUIIntent: (action) => {
        if (action === 'pause-toggle') {
          if (this._state.screen === 'running') {
            this.pause();
          } else if (this._state.screen === 'paused') {
            this.resume();
          }
        }
      },
    });
  }

  setSceneClearCallback(callback: () => void): void {
    this.onSceneClear = callback;
  }

  get runtime(): GameRuntime | null {
    return this._runtime;
  }

  // --------------------------------------------------------------------------
  // EXTERNAL STORE CONTRACT (useSyncExternalStore)
  // --------------------------------------------------------------------------

  getState(): AppGameState {
    return this._state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(newState: AppGameState): void {
    this._state = newState;
    for (const listener of this.listeners) {
      listener();
    }
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE CONTROLS
  // --------------------------------------------------------------------------

  setLoadingProgress(progress: number): void {
    if (this._state.screen !== 'loading') return;
    this.emit({
      ...this._state,
      loadingProgress: Math.min(100, Math.max(0, progress)),
    });
  }

  setBootComplete(): void {
    if (this._state.screen === 'loading') {
      this.emit({
        ...this._state,
        screen: 'menu',
        loadingProgress: 100,
      });
    }
  }

  start(opts: { difficulty: DifficultyPresetId; seed?: number }): void {
    if (this.destroyed) return;

    const chosenDifficulty = opts.difficulty;
    const chosenSeed = resolveSeed(this.targetWindow, opts.seed);

    const config: RunConfig = {
      ...DEFAULT_RUN_CONFIG,
      seed: chosenSeed,
      difficulty: DIFFICULTY_PRESETS[chosenDifficulty],
    };

    // Create fresh runtime
    this._runtime = new GameRuntime(config);
    this.throttleTimerMs = 0;
    // Drain initial creation event (WAVE_STARTED) emitted during sim start
    this._runtime.simulation.drainEvents();

    // Attach keyboard adapter to input queue
    if (this.keyboardAdapter) {
      this.keyboardAdapter.attach(this._runtime.inputQueue);
    }

    const initialSnapshot = this._runtime.getSnapshot();
    const initialHud = extractHudState(initialSnapshot);

    this.emit({
      ...this._state,
      screen: 'running',
      difficulty: chosenDifficulty,
      seed: chosenSeed,
      hud: initialHud,
      result: null,
    });
  }

  pause(): void {
    if (this.destroyed || this._state.screen !== 'running' || !this._runtime) {
      return;
    }

    this._runtime.pause();
    this._runtime.stepper.reset();

    this.emit({
      ...this._state,
      screen: 'paused',
    });
  }

  resume(): void {
    if (this.destroyed || this._state.screen !== 'paused' || !this._runtime) {
      return;
    }

    this._runtime.resume();
    this._runtime.stepper.reset();

    this.emit({
      ...this._state,
      screen: 'running',
    });
  }

  restart(): void {
    if (this.destroyed) return;

    // Reset scene views if callback registered
    this.onSceneClear?.();

    // Re-start with existing difficulty and freshly resolved seed
    const chosenSeed = resolveSeed(this.targetWindow);
    const chosenDifficulty = this._state.difficulty;

    const config: RunConfig = {
      ...DEFAULT_RUN_CONFIG,
      seed: chosenSeed,
      difficulty: DIFFICULTY_PRESETS[chosenDifficulty],
    };

    this._runtime = new GameRuntime(config);
    this.throttleTimerMs = 0;
    this._runtime.simulation.drainEvents();

    if (this.keyboardAdapter) {
      this.keyboardAdapter.attach(this._runtime.inputQueue);
    }

    const initialSnapshot = this._runtime.getSnapshot();
    const initialHud = extractHudState(initialSnapshot);

    this.emit({
      ...this._state,
      screen: 'running',
      seed: chosenSeed,
      hud: initialHud,
      result: null,
    });
  }

  quitToMenu(): void {
    if (this.destroyed) return;

    if (this._runtime) {
      this._runtime.pause();
      this._runtime.stepper.reset();
    }
    if (this.keyboardAdapter) {
      this.keyboardAdapter.detach();
    }

    this.onSceneClear?.();

    this.emit({
      ...this._state,
      screen: 'menu',
      hud: INITIAL_HUD_STATE,
      result: null,
    });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.targetDocument) {
      this.targetDocument.removeEventListener('visibilitychange', this.boundVisibilityChange);
    }
    if (this.targetWindow) {
      this.targetWindow.removeEventListener('blur', this.boundBlur);
    }

    if (this.keyboardAdapter) {
      this.keyboardAdapter.detach();
      this.keyboardAdapter = null;
    }

    if (this._runtime) {
      this._runtime.pause();
      this._runtime = null;
    }

    this.listeners.clear();
  }

  // --------------------------------------------------------------------------
  // FRAME EXECUTION & THROTTLED HUD DISPATCH
  // --------------------------------------------------------------------------

  frame(deltaSeconds: number): FrameResult {
    if (!this._runtime || this._state.screen !== 'running') {
      const fallbackSnapshot: GameSnapshot = this._runtime?.getSnapshot() ?? {
        status: 'idle',
        mode: 'standard',
        player: {
          position: DEFAULT_RUN_CONFIG.playerStart,
          health: 100,
          maxHealth: 100,
          alive: true,
          isDamaged: false,
        },
        enemies: [],
        activeTargetId: null,
        wave: {
          waveNumber: 1,
          totalEnemies: 6,
          remainingEnemies: 6,
          spawnIntervalMs: 2400,
          isCompleted: false,
        },
        scoring: {
          score: 0,
          streak: 0,
          maxStreak: 0,
          accuracy: 100,
          hits: 0,
          misses: 0,
          wordsCompleted: 0,
          wpm: 0,
        },
        elapsedTicks: 0,
      };

      return {
        snapshot: fallbackSnapshot,
        events: [],
      };
    }

    const result = this._runtime.frame(deltaSeconds);
    const { snapshot, events } = result;

    if (snapshot.status === 'game-over') {
      const gameResult = this._runtime.simulation.getResult();
      const finalHud = extractHudState(snapshot);

      this.emit({
        ...this._state,
        screen: 'game-over',
        hud: finalHud,
        result: gameResult,
      });

      return result;
    }

    // Check for explicit gameplay events
    const hasGameplayEvent = events.some(
      (e) =>
        e.type.startsWith('INPUT_') ||
        e.type === 'ENEMY_DESTROYED' ||
        e.type.startsWith('WAVE_') ||
        e.type === 'PLAYER_DAMAGED'
    );

    this.throttleTimerMs += deltaSeconds * 1000;

    if (hasGameplayEvent || this.throttleTimerMs >= 100) {
      this.throttleTimerMs = 0;
      const updatedHud = extractHudState(snapshot);

      this.emit({
        ...this._state,
        hud: updatedHud,
      });
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // VISIBILITY & BLUR SAFETY
  // --------------------------------------------------------------------------

  private handleVisibilityChange(): void {
    if (this.targetDocument && this.targetDocument.hidden) {
      if (this._state.screen === 'running') {
        this.pause();
      }
    }
  }

  private handleBlur(): void {
    if (this._state.screen === 'running') {
      this.pause();
    }
  }
}
