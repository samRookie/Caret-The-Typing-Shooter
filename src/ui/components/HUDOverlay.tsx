import React from 'react';
import { MetricCard } from './MetricCard';
import { TacticalButton } from './TacticalButton';
import { TelemetryData } from '@/shared/types';

export interface HUDOverlayProps {
  telemetry: TelemetryData;
  onPause: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  telemetry,
  onPause,
  reducedMotion,
  onToggleReducedMotion,
}) => {
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
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <MetricCard label="SCORE" value={telemetry.score} variant="accent" />
          <MetricCard label="WAVE" value={`0${telemetry.wave}`} variant="default" />
          <MetricCard label="STREAK" value={telemetry.streak} variant="success" />
          <MetricCard
            label="MULTIPLIER"
            value={`${telemetry.multiplier}x`}
            variant="accent"
          />
          <MetricCard
            label="ACCURACY"
            value={`${telemetry.accuracy}%`}
            variant="default"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
        {telemetry.activeTarget && (
          <div
            style={{
              background: 'rgba(10, 14, 20, 0.85)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 14px',
              fontFamily: 'var(--font-condensed)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              color: 'var(--accent-bright)',
              boxShadow: 'var(--glow-subtle)',
              pointerEvents: 'auto',
            }}
          >
            TARGET LOCK // {telemetry.activeTarget}
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
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>HULL: 100%</span>
          <span>WEAPONS: READY</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>ENERGY CORE: 0xFFB84A</span>
          <span>LATENCY: 0ms</span>
        </div>
      </div>
    </div>
  );
};
