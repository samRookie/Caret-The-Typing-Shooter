import React from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';
import { MetricCard } from './MetricCard';

export interface GameOverModalProps {
  score: number;
  wave: number;
  streak: number;
  accuracy: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  wave,
  streak,
  accuracy,
  onRestart,
}) => {
  return (
    <div className="tactical-modal-backdrop">
      <TacticalFrame
        title="MISSION DEBRIEFING"
        subtitle="HULL INTEGRITY COMPROMISED"
        style={{
          width: '90%',
          maxWidth: '480px',
          padding: '24px',
          border: '1px solid rgba(255, 95, 95, 0.4)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Status */}
          <div style={{ textAlign: 'center' }}>
            <h2
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
            <p
              style={{
                fontFamily: 'var(--font-condensed)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              TACTICAL SIMULATION RECORD ARCHIVED
            </p>
          </div>

          {/* Performance Telemetry Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
            }}
          >
            <MetricCard label="FINAL SCORE" value={score} variant="accent" />
            <MetricCard label="WAVE REACHED" value={`0${wave}`} variant="default" />
            <MetricCard label="MAX STREAK" value={streak} variant="success" />
            <MetricCard label="ACCURACY" value={`${accuracy}%`} variant="default" />
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <TacticalButton
              variant="primary"
              size="lg"
              onClick={onRestart}
              style={{ width: '100%' }}
            >
              INITIALIZE NEW RUN
            </TacticalButton>
          </div>
        </div>
      </TacticalFrame>
    </div>
  );
};
