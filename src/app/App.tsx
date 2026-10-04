import React, { useState, useEffect } from 'react';
import './app.css';
import { PhaserContainer } from '@/ui/PhaserContainer';
import { TacticalFrame } from '@/ui/components/TacticalFrame';
import { TacticalButton } from '@/ui/components/TacticalButton';
import { HUDOverlay } from '@/ui/components/HUDOverlay';
import { LoadingOverlay } from '@/ui/components/LoadingOverlay';
import { PauseModal } from '@/ui/components/PauseModal';
import { GameOverModal } from '@/ui/components/GameOverModal';
import { TelemetryData } from '@/shared/types';

export const App: React.FC = () => {
  // Modal Preview States
  const [showLoading, setShowLoading] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mock Telemetry for Step 2 visual validation (Zero gameplay coupling)
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    score: 1450,
    wave: 1,
    streak: 8,
    multiplier: 2,
    accuracy: 94,
    activeTarget: 'RECON',
  });

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
      {/* Top Tactical Switchboard (Preview & Accessibility Controls) */}
      <TacticalFrame
        title="TACTICAL COMMAND HUD"
        subtitle="PHASE 1 VISUAL FOUNDATION"
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
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <TacticalButton
              size="sm"
              variant={reducedMotion ? 'primary' : 'default'}
              onClick={handleToggleReducedMotion}
            >
              REDUCED MOTION: {reducedMotion ? 'ON' : 'OFF'}
            </TacticalButton>
          </div>
        </div>
      </TacticalFrame>

      {/* Main Viewport Container */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--bg-0)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        {/* Live Phaser Viewport */}
        <PhaserContainer />

        {/* Tactical HUD Overlay */}
        <HUDOverlay
          telemetry={telemetry}
          onPause={() => setShowPause(true)}
          reducedMotion={reducedMotion}
          onToggleReducedMotion={handleToggleReducedMotion}
        />

        {/* Modal Overlays for Previewing and Verification */}
        {showLoading && (
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

        {showGameOver && (
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
              });
            }}
          />
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
