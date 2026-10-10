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
        zIndex: 40,
        mixBlendMode: 'screen',
      }}
    >
      {/* Outer spray/speckle vignette ring with full-bleed side coverage */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(255, 30, 30, 0.15) 70%, rgba(255, 10, 10, 0.45) 88%, rgba(230, 5, 20, 0.7) 100%)',
          boxShadow:
            'inset 0 0 60px rgba(255, 20, 35, 0.55), inset 0 0 120px rgba(255, 10, 20, 0.4), inset 120px 0 100px rgba(255, 10, 30, 0.5), inset -120px 0 100px rgba(255, 10, 30, 0.5)',
          animation: 'dangerVignettePulse 1.4s ease-in-out infinite',
        }}
      />
    </div>
  );
};
