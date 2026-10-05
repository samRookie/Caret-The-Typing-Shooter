import React, { useState, useEffect, useRef } from 'react';
import './app.css';
import { PhaserContainer } from '@/ui/PhaserContainer';
import { TacticalFrame } from '@/ui/components/TacticalFrame';
import { TacticalButton } from '@/ui/components/TacticalButton';
import { HUDOverlay } from '@/ui/components/HUDOverlay';
import { LoadingOverlay } from '@/ui/components/LoadingOverlay';
import { PauseModal } from '@/ui/components/PauseModal';
import { GameOverModal } from '@/ui/components/GameOverModal';
import { TelemetryData } from '@/shared/types';
import { GameRuntime } from '@/game/controller/GameRuntime';
import { installDevCaretHook } from '@/game/controller/devCaretHook';
import { KeyboardAdapter } from '@/game/input/keyboardAdapter';
import { devIntentLog } from '@/game/input/devIntentLog';
import { DEFAULT_RUN_CONFIG, DIFFICULTY_PRESETS } from '@/shared/config/defaultConfig';
import { RunConfig } from '@/shared/domain';
import type { GameScene } from '@/game/scenes/GameScene';

// Gated strictly to dev mode: absent from production bundle
const DebugOverlay = import.meta.env.DEV
  ? React.lazy(() => import('@/ui/components/DebugOverlay'))
  : null;

export const App: React.FC = () => {
  // Gated dynamically in dev mode; in production import.meta.env.DEV is false
  const isPreview =
    Boolean(import.meta.env.DEV) &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === '1';

  const isDebug =
    Boolean(import.meta.env.DEV) &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1';

  const isAutostart =
    Boolean(import.meta.env.DEV) &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const seedParam =
    Boolean(import.meta.env.DEV) &&
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('seed')
      : null;

  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  // Runtime instantiation for ?autostart=1 in dev
  const [runtime] = useState<GameRuntime | null>(() => {
    if (isAutostart) {
      const parsedSeed = seedParam ? parseInt(seedParam, 10) : 1337;
      const seed = Number.isFinite(parsedSeed) ? parsedSeed : 1337;
      const config: RunConfig = {
        ...DEFAULT_RUN_CONFIG,
        seed,
        difficulty: DIFFICULTY_PRESETS.normal,
      };
      return new GameRuntime(config);
    }
    return null;
  });

  // Modal Preview States
  const [showLoading, setShowLoading] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Telemetry: in preview mode we provide mock telemetry for visual verification,
  // in normal/production mode we start with initial clean baseline state
  const [telemetry, setTelemetry] = useState<TelemetryData>(() =>
    isPreview
      ? {
          score: 1450,
          wave: 1,
          streak: 8,
          multiplier: 2,
          accuracy: 94,
          activeTarget: 'RECON',
          activeTargetTypedIndex: 2,
        }
      : {
          score: 0,
          wave: 1,
          streak: 0,
          multiplier: 1,
          accuracy: 100,
          activeTarget: null,
          activeTargetTypedIndex: 0,
        }
  );

  // Keyboard Adapter binding to GameRuntime input queue
  useEffect(() => {
    if (!runtime) return;

    let lastKey = '';
    const rawKeyTracker = (e: KeyboardEvent) => {
      lastKey = e.key;
    };
    window.addEventListener('keydown', rawKeyTracker, { capture: true });

    const adapter = new KeyboardAdapter({
      getState: () => ({ gameActive: runtime.status === 'running' }),
      onIntent: (intent, preventDefault) => {
        if (import.meta.env.DEV) {
          devIntentLog.record(lastKey || 'unknown', intent, preventDefault);
        }
      },
    });

    adapter.attach(runtime.inputQueue);

    return () => {
      window.removeEventListener('keydown', rawKeyTracker, { capture: true });
      adapter.detach();
    };
  }, [runtime]);

  // Install dev inspection hook strictly in DEV
  useEffect(() => {
    if (import.meta.env.DEV && runtime) {
      const unregister = installDevCaretHook(
        () => runtime,
        () => {
          const game = gameInstanceRef.current;
          return game?.scene?.getScene('GameScene') as GameScene | undefined;
        }
      );
      return unregister;
    }
  }, [runtime]);

  // Synchronize telemetry from live simulation
  useEffect(() => {
    if (!runtime || isPreview) return;

    const interval = setInterval(() => {
      const snapshot = runtime.getSnapshot();
      const activeTargetEnemy = snapshot.activeTargetId
        ? snapshot.enemies.find((e) => e.id === snapshot.activeTargetId)
        : null;

      const typedIndex = activeTargetEnemy
        ? activeTargetEnemy.word.length - activeTargetEnemy.remainingWord.length
        : 0;

      setTelemetry({
        score: snapshot.scoring.score,
        wave: snapshot.wave.waveNumber,
        streak: snapshot.scoring.streak,
        multiplier: snapshot.scoring.multiplier,
        accuracy: snapshot.scoring.accuracy,
        activeTarget: activeTargetEnemy ? activeTargetEnemy.word : null,
        activeTargetTypedIndex: typedIndex,
      });

      if (snapshot.status === 'game-over') {
        setShowGameOver(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [runtime, isPreview]);

  // Synchronize telemetry if preview mode changes
  useEffect(() => {
    if (isPreview) {
      setTelemetry({
        score: 1450,
        wave: 1,
        streak: 8,
        multiplier: 2,
        accuracy: 94,
        activeTarget: 'RECON',
        activeTargetTypedIndex: 2,
      });
    }
  }, [isPreview]);

  // Apply data-reduced-motion attribute to document root
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  const handleToggleReducedMotion = () => {
    setReducedMotion((prev) => !prev);
  };

  return (
    <div className="tactical-viewport">
      {/* Top Header: preview switchboard is strictly gated behind import.meta.env.DEV && isPreview */}
      {import.meta.env.DEV && isPreview ? (
        <TacticalFrame
          title="TACTICAL COMMAND HUD"
          subtitle="PREVIEW SWITCHBOARD [DEV ONLY]"
          style={{ padding: '8px 16px', flexShrink: 0 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginRight: '4px',
                }}
              >
                PREVIEW CONTROLS:
              </span>
              <TacticalButton
                size="sm"
                variant={showLoading ? 'primary' : 'default'}
                onClick={() => setShowLoading((prev) => !prev)}
              >
                {showLoading ? 'CLOSE LOADING' : 'PREVIEW LOADING'}
              </TacticalButton>

              <TacticalButton
                size="sm"
                variant={showPause ? 'primary' : 'default'}
                onClick={() => setShowPause((prev) => !prev)}
              >
                {showPause ? 'CLOSE PAUSE' : 'PREVIEW PAUSE'}
              </TacticalButton>

              <TacticalButton
                size="sm"
                variant={showGameOver ? 'primary' : 'default'}
                onClick={() => setShowGameOver((prev) => !prev)}
              >
                {showGameOver ? 'CLOSE GAME OVER' : 'PREVIEW GAME OVER'}
              </TacticalButton>
              <a
                href="/"
                style={{
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  textDecoration: 'underline',
                  marginLeft: '8px',
                }}
              >
                [BACK TO MAIN GAME]
              </a>
            </div>
          </div>
        </TacticalFrame>
      ) : (
        <TacticalFrame
          title="TACTICAL COMMAND CONSOLE"
          subtitle="SYSTEM ONLINE // READY"
          style={{ padding: '8px 16px', flexShrink: 0 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              fontFamily: 'var(--font-condensed)',
            }}
          >
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>MODE: </span>
                <span style={{ color: 'var(--text-primary)' }}>TACTICAL DEFENSE</span>
              </div>
              {Boolean(import.meta.env.DEV) && (
                <a
                  href="/?preview=1"
                  style={{
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    letterSpacing: '0.08em',
                    fontSize: '11px',
                  }}
                >
                  VIEW STEP 2 VISUAL PREVIEW &rarr;
                </a>
              )}
            </div>
          </div>
        </TacticalFrame>
      )}

      {/* Main Viewport Container */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          aspectRatio: '16 / 9',
          maxHeight: 'calc(100vh - 120px)',
          margin: '0 auto',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--bg-0)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        {/* Live Phaser Viewport */}
        <PhaserContainer
          runtime={runtime}
          onGameReady={(game) => {
            gameInstanceRef.current = game;
          }}
        />

        {/* Tactical HUD Overlay */}
        <HUDOverlay
          telemetry={telemetry}
          onPause={() => setShowPause(true)}
          reducedMotion={reducedMotion}
          onToggleReducedMotion={handleToggleReducedMotion}
        />

        {/* Modal Overlays for Previewing and Verification (DEV and preview=1 only) */}
        {import.meta.env.DEV && isPreview && showLoading && (
          <LoadingOverlay
            progress={78}
            statusMessage="ALLOCATING CANVAS BUFFERS // LOADING ORIGINAL SVGS"
            onDismiss={() => setShowLoading(false)}
          />
        )}

        {showPause && (
          <PauseModal
            onResume={() => setShowPause(false)}
            onRestart={() => {
              setShowPause(false);
              setTelemetry((t) => ({ ...t, score: 0, streak: 0 }));
            }}
            reducedMotion={reducedMotion}
            onToggleReducedMotion={handleToggleReducedMotion}
          />
        )}

        {import.meta.env.DEV && isPreview && showGameOver && (
          <GameOverModal
            score={telemetry.score}
            wave={telemetry.wave}
            streak={telemetry.streak}
            accuracy={telemetry.accuracy}
            onRestart={() => {
              setShowGameOver(false);
              setTelemetry({
                score: 0,
                wave: 1,
                streak: 0,
                multiplier: 1,
                accuracy: 100,
                activeTarget: 'DRONE',
                activeTargetTypedIndex: 0,
              });
            }}
          />
        )}

        {/* Step 7 Dev Visibility: Engine metrics and intent monitor (dev server only, ?debug=1) */}
        {import.meta.env.DEV && isDebug && DebugOverlay && (
          <React.Suspense fallback={null}>
            <DebugOverlay />
          </React.Suspense>
        )}
      </div>

      {/* Viewport Dimension & Status Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-condensed)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          padding: '0 4px',
          flexShrink: 0,
        }}
      >
        <span>TACTICAL RESOLUTION: ADAPTIVE [DESKTOP OPTIMIZED 1280×720 / 1440×900]</span>
        <span>DOMINANT ACCENT: ELECTRIC AMBER (#FFB84A) // ZERO RAINBOW GRADIENTS</span>
      </div>
    </div>
  );
};

export default App;
