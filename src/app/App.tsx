import React, { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import './app.css';
import { PhaserContainer } from '@/ui/PhaserContainer';
import { TacticalButton } from '@/ui/components/TacticalButton';
import { TopStrip } from '@/ui/components/TopStrip';
import { ShipWingBoxes } from '@/ui/components/WingBox';
import { WaveBanner } from '@/ui/components/WaveBanner';
import { LoadingOverlay } from '@/ui/components/LoadingOverlay';
import { MenuScreen } from '@/ui/components/MenuScreen';
import { PauseModal } from '@/ui/components/PauseModal';
import { GameOverModal } from '@/ui/components/GameOverModal';
import { SettingsModal } from '@/ui/components/SettingsModal';
import { DangerVignette } from '@/ui/components/DangerVignette';
import { GameController } from '@/game/controller/GameController';
import { installDevCaretHook } from '@/game/controller/devCaretHook';
import { useHistory, historyStore } from '@/shared/history/historyStore';
import { evaluateRecords, RecordEvaluation } from '@/shared/history/statsMath';
import { buildRunRecord } from '@/app/history/buildRunRecord';
import { useSettings, settingsStore } from '@/shared/settings/settingsStore';
import type { GameScene } from '@/game/scenes/GameScene';
import { audioManager } from '@/game/rendering/audio/AudioManager';

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

  const historyRuns = useHistory();
  const settings = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<RecordEvaluation | null>(null);
  const [comparison, setComparison] = useState<{
    bestScore: number;
    bestWave: number;
    prevScore: number;
    prevWave: number;
  } | null>(null);
  const committedRunKeyRef = useRef<string | null>(null);

  // Modal Preview States for preview switchboard (DEV and preview=1 only)
  const [showPreviewLoading, setShowPreviewLoading] = useState(false);
  const [showPreviewPause, setShowPreviewPause] = useState(false);
  const [showPreviewGameOver, setShowPreviewGameOver] = useState(false);

  // Footer status note: briefly visible for 3 seconds on startup, then fades out completely
  const [showFooterNotes, setShowFooterNotes] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowFooterNotes(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

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

  // Audio context unlock and UI click sound delegation
  useEffect(() => {
    const handleFirstInteraction = () => {
      audioManager.unlock();
    };

    const handleClick = (e: MouseEvent) => {
      audioManager.unlock();
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, [role="button"]')) {
        audioManager.play('ui-click', { volume: 0.5 });
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Run-ID Deduplication & Record Evaluation Guard (Decision D13)
  useEffect(() => {
    if (
      (gameState.screen === 'game-over' || gameState.screen === 'game-over-pending') &&
      gameState.result
    ) {
      const runKey = `${gameState.seed}-${gameState.result.durationSeconds}-${gameState.result.score}-${gameState.result.hits}-${gameState.result.misses}`;
      if (committedRunKeyRef.current === runKey) {
        return;
      }
      committedRunKeyRef.current = runKey;

      const currentRuns = historyStore.load();
      const prevBestScore =
        currentRuns.length > 0 ? Math.max(...currentRuns.map((r) => r.score)) : 0;
      const prevBestWave =
        currentRuns.length > 0 ? Math.max(...currentRuns.map((r) => r.wave)) : 0;
      const prevRun =
        currentRuns.length > 0 ? currentRuns[currentRuns.length - 1] : null;

      const nextId = historyStore.getNextId();
      const endedAtIso = new Date().toISOString();
      const record = buildRunRecord(gameState.result, endedAtIso, nextId);

      const evalResult = evaluateRecords(currentRuns, record);
      setEvaluation(evalResult);
      setComparison({
        bestScore: Math.max(prevBestScore, record.score),
        bestWave: Math.max(prevBestWave, record.wave),
        prevScore: prevRun?.score ?? 0,
        prevWave: prevRun?.wave ?? 0,
      });

      historyStore.append(record);

      // Update local unverified best in settingsStore (Step 11 Spec)
      const currentHighScore = settingsStore.getSettings().highScore;
      if (!currentHighScore || record.score > currentHighScore.score) {
        settingsStore.updateSettings({
          highScore: {
            score: record.score,
            wave: record.wave,
          },
        });
      }
    } else if (gameState.screen === 'running') {
      committedRunKeyRef.current = null;
    }
  }, [gameState.screen, gameState.result, gameState.seed]);

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
          wave={isPreview ? 1 : gameState.hud.wave}
          elapsedSeconds={isPreview ? 45 : (gameState.hud.elapsedSeconds ?? 0)}
          accuracy={isPreview ? 94 : gameState.hud.accuracy}
          misses={gameState.hud.misses ?? 0}
          hull={gameState.hud.hull}
          maxHull={gameState.hud.maxHull}
          onPause={gameState.screen === 'running' ? () => controller.pause() : undefined}
          muted={settings.muted}
          onToggleMute={() => settingsStore.updateSettings({ muted: !settings.muted, sfxEnabled: settings.muted })}
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

        {/* Tactical Low-Health Danger Vignette (hull === 1) */}
        <DangerVignette
          active={gameState.screen === 'running' && gameState.hud.hull === 1}
        />

        {/* Tactical Wing Boxes (rendered during active or paused gameplay, or in preview mode) */}
        {(gameState.screen === 'running' ||
          gameState.screen === 'paused' ||
          (Boolean(import.meta.env.DEV) && isPreview)) && (
          <ShipWingBoxes
            streak={isPreview ? 8 : gameState.hud.streak}
            score={isPreview ? 1450 : gameState.hud.score}
          />
        )}

        {/* Tactical Wave Announcement Banner (Spec 5.G) */}
        {(gameState.screen === 'running' || gameState.screen === 'paused') && (
          <WaveBanner
            wave={gameState.hud.wave}
            visible={Boolean(gameState.hud.isIntermission)}
          />
        )}

        {/* Tactical Screens & Modals */}
        {gameState.screen === 'loading' && (
          <LoadingOverlay progress={gameState.loadingProgress} />
        )}

        {!isPreview && gameState.screen === 'menu' && (
          <MenuScreen
            onPlay={() => controller.start()}
            onOpenSettings={() => setIsSettingsOpen(true)}
            runs={historyRuns}
          />
        )}

        {gameState.screen === 'paused' && (
          <PauseModal
            onResume={() => controller.resume()}
            onRestart={() => controller.restart()}
            onQuitToMenu={() => controller.quitToMenu()}
            onOpenSettings={() => setIsSettingsOpen(true)}
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
            evaluation={evaluation}
            comparison={comparison}
            localBest={settings.highScore}
            runs={historyRuns}
            onRestart={() => controller.restart()}
            onQuitToMenu={() => controller.quitToMenu()}
          />
        )}

        {/* Tactical Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Modal Overlays for Previewing and Verification (DEV and preview=1 only) */}
        {import.meta.env.DEV && isPreview && showPreviewLoading && (
          <LoadingOverlay progress={78} />
        )}

        {import.meta.env.DEV && isPreview && showPreviewPause && (
          <PauseModal
            onResume={() => setShowPreviewPause(false)}
            onRestart={() => setShowPreviewPause(false)}
            onQuitToMenu={() => setShowPreviewPause(false)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {import.meta.env.DEV && isPreview && showPreviewGameOver && (
          <GameOverModal
            score={1450}
            wave={1}
            streak={8}
            accuracy={94}
            seed={1337}
            evaluation={{
              isFirstRun: false,
              isNewWaveRecord: false,
              isNewScoreRecord: true,
              previousBestWave: 1,
              previousBestScore: 1200,
            }}
            comparison={{
              bestScore: 1450,
              bestWave: 1,
              prevScore: 1100,
              prevWave: 1,
            }}
            runs={[
              { id: 1, endedAt: '', score: 500, wave: 1, maxStreak: 3, wordsDestroyed: 5, hits: 20, misses: 2, accuracy: 90.9, grossWpm: 25, netWpm: 22, durationSeconds: 45 },
              { id: 2, endedAt: '', score: 750, wave: 1, maxStreak: 4, wordsDestroyed: 7, hits: 30, misses: 1, accuracy: 96.7, grossWpm: 28, netWpm: 27, durationSeconds: 50 },
              { id: 3, endedAt: '', score: 900, wave: 1, maxStreak: 5, wordsDestroyed: 8, hits: 35, misses: 2, accuracy: 94.5, grossWpm: 30, netWpm: 28, durationSeconds: 55 },
              { id: 4, endedAt: '', score: 1100, wave: 1, maxStreak: 6, wordsDestroyed: 10, hits: 45, misses: 3, accuracy: 93.7, grossWpm: 32, netWpm: 29, durationSeconds: 60 },
              { id: 5, endedAt: '', score: 1450, wave: 1, maxStreak: 8, wordsDestroyed: 14, hits: 60, misses: 3, accuracy: 95.2, grossWpm: 35, netWpm: 33, durationSeconds: 70 },
            ]}
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

      {/* Viewport Dimension & Status Footer (briefly visible on startup, then fades out completely) */}
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
          opacity: showFooterNotes ? 1 : 0,
          visibility: showFooterNotes ? 'visible' : 'hidden',
          transition: 'opacity 0.8s ease-out, visibility 0.8s ease-out',
          pointerEvents: 'none',
        }}
      >
        <span>TACTICAL RESOLUTION: ADAPTIVE [DESKTOP OPTIMIZED 1280×720 / 1440×900]</span>
        <span>DOMINANT ACCENT: ELECTRIC AMBER (#FFB84A) // ZERO RAINBOW GRADIENTS</span>
      </div>
    </div>
  );
};

export default App;
