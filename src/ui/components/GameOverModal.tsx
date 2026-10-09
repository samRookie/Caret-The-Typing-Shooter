import React from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';
import { MetricCard } from './MetricCard';
import { ClockBadge } from './ClockBadge';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { GameResult } from '@/shared/domain';

export interface GameOverModalProps {
  score: number;
  wave: number;
  streak: number;
  accuracy: number;
  result?: GameResult | null;
  seed?: number;
  onRestart: () => void;
  onQuitToMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  wave,
  streak,
  accuracy,
  result,
  seed,
  onRestart,
  onQuitToMenu,
}) => {
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  const displayWpm = result?.wpm ?? 0;
  const displayRating = result?.rating ?? 'C';
  const displaySeed = seed !== undefined ? seed : (result ? 1337 : 0);

  return (
    <div
      className="tactical-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-dialog-title"
    >
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <ClockBadge />
      </div>
      <div ref={trapRef} style={{ width: '90%', maxWidth: '520px' }}>
        <TacticalFrame
          title="MISSION DEBRIEFING"
          subtitle="HULL INTEGRITY COMPROMISED"
          style={{
            padding: '24px',
            border: '1px solid rgba(255, 95, 95, 0.4)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Header Status */}
            <div style={{ textAlign: 'center' }}>
              <h2
                id="game-over-dialog-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  color: 'var(--danger)',
                  letterSpacing: '0.12em',
                  marginBottom: '4px',
                }}
              >
                VESSEL DESTROYED
              </h2>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>SIMULATION SEED: <strong style={{ color: 'var(--accent)' }}>{displaySeed}</strong></span>
                <span>&bull;</span>
                <span>PERFORMANCE RANK: <strong style={{ color: 'var(--accent-bright)' }}>GRADE {displayRating}</strong></span>
              </div>
            </div>

            {/* Performance Telemetry Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              <MetricCard label="FINAL SCORE" value={score} variant="accent" />
              <MetricCard
                label="WAVE REACHED"
                value={String(wave).padStart(2, '0')}
                variant="default"
              />
              <MetricCard label="MAX STREAK" value={streak} variant="success" />
              <MetricCard label="ACCURACY" value={`${accuracy}%`} variant="default" />
              <MetricCard label="TYPING WPM" value={displayWpm} variant="accent" />
              <MetricCard label="RATING" value={displayRating} variant="success" />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <TacticalButton
                variant="primary"
                size="lg"
                onClick={onRestart}
                data-autofocus="true"
                style={{ width: '100%' }}
              >
                RESTART / INITIALIZE NEW RUN [ENTER]
              </TacticalButton>

              <TacticalButton
                variant="default"
                size="md"
                onClick={onQuitToMenu}
                style={{ width: '100%' }}
              >
                RETURN TO COMMAND MENU
              </TacticalButton>
            </div>
          </div>
        </TacticalFrame>
      </div>
    </div>
  );
};
