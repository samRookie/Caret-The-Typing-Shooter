import React from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface PauseModalProps {
  onResume: () => void;
  onRestart?: () => void;
  onQuitToMenu?: () => void;
  reducedMotion?: boolean;
  onToggleReducedMotion?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToMenu,
  reducedMotion = false,
  onToggleReducedMotion,
}) => {
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  return (
    <div
      className="tactical-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-dialog-title"
    >
      <div ref={trapRef} style={{ width: '90%', maxWidth: '440px' }}>
        <TacticalFrame
          title="TACTICAL PAUSE"
          subtitle="COMBAT THREAD SUSPENDED"
          style={{
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p
              id="pause-dialog-title"
              style={{
                fontFamily: 'var(--font-condensed)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.05em',
                lineHeight: 1.5,
                textAlign: 'center',
                margin: 0,
              }}
            >
              All hostile vector calculations are on hold. Adjust parameters or return to
              tactical command.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TacticalButton
                variant="primary"
                size="lg"
                onClick={onResume}
                data-autofocus="true"
              >
                RESUME ENGAGEMENT [ESC]
              </TacticalButton>

              {onRestart && (
                <TacticalButton variant="default" size="md" onClick={onRestart}>
                  RESTART RUN
                </TacticalButton>
              )}

              {onQuitToMenu && (
                <TacticalButton variant="default" size="md" onClick={onQuitToMenu}>
                  QUIT TO MENU
                </TacticalButton>
              )}

              {onToggleReducedMotion && (
                <TacticalButton
                  variant="default"
                  size="sm"
                  onClick={onToggleReducedMotion}
                  style={{
                    borderColor: reducedMotion ? 'var(--accent)' : 'var(--border)',
                    color: reducedMotion ? 'var(--accent-bright)' : 'var(--text-secondary)',
                    letterSpacing: '0.06em',
                  }}
                >
                  REDUCED MOTION [{reducedMotion ? 'ENABLED' : 'DISABLED'}]
                </TacticalButton>
              )}
            </div>
          </div>
        </TacticalFrame>
      </div>
    </div>
  );
};
