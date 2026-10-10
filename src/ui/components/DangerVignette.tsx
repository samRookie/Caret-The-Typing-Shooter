import React from 'react';

export interface DangerVignetteProps {
  active: boolean;
  reducedMotion?: boolean;
}

export const DangerVignette: React.FC<DangerVignetteProps> = ({
  active,
}) => {
  if (!active) return null;

  return (
    <div
      className="danger-vignette-overlay"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
        mixBlendMode: 'screen',
      }}
    >
      {/* Outer spray/speckle vignette ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 60%, rgba(255, 30, 30, 0.12) 80%, rgba(255, 10, 10, 0.35) 94%, rgba(230, 5, 20, 0.55) 100%)',
          boxShadow:
            'inset 0 0 45px rgba(255, 20, 35, 0.4), inset 0 0 100px rgba(255, 10, 20, 0.25)',
          animation: 'dangerVignettePulse 1.4s ease-in-out infinite',
        }}
      />
    </div>
  );
};
