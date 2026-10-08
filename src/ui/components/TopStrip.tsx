import React from 'react';
import { HullPips } from './HullPips';
import { TacticalButton } from './TacticalButton';
import { ClockBadge } from './ClockBadge';
import { formatAccuracy, formatElapsed } from '@/shared/formatters';

export interface TopStripProps {
  wave: number;
  elapsedSeconds: number;
  accuracy: number;
  misses?: number;
  hull: number;
  maxHull?: number;
  onPause?: () => void;
  rightSlot?: React.ReactNode;
}

/**
 * TopStrip Component (Spec 5.B)
 * External HUD strip positioned above the canvas in row 1 of .game-shell.
 * Renders:
 * - Left: WAVE 0N, TIME mm:ss, ACCURACY 00.0% (tabular figures).
 * - Center: 3-pip Hull status with distinct active/depleted shapes.
 * - Right: PAUSE button and clock widget slot.
 */
export const TopStrip: React.FC<TopStripProps> = ({
  wave,
  elapsedSeconds,
  accuracy,
  misses = 0,
  hull,
  maxHull = 3,
  onPause,
  rightSlot,
}) => {
  const formattedWave = `WAVE ${String(wave).padStart(2, '0')}`;
  const formattedTime = `TIME ${formatElapsed(elapsedSeconds)}`;
  const formattedAccuracy = `ACCURACY ${formatAccuracy(accuracy, misses)}`;

  return (
    <header
      className="top-strip"
      style={{
        height: 'var(--top-strip-height, 46px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-condensed)',
        fontSize: '12px',
        letterSpacing: '0.08em',
        userSelect: 'none',
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Left Cluster: WAVE, TIME, ACCURACY */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>{formattedWave}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{formattedTime}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{formattedAccuracy}</span>
      </div>

      {/* Center Cluster: 3-pip Hull */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HullPips currentHealth={hull} maxHealth={maxHull} />
      </div>

      {/* Right Cluster: PAUSE button and clock / slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onPause && (
          <TacticalButton size="sm" variant="default" onClick={onPause}>
            PAUSE · ESC
          </TacticalButton>
        )}
        {rightSlot ?? <ClockBadge />}
      </div>
    </header>
  );
};
