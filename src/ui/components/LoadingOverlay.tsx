import React from 'react';
import { TacticalFrame } from './TacticalFrame';
import { GAME_TITLE, GAME_SUBTITLE } from '@/shared/config/branding';

export interface LoadingOverlayProps {
  progress: number; // 0 to 100
  statusMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  progress = 0,
  statusMessage = 'SYNCHRONIZING TACTICAL ASSETS & SHADER BUFFERS...',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className="tactical-modal-backdrop"
      role="status"
      aria-live="polite"
      aria-label="Loading tactical simulation"
    >
      <TacticalFrame
        title="SYSTEM BOOTSTRAP"
        subtitle="INITIALIZING ENGINE"
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
              {GAME_TITLE}
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-condensed)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
              }}
            >
              {GAME_SUBTITLE}
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
                {clampedProgress}%
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={clampedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Asset preload progress"
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
                  width: `${clampedProgress}%`,
                  background:
                    'linear-gradient(90deg, var(--accent-dim), var(--accent-bright))',
                  boxShadow: '0 0 10px var(--accent)',
                  transition: 'width 0.15s ease-out',
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
        </div>
      </TacticalFrame>
    </div>
  );
};
