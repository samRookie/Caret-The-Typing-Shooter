import React, { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import './app.css';
import { PhaserContainer } from '@/ui/PhaserContainer';
import { TacticalButton } from '@/ui/components/TacticalButton';
import { TopStrip } from '@/ui/components/TopStrip';
import { HUDOverlay } from '@/ui/components/HUDOverlay';
import { LoadingOverlay } from '@/ui/components/LoadingOverlay';
import { MenuScreen } from '@/ui/components/MenuScreen';
import { PauseModal } from '@/ui/components/PauseModal';
import { GameOverModal } from '@/ui/components/GameOverModal';
import { GameController } from '@/game/controller/GameController';
import { installDevCaretHook } from '@/game/controller/devCaretHook';
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

  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  // Framework-free GameController instance
  const [controller] = useState<GameController>(() => {
    return new GameController({
      initialScreen: isPreview ? 'menu' : 'loading',
    });
  });

  // State synchronized with external store contract with stable callbacks
  const subscribe = useCallback(
    (callback: () => void) => controller.subscribe(callback),
    [controller]
  );
  const getSnapshot = useCallback(() => controller.getState(), [controller]);

  const gameState = useSyncExternalStore(subscribe, getSnapshot);

  const [reducedMotion, setReducedMotion] = useState(false);

  // Modal Preview States for preview switchboard (DEV and preview=1 only)
  const [showPreviewLoading, setShowPreviewLoading] = useState(false);
  const [showPreviewPause, setShowPreviewPause] = useState(false);
  const [showPreviewGameOver, setShowPreviewGameOver] = useState(false);

  // Cleanup controller on window unload
  useEffect(() => {
    const handleUnload = () => {
      controller.destroy();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [controller]);

  // Dev autostart: automatically start the simulation when autostart=1
  useEffect(() => {
    if (isAutostart && gameState.screen === 'menu') {
      controller.start();
    }
  }, [isAutostart, gameState.screen, controller]);

  // Install dev inspection hook strictly in DEV
  useEffect(() => {
    if (import.meta.env.DEV) {
      const unregister = installDevCaretHook(
        () => controller.runtime,
        () => {
          const game = gameInstanceRef.current;
          return game?.scene?.getScene('GameScene') as GameScene | undefined;
        }
      );
      return unregister;
    }
  }, [controller]);

  // Reduced motion toggle on document element
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

  const viewportRef = useRef<HTMLDivElement>(null);

  // ResizeObserver injecting --u = viewportWidthPx / 1280 (Spec 5.A)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const setScale = (width: number) => {
      const u = width / 1280;
      el.style.setProperty('--u', u.toString());
    };

    setScale(el.clientWidth || 1280);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setScale(entry.contentRect.width);
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="game-shell">
      {/* Dev-only preview switchboard (strictly gated behind import.meta.env.DEV && isPreview) */}
      {import.meta.env.DEV && isPreview && (
        <div
          style={{
            padding: '6px 16px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '11px',
            fontFamily: 'var(--font-condensed)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>PREVIEW SWITCHBOARD [DEV ONLY]</span>
            <span style={{ color: 'var(--accent)' }}>PREVIEW CONTROLS:</span>
            <TacticalButton
              size="sm"
              variant={showPreviewLoading ? 'primary' : 'default'}
              onClick={() => setShowPreviewLoading((prev) => !prev)}
            >
              {showPreviewLoading ? 'CLOSE LOADING' : 'PREVIEW LOADING'}
            </TacticalButton>
            <TacticalButton
              size="sm"
              variant={showPreviewPause ? 'primary' : 'default'}
              onClick={() => setShowPreviewPause((prev) => !prev)}
            >
              {showPreviewPause ? 'CLOSE PAUSE' : 'PREVIEW PAUSE'}
            </TacticalButton>
            <TacticalButton
              size="sm"
              variant={showPreviewGameOver ? 'primary' : 'default'}
              onClick={() => setShowPreviewGameOver((prev) => !prev)}
            >
              {showPreviewGameOver ? 'CLOSE GAME OVER' : 'PREVIEW GAME OVER'}
            </TacticalButton>
            <a
              href="/"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'underline',
                marginLeft: '8px',
              }}
            >
              [BACK TO MAIN GAME]
            </a>
          </div>
        </div>
      )}

      {/* Row 1: External Top Strip (rendered during gameplay or preview) */}
      {(gameState.screen === 'running' ||
        gameState.screen === 'paused' ||
        gameState.screen === 'game-over' ||
        (Boolean(import.meta.env.DEV) && isPreview)) && (
        <TopStrip
          wave={gameState.hud.wave}
          elapsedSeconds={gameState.hud.elapsedSeconds ?? 0}
          accuracy={gameState.hud.accuracy}
          misses={gameState.hud.misses ?? 0}
          hull={gameState.hud.hull}
          maxHull={gameState.hud.maxHull}
          onPause={gameState.screen === 'running' ? () => controller.pause() : undefined}
        />
      )}

      {/* Row 2: Tactical Viewport Area */}
      <div className="viewport-area">
        <div ref={viewportRef} className="viewport-container">
        {/* Live Phaser Viewport */}
        <PhaserContainer
          controller={controller}
          runtime={controller.runtime}
          onGameReady={(game) => {
            gameInstanceRef.current = game;
          }}
        />

        {/* Tactical HUD Overlay (rendered during active or paused gameplay, or in preview mode) */}
        {(gameState.screen === 'running' ||
          gameState.screen === 'paused' ||
          (Boolean(import.meta.env.DEV) && isPreview)) && (
          <HUDOverlay
            hud={gameState.hud}
            telemetry={
              isPreview
                ? {
                    score: 1450,
                    wave: 1,
                    streak: 8,
                    accuracy: 94,
                    activeTarget: 'RECON',
                    activeTargetTypedIndex: 2,
                  }
                : undefined
            }
            onPause={() => controller.pause()}
            reducedMotion={reducedMotion}
            onToggleReducedMotion={handleToggleReducedMotion}
          />
        )}

        {/* Tactical Screens & Modals */}
        {gameState.screen === 'loading' && (
          <LoadingOverlay progress={gameState.loadingProgress} />
        )}

        {!isPreview && gameState.screen === 'menu' && (
          <MenuScreen
            onPlay={() => controller.start()}
          />
        )}

        {gameState.screen === 'paused' && (
          <PauseModal
            onResume={() => controller.resume()}
            onRestart={() => controller.restart()}
            onQuitToMenu={() => controller.quitToMenu()}
            reducedMotion={reducedMotion}
            onToggleReducedMotion={handleToggleReducedMotion}
          />
        )}

        {gameState.screen === 'game-over' && (
          <GameOverModal
            score={gameState.hud.score}
            wave={gameState.hud.wave}
            streak={gameState.hud.streak}
            accuracy={gameState.hud.accuracy}
            result={gameState.result}
            seed={gameState.seed}
            onRestart={() => controller.restart()}
            onQuitToMenu={() => controller.quitToMenu()}
          />
        )}

        {/* Modal Overlays for Previewing and Verification (DEV and preview=1 only) */}
        {import.meta.env.DEV && isPreview && showPreviewLoading && (
          <LoadingOverlay progress={78} />
        )}

        {import.meta.env.DEV && isPreview && showPreviewPause && (
          <PauseModal
            onResume={() => setShowPreviewPause(false)}
            onRestart={() => setShowPreviewPause(false)}
            onQuitToMenu={() => setShowPreviewPause(false)}
            reducedMotion={reducedMotion}
            onToggleReducedMotion={handleToggleReducedMotion}
          />
        )}

        {import.meta.env.DEV && isPreview && showPreviewGameOver && (
          <GameOverModal
            score={1450}
            wave={1}
            streak={8}
            accuracy={94}
            seed={1337}
            onRestart={() => setShowPreviewGameOver(false)}
            onQuitToMenu={() => setShowPreviewGameOver(false)}
          />
        )}

        {/* Step 7 Dev Visibility: Engine metrics and intent monitor (dev server only, ?debug=1) */}
        {import.meta.env.DEV && isDebug && DebugOverlay && (
          <React.Suspense fallback={null}>
            <DebugOverlay />
          </React.Suspense>
        )}
        </div>
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
