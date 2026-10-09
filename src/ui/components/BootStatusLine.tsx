import React, { useState, useEffect } from 'react';

// Module-level flag: true once boot status has ever mounted in this page session
let hasDisplayedBootStatusSession = false;

export function resetBootStatusSession(): void {
  hasDisplayedBootStatusSession = false;
}

export interface BootStatusLineProps {
  reducedMotion?: boolean;
}

export const BootStatusLine: React.FC<BootStatusLineProps> = ({
  reducedMotion = false,
}) => {
  const [shouldRender, setShouldRender] = useState<boolean>(() => {
    if (hasDisplayedBootStatusSession) return false;
    hasDisplayedBootStatusSession = true;
    return true;
  });

  const [opacity, setOpacity] = useState(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (!shouldRender) return;

    if (reducedMotion) {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // 1. Fade-in over 200ms
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 20);

    // 2. Hold until 2300ms, then fade-out over 200ms
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 2300);

    // 3. Unmount after 2500ms
    const unmountTimer = setTimeout(() => {
      setShouldRender(false);
    }, 2500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(unmountTimer);
    };
  }, [shouldRender, reducedMotion]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        color: 'var(--accent, #ffb84a)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        textAlign: 'center',
        padding: '4px 12px',
        marginBottom: '10px',
        background: 'rgba(255, 184, 74, 0.08)',
        border: '1px solid rgba(255, 184, 74, 0.25)',
        borderRadius: 'var(--radius-sm, 4px)',
        opacity,
        transition: reducedMotion ? 'none' : 'opacity 0.2s ease-in-out',
        userSelect: 'none',
      }}
    >
      SYSTEM ONLINE // READY · MODE: TACTICAL DEFENSE · STATUS: MENU
    </div>
  );
};
