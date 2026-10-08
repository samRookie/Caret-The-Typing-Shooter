import React from 'react';
import { computeWingBoxPositions } from '@/shared/geometry/viewportMath';
import { Vector2 } from '@/shared/domain';

export interface WingBoxProps {
  label: string;
  value: number | string;
  positionPercent: { leftPercent: number; topPercent: number };
  accentColor?: string;
  testId?: string;
}

/**
 * WingBox Component (Spec 5.D)
 * Tactical metric box positioned alongside the player ship's wings.
 * Scaled dynamically via CSS variable --u.
 */
export const WingBox: React.FC<WingBoxProps> = ({
  label,
  value,
  positionPercent,
  accentColor = 'var(--accent)',
  testId,
}) => {
  return (
    <div
      data-testid={testId}
      style={{
        position: 'absolute',
        left: `${positionPercent.leftPercent}%`,
        top: `${positionPercent.topPercent}%`,
        width: 'calc(84px * var(--u, 1))',
        height: 'calc(34px * var(--u, 1))',
        background: 'rgba(10, 14, 20, 0.75)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 20,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: 'calc(10px * var(--u, 1))',
          letterSpacing: '0.12em',
          color: 'var(--text-secondary)',
          lineHeight: 1,
          marginBottom: '2px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'calc(16px * var(--u, 1))',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: accentColor,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
};

export interface ShipWingBoxesProps {
  streak: number;
  score: number;
  playerPos?: Vector2;
}

/**
 * Pair of WingBoxes (Streak on Left Wing, Score on Right Wing).
 */
export const ShipWingBoxes: React.FC<ShipWingBoxesProps> = ({
  streak,
  score,
  playerPos,
}) => {
  const positions = computeWingBoxPositions(playerPos);

  return (
    <>
      <WingBox
        label="STREAK"
        value={streak}
        positionPercent={positions.streakBox}
        accentColor="var(--accent-bright)"
        testId="wing-streak-box"
      />
      <WingBox
        label="SCORE"
        value={score}
        positionPercent={positions.scoreBox}
        accentColor="var(--text-primary)"
        testId="wing-score-box"
      />
    </>
  );
};
