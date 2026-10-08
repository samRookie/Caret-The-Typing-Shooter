import React from 'react';

export interface WaveBannerProps {
  wave: number;
  visible: boolean;
  reducedMotion?: boolean;
}

/**
 * WaveBanner Component (Spec 5.G)
 * Tactical intermission announcement banner displayed in the center of the viewport
 * between WAVE_INTERMISSION and WAVE_STARTED.
 */
export const WaveBanner: React.FC<WaveBannerProps> = ({
  wave,
  visible,
  reducedMotion = false,
}) => {
  const formattedWave = `WAVE ${String(wave).padStart(2, '0')}`;

  return (
    <div
      data-testid="wave-banner"
      role="alert"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '38%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(16px * var(--u, 1)) calc(36px * var(--u, 1))',
        background: 'rgba(10, 14, 20, 0.88)',
        border: '1px solid rgba(255, 184, 74, 0.4)',
        borderRadius: 'var(--radius-md, 6px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), 0 0 16px rgba(255, 184, 74, 0.15)',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 30,
        opacity: visible ? 1 : 0,
        transition: reducedMotion ? 'none' : 'opacity 0.25s ease-out',
        visibility: visible || !reducedMotion ? 'visible' : 'hidden',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'calc(36px * var(--u, 1))',
          fontWeight: 700,
          color: 'var(--accent-bright, #ffd37a)',
          letterSpacing: '0.15em',
          textShadow: 'var(--glow-accent, 0 0 12px rgba(255, 184, 74, 0.5))',
          lineHeight: 1.1,
          marginBottom: 'calc(6px * var(--u, 1))',
        }}
      >
        {formattedWave}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: 'calc(12px * var(--u, 1))',
          letterSpacing: '0.16em',
          color: 'var(--text-secondary, #a0aab8)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        INCOMING HOSTILE WAVE DETECTED
      </span>
    </div>
  );
};
