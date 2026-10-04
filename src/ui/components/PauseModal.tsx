import React from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';

export interface PauseModalProps {
  onResume: () => void;
  onRestart?: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  reducedMotion,
  onToggleReducedMotion,
}) => {
  return (
    <div className="tactical-modal-backdrop">
      <TacticalFrame
        title="TACTICAL PAUSE"
        subtitle="COMBAT THREAD SUSPENDED"
        style={{
          width: '90%',
          maxWidth: '440px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p
            style={{
              fontFamily: 'var(--font-condensed)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              letterSpacing: '0.05em',
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            All hostile vector calculations are on hold. Adjust parameters or return to
            tactical command.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <TacticalButton variant="primary" size="lg" onClick={onResume}>
              RESUME ENGAGEMENT
            </TacticalButton>

            {onRestart && (
              <TacticalButton variant="default" size="md" onClick={onRestart}>
                RESTART WAVE 1
              </TacticalButton>
            )}

            <TacticalButton
              variant="default"
              size="sm"
              onClick={onToggleReducedMotion}
              style={{
                borderColor: reducedMotion ? 'var(--accent)' : 'var(--border)',
                color: reducedMotion ? 'var(--accent-bright)' : 'var(--text-secondary)',
              }}
            >
              ACCESSIBILITY: REDUCED MOTION [{reducedMotion ? 'ENABLED' : 'DISABLED'}]
            </TacticalButton>
          </div>
        </div>
      </TacticalFrame>
    </div>
  );
};
