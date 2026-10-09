import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  qualified?: boolean;
  unit?: string;
  qualificationHint?: string;
  variant?: 'default' | 'accent' | 'success';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  qualified = true,
  unit,
  qualificationHint,
  variant = 'default',
}) => {
  const displayValue = qualified ? value : '--';

  const getColor = () => {
    if (!qualified) return 'var(--text-muted, #556270)';
    switch (variant) {
      case 'accent':
        return 'var(--accent, #ffb84a)';
      case 'success':
        return 'var(--success, #50fa7b)';
      default:
        return 'var(--text-primary, #f3f7fa)';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '8px 10px',
        background: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid var(--border, rgba(255, 184, 74, 0.2))',
        borderRadius: 'var(--radius-sm, 4px)',
        minWidth: '85px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: '10px',
          color: 'var(--text-secondary, #8995a1)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '2px',
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '2px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display, Tektur)',
            fontSize: '16px',
            fontWeight: 700,
            color: getColor(),
            letterSpacing: '0.05em',
            lineHeight: 1.2,
          }}
        >
          {displayValue}
        </span>
        {unit && qualified && (
          <span
            style={{
              fontFamily: 'var(--font-condensed)',
              fontSize: '10px',
              color: 'var(--text-secondary, #8995a1)',
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {!qualified && qualificationHint && (
        <span
          style={{
            fontFamily: 'var(--font-condensed)',
            fontSize: '9px',
            color: 'var(--text-muted, #556270)',
            marginTop: '2px',
          }}
        >
          {qualificationHint}
        </span>
      )}
    </div>
  );
};
