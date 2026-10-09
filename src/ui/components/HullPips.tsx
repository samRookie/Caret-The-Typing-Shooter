import React, { useEffect, useRef, useState } from 'react';
import { useMotionPolicy } from '@/shared/motion';
import { feedbackBus } from '@/game/controller/FeedbackBus';

export interface HullPipsProps {
  currentHealth: number;
  maxHealth?: number;
}

/**
 * HullPips Component (Spec 5.B & Step 10)
 * Displays current ship integrity using 3 life pips.
 * - Active: Solid tactical diamond glyph with electric amber glow.
 * - Lost: Outlined slashed diamond glyph with danger tint.
 * - On pip-loss: Lost pip animates out (scale + outline change, 250ms).
 * - At 1 life left: The remaining pip receives a slow outline pulse (1.2s loop).
 * - Reduced motion: No animation; static thicker outline (thicker stroke).
 */
export const HullPips: React.FC<HullPipsProps> = ({ currentHealth, maxHealth = 3 }) => {
  const policy = useMotionPolicy();
  const safeHealth = Math.max(0, Math.min(maxHealth, Math.floor(currentHealth)));
  const pips = Array.from({ length: maxHealth }, (_, i) => i < safeHealth);

  const prevHealthRef = useRef(safeHealth);
  const [animatingLostIndex, setAnimatingLostIndex] = useState<number | null>(null);

  useEffect(() => {
    if (safeHealth < prevHealthRef.current) {
      // The pip that was just depleted
      const lostIndex = safeHealth;
      if (!policy.reduced) {
        setAnimatingLostIndex(lostIndex);
        const timer = setTimeout(() => {
          setAnimatingLostIndex(null);
        }, 250);
        return () => clearTimeout(timer);
      }
    }
    prevHealthRef.current = safeHealth;
  }, [safeHealth, policy.reduced]);

  // Subscribe to feedbackBus pip-loss signal for direct synchronization
  useEffect(() => {
    return feedbackBus.subscribe((signal) => {
      if (signal === 'pip-loss' && !policy.reduced) {
        // Animation handled reactively via safeHealth transition
      }
    });
  }, [policy.reduced]);

  const isLastLife = safeHealth === 1;

  return (
    <div
      role="status"
      aria-label={`Hull integrity: ${safeHealth} of ${maxHealth} pips`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 10px',
        background: 'rgba(10, 14, 20, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          color: 'var(--text-secondary)',
          marginRight: '2px',
        }}
      >
        HULL
      </span>
      {pips.map((active, index) => {
        const isPipLastLife = isLastLife && active && index === 0;
        const isLostAnimating = animatingLostIndex === index && !policy.reduced;

        return (
          <span
            key={index}
            data-pip-active={active ? 'true' : 'false'}
            data-pip-last-life={isPipLastLife ? 'true' : 'false'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
            }}
          >
            {active ? (
              /* Filled tactical diamond */
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                style={{
                  animation:
                    isPipLastLife && !policy.reduced
                      ? 'pipLastLifePulse 1.2s infinite ease-in-out'
                      : undefined,
                  transformOrigin: 'center',
                }}
              >
                <polygon
                  points="7,1 13,7 7,13 1,7"
                  fill="#ffd37a"
                  stroke="#ffb84a"
                  strokeWidth={isPipLastLife && policy.reduced ? '2.2' : '1.2'}
                />
                <circle cx="7" cy="7" r="1.5" fill="#ffffff" />
              </svg>
            ) : (
              /* Outlined slashed diamond */
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                style={{
                  animation: isLostAnimating ? 'pipLossAnim 250ms ease-out' : undefined,
                  transformOrigin: 'center',
                }}
              >
                <polygon
                  points="7,1 13,7 7,13 1,7"
                  fill="rgba(255, 95, 95, 0.08)"
                  stroke="#ff5f5f"
                  strokeWidth={policy.reduced ? '1.8' : '1.2'}
                  strokeDasharray="2.5 1.5"
                />
                <line
                  x1="3"
                  y1="3"
                  x2="11"
                  y2="11"
                  stroke="#ff5f5f"
                  strokeWidth={policy.reduced ? '1.8' : '1.2'}
                />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
};
