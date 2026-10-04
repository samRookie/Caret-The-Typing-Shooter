import React from 'react';
import { TacticalFrame } from './TacticalFrame';

export interface LoadingOverlayProps {
  progress?: number; // 0 to 100
  statusMessage?: string;
  onDismiss?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  progress = 85,
  statusMessage = 'SYNCHRONIZING TACTICAL TELEMETRY & ASSET BUFFERS...',
  onDismiss,
}) => {
  return (
    <div className="tactical-modal-backdrop">
      <TacticalFrame
        title="SYSTEM BOOTSTRAP"
        subtitle="VERIFYING PROTOCOLS"
        style={{
          width: '90%',
          maxWidth: '520px',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Logo / Header Mark */}
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                color: 'var(--accent-bright)',
                letterSpacing: '0.15em',
                marginBottom: '6px',
                textShadow: 'var(--glow-accent)',
              }}
            >
              FUTURISTIC TYPING SHOOTER
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-condensed)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
              }}
            >
              TACTICAL COMBAT CONSOLE // PHASE 1
            </p>
          </div>

          {/* Progress Bar Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-condensed)',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>BUFFER STATUS</span>
              <span style={{ color: 'var(--accent-bright)', fontWeight: 'bold' }}>
                {Math.round(progress)}%
              </span>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '8px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  background:
                    'linear-gradient(90deg, var(--accent-dim), var(--accent-bright))',
                  boxShadow: '0 0 10px var(--accent)',
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
          </div>

          {/* Status Message */}
          <div
            style={{
              fontFamily: 'var(--font-condensed)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              letterSpacing: '0.06em',
              textAlign: 'center',
            }}
          >
            {statusMessage}
          </div>

          {onDismiss && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
              <button
                className="tactical-button primary"
                onClick={onDismiss}
                style={{ width: '100%' }}
              >
                PROCEED TO CONSOLE
              </button>
            </div>
          )}
        </div>
      </TacticalFrame>
    </div>
  );
};
