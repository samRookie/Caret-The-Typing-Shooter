import React from 'react';
import { MetricCard } from './MetricCard';
import { TacticalButton } from './TacticalButton';
import { ActiveTargetReadout } from './ActiveTargetReadout';
import { HudState } from '@/game/controller/GameController';
import { TelemetryData } from '@/shared/types';

export interface HUDOverlayProps {
  hud?: HudState;
  telemetry?: TelemetryData;
  onPause: () => void;
  reducedMotion?: boolean;
  onToggleReducedMotion?: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  hud,
  telemetry,
  onPause,
  reducedMotion = false,
  onToggleReducedMotion,
}) => {
  const activeHud: HudState = hud ?? {
    score: telemetry?.score ?? 0,
    wave: telemetry?.wave ?? 1,
    streak: telemetry?.streak ?? 0,
    multiplier: telemetry?.multiplier ?? 1,
    accuracy: telemetry?.accuracy ?? 100,
    hull: 100,
    maxHull: 100,
    target: telemetry?.activeTarget
      ? {
          id: 'target',
          word: telemetry.activeTarget,
          remainingWord: telemetry.activeTarget.slice(telemetry.activeTargetTypedIndex ?? 0),
          typedIndex: telemetry.activeTargetTypedIndex ?? 0,
        }
      : null,
  };

  const hullRatio = activeHud.maxHull > 0 ? activeHud.hull / activeHud.maxHull : 0;
  const hullPercent = Math.min(100, Math.max(0, Math.round(hullRatio * 100)));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        zIndex: 10,
      }}
    >
      {/* Top HUD Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <MetricCard label="SCORE" value={activeHud.score} variant="accent" />
          <MetricCard
            label="WAVE"
            value={String(activeHud.wave).padStart(2, '0')}
            variant="default"
          />
          <MetricCard label="STREAK" value={activeHud.streak} variant="success" />
          <MetricCard
            label="MULTIPLIER"
            value={`${activeHud.multiplier}x`}
            variant="accent"
          />
          <MetricCard
            label="ACCURACY"
            value={`${activeHud.accuracy}%`}
            variant="default"
          />

          {/* Tactical Hull Progress Bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              minWidth: '130px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-condensed)',
                fontSize: '10px',
                letterSpacing: '0.1em',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>HULL INTEGRITY</span>
              <span
                style={{
                  color:
                    hullPercent <= 25
                      ? 'var(--danger)'
                      : hullPercent <= 50
                        ? '#e6a23c'
                        : 'var(--accent-bright)',
                  fontWeight: 'bold',
                }}
              >
                {activeHud.hull}/{activeHud.maxHull}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={activeHud.hull}
              aria-valuemin={0}
              aria-valuemax={activeHud.maxHull}
              aria-label="Hull integrity"
              style={{
                width: '100%',
                height: '7px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${hullPercent}%`,
                  background:
                    hullPercent <= 25
                      ? 'var(--danger)'
                      : hullPercent <= 50
                        ? '#e6a23c'
                        : 'linear-gradient(90deg, var(--accent-dim), var(--accent-bright))',
                  boxShadow:
                    hullPercent <= 25
                      ? '0 0 6px var(--danger)'
                      : '0 0 6px var(--accent)',
                  transition: 'width 0.2s ease-out',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onToggleReducedMotion && (
            <TacticalButton
              size="sm"
              onClick={onToggleReducedMotion}
              title="Toggle Reduced Motion Accessibility"
              style={{
                borderColor: reducedMotion ? 'var(--accent)' : 'var(--border)',
              }}
            >
              MOTION: {reducedMotion ? 'REDUCED' : 'NORMAL'}
            </TacticalButton>
          )}
          <TacticalButton size="sm" variant="default" onClick={onPause}>
            PAUSE [ESC]
          </TacticalButton>
        </div>
      </div>

      {/* Center Target Indicator HUD */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {activeHud.target && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              pointerEvents: 'auto',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-condensed)',
                fontSize: '11px',
                color: 'var(--accent)',
                letterSpacing: '0.14em',
              }}
            >
              TARGET LOCK
            </span>
            <ActiveTargetReadout
              word={activeHud.target.word}
              typedIndex={activeHud.target.typedIndex}
              isTargeted={true}
            />
          </div>
        )}
      </div>

      {/* Bottom Telemetry Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-condensed)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          letterSpacing: '0.08em',
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
};
