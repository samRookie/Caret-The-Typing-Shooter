import React from 'react';

export interface HullPipsProps {
  currentHealth: number;
  maxHealth?: number;
}

/**
 * HullPips Component (Spec 5.B)
 * Displays current ship integrity using 3 life pips.
 * Filled and lost pips differ in both shape and color:
 * - Active: Solid tactical diamond glyph with electric amber glow.
 * - Lost: Outlined slashed diamond glyph with danger tint.
 */
export const HullPips: React.FC<HullPipsProps> = ({ currentHealth, maxHealth = 3 }) => {
  const safeHealth = Math.max(0, Math.min(maxHealth, Math.floor(currentHealth)));
  const pips = Array.from({ length: maxHealth }, (_, i) => i < safeHealth);

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
      {pips.map((active, index) => (
        <span
          key={index}
          data-pip-active={active ? 'true' : 'false'}
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <polygon
                points="7,1 13,7 7,13 1,7"
                fill="#ffd37a"
                stroke="#ffb84a"
                strokeWidth="1.2"
              />
              <circle cx="7" cy="7" r="1.5" fill="#ffffff" />
            </svg>
          ) : (
            /* Outlined slashed diamond */
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <polygon
                points="7,1 13,7 7,13 1,7"
                fill="rgba(255, 95, 95, 0.08)"
                stroke="#ff5f5f"
                strokeWidth="1.2"
                strokeDasharray="2.5 1.5"
              />
              <line x1="3" y1="3" x2="11" y2="11" stroke="#ff5f5f" strokeWidth="1.2" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
};
