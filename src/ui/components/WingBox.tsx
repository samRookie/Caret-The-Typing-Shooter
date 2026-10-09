import React, { useEffect, useRef, useState } from 'react';
import { computeWingBoxPositions } from '@/shared/geometry/viewportMath';
import { Vector2 } from '@/shared/domain';
import { feedbackBus } from '@/game/controller/FeedbackBus';
import { useMotionPolicy } from '@/shared/motion';

export interface WingBoxProps {
  label: string;
  value: number | string;
  positionPercent: { leftPercent: number; topPercent: number };
  accentColor?: string;
  testId?: string;
  isFlashing?: boolean;
}

/**
 * WingBox Component (Spec 5.D & Step 10)
 * Tactical metric box positioned alongside the player ship's wings.
 * Scaled dynamically via CSS variable --u.
 */
export const WingBox: React.FC<WingBoxProps> = ({
  label,
  value,
  positionPercent,
  accentColor = 'var(--accent)',
  testId,
  isFlashing = false,
}) => {
  const policy = useMotionPolicy();

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
        border: `1px solid ${isFlashing ? 'var(--danger, #ff5f5f)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 20,
        boxShadow:
          isFlashing && !policy.reduced
            ? '0 0 10px rgba(255, 95, 95, 0.7)'
            : '0 2px 8px rgba(0, 0, 0, 0.5)',
        transition: policy.reduced ? 'none' : 'border-color 150ms ease, box-shadow 150ms ease',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: 'calc(10px * var(--u, 1))',
          letterSpacing: '0.12em',
          color: isFlashing ? 'var(--danger, #ff5f5f)' : 'var(--text-secondary)',
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
          color: isFlashing ? 'var(--danger, #ff5f5f)' : accentColor,
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
 * StreakBox border flashes danger red for 150ms on mismatch.
 * ScoreBox never animates.
 */
export const ShipWingBoxes: React.FC<ShipWingBoxesProps> = ({
  streak,
  score,
  playerPos,
}) => {
  const positions = computeWingBoxPositions(playerPos);
  const [isMismatchFlashing, setIsMismatchFlashing] = useState(false);
  const flashTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return feedbackBus.subscribe((signal) => {
      if (signal === 'mismatch') {
        setIsMismatchFlashing(true);
        if (flashTimeoutRef.current !== null) {
          clearTimeout(flashTimeoutRef.current);
        }
        flashTimeoutRef.current = window.setTimeout(() => {
          setIsMismatchFlashing(false);
          flashTimeoutRef.current = null;
        }, 150);
      }
    });
  }, []);

  return (
    <>
      <WingBox
        label="STREAK"
        value={streak}
        positionPercent={positions.streakBox}
        accentColor="var(--accent-bright)"
        testId="wing-streak-box"
        isFlashing={isMismatchFlashing}
      />
      <WingBox
        label="SCORE"
        value={score}
        positionPercent={positions.scoreBox}
        accentColor="var(--text-primary)"
        testId="wing-score-box"
        isFlashing={false}
      />
    </>
  );
};
